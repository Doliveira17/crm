'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contatoSchema, ContatoFormData } from '@/lib/validators/contato'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { phoneMask } from '@/lib/utils/masks'
import { Save } from 'lucide-react'
import { toast } from 'sonner'

interface ContatoFormProps {
  initialData?: Partial<ContatoFormData>
  onSubmit: (data: ContatoFormData) => void
  onCancel: () => void
  loading?: boolean
}

export function ContatoForm({ initialData, onSubmit, onCancel, loading }: ContatoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ContatoFormData>({
    resolver: zodResolver(contatoSchema),
    defaultValues: initialData,
  })

  const [celularValue, setCelularValue] = useState(initialData?.celular || '')

  // Estados para auto-save global
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('global-auto-save') === 'true'
    }
    return false
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSavedData, setLastSavedData] = useState<string>('')
  
  // Observar mudanças no formulário
  const watchedValues = watch()
  const currentFormData = JSON.stringify({
    ...watchedValues,
    celular: celularValue
  })

  // Hook para Ctrl+S salvar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (!loading) {
          handleSubmit(onSubmit)()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSubmit, onSubmit, loading])

  // Detectar mudanças no formulário
  useEffect(() => {
    if (!lastSavedData) {
      setLastSavedData(currentFormData)
      return
    }
    
    const changed = currentFormData !== lastSavedData
    setHasChanges(changed)
  }, [currentFormData, lastSavedData])

  // Atualizar configuração global quando mudar
  useEffect(() => {
    const handleStorageChange = () => {
      const globalAutoSave = localStorage.getItem('global-auto-save') === 'true'
      setAutoSaveEnabled(globalAutoSave)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Salvar quando sair da página/aba (mais confiável)
  useEffect(() => {
    const handleSave = async () => {
      if (!autoSaveEnabled || !hasChanges || loading) return

      try {
        // Validar se os dados estão válidos antes de tentar salvar
        const formData = watch()
        if (!formData.nome_completo?.trim()) {
          console.warn('Auto-save cancelado: dados incompletos')
          return
        }

        const isValid = await new Promise((resolve) => {
          handleSubmit(
            () => resolve(true),
            () => resolve(false)
          )()
        })
        
        if (!isValid) {
          console.warn('Auto-save cancelado: validação falhou')
          return
        }

        await new Promise((resolve, reject) => {
          handleSubmit(async (data) => {
            try {
              await onSubmit(data)
              setLastSavedData(currentFormData)
              setHasChanges(false)
              toast.success('Dados salvos automaticamente')
              resolve(true)
            } catch (error) {
              console.warn('Erro ao salvar automaticamente:', error)
              reject(error)
            }
          })()
        })
      } catch (error) {
        console.warn('Erro no auto-save:', error)
      }
    }

    // Detectar quando o usuário sai da aba
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleSave()
      }
    }

    // Detectar navegação interceptando clicks em links  
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link && link.href && link.href !== window.location.href) {
        // Pequeno delay para permitir que o save complete
        setTimeout(handleSave, 10)
      }
    }

    // Detectar botão voltar/avançar
    const handlePopState = () => {
      handleSave()
    }

    // Detectar fechamento da aba
    const handleBeforeUnload = () => {
      if (autoSaveEnabled && hasChanges && !loading) {
        // Versão síncrona para beforeunload
        const formData = watch()
        if (formData.nome_completo?.trim()) {
          navigator.sendBeacon && navigator.sendBeacon('/api/auto-save', JSON.stringify(formData))
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('click', handleLinkClick, true)
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('click', handleLinkClick, true)
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [autoSaveEnabled, hasChanges, loading, handleSubmit, onSubmit, currentFormData, watch])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informações do Contato</CardTitle>
            {hasChanges && autoSaveEnabled && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Será salvo ao sair
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <Input id="nome_completo" {...register('nome_completo')} />
              {errors.nome_completo && (
                <p className="text-sm text-destructive">{errors.nome_completo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apelido_relacionamento">Apelido</Label>
              <Input id="apelido_relacionamento" {...register('apelido_relacionamento')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo/Função</Label>
              <Input
                id="cargo"
                placeholder="Ex: Gerente, Sócio, Esposa..."
                {...register('cargo')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                value={celularValue}
                onChange={(e) => {
                  const masked = phoneMask(e.target.value)
                  setCelularValue(masked)
                  setValue('celular', masked)
                }}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="observacoes"
            rows={4}
            placeholder="Informações adicionais sobre o contato..."
            {...register('observacoes')}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} title="Salvar (Ctrl+S)">
          {loading ? 'Salvando...' : hasChanges ? 'Salvar Alterações' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
