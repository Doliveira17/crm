-- Criar tabela para armazenar estado de cada UC
CREATE TABLE IF NOT EXISTS public.crm_ucs_validacao (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  documento TEXT NOT NULL,
  uc TEXT NOT NULL,
  estado_de_chamado TEXT NULL,
  historico_validacao JSONB NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT crm_ucs_validacao_pkey PRIMARY KEY (id),
  CONSTRAINT crm_ucs_validacao_documento_uc_key UNIQUE (documento, uc),
  CONSTRAINT estado_uc_check CHECK (
    (
      (estado_de_chamado IS NULL)
      OR (
        estado_de_chamado = ANY (ARRAY['Validando'::text, 'Verde'::text])
      )
    )
  )
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_ucs_validacao_documento ON public.crm_ucs_validacao USING btree (documento) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_ucs_validacao_uc ON public.crm_ucs_validacao USING btree (uc) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_ucs_validacao_estado ON public.crm_ucs_validacao USING btree (estado_de_chamado) TABLESPACE pg_default
WHERE (estado_de_chamado IS NOT NULL);

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

CREATE TRIGGER update_crm_ucs_validacao_updated_at BEFORE UPDATE ON crm_ucs_validacao FOR EACH ROW
EXECUTE FUNCTION update_ucs_validacao_updated_at();

-- Habilitar RLS
ALTER TABLE public.crm_ucs_validacao ENABLE ROW LEVEL SECURITY;

-- Deletar políticas antigas se existirem
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.crm_ucs_validacao;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.crm_ucs_validacao;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.crm_ucs_validacao;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.crm_ucs_validacao;

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
