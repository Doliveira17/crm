-- Script para verificar se a view existe e criar se necessário
-- Execute este script no console SQL do Supabase

-- 1. Verificar se a view já existe
SELECT EXISTS (
  SELECT FROM information_schema.views 
  WHERE table_schema = 'public' 
  AND table_name = 'view_faturas_completa'
) as view_exists;

-- 2. Se a view não existir, criar ela
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'view_faturas_completa'
  ) THEN
    EXECUTE '
    CREATE VIEW public.view_faturas_completa AS
    SELECT
      COALESCE(f."UC", g."UNIDADES_CONSUMIDORAS") as "UC_Final",
      f.id as id_fatura,
      f.cliente as cliente_fatura,
      f."UC" as uc_fatura,
      f.mes_referente,
      f.injetado,
      f.dados_inversor,
      f.caminho_arquivo,
      f.status,
      f.dados_extraidos,
      g."ID" as id_cadastro,
      g."CLIENTE" as cliente_cadastro,
      g."CPF/CNPJ" as cpf_cnpj,
      g."UNIDADES_CONSUMIDORAS" as uc_cadastro,
      g."Plant_ID",
      g."INVERSOR",
      g.saldo_credito,
      g.porcentagem,
      g."histórico_gerado" as historico_gerado,
      g."data_ativação",
      g."Geracao_Ac_Mensal" as meta_mensal,
      g."Geracao_Ac_Anual",
      g."Retorno_Financeiro"
    FROM
      fila_extracao f
      FULL JOIN growatt g ON TRIM(
        BOTH FROM f."UC"
      ) = TRIM(
        BOTH FROM g."UNIDADES_CONSUMIDORAS"
      );
    ';
    
    RAISE NOTICE 'View view_faturas_completa criada com sucesso!';
  ELSE
    RAISE NOTICE 'View view_faturas_completa já existe!';
  END IF;
END
$$;

-- 3. Conceder permissões necessárias
GRANT SELECT ON public.view_faturas_completa TO anon;
GRANT SELECT ON public.view_faturas_completa TO authenticated;

-- 4. Verificar se existem dados na view
SELECT 
  COUNT(*) as total_registros,
  COUNT(DISTINCT cliente_cadastro) as clientes_cadastro,
  COUNT(DISTINCT cliente_fatura) as clientes_fatura,
  COUNT(DISTINCT "UC_Final") as total_ucs
FROM public.view_faturas_completa;

-- 5. Mostrar amostra dos dados
SELECT 
  "UC_Final",
  cliente_cadastro,
  cliente_fatura,
  injetado,
  status,
  mes_referente
FROM public.view_faturas_completa
ORDER BY "UC_Final"
LIMIT 10;