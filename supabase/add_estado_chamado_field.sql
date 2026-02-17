-- Adicionar campo estado_de_chamado à tabela crm_clientes
-- Este campo controla o estado visual dos cards no dashboard de faturas

-- Adicionar coluna estado_de_chamado
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS estado_de_chamado TEXT DEFAULT NULL;

-- Adicionar coluna historico_validacao para guardar histórico de ações
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS historico_validacao JSONB DEFAULT '[]'::jsonb;

-- Comentários nas colunas
COMMENT ON COLUMN public.crm_clientes.estado_de_chamado IS 'Estado do chamado: NULL (normal), Validando (amarelo - em verificação), Verde (dados corretos)';
COMMENT ON COLUMN public.crm_clientes.historico_validacao IS 'Histórico de validações em formato JSON array: [{"estado": "Validando", "data": "DD/MM/YYYY", "ucs": ["UC1", "UC2"], "timestamp": "2024-01-01T10:30:00Z"}]';

-- Constraint para valores permitidos
ALTER TABLE public.crm_clientes
ADD CONSTRAINT estado_de_chamado_check 
CHECK (estado_de_chamado IS NULL OR estado_de_chamado IN ('Validando', 'Verde'));

-- Criar índice para busca por estado
CREATE INDEX IF NOT EXISTS idx_clientes_estado_chamado 
ON public.crm_clientes(estado_de_chamado) 
WHERE estado_de_chamado IS NOT NULL;

-- Criar índice para busca por documento (para comparação com CPF/CNPJ)
CREATE INDEX IF NOT EXISTS idx_clientes_documento 
ON public.crm_clientes(documento);
