import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tagName: string) => {
      if (!tagName || tagName.trim() === '') {
        throw new Error('Nome da tag não pode ser vazio')
      }
      
      const { data, error } = await supabase
        .from('crm_tags')
        .insert({ nome: tagName.trim() })
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Esta tag já existe')
        }
        throw error
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tags'] })
      toast.success('Tag criada com sucesso!')
    },
    onError: (error: Error) => {
      console.error('Erro ao criar tag:', error)
      toast.error(error.message || 'Erro ao criar tag')
    },
  })
}

export function useAllTags() {
  return useQuery({
    queryKey: ['all-tags'],
    queryFn: async () => {
      // Busca todas as tags cadastradas
      const { data: tags, error: tagsError } = await supabase
        .from('crm_tags')
        .select('nome')
        .order('nome')

      if (tagsError) throw tagsError

      // Busca contagem de uso de cada tag nos clientes
      const { data: clientes, error: clientesError } = await supabase
        .from('crm_clientes')
        .select('tags')
        .not('tags', 'is', null)

      if (clientesError) throw clientesError

      // Conta quantos clientes usam cada tag
      const tagCounts = new Map<string, number>()
      
      clientes?.forEach((cliente) => {
        cliente.tags?.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
        })
      })

      // Combina tags cadastradas com contagem de uso
      return tags?.map(tag => ({
        name: tag.nome,
        count: tagCounts.get(tag.nome) || 0
      })).sort((a, b) => b.count - a.count) || []
    },
  })
}

export function useRenameTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      // Atualiza o nome na tabela crm_tags
      const { error: updateError } = await supabase
        .from('crm_tags')
        .update({ nome: newName })
        .eq('nome', oldName)

      if (updateError) {
        if (updateError.code === '23505') {
          throw new Error('Já existe uma tag com este nome')
        }
        throw updateError
      }

      // Busca todos os clientes que têm a tag antiga
      const { data: clientes, error: fetchError } = await supabase
        .from('crm_clientes')
        .select('id, tags')
        .contains('tags', [oldName])

      if (fetchError) throw fetchError

      // Atualiza cada cliente
      const updates = clientes?.map(async (cliente) => {
        const updatedTags = cliente.tags?.map((tag: string) => 
          tag === oldName ? newName : tag
        )

        const { error } = await supabase
          .from('crm_clientes')
          .update({ tags: updatedTags })
          .eq('id', cliente.id)

        if (error) throw error
      })

      await Promise.all(updates || [])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tags'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Tag renomeada com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao renomear tag:', error)
      toast.error(error.message || 'Erro ao renomear tag')
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tagName: string) => {
      // Busca todos os clientes que têm essa tag
      const { data: clientes, error: fetchError } = await supabase
        .from('crm_clientes')
        .select('id, tags')
        .contains('tags', [tagName])

      if (fetchError) throw fetchError

      // Remove a tag de cada cliente
      const updates = clientes?.map(async (cliente) => {
        const updatedTags = cliente.tags?.filter((tag: string) => tag !== tagName)

        const { error } = await supabase
          .from('crm_clientes')
          .update({ tags: updatedTags })
          .eq('id', cliente.id)

        if (error) throw error
      })

      await Promise.all(updates || [])

      // Remove a tag da tabela crm_tags
      const { error: deleteError } = await supabase
        .from('crm_tags')
        .delete()
        .eq('nome', tagName)

      if (deleteError) throw deleteError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tags'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Tag excluída com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao excluir tag:', error)
      toast.error('Erro ao excluir tag')
    },
  })
}

export function useClientesByTag(tagName: string | null) {
  type ClienteByTagRow = {
    id: string
    razao_social: string
    tipo_cliente: string | null
    documento: string | null
    tags: string[] | null
  }

  return useQuery({
    queryKey: ['clientes-by-tag', tagName],
    queryFn: async () => {
      if (!tagName) return [] as ClienteByTagRow[]

      const { data, error } = await supabase
        .from('crm_clientes')
        .select('id, razao_social, tipo_cliente, documento, tags')
        .contains('tags', [tagName])
        .order('razao_social')
        .returns<ClienteByTagRow[]>()

      if (error) throw error
      return data || []
    },
    enabled: !!tagName,
  })
}
