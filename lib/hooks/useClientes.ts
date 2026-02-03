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
          `razao_social.ilike.%${searchTerm}%,nome_fantasia.ilike.%${searchTerm}%,documento.ilike.%${searchTerm}%,telefone_principal.ilike.%${searchTerm}%,email_principal.ilike.%${searchTerm}%`
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
        razao_social: normalizeText(cliente.razao_social) || '',
        documento: normalizeDigits(cliente.documento),
        telefone_principal: normalizeDigits(cliente.telefone_principal),
        email_principal: normalizeEmail(cliente.email_principal),
        cep: normalizeDigits(cliente.cep),
        nome_fantasia: normalizeText(cliente.nome_fantasia),
        apelido_relacionamento: normalizeText(cliente.apelido_relacionamento),
        logradouro: normalizeText(cliente.logradouro),
        numero: normalizeText(cliente.numero),
        complemento: normalizeText(cliente.complemento),
        bairro: normalizeText(cliente.bairro),
        municipio: normalizeText(cliente.municipio),
        uf: normalizeText(cliente.uf),
        observacoes: normalizeText(cliente.observacoes),
        // Novos campos
        nome_grupo: normalizeText(cliente.nome_grupo),
        status: cliente.status || 'ATIVO',
        tipo_relacionamento: normalizeText(cliente.tipo_relacionamento),
        ins_estadual: normalizeDigits(cliente.ins_estadual),
        emp_redes: normalizeText(cliente.emp_redes),
        data_fundacao: cliente.data_fundacao,
        emp_site: cliente.emp_site,
        ins_municipal: normalizeDigits(cliente.ins_municipal),
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
      const normalized: any = {}
      
      // Só incluir campos que realmente existem
      if (data.razao_social !== undefined) {
        normalized.razao_social = normalizeText(data.razao_social) || ''
      }
      if (data.documento !== undefined) {
        normalized.documento = normalizeDigits(data.documento)
      }
      if (data.telefone_principal !== undefined) {
        normalized.telefone_principal = normalizeDigits(data.telefone_principal)
      }
      if (data.email_principal !== undefined) {
        normalized.email_principal = normalizeEmail(data.email_principal)
      }
      if (data.cep !== undefined) {
        normalized.cep = normalizeDigits(data.cep)
      }
      if (data.nome_fantasia !== undefined) {
        normalized.nome_fantasia = normalizeText(data.nome_fantasia)
      }
      if (data.apelido_relacionamento !== undefined) {
        normalized.apelido_relacionamento = normalizeText(data.apelido_relacionamento)
      }
      if (data.logradouro !== undefined) {
        normalized.logradouro = normalizeText(data.logradouro)
      }
      if (data.numero !== undefined) {
        normalized.numero = normalizeText(data.numero)
      }
      if (data.complemento !== undefined) {
        normalized.complemento = normalizeText(data.complemento)
      }
      if (data.bairro !== undefined) {
        normalized.bairro = normalizeText(data.bairro)
      }
      if (data.municipio !== undefined) {
        normalized.municipio = normalizeText(data.municipio)
      }
      if (data.uf !== undefined) {
        normalized.uf = normalizeText(data.uf)
      }
      if (data.observacoes !== undefined) {
        normalized.observacoes = normalizeText(data.observacoes)
      }
      if (data.tags !== undefined) {
        normalized.tags = data.tags
      }
      if (data.tipo_cliente !== undefined) {
        normalized.tipo_cliente = data.tipo_cliente
      }
      if (data.favorito !== undefined) {
        normalized.favorito = data.favorito
      }
      // Novos campos
      if (data.nome_grupo !== undefined) {
        normalized.nome_grupo = normalizeText(data.nome_grupo)
      }
      if (data.status !== undefined) {
        normalized.status = data.status
      }
      if (data.tipo_relacionamento !== undefined) {
        normalized.tipo_relacionamento = normalizeText(data.tipo_relacionamento)
      }
      if (data.ins_estadual !== undefined) {
        normalized.ins_estadual = normalizeDigits(data.ins_estadual)
      }
      if (data.emp_redes !== undefined) {
        normalized.emp_redes = normalizeText(data.emp_redes)
      }
      if (data.data_fundacao !== undefined) {
        normalized.data_fundacao = data.data_fundacao
      }
      if (data.emp_site !== undefined) {
        normalized.emp_site = data.emp_site
      }
      if (data.ins_municipal !== undefined) {
        normalized.ins_municipal = normalizeDigits(data.ins_municipal)
      }
      
      // Sempre atualizar o timestamp
      normalized.updated_at = new Date().toISOString()

      const { data: updated, error } = await supabase
        .from('crm_clientes')
        .update(normalized)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro do Supabase:', error)
        throw new Error(`Erro ao atualizar cliente: ${error.message}`)
      }
      
      return updated
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] })
      toast.success('Cliente atualizado com sucesso')
    },
    onError: (error: any) => {
      const message = error?.message || 'Erro desconhecido'
      toast.error(message)
      console.error('Erro na mutação:', error)
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
