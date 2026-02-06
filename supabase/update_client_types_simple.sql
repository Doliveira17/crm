UPDATE crm_clientes 
SET tipo_cliente = 'PF', updated_at = NOW()
WHERE LENGTH(REGEXP_REPLACE(documento, '[^0-9]', '', 'g')) = 11
  AND documento IS NOT NULL 
  AND documento != '';

UPDATE crm_clientes 
SET tipo_cliente = 'PJ', updated_at = NOW()
WHERE LENGTH(REGEXP_REPLACE(documento, '[^0-9]', '', 'g')) = 14
  AND documento IS NOT NULL 
  AND documento != '';

SELECT 
  tipo_cliente,
  COUNT(*) as quantidade,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentual
FROM crm_clientes 
WHERE documento IS NOT NULL AND documento != ''
GROUP BY tipo_cliente
ORDER BY quantidade DESC;