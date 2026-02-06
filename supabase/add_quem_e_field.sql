-- Adicionar campo quem_e na tabela crm_clientes
-- Este campo armazenará uma descrição de quem é o cliente
-- Para PF: "Quem é essa Pessoa?"
-- Para PJ: "Quem é essa Empresa?"

ALTER TABLE crm_clientes 
ADD COLUMN IF NOT EXISTS quem_e TEXT;

-- Adicionar comentário ao campo
COMMENT ON COLUMN crm_clientes.quem_e IS 'Descrição de quem é o cliente (Para PF: pessoa, Para PJ: empresa)';

-- Atualizar timestamp de modificação
UPDATE crm_clientes SET updated_at = NOW() WHERE quem_e IS NOT NULL;
