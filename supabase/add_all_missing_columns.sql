-- =============================================
-- ADICIONAR TODAS AS COLUNAS FALTANTES À TABELA crm_clientes
-- Data de criação: 03/02/2026
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- Adicionar coluna whatsapp
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS whatsapp text NULL;

-- Adicionar coluna pais
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS pais text NULL;

-- Adicionar coluna observacoes_extras
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS observacoes_extras text NULL;

-- Adicionar coluna nome_grupo
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS nome_grupo text NULL;

-- Adicionar coluna status
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS status text NULL 
CHECK (status IN ('ATIVO', 'INATIVO', 'PROSPECTO', 'SUSPENSO'));

-- Adicionar coluna tipo_relacionamento
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS tipo_relacionamento text NULL;

-- Adicionar coluna ins_estadual
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS ins_estadual text NULL;

-- Adicionar coluna ins_municipal
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS ins_municipal text NULL;

-- Adicionar coluna data_fundacao
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS data_fundacao text NULL;

-- Adicionar coluna emp_site
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS emp_site text NULL;

-- Adicionar coluna emp_redes
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS emp_redes text NULL;

-- Adicionar coluna tags
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS tags text[] NULL;

-- Adicionar coluna favorito
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS favorito boolean DEFAULT false;

-- Adicionar comentários às colunas
COMMENT ON COLUMN public.crm_clientes.whatsapp IS 'Número de WhatsApp do cliente';
COMMENT ON COLUMN public.crm_clientes.pais IS 'País do cliente';
COMMENT ON COLUMN public.crm_clientes.observacoes_extras IS 'Observações adicionais sobre o cliente';
COMMENT ON COLUMN public.crm_clientes.nome_grupo IS 'Nome do grupo empresarial';
COMMENT ON COLUMN public.crm_clientes.status IS 'Status do cliente: ATIVO, INATIVO, PROSPECTO, SUSPENSO';
COMMENT ON COLUMN public.crm_clientes.tipo_relacionamento IS 'Tipo de relacionamento com o cliente';
COMMENT ON COLUMN public.crm_clientes.ins_estadual IS 'Inscrição Estadual';
COMMENT ON COLUMN public.crm_clientes.ins_municipal IS 'Inscrição Municipal';
COMMENT ON COLUMN public.crm_clientes.data_fundacao IS 'Data de fundação da empresa';
COMMENT ON COLUMN public.crm_clientes.emp_site IS 'Site da empresa';
COMMENT ON COLUMN public.crm_clientes.emp_redes IS 'Redes sociais da empresa';
COMMENT ON COLUMN public.crm_clientes.tags IS 'Tags do cliente';
COMMENT ON COLUMN public.crm_clientes.favorito IS 'Cliente marcado como favorito';
