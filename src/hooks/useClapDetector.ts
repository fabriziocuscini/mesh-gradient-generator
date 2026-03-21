import { useCallback, useEffect, useRef, useState } from "react";

const AudioCtx =
  typeof window !== "undefined"
    ? (window.AudioContext ??
      (window as never as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)
    : undefined;

export const isWebAudioSupported = !!AudioCtx;

export const clapAnalyserRef: { current: AnalyserNode | null } = {
  current: null,
};

interface UseClapDetectorOptions {
  onClap: () => void;
  enabled?: boolean;
  sensitivity?: number;
  cooldownMs?: number;
}

interface UseClapDetectorReturn {
  isListening: boolean;
  hasPermission: boolean | null;
  requestPermission: () => Promise<void>;
  stop: () => void;
}

const FFT_SIZE = 2048;
const SMOOTHING = 0.3;
const BASELINE_WINDOW = 30;
const DEFAULT_SENSITIVITY = 3.5;
const DEFAULT_COOLDOWN_MS = 600;
const SPECTRAL_FLATNESS_THRESHOLD = 0.4;

export function useClapDetector({
  onClap,
  enabled = true,
  sensitivity = DEFAULT_SENSITIVITY,
  cooldownMs = DEFAULT_COOLDOWN_MS,
}: UseClapDetectorOptions): UseClapDetectorReturn {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const onClapRef = useRef(onClap);
  useEffect(() => {
    onClapRef.current = onClap;
  }, [onClap]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastClapRef = useRef<number>(0);

  const timeDomainBuf = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const freqBuf = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const baselineHistory = useRef<number[]>([]);

  const stopStream = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    clapAnalyserRef.current = null;
    analyserRef.current = null;
    setIsListening(false);
  }, []);

  const startDetection = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufLen = analyser.fftSize;
    const freqBinCount = analyser.frequencyBinCount;

    if (!timeDomainBuf.current || timeDomainBuf.current.length !== bufLen) {
      timeDomainBuf.current = new Uint8Array(bufLen);
    }
    if (!freqBuf.current || freqBuf.current.length !== freqBinCount) {
      freqBuf.current = new Uint8Array(freqBinCount);
    }

    const tdBuf = timeDomainBuf.current;
    const fBuf = freqBuf.current;

    const detect = () => {
      analyser.getByteTimeDomainData(tdBuf);
      analyser.getByteFrequencyData(fBuf);

      let sumSq = 0;
      for (let i = 0; i < tdBuf.length; i++) {
        const v = (tdBuf[i] - 128) / 128;
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / tdBuf.length);

      const history = baselineHistory.current;
      history.push(rms);
      if (history.length > BASELINE_WINDOW) history.shift();

      let baselineSum = 0;
      for (let i = 0; i < history.length; i++) baselineSum += history[i];
      const baseline = baselineSum / history.length;

      if (rms > baseline * sensitivity && rms > 0.02) {
        let logSum = 0;
        let linSum = 0;
        let validBins = 0;
        for (let i = 0; i < fBuf.length; i++) {
          const val = fBuf[i] / 255;
          if (val > 0) {
            logSum += Math.log(val);
            validBins++;
          }
          linSum += val;
        }

        if (validBins > 0 && linSum > 0) {
          const geometricMean = Math.exp(logSum / validBins);
          const arithmeticMean = linSum / fBuf.length;
          const flatness = geometricMean / arithmeticMean;

          if (flatness >= SPECTRAL_FLATNESS_THRESHOLD) {
            const now = performance.now();
            if (now - lastClapRef.current > cooldownMs) {
              lastClapRef.current = now;
              onClapRef.current();
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);
    setIsListening(true);
  }, [sensitivity, cooldownMs]);

  const requestPermission = useCallback(async () => {
    if (!AudioCtx) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = SMOOTHING;
      source.connect(analyser);

      sourceRef.current = source;
      analyserRef.current = analyser;
      clapAnalyserRef.current = analyser;
      baselineHistory.current = [];

      setHasPermission(true);
      startDetection();
    } catch {
      setHasPermission(false);
      setIsListening(false);
    }
  }, [startDetection]);

  useEffect(() => {
    if (!enabled) return;

    if (hasPermission && audioCtxRef.current && streamRef.current) {
      const ctx = audioCtxRef.current;
      const ready =
        ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
      ready.then(() => {
        if (analyserRef.current) {
          clapAnalyserRef.current = analyserRef.current;
          startDetection();
        }
      });
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "running") {
        audioCtxRef.current.suspend();
      }
      clapAnalyserRef.current = null;
      setIsListening(false);
    };
  }, [enabled, hasPermission, startDetection]);

  useEffect(() => {
    return () => {
      stopStream();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [stopStream]);

  const stop = useCallback(() => {
    stopStream();
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    baselineHistory.current = [];
  }, [stopStream]);

  return { isListening, hasPermission, requestPermission, stop };
}
