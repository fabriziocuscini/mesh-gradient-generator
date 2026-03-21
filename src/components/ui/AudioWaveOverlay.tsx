import { useEffect, useRef } from "react";
import { clapAnalyserRef } from "@/hooks/useClapDetector";

export function AudioWaveOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const bufRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const analyser = clapAnalyserRef.current;
      const { width: cssW, height: cssH } =
        canvas.parentElement!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(cssW * dpr);
      const h = Math.round(cssH * dpr);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);

      if (!analyser) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufLen = analyser.fftSize;
      if (!bufRef.current || bufRef.current.length !== bufLen) {
        bufRef.current = new Uint8Array(bufLen);
      }
      const buf = bufRef.current;
      analyser.getByteTimeDomainData(buf);

      const sliceWidth = w / bufLen;
      const midY = h / 2;

      ctx.beginPath();
      ctx.lineWidth = 1.5 * dpr;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      let x = 0;
      for (let i = 0; i < bufLen; i++) {
        const v = (buf[i] - 128) / 128;
        const y = midY + v * midY * 0.85;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.stroke();
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
