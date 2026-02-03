-- =============================================
-- ADICIONAR NOVOS CAMPOS À TABELA crm_contatos
-- Data de criação: 03/02/2026
-- =============================================

-- Adicionar novos campos à tabela crm_contatos
ALTER TABLE public.crm_contatos 
ADD COLUMN IF NOT EXISTS data_aniversario date NULL,
ADD COLUMN IF NOT EXISTS pessoa_site text NULL,
ADD COLUMN IF NOT EXISTS pessoa_redes jsonb NULL;

-- Adicionar índice para data de aniversário (útil para buscar aniversariantes do mês)
CREATE INDEX IF NOT EXISTS idx_crm_contatos_data_aniversario 
ON public.crm_contatos USING btree (data_aniversario) 
TABLESPACE pg_default;

-- Adicionar índice GIN para busca em redes sociais (campo JSONB)
CREATE INDEX IF NOT EXISTS idx_crm_contatos_pessoa_redes 
ON public.crm_contatos USING gin (pessoa_redes) 
TABLESPACE pg_default;

-- Adicionar comentários aos novos campos
COMMENT ON COLUMN public.crm_contatos.data_aniversario IS 'Data de aniversário do contato';
COMMENT ON COLUMN public.crm_contatos.pessoa_site IS 'Website pessoal ou profissional do contato';
COMMENT ON COLUMN public.crm_contatos.pessoa_redes IS 'Redes sociais do contato em formato JSON (ex: {"linkedin": "url", "instagram": "@user"})';
