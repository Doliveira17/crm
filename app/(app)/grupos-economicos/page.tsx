'use client'

import { useEffect, useState } from 'react'
import { useGruposEconomicos } from '@/lib/hooks/useGruposEconomicos'
import { GrupoComClientes } from '@/components/clientes/GrupoComClientes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Building2, Search } from 'lucide-react'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'

export default function GruposEconomicosPage() {
  const { grupos, loading, searchTerm, setSearchTerm } = useGruposEconomicos()
  const [localSearch, setLocalSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearch)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, setSearchTerm])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            Grupos Econômicos
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie grupos econômicos e seus clientes vinculados
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar grupos econômicos..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <LoadingState message="Carregando grupos econômicos..." />
      ) : grupos.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title="Nenhum grupo econômico encontrado"
          description={
            searchTerm
              ? "Tente buscar com outros termos"
              : "Grupos econômicos serão criados automaticamente ao cadastrar clientes"
          }
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {grupos.length} grupo{grupos.length !== 1 ? 's' : ''} encontrado{grupos.length !== 1 ? 's' : ''}
          </p>
          
          {grupos.map((grupo) => (
            <GrupoComClientes
              key={grupo.id}
              grupoId={grupo.id}
              grupoNome={grupo.nome}
            />
          ))}
        </div>
      )}
    </div>
  )
}
