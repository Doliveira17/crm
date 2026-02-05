-- =============================================
-- QUERIES ÚTEIS PARA GRUPOS ECONÔMICOS
-- =============================================

-- 1. Listar todos os grupos econômicos com contagem de clientes
SELECT 
  g.id,
  g.nome,
  g.descricao,
  COUNT(c.id) as total_clientes,
  g.created_at,
  g.updated_at
FROM grupos_economicos g
LEFT JOIN crm_clientes c ON c.grupo_economico_id = g.id
GROUP BY g.id, g.nome, g.descricao, g.created_at, g.updated_at
ORDER BY total_clientes DESC, g.nome;

-- 2. Listar clientes de um grupo específico
SELECT 
  c.id,
  c.razao_social,
  c.documento,
  c.tipo_cliente,
  c.status,
  g.nome as grupo_economico
FROM crm_clientes c
INNER JOIN grupos_economicos g ON c.grupo_economico_id = g.id
WHERE g.nome = 'NOME_DO_GRUPO'
ORDER BY c.razao_social;

-- 3. Clientes sem grupo econômico
SELECT 
  id,
  razao_social,
  documento,
  tipo_cliente,
  status
FROM crm_clientes
WHERE grupo_economico_id IS NULL
ORDER BY razao_social;

-- 4. Grupos sem clientes vinculados
SELECT 
  g.id,
  g.nome,
  g.descricao,
  g.created_at
FROM grupos_economicos g
LEFT JOIN crm_clientes c ON c.grupo_economico_id = g.id
WHERE c.id IS NULL
ORDER BY g.nome;

-- 5. Estatísticas gerais
SELECT 
  COUNT(DISTINCT g.id) as total_grupos,
  COUNT(DISTINCT c.id) as total_clientes_com_grupo,
  COUNT(DISTINCT CASE WHEN c.grupo_economico_id IS NULL THEN c.id END) as clientes_sem_grupo
FROM grupos_economicos g
LEFT JOIN crm_clientes c ON c.grupo_economico_id = g.id;

-- 6. Top 10 grupos com mais clientes
SELECT 
  g.nome,
  COUNT(c.id) as total_clientes,
  STRING_AGG(c.razao_social, ', ' ORDER BY c.razao_social) as clientes
FROM grupos_economicos g
INNER JOIN crm_clientes c ON c.grupo_economico_id = g.id
GROUP BY g.id, g.nome
ORDER BY total_clientes DESC
LIMIT 10;

-- 7. Buscar grupo e seus clientes com detalhes
SELECT 
  g.nome as grupo,
  g.descricao,
  c.razao_social as cliente,
  c.documento,
  c.tipo_cliente,
  c.status,
  c.telefone_principal,
  c.email_principal,
  c.municipio,
  c.uf
FROM grupos_economicos g
INNER JOIN crm_clientes c ON c.grupo_economico_id = g.id
WHERE g.nome ILIKE '%busca%'
ORDER BY g.nome, c.razao_social;

-- 8. Mover todos os clientes de um grupo para outro
-- (Execute com cuidado!)
UPDATE crm_clientes
SET grupo_economico_id = (
  SELECT id FROM grupos_economicos WHERE nome = 'GRUPO_DESTINO'
)
WHERE grupo_economico_id = (
  SELECT id FROM grupos_economicos WHERE nome = 'GRUPO_ORIGEM'
);

-- 9. Desvincular todos os clientes de um grupo
UPDATE crm_clientes
SET grupo_economico_id = NULL
WHERE grupo_economico_id = (
  SELECT id FROM grupos_economicos WHERE nome = 'NOME_DO_GRUPO'
);

-- 10. Excluir grupo (apenas se não houver clientes vinculados)
DELETE FROM grupos_economicos
WHERE nome = 'NOME_DO_GRUPO'
AND id NOT IN (
  SELECT DISTINCT grupo_economico_id 
  FROM crm_clientes 
  WHERE grupo_economico_id IS NOT NULL
);

-- 11. Renomear grupo econômico
UPDATE grupos_economicos
SET 
  nome = 'NOVO_NOME',
  updated_at = NOW()
WHERE nome = 'NOME_ANTIGO';

-- 12. Ver histórico de criação de grupos
SELECT 
  nome,
  descricao,
  created_at,
  updated_at,
  AGE(NOW(), created_at) as idade
FROM grupos_economicos
ORDER BY created_at DESC;

-- 13. Duplicar verificação (encontrar possíveis duplicatas)
SELECT 
  LOWER(TRIM(nome)) as nome_normalizado,
  STRING_AGG(id::text, ', ') as ids,
  COUNT(*) as ocorrencias
FROM grupos_economicos
GROUP BY LOWER(TRIM(nome))
HAVING COUNT(*) > 1;

-- 14. Relatório completo: Grupos com seus clientes e contatos
SELECT 
  g.nome as grupo_economico,
  c.razao_social as cliente,
  c.tipo_cliente,
  c.status,
  COUNT(DISTINCT v.contato_id) as total_contatos,
  c.created_at as data_cadastro_cliente
FROM grupos_economicos g
INNER JOIN crm_clientes c ON c.grupo_economico_id = g.id
LEFT JOIN crm_vinculos v ON v.cliente_id = c.id
GROUP BY g.id, g.nome, c.id, c.razao_social, c.tipo_cliente, c.status, c.created_at
ORDER BY g.nome, c.razao_social;

-- 15. Exportar lista de grupos com totais para CSV
SELECT 
  g.nome as "Nome do Grupo",
  COALESCE(g.descricao, '') as "Descrição",
  COUNT(c.id) as "Total de Clientes",
  STRING_AGG(c.razao_social, ' | ') as "Clientes",
  TO_CHAR(g.created_at, 'DD/MM/YYYY') as "Data de Criação"
FROM grupos_economicos g
LEFT JOIN crm_clientes c ON c.grupo_economico_id = g.id
GROUP BY g.id, g.nome, g.descricao, g.created_at
ORDER BY COUNT(c.id) DESC, g.nome;
