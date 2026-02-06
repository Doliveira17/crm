-- Adicionar coluna tipos_relacionamento à tabela crm_clientes
ALTER TABLE crm_clientes
ADD COLUMN IF NOT EXISTS tipos_relacionamento text[] DEFAULT '{}';

-- Criar índice GIN para buscas eficientes em arrays
CREATE INDEX IF NOT EXISTS idx_clientes_tipos_relacionamento 
ON crm_clientes USING GIN (tipos_relacionamento);

-- Atualizar RLS policies se necessário
-- As policies existentes devem funcionar automaticamente com o novo campo
