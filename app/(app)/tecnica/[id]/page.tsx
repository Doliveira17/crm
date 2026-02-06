'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTecnica } from '@/lib/hooks/useTecnica'
import { ClienteTecnicaForm } from '@/components/tecnica/ClienteTecnicaForm'
import { LoadingState } from '@/components/common/LoadingState'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function TecnicaDetailPage() {
  const router = useRouter()
  const params = useParams()
  const clienteId = params?.id as string

  const { createTecnica, updateTecnica } = useTecnica()
  const [cliente, setCliente] = useState<any>(null)
  const [tecnicaExistente, setTecnicaExistente] = useState<any>(null)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const fetchClienteAndTecnica = async () => {
      try {
        setPageLoading(true)
        
        // Buscar cliente
        const { data: clienteData, error: clienteError } = await supabase
          .from('crm_clientes')
          .select('*')
          .eq('id', clienteId)
          .single()

        if (clienteError) throw clienteError
        setCliente(clienteData)

        // Buscar dados técnicos se existirem
        // @ts-ignore
        const { data: tecnicaData, error: tecnicaError } = await supabase
          .from('crm_clientes_tecnica')
          .select('*')
          .eq('cliente_id', clienteId)
          .maybeSingle()

        if (!tecnicaError && tecnicaData) {
          setTecnicaExistente(tecnicaData)
        }
      } catch (error: any) {
        console.error('Erro ao carregar dados:', error)
        toast.error('Erro ao carregar dados do cliente')
      } finally {
        setPageLoading(false)
      }
    }

    if (clienteId) {
      fetchClienteAndTecnica()
    }
  }, [clienteId])

  const handleSubmit = async (formData: any) => {
    try {
      const dataToSave = {
        ...formData,
        cliente_id: clienteId,
        documento: cliente.documento,
        razao_social: cliente.razao_social,
      }

      if (tecnicaExistente?.id) {
        // Atualizar registro existente
        const { data, error } = await updateTecnica(tecnicaExistente.id, dataToSave)
        if (error) throw new Error(error)
        toast.success('Dados técnicos atualizados com sucesso!')
      } else {
        // Criar novo registro
        const { data, error } = await createTecnica(dataToSave)
        if (error) throw new Error(error)
        toast.success('Dados técnicos cadastrados com sucesso!')
        setTecnicaExistente(data)
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar dados técnicos')
    }
  }

  if (pageLoading) {
    return <LoadingState message="Carregando..." />
  }

  if (!cliente) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>Cliente não encontrado</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const initialData = {
    ...(tecnicaExistente || {}),
    razao_social: cliente.razao_social,
    documento: cliente.documento,
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ClienteTecnicaForm
          tecnica={initialData}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/tecnica')}
        />
      </div>
    </div>
  )
}
