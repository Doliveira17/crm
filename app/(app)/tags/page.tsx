'use client'

import { useState } from 'react'
import { useAllTags, useCreateTag, useRenameTag, useDeleteTag, useClientesByTag } from '@/lib/hooks/useTags'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchInput } from '@/components/common/SearchInput'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Tag, Pencil, Trash2, Users, Search, TrendingUp, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function TagsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [creatingTag, setCreatingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [editingTag, setEditingTag] = useState<{ oldName: string; newName: string } | null>(null)
  const [deletingTag, setDeletingTag] = useState<string | null>(null)

  const { data: tags, isLoading } = useAllTags()
  const { data: clientesWithTag } = useClientesByTag(selectedTag)
  const createTagMutation = useCreateTag()
  const renameTagMutation = useRenameTag()
  const deleteTagMutation = useDeleteTag()

  const filteredTags = tags?.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateTag = () => {
    if (!newTagName.trim()) return

    createTagMutation.mutate(newTagName.trim(), {
      onSuccess: () => {
        setCreatingTag(false)
        setNewTagName('')
      },
    })
  }

  const handleRenameTag = () => {
    if (!editingTag || !editingTag.newName.trim()) return

    renameTagMutation.mutate(
      { oldName: editingTag.oldName, newName: editingTag.newName.trim() },
      {
        onSuccess: () => {
          setEditingTag(null)
          if (selectedTag === editingTag.oldName) {
            setSelectedTag(editingTag.newName.trim())
          }
        },
      }
    )
  }

  const handleDeleteTag = () => {
    if (!deletingTag) return

    deleteTagMutation.mutate(deletingTag, {
      onSuccess: () => {
        setDeletingTag(null)
        if (selectedTag === deletingTag) {
          setSelectedTag(null)
        }
      },
    })
  }

  if (isLoading) {
    return <LoadingState message="Carregando tags..." />
  }

  const totalTags = tags?.length || 0
  const totalUsage = tags?.reduce((sum, tag) => sum + tag.count, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as tags utilizadas para organizar seus clientes
          </p>
        </div>
        <Button onClick={() => setCreatingTag(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Tag
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTags}</div>
            <p className="text-xs text-muted-foreground">
              Tags únicas no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              Vezes que tags foram aplicadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Uso</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalTags > 0 ? (totalUsage / totalTags).toFixed(1) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes por tag em média
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar tags..."
          />
        </div>
      </div>

      {/* Lista de Tags */}
	      {!filteredTags || filteredTags.length === 0 ? (
	        <EmptyState
	          icon={<Tag className="h-12 w-12" />}
	          title={searchQuery ? 'Nenhuma tag encontrada' : 'Nenhuma tag cadastrada'}
	          description={
	            searchQuery
	              ? 'Tente buscar por outro termo'
              : 'As tags serão exibidas aqui quando você adicionar tags aos clientes'
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Lista de tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags Disponíveis</CardTitle>
              <CardDescription>
                {filteredTags.length} {filteredTags.length === 1 ? 'tag' : 'tags'} {searchQuery && 'encontrada(s)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredTags.map((tag) => (
                  <div
                    key={tag.name}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-accent cursor-pointer ${
                      selectedTag === tag.name ? 'bg-accent border-primary' : ''
                    }`}
                    onClick={() => setSelectedTag(tag.name)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge variant="secondary" className="shrink-0">
                        {tag.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {tag.count} {tag.count === 1 ? 'cliente' : 'clientes'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingTag({ oldName: tag.name, newName: tag.name })
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingTag(tag.name)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detalhes da tag selecionada */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Tag</CardTitle>
              <CardDescription>
                {selectedTag ? `Clientes com a tag "${selectedTag}"` : 'Selecione uma tag para ver os detalhes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedTag ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Clique em uma tag para ver os clientes associados
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-4 border-b">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {selectedTag}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {clientesWithTag?.length || 0} {clientesWithTag?.length === 1 ? 'cliente' : 'clientes'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {clientesWithTag?.map((cliente) => (
                      <Link
                        key={cliente.id}
                        href={`/clientes/${cliente.id}`}
                        className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{cliente.razao_social}</p>
                            {cliente.documento && (
                              <p className="text-sm text-muted-foreground">{cliente.documento}</p>
                            )}
                          </div>
                          {cliente.tipo_cliente && (
                            <Badge variant="outline">{cliente.tipo_cliente}</Badge>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog de Renomear */}
      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Tag</DialogTitle>
            <DialogDescription>
              Esta ação irá renomear a tag em todos os clientes que a utilizam.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="oldName">Nome atual</Label>
              <Input
                id="oldName"
                value={editingTag?.oldName || ''}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newName">Novo nome</Label>
              <Input
                id="newName"
                value={editingTag?.newName || ''}
                onChange={(e) =>
                  setEditingTag(prev => prev ? { ...prev, newName: e.target.value } : null)
                }
                placeholder="Digite o novo nome da tag"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTag(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRenameTag}
              disabled={!editingTag?.newName.trim() || renameTagMutation.isPending}
            >
              {renameTagMutation.isPending ? 'Renomeando...' : 'Renomear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criar */}
      <Dialog open={creatingTag} onOpenChange={(open) => !open && setCreatingTag(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Tag</DialogTitle>
            <DialogDescription>
              Crie uma nova tag que poderá ser usada para organizar seus clientes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tagName">Nome da tag</Label>
              <Input
                id="tagName"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Digite o nome da tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTagName.trim()) {
                    handleCreateTag()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingTag(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || createTagMutation.isPending}
            >
              {createTagMutation.isPending ? 'Criando...' : 'Criar Tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Excluir */}
      <ConfirmDialog
        open={!!deletingTag}
        onOpenChange={(open) => !open && setDeletingTag(null)}
        title="Excluir Tag"
        description={`Tem certeza que deseja excluir a tag "${deletingTag}"? Esta ação irá remover a tag de todos os clientes que a utilizam.`}
        onConfirm={handleDeleteTag}
        confirmText={deleteTagMutation.isPending ? 'Excluindo...' : 'Excluir'}
        variant="destructive"
        disabled={deleteTagMutation.isPending}
      />
    </div>
  )
}
