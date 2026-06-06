export const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function resolveImg(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  if (src.startsWith('http')) return src;
  return `${API}/${src}`;
}
