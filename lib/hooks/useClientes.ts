'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { normalizeDigits, normalizeEmail, normalizeText } from '@/lib/utils/normalize'
import { toast } from 'sonner'

type Cliente = Database['public']['Tables']['crm_clientes']['Row']
type ClienteInsert = Database['public']['Tables']['crm_clientes']['Insert']
type ClienteUpdate = Database['public']['Tables']['crm_clientes']['Update']

export function useClientesList(searchTerm = '') {
  return useQuery({
    queryKey: ['clientes', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('crm_clientes')
        .select('*')
        .order('updated_at', { ascending: false })

      if (searchTerm) {
        query = query.or(
          `nome_cadastro.ilike.%${searchTerm}%,razao_social.ilike.%${searchTerm}%,nome_fantasia.ilike.%${searchTerm}%,documento.ilike.%${searchTerm}%,telefone_principal.ilike.%${searchTerm}%,email_principal.ilike.%${searchTerm}%`
        )
      }

      const { data, error } = await query

      if (error) throw error
      return data as Cliente[]
    },
    staleTime: 30000, // Cache por 30s
  })
}

export function useClienteById(id: string) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_clientes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Cliente
    },
    enabled: !!id,
  })
}

export function useCreateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cliente: ClienteInsert) => {
      const normalized: any = {
        ...cliente,
        nome_cadastro: normalizeText(cliente.nome_cadastro) || '',
        documento: normalizeDigits(cliente.documento),
        telefone_principal: normalizeDigits(cliente.telefone_principal),
        email_principal: normalizeEmail(cliente.email_principal),
        cep: normalizeDigits(cliente.cep),
        razao_social: normalizeText(cliente.razao_social),
        nome_fantasia: normalizeText(cliente.nome_fantasia),
        apelido_relacionamento: normalizeText(cliente.apelido_relacionamento),
        logradouro: normalizeText(cliente.logradouro),
        numero: normalizeText(cliente.numero),
        complemento: normalizeText(cliente.complemento),
        bairro: normalizeText(cliente.bairro),
        municipio: normalizeText(cliente.municipio),
        uf: normalizeText(cliente.uf),
        observacoes: normalizeText(cliente.observacoes),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('crm_clientes')
        .insert(normalized)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente criado com sucesso')
    },
    onError: (error: any) => {
      console.error('Erro detalhado:', error)
      toast.error(`Erro ao criar cliente: ${error?.message || 'Erro desconhecido'}`)
    },
  })
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClienteUpdate }) => {
      const normalized: any = {
        ...data,
        nome_cadastro: data.nome_cadastro ? normalizeText(data.nome_cadastro) || '' : undefined,
        documento: normalizeDigits(data.documento),
        telefone_principal: normalizeDigits(data.telefone_principal),
        email_principal: normalizeEmail(data.email_principal),
        cep: normalizeDigits(data.cep),
        razao_social: normalizeText(data.razao_social),
        nome_fantasia: normalizeText(data.nome_fantasia),
        apelido_relacionamento: normalizeText(data.apelido_relacionamento),
        logradouro: normalizeText(data.logradouro),
        numero: normalizeText(data.numero),
        complemento: normalizeText(data.complemento),
        bairro: normalizeText(data.bairro),
        municipio: normalizeText(data.municipio),
        uf: normalizeText(data.uf),
        observacoes: normalizeText(data.observacoes),
        updated_at: new Date().toISOString(),
      }

      const { data: updated, error } = await (supabase as any)
        .from('crm_clientes')
        .update(normalized)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] })
      toast.success('Cliente atualizado com sucesso')
    },
    onError: (error) => {
      toast.error('Erro ao atualizar cliente')
      console.error(error)
    },
  })
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_clientes')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente excluído com sucesso')
    },
    onError: (error) => {
      toast.error('Erro ao excluir cliente')
      console.error(error)
    },
  })
}
