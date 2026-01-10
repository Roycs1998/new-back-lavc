export function extractKeyFromUrl(url: string): string | null {
  const match = url.match(/upload\/.*$/);
  return match ? match[0] : null;
}
