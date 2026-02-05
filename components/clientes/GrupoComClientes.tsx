import { useGruposEconomicos } from '@/lib/hooks/useGruposEconomicos'
import { supabase } from '@/lib/supabase/client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users } from 'lucide-react'
import Link from 'next/link'

interface ClienteDoGrupo {
  id: string
  razao_social: string
  documento: string | null
  tipo_cliente: string | null
  status: string | null
  telefone_principal: string | null
  email_principal: string | null
}

interface GrupoComClientesProps {
  grupoId: string
  grupoNome: string
}

export function GrupoComClientes({ grupoId, grupoNome }: GrupoComClientesProps) {
  const [clientes, setClientes] = useState<ClienteDoGrupo[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const buscarClientes = async () => {
    if (!expanded) {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('crm_clientes')
          .select('id, razao_social, documento, tipo_cliente, status, telefone_principal, email_principal')
          .eq('grupo_economico_id', grupoId)
          .order('razao_social', { ascending: true })

        if (error) throw error
        setClientes(data || [])
      } catch (error) {
        console.error('Erro ao buscar clientes:', error)
      } finally {
        setLoading(false)
      }
    }
    setExpanded(!expanded)
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-100 text-green-800'
      case 'INATIVO': return 'bg-gray-100 text-gray-800'
      case 'PROSPECTO': return 'bg-blue-100 text-blue-800'
      case 'SUSPENSO': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={buscarClientes}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span>{grupoNome}</span>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {expanded ? clientes.length : '?'}
          </Badge>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando clientes...</span>
            </div>
          ) : clientes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum cliente vinculado a este grupo
            </p>
          ) : (
            <div className="space-y-2">
              {clientes.map((cliente) => (
                <Link
                  key={cliente.id}
                  href={`/clientes/${cliente.id}`}
                  className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{cliente.razao_social}</p>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        {cliente.documento && (
                          <span>Doc: {cliente.documento}</span>
                        )}
                        {cliente.telefone_principal && (
                          <span>Tel: {cliente.telefone_principal}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {cliente.tipo_cliente && (
                        <Badge variant="outline">{cliente.tipo_cliente}</Badge>
                      )}
                      {cliente.status && (
                        <Badge className={getStatusColor(cliente.status)}>
                          {cliente.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
