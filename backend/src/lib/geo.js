import prisma from '../config/db.js';

/**
 * Convert lat/lng to PostGIS-compatible WKT point string
 * PostGIS expects longitude FIRST, then latitude
 */
export function toWKTPoint(lat, lng) {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

/**
 * Fetch issues within a radius (meters) of a given lat/lng
 */
export async function getIssuesNearby(
  lat,
  lng,
  radiusMeters = 5000
) {
  const results = await prisma.$queryRaw`
    SELECT
      i.id,
      i.title,
      i.description,
      i.category,
      i.status,
      i.urgency,
      i."priorityScore",
      i."createdAt",
      ST_Y(i.location::geometry) AS lat,
      ST_X(i.location::geometry) AS lng,
      ST_Distance(
        i.location::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      ) AS distance_meters
    FROM "Issue" i
    WHERE
      ST_DWithin(
        i.location::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusMeters}
      )
    ORDER BY distance_meters ASC
  `;

  return results;
}

/**
 * Insert a new issue location point (use inside your issue creation logic)
 * Call this AFTER creating the issue row, then update the location column
 */
export async function setIssueLocation(
  issueId,
  lat,
  lng
) {
  await prisma.$executeRaw`
    UPDATE "Issue"
    SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
    WHERE id = ${issueId}
  `;
}

/**
 * Get all issues as GeoJSON FeatureCollection (for heatmap)
 */
export async function getIssuesGeoJSON(city) {
  let results;
  
  if (city) {
    results = await prisma.$queryRaw`
      SELECT
        i.id,
        i.urgency,
        i.category,
        i.status,
        ST_Y(i.location::geometry) AS lat,
        ST_X(i.location::geometry) AS lng
      FROM "Issue" i
      WHERE
        i.location IS NOT NULL
        AND i.city = ${city}
      LIMIT 1000
    `;
  } else {
    results = await prisma.$queryRaw`
      SELECT
        i.id,
        i.urgency,
        i.category,
        i.status,
        ST_Y(i.location::geometry) AS lat,
        ST_X(i.location::geometry) AS lng
      FROM "Issue" i
      WHERE
        i.location IS NOT NULL
      LIMIT 1000
    `;
  }

  // Shape into GeoJSON FeatureCollection
  return {
    type: 'FeatureCollection',
    features: results.map((row) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [row.lng, row.lat], // GeoJSON is [lng, lat]
      },
      properties: {
        id: row.id,
        urgency: row.urgency,
        category: row.category,
        status: row.status,
      },
    })),
  };
}
