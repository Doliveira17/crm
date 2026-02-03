'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClientesList } from '@/lib/hooks/useClientes'
import { SearchInput } from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Star, Save } from 'lucide-react'
import { formatPhoneBR, formatDocument } from '@/lib/utils/normalize'
import { formatDate } from '@/lib/utils/format'
import { toast } from 'sonner'

export default function ClientesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const { data: clientes, isLoading } = useClientesList(searchTerm)
  
  // Estado do auto-save global
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('global-auto-save') === 'true'
    }
    return false
  })

  // Persistir configuração do auto-save global
  const toggleAutoSave = () => {
    const newValue = !autoSaveEnabled
    setAutoSaveEnabled(newValue)
    localStorage.setItem('global-auto-save', String(newValue))
    toast.success(`Auto-save ${newValue ? 'ativado' : 'desativado'} para todos os formulários`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerenciar cadastro de clientes</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={autoSaveEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleAutoSave}
            title={`Auto-save global ${autoSaveEnabled ? 'ativado' : 'desativado'}`}
          >
            <Save className="mr-2 h-4 w-4" />
            Auto-save {autoSaveEnabled ? 'ON' : 'OFF'}
          </Button>
          <Link href="/clientes/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nome, documento, telefone ou e-mail..."
          />
        </div>

        {isLoading ? (
          <LoadingState />
        ) : !clientes || clientes.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="Nenhum cliente encontrado"
            description={
              searchTerm
                ? 'Tente ajustar os termos da sua busca'
                : 'Comece criando seu primeiro cliente'
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Atualizado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow
                    key={cliente.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/clientes/${cliente.id}`)}
                  >
                    <TableCell>
                      {cliente.favorito && (
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {cliente.razao_social}
                    </TableCell>
                    <TableCell>
                      {cliente.tipo_cliente && (
                        <Badge variant="outline">{cliente.tipo_cliente}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {cliente.tags?.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {cliente.tags && cliente.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{cliente.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDocument(cliente.documento)}</TableCell>
                    <TableCell>{formatPhoneBR(cliente.telefone_principal)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {cliente.email_principal}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(cliente.updated_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
