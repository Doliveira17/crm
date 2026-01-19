-- Políticas RLS para o CRM
-- Execute este script no SQL Editor do Supabase

-- Habilitar RLS nas tabelas
ALTER TABLE public.crm_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_clientes_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio_envios ENABLE ROW LEVEL SECURITY;

-- Políticas para crm_clientes
-- Usuários autenticados podem ler todos os clientes
CREATE POLICY "Usuários autenticados podem visualizar clientes"
ON public.crm_clientes
FOR SELECT
TO authenticated
USING (true);

-- Usuários autenticados podem inserir clientes
CREATE POLICY "Usuários autenticados podem criar clientes"
ON public.crm_clientes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Usuários autenticados podem atualizar clientes
CREATE POLICY "Usuários autenticados podem atualizar clientes"
ON public.crm_clientes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Usuários autenticados podem deletar clientes
CREATE POLICY "Usuários autenticados podem deletar clientes"
ON public.crm_clientes
FOR DELETE
TO authenticated
USING (true);

-- Políticas para crm_contatos
-- Usuários autenticados podem ler todos os contatos
CREATE POLICY "Usuários autenticados podem visualizar contatos"
ON public.crm_contatos
FOR SELECT
TO authenticated
USING (true);

-- Usuários autenticados podem inserir contatos
CREATE POLICY "Usuários autenticados podem criar contatos"
ON public.crm_contatos
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Usuários autenticados podem atualizar contatos
CREATE POLICY "Usuários autenticados podem atualizar contatos"
ON public.crm_contatos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Usuários autenticados podem deletar contatos
CREATE POLICY "Usuários autenticados podem deletar contatos"
ON public.crm_contatos
FOR DELETE
TO authenticated
USING (true);

-- Políticas para crm_clientes_contatos (vínculos)
-- Usuários autenticados podem ler todos os vínculos
CREATE POLICY "Usuários autenticados podem visualizar vínculos"
ON public.crm_clientes_contatos
FOR SELECT
TO authenticated
USING (true);

-- Usuários autenticados podem inserir vínculos
CREATE POLICY "Usuários autenticados podem criar vínculos"
ON public.crm_clientes_contatos
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Usuários autenticados podem atualizar vínculos
CREATE POLICY "Usuários autenticados podem atualizar vínculos"
ON public.crm_clientes_contatos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Usuários autenticados podem deletar vínculos
CREATE POLICY "Usuários autenticados podem deletar vínculos"
ON public.crm_clientes_contatos
FOR DELETE
TO authenticated
USING (true);

-- Políticas para relatorio_envios
-- Permitir acesso público para leitura (anônimo + autenticado)
CREATE POLICY "Acesso público para visualizar relatórios"
ON public.relatorio_envios
FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir inserção para usuários autenticados
CREATE POLICY "Usuários autenticados podem criar relatórios"
ON public.relatorio_envios
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir atualização para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar relatórios"
ON public.relatorio_envios
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Permitir deleção para usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar relatórios"
ON public.relatorio_envios
FOR DELETE
TO authenticated
USING (true);

-- Índices para melhor performance (opcional, mas recomendado)

-- Índices para busca em crm_clientes
CREATE INDEX IF NOT EXISTS idx_clientes_nome_cadastro ON public.crm_clientes USING gin(to_tsvector('portuguese', nome_cadastro));
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON public.crm_clientes(documento);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.crm_clientes(email_principal);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON public.crm_clientes(telefone_principal);

-- Índices para busca em crm_contatos
CREATE INDEX IF NOT EXISTS idx_contatos_nome ON public.crm_contatos USING gin(to_tsvector('portuguese', nome_completo));
CREATE INDEX IF NOT EXISTS idx_contatos_email ON public.crm_contatos(email);
CREATE INDEX IF NOT EXISTS idx_contatos_celular ON public.crm_contatos(celular);

-- Índices para vínculos
CREATE INDEX IF NOT EXISTS idx_vinculos_cliente ON public.crm_clientes_contatos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_contato ON public.crm_clientes_contatos(contato_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_principal ON public.crm_clientes_contatos(cliente_id, contato_principal) WHERE contato_principal = true;

-- Índices para relatórios
CREATE INDEX IF NOT EXISTS idx_relatorios_cliente ON public.relatorio_envios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_contato ON public.relatorio_envios(contato_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_status ON public.relatorio_envios(status_envio);
CREATE INDEX IF NOT EXISTS idx_relatorios_viewed ON public.relatorio_envios(viewed);
CREATE INDEX IF NOT EXISTS idx_relatorios_created ON public.relatorio_envios(created_at DESC);

-- Constraint para garantir apenas um contato principal por cliente
-- Nota: Este índice único parcial já garante essa regra
CREATE UNIQUE INDEX IF NOT EXISTS unique_contato_principal_por_cliente 
ON public.crm_clientes_contatos(cliente_id) 
WHERE contato_principal = true;

-- Comentários nas tabelas para documentação
COMMENT ON TABLE public.crm_clientes IS 'Cadastro de clientes (Pessoa Física e Jurídica)';
COMMENT ON TABLE public.crm_contatos IS 'Cadastro de contatos individuais';
COMMENT ON TABLE public.crm_clientes_contatos IS 'Relacionamento N:N entre clientes e contatos';
COMMENT ON TABLE public.relatorio_envios IS 'Histórico de envios realizados (somente leitura)';
