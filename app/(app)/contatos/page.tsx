'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useContatosList } from '@/lib/hooks/useContatos'
import { useDebounce } from '@/lib/hooks/useDebounce'
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
import { Plus, UserCircle, Save, AlertCircle } from 'lucide-react'
import { formatPhoneBR } from '@/lib/utils/normalize'
import { formatDate } from '@/lib/utils/format'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'

export default function ContatosPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 400)
  const [showUnlinked, setShowUnlinked] = useState(false)
  const [unlinkedContatosIds, setUnlinkedContatosIds] = useState<Set<string>>(new Set())
  const [loadingUnlinked, setLoadingUnlinked] = useState(false)
  const { data: contatos, isLoading } = useContatosList(debouncedSearch)
  
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

  // Buscar contatos não vinculados
  const handleShowUnlinked = async () => {
    if (showUnlinked) {
      setShowUnlinked(false)
      setUnlinkedContatosIds(new Set())
      return
    }

    setLoadingUnlinked(true)
    try {
	      // Buscar todos os contatos
	      const { data: allContatos, error: contatosError } = await supabase
	        .from('crm_contatos')
	        .select('id')
	        .returns<Array<{ id: string }>>()

      if (contatosError) throw contatosError

	      // Buscar todos os vínculos
	      const { data: vinculos, error: vinculosError } = await supabase
	        .from('crm_clientes_contatos')
	        .select('contato_id')
	        .returns<Array<{ contato_id: string }>>()

      if (vinculosError) throw vinculosError

      // Encontrar contatos sem vínculos
      const contatosVinculadosIds = new Set(vinculos?.map(v => v.contato_id) || [])
      const unlinkedIds = new Set(
        allContatos
          ?.filter(c => !contatosVinculadosIds.has(c.id))
          .map(c => c.id) || []
      )

      setUnlinkedContatosIds(unlinkedIds)
      setShowUnlinked(true)
      
      if (unlinkedIds.size === 0) {
        toast.success('Todos os contatos estão vinculados a clientes')
      } else {
        toast.success(`${unlinkedIds.size} contato(s) não vinculado(s) encontrado(s)`)
      }
    } catch (error) {
      console.error('Erro ao buscar contatos não vinculados:', error)
      toast.error('Erro ao buscar contatos não vinculados')
    } finally {
      setLoadingUnlinked(false)
    }
  }

  // Filtrar contatos não vinculados se ativado
  const displayedContatos = showUnlinked
    ? contatos?.filter(c => unlinkedContatosIds.has(c.id))
    : contatos

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pessoas</h1>
          <p className="text-muted-foreground">Gerenciar cadastro de pessoas</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={showUnlinked ? "default" : "outline"}
            size="sm"
            onClick={handleShowUnlinked}
            disabled={loadingUnlinked}
            title="Mostrar contatos não vinculados a clientes"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            {loadingUnlinked ? 'Buscando...' : showUnlinked ? 'Não Vinculados ✓' : 'Não Vinculados'}
          </Button>
          <Button
            variant={autoSaveEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleAutoSave}
            title={`Auto-save global ${autoSaveEnabled ? 'ativado' : 'desativado'}`}
          >
            <Save className="mr-2 h-4 w-4" />
            Auto-save {autoSaveEnabled ? 'ON' : 'OFF'}
          </Button>
          <Link href="/contatos/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Pessoa
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nome, celular, e-mail ou cargo..."
          />
        </div>

        {isLoading ? (
          <LoadingState />
        ) : !displayedContatos || displayedContatos.length === 0 ? (
          <EmptyState
            icon={<UserCircle className="h-12 w-12" />}
            title="Nenhuma pessoa encontrada"
            description={
              searchTerm
                ? 'Tente ajustar os termos da sua busca'
                : showUnlinked 
                  ? 'Todas as pessoas estão vinculadas a clientes'
                  : 'Comece criando sua primeira pessoa'
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Celular</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Atualizado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedContatos.map((contato) => {
                  const isUnlinked = unlinkedContatosIds.has(contato.id)
                  return (
                    <TableRow
                      key={contato.id}
                      className={`cursor-pointer transition-colors ${
                        isUnlinked ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => router.push(`/contatos/${contato.id}`)}
                    >
                      <TableCell className="font-medium">
                        {contato.nome_completo}
                        {isUnlinked && (
                          <span className="ml-2 inline-block text-xs px-2 py-1 bg-red-200 text-red-700 rounded">
                            Não vinculado
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{contato.cargo}</TableCell>
                      <TableCell>{formatPhoneBR(contato.celular)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {contato.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(contato.updated_at)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
