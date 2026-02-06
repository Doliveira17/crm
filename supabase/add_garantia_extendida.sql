-- Adicionar coluna garantia_extendida à tabela crm_clientes_tecnica

-- Adicionar coluna se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'crm_clientes_tecnica' 
        AND column_name = 'garantia_extendida'
    ) THEN
        ALTER TABLE public.crm_clientes_tecnica 
        ADD COLUMN garantia_extendida TEXT;
        
        RAISE NOTICE 'Coluna garantia_extendida adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna garantia_extendida já existe.';
    END IF;
END $$;
