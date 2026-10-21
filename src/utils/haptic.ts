// /** A short device vibration when the guest taps or scratches. Silently no-ops if unsupported. */
export function haptic(durationMs = 12) {
  try {
    navigator.vibrate?.(durationMs);
  } catch {
    /* Some browsers expose vibrate but refuse it. */
  }
}
