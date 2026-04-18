-- ══════════════════════════════════════════════════════════════════
-- 031_alertas_mensajeria.sql
-- Sistema de Alertas de Búsqueda + Mensajería Interna — Inmonest
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- 1. search_alerts  (alertas de búsqueda guardadas)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_alerts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Filtros serializados de la búsqueda
  filters       jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Etiqueta legible: "Alquiler en Madrid ≤1.500€/mes · 2 hab."
  label         text NOT NULL,
  -- Frecuencia de envío
  frequency     text NOT NULL DEFAULT 'daily',
  -- 'immediate' | 'daily' | 'weekly'
  active        boolean NOT NULL DEFAULT true,
  -- Control de envíos
  last_sent_at  timestamptz,
  last_match_at timestamptz,
  total_sent    integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- Máximo 10 alertas por usuario (evitar spam)
CREATE INDEX IF NOT EXISTS idx_search_alerts_user     ON search_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_search_alerts_active   ON search_alerts(active, frequency, last_sent_at)
  WHERE active = true;

ALTER TABLE search_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alertas: usuario ve las suyas"
  ON search_alerts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "alertas: usuario inserta"
  ON search_alerts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "alertas: usuario actualiza las suyas"
  ON search_alerts FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "alertas: usuario borra las suyas"
  ON search_alerts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────
-- 2. conversations  (hilo entre comprador y vendedor sobre un anuncio)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  -- buyer_id: quien inicia contacto (el interesado)
  buyer_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- seller_id: dueño del anuncio
  seller_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Último mensaje para ordenar y preview
  last_message    text,
  last_message_at timestamptz,
  -- Mensajes no leídos por cada parte
  unread_buyer    integer NOT NULL DEFAULT 0,
  unread_seller   integer NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  -- Solo una conversación por (buyer, listing)
  UNIQUE (buyer_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_buyer  ON conversations(buyer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON conversations(listing_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv: participante ve la conversacion"
  ON conversations FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "conv: buyer crea la conversacion"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "conv: participante actualiza (last_message, unread)"
  ON conversations FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────
-- 3. messages  (mensajes individuales en una conversación)
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body            text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  -- NULL mientras no se lee
  read_at         timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at ASC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Solo los participantes de la conversación pueden ver/escribir mensajes
CREATE POLICY "msg: participante ve mensajes"
  ON messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

CREATE POLICY "msg: participante envía mensaje"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

CREATE POLICY "msg: participante marca como leído"
  ON messages FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- ──────────────────────────────────────────────────────────────────
-- 4. Trigger: actualizar conversations al insertar mensaje
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message    = substring(NEW.body, 1, 120),
    last_message_at = NEW.created_at,
    -- Incrementar no-leídos del receptor
    unread_buyer  = CASE WHEN NEW.sender_id = seller_id THEN unread_buyer  + 1 ELSE unread_buyer  END,
    unread_seller = CASE WHEN NEW.sender_id = buyer_id  THEN unread_seller + 1 ELSE unread_seller END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- ──────────────────────────────────────────────────────────────────
-- 5. Vista conveniente: conversaciones con datos del anuncio y el otro participante
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_conversations AS
SELECT
  c.id,
  c.listing_id,
  l.title          AS listing_title,
  l.city           AS listing_city,
  (SELECT li.external_url FROM listing_images li
   WHERE li.listing_id = c.listing_id
   ORDER BY li.display_order ASC NULLS LAST LIMIT 1) AS listing_image,
  c.buyer_id,
  c.seller_id,
  c.last_message,
  c.last_message_at,
  c.unread_buyer,
  c.unread_seller,
  c.created_at
FROM conversations c
JOIN listings l ON l.id = c.listing_id;
