import { logger } from "@/lib/logger";

export async function calculateDistance(
  origin: string,
  destination: string
): Promise<number> {
  try {
    // First, geocode the addresses using Nominatim
    const geocodeAddress = async (address: string) => {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            "User-Agent": "DeclarationsApp/1.0", // Required by Nominatim's terms of use
          },
        }
      );
      const data = await response.json();
      if (!data || data.length === 0) {
        throw new Error(`Could not find coordinates for address: ${address}`);
      }
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    };

    // Get coordinates for both addresses
    const [originCoords, destCoords] = await Promise.all([
      geocodeAddress(origin),
      geocodeAddress(destination),
    ]);

    // Calculate route using OSRM
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}?overview=false`
    );
    const data = await response.json();

    if (data.code !== "Ok") {
      throw new Error("Could not calculate route");
    }

    // Return distance in kilometers
    return data.routes[0].distance / 1000;
  } catch (error) {
    logger.error("Error calculating distance", {
      context: {
        error: error instanceof Error ? error.message : String(error),
      },
      fromAddress: origin,
      toAddress: destination,
    });
    throw error;
  }
}
