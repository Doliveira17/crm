-- =============================================
-- ADICIONAR TODOS OS NOVOS CAMPOS À TABELA crm_contatos
-- Data de criação: 03/02/2026
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- Adicionar todos os novos campos de uma vez
ALTER TABLE public.crm_contatos 
ADD COLUMN IF NOT EXISTS data_aniversario date NULL,
ADD COLUMN IF NOT EXISTS pessoa_site text NULL,
ADD COLUMN IF NOT EXISTS pessoa_redes text NULL,
ADD COLUMN IF NOT EXISTS autorizacao_mensagem boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS canal_relatorio text[] NULL;

-- Adicionar constraint de validação para canal_relatorio
ALTER TABLE public.crm_contatos
ADD CONSTRAINT crm_contatos_canal_relatorio_check 
CHECK (
  canal_relatorio IS NULL OR 
  (
    canal_relatorio <@ ARRAY['email', 'whatsapp']::text[] AND
    array_length(canal_relatorio, 1) > 0
  )
);

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_crm_contatos_data_aniversario 
ON public.crm_contatos USING btree (data_aniversario) 
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_crm_contatos_autorizacao 
ON public.crm_contatos USING btree (autorizacao_mensagem) 
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_crm_contatos_canal_relatorio 
ON public.crm_contatos USING gin (canal_relatorio) 
TABLESPACE pg_default;

-- Adicionar comentários aos campos
COMMENT ON COLUMN public.crm_contatos.data_aniversario IS 'Data de aniversário do contato';
COMMENT ON COLUMN public.crm_contatos.pessoa_site IS 'Website pessoal ou profissional do contato';
COMMENT ON COLUMN public.crm_contatos.pessoa_redes IS 'Redes sociais do contato (ex: @instagram, linkedin.com/in/usuario)';
COMMENT ON COLUMN public.crm_contatos.autorizacao_mensagem IS 'Autorização para receber mensagens de relatório (calculado automaticamente baseado em canal_relatorio)';
COMMENT ON COLUMN public.crm_contatos.canal_relatorio IS 'Canais de comunicação para relatório: email e/ou whatsapp';

-- =============================================
-- VERIFICAÇÃO
-- Execute esta query para confirmar que os campos foram criados:
-- =============================================
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'crm_contatos'
-- ORDER BY ordinal_position;
