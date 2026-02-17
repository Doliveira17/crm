import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface GrupoEconomico {
  id: string
  nome: string
  descricao: string | null
  created_at: string
  updated_at: string
}

export function useGruposEconomicos() {
  const [grupos, setGrupos] = useState<GrupoEconomico[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Buscar grupos econômicos
  const fetchGrupos = useCallback(async (search?: string) => {
    try {
      setLoading(true)
      let query = supabase
        .from('grupos_economicos')
        .select('*')
        .order('nome', { ascending: true })

      if (search) {
        query = query.ilike('nome', `%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setGrupos(data || [])
      return data || []
    } catch (error: any) {
      console.error('Erro ao buscar grupos econômicos:', error)
      toast.error('Erro ao buscar grupos econômicos')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Buscar ou criar grupo econômico
  const findOrCreateGrupo = useCallback(async (nome: string): Promise<GrupoEconomico | null> => {
    try {
      const nomeTrimmed = nome.trim()
      
      if (!nomeTrimmed) {
        return null
      }

      // Primeiro, tentar buscar o grupo existente
      const { data: existingGrupo, error: searchError } = await supabase
        .from('grupos_economicos')
        .select('*')
        .ilike('nome', nomeTrimmed)
        .single()

      if (existingGrupo) {
        return existingGrupo
      }

      // Se não existe, criar novo grupo
      if (searchError?.code === 'PGRST116') { // Código para "não encontrado"
        const { data: newGrupo, error: insertError } = await supabase
          .from('grupos_economicos')
          .insert({ nome: nomeTrimmed })
          .select()
          .single()

        if (insertError) {
          // Se erro de duplicação, tentar buscar novamente
          if (insertError.code === '23505') {
            const { data: retryGrupo } = await supabase
              .from('grupos_economicos')
              .select('*')
              .ilike('nome', nomeTrimmed)
              .single()
            
            return retryGrupo
          }
          throw insertError
        }

        toast.success(`Grupo econômico "${nomeTrimmed}" criado`)
        return newGrupo
      }

      throw searchError
    } catch (error: any) {
      console.error('Erro ao criar/buscar grupo econômico:', error)
      toast.error('Erro ao processar grupo econômico')
      return null
    }
  }, [])

  // Criar novo grupo econômico
  const createGrupo = async (nome: string, descricao?: string): Promise<GrupoEconomico | null> => {
    try {
      const { data, error } = await supabase
        .from('grupos_economicos')
        .insert({ 
          nome: nome.trim(),
          descricao: descricao?.trim() 
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Grupo econômico criado com sucesso')
      await fetchGrupos()
      return data
    } catch (error: any) {
      console.error('Erro ao criar grupo econômico:', error)
      if (error.code === '23505') {
        toast.error('Já existe um grupo econômico com este nome')
      } else {
        toast.error('Erro ao criar grupo econômico')
      }
      return null
    }
  }

  // Atualizar grupo econômico
  const updateGrupo = async (id: string, nome: string, descricao?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('grupos_economicos')
        .update({ 
          nome: nome.trim(),
          descricao: descricao?.trim() 
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Grupo econômico atualizado com sucesso')
      await fetchGrupos()
      return true
    } catch (error: any) {
      console.error('Erro ao atualizar grupo econômico:', error)
      if (error.code === '23505') {
        toast.error('Já existe um grupo econômico com este nome')
      } else {
        toast.error('Erro ao atualizar grupo econômico')
      }
      return false
    }
  }

  // Deletar grupo econômico
  const deleteGrupo = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('grupos_economicos')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Grupo econômico excluído com sucesso')
      await fetchGrupos()
      return true
    } catch (error: any) {
      console.error('Erro ao excluir grupo econômico:', error)
      toast.error('Erro ao excluir grupo econômico')
      return false
    }
  }

  // Buscar clientes de um grupo
  const getClientesByGrupo = async (grupoId: string) => {
    try {
      const { data, error } = await supabase
        .from('crm_clientes')
        .select('*')
        .eq('grupo_economico_id', grupoId)
        .order('razao_social', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Erro ao buscar clientes do grupo:', error)
      toast.error('Erro ao buscar clientes do grupo')
      return []
    }
  }

  // Buscar inicial
  useEffect(() => {
    fetchGrupos()
  }, [fetchGrupos])

  // Buscar com termo de pesquisa (com debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        fetchGrupos(searchTerm)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, fetchGrupos])

  return {
    grupos,
    loading,
    searchTerm,
    setSearchTerm,
    fetchGrupos,
    findOrCreateGrupo,
    createGrupo,
    updateGrupo,
    deleteGrupo,
    getClientesByGrupo,
  }
}
