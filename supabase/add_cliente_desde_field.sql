-- Adicionar campo cliente_desde na tabela crm_clientes
-- Este campo armazenará a data a partir da qual o cliente iniciou negócios com a empresa

ALTER TABLE crm_clientes 
ADD COLUMN IF NOT EXISTS cliente_desde DATE;

-- Adicionar comentário ao campo
COMMENT ON COLUMN crm_clientes.cliente_desde IS 'Data a partir da qual o cliente iniciou negócios com a empresa';

-- Atualizar timestamp de modificação
UPDATE crm_clientes SET updated_at = NOW() WHERE cliente_desde IS NOT NULL;
