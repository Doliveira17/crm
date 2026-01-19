-- Criar tabela para armazenar tags do sistema
CREATE TABLE IF NOT EXISTS crm_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionar RLS (Row Level Security)
ALTER TABLE crm_tags ENABLE ROW LEVEL SECURITY;

-- Policy para permitir leitura de tags
CREATE POLICY "Permitir leitura de tags para usuários autenticados"
  ON crm_tags
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy para permitir inserção de tags
CREATE POLICY "Permitir inserção de tags para usuários autenticados"
  ON crm_tags
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy para permitir atualização de tags
CREATE POLICY "Permitir atualização de tags para usuários autenticados"
  ON crm_tags
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Policy para permitir exclusão de tags
CREATE POLICY "Permitir exclusão de tags para usuários autenticados"
  ON crm_tags
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Inserir tags existentes na nova tabela (migração das tags já usadas nos clientes)
INSERT INTO crm_tags (nome)
SELECT DISTINCT unnest(tags) as nome
FROM crm_clientes
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
ON CONFLICT (nome) DO NOTHING;
