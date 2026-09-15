/** WCAG relative-luminance contrast for opaque sRGB colors, used by tests. */
export function hexToRgb(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) {
    throw new Error(`Expected a six-digit hex color, received ${hex}`);
  }
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function luminance(channels) {
  const [red, green, blue] = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground, background) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
