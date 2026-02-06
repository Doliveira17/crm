-- Script para atualizar constraint de status e adicionar opção BLOQUEADO
-- Execute este script no seu banco de dados Supabase

-- 1. Remover a constraint antiga
ALTER TABLE public.crm_clientes 
DROP CONSTRAINT IF EXISTS crm_clientes_status_chk;

-- 2. Adicionar nova constraint com BLOQUEADO incluído
ALTER TABLE public.crm_clientes 
ADD CONSTRAINT crm_clientes_status_chk CHECK (
  (status IS NULL) OR 
  (status = ''::text) OR 
  (UPPER(status) = ANY(ARRAY['ATIVO'::text, 'INATIVO'::text, 'PROSPECTO'::text, 'SUSPENSO'::text, 'BLOQUEADO'::text]))
);

-- 3. Atualizar comentário do campo
COMMENT ON COLUMN public.crm_clientes.status IS 'Status do cliente: ATIVO, INATIVO, PROSPECTO, SUSPENSO ou BLOQUEADO';

-- Verificar a constraint foi criada corretamente
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'crm_clientes_status_chk';
