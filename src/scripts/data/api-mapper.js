export async function storyMapper(raw) {
  return {
    id: raw.id,
    name: raw.name ?? raw.userName ?? raw.reporterName ?? 'Anonim',
    description: raw.description ?? '',
    photoUrl: raw.photoUrl ?? (raw.photos && raw.photos[0]) ?? '',
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    lat: typeof raw.lat !== 'undefined' ? raw.lat : (raw.latitude ?? null),
    lon: typeof raw.lon !== 'undefined' ? raw.lon : (raw.longitude ?? null),
  };
}
