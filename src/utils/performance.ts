/**
 * Performance / device-capability detection.
 *
 * Tuned for in-car browsers (Tesla) and other low-power, large-screen
 * environments. The Tesla touchscreen is a big, high-resolution display
 * driven by a relatively modest GPU/CPU, so unbounded canvas work (one
 * gradient per particle per frame, O(n^2) connection lines, rendering at
 * full native pixel ratio) tanks the frame rate. These helpers let the
 * animation code scale itself down on constrained devices.
 */

export type PerformanceTier = 'high' | 'low';

let cachedTier: PerformanceTier | null = null;

/**
 * Detect Tesla's in-car browser.
 *
 * Tesla's current browser is Chromium-based and reports a "Tesla" token in
 * the user agent; the older infotainment browser reported "QtCarBrowser".
 * We also honour an explicit `?tesla` / `?lowpower` query override so the
 * low-power path can be tested (and forced) on any device.
 */
export function isTeslaBrowser(): boolean {
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    if (/Tesla|QtCarBrowser/i.test(ua)) return true;
  }
  if (typeof window !== 'undefined' && window.location) {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('tesla') || params.get('lowpower') === '1') return true;
    } catch {
      // URLSearchParams unavailable / malformed search — ignore.
    }
  }
  return false;
}

/** Whether the user has asked the OS to minimise non-essential motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Coarse performance tier. `low` triggers on Tesla, when reduced motion is
 * requested, or on devices reporting few CPU cores / little memory.
 * The result is cached because the inputs don't change within a session.
 */
export function getPerformanceTier(): PerformanceTier {
  if (cachedTier) return cachedTier;

  let tier: PerformanceTier = 'high';
  if (isTeslaBrowser() || prefersReducedMotion()) {
    tier = 'low';
  } else if (typeof navigator !== 'undefined') {
    const cores = navigator.hardwareConcurrency ?? 8;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    if (cores <= 4 || mem <= 4) tier = 'low';
  }

  cachedTier = tier;
  return tier;
}

export function isLowPowerDevice(): boolean {
  return getPerformanceTier() === 'low';
}

/**
 * Pixel ratio to use for canvas backing stores. Large in-car displays often
 * report a high devicePixelRatio; rendering full-resolution multiplies the
 * fill cost for little visual gain, so we cap it.
 */
export function getRenderScale(): number {
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const cap = isLowPowerDevice() ? 1 : 1.5;
  return Math.max(1, Math.min(dpr, cap));
}

/** Target frame rate for continuous canvas animations. */
export function getTargetFps(): number {
  return isLowPowerDevice() ? 30 : 60;
}
