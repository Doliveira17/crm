-- Script completo para garantir que todos os campos necessários existem na tabela crm_clientes
-- Execute este script no Supabase SQL Editor

-- Campo quem_e
ALTER TABLE crm_clientes 
ADD COLUMN IF NOT EXISTS quem_e TEXT;

-- Campo cliente_desde
ALTER TABLE crm_clientes 
ADD COLUMN IF NOT EXISTS cliente_desde DATE;

-- Campo origem
ALTER TABLE crm_clientes 
ADD COLUMN IF NOT EXISTS origem TEXT;

-- Comentários
COMMENT ON COLUMN crm_clientes.quem_e IS 'Quem é esta pessoa/empresa';
COMMENT ON COLUMN crm_clientes.cliente_desde IS 'Data a partir da qual o cliente iniciou negócios com a empresa';
COMMENT ON COLUMN crm_clientes.origem IS 'Origem do cliente (como conheceu a empresa)';
