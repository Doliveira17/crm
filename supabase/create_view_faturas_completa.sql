-- Remover view existente se houver
DROP VIEW IF EXISTS public.view_faturas_completa;

-- Criar a view view_faturas_completa com SECURITY INVOKER
CREATE VIEW public.view_faturas_completa
WITH (security_invoker = on) AS
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

-- Conceder permissões
GRANT SELECT ON public.view_faturas_completa TO anon;
GRANT SELECT ON public.view_faturas_completa TO authenticated;