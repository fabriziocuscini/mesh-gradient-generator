import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const GRADIENTS = [
  "Sharp Bézier",
  "Soft Bézier",
  "Mesh Static",
  "Mesh Grid",
  "Simple",
];

const WARPS = [
  "Simplex Noise",
  "Circular",
  "Value Noise",
  "Worley Noise",
  "FBM Noise",
  "Voronoi Noise",
  "Domain Warping",
  "Waves",
  "Smooth Noise",
  "Oval",
  "Rows",
  "Columns",
  "Flat",
  "Gravity",
];

/** A cheap fingerprint of what the shader actually drew. */
function canvasFingerprint(page: Page) {
  return page.evaluate(() =>
    document.querySelector("canvas")!.toDataURL().slice(-160),
  );
}

/** Row fields only: the picker's own hex input lives in a Base UI portal. */
function rowHexes(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('input[aria-label="Hex colour"]')]
      .filter((i) => !i.closest("[data-base-ui-portal]"))
      .map((i) => (i as HTMLInputElement).value),
  );
}

function warpReadout(page: Page) {
  return page.evaluate(() => {
    const label = [...document.querySelectorAll("span")].find(
      (s) => s.textContent === "Warp",
    );
    return label?.nextElementSibling?.textContent ?? null;
  });
}

async function chooseOption(page: Page, select: string, option: string) {
  await page.getByLabel(select, { exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Mesh Gradient")).toBeVisible();
  await page.waitForTimeout(400);
});

test("paints a gradient on load", async ({ page }) => {
  await expect(page.locator("canvas").first()).toBeVisible();
  const painted = await page.evaluate(() => {
    const c = document.querySelector("canvas")!;
    const url = c.toDataURL();
    // A blank canvas encodes to a very short data URL.
    return { size: url.length, w: c.width, h: c.height };
  });
  expect(painted.w).toBeGreaterThan(0);
  expect(painted.size).toBeGreaterThan(5000);
});

test("every gradient type renders differently", async ({ page }) => {
  const seen = new Map<string, string>();
  for (const name of GRADIENTS) {
    await chooseOption(page, "Gradient", name);
    await page.waitForTimeout(250);
    await expect(page.getByLabel("Gradient", { exact: true })).toHaveText(name);
    seen.set(name, await canvasFingerprint(page));
  }
  // Ids are shader ids in a non-index order, so a mix-up shows up here as the
  // right label over the wrong render.
  expect(new Set(seen.values()).size).toBe(GRADIENTS.length);
});

test("every warp shape renders differently", async ({ page }) => {
  const seen = new Set<string>();
  for (const name of WARPS) {
    await chooseOption(page, "Warp Shape", name);
    await page.waitForTimeout(220);
    seen.add(await canvasFingerprint(page));
  }
  expect(seen.size).toBe(WARPS.length);
});

test("a slider drag is one undo step, and the thumb resets on double-click", async ({
  page,
}) => {
  await expect(await warpReadout(page)).toBe("0.4");
  const thumb = page.locator("input[type=range]").first().locator("xpath=..");
  const box = (await thumb.boundingBox())!;

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  for (const dx of [20, 40, 60, 80]) {
    await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2, {
      steps: 4,
    });
  }
  await page.mouse.up();
  expect(await warpReadout(page)).not.toBe("0.4");

  // One undo, not one per tick.
  await page.keyboard.press("ControlOrMeta+z");
  await expect.poll(() => warpReadout(page)).toBe("0.4");

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  expect(await warpReadout(page)).not.toBe("0.4");

  const again = (await page
    .locator("input[type=range]")
    .first()
    .locator("xpath=..")
    .boundingBox())!;
  await page.mouse.dblclick(
    again.x + again.width / 2,
    again.y + again.height / 2,
  );
  await expect.poll(() => warpReadout(page)).toBe("0.4");
});

test("export fields clamp, and the format select reveals quality", async ({
  page,
}) => {
  const width = page.getByLabel("Export width");
  for (const [typed, expected] of [
    ["50", "100"],
    ["99999", "7,680"],
    ["2560", "2,560"],
  ]) {
    await width.click({ clickCount: 3 });
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type(typed);
    await page.keyboard.press("Enter");
    await expect(width).toHaveValue(expected);
  }

  await expect(page.getByText("Quality")).toHaveCount(0);
  await chooseOption(page, "Format", "JPEG");
  await expect(page.getByText("Quality")).toHaveCount(1);
  await expect(page.getByRole("button", { name: /Download/ })).toHaveText(
    /Download JPEG/,
  );
});

test("colours can be typed, added, removed and reordered", async ({ page }) => {
  const before = await rowHexes(page);
  expect(before.length).toBeGreaterThanOrEqual(2);

  const first = page.getByLabel("Hex colour").first();
  await first.click({ clickCount: 3 });
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("FF0000");
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await rowHexes(page))[0]).toBe("FF0000");

  // Drive these off the row count, not off whether a button is on screen:
  // rows leave through an exit animation, so a count() taken a moment before
  // a click() can name a button that has already gone.
  const rowCount = async () => (await rowHexes(page)).length;

  for (let guard = 0; (await rowCount()) < 10 && guard < 12; guard++) {
    const n = await rowCount();
    await page.getByRole("button", { name: "Add color" }).click();
    await expect.poll(rowCount).toBe(n + 1);
  }
  expect(await rowCount()).toBe(10);
  await expect(page.getByRole("button", { name: "Add color" })).toHaveCount(0);

  for (let guard = 0; (await rowCount()) > 2 && guard < 12; guard++) {
    const n = await rowCount();
    await page.getByRole("button", { name: "Remove color" }).first().click();
    await expect.poll(rowCount).toBe(n - 1);
  }
  expect(await rowCount()).toBe(2);
  await expect(page.getByRole("button", { name: "Remove color" })).toHaveCount(
    0,
  );

  await page.getByRole("button", { name: "Add color" }).click();
  await expect.poll(rowCount).toBe(3);
  await page.getByRole("button", { name: "Add color" }).click();
  await expect.poll(rowCount).toBe(4);

  const preDrag = await rowHexes(page);
  const rows = page.locator('input[aria-label="Hex colour"]');
  const target = (await rows.nth(0).boundingBox())!;
  await rows.nth(3).hover();
  const grip = (await page
    .locator('[aria-label="Drag to reorder"]')
    .nth(3)
    .boundingBox())!;
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
  await page.mouse.down();
  await page.mouse.move(grip.x + grip.width / 2, grip.y - 10, { steps: 6 });
  await page.mouse.move(grip.x + grip.width / 2, target.y + 3, { steps: 14 });
  await page.mouse.up();

  await expect.poll(async () => (await rowHexes(page))[0]).toBe(preDrag[3]);
  expect([...(await rowHexes(page))].sort()).toEqual([...preDrag].sort());
});

test("the colour picker opens from the chit and edits in place", async ({
  page,
}) => {
  const chits = page.getByRole("button", { name: "Edit colour" });
  await chits.last().click();

  const popup = page.locator("[data-base-ui-portal] .react-colorful");
  await expect(popup).toBeVisible();
  // Focus lands on the hex field with its value selected, so typing replaces.
  await page.keyboard.type("00FF00");
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await rowHexes(page)).at(-1)).toBe("00FF00");
});

test("sections collapse and expand", async ({ page }) => {
  const effects = page.getByRole("button", { name: "Effects", exact: true });
  await expect(page.locator("input[type=range]")).toHaveCount(3);
  await effects.click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          [...document.querySelectorAll("input[type=range]")].filter(
            (i) => (i as HTMLElement).offsetParent !== null,
          ).length,
      ),
    )
    .toBe(0);
  await effects.click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          [...document.querySelectorAll("input[type=range]")].filter(
            (i) => (i as HTMLElement).offsetParent !== null,
          ).length,
      ),
    )
    .toBe(3);
});

test("keyboard shortcuts work, and stop at a text field", async ({ page }) => {
  const theme = () =>
    page.evaluate(() => document.documentElement.className.trim());

  await page.mouse.click(300, 400);
  const started = await theme();
  await page.keyboard.press("d");
  await expect.poll(theme).not.toBe(started);
  await page.keyboard.press("d");
  await expect.poll(theme).toBe(started);

  const before = await canvasFingerprint(page);
  await page.keyboard.press("r");
  await expect.poll(() => canvasFingerprint(page)).not.toBe(before);

  const afterPalette = await canvasFingerprint(page);
  await page.keyboard.press("Space");
  await expect.poll(() => canvasFingerprint(page)).not.toBe(afterPalette);

  // Inside a field the same keys must be inert.
  const hex = page.getByLabel("Hex colour").first();
  await hex.click({ clickCount: 3 });
  const themeBefore = await theme();
  await page.keyboard.press("d");
  await page.waitForTimeout(250);
  expect(await theme()).toBe(themeBefore);
});

test("the image dialog extracts a palette", async ({ page }) => {
  await page.getByRole("button", { name: "Upload image" }).click();
  await expect(page.getByText("upload a photo")).toBeVisible();

  // Five flat bands, so the extracted palette is predictable.
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 400;
    c.height = 300;
    const x = c.getContext("2d")!;
    ["#e23b3b", "#2f7fd8", "#3fae5a", "#f0c419", "#7b3fa0"].forEach(
      (col, i) => {
        x.fillStyle = col;
        x.fillRect(i * 80, 0, 80, 300);
      },
    );
    return c.toDataURL("image/png").split(",")[1];
  });
  await page.locator("input[type=file]").setInputFiles({
    name: "bands.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });

  await expect(page.locator('img[alt="Uploaded"]')).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();

  // Poll: loading a palette replaces every row, and the outgoing ones stay in
  // the DOM for their 150ms exit animation, so a count taken straight after
  // the click sees the old list and the new one at once.
  await expect.poll(async () => (await rowHexes(page)).length).toBe(5);
  const after = await rowHexes(page);
  // k-means runs a fixed 10 iterations, so a cluster can settle between two
  // bands. A majority landing exactly on the source colours is enough to show
  // the palette really came from the image.
  const bands = ["E23B3B", "2F7FD8", "3FAE5A", "F0C419", "7B3FA0"];
  expect(
    after.filter((hex) => bands.includes(hex)).length,
  ).toBeGreaterThanOrEqual(3);

  await page.getByRole("button", { name: "Upload image" }).click();
  await expect(page.getByText("upload a photo")).toBeVisible();
});

test("downloads a PNG at the requested size", async ({ page }) => {
  const width = page.getByLabel("Export width");
  await width.click({ clickCount: 3 });
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("640");
  await page.keyboard.press("Enter");

  const height = page.getByLabel("Export height");
  await height.click({ clickCount: 3 });
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("480");
  await page.keyboard.press("Enter");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Download/ }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("mesh-gradient-640x480.png");

  const path = await download.path();
  const buf = readFileSync(path);
  // PNG IHDR: width and height are big-endian uint32 at bytes 16 and 20.
  expect(buf.readUInt32BE(16)).toBe(640);
  expect(buf.readUInt32BE(20)).toBe(480);
});
