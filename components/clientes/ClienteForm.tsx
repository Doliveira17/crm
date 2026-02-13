'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clienteSchema, ClienteFormData } from '@/lib/validators/cliente'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { phoneMask, documentMask, cepMask } from '@/lib/utils/masks'
import { TagsSelector } from './TagsSelector'
import { GrupoEconomicoSelector } from './GrupoEconomicoSelector'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Building2, User, MapPin, Phone, FileText, Save, Star, ShieldAlert, Handshake, Plus, X, Linkedin, Instagram, Facebook } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ClienteFormProps {
  cliente?: any
  initialData?: any
  onSubmit: (data: ClienteFormData) => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export function ClienteForm({ cliente, initialData, onSubmit, onCancel, loading }: ClienteFormProps) {
  const router = useRouter()
  const cepTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousClienteRef = useRef(initialData || cliente)
  
  // Usar initialData se fornecido, senão cliente
  const clienteData = initialData || cliente
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    trigger,
    reset,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipo_cliente: 'PJ',
      status: 'ATIVO',
      pais: 'Brasil',
      ...clienteData,
    },
    mode: 'onBlur', // Validar apenas ao sair do campo
  })

  // Estados locais
  const [documentoValue, setDocumentoValue] = useState<string>(clienteData?.documento || '')
  const [telefoneValue, setTelefoneValue] = useState<string>(clienteData?.telefone_principal || '')
  const [whatsappValue, setWhatsappValue] = useState<string>(clienteData?.whatsapp || '')
  const [grupoWhatsappValue, setGrupoWhatsappValue] = useState<string>(clienteData?.grupo_whatsapp || '')
  const [usGrupoWhatsappValue, setUsGrupoWhatsappValue] = useState<string>(clienteData?.us_grupo_whatsapp || '')
  const [cepValue, setCepValue] = useState<string>(clienteData?.cep || '')
  const [tags, setTags] = useState<string[]>(clienteData?.tags || [])
  const [hasChanges, setHasChanges] = useState(false)
  const [savedRecently, setSavedRecently] = useState(false)
  const [grupoEconomicoId, setGrupoEconomicoId] = useState<string | null>(clienteData?.grupo_economico_id || null)
  const [grupoEconomicoNome, setGrupoEconomicoNome] = useState<string | null>(clienteData?.grupo_economico_nome || null)
  const [tiposRelacionamento, setTiposRelacionamento] = useState<string[]>(clienteData?.tipos_relacionamento || [])
  const previousStatusRef = useRef<string | null | undefined>(clienteData?.status)
  const isInitialMount = useRef(true)
  const userEditedGrupoId = useRef(false) // Flag para saber se usuário editou o ID do grupo
  
  // Estado persistente para o ID do grupo que não é afetado pelo reset
  const [persistentUsGrupoWhatsapp, setPersistentUsGrupoWhatsapp] = useState<string>(clienteData?.us_grupo_whatsapp || '')
  
  // Estado para redes sociais
  const [redesSociais, setRedesSociais] = useState<Array<{tipo: string, valor: string}>>(() => {
    try {
      return clienteData?.emp_redes ? JSON.parse(clienteData.emp_redes) : []
    } catch {
      return []
    }
  })
  const [novaRede, setNovaRede] = useState<{tipo: string, valor: string}>({tipo: 'instagram', valor: ''})
  const [adicionandoRede, setAdicionandoRede] = useState(false)

  const tipoCliente = watch('tipo_cliente')
  const statusCliente = watch('status')
  const isBlocked = statusCliente === 'BLOQUEADO'

  // Sincronizar estados do ID do grupo
  useEffect(() => {
    // Se o usuário editou, manter o valor persistente
    if (userEditedGrupoId.current) {
      setUsGrupoWhatsappValue(persistentUsGrupoWhatsapp)
    } else {
      // Se não editou, usar o valor do banco
      const valorBanco = clienteData?.us_grupo_whatsapp || ''
      setPersistentUsGrupoWhatsapp(valorBanco)
      setUsGrupoWhatsappValue(valorBanco)
    }
  }, [clienteData?.us_grupo_whatsapp, persistentUsGrupoWhatsapp])

  // Rastrear mudanças de forma mais eficiente
  const markAsChanged = useCallback(() => {
    setHasChanges(true)
    setSavedRecently(false)
  }, [])

  // Resetar formulário quando clienteData mudar
  useEffect(() => {
    if (clienteData && clienteData !== previousClienteRef.current) {
      previousClienteRef.current = clienteData
      const formData = {
        tipo_cliente: clienteData.tipo_cliente || 'PJ',
        status: clienteData.status || 'ATIVO',
        pais: clienteData.pais || 'Brasil',
        ...clienteData,
      }
      
      reset(formData)
      
      // Atualizar estados locais com fallback garantido
      // Mas preservar valores já digitados pelo usuário se não há valor no banco
      setDocumentoValue(clienteData?.documento ?? '')
      setTelefoneValue(clienteData?.telefone_principal ?? '')
      setWhatsappValue(clienteData?.whatsapp ?? '')
      setGrupoWhatsappValue(clienteData?.grupo_whatsapp ?? '')
      
      // Para us_grupo_whatsapp, só resetar se há um valor no banco ou se o usuário não editou
      if (clienteData?.us_grupo_whatsapp !== undefined && !userEditedGrupoId.current) {
        setUsGrupoWhatsappValue(clienteData.us_grupo_whatsapp ?? '')
      }
      
      setCepValue(clienteData?.cep ?? '')
      setTags(clienteData.tags || [])
      setGrupoEconomicoId(clienteData.grupo_economico_id || null)
      setGrupoEconomicoNome(clienteData.grupo_economico_nome || null)
      setTiposRelacionamento(clienteData.tipos_relacionamento || [])
      previousStatusRef.current = clienteData.status
      setHasChanges(false)
      
      // Reset da flag se os dados vieram do banco e já tem o valor salvo
      if (clienteData?.us_grupo_whatsapp) {
        userEditedGrupoId.current = false
      }
    }
  }, [clienteData?.id, reset])

  // Salvar automaticamente quando status for alterado para BLOQUEADO
  useEffect(() => {
    // Pular na montagem inicial
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Verificar se o status mudou para BLOQUEADO
    if (statusCliente === 'BLOQUEADO' && previousStatusRef.current !== 'BLOQUEADO' && clienteData) {
      toast.info('Cliente bloqueado. Salvando automaticamente...')
      handleSubmit(handleFormSubmit)()
    }

    // Atualizar o status anterior
    previousStatusRef.current = statusCliente
  }, [statusCliente, clienteData?.id, handleSubmit])

  // Buscar CEP automático com debounce
  const buscarCepFunc = useCallback(async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        if (response.ok) {
          const data = await response.json()
          if (!data.erro) {
            setValue('logradouro', data.logradouro || '')
            setValue('bairro', data.bairro || '')
            setValue('municipio', data.localidade || '')
            setValue('uf', data.uf || '')
            toast.success('CEP encontrado!')
          }
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      }
    }
  }, [setValue])

  // Função de CEP com debounce
  const handleCepChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = cepMask(e.target.value)
    setCepValue(masked)
    setValue('cep', masked)
    markAsChanged()
    
    // Limpar timeout anterior
    if (cepTimeoutRef.current) {
      clearTimeout(cepTimeoutRef.current)
    }
    
    // Buscar CEP após 500ms de inatividade
    if (masked.length === 9) {
      cepTimeoutRef.current = setTimeout(() => {
        buscarCepFunc(masked)
      }, 500)
    }
  }, [setValue, markAsChanged, buscarCepFunc])

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (cepTimeoutRef.current) {
        clearTimeout(cepTimeoutRef.current)
      }
    }
  }, [])

  // Sincronizar tiposRelacionamento com o formulário
  useEffect(() => {
    setValue('tipos_relacionamento', tiposRelacionamento as any)
  }, [tiposRelacionamento, setValue])

  // Função de submissão com memoização
  const handleFormSubmit = useCallback(async (data: ClienteFormData) => {
    // Usar sempre o valor persistente se foi editado, senão usar o estado normal
    const valorFinalGrupoId = userEditedGrupoId.current ? persistentUsGrupoWhatsapp : usGrupoWhatsappValue
    
    // Usar sempre os valores dos estados, não o valor do react-hook-form
    const finalData = {
      ...data,
      documento: documentoValue,
      telefone_principal: telefoneValue,
      whatsapp: whatsappValue,
      grupo_whatsapp: grupoWhatsappValue,
      us_grupo_whatsapp: valorFinalGrupoId,
      cep: cepValue,
      tags,
      grupo_economico_id: grupoEconomicoId,
      tipos_relacionamento: tiposRelacionamento.length > 0 ? tiposRelacionamento : null,
    }
    
    try {
      await onSubmit(finalData)
      
      // Após salvar com sucesso, resetar a flag de edição do usuário
      userEditedGrupoId.current = false
      
      // Mostrar indicador "Salvo" por 3 segundos após sucesso
      setSavedRecently(true)
      setHasChanges(false)
      setTimeout(() => {
        setSavedRecently(false)
      }, 3000)
    } catch (error: any) {
      // Em caso de erro, não mostrar "Salvo"
      console.error('Erro ao salvar cliente:', error)
      const errorMessage = error?.message || 'Erro ao salvar cliente'
      toast.error(errorMessage)
    }
  }, [
    documentoValue, 
    telefoneValue, 
    whatsappValue, 
    grupoWhatsappValue, 
    usGrupoWhatsappValue,
    persistentUsGrupoWhatsapp, // Adicionar nova dependência
    cepValue, 
    tags, 
    grupoEconomicoId, 
    tiposRelacionamento,
    onSubmit
  ])

  // Se não há dados ainda e não é um novo cliente, mostrar loading
  if (!clienteData && (initialData !== undefined || cliente !== undefined)) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              <span>Carregando dados do cliente...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto p-4 md:p-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card className="w-full shadow-sm rounded-xl overflow-hidden border border-slate-200">
          <CardHeader className="pb-5 border-b border-slate-200 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-3 text-xl md:text-2xl font-semibold">
                {tipoCliente === 'PJ' ? (
                  <div className="p-2 bg-slate-50 rounded-lg border border-blue-200">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                ) : (
                  <div className="p-2 bg-slate-50 rounded-lg border border-blue-200">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                )}
                <span className="truncate">
                  {tipoCliente === 'PJ' ? 'Pessoa Jurídica' : tipoCliente === 'PF' ? 'Pessoa Física' : 'Novo Cliente'}
                </span>
              </CardTitle>
              
              {hasChanges && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-4 py-2 rounded-full border border-amber-300">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  Alterações não salvas
                </div>
              )}
              {!hasChanges && savedRecently && (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-4 py-2 rounded-full border border-green-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Salvo
                </div>
              )}
            </div>
          </CardHeader>

          {/* ALERTA DE CLIENTE BLOQUEADO */}
          {isBlocked && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-red-900 mb-1">Cliente Bloqueado</h3>
                  <p className="text-sm text-red-700">
                    Este cliente está <strong>BLOQUEADO</strong>. Todos os dados estão protegidos contra edição. 
                    Para modificar qualquer informação, primeiro altere o status para outra opção.
                  </p>
                </div>
                <Badge variant="destructive" className="whitespace-nowrap flex-shrink-0">
                  BLOQUEADO
                </Badge>
              </div>
            </div>
          )}

          <CardContent className="p-8 space-y-10">
            
            {/* SEÇÃO: INFORMAÇÕES DA EMPRESA/CLIENTE */}
            <div className="space-y-5 p-6 bg-white rounded-lg border border-slate-300">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="documento" className="text-sm font-semibold text-gray-700">
                    {tipoCliente === 'PJ' ? 'CNPJ' : tipoCliente === 'PF' ? 'CPF' : 'CPF/CNPJ'}
                  </Label>
                  <Input
                    id="documento"
                    value={documentoValue}
                    onChange={(e) => {
                      const masked = documentMask(e.target.value)
                      setDocumentoValue(masked)
                      setValue('documento', masked)
                    }}
                    className="w-full"
                    placeholder={tipoCliente === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                    maxLength={tipoCliente === 'PJ' ? 18 : 14}
                    disabled={isBlocked}
                  />
                  {errors.documento && (
                    <p className="text-sm text-red-500">{errors.documento.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razao_social" className="text-sm font-semibold text-gray-700">
                    {tipoCliente === 'PJ' ? 'Razão Social' : 'Nome Completo'} <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="razao_social" 
                    {...register('razao_social')} 
                    className="w-full"
                    placeholder={tipoCliente === 'PJ' ? 'Digite a razão social' : 'Digite o nome completo'}
                    disabled={isBlocked}
                  />
                  {errors.razao_social && (
                    <p className="text-sm text-red-500">{errors.razao_social.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cliente_desde" className="text-sm font-semibold text-gray-700">Cliente Desde</Label>
                  <Input 
                    id="cliente_desde" 
                    type="date" 
                    {...register('cliente_desde')} 
                    className="w-full"
                    disabled={isBlocked}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold text-gray-700">Status</Label>
                  <Select
                    value={watch('status') || 'ATIVO'}
                    onValueChange={(value) => setValue('status', value as 'ATIVO' | 'INATIVO' | 'PROSPECTO' | 'SUSPENSO' | 'BLOQUEADO')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATIVO">Ativo</SelectItem>
                      <SelectItem value="PROSPECTO">Prospecto</SelectItem>
                      <SelectItem value="INATIVO">Inativo</SelectItem>
                      <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                      <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apelido_relacionamento" className="text-sm font-semibold text-gray-700">Apelido</Label>
                  <Input 
                    id="apelido_relacionamento" 
                    {...register('apelido_relacionamento')} 
                    className="w-full"
                    placeholder="Como prefere ser chamado"
                    disabled={isBlocked}
                  />
                </div>

                {tipoCliente === 'PJ' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="nome_fantasia" className="text-sm font-semibold text-gray-700">Nome Fantasia</Label>
                      <Input 
                        id="nome_fantasia" 
                        {...register('nome_fantasia')} 
                        className="w-full"
                        placeholder="Nome comercial da empresa"
                        disabled={isBlocked}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nome_grupo" className="text-sm font-semibold text-gray-700">Nome do Grupo</Label>
                      <Input 
                        id="nome_grupo" 
                        {...register('nome_grupo')} 
                        className="w-full"
                        placeholder="Ex: Grupo ABC"
                        disabled={isBlocked}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ins_estadual" className="text-sm font-semibold text-gray-700">Inscrição Estadual</Label>
                      <Input 
                        id="ins_estadual" 
                        {...register('ins_estadual')} 
                        className="w-full"
                        placeholder="000.000.000.000"
                        disabled={isBlocked}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ins_municipal" className="text-sm font-semibold text-gray-700">Inscrição Municipal</Label>
                      <Input 
                        id="ins_municipal" 
                        {...register('ins_municipal')} 
                        className="w-full"
                        placeholder="0000000-0"
                        disabled={isBlocked}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data_fundacao" className="text-sm font-semibold text-gray-700">Data de Fundação</Label>
                      <Input 
                        id="data_fundacao" 
                        type="date" 
                        {...register('data_fundacao')} 
                        className="w-full"
                        disabled={isBlocked}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emp_site" className="text-sm font-semibold text-gray-700">Site da Empresa</Label>
                      <Input 
                        id="emp_site" 
                        {...register('emp_site')} 
                        className="w-full"
                        placeholder="https://www.exemplo.com.br"
                        disabled={isBlocked}
                      />
                      {errors.emp_site && (
                        <p className="text-sm text-red-500">{errors.emp_site.message}</p>
                      )}
                    </div>
                  </>
                )}

                {/* SEÇÃO: TIPOS DE RELACIONAMENTO */}
                <div className="space-y-3 md:col-span-3">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Handshake className="h-4 w-4 text-blue-600" />
                    Tipo de Relacionamento
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {[
                      'Atendimento Avulso',
                      'Contrato O&M',
                      'Gestão de Creditos',
                      'O&M com garantia Estendida',
                      'Sem Atendimento',
                      'VIP',
                      'VIP com Contrato O&M'
                    ].map((tipo) => (
                      <label 
                        key={tipo}
                        className={`flex items-center space-x-2 p-2.5 rounded-lg border hover:border-blue-400 hover:bg-slate-50 transition-colors text-xs ${isBlocked ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer bg-white'} ${tiposRelacionamento.includes(tipo) ? 'border-blue-500 bg-slate-50' : 'border-slate-300'}`}
                      >
                        <Checkbox
                          checked={tiposRelacionamento.includes(tipo)}
                          onCheckedChange={(checked) => {
                            if (!isBlocked) {
                              if (checked) {
                                setTiposRelacionamento([...tiposRelacionamento, tipo])
                              } else {
                                setTiposRelacionamento(tiposRelacionamento.filter(t => t !== tipo))
                              }
                              markAsChanged()
                            }
                          }}
                          id={`tipo-${tipo}`}
                          className="h-3.5 w-3.5"
                          disabled={isBlocked}
                        />
                        <span className="leading-tight">{tipo}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <GrupoEconomicoSelector
                    value={grupoEconomicoId}
                    grupoNome={grupoEconomicoNome}
                    onChange={(id, nome) => {
                      if (!isBlocked) {
                        setGrupoEconomicoId(id)
                        setGrupoEconomicoNome(nome)
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO: CONTATO */}
            <div className="space-y-5 p-6 bg-white rounded-lg border border-blue-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-blue-300">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Contato Geral</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-sm font-semibold text-gray-700">Telefone</Label>
                  <Input
                    id="telefone"
                    value={telefoneValue}
                    onChange={(e) => {
                      const masked = phoneMask(e.target.value)
                      setTelefoneValue(masked)
                      setValue('telefone_principal', masked)
                    }}
                    className="w-full"
                    placeholder="(00) 00000-0000"
                    disabled={isBlocked}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-sm font-semibold text-gray-700">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={whatsappValue}
                    onChange={(e) => {
                      const masked = phoneMask(e.target.value)
                      setWhatsappValue(masked)
                      setValue('whatsapp', masked)
                    }}
                    className="w-full"
                    placeholder="(00) 00000-0000"
                    disabled={isBlocked}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    {...register('email_principal')} 
                    className="w-full"
                    placeholder="contato@empresa.com"
                    disabled={isBlocked}
                  />
                  {errors.email_principal && (
                    <p className="text-sm text-red-500">{errors.email_principal.message}</p>
                  )}
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="grupo_whatsapp" className="text-sm font-semibold text-gray-700">Grupo WhatsApp</Label>
                  <Input
                    id="grupo_whatsapp"
                    value={grupoWhatsappValue}
                    onChange={(e) => {
                      setGrupoWhatsappValue(e.target.value)
                      setValue('grupo_whatsapp', e.target.value)
                    }}
                    className="w-full"
                    placeholder="#NOME DO GRUPO ou https://chat.whatsapp.com/..."
                    disabled={isBlocked}
                  />
                </div>

                {grupoWhatsappValue && (
                  <div className="space-y-2">
                    <Label htmlFor="us_grupo_whatsapp" className="text-sm font-semibold text-gray-700">ID do Grupo</Label>
                    <Input
                      id="us_grupo_whatsapp"
                      value={usGrupoWhatsappValue}
                      onChange={(e) => {
                        const novoValor = e.target.value
                        
                        // Atualizar ambos os estados
                        setUsGrupoWhatsappValue(novoValor)
                        setPersistentUsGrupoWhatsapp(novoValor)
                        setValue('us_grupo_whatsapp', novoValor)
                        
                        // Marcar que usuário editou
                        userEditedGrupoId.current = true
                        markAsChanged()
                      }}
                      className="w-full"
                      placeholder="120363163507606691@g.us"
                      disabled={isBlocked}
                    />
                  </div>
                )}

                <div className="space-y-2 md:col-span-2 lg:col-span-2">
                  <Label htmlFor="observacoes" className="text-sm font-semibold text-gray-700">Observações</Label>
                  <Textarea 
                    id="observacoes" 
                    {...register('observacoes')}
                    className="w-full min-h-[60px] max-h-[200px] resize-none overflow-y-auto rounded-lg border-slate-300"
                    placeholder="Observações sobre o cliente..."
                    disabled={isBlocked}
                    rows={2}
                  />
                </div>

                {/* Redes Sociais - ao lado de Observações */}
                <div className="space-y-2 lg:col-span-1">
                  <Label className="text-sm font-semibold text-gray-700">Redes Sociais</Label>

                  {/* Lista de redes sociais com formulário inline */}
                  <div className="flex flex-wrap gap-2 items-start content-start">
                    {redesSociais.map((rede, index) => (
                      <div
                        key={index}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-colors"
                        title={rede.valor}
                      >
                        {rede.tipo === 'instagram' && <Instagram className="h-4 w-4 text-pink-600 flex-shrink-0" />}
                        {rede.tipo === 'facebook' && <Facebook className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                        {rede.tipo === 'linkedin' && <Linkedin className="h-4 w-4 text-blue-700 flex-shrink-0" />}
                        <span className="text-gray-700 whitespace-nowrap font-medium">{rede.valor}</span>
                        {!isBlocked && (
                          <button
                            type="button"
                            onClick={() => {
                              const novasRedes = redesSociais.filter((_, i) => i !== index)
                              setRedesSociais(novasRedes)
                              setValue('emp_redes', novasRedes.length > 0 ? JSON.stringify(novasRedes) : null)
                              markAsChanged()
                            }}
                            className="ml-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* Formulário inline como badge */}
                    {adicionandoRede ? (
                      <div className="w-full p-3 rounded-lg bg-white border border-blue-400 space-y-2">
                        <Select
                          value={novaRede.tipo}
                          onValueChange={(value) => setNovaRede({...novaRede, tipo: value})}
                        >
                          <SelectTrigger className="h-9 w-full text-sm bg-white rounded-lg border-slate-300">
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
                          onChange={(e) => setNovaRede({...novaRede, valor: e.target.value})}
                          placeholder={novaRede.tipo === 'instagram' ? '@usuario' : novaRede.tipo === 'facebook' ? '/pagina' : '/company/empresa'}
                          className="h-9 w-full text-sm bg-white rounded-lg border-slate-300"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (novaRede.valor.trim()) {
                                const novasRedes = [...redesSociais, novaRede]
                                setRedesSociais(novasRedes)
                                setValue('emp_redes', JSON.stringify(novasRedes))
                                setNovaRede({tipo: 'instagram', valor: ''})
                                setAdicionandoRede(false)
                                markAsChanged()
                              }
                            }
                            if (e.key === 'Escape') {
                              setAdicionandoRede(false)
                              setNovaRede({tipo: 'instagram', valor: ''})
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
                                setValue('emp_redes', JSON.stringify(novasRedes))
                                setNovaRede({tipo: 'instagram', valor: ''})
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
                              setNovaRede({tipo: 'instagram', valor: ''})
                            }}
                            className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : !isBlocked && (
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

            {/* SEÇÃO: ENDEREÇO */}
            <div className="space-y-5 p-6 bg-white rounded-lg border border-emerald-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-emerald-300">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Endereço</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="cep" className="text-sm font-semibold text-gray-700">CEP</Label>
                  <Input
                    id="cep"
                    value={cepValue}
                    onChange={handleCepChange}
                    className="w-full"
                    placeholder="00000-000"
                    maxLength={9}
                    disabled={isBlocked}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="endereco" className="text-sm font-semibold text-gray-700">Endereço</Label>
                  <Input 
                    id="endereco" 
                    {...register('logradouro')} 
                    className="w-full"
                    placeholder="Rua, Avenida, etc."
                    disabled={isBlocked}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero" className="text-sm font-semibold text-gray-700">Número</Label>
                  <Input 
                    id="numero" 
                    {...register('numero')} 
                    className="w-full"
                    placeholder="123"
                    disabled={isBlocked}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complemento" className="text-sm font-semibold text-gray-700">Complemento</Label>
                  <Input 
                    id="complemento" 
                    {...register('complemento')} 
                    className="w-full"
                    placeholder="Apt, Sala, etc."
                    disabled={isBlocked}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bairro" className="text-sm font-semibold text-gray-700">Bairro</Label>
                  <Input 
                    id="bairro" 
                    {...register('bairro')} 
                    className="w-full"
                    placeholder="Nome do bairro"
                    disabled={isBlocked}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cidade" className="text-sm font-semibold text-gray-700">Cidade</Label>
                  <Input 
                    id="cidade" 
                    {...register('municipio')} 
                    className="w-full"
                    placeholder="Nome da cidade"
                    disabled={isBlocked}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado" className="text-sm font-semibold text-gray-700">Estado</Label>
                  <Input 
                    id="estado" 
                    {...register('uf')} 
                    className="w-full"
                    placeholder="UF"
                    maxLength={2}
                    disabled={isBlocked}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pais" className="text-sm font-semibold text-gray-700">País</Label>
                  <Input 
                    id="pais" 
                    {...register('pais')} 
                    className="w-full"
                    defaultValue="Brasil"
                    disabled={isBlocked}
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO: EXTRAS */}
            <div className="space-y-5 p-6 bg-white rounded-lg border border-violet-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-violet-300">
                  <FileText className="h-5 w-5 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Informações Adicionais</h3>
              </div>
              
              <div className="space-y-5">
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-slate-200">
                  <Checkbox
                    id="favorito"
                    checked={!!watch('favorito')}
                    onCheckedChange={(checked) => setValue('favorito', checked as boolean)}
                    disabled={isBlocked}
                  />
                  <Label htmlFor="favorito" className="text-sm font-semibold text-gray-700 cursor-pointer flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Marcar como favorito
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-sm font-semibold text-gray-700">Tags</Label>
                  <TagsSelector 
                    selectedTags={tags}
                    onChange={(newTags) => { 
                      if (!isBlocked) { 
                        setTags(newTags) 
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes_extras" className="text-sm font-semibold text-gray-700">Observações Adicionais</Label>
                  <Textarea 
                    id="observacoes_extras" 
                    {...register('observacoes_extras')}
                    className="w-full min-h-[80px] resize-none"
                    placeholder="Informações extras, histórico, etc..."
                    disabled={isBlocked}
                  />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel ? onCancel : () => router.push('/clientes')}
            className="w-full sm:w-auto order-2 sm:order-1 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
            size="lg"
          >
            Cancelar
          </Button>

          <Button 
            type="submit" 
            disabled={isSubmitting || loading || isBlocked}
            className="w-full sm:w-auto order-1 sm:order-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors border border-blue-700"
            size="lg"
          >
            {(isSubmitting || loading) && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            )}
            <Save className="h-5 w-5 mr-2" />
            {clienteData ? 'Atualizar' : 'Cadastrar'} Cliente
          </Button>
        </div>
      </form>
    </div>
  )
}