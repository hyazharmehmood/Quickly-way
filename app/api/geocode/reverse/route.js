import { NextResponse } from 'next/server';

/**
 * GET /api/geocode/reverse?lat=...&lng=...
 * Server-side reverse geocode (lat,lng → "City, Country") to avoid CORS and API key exposure.
 * Uses GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const numLat = lat != null ? parseFloat(lat, 10) : NaN;
    const numLng = lng != null ? parseFloat(lng, 10) : NaN;

    if (Number.isNaN(numLat) || Number.isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      return NextResponse.json(
        { success: false, error: 'Invalid lat or lng' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Location service not configured' },
        { status: 503 }
      );
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${numLat},${numLng}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' || !data.results?.[0]) {
      const reason = data.status === 'ZERO_RESULTS' ? 'No address found for coordinates' : data.error_message || data.status || 'Geocode failed';
      return NextResponse.json(
        { success: false, error: reason },
        { status: 200 }
      );
    }

    const comp = data.results[0].address_components || [];
    const country = comp.find((c) => c.types?.includes('country'))?.long_name;
    const city = comp.find((c) => c.types?.includes('locality'))?.long_name
      || comp.find((c) => c.types?.includes('administrative_area_level_1'))?.long_name;

    let location = null;
    if (city && country) location = `${city}, ${country}`;
    else if (country) location = country;
    else location = data.results[0].formatted_address || null;

    return NextResponse.json({ success: true, location });
  } catch (err) {
    console.error('Geocode reverse error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to get address' },
      { status: 500 }
    );
  }
}
