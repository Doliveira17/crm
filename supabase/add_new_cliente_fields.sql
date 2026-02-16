(-- Script para adicionar novos campos à tabela crm_clientes
-- Execute este script no seu banco de dados Supabase

-- Adicionar as novas colunas
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS nome_grupo text null,
ADD COLUMN IF NOT EXISTS status text null default 'ATIVO',
ADD COLUMN IF NOT EXISTS tipo_relacionamento text null,
ADD COLUMN IF NOT EXISTS ins_estadual text null,
ADD COLUMN IF NOT EXISTS emp_redes text null,
ADD COLUMN IF NOT EXISTS data_fundacao date null,
ADD COLUMN IF NOT EXISTS emp_site text null,
ADD COLUMN IF NOT EXISTS ins_municipal text null;

-- Adicionar constraint para o campo status
ALTER TABLE public.crm_clientes 
ADD CONSTRAINT crm_clientes_status_chk CHECK (
  (status IS NULL) OR 
  (status = ''::text) OR 
  (UPPER(status) = ANY(ARRAY['ATIVO'::text, 'INATIVO'::text, 'PROSPECTO'::text, 'SUSPENSO'::text, 'BLOQUEADO'::text]))
);

-- Adicionar constraint para URL do site (validação básica)
ALTER TABLE public.crm_clientes 
ADD CONSTRAINT crm_clientes_emp_site_chk CHECK (
  (emp_site IS NULL) OR 
  (emp_site = ''::text) OR 
  (emp_site ~* '^https?://.*'::text)
);

-- Criar índices para os novos campos mais utilizados
CREATE INDEX IF NOT EXISTS idx_crm_clientes_status 
ON public.crm_clientes USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_crm_clientes_nome_grupo 
ON public.crm_clientes USING btree (lower(nome_grupo)) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_crm_clientes_tipo_relacionamento 
ON public.crm_clientes USING btree (tipo_relacionamento) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_crm_clientes_data_fundacao 
ON public.crm_clientes USING btree (data_fundacao) TABLESPACE pg_default;

-- Comentários para documentação
COMMENT ON COLUMN public.crm_clientes.nome_grupo IS 'Nome do grupo empresarial ao qual o cliente pertence';
COMMENT ON COLUMN public.crm_clientes.status IS 'Status do cliente: ATIVO, INATIVO, PROSPECTO, SUSPENSO ou BLOQUEADO';
COMMENT ON COLUMN public.crm_clientes.tipo_relacionamento IS 'Tipo de relacionamento: Cliente, Fornecedor, Parceiro, etc.';
COMMENT ON COLUMN public.crm_clientes.ins_estadual IS 'Número da inscrição estadual';
COMMENT ON COLUMN public.crm_clientes.emp_redes IS 'Redes sociais da empresa';
COMMENT ON COLUMN public.crm_clientes.data_fundacao IS 'Data de fundação da empresa';
COMMENT ON COLUMN public.crm_clientes.emp_site IS 'Site oficial da empresa';
COMMENT ON COLUMN public.crm_clientes.ins_municipal IS 'Número da inscrição municipal';

-- Verificar se as alterações foram aplicadas
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'crm_clientes' 
  AND table_schema = 'public'
  AND column_name IN ('nome_grupo', 'status', 'tipo_relacionamento', 'ins_estadual', 'emp_redes', 'data_fundacao', 'emp_site', 'ins_municipal')
ORDER BY ordinal_position;