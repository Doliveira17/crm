-- ================================================================
-- OTIMIZAÇÕES DE PERFORMANCE - ÍNDICES E VIEWS
-- ================================================================

-- Índices para tabela crm_clientes
CREATE INDEX IF NOT EXISTS idx_clientes_razao_social ON crm_clientes USING GIN(razao_social gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON crm_clientes(documento);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON crm_clientes(email_principal);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON crm_clientes(status);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo ON crm_clientes(tipo_cliente);
CREATE INDEX IF NOT EXISTS idx_clientes_grupo_economico ON crm_clientes(grupo_economico_id);
CREATE INDEX IF NOT EXISTS idx_clientes_updated_at ON crm_clientes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_clientes_cliente_desde ON crm_clientes(cliente_desde);
CREATE INDEX IF NOT EXISTS idx_clientes_favorito ON crm_clientes(favorito) WHERE favorito = true;

-- Índices compostos para buscas comuns
CREATE INDEX IF NOT EXISTS idx_clientes_status_updated ON crm_clientes(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo_status ON crm_clientes(tipo_cliente, status);

-- Índices para vinculação com contatos
CREATE INDEX IF NOT EXISTS idx_clientes_contatos_search ON crm_clientes(razao_social, documento, telefone_principal, email_principal);

-- Índices para performance em filtros
CREATE INDEX IF NOT EXISTS idx_clientes_tags ON crm_clientes USING GIN(tags);

-- ================================================================
-- EXTENSÃO PARA BUSCA DE TEXTO
-- ================================================================

-- Ativar extensão pg_trgm para busca eficiente
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ================================================================
-- POLÍTICAS RLS OTIMIZADAS
-- ================================================================

-- Verificar se a tabela tem RLS ativado e implementar policies otimizadas
ALTER TABLE crm_clientes ENABLE ROW LEVEL SECURITY;

-- Dropar policies antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ver seus clientes" ON crm_clientes;
DROP POLICY IF EXISTS "Usuários podem criar clientes" ON crm_clientes;
DROP POLICY IF EXISTS "Usuários podem atualizar seus clientes" ON crm_clientes;
DROP POLICY IF EXISTS "Usuários podem deletar seus clientes" ON crm_clientes;

-- Criar policies simples e eficientes (sem joins complexos)
CREATE POLICY "Ver clientes" ON crm_clientes FOR SELECT USING (true);
CREATE POLICY "Criar clientes" ON crm_clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizar clientes" ON crm_clientes FOR UPDATE USING (true);
CREATE POLICY "Deletar clientes" ON crm_clientes FOR DELETE USING (true);

-- ================================================================
-- ANÁLISE E VACUUMAÇÃO
-- ================================================================

-- Executar ANALYZE para atualizar estatísticas
ANALYZE crm_clientes;

-- Dica: Execute VACUUM periodicamente via cron:
-- SELECT cron.schedule('vacuum_clientes', '0 3 * * *', 'VACUUM ANALYZE crm_clientes');

-- ================================================================
-- VERIFICAÇÃO
-- ================================================================

-- Listar todos os índices criados
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename = 'crm_clientes'
ORDER BY indexname;

-- Verificar tamanho da tabela
SELECT 
  pg_size_pretty(pg_total_relation_size('crm_clientes')) as tamanho_total,
  pg_size_pretty(pg_relation_size('crm_clientes')) as tamanho_tabela,
  pg_size_pretty(pg_total_relation_size('crm_clientes') - pg_relation_size('crm_clientes')) as tamanho_indices;
