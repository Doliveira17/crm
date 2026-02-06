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
import { Building2, User, MapPin, Phone, FileText, Save, Handshake, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ClienteFormProps {
  cliente?: any
  onSubmit: (data: ClienteFormData) => void
}

export function ClienteForm({ cliente, onSubmit }: ClienteFormProps) {
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isLoading },
    setValue,
    watch,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipo_cliente: 'PJ',
      status: 'ATIVO',
      pais: 'Brasil',
      ...cliente,
      tipos_relacionamento: cliente?.tipos_relacionamento || [],
    },
  })

  const tipoCliente = watch('tipo_cliente')
  const [documentoValue, setDocumentoValue] = useState(cliente?.documento || '')
  const [telefoneValue, setTelefoneValue] = useState(cliente?.telefone || '')
  const [whatsappValue, setWhatsappValue] = useState(cliente?.whatsapp || '')
  const [cepValue, setCepValue] = useState(cliente?.cep || '')
  const [tags, setTags] = useState<string[]>(cliente?.tags || [])
  const [activeTab, setActiveTab] = useState('dados')
  const [hasChanges, setHasChanges] = useState(false)
  const [tiposRelacionamento, setTiposRelacionamento] = useState<string[]>(cliente?.tipos_relacionamento || [])
  const [isRelacionamentoExpanded, setIsRelacionamentoExpanded] = useState(true)

  // Auto-save simples
  const watchedValues = watch()
  useEffect(() => {
    if (cliente) {
      const hasFormChanges = JSON.stringify(watchedValues) !== JSON.stringify(cliente)
      setHasChanges(hasFormChanges)
    }
  }, [watchedValues, cliente])

  // Sincronizar tiposRelacionamento com o formulário
  useEffect(() => {
    setValue('tipos_relacionamento', tiposRelacionamento as any)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiposRelacionamento])

  // Função para buscar CEP
  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        if (response.ok) {
          const data = await response.json()
          if (!data.erro) {
            setValue('endereco', data.logradouro || '')
            setValue('bairro', data.bairro || '')
            setValue('cidade', data.localidade || '')
            setValue('estado', data.uf || '')
            toast.success('CEP encontrado!')
          }
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      }
    }
  }

  const handleSave = () => {
    const formData = {
      ...watchedValues,
      documento: documentoValue,
      telefone: telefoneValue,
      whatsapp: whatsappValue,
      cep: cepValue,
      tags,
      tipos_relacionamento: tiposRelacionamento.length > 0 ? tiposRelacionamento : null,
    }
    onSubmit(formData)
  }

  const handleFormSubmit = (data: ClienteFormData) => {
    const formData = {
      ...data,
      documento: documentoValue,
      telefone: telefoneValue,
      whatsapp: whatsappValue,
      cep: cepValue,
      tags,
      tipos_relacionamento: tiposRelacionamento.length > 0 ? tiposRelacionamento : null,
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {tipoCliente === 'PJ' ? (
                <Building2 className="h-5 w-5" />
              ) : (
                <User className="h-5 w-5" />
              )}
              {tipoCliente === 'PJ' ? 'Pessoa Jurídica' : tipoCliente === 'PF' ? 'Pessoa Física' : 'Cadastro de Cliente'}
            </CardTitle>
            {hasChanges && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Alterações pendentes
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dados" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Dados</span>
              </TabsTrigger>
              <TabsTrigger value="empresa" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Empresa</span>
              </TabsTrigger>
              <TabsTrigger value="contato" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Contato</span>
              </TabsTrigger>
              <TabsTrigger value="endereco" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Endereço</span>
              </TabsTrigger>
              <TabsTrigger value="extras" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Extras</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Dados Básicos */}
            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="razao_social">
                    Razão Social <span className="text-destructive">*</span>
                  </Label>
                  <Input id="razao_social" {...register('razao_social')} />
                  {errors.razao_social && (
                    <p className="text-sm text-destructive">{errors.razao_social.message}</p>
                  )}
                </div>

                {/* Campo 'Tipo de Cliente' removido da UI por solicitação */}

                <div className="space-y-2">
                  <Label htmlFor="documento">
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
                    placeholder={tipoCliente === 'PJ' ? '00.000.000/0000-00' : tipoCliente === 'PF' ? '000.000.000-00' : ''}
                    maxLength={tipoCliente === 'PJ' ? 18 : tipoCliente === 'PF' ? 14 : undefined}
                  />
                  {errors.documento && (
                    <p className="text-sm text-destructive">{errors.documento.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apelido_relacionamento">Apelido</Label>
                  <Input id="apelido_relacionamento" {...register('apelido_relacionamento')} />
                </div>

                {tipoCliente === 'PJ' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                    <Input id="nome_fantasia" {...register('nome_fantasia')} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch('status') || 'ATIVO'}
                    onValueChange={(value) => setValue('status', value as 'ATIVO' | 'INATIVO' | 'PROSPECTO' | 'SUSPENSO')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATIVO">Ativo</SelectItem>
                      <SelectItem value="PROSPECTO">Prospecto</SelectItem>
                      <SelectItem value="INATIVO">Inativo</SelectItem>
                      <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <button
                    type="button"
                    onClick={() => setIsRelacionamentoExpanded(!isRelacionamentoExpanded)}
                    className="w-full flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Handshake className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 flex-1 text-left">Tipo de Relacionamento</span>
                    <ChevronDown 
                      className={`h-4 w-4 text-gray-600 flex-shrink-0 transition-transform duration-200 ${isRelacionamentoExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {isRelacionamentoExpanded && (
                    <div className="space-y-3 mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {/* Grid de checkboxes em 3 colunas */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                            className="flex items-center space-x-3 p-2.5 rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Checkbox
                              checked={tiposRelacionamento.includes(tipo)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTiposRelacionamento([...tiposRelacionamento, tipo])
                                } else {
                                  setTiposRelacionamento(tiposRelacionamento.filter(t => t !== tipo))
                                }
                              }}
                              id={`tipo-${tipo}`}
                              className="flex-shrink-0"
                            />
                            <span className="text-xs sm:text-sm font-medium flex-1">
                              {tipo}
                            </span>
                          </label>
                        ))}
                      </div>

                      {/* Exibição dos tipos selecionados como badges */}
                      {tiposRelacionamento.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-300">
                          <p className="text-xs text-gray-600 mb-2 font-medium">Selecionados:</p>
                          <div className="flex flex-wrap gap-2">
                            {tiposRelacionamento.map((tipo) => (
                              <div 
                                key={tipo}
                                className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium"
                              >
                                <span>{tipo}</span>
                                <button
                                  type="button"
                                  onClick={() => setTiposRelacionamento(tiposRelacionamento.filter(t => t !== tipo))}
                                  className="hover:text-blue-900 transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Empresa */}
            <TabsContent value="empresa" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome_grupo">Nome do Grupo</Label>
                  <Input id="nome_grupo" {...register('nome_grupo')} placeholder="Ex: Grupo ABC" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ins_estadual">Inscrição Estadual</Label>
                  <Input id="ins_estadual" {...register('ins_estadual')} placeholder="000.000.000.000" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ins_municipal">Inscrição Municipal</Label>
                  <Input id="ins_municipal" {...register('ins_municipal')} placeholder="0000000-0" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_fundacao">Data de Fundação</Label>
                  <Input 
                    id="data_fundacao" 
                    type="date" 
                    {...register('data_fundacao')} 
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="emp_site">Site da Empresa</Label>
                  <Input 
                    id="emp_site" 
                    {...register('emp_site')} 
                    placeholder="https://www.exemplo.com.br"
                  />
                  {errors.emp_site && (
                    <p className="text-sm text-destructive">{errors.emp_site.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="emp_redes">Redes Sociais</Label>
                  <Textarea 
                    id="emp_redes" 
                    {...register('emp_redes')}
                    placeholder="Instagram: @empresa&#10;Facebook: /empresa&#10;LinkedIn: /company/empresa"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Contato */}
            <TabsContent value="contato" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={telefoneValue}
                    onChange={(e) => {
                      const masked = phoneMask(e.target.value)
                      setTelefoneValue(masked)
                      setValue('telefone', masked)
                    }}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={whatsappValue}
                    onChange={(e) => {
                      const masked = phoneMask(e.target.value)
                      setWhatsappValue(masked)
                      setValue('whatsapp', masked)
                    }}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" {...register('email')} placeholder="contato@empresa.com" />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea 
                    id="observacoes" 
                    {...register('observacoes')}
                    placeholder="Observações sobre o cliente..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab 4: Endereço */}
            <TabsContent value="endereco" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
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
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" {...register('endereco')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input id="numero" {...register('numero')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input id="complemento" {...register('complemento')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" {...register('bairro')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" {...register('cidade')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input id="estado" {...register('estado')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <Input id="pais" {...register('pais')} defaultValue="Brasil" />
                </div>
              </div>
            </TabsContent>

            {/* Tab 5: Extras */}
            <TabsContent value="extras" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 md:col-span-2">
                  <Label>Configurações</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="favorito"
                      checked={!!watch('favorito')}
                      onCheckedChange={(checked) => setValue('favorito', checked as boolean)}
                    />
                    <Label htmlFor="favorito" className="text-sm">Marcar como favorito</Label>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="tags">Tags</Label>
                  <TagsSelector 
                    value={tags}
                    onChange={setTags}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observacoes_extras">Observações Adicionais</Label>
                  <Textarea 
                    id="observacoes_extras" 
                    {...register('observacoes_extras')}
                    placeholder="Informações extras, histórico, etc..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-6 mt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/clientes')}
            >
              Cancelar
            </Button>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleSave}
                disabled={!hasChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Rascunho
              </Button>
              
              <Button type="submit" disabled={isLoading}>
                {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
                {cliente ? 'Atualizar' : 'Cadastrar'} Cliente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}