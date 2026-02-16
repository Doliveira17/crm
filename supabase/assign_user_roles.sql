-- ============================================
-- Script para Inserir Usuários e Atribuir Roles
-- Execute este script como admin no Supabase
-- ============================================

-- 📋 Verificar quais usuários existem em auth.users
SELECT 
  email,
  'EXISTE' as status
FROM auth.users
WHERE email IN ('gestora@hewertonmartins.com.br', 'monitoramento@hewertonmartins.com')
ORDER BY email;

-- ============================================
-- Atribuir roles aos usuários que existem
-- ============================================

-- Verificar e criar/atualizar role para gestora@hewertonmartins.com.br
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role 
FROM auth.users 
WHERE email = 'gestora@hewertonmartins.com.br'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::public.app_role;

-- Verificar e criar/atualizar role para monitoramento@hewertonmartins.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'faturas'::public.app_role 
FROM auth.users 
WHERE email = 'monitoramento@hewertonmartins.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'faturas'::public.app_role;

-- ============================================
-- Visualizar resultado final
-- ============================================
SELECT 
  au.email,
  ur.role,
  ur.created_at,
  ur.updated_at
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
ORDER BY ur.created_at DESC;
