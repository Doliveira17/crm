-- ⚠️ EXECUTAR ESTE SCRIPT NO SUPABASE SQL EDITOR ⚠️
-- Acesse: https://app.supabase.com → seu projeto → SQL Editor

-- Dropar tabela antiga se existir (CUIDADO: vai deletar dados!)
-- DROP TABLE IF EXISTS public.crm_ucs_validacao CASCADE;

-- Criar função de update se não existir
CREATE OR REPLACE FUNCTION update_ucs_validacao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar tabela com exatamente a estrutura fornecida
CREATE TABLE IF NOT EXISTS public.crm_ucs_validacao (
  id uuid not null default gen_random_uuid (),
  documento text not null,
  uc text not null,
  estado_de_chamado text null,
  historico_validacao jsonb null default '[]'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint crm_ucs_validacao_pkey primary key (id),
  constraint crm_ucs_validacao_documento_uc_key unique (documento, uc),
  constraint estado_uc_check check (
    (
      (estado_de_chamado is null)
      or (
        estado_de_chamado = any (array['Validando'::text, 'Verde'::text])
      )
    )
  )
) TABLESPACE pg_default;

-- Criar índices
create index IF not exists idx_ucs_validacao_documento on public.crm_ucs_validacao using btree (documento) TABLESPACE pg_default;

create index IF not exists idx_ucs_validacao_uc on public.crm_ucs_validacao using btree (uc) TABLESPACE pg_default;

create index IF not exists idx_ucs_validacao_estado on public.crm_ucs_validacao using btree (estado_de_chamado) TABLESPACE pg_default
where
  (estado_de_chamado is not null);

-- Deletar trigger antigo se existir
DROP TRIGGER IF EXISTS update_crm_ucs_validacao_updated_at ON public.crm_ucs_validacao;

-- Criar trigger novo
create trigger update_crm_ucs_validacao_updated_at BEFORE
update on crm_ucs_validacao for EACH row
execute FUNCTION update_ucs_validacao_updated_at ();

-- Habilitar RLS se ainda não estiver
ALTER TABLE public.crm_ucs_validacao ENABLE ROW LEVEL SECURITY;

-- Deletar políticas antigas
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.crm_ucs_validacao;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.crm_ucs_validacao;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.crm_ucs_validacao;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.crm_ucs_validacao;

-- Criar políticas RLS novas
CREATE POLICY "Enable read access for authenticated users"
ON public.crm_ucs_validacao
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.crm_ucs_validacao
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON public.crm_ucs_validacao
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
ON public.crm_ucs_validacao
FOR DELETE
TO authenticated
USING (true);

-- ✅ Concluído! Tabela criada/atualizada com sucesso
SELECT 'Tabela crm_ucs_validacao criada com sucesso!' as resultado;
