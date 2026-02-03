-- =============================================
-- ADICIONAR COLUNA observacoes_extras À TABELA crm_clientes
-- Data de criação: 03/02/2026
-- =============================================

-- Adicionar coluna observacoes_extras
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS observacoes_extras text NULL;

-- Adicionar comentário à coluna
COMMENT ON COLUMN public.crm_clientes.observacoes_extras IS 'Observações adicionais sobre o cliente';
