-- Adicionar campo us_grupo_whatsapp na tabela crm_clientes
-- Este campo armazena o ID único do grupo WhatsApp
ALTER TABLE IF EXISTS public.crm_clientes
ADD COLUMN IF NOT EXISTS us_grupo_whatsapp text;

-- Adicionar comentário descritivo
COMMENT ON COLUMN crm_clientes.us_grupo_whatsapp IS 'ID único do grupo WhatsApp (ex: 120363163507606691@g.us)';

-- Atualizar timestamp
UPDATE crm_clientes SET updated_at = NOW() WHERE us_grupo_whatsapp IS NOT NULL;
