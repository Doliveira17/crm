-- Criar tabela para armazenar estado de cada UC
CREATE TABLE IF NOT EXISTS public.crm_ucs_validacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento TEXT NOT NULL,           -- CPF/CNPJ do cliente
  uc TEXT NOT NULL,                  -- Código da UC
  estado_de_chamado TEXT DEFAULT NULL, -- NULL (vermelho/normal), Validando (amarelo), Verde (verde)
  historico_validacao JSONB DEFAULT '[]'::jsonb, -- [{estado, data, timestamp}, ...]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para valores permitidos
  CONSTRAINT estado_uc_check CHECK (estado_de_chamado IS NULL OR estado_de_chamado IN ('Validando', 'Verde')),
  
  -- Chave única: um estado por UC
  UNIQUE(documento, uc)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ucs_validacao_documento 
ON public.crm_ucs_validacao(documento);

CREATE INDEX IF NOT EXISTS idx_ucs_validacao_uc 
ON public.crm_ucs_validacao(uc);

CREATE INDEX IF NOT EXISTS idx_ucs_validacao_estado 
ON public.crm_ucs_validacao(estado_de_chamado) 
WHERE estado_de_chamado IS NOT NULL;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ucs_validacao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_crm_ucs_validacao_updated_at ON public.crm_ucs_validacao;
CREATE TRIGGER update_crm_ucs_validacao_updated_at
  BEFORE UPDATE ON public.crm_ucs_validacao
  FOR EACH ROW
  EXECUTE FUNCTION update_ucs_validacao_updated_at();

-- Comentários
COMMENT ON TABLE public.crm_ucs_validacao IS 'Rastreamento de validação de UCs individuais no dashboard de faturas';
COMMENT ON COLUMN public.crm_ucs_validacao.estado_de_chamado IS 'Estado: NULL (normal/vermelho), Validando (amarelo), Verde (corrigido)';
COMMENT ON COLUMN public.crm_ucs_validacao.historico_validacao IS 'Array de: {estado, data (DD/MM/YYYY), timestamp}';

-- Habilitar RLS
ALTER TABLE public.crm_ucs_validacao ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (permite usuários autenticados ver todos)
CREATE POLICY "Enable read access for authenticated users"
ON public.crm_ucs_validacao
FOR SELECT
TO authenticated
USING (true);

-- Política para INSERT (permite usuários autenticados inserir)
CREATE POLICY "Enable insert for authenticated users"
ON public.crm_ucs_validacao
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para UPDATE (permite usuários autenticados atualizar)
CREATE POLICY "Enable update for authenticated users"
ON public.crm_ucs_validacao
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para DELETE (permite usuários autenticados deletar)
CREATE POLICY "Enable delete for authenticated users"
ON public.crm_ucs_validacao
FOR DELETE
TO authenticated
USING (true);
