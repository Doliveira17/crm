-- Adicionar campos de preferências de comunicação por cliente vinculado
-- Executar este script no Supabase SQL Editor

-- Adicionar colunas na tabela crm_clientes_contatos
ALTER TABLE crm_clientes_contatos
ADD COLUMN IF NOT EXISTS cargo_contato TEXT,
ADD COLUMN IF NOT EXISTS pref_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pref_whatsapp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pref_grupo_whatsapp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_contato TEXT,
ADD COLUMN IF NOT EXISTS telefone_contato TEXT,
ADD COLUMN IF NOT EXISTS website_contato TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN crm_clientes_contatos.cargo_contato IS 'Cargo ou função do contato neste cliente específico';
COMMENT ON COLUMN crm_clientes_contatos.pref_email IS 'Se o contato prefere receber comunicações por email deste cliente';
COMMENT ON COLUMN crm_clientes_contatos.pref_whatsapp IS 'Se o contato prefere receber comunicações por WhatsApp deste cliente';
COMMENT ON COLUMN crm_clientes_contatos.pref_grupo_whatsapp IS 'Se o contato prefere receber comunicações via grupo WhatsApp deste cliente';
COMMENT ON COLUMN crm_clientes_contatos.email_contato IS 'Email específico para este cliente';
COMMENT ON COLUMN crm_clientes_contatos.telefone_contato IS 'Telefone/WhatsApp específico para este cliente';
COMMENT ON COLUMN crm_clientes_contatos.website_contato IS 'Website específico relacionado a este cliente';

-- Criar índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_clientes_contatos_pref_email ON crm_clientes_contatos(cliente_id, pref_email) WHERE pref_email = true;
CREATE INDEX IF NOT EXISTS idx_clientes_contatos_pref_whatsapp ON crm_clientes_contatos(cliente_id, pref_whatsapp) WHERE pref_whatsapp = true;
CREATE INDEX IF NOT EXISTS idx_clientes_contatos_pref_grupo ON crm_clientes_contatos(cliente_id, pref_grupo_whatsapp) WHERE pref_grupo_whatsapp = true;
