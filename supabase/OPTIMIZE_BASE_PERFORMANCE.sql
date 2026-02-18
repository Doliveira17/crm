-- 🚀 OTIMIZAÇÕES DE PERFORMANCE - ÍNDICES

-- Índice para filtro de Tipo (principal gargalo)
CREATE INDEX IF NOT EXISTS idx_base_tipo_geradora 
ON public.base(Tipo) 
WHERE Tipo = 'geradora';

-- Índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_base_cliente 
ON public.base(CLIENTE);

-- Índice para busca por CPF/CNPJ
CREATE INDEX IF NOT EXISTS idx_base_cpf_cnpj 
ON public.base("CPF/CNPJ");

-- Índice combinado (Tipo + CPF/CNPJ) para queries mais eficientes
CREATE INDEX IF NOT EXISTS idx_base_tipo_cpf 
ON public.base(Tipo, "CPF/CNPJ") 
WHERE Tipo = 'geradora';

-- Verificar espaço usado por índices
SELECT 
  indexname,
  pg_size_pretty(pg_relation_size(indexrelname::regclass)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND tablename = 'base'
ORDER BY pg_relation_size(indexrelname::regclass) DESC;
