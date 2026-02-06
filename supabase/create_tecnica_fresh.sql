-- Script para criar a tabela crm_clientes_tecnica
-- Execute este script no Supabase SQL Editor

-- Remover tabela se existir (cuidado em produção!)
DROP TABLE IF EXISTS public.crm_clientes_tecnica CASCADE;

-- Criar tabela
CREATE TABLE public.crm_clientes_tecnica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID,
    documento TEXT NOT NULL,
    razao_social TEXT,
    nome_planta TEXT,
    modalidade TEXT,
    classificacao TEXT,
    tipo_local TEXT,
    possui_internet BOOLEAN DEFAULT FALSE,
    data_install DATE,
    venc_garantia DATE,
    potencia_usina_kwp NUMERIC(10, 2),
    quant_inverter BIGINT,
    marca_inverter TEXT,
    mod_inverter TEXT,
    serie_inverter TEXT,
    quant_modulos BIGINT,
    marca_modulos TEXT,
    mod_modulos TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar foreign key
ALTER TABLE public.crm_clientes_tecnica 
ADD CONSTRAINT crm_clientes_tecnica_cliente_id_fkey 
FOREIGN KEY (cliente_id) 
REFERENCES public.crm_clientes(id) 
ON DELETE CASCADE;

-- Criar índices
CREATE UNIQUE INDEX idx_clientes_tecnica_cliente_id 
ON public.crm_clientes_tecnica(cliente_id) 
WHERE cliente_id IS NOT NULL;

CREATE INDEX idx_clientes_tecnica_documento 
ON public.crm_clientes_tecnica(documento);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_crm_clientes_tecnica_updated_at
    BEFORE UPDATE ON public.crm_clientes_tecnica
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.crm_clientes_tecnica ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT
CREATE POLICY "Enable read access for authenticated users" 
ON public.crm_clientes_tecnica
FOR SELECT 
TO authenticated
USING (true);

-- Policy para INSERT
CREATE POLICY "Enable insert for authenticated users"
ON public.crm_clientes_tecnica
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy para UPDATE
CREATE POLICY "Enable update for authenticated users"
ON public.crm_clientes_tecnica
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy para DELETE
CREATE POLICY "Enable delete for authenticated users"
ON public.crm_clientes_tecnica
FOR DELETE
TO authenticated
USING (true);
