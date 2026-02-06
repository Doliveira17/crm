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
      // Construir objeto apenas com campos que existem na tabela
      const normalized: any = {
        razao_social: normalizeText(cliente.razao_social) || '',
        tipo_cliente: cliente.tipo_cliente || 'PJ',
        status: cliente.status || 'ATIVO',
      }

      // Adicionar campos opcionais apenas se tiverem valor
      if (cliente.documento) normalized.documento = normalizeDigits(cliente.documento)
      if (cliente.nome_fantasia) normalized.nome_fantasia = normalizeText(cliente.nome_fantasia)
      if (cliente.apelido_relacionamento) normalized.apelido_relacionamento = normalizeText(cliente.apelido_relacionamento)
      if (cliente.telefone_principal) normalized.telefone_principal = normalizeDigits(cliente.telefone_principal)
      if (cliente.whatsapp) normalized.whatsapp = normalizeDigits(cliente.whatsapp)
      if (cliente.grupo_whatsapp) normalized.grupo_whatsapp = cliente.grupo_whatsapp
      if (cliente.email_principal) normalized.email_principal = normalizeEmail(cliente.email_principal)
      if (cliente.logradouro) normalized.logradouro = normalizeText(cliente.logradouro)
      if (cliente.numero) normalized.numero = normalizeText(cliente.numero)
      if (cliente.complemento) normalized.complemento = normalizeText(cliente.complemento)
      if (cliente.bairro) normalized.bairro = normalizeText(cliente.bairro)
      if (cliente.municipio) normalized.municipio = normalizeText(cliente.municipio)
      if (cliente.uf) normalized.uf = normalizeText(cliente.uf)
      if (cliente.cep) normalized.cep = normalizeDigits(cliente.cep)
      if (cliente.pais) normalized.pais = normalizeText(cliente.pais)
      if (cliente.observacoes) normalized.observacoes = normalizeText(cliente.observacoes)
      if (cliente.observacoes_extras) normalized.observacoes_extras = normalizeText(cliente.observacoes_extras)
      if (cliente.tags) normalized.tags = cliente.tags
      if (cliente.favorito !== undefined) normalized.favorito = cliente.favorito
      if (cliente.nome_grupo) normalized.nome_grupo = normalizeText(cliente.nome_grupo)
      if (cliente.ins_estadual) normalized.ins_estadual = normalizeDigits(cliente.ins_estadual)
      if (cliente.emp_redes) normalized.emp_redes = normalizeText(cliente.emp_redes)
      if (cliente.data_fundacao && cliente.data_fundacao.trim() !== '') {
        normalized.data_fundacao = cliente.data_fundacao
      }
      if (cliente.emp_site && cliente.emp_site.trim() !== '') {
        normalized.emp_site = cliente.emp_site
      }
      if (cliente.ins_municipal) normalized.ins_municipal = normalizeDigits(cliente.ins_municipal)
      if (cliente.grupo_economico_id) normalized.grupo_economico_id = cliente.grupo_economico_id
      
      // Campos novos - apenas adicionar se existirem
      if (cliente.origem) normalized.origem = normalizeText(cliente.origem)
      if (cliente.quem_e) normalized.quem_e = normalizeText(cliente.quem_e)
      if (cliente.cliente_desde && cliente.cliente_desde.trim() !== '') {
        normalized.cliente_desde = cliente.cliente_desde
      }

      normalized.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('crm_clientes')
        .insert(normalized)
        .select()
        .single()

      if (error) {
        console.error('Erro ao inserir cliente:', error)
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente criado com sucesso')
    },
    onError: (error: any) => {
      console.error('Erro detalhado ao criar cliente:', error)
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
      if (data.tipos_relacionamento !== undefined) {
        // tipos_relacionamento é um array, não normalizar como texto
        normalized.tipos_relacionamento = data.tipos_relacionamento
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
      if (data.origem !== undefined) {
        normalized.origem = normalizeText(data.origem)
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
