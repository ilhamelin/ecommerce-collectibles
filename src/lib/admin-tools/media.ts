export const MEDIA_MAX_BYTES = 350 * 1024;
export function imageMime(
  bytes: Uint8Array,
): "image/png" | "image/jpeg" | "image/webp" | null {
  if (bytes.length < 12 || bytes.length > MEDIA_MAX_BYTES) return null;
  if (
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => bytes[index] === value,
    )
  )
    return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return "image/jpeg";
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}
export type MediaAsset = {
  id: string;
  name: string;
  tags: string;
  url: string;
  bytes: number;
  mime: string;
  position: number;
  createdAt: string;
  archived: boolean;
};
