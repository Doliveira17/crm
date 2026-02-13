-- =============================================
-- SCRIPT DE CRIAÇÃO DAS TABELAS DO CRM
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Tabela de Clientes (PF e PJ)
CREATE TABLE IF NOT EXISTS public.crm_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cadastro text NOT NULL,
  tipo_cliente text CHECK (tipo_cliente IN ('PF', 'PJ')),
  documento text,
  razao_social text,
  nome_fantasia text,
  apelido_relacionamento text,
  telefone_principal text,
  whatsapp text,
  email_principal text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  municipio text,
  uf text,
  cep text,
  pais text,
  observacoes text,
  observacoes_extras text,
  nome_grupo text,
  status text CHECK (status IN ('ATIVO', 'INATIVO', 'PROSPECTO', 'SUSPENSO')),
  tipo_relacionamento text,
  ins_estadual text,
  ins_municipal text,
  data_fundacao text,
  emp_site text,
  emp_redes text,
  tags text[],
  favorito boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Tabela de Contatos
CREATE TABLE IF NOT EXISTS public.crm_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  apelido_relacionamento text,
  cargo text,
  celular text,
  email text,
  data_aniversario date,
  pessoa_site text,
  pessoa_redes jsonb,
  autorizacao_mensagem boolean DEFAULT false,
  canal_relatorio text[] CHECK (canal_relatorio IS NULL OR (canal_relatorio <@ ARRAY['email', 'whatsapp', 'grupo_whatsapp']::text[] AND array_length(canal_relatorio, 1) > 0)),
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Tabela de Vínculos Cliente-Contato
CREATE TABLE IF NOT EXISTS public.crm_clientes_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.crm_clientes(id) ON DELETE CASCADE,
  contato_id uuid NOT NULL REFERENCES public.crm_contatos(id) ON DELETE CASCADE,
  contato_principal boolean DEFAULT false,
  cargo_no_cliente text,
  observacoes_relacionamento text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(cliente_id, contato_id)
);

-- Índice único parcial para garantir apenas um contato principal por cliente
CREATE UNIQUE INDEX IF NOT EXISTS unique_contato_principal_por_cliente 
ON public.crm_clientes_contatos(cliente_id) 
WHERE contato_principal = true;

-- 4. Tabela de Relatórios de Envios (se não existir)
CREATE TABLE IF NOT EXISTS public.relatorio_envios (
  id bigserial PRIMARY KEY,
  cliente_id uuid REFERENCES public.crm_clientes(id),
  contato_id uuid REFERENCES public.crm_contatos(id),
  plant_id text,
  nome_falado_dono text,
  url text,
  url_pdf text,
  status_envio text,
  viewed boolean DEFAULT false,
  id_poll text,
  etapa_lead integer,
  verifica text,
  jsonfinal jsonb,
  enviado_em timestamptz,
  visualizado_em timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- POLÍTICAS RLS (Row Level Security)
-- =============================================

-- Habilitar RLS
ALTER TABLE public.crm_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_clientes_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio_envios ENABLE ROW LEVEL SECURITY;

-- Políticas para crm_clientes
CREATE POLICY "auth_select_clientes" ON public.crm_clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_clientes" ON public.crm_clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_clientes" ON public.crm_clientes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_clientes" ON public.crm_clientes FOR DELETE TO authenticated USING (true);

-- Políticas para crm_contatos
CREATE POLICY "auth_select_contatos" ON public.crm_contatos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_contatos" ON public.crm_contatos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_contatos" ON public.crm_contatos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_contatos" ON public.crm_contatos FOR DELETE TO authenticated USING (true);

-- Políticas para crm_clientes_contatos
CREATE POLICY "auth_select_vinculos" ON public.crm_clientes_contatos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_vinculos" ON public.crm_clientes_contatos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_vinculos" ON public.crm_clientes_contatos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_vinculos" ON public.crm_clientes_contatos FOR DELETE TO authenticated USING (true);

-- Políticas para relatorio_envios (somente leitura)
CREATE POLICY "auth_select_relatorios" ON public.relatorio_envios FOR SELECT TO authenticated USING (true);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_clientes_updated ON public.crm_clientes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_contatos_updated ON public.crm_contatos(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_contatos_data_aniversario ON public.crm_contatos(data_aniversario);
CREATE INDEX IF NOT EXISTS idx_contatos_pessoa_redes ON public.crm_contatos USING gin(pessoa_redes);
CREATE INDEX IF NOT EXISTS idx_contatos_autorizacao ON public.crm_contatos(autorizacao_mensagem);
CREATE INDEX IF NOT EXISTS idx_contatos_canal_relatorio ON public.crm_contatos USING gin(canal_relatorio);
CREATE INDEX IF NOT EXISTS idx_vinculos_cliente ON public.crm_clientes_contatos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_contato ON public.crm_clientes_contatos(contato_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_created ON public.relatorio_envios(created_at DESC);

-- Pronto! Tabelas criadas com sucesso.
