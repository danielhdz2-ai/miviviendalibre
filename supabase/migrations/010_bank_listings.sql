-- Categoría "Oportunidades Bancarias"
-- Los servicers bancarios gestionan stock inmobiliario de entidades financieras.
-- Solvia/Intrum → Banco Sabadell
-- Aliseda → Banco Santander / Blackstone Real Estate
-- Servihabitat → CaixaBank   (futuro)

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS is_bank     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_entity text;   -- 'Banco Sabadell (Solvia)', 'Banco Santander (Aliseda)', ...

-- Índice para filtrado rápido en el buscador
CREATE INDEX IF NOT EXISTS idx_listings_is_bank ON listings (is_bank) WHERE is_bank = true;
