-- =============================================
-- CRIAÇÃO DE TABELA GRUPOS ECONÔMICOS
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Criar tabela de Grupos Econômicos
CREATE TABLE IF NOT EXISTS public.grupos_economicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Adicionar coluna grupo_economico_id na tabela crm_clientes
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS grupo_economico_id uuid REFERENCES public.grupos_economicos(id) ON DELETE SET NULL;

-- 3. Criar índice para melhorar performance de busca
CREATE INDEX IF NOT EXISTS idx_clientes_grupo_economico ON public.crm_clientes(grupo_economico_id);
CREATE INDEX IF NOT EXISTS idx_grupos_economicos_nome ON public.grupos_economicos(nome);

-- 4. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Criar trigger para grupos_economicos
DROP TRIGGER IF EXISTS update_grupos_economicos_updated_at ON public.grupos_economicos;
CREATE TRIGGER update_grupos_economicos_updated_at
  BEFORE UPDATE ON public.grupos_economicos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Habilitar RLS (Row Level Security)
ALTER TABLE public.grupos_economicos ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas de acesso (ajuste conforme suas necessidades)
-- Permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir leitura de grupos econômicos" ON public.grupos_economicos
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir inserção para todos os usuários autenticados
CREATE POLICY "Permitir criação de grupos econômicos" ON public.grupos_economicos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir atualização para todos os usuários autenticados
CREATE POLICY "Permitir atualização de grupos econômicos" ON public.grupos_economicos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permitir exclusão para todos os usuários autenticados
CREATE POLICY "Permitir exclusão de grupos econômicos" ON public.grupos_economicos
  FOR DELETE
  TO authenticated
  USING (true);

-- 8. Comentários para documentação
COMMENT ON TABLE public.grupos_economicos IS 'Tabela de grupos econômicos para agrupar clientes relacionados';
COMMENT ON COLUMN public.grupos_economicos.nome IS 'Nome único do grupo econômico';
COMMENT ON COLUMN public.grupos_economicos.descricao IS 'Descrição opcional do grupo econômico';
COMMENT ON COLUMN public.crm_clientes.grupo_economico_id IS 'Referência ao grupo econômico do cliente';
