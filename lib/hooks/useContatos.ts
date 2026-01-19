'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { normalizeDigits, normalizeEmail, normalizeText } from '@/lib/utils/normalize'
import { toast } from 'sonner'

type Contato = Database['public']['Tables']['crm_contatos']['Row']
type ContatoInsert = Database['public']['Tables']['crm_contatos']['Insert']
type ContatoUpdate = Database['public']['Tables']['crm_contatos']['Update']

export function useContatosList(searchTerm = '') {
  return useQuery({
    queryKey: ['contatos', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('crm_contatos')
        .select('*')
        .order('updated_at', { ascending: false })

      if (searchTerm) {
        query = query.or(
          `nome_completo.ilike.%${searchTerm}%,celular.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cargo.ilike.%${searchTerm}%`
        )
      }

      const { data, error } = await query

      if (error) throw error
      return data as Contato[]
    },
    staleTime: 30000, // Cache por 30s
  })
}

export function useContatoById(id: string) {
  return useQuery({
    queryKey: ['contato', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_contatos')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Contato
    },
    enabled: !!id,
  })
}

export function useCreateContato() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contato: ContatoInsert) => {
      const normalized: any = {
        ...contato,
        nome_completo: normalizeText(contato.nome_completo) || '',
        apelido_relacionamento: normalizeText(contato.apelido_relacionamento),
        cargo: normalizeText(contato.cargo),
        celular: normalizeDigits(contato.celular),
        email: normalizeEmail(contato.email),
        observacoes: normalizeText(contato.observacoes),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('crm_contatos')
        .insert(normalized)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] })
      toast.success('Contato criado com sucesso')
    },
    onError: (error) => {
      toast.error('Erro ao criar contato')
      console.error(error)
    },
  })
}

export function useUpdateContato() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ContatoUpdate }) => {
      const normalized: any = {
        ...data,
        nome_completo: data.nome_completo ? normalizeText(data.nome_completo) || '' : undefined,
        apelido_relacionamento: normalizeText(data.apelido_relacionamento),
        cargo: normalizeText(data.cargo),
        celular: normalizeDigits(data.celular),
        email: normalizeEmail(data.email),
        observacoes: normalizeText(data.observacoes),
        updated_at: new Date().toISOString(),
      }

      const { data: updated, error } = await (supabase as any)
        .from('crm_contatos')
        .update(normalized)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] })
      queryClient.invalidateQueries({ queryKey: ['contato', variables.id] })
      toast.success('Contato atualizado com sucesso')
    },
    onError: (error) => {
      toast.error('Erro ao atualizar contato')
      console.error(error)
    },
  })
}

export function useDeleteContato() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_contatos')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] })
      toast.success('Contato excluído com sucesso')
    },
    onError: (error) => {
      toast.error('Erro ao excluir contato')
      console.error(error)
    },
  })
}
