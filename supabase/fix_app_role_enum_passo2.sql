-- ======================================================
-- PASSO 2: Converter dados de 'faturas' para 'limitada'
-- Execute DEPOIS do PASSO 1 (após aguardar)
-- ======================================================

-- 1. Converter qualquer linha 'faturas' existente para 'limitada'
UPDATE public.user_roles 
SET role = 'limitada'::public.app_role 
WHERE role = 'faturas'::public.app_role;

-- 2. Verificar resultado
SELECT DISTINCT role FROM public.user_roles ORDER BY role;

-- 3. Confirmar contagem
SELECT COUNT(*) as total_usuarios, role 
FROM public.user_roles 
GROUP BY role;
