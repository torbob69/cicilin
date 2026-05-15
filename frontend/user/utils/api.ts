export function parseApiError(err: any, fallback = "Terjadi kesalahan"): string {
  const detail = err?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) return detail[0]?.msg ?? fallback;
  return fallback;
}
