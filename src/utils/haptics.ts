/**
 * PWA Haptic Feedback Utility
 * Uses the Web Vibration API to provide tactile feedback on supported devices.
 */

export const triggerHaptic = (pattern: number | number[] = 10) => {
  // Check if vibration is supported and enabled in the browser
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Fail silently on devices/browsers that block vibration without user gesture
      // or simply don't support it (like iOS Safari in many cases)
    }
  }
};

export const hapticPatterns = {
  short: 10,
  medium: 50,
  success: [20, 30, 20],
  error: [100, 50, 100],
  heavy: 100
};
