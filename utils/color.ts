// utils/color.ts

/**
 * 将 hex 颜色 + opacity 转换为 rgba 字符串。
 * 如果 hex 无效，返回 undefined（让 CSS 变量生效）。
 */
export function hexToRgba(
  hex: string | undefined,
  opacity: number = 1
): string | undefined {
  if (!hex || !hex.startsWith("#") || hex.length !== 7) {
    return undefined;
  }
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
