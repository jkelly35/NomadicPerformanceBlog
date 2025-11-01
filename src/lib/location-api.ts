// src/lib/location-api.ts
interface LocationResult {
  name: string;
  lat: number;
  lon: number;
  type: string;
  address: string;
}

interface TrailInfo {
  name: string;
  distance: number; // in miles
  difficulty: 'easy' | 'moderate' | 'hard';
  description: string;
  lat: number;
  lon: number;
}

export async function searchNearbyTrails(lat: number, lon: number, radius = 25): Promise<TrailInfo[]> {
  // Using OpenStreetMap data via Overpass API for hiking trails
  const query = `
    [out:json][timeout:25];
    (
      way["highway"="path"]["sac_scale"~"hiking|mountain_hiking"](around:${radius * 1609},${lat},${lon});
      way["highway"="footway"]["sac_scale"~"hiking|mountain_hiking"](around:${radius * 1609},${lat},${lon});
      relation["route"="hiking"](around:${radius * 1609},${lat},${lon});
    );
    out tags;
  `;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query
  });

  if (!response.ok) {
    throw new Error('Trail data unavailable');
  }

  const data = await response.json();

  return data.elements.slice(0, 10).map((element: any) => ({
    name: element.tags?.name || 'Unnamed Trail',
    distance: Math.random() * 10 + 1, // Placeholder - would need routing calculation
    difficulty: element.tags?.sac_scale?.includes('mountain') ? 'hard' : 'moderate',
    description: element.tags?.description || 'Scenic hiking trail',
    lat: element.lat || lat,
    lon: element.lon || lon
  }));
}

export async function geocodeLocation(query: string): Promise<LocationResult[]> {
  // Using Nominatim (OpenStreetMap) - completely free
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=us`
  );

  if (!response.ok) {
    throw new Error('Geocoding failed');
  }

  const data = await response.json();

  return data.map((result: any) => ({
    name: result.display_name.split(',')[0],
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    type: result.type,
    address: result.display_name
  }));
}

export async function reverseGeocode(lat: number, lon: number): Promise<LocationResult> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
  );

  if (!response.ok) {
    throw new Error('Reverse geocoding failed');
  }

  const data = await response.json();

  return {
    name: data.display_name.split(',')[0],
    lat: parseFloat(data.lat),
    lon: parseFloat(data.lon),
    type: data.type,
    address: data.display_name
  };
}
