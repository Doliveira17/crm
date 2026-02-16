-- ======================================================
-- SQL COMPLETO PARA SISTEMA DE PERMISSÕES
-- Execute este script COMPLETO no SQL Editor do Supabase
-- ======================================================

-- 1. Criar tabela user_roles (se não existir)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'limitada')),
  permissions JSONB DEFAULT '{}'::jsonb,
  login_count INTEGER DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Criar tabela user_login_history (histórico de logins)
CREATE TABLE IF NOT EXISTS public.user_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id ON public.user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_history_login_at ON public.user_login_history(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_email ON public.user_login_history(user_email);

-- 4. Enable RLS (Row Level Security)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para user_roles
DROP POLICY IF EXISTS "user_roles_select_all" ON public.user_roles;
CREATE POLICY "user_roles_select_all"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "user_roles_update_admin_only" ON public.user_roles;
CREATE POLICY "user_roles_update_admin_only"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "user_roles_insert_admin_only" ON public.user_roles;
CREATE POLICY "user_roles_insert_admin_only"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "user_roles_delete_admin_only" ON public.user_roles;
CREATE POLICY "user_roles_delete_admin_only"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 6. Políticas RLS para user_login_history
DROP POLICY IF EXISTS "user_login_history_select_own_or_admin" ON public.user_login_history;
CREATE POLICY "user_login_history_select_own_or_admin"
ON public.user_login_history
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "user_login_history_insert_own" ON public.user_login_history;
CREATE POLICY "user_login_history_insert_own"
ON public.user_login_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 7. Trigger para atualizar login_count e last_login_at automaticamente
CREATE OR REPLACE FUNCTION public.update_user_login_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_roles
  SET 
    login_count = COALESCE(login_count, 0) + 1,
    last_login_at = NEW.login_at
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_login_history_update_stats ON public.user_login_history;
CREATE TRIGGER user_login_history_update_stats
AFTER INSERT ON public.user_login_history
FOR EACH ROW
EXECUTE FUNCTION public.update_user_login_stats();

-- 8. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. PROTEÇÃO: Impedir deletar usuário "gestora" (SUPER ADMIN)
CREATE OR REPLACE FUNCTION public.prevent_gestora_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Buscar email do usuário
  SELECT email INTO user_email FROM auth.users WHERE id = OLD.user_id;
  
  -- Se for gestora, impedir deleção
  IF user_email ILIKE '%gestora%' THEN
    RAISE EXCEPTION 'Usuário gestora não pode ser removido (SUPER ADMIN protegido)';
  END IF;
  
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS prevent_delete_gestora ON public.user_roles;
CREATE TRIGGER prevent_delete_gestora
BEFORE DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_gestora_deletion();

-- 10. PROTEÇÃO: Impedir alterar role de gestora
CREATE OR REPLACE FUNCTION public.prevent_gestora_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Buscar email do usuário
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  
  -- Se for gestora, forçar role = admin
  IF user_email ILIKE '%gestora%' THEN
    NEW.role := 'admin';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_gestora_admin ON public.user_roles;
CREATE TRIGGER enforce_gestora_admin
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_gestora_role_change();

-- 11. Inserir role para usuários auth existentes (se não tiverem)
INSERT INTO public.user_roles (user_id, role, permissions)
SELECT 
  id,
  'admin', -- Todos os usuários existentes viram admin por padrão
  '{
    "dashboard": true,
    "clientes": true,
    "tecnica": true,
    "interacoes": true,
    "tags": true,
    "faturas": true,
    "relatorios": true,
    "permicoes": true
  }'::jsonb
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- ======================================================
-- FINALIZADO! O sistema de permissões está configurado.
-- ======================================================

-- Verificar usuários criados:
SELECT 
  u.email,
  ur.role,
  ur.login_count,
  ur.last_login_at,
  ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at DESC;
