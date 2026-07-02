interface ReverseGeocodeResponse {
  address?: Record<string, unknown>;
}

const ROAD_NAME_FIELDS = [
  "road",
  "residential",
  "pedestrian",
  "footway",
  "path",
  "cycleway",
  "service",
  "track",
] as const;

let requestQueue: Promise<void> = Promise.resolve();
let lastRequestAt = 0;
const lookupCache = new Map<string, Promise<string | null>>();

export function lookupRoadName(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const key = `${latitude},${longitude}`;
  const cachedLookup = lookupCache.get(key);
  if (cachedLookup) return cachedLookup;

  const lookup = requestQueue.then(async () => {
    const wait = 1000 - (Date.now() - lastRequestAt);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }

    lastRequestAt = Date.now();
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.search = new URLSearchParams({
      format: "jsonv2",
      addressdetails: "1",
      zoom: "18",
      lat: String(latitude),
      lon: String(longitude),
    }).toString();

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Road name lookup failed (${response.status})`);
    }

    const result = (await response.json()) as ReverseGeocodeResponse;
    for (const field of ROAD_NAME_FIELDS) {
      const value = result.address?.[field];
      if (typeof value === "string" && value.trim()) return value;
    }
    return null;
  });

  requestQueue = lookup.then(
    () => undefined,
    () => undefined,
  );
  lookupCache.set(key, lookup);
  void lookup.catch(() => lookupCache.delete(key));
  return lookup;
}
