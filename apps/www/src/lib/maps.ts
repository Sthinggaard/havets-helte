export function buildMapsUrl(location?: string | null) {
  const query = location?.trim() ?? '';
  if (!query) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildMapsEmbedUrl(location?: string | null) {
  const query = location?.trim() ?? '';
  if (!query) return '';
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}
