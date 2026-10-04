export function wrapCanvasText(
  ctx: Pick<CanvasRenderingContext2D, "measureText">,
  text: string,
  width: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? line + " " + word : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
export const socialDimensions = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  story: [1080, 1920],
} as const;
