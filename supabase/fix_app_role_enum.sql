-- ======================================================
-- FIX: Atualizar ENUM app_role de 'faturas' para 'limitada'
-- Execute isto em DOIS passos separados no SQL Editor do Supabase
-- ======================================================

-- PASSO 1: Adicionar novo valor 'limitada' ao ENUM app_role
-- Execute PRIMEIRO e aguarde
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'limitada';

-- ======================================================
-- Agora execute o PASSO 2 em um novo script SQL
-- ======================================================
