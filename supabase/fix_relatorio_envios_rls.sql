-- Script para corrigir RLS na tabela relatorio_envios
-- Execute este script no SQL Editor do Supabase

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar relatórios" ON public.relatorio_envios;
DROP POLICY IF EXISTS "Acesso público para visualizar relatórios" ON public.relatorio_envios;
DROP POLICY IF EXISTS "Usuários autenticados podem criar relatórios" ON public.relatorio_envios;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar relatórios" ON public.relatorio_envios;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar relatórios" ON public.relatorio_envios;

-- Criar políticas que permitem acesso total
-- SELECT: Acesso público (anônimo + autenticado)
CREATE POLICY "Acesso público para visualizar relatórios"
ON public.relatorio_envios
FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT: Apenas autenticados
CREATE POLICY "Usuários autenticados podem criar relatórios"
ON public.relatorio_envios
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Apenas autenticados
CREATE POLICY "Usuários autenticados podem atualizar relatórios"
ON public.relatorio_envios
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Apenas autenticados
CREATE POLICY "Usuários autenticados podem deletar relatórios"
ON public.relatorio_envios
FOR DELETE
TO authenticated
USING (true);

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'relatorio_envios';
