-- Adicionar campo grupo_whatsapp na tabela crm_clientes
-- Este campo armazenará o link do grupo de WhatsApp do cliente

ALTER TABLE crm_clientes 
ADD COLUMN IF NOT EXISTS grupo_whatsapp TEXT;

-- Adicionar comentário ao campo
COMMENT ON COLUMN crm_clientes.grupo_whatsapp IS 'Link do grupo de WhatsApp do cliente (ex: https://chat.whatsapp.com/...)';

-- Atualizar timestamp de modificação
UPDATE crm_clientes SET updated_at = NOW() WHERE grupo_whatsapp IS NOT NULL;
