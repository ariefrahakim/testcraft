import type { Page } from "@playwright/test";

/**
 * The full-HD recording frame used by the video recorder — `use.video.size` in
 * `playwright.config.ts` matches this so every recording is 1920×1080 regardless
 * of the emulated device size.
 */
export const RECORDING_FRAME = { width: 1920, height: 1080 } as const;

/**
 * Emulate a smaller (typically mobile) viewport **centered** inside the
 * full-HD recording frame. The browser render surface stays at 1920×1080 — so
 * the video keeps its full-HD size — while Chrome renders the app at the
 * requested `size` in the middle of that surface, with a letterbox around it.
 *
 * Uses CDP `Emulation.setDeviceMetricsOverride` (the same call Chrome DevTools
 * uses when you toggle the device toolbar). `positionX/positionY` shift the
 * emulated page inside the outer render surface so it is visually centered in
 * the recording. `mobile: true` + `deviceScaleFactor: 2` also flip MUI's
 * `useMediaQuery` mobile branches on, matching what a real phone would show.
 *
 * Prefer this over `page.setViewportSize({ width, height })` for anything
 * smaller than the recording frame — the plain viewport call anchors the
 * render to the top-left corner, leaving a black L-shaped bar on the right
 * and bottom of the video.
 */
export async function emulateMobileCentered(
  page: Page,
  size: { width: number; height: number },
): Promise<void> {
  // Make sure the outer render surface is the full recording frame — a
  // preceding test may have shrunk it.
  const currentViewport = page.viewportSize();
  if (
    !currentViewport ||
    currentViewport.width !== RECORDING_FRAME.width ||
    currentViewport.height !== RECORDING_FRAME.height
  ) {
    await page.setViewportSize({
      width: RECORDING_FRAME.width,
      height: RECORDING_FRAME.height,
    });
  }

  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: size.width,
    height: size.height,
    deviceScaleFactor: 2,
    mobile: true,
    screenWidth: RECORDING_FRAME.width,
    screenHeight: RECORDING_FRAME.height,
    positionX: Math.floor((RECORDING_FRAME.width - size.width) / 2),
    positionY: Math.floor((RECORDING_FRAME.height - size.height) / 2),
    dontSetVisibleSize: false,
  });
}

/**
 * Restore the default full-HD desktop viewport and clear any active mobile
 * emulation from `emulateMobileCentered`. Call this if a scenario switches
 * from a mobile view back to a desktop check.
 */
export async function restoreDesktopViewport(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.clearDeviceMetricsOverride");
  await page.setViewportSize({
    width: RECORDING_FRAME.width,
    height: RECORDING_FRAME.height,
  });
}

/**
 * Set a specific (non-mobile) viewport size — e.g. a 1280×720 or 1366×768
 * desktop window sub-frame for a "does this still render at the small
 * desktop" check. Keeps the outer render surface at the recording frame so
 * the video is still 1920×1080; the app just sees the smaller viewport.
 *
 * If the target size equals the recording frame, this is a no-op that clears
 * any lingering mobile emulation.
 */
export async function emulateDesktopViewport(
  page: Page,
  size: { width: number; height: number },
): Promise<void> {
  if (
    size.width === RECORDING_FRAME.width &&
    size.height === RECORDING_FRAME.height
  ) {
    await restoreDesktopViewport(page);
    return;
  }
  await page.setViewportSize({
    width: RECORDING_FRAME.width,
    height: RECORDING_FRAME.height,
  });
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: size.width,
    height: size.height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: RECORDING_FRAME.width,
    screenHeight: RECORDING_FRAME.height,
    positionX: Math.floor((RECORDING_FRAME.width - size.width) / 2),
    positionY: Math.floor((RECORDING_FRAME.height - size.height) / 2),
    dontSetVisibleSize: false,
  });
}
