-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add spatial index on Issue.location
CREATE INDEX IF NOT EXISTS issue_location_gist
  ON "Issue" USING GIST (location);
