-- ============================================
-- MIGRAÇÃO COMPLETA: Adicionar todos os campos necessários
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Campo cliente_desde
ALTER TABLE crm_clientes 
ADD COLUMN IF NOT EXISTS cliente_desde DATE;

-- 2. Campo quem_e
ALTER TABLE crm_clientes 
ADD COLUMN IF NOT EXISTS quem_e TEXT;

-- 3. Campo origem
ALTER TABLE crm_clientes 
ADD COLUMN IF NOT EXISTS origem TEXT;

-- 4. Comentários
COMMENT ON COLUMN crm_clientes.cliente_desde IS 'Data a partir da qual o cliente iniciou negócios com a empresa';
COMMENT ON COLUMN crm_clientes.quem_e IS 'Quem é esta pessoa/empresa';
COMMENT ON COLUMN crm_clientes.origem IS 'Origem do cliente (como conheceu a empresa)';

-- 5. Verificar se todos os outros campos existem
DO $$ 
BEGIN
    -- emp_site
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_clientes' AND column_name = 'emp_site'
    ) THEN
        ALTER TABLE crm_clientes ADD COLUMN emp_site TEXT;
    END IF;

    -- emp_redes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_clientes' AND column_name = 'emp_redes'
    ) THEN
        ALTER TABLE crm_clientes ADD COLUMN emp_redes TEXT;
    END IF;

    -- data_fundacao
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_clientes' AND column_name = 'data_fundacao'
    ) THEN
        ALTER TABLE crm_clientes ADD COLUMN data_fundacao DATE;
    END IF;

    -- ins_estadual
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_clientes' AND column_name = 'ins_estadual'
    ) THEN
        ALTER TABLE crm_clientes ADD COLUMN ins_estadual TEXT;
    END IF;

    -- ins_municipal
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_clientes' AND column_name = 'ins_municipal'
    ) THEN
        ALTER TABLE crm_clientes ADD COLUMN ins_municipal TEXT;
    END IF;

    -- nome_grupo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_clientes' AND column_name = 'nome_grupo'
    ) THEN
        ALTER TABLE crm_clientes ADD COLUMN nome_grupo TEXT;
    END IF;
END $$;

-- 6. Limpar cache do schema no Supabase
NOTIFY pgrst, 'reload schema';
