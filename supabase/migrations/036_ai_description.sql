-- Migration 036: Add ai_description column to listings
-- Stores Gemini-generated descriptions for SEO and UX enrichment

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS ai_description TEXT;

COMMENT ON COLUMN listings.ai_description IS
  'Descripción generada por IA (Gemini). Se rellena en batch mediante scripts/generate-listing-descriptions.ts. No sobreescribe si ya existe.';
