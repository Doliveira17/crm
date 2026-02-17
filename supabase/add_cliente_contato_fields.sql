-- Migração: Adicionar campos de contato específicos por cliente
-- Data: 2026-02-17
-- Descrição: Adiciona colunas para armazenar email, telefone e website específicos por relacionamento cliente-contato

BEGIN;

-- 1. ADICIONAR OS CAMPOS FALTANTES À TABELA
ALTER TABLE public.crm_clientes_contatos
ADD COLUMN IF NOT EXISTS email_contato text NULL,
ADD COLUMN IF NOT EXISTS telefone_contato text NULL,
ADD COLUMN IF NOT EXISTS website_contato text NULL;

-- 2. COMENTAR OS CAMPOS (documentação)
COMMENT ON COLUMN public.crm_clientes_contatos.email_contato IS 'Email do contato para comunicação específica com este cliente';
COMMENT ON COLUMN public.crm_clientes_contatos.telefone_contato IS 'Telefone/WhatsApp do contato para comunicação específica com este cliente';
COMMENT ON COLUMN public.crm_clientes_contatos.website_contato IS 'Website ou página específica relacionada ao trabalho com este cliente';

-- 3. CRIAR ÍNDICES PARA OS NOVOS CAMPOS (performance nas buscas)
CREATE INDEX IF NOT EXISTS idx_rel_email_contato 
ON public.crm_clientes_contatos USING btree (email_contato) 
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_rel_telefone_contato 
ON public.crm_clientes_contatos USING btree (telefone_contato) 
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_rel_website_contato 
ON public.crm_clientes_contatos USING btree (website_contato) 
TABLESPACE pg_default;

-- 4. VERIFICAR ESTRUTURA FINAL
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'crm_clientes_contatos' 
-- ORDER BY ordinal_position;

COMMIT;

-- ============================================================================
-- ESTRUTURA FINAL DA TABELA crm_clientes_contatos
-- ============================================================================
-- 
-- id                              | uuid                  | NOT NULL (PK)
-- cliente_id                      | uuid                  | NOT NULL (FK)
-- contato_id                      | uuid                  | NOT NULL (FK)
-- contato_principal               | boolean               | NOT NULL DEFAULT false
-- cargo_no_cliente                | text                  | NULL
-- observacoes_relacionamento      | text                  | NULL
-- email_contato                   | text                  | NULL (NOVO)
-- telefone_contato                | text                  | NULL (NOVO)
-- website_contato                 | text                  | NULL (NOVO)
-- pref_email                      | boolean               | NOT NULL DEFAULT false
-- pref_whatsapp                   | boolean               | NOT NULL DEFAULT false
-- pref_grupo_whatsapp             | boolean               | NOT NULL DEFAULT false
-- created_at                      | timestamp with tz    | NOT NULL DEFAULT now()
-- date_id                         | bigint                | NULL
-- 
-- CONSTRAINTS:
-- - Primary Key: id
-- - Unique: (cliente_id, contato_id) - um registro por cliente-contato
-- - Unique Index: uk_um_contato_principal_por_cliente - apenas UM contato principal por cliente
-- - Foreign Keys: cliente_id → crm_clientes(id), contato_id → crm_contatos(id)
-- 
-- ============================================================================
