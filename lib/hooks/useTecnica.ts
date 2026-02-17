'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ClienteTecnicaFormData } from '@/lib/validators/clienteTecnica'

type TecnicaPayload = Partial<ClienteTecnicaFormData>

const sanitizeTecnicaPayload = (formData: TecnicaPayload): TecnicaPayload => {
  const payload: Record<string, unknown> = { ...formData }

  const nullableStringFields: Array<keyof ClienteTecnicaFormData> = [
    'razao_social',
    'nome_planta',
    'modalidade',
    'classificacao',
    'data_install',
    'venc_garantia',
    'garantia_extendida',
    'tipo_local',
    'marca_inverter',
    'mod_inverter',
    'serie_inverter',
    'marca_modulos',
    'mod_modulos',
  ]

  const nullableNumberFields: Array<keyof ClienteTecnicaFormData> = [
    'potencia_usina_kwp',
    'quant_inverter',
    'quant_modulos',
  ]

  nullableStringFields.forEach((field) => {
    const value = payload[field]
    if (typeof value === 'string') {
      const trimmedValue = value.trim()
      payload[field] = trimmedValue === '' ? null : trimmedValue
    }
  })

  nullableNumberFields.forEach((field) => {
    const value = payload[field]
    if (
      value === '' ||
      value === null ||
      value === undefined ||
      (typeof value === 'number' && Number.isNaN(value))
    ) {
      payload[field] = null
    }
  })

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as TecnicaPayload
}

export function useTecnica() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar todos os clientes e seus dados técnicos
  useEffect(() => {
    const fetchTecnica = async () => {
      try {
        setIsLoading(true)
        
        // OTIMIZAÇÃO: Usar LEFT JOIN para fazer 1 query ao invés de 2
        const { data: clientes, error: clientesError } = await supabase
          .from('crm_clientes')
          .select(`
            id,
            razao_social,
            documento,
            telefone_principal,
            email_principal,
            updated_at,
            tecnica:crm_clientes_tecnica(
              id,
              nome_planta,
              modalidade,
              classificacao,
              tipo_local,
              possui_internet,
              data_install,
              venc_garantia,
              garantia_extendida,
              potencia_usina_kwp,
              quant_inverter,
              marca_inverter,
              mod_inverter,
              serie_inverter,
              quant_modulos,
              marca_modulos,
              mod_modulos
            )
          `)
          .order('updated_at', { ascending: false })

        if (clientesError) throw clientesError

        // Transformar resposta do JOIN
        const merged = clientes?.map((cliente: any) => {
          // tecnica pode ser array (múltiplos registros) ou objeto/null (único/nenhum)
          const tecnica = Array.isArray(cliente.tecnica) 
            ? cliente.tecnica[0] 
            : cliente.tecnica

          return {
            id: cliente.id,
            cliente_id: cliente.id,
            razao_social: cliente.razao_social,
            documento: cliente.documento,
            telefone_principal: cliente.telefone_principal,
            email_principal: cliente.email_principal,
            // Dados técnicos (se existir)
            tecnica_id: tecnica?.id,
            nome_planta: tecnica?.nome_planta,
            modalidade: tecnica?.modalidade,
            classificacao: tecnica?.classificacao,
            tipo_local: tecnica?.tipo_local,
            possui_internet: tecnica?.possui_internet || false,
            data_install: tecnica?.data_install,
            venc_garantia: tecnica?.venc_garantia,
            garantia_extendida: tecnica?.garantia_extendida,
            potencia_usina_kwp: tecnica?.potencia_usina_kwp,
            quant_inverter: tecnica?.quant_inverter,
            marca_inverter: tecnica?.marca_inverter,
            mod_inverter: tecnica?.mod_inverter,
            serie_inverter: tecnica?.serie_inverter,
            quant_modulos: tecnica?.quant_modulos,
            marca_modulos: tecnica?.marca_modulos,
            mod_modulos: tecnica?.mod_modulos,
          }
        })

        setData(merged || [])
        setError(null)
      } catch (err: any) {
        setError(err.message)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTecnica()
  }, [])

  // Buscar técnica por ID
  const getTecnicaById = async (id: string) => {
    try {
      const { data, error: err } = await supabase
        .from('crm_clientes_tecnica')
        .select('*')
        .eq('id', id)
        .single()

      if (err) throw err
      return data
    } catch (err: any) {
      console.error('Erro ao buscar técnica:', err.message)
      return null
    }
  }

  // Buscar técnica por documento
  const getTecnicaByDocumento = async (documento: string) => {
    try {
      const { data, error: err } = await supabase
        .from('crm_clientes_tecnica')
        .select('*')
        .eq('documento', documento)
        .single()

      if (err) throw err
      return data
    } catch (err: any) {
      console.error('Erro ao buscar técnica por documento:', err.message)
      return null
    }
  }

  // Criar técnica
  const createTecnica = async (formData: ClienteTecnicaFormData) => {
    try {
      const payload = sanitizeTecnicaPayload(formData)

      const { data: newData, error: err } = await supabase
        .from('crm_clientes_tecnica')
        .insert(payload as any)
        .select()
        .single()

      if (err) {
        console.error('Erro ao inserir técnica:', err)
        throw err
      }
      return { data: newData, error: null }
    } catch (err: any) {
      console.error('Erro ao criar técnica:', err.message)
      return { data: null, error: err.message }
    }
  }

  // Atualizar técnica
  const updateTecnica = async (id: string, formData: Partial<ClienteTecnicaFormData>) => {
    try {
      const payload = sanitizeTecnicaPayload(formData)

      const { data: updatedData, error: err } = await supabase
        .from('crm_clientes_tecnica')
        .update(payload as any)
        .eq('id', id)
        .select()
        .single()

      if (err) {
        console.error('Erro ao atualizar técnica:', err)
        throw err
      }
      // Atualizar estado local
      if (updatedData) {
        setData(prevData => prevData.map(item => item.id === id ? { ...item, ...updatedData } : item))
      }
      return { data: updatedData, error: null }
    } catch (err: any) {
      console.error('Erro ao atualizar técnica:', err.message)
      return { data: null, error: err.message }
    }
  }

  return {
    data,
    isLoading,
    error,
    getTecnicaById,
    getTecnicaByDocumento,
    createTecnica,
    updateTecnica,
  }
}
