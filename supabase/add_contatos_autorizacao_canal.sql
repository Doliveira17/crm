-- =============================================
-- ADICIONAR CAMPOS DE AUTORIZAÇÃO E CANAL À TABELA crm_contatos
-- Data de criação: 03/02/2026
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- Adicionar campo autorizacao_mensagem (boolean)
ALTER TABLE public.crm_contatos 
ADD COLUMN IF NOT EXISTS autorizacao_mensagem boolean DEFAULT false;

-- Adicionar campo canal_relatorio (array de texto para suportar múltiplos canais)
ALTER TABLE public.crm_contatos 
ADD COLUMN IF NOT EXISTS canal_relatorio text[] NULL
CHECK (
  canal_relatorio IS NULL OR 
  (
    canal_relatorio <@ ARRAY['email', 'whatsapp']::text[] AND
    array_length(canal_relatorio, 1) > 0
  )
);

-- Adicionar índice para facilitar busca por autorização
CREATE INDEX IF NOT EXISTS idx_crm_contatos_autorizacao 
ON public.crm_contatos USING btree (autorizacao_mensagem) 
TABLESPACE pg_default;

-- Adicionar índice GIN para busca em canal_relatorio (array)
CREATE INDEX IF NOT EXISTS idx_crm_contatos_canal_relatorio 
ON public.crm_contatos USING gin (canal_relatorio) 
TABLESPACE pg_default;

-- Adicionar comentários aos novos campos
COMMENT ON COLUMN public.crm_contatos.autorizacao_mensagem IS 'Autorização para receber mensagens de relatório';
COMMENT ON COLUMN public.crm_contatos.canal_relatorio IS 'Canais de comunicação para relatório: email e/ou whatsapp';
