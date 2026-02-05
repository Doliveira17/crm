'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useGruposEconomicos, GrupoEconomico } from '@/lib/hooks/useGruposEconomicos'
import { Building2, ChevronDown, Plus, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { toast } from 'sonner'

interface GrupoEconomicoSelectorProps {
  value?: string | null
  grupoNome?: string | null
  onChange: (grupoId: string | null, grupoNome: string | null) => void
  disabled?: boolean
  error?: string
}

export function GrupoEconomicoSelector({ 
  value, 
  grupoNome,
  onChange, 
  disabled = false,
  error 
}: GrupoEconomicoSelectorProps) {
  const [inputValue, setInputValue] = useState(grupoNome || '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { grupos, loading, findOrCreateGrupo, deleteGrupo } = useGruposEconomicos()

  // Filtrar grupos com useMemo para melhor performance
  const filteredGrupos = useMemo(() => {
    if (!inputValue.trim()) {
      return grupos.slice(0, 10) // Mostrar apenas 10 primeiros
    }

    const searchTerm = inputValue.toLowerCase().trim()
    return grupos.filter(grupo => 
      grupo.nome.toLowerCase().includes(searchTerm)
    )
  }, [inputValue, grupos])

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Atualizar valor inicial
  useEffect(() => {
    if (grupoNome && grupoNome !== inputValue) {
      setInputValue(grupoNome)
    }
  }, [grupoNome, inputValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setShowSuggestions(true)
    
    // Se limpar o campo, remover o grupo
    if (!newValue.trim()) {
      onChange(null, null)
    }
  }

  const handleSelectGrupo = (grupo: GrupoEconomico) => {
    setInputValue(grupo.nome)
    onChange(grupo.id, grupo.nome)
    setShowSuggestions(false)
  }

  const handleBlur = async () => {
    // Pequeno delay para permitir clique nas sugestões
    setTimeout(async () => {
      if (!showSuggestions && inputValue.trim()) {
        // Se digitou algo, buscar ou criar o grupo
        const grupo = await findOrCreateGrupo(inputValue)
        if (grupo) {
          setInputValue(grupo.nome)
          onChange(grupo.id, grupo.nome)
        }
      }
    }, 200)
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setShowSuggestions(false)
      
      if (inputValue.trim()) {
        const grupo = await findOrCreateGrupo(inputValue)
        if (grupo) {
          setInputValue(grupo.nome)
          onChange(grupo.id, grupo.nome)
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleClear = () => {
    setInputValue('')
    onChange(null, null)
    inputRef.current?.focus()
  }

  const handleDelete = async () => {
    if (!value) return
    
    try {
      const success = await deleteGrupo(value)
      if (success) {
        setInputValue('')
        onChange(null, null)
        setShowDeleteDialog(false)
        toast.success('Grupo econômico excluído com sucesso')
      }
    } catch (error) {
      console.error('Erro ao excluir grupo:', error)
      toast.error('Erro ao excluir grupo econômico')
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="grupo_economico" className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Grupo Econômico
      </Label>
      
      <div className="relative" ref={wrapperRef}>
        <div className="relative">
          <Input
            ref={inputRef}
            id="grupo_economico"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Digite para buscar ou criar um grupo..."
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
          
          {inputValue && !disabled && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteDialog(true)
                  }}
                  className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                  title="Excluir grupo econômico"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 hover:bg-transparent"
                title="Limpar campo"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            </div>
          )}
        </div>

        {/* Sugestões */}
        {showSuggestions && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                Carregando...
              </div>
            ) : filteredGrupos.length > 0 ? (
              <div className="py-1">
                {filteredGrupos.map((grupo) => (
                  <button
                    key={grupo.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
                    onMouseDown={(e) => {
                      e.preventDefault() // Prevenir blur antes do click
                      handleSelectGrupo(grupo)
                    }}
                  >
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{grupo.nome}</span>
                  </button>
                ))}
              </div>
            ) : inputValue.trim() ? (
              <div className="p-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Plus className="h-4 w-4" />
                  <span>Nenhum grupo encontrado</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Pressione Enter para criar: <strong>{inputValue}</strong>
                </div>
              </div>
            ) : (
              <div className="p-3 text-sm text-muted-foreground text-center">
                Digite para buscar grupos econômicos
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Digite o nome do grupo. Se não existir, será criado automaticamente.
      </p>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Excluir Grupo Econômico"
        description={`Tem certeza que deseja excluir o grupo "${grupoNome}"? Todos os clientes vinculados perderão a associação com este grupo.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  )
}
