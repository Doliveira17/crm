-- Criação da tabela crm_clientes_tecnica
-- Esta migração garante que a tabela de dados técnicos existe e contém todas as colunas necessárias

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.crm_clientes_tecnica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID,
    documento TEXT NOT NULL,
    razao_social TEXT,
    
    -- Informações básicas da planta
    nome_planta TEXT,
    modalidade TEXT,
    classificacao TEXT,
    tipo_local TEXT,
    possui_internet BOOLEAN DEFAULT FALSE,
    
    -- Datas
    data_install DATE,
    venc_garantia DATE,
    garantia_extendida TEXT,
    
    -- Especificações da usina
    potencia_usina_kwp NUMERIC(10, 2),
    
    -- Inversores
    quant_inverter BIGINT,
    marca_inverter TEXT,
    mod_inverter TEXT,
    serie_inverter TEXT,
    
    -- Módulos/Painéis
    quant_modulos BIGINT,
    marca_modulos TEXT,
    mod_modulos TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Adicionar foreign key se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'crm_clientes_tecnica_cliente_id_fkey'
    ) THEN
        ALTER TABLE public.crm_clientes_tecnica 
        ADD CONSTRAINT crm_clientes_tecnica_cliente_id_fkey 
        FOREIGN KEY (cliente_id) 
        REFERENCES public.crm_clientes(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Criar índice único composto (um registro técnico por cliente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_tecnica_cliente_id_unique 
ON public.crm_clientes_tecnica(cliente_id) 
WHERE cliente_id IS NOT NULL;

-- Criar índice na coluna documento para performance
CREATE INDEX IF NOT EXISTS idx_clientes_tecnica_documento ON public.crm_clientes_tecnica(documento);

-- Função de atualização automática do updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_crm_clientes_tecnica_updated_at ON public.crm_clientes_tecnica;
CREATE TRIGGER update_crm_clientes_tecnica_updated_at
    BEFORE UPDATE ON public.crm_clientes_tecnica
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS
ALTER TABLE public.crm_clientes_tecnica ENABLE ROW LEVEL SECURITY;

-- Política para leitura (SELECT)
DROP POLICY IF EXISTS "Permitir leitura de dados técnicos para usuários autenticados" ON public.crm_clientes_tecnica;
CREATE POLICY "Permitir leitura de dados técnicos para usuários autenticados"
ON public.crm_clientes_tecnica
FOR SELECT
TO authenticated
USING (true);

-- Política para inserção (INSERT)
DROP POLICY IF EXISTS "Permitir inserção de dados técnicos para usuários autenticados" ON public.crm_clientes_tecnica;
CREATE POLICY "Permitir inserção de dados técnicos para usuários autenticados"
ON public.crm_clientes_tecnica
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para atualização (UPDATE)
DROP POLICY IF EXISTS "Permitir atualização de dados técnicos para usuários autenticados" ON public.crm_clientes_tecnica;
CREATE POLICY "Permitir atualização de dados técnicos para usuários autenticados"
ON public.crm_clientes_tecnica
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para exclusão (DELETE)
DROP POLICY IF EXISTS "Permitir exclusão de dados técnicos para usuários autenticados" ON public.crm_clientes_tecnica;
CREATE POLICY "Permitir exclusão de dados técnicos para usuários autenticados"
ON public.crm_clientes_tecnica
FOR DELETE
TO authenticated
USING (true);

-- Comentários na tabela
COMMENT ON TABLE public.crm_clientes_tecnica IS 'Tabela com dados técnicos das usinas fotovoltaicas dos clientes';
COMMENT ON COLUMN public.crm_clientes_tecnica.cliente_id IS 'Referência ao cliente (pode ser nulo se registro órfão)';
COMMENT ON COLUMN public.crm_clientes_tecnica.documento IS 'CPF/CNPJ do cliente (chave única)';
COMMENT ON COLUMN public.crm_clientes_tecnica.nome_planta IS 'Nome da planta/usina solar';
COMMENT ON COLUMN public.crm_clientes_tecnica.modalidade IS 'Modalidade da usina (Residencial, Comercial, Industrial, Híbrida)';
COMMENT ON COLUMN public.crm_clientes_tecnica.classificacao IS 'Classificação do sistema (On-grid, Off-grid, Híbrida)';
COMMENT ON COLUMN public.crm_clientes_tecnica.tipo_local IS 'Tipo de local de instalação (Telhado, Solo, Fachada, Estrutura)';
COMMENT ON COLUMN public.crm_clientes_tecnica.possui_internet IS 'Se a usina possui conexão à internet';
COMMENT ON COLUMN public.crm_clientes_tecnica.data_install IS 'Data de instalação da usina';
COMMENT ON COLUMN public.crm_clientes_tecnica.venc_garantia IS 'Data de vencimento da garantia';
COMMENT ON COLUMN public.crm_clientes_tecnica.potencia_usina_kwp IS 'Potência total da usina em kWp';
COMMENT ON COLUMN public.crm_clientes_tecnica.quant_inverter IS 'Quantidade de inversores instalados';
COMMENT ON COLUMN public.crm_clientes_tecnica.marca_inverter IS 'Marca do(s) inversor(es)';
COMMENT ON COLUMN public.crm_clientes_tecnica.mod_inverter IS 'Modelo do(s) inversor(es)';
COMMENT ON COLUMN public.crm_clientes_tecnica.serie_inverter IS 'Número de série do(s) inversor(es)';
COMMENT ON COLUMN public.crm_clientes_tecnica.quant_modulos IS 'Quantidade total de módulos/painéis solares';
COMMENT ON COLUMN public.crm_clientes_tecnica.marca_modulos IS 'Marca dos módulos solares';
COMMENT ON COLUMN public.crm_clientes_tecnica.mod_modulos IS 'Modelo dos módulos solares';
