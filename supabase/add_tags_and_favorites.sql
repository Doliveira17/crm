-- =============================================
-- SCRIPT: Sistema de Tags e Favoritos
-- =============================================

-- 1. Adicionar campos à tabela crm_clientes
ALTER TABLE public.crm_clientes 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS favorito boolean DEFAULT false;

-- 2. Criar índice para busca por tags
CREATE INDEX IF NOT EXISTS idx_clientes_tags ON public.crm_clientes USING gin(tags);

-- 3. Criar índice para clientes favoritos
CREATE INDEX IF NOT EXISTS idx_clientes_favorito ON public.crm_clientes(favorito) WHERE favorito = true;

-- 4. Função para adicionar tag a um cliente
CREATE OR REPLACE FUNCTION add_tag_to_cliente(cliente_uuid uuid, tag_name text)
RETURNS void AS $$
BEGIN
  UPDATE public.crm_clientes
  SET tags = array_append(tags, tag_name)
  WHERE id = cliente_uuid
  AND NOT (tag_name = ANY(tags));
END;
$$ LANGUAGE plpgsql;

-- 5. Função para remover tag de um cliente
CREATE OR REPLACE FUNCTION remove_tag_from_cliente(cliente_uuid uuid, tag_name text)
RETURNS void AS $$
BEGIN
  UPDATE public.crm_clientes
  SET tags = array_remove(tags, tag_name)
  WHERE id = cliente_uuid;
END;
$$ LANGUAGE plpgsql;

-- 6. Tags predefinidas sugeridas (apenas referência, não aplicadas automaticamente)
-- "Cliente VIP"
-- "Residencial"
-- "Comercial"
-- "Industrial"
-- "Interessado Bateria"
-- "Upsell Potencial"
-- "Lead Quente"
-- "Aguardando Proposta"
-- "Manutenção Programada"

-- =============================================
-- Execute este script no SQL Editor do Supabase
-- =============================================
