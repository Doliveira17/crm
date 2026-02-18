'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contatoSchema, ContatoFormData, PreferenciasClienteData } from '@/lib/validators/contato'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Save, Handshake, User, FileText, Plus, X, Instagram, Facebook, Linkedin, Mail, Phone, Clock, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { ClientesVinculadosSection } from './ClientesVinculadosSection'

interface ContatoFormProps {
  initialData?: Partial<ContatoFormData>
  onSubmit: (data: ContatoFormData) => void
  onCancel: () => void
  loading?: boolean
  hideClientsSection?: boolean
}

export function ContatoForm({ initialData, onSubmit, onCancel, loading, hideClientsSection = false }: ContatoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ContatoFormData>({
    resolver: zodResolver(contatoSchema) as any,
    defaultValues: {
      ...initialData,
      canal_relatorio: initialData?.canal_relatorio ?? null,
    },
  })

  const [redesSociais, setRedesSociais] = useState<Array<{ tipo: string; valor: string }>>(() => {
    try {
      return initialData?.pessoa_redes ? JSON.parse(initialData.pessoa_redes as string) : []
    } catch {
      return []
    }
  })
  const [novaRede, setNovaRede] = useState<{ tipo: string; valor: string }>({ tipo: 'instagram', valor: '' })
  const [adicionandoRede, setAdicionandoRede] = useState(false)

  const [prefEmail, setPrefEmail] = useState(initialData?.canal_relatorio?.includes('email') ?? false)
  const [prefWhatsapp, setPrefWhatsapp] = useState(initialData?.canal_relatorio?.includes('whatsapp') ?? false)

  const [activeTab, setActiveTab] = useState<'comunicacao' | 'timeline' | 'historico'>('comunicacao')

  const [clientesVinculados, setClientesVinculados] = useState<PreferenciasClienteData[]>(
    initialData?.clientes_vinculados || []
  )

  // Estado de loading local - independente do prop loading
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Função para marcar alterações
  const markAsChanged = () => {
    setHasChanges(true)
  }

  // Atualizar dados de cliente vinculado
  const handleClienteUpdate = (clienteId: string, data: Partial<PreferenciasClienteData>) => {
    setClientesVinculados((prev) =>
      prev.map((cliente) =>
        cliente.cliente_id === clienteId ? { ...cliente, ...data } : cliente
      )
    )
    markAsChanged()
  }

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
    pessoa_redes: redesSociais,
    clientes_vinculados: clientesVinculados
  })

  // Hook para Ctrl+S salvar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (!isSubmitting) {
          handleSubmit((data: any) => {
            setIsSubmitting(true)
            onSubmit({
              ...data,
              clientes_vinculados: clientesVinculados,
            }).finally(() => setIsSubmitting(false))
          })()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSubmit, onSubmit, isSubmitting])

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
          handleSubmit(async (data: any) => {
            try {
              await onSubmit({
                ...data,
                clientes_vinculados: clientesVinculados,
              })
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
  }, [autoSaveEnabled, hasChanges, isSubmitting, handleSubmit, onSubmit, currentFormData, watch])

  return (
    <form onSubmit={handleSubmit(async (data) => {
      // Construir array de canais de comunicação
      const canaisComun: string[] = []
      if (prefEmail) canaisComun.push('email')
      if (prefWhatsapp) canaisComun.push('whatsapp')

      // Marcar como enviando
      setIsSubmitting(true)

      try {
        // Chamar o handler assíncrono e aguardar
        await onSubmit({
          ...data,
          canal_relatorio: canaisComun.length > 0 ? canaisComun : null,
          clientes_vinculados: clientesVinculados,
        })
      } catch (error) {
        console.error('Erro ao submeter formulário:', error)
      } finally {
        setIsSubmitting(false)
      }
    })} className="space-y-6">
      <div className="space-y-5 p-6 bg-white rounded-lg border border-slate-300">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Informações da Pessoa</h3>
            </div>
          </div>
          {hasChanges && autoSaveEnabled && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Será salvo ao sair
            </div>
          )}
        </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label htmlFor="nome_completo" className="text-sm font-bold text-slate-900">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="nome_completo" 
                placeholder="Ex: Maria Antonia Oliveira"
                className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                {...register('nome_completo')} 
              />
              {errors.nome_completo && (
                <p className="text-sm text-destructive">{errors.nome_completo.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="apelido_relacionamento" className="text-sm font-bold text-slate-900">
                Apelido
              </Label>
              <Input 
                id="apelido_relacionamento" 
                placeholder="Ex: Maria, Noni, Toni..."
                className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                {...register('apelido_relacionamento')} 
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="celular" className="text-sm font-bold text-slate-900">
                Telefone / Celular
              </Label>
              <Input 
                id="celular" 
                placeholder="Ex: (67) 99999-9999"
                className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                {...register('celular')} 
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="data_aniversario" className="text-sm font-bold text-slate-900">
                Data de Aniversário
              </Label>
              <Input 
                id="data_aniversario" 
                type="date" 
                className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                {...register('data_aniversario')} 
              />
            </div>

            <div className="space-y-3 lg:col-span-2">
              <Label className="text-sm font-bold text-slate-900">
                Redes Sociais
              </Label>

              {/* Lista de redes sociais com formulário inline */}
              <div className="flex flex-wrap gap-3 items-start content-start">
                {redesSociais.map((rede, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 hover:shadow-md transition-all"
                    title={rede.valor}
                  >
                    {rede.tipo === 'instagram' && <Instagram className="h-4 w-4 text-pink-600 flex-shrink-0" />}
                    {rede.tipo === 'facebook' && <Facebook className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    {rede.tipo === 'linkedin' && <Linkedin className="h-4 w-4 text-blue-700 flex-shrink-0" />}
                    <span className="text-slate-700 whitespace-nowrap font-medium">{rede.valor}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const novasRedes = redesSociais.filter((_, i) => i !== index)
                        setRedesSociais(novasRedes)
                        setValue('pessoa_redes', novasRedes.length > 0 ? JSON.stringify(novasRedes) : '')
                        markAsChanged()
                      }}
                      className="ml-1 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {/* Formulário inline como badge */}
                {adicionandoRede ? (
                  <div className="w-full p-4 rounded-xl bg-blue-50 border border-blue-300 space-y-3">
                    <Select value={novaRede.tipo} onValueChange={(value) => setNovaRede({ ...novaRede, tipo: value })}>
                      <SelectTrigger className="h-10 w-full text-sm bg-white rounded-lg border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={novaRede.valor}
                      onChange={(e) => setNovaRede({ ...novaRede, valor: e.target.value })}
                      placeholder={
                        novaRede.tipo === 'instagram'
                          ? '@usuario'
                          : novaRede.tipo === 'facebook'
                            ? '/pagina'
                            : '/company/empresa'
                      }
                      className="h-9 w-full text-sm bg-white rounded-lg border-slate-300"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (novaRede.valor.trim()) {
                            const novasRedes = [...redesSociais, novaRede]
                            setRedesSociais(novasRedes)
                            setValue('pessoa_redes', JSON.stringify(novasRedes))
                            setNovaRede({ tipo: 'instagram', valor: '' })
                            setAdicionandoRede(false)
                            markAsChanged()
                          }
                        }
                        if (e.key === 'Escape') {
                          setAdicionandoRede(false)
                          setNovaRede({ tipo: 'instagram', valor: '' })
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (novaRede.valor.trim()) {
                            const novasRedes = [...redesSociais, novaRede]
                            setRedesSociais(novasRedes)
                            setValue('pessoa_redes', JSON.stringify(novasRedes))
                            setNovaRede({ tipo: 'instagram', valor: '' })
                            setAdicionandoRede(false)
                            markAsChanged()
                          }
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm px-4 py-1.5 rounded-lg bg-white border border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        ✓ Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAdicionandoRede(false)
                          setNovaRede({ tipo: 'instagram', valor: '' })
                        }}
                        className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAdicionandoRede(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-dashed border-blue-400 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </button>
                )}
              </div>
            </div>

          </div>
      </div>

      {/* Clientes Vinculados */}
      {!hideClientsSection && clientesVinculados.length > 0 && (
        <ClientesVinculadosSection
          clientes={clientesVinculados}
          onUpdate={handleClienteUpdate}
        />
      )}

      <div className="space-y-4 p-6 bg-white rounded-lg border border-slate-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-slate-50 rounded-lg">
            <FileText className="h-5 w-5 text-yellow-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Observações</h3>
        </div>
          <Textarea
            id="observacoes"
            rows={4}
            placeholder="Informações adicionais sobre o contato..."
            className="resize-none rounded-xl border-slate-200 focus:border-yellow-500 focus:ring-yellow-500 transition-all"
            {...register('observacoes')}
          />
      </div>

      {/* Seção de Abas - Comunicação, Timeline e Histórico */}
      <div className="space-y-5 p-6 bg-white rounded-lg border border-slate-300">
          <div className="flex flex-col gap-8 min-h-[550px]">
          {/* Botões de Abas - Horizontal no Topo */}
          <div className="flex gap-3 items-start flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('comunicacao')}
              className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all font-medium text-xs ${
                activeTab === 'comunicacao'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-slate-300 bg-white hover:border-blue-300 text-slate-600'
              }`}
            >
              <Mail className={`h-6 w-6 mb-1`} />
              <span className="text-center text-xs">E-mail</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('historico')}
              className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all font-medium text-xs ${
                activeTab === 'historico'
                  ? 'border-green-500 bg-green-50 text-green-600'
                  : 'border-slate-300 bg-white hover:border-green-300 text-slate-600'
              }`}
            >
              <MessageSquare className={`h-6 w-6 mb-1`} />
              <span className="text-center text-xs">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all font-medium text-xs ${
                activeTab === 'timeline'
                  ? 'border-purple-500 bg-purple-50 text-purple-600'
                  : 'border-slate-300 bg-white hover:border-purple-300 text-slate-600'
              }`}
            >
              <Clock className={`h-6 w-6 mb-1`} />
              <span className="text-center text-xs">Linha do<br/>Tempo</span>
            </button>
          </div>

          {/* Conteúdo Dinâmico */}
          <div className="flex-1 bg-white border border-slate-300 rounded-lg overflow-hidden flex flex-col min-h-[450px]">
            {/* Comunicação - Layout tipo Email/Inbox */}
            {activeTab === 'comunicacao' && (
              <div className="flex flex-col h-full">
                {/* Header - Lista de E-mails */}
                <div className="border-b border-slate-300 px-6 py-4 bg-white">
                  <h3 className="text-sm font-bold text-slate-900">Preferências de Notificação</h3>
                  <p className="text-xs text-slate-600 mt-1">Configure como deseja receber comunicações</p>
                </div>

                {/* Email Items - Inbox Style */}
                <div className="flex-1 overflow-y-auto">
                  {/* E-mail Option */}
                  <div 
                    onClick={() => {
                      setPrefEmail(!prefEmail)
                      markAsChanged()
                    }}
                    className={`border-b border-slate-300 px-6 py-4 cursor-pointer transition-all hover:bg-slate-50 ${
                      prefEmail 
                        ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        id="pref-email"
                        checked={prefEmail}
                        onCheckedChange={(checked) => {
                          setPrefEmail(!!checked)
                          markAsChanged()
                        }}
                        className="cursor-pointer w-5 h-5"
                      />
                      <div className={`p-2.5 rounded-lg ${prefEmail ? 'bg-blue-200' : 'bg-blue-100'}`}>
                        <Mail className={`h-5 w-5 ${prefEmail ? 'text-blue-600' : 'text-blue-500'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900">Receber E-mails</div>
                        <div className="text-xs text-slate-500 mt-0.5">Comunicações por correio eletrônico</div>
                      </div>
                      {prefEmail && (
                        <div className="text-blue-600 text-xs font-bold">Ativo</div>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp Option */}
                  <div 
                    onClick={() => {
                      setPrefWhatsapp(!prefWhatsapp)
                      markAsChanged()
                    }}
                    className={`border-b border-slate-300 px-6 py-4 cursor-pointer transition-all hover:bg-slate-50 ${
                      prefWhatsapp 
                        ? 'bg-green-50 border-l-4 border-l-green-500' 
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        id="pref-whatsapp"
                        checked={prefWhatsapp}
                        onCheckedChange={(checked) => {
                          setPrefWhatsapp(!!checked)
                          markAsChanged()
                        }}
                        className="cursor-pointer w-5 h-5"
                      />
                      <div className={`p-2.5 rounded-lg ${prefWhatsapp ? 'bg-green-200' : 'bg-green-100'}`}>
                        <Phone className={`h-5 w-5 ${prefWhatsapp ? 'text-green-600' : 'text-green-500'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900">Receber no WhatsApp</div>
                        <div className="text-xs text-slate-500 mt-0.5">Comunicações via WhatsApp</div>
                      </div>
                      {prefWhatsapp && (
                        <div className="text-green-600 text-xs font-bold">Ativo</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Linha do Tempo */}
            {activeTab === 'timeline' && (
              <div className="flex flex-col h-full">
                <div className="px-6 py-4 border-b border-slate-300 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Histórico de Eventos</h3>
                      <p className="text-xs text-slate-600 mt-0.5">Mudanças e atualizações da pessoa</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-green-500 border-3 border-white"></div>
                    <div className="absolute left-1.5 top-6 w-0.5 h-10 bg-slate-300"></div>
                    <div className="bg-white border border-slate-300 p-4 rounded-lg">
                      <div className="text-sm font-semibold text-slate-900">Pessoa criada</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {initialData?.created_at
                          ? new Date(initialData.created_at).toLocaleDateString('pt-BR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Data não disponível'}
                      </div>
                    </div>
                  </div>

                  {initialData?.updated_at && initialData.updated_at !== initialData.created_at && (
                    <div className="relative pl-6">
                      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-500 border-3 border-white"></div>
                      <div className="bg-white border border-slate-300 p-4 rounded-lg">
                        <div className="text-sm font-semibold text-slate-900">Última atualização</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(initialData.updated_at).toLocaleDateString('pt-BR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Histórico/WhatsApp */}
            {activeTab === 'historico' && (
              <div className="flex flex-col h-full">
                <div className="px-6 py-4 border-b border-slate-300 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Conversas WhatsApp</h3>
                      <p className="text-xs text-slate-600 mt-0.5">Histórico de interações</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-1">Sem mensagens</p>
                  <p className="text-xs text-slate-500 max-w-xs">Nenhuma conversa iniciada com esta pessoa</p>
                </div>
              </div>
            )}
            </div>
          </div>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={isSubmitting}
          className="px-6 h-10 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          title="Salvar (Ctrl+S)"
          className="px-6 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? 'Salvando...' : hasChanges ? 'Salvar Alterações' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
