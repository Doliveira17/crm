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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { phoneMask, documentMask, cepMask } from '@/lib/utils/masks'
import { TagsSelector } from './TagsSelector'
import { useState, useEffect } from 'react'
import { Building2, User, MapPin, Phone, FileText, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ClienteFormProps {
  cliente?: any
  initialData?: any
  onSubmit: (data: ClienteFormData) => void
  onCancel?: () => void
  loading?: boolean
}

export function ClienteForm({ cliente, initialData, onSubmit, onCancel, loading }: ClienteFormProps) {
  const router = useRouter()
  
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
  })

  // Estados locais
  const [documentoValue, setDocumentoValue] = useState(clienteData?.documento || '')
  const [telefoneValue, setTelefoneValue] = useState(clienteData?.telefone_principal || '')
  const [whatsappValue, setWhatsappValue] = useState(clienteData?.whatsapp || '')
  const [cepValue, setCepValue] = useState(clienteData?.cep || '')
  const [tags, setTags] = useState<string[]>(clienteData?.tags || [])
  const [activeTab, setActiveTab] = useState('dados')
  const [hasChanges, setHasChanges] = useState(false)

  const tipoCliente = watch('tipo_cliente')
  const watchedValues = watch()

  // Resetar formulário quando clienteData mudar
  useEffect(() => {
    if (clienteData && Object.keys(clienteData).length > 0) {
      const formData = {
        tipo_cliente: clienteData.tipo_cliente || 'PJ',
        status: clienteData.status || 'ATIVO',
        pais: clienteData.pais || 'Brasil',
        ...clienteData,
      }
      
      reset(formData)
      
      // Atualizar estados locais
      setDocumentoValue(clienteData.documento || '')
      setTelefoneValue(clienteData.telefone_principal || '')
      setWhatsappValue(clienteData.whatsapp || '')
      setCepValue(clienteData.cep || '')
      setTags(clienteData.tags || [])
    }
  }, [clienteData, reset])

  // Detectar mudanças no formulário
  useEffect(() => {
    if (clienteData) {
      const currentData = JSON.stringify({
        ...watchedValues,
        documento: documentoValue,
        telefone_principal: telefoneValue,
        whatsapp: whatsappValue,
        cep: cepValue,
        tags,
      })
      const originalData = JSON.stringify(clienteData)
      setHasChanges(currentData !== originalData)
    }
  }, [watchedValues, documentoValue, telefoneValue, whatsappValue, cepValue, tags, clienteData])

  // Buscar CEP automático
  const buscarCep = async (cep: string) => {
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
  }

  // Função de submissão
  const handleFormSubmit = (data: ClienteFormData) => {
    const finalData = {
      ...data,
      documento: documentoValue,
      telefone_principal: telefoneValue,
      whatsapp: whatsappValue,
      cep: cepValue,
      tags,
    }
    onSubmit(finalData)
  }

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
    <div className="w-full mx-auto p-6 md:p-8">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        <Card className="w-full shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
                {tipoCliente === 'PJ' ? (
                  <Building2 className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5" />
                )}
                <span className="truncate">
                  {tipoCliente === 'PJ' ? 'Pessoa Jurídica' : tipoCliente === 'PF' ? 'Pessoa Física' : 'Novo Cliente'}
                </span>
              </CardTitle>
              {hasChanges && (
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  Alterações pendentes
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 h-12 p-1 mb-6">
                <TabsTrigger value="dados" className="flex flex-col sm:flex-row items-center gap-1 px-2 py-2 text-xs">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Dados</span>
                </TabsTrigger>
                <TabsTrigger value="empresa" className="flex flex-col sm:flex-row items-center gap-1 px-2 py-2 text-xs">
                  <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Empresa</span>
                </TabsTrigger>
                <TabsTrigger value="contato" className="flex flex-col sm:flex-row items-center gap-1 px-2 py-2 text-xs">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Contato</span>
                </TabsTrigger>
                <TabsTrigger value="endereco" className="flex flex-col sm:flex-row items-center gap-1 px-2 py-2 text-xs">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Endereço</span>
                </TabsTrigger>
                <TabsTrigger value="extras" className="flex flex-col sm:flex-row items-center gap-1 px-2 py-2 text-xs">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Extras</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Dados Básicos */}
              <TabsContent value="dados" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="razao_social" className="text-sm font-medium">
                      Razão Social <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="razao_social" 
                      {...register('razao_social')} 
                      className="w-full"
                      placeholder="Digite a razão social"
                    />
                    {errors.razao_social && (
                      <p className="text-sm text-red-500">{errors.razao_social.message}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="tipo_cliente" className="text-sm font-medium">Tipo de Cliente</Label>
                    <Select
                      value={tipoCliente || ''}
                      onValueChange={(value) => setValue('tipo_cliente', value as 'PF' | 'PJ')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PF">Pessoa Física</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="documento" className="text-sm font-medium">
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
                    />
                    {errors.documento && (
                      <p className="text-sm text-red-500">{errors.documento.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apelido_relacionamento" className="text-sm font-medium">Apelido</Label>
                    <Input 
                      id="apelido_relacionamento" 
                      {...register('apelido_relacionamento')} 
                      className="w-full"
                      placeholder="Como prefere ser chamado"
                    />
                  </div>

                  {tipoCliente === 'PJ' && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="nome_fantasia" className="text-sm font-medium">Nome Fantasia</Label>
                      <Input 
                        id="nome_fantasia" 
                        {...register('nome_fantasia')} 
                        className="w-full"
                        placeholder="Nome comercial da empresa"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                    <Select
                      value={watch('status') || 'ATIVO'}
                      onValueChange={(value) => setValue('status', value as 'ATIVO' | 'INATIVO' | 'PROSPECTO' | 'SUSPENSO')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ATIVO">Ativo</SelectItem>
                        <SelectItem value="PROSPECTO">Prospecto</SelectItem>
                        <SelectItem value="INATIVO">Inativo</SelectItem>
                        <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo_relacionamento" className="text-sm font-medium">Relacionamento</Label>
                    <Input 
                      id="tipo_relacionamento" 
                      {...register('tipo_relacionamento')} 
                      className="w-full"
                      placeholder="Cliente, Fornecedor, Parceiro..."
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Empresa */}
            <TabsContent value="empresa" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nome_grupo" className="text-sm font-medium">Nome do Grupo</Label>
                    <Input 
                      id="nome_grupo" 
                      {...register('nome_grupo')} 
                      className="w-full"
                      placeholder="Ex: Grupo ABC"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ins_estadual" className="text-sm font-medium">Inscrição Estadual</Label>
                    <Input 
                      id="ins_estadual" 
                      {...register('ins_estadual')} 
                      className="w-full"
                      placeholder="000.000.000.000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ins_municipal" className="text-sm font-medium">Inscrição Municipal</Label>
                    <Input 
                      id="ins_municipal" 
                      {...register('ins_municipal')} 
                      className="w-full"
                      placeholder="0000000-0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_fundacao" className="text-sm font-medium">Data de Fundação</Label>
                    <Input 
                      id="data_fundacao" 
                      type="date" 
                      {...register('data_fundacao')} 
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="emp_site" className="text-sm font-medium">Site da Empresa</Label>
                    <Input 
                      id="emp_site" 
                      {...register('emp_site')} 
                      className="w-full"
                      placeholder="https://www.exemplo.com.br"
                    />
                    {errors.emp_site && (
                      <p className="text-sm text-red-500">{errors.emp_site.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="emp_redes" className="text-sm font-medium">Redes Sociais</Label>
                    <Textarea 
                      id="emp_redes" 
                      {...register('emp_redes')}
                      className="w-full min-h-[80px] resize-none"
                      placeholder="Instagram: @empresa&#10;Facebook: /empresa&#10;LinkedIn: /company/empresa"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Contato */}
            <TabsContent value="contato" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-sm font-medium">Telefone</Label>
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp</Label>
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
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      {...register('email_principal')} 
                      className="w-full"
                      placeholder="contato@empresa.com"
                    />
                    {errors.email_principal && (
                      <p className="text-sm text-red-500">{errors.email_principal.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="observacoes" className="text-sm font-medium">Observações</Label>
                    <Textarea 
                      id="observacoes" 
                      {...register('observacoes')}
                      className="w-full min-h-[80px] resize-none"
                      placeholder="Observações sobre o cliente..."
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 4: Endereço */}
            <TabsContent value="endereco" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cep" className="text-sm font-medium">CEP</Label>
                    <Input
                      id="cep"
                      value={cepValue}
                      onChange={(e) => {
                        const masked = cepMask(e.target.value)
                        setCepValue(masked)
                        setValue('cep', masked)
                        if (masked.length === 9) {
                          buscarCep(masked)
                        }
                      }}
                      className="w-full"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="endereco" className="text-sm font-medium">Endereço</Label>
                    <Input 
                      id="endereco" 
                      {...register('logradouro')} 
                      className="w-full"
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero" className="text-sm font-medium">Número</Label>
                    <Input 
                      id="numero" 
                      {...register('numero')} 
                      className="w-full"
                      placeholder="123"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complemento" className="text-sm font-medium">Complemento</Label>
                    <Input 
                      id="complemento" 
                      {...register('complemento')} 
                      className="w-full"
                      placeholder="Apt, Sala, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bairro" className="text-sm font-medium">Bairro</Label>
                    <Input 
                      id="bairro" 
                      {...register('bairro')} 
                      className="w-full"
                      placeholder="Nome do bairro"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cidade" className="text-sm font-medium">Cidade</Label>
                    <Input 
                      id="cidade" 
                      {...register('municipio')} 
                      className="w-full"
                      placeholder="Nome da cidade"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado" className="text-sm font-medium">Estado</Label>
                    <Input 
                      id="estado" 
                      {...register('uf')} 
                      className="w-full"
                      placeholder="UF"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pais" className="text-sm font-medium">País</Label>
                    <Input 
                      id="pais" 
                      {...register('pais')} 
                      className="w-full"
                      defaultValue="Brasil"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 5: Extras */}
            <TabsContent value="extras" className="mt-6 space-y-6">
              <div className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Configurações</Label>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                      <Checkbox
                        id="favorito"
                        checked={!!watch('favorito')}
                        onCheckedChange={(checked) => setValue('favorito', checked as boolean)}
                      />
                      <Label htmlFor="favorito" className="text-sm cursor-pointer">Marcar como favorito</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-sm font-medium">Tags</Label>
                    <TagsSelector 
                      selectedTags={tags}
                      onChange={setTags}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes_extras" className="text-sm font-medium">Observações Adicionais</Label>
                    <Textarea 
                      id="observacoes_extras" 
                      {...register('observacoes_extras')}
                      className="w-full min-h-[100px] resize-none"
                      placeholder="Informações extras, histórico, etc..."
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t bg-white sticky bottom-0 -mx-4 px-4 py-6 sm:relative sm:border-0 sm:bg-transparent sm:mx-0 sm:px-0 sm:py-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => router.push('/clientes'))}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              type="submit" 
              disabled={isSubmitting || loading}
              className="w-full sm:w-auto"
            >
              {(isSubmitting || loading) && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              )}
              <Save className="h-4 w-4 mr-2" />
              {clienteData ? 'Atualizar' : 'Cadastrar'} Cliente
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}