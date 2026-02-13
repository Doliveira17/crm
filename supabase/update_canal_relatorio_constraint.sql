-- ========================================
-- ATUALIZAR CONSTRAINT DO CAMPO canal_relatorio
-- ========================================
-- Este script permite que o campo aceite 'grupo_whatsapp'
-- Execute no Supabase SQL Editor

-- 1. Remover constraint antigo
ALTER TABLE crm_contatos DROP CONSTRAINT IF EXISTS crm_contatos_canal_relatorio_check;

-- 2. Adicionar novo constraint
ALTER TABLE crm_contatos ADD CONSTRAINT crm_contatos_canal_relatorio_check 
CHECK (
  canal_relatorio IS NULL OR (
    canal_relatorio <@ ARRAY['email', 'whatsapp', 'grupo_whatsapp']::text[] AND
    array_length(canal_relatorio, 1) > 0
  )
);

-- 3. Confirmar alteração
SELECT 
  constraint_name, 
  check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'crm_contatos_canal_relatorio_check';
