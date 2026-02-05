'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { normalizeDigits, normalizeEmail, normalizeText } from '@/lib/utils/normalize'
import { toast } from 'sonner'

type Cliente = Database['public']['Tables']['crm_clientes']['Row']
type ClienteInsert = Database['public']['Tables']['crm_clientes']['Insert']
type ClienteUpdate = Database['public']['Tables']['crm_clientes']['Update']

export function useClientesList(searchTerm = '', page = 0, pageSize = 100) {
  return useQuery({
    queryKey: ['clientes', searchTerm, page],
    queryFn: async () => {
      const from = page * pageSize
      const to = from + pageSize - 1
      
      let query = supabase
        .from('crm_clientes')
        .select(`
          *,
          grupo_economico:grupos_economicos(id, nome)
        `, { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range(from, to)

      if (searchTerm) {
        // Buscar também pelo nome do grupo econômico
        const { data: grupos } = await supabase
          .from('grupos_economicos')
          .select('id')
          .ilike('nome', `%${searchTerm}%`)
        
        const gruposIds = grupos?.map(g => g.id) || []
        
        if (gruposIds.length > 0) {
          query = query.or(
            `razao_social.ilike.%${searchTerm}%,nome_fantasia.ilike.%${searchTerm}%,documento.ilike.%${searchTerm}%,telefone_principal.ilike.%${searchTerm}%,email_principal.ilike.%${searchTerm}%,grupo_economico_id.in.(${gruposIds.join(',')})`
          )
        } else {
          query = query.or(
            `razao_social.ilike.%${searchTerm}%,nome_fantasia.ilike.%${searchTerm}%,documento.ilike.%${searchTerm}%,telefone_principal.ilike.%${searchTerm}%,email_principal.ilike.%${searchTerm}%`
          )
        }
      }

      const { data, error, count } = await query

      if (error) throw error
      
      // Adicionar nome do grupo econômico aos dados
      const clientesComGrupo = (data || []).map((cliente: any) => ({
        ...cliente,
        grupo_economico_nome: cliente.grupo_economico?.nome || null,
      }))
      
      return {
        clientes: clientesComGrupo as Cliente[],
        total: count || 0
      }
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
        .select(`
          *,
          grupo_economico:grupos_economicos(id, nome)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      
      // Adicionar nome do grupo econômico aos dados
      const clienteComGrupo = {
        ...data,
        grupo_economico_nome: (data as any).grupo_economico?.nome || null,
      }
      
      return clienteComGrupo as Cliente
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
        whatsapp: normalizeDigits(cliente.whatsapp),
        grupo_whatsapp: cliente.grupo_whatsapp,
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
        pais: normalizeText(cliente.pais),
        observacoes: normalizeText(cliente.observacoes),
        observacoes_extras: normalizeText(cliente.observacoes_extras),
        // Novos campos
        nome_grupo: normalizeText(cliente.nome_grupo),
        status: cliente.status || 'ATIVO',
        tipo_relacionamento: normalizeText(cliente.tipo_relacionamento),
        ins_estadual: normalizeDigits(cliente.ins_estadual),
        emp_redes: normalizeText(cliente.emp_redes),
        data_fundacao: cliente.data_fundacao && cliente.data_fundacao.trim() !== '' ? cliente.data_fundacao : null,
        emp_site: cliente.emp_site,
        ins_municipal: normalizeDigits(cliente.ins_municipal),
        grupo_economico_id: cliente.grupo_economico_id || null,
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
      if (data.whatsapp !== undefined) {
        normalized.whatsapp = normalizeDigits(data.whatsapp)
      }
      if (data.grupo_whatsapp !== undefined) {
        normalized.grupo_whatsapp = data.grupo_whatsapp
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
      if (data.pais !== undefined) {
        normalized.pais = normalizeText(data.pais)
      }
      if (data.observacoes !== undefined) {
        normalized.observacoes = normalizeText(data.observacoes)
      }
      if (data.observacoes_extras !== undefined) {
        normalized.observacoes_extras = normalizeText(data.observacoes_extras)
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
        normalized.data_fundacao = data.data_fundacao && data.data_fundacao.trim() !== '' ? data.data_fundacao : null
      }
      if (data.emp_site !== undefined) {
        normalized.emp_site = data.emp_site
      }
      if (data.ins_municipal !== undefined) {
        normalized.ins_municipal = normalizeDigits(data.ins_municipal)
      }
      if (data.grupo_economico_id !== undefined) {
        normalized.grupo_economico_id = data.grupo_economico_id
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
