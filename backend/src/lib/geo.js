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
export async function setIssueLocation(issueId, lat, lng) {
  await prisma.$executeRaw`
    UPDATE "Issue"
    SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
    WHERE id = ${issueId}
  `;
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getIssueCoords(issueId) {
  const rows = await prisma.$queryRaw`
    SELECT
      ST_Y(location::geometry) AS lat,
      ST_X(location::geometry) AS lng
    FROM "Issue"
    WHERE id = ${issueId} AND location IS NOT NULL
  `;
  return rows.length ? rows[0] : null;
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
