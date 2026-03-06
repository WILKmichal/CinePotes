/**
 * Color mapping for transaction IDs
 * Ensures the same transaction ID always gets the same color
 */

const RESET = '\x1b[0m';

// Cache for request ID to color mapping
const colorCache = new Map<string, string>();

/**
 * Simple hash function to generate a consistent number from a string
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Convert HSL to RGB, then to ANSI 256-color code
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns ANSI 256-color code
 */
function hslToAnsi256(h: number, s: number, l: number): string {
  // Normalize HSL values
  h = h % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  // HSL to RGB conversion
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r: number, g: number, b: number;

  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  // Convert to 0-255 range
  const r8 = Math.round((r + m) * 255);
  const g8 = Math.round((g + m) * 255);
  const b8 = Math.round((b + m) * 255);

  // Return 24-bit true color ANSI code
  return `\x1b[38;2;${r8};${g8};${b8}m`;
}

/**
 * Get a consistent ANSI color code for a given request ID
 * @param requestId - The transaction/request ID
 * @returns ANSI color code
 */
export function getColorForRequestId(requestId: string): string {
  if (colorCache.has(requestId)) {
    return colorCache.get(requestId)!;
  }

  const hash = hashString(requestId);
  // Use hash to generate hue (0-360 degrees)
  const hue = hash % 360;
  // Keep saturation and lightness constant for readability
  const color = hslToAnsi256(hue, 70, 50);

  colorCache.set(requestId, color);
  return color;
}

/**
 * Apply color to the request ID in the log message
 * @param requestId - The transaction/request ID
 * @returns Colored request ID string
 */
export function colorizeRequestId(requestId: string): string {
  const color = getColorForRequestId(requestId);
  return `${color}[${requestId}]${RESET}`;
}

/**
 * Clear the color cache (useful for testing or memory management)
 */
export function clearColorCache(): void {
  colorCache.clear();
}
