-- Tabela para rastrear logins de usuários
CREATE TABLE IF NOT EXISTS public.user_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adicionar coluna login_count à tabela user_roles
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id ON public.user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_history_login_at ON public.user_login_history(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_email ON public.user_login_history(user_email);

-- Enable RLS
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para login_history
DROP POLICY IF EXISTS "user_login_history_select_own" ON public.user_login_history;
CREATE POLICY "user_login_history_select_own"
ON public.user_login_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "user_login_history_insert_own" ON public.user_login_history;
CREATE POLICY "user_login_history_insert_own"
ON public.user_login_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar login_count e last_login_at
CREATE OR REPLACE FUNCTION public.update_user_login_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
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
