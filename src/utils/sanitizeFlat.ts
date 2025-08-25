export const sanitizeFlat = <T extends Record<string, any>>(dto: T) => {
  const banned = new Set(['_id', '__v', 'createdAt', 'updatedAt']);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(dto)) {
    if (banned.has(k)) continue;
    if (v !== undefined) out[k] = v;
  }
  return out;
};
