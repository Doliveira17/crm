'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clienteTecnicaSchema, ClienteTecnicaFormData } from '@/lib/validators/clienteTecnica'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useState, useEffect } from 'react'
import { Wrench, Save, Clock, Zap, Sun, Wifi } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ClienteTecnicaFormProps {
  tecnica?: any
  initialData?: any
  onSubmit: (data: ClienteTecnicaFormData) => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export function ClienteTecnicaForm({ tecnica, initialData, onSubmit, onCancel, loading }: ClienteTecnicaFormProps) {
  const router = useRouter()
  const tecnicaData = initialData || tecnica

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ClienteTecnicaFormData>({
    resolver: zodResolver(clienteTecnicaSchema),
    defaultValues: {
      ...tecnicaData,
    },
  })

  const [posssuiInternet, setPossuiInternet] = useState<boolean>(tecnicaData?.possui_internet || false)

  // Detectar se é CPF ou CNPJ pelo tamanho do documento
  const documentoValue = watch('documento') || ''
  const isCNPJ = documentoValue.replace(/\D/g, '').length === 14
  const isCPF = documentoValue.replace(/\D/g, '').length === 11
  const tipoDocumento = isCNPJ ? 'CNPJ' : isCPF ? 'CPF' : 'CPF/CNPJ'

  useEffect(() => {
    if (tecnicaData) {
      Object.keys(tecnicaData).forEach((key) => {
        setValue(key as any, tecnicaData[key])
      })
      setPossuiInternet(tecnicaData?.possui_internet || false)
    }
  }, [tecnicaData, setValue])

  const handleFormSubmit = async (data: ClienteTecnicaFormData) => {
    try {
      await onSubmit({
        ...data,
        possui_internet: posssuiInternet,
      })
      toast.success(tecnicaData ? 'Dados técnicos atualizados!' : 'Dados técnicos cadastrados!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar dados técnicos')
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card className="w-full shadow-lg">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
              <Wrench className="h-6 w-6 text-blue-600" />
              <span>Dados Técnicos</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-8">
            {/* INFORMAÇÕES DO CLIENTE */}
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">{tipoDocumento}</p>
                    <p className="text-base font-semibold text-gray-900">{documentoValue || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">{isCNPJ ? 'Razão Social' : isCPF ? 'Nome Completo' : 'Nome'}</p>
                    <p className="text-base font-semibold text-gray-900">{watch('razao_social') || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* INFORMAÇÕES TÉCNICAS */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="nome_planta" className="text-base font-semibold">Nome da Planta</Label>
                  <Input
                    id="nome_planta"
                    {...register('nome_planta')}
                    className="w-full h-10 text-base"
                    placeholder="Ex: Planta São Paulo"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="modalidade" className="text-base font-semibold">Modalidade</Label>
                  <Select
                    value={watch('modalidade') || ''}
                    onValueChange={(value) => setValue('modalidade', value)}
                  >
                    <SelectTrigger className="w-full h-10 text-base">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Geração Local">Geração Local</SelectItem>
                      <SelectItem value="Autoconsumo Remoto">Autoconsumo Remoto</SelectItem>
                      <SelectItem value="Geração local com beneficiárias">Geração local com beneficiárias</SelectItem>
                      <SelectItem value="Geração compartilhada">Geração compartilhada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="classificacao" className="text-base font-semibold">Classificação</Label>
                  <Select
                    value={watch('classificacao') || ''}
                    onValueChange={(value) => setValue('classificacao', value)}
                  >
                    <SelectTrigger className="w-full h-10 text-base">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Residencial">Residencial</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                      <SelectItem value="Agro">Agro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="tipo_local" className="text-base font-semibold">Tipo de Local</Label>
                  <Select
                    value={watch('tipo_local') || ''}
                    onValueChange={(value) => setValue('tipo_local', value)}
                  >
                    <SelectTrigger className="w-full h-10 text-base">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Telhado">Telhado</SelectItem>
                      <SelectItem value="Solo">Solo</SelectItem>
                      <SelectItem value="Fachada">Fachada</SelectItem>
                      <SelectItem value="Estrutura">Estrutura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="potencia_usina_kwp" className="text-base font-semibold">Potência (kWp)</Label>
                  <Input
                    id="potencia_usina_kwp"
                    type="number"
                    step="0.01"
                    {...register('potencia_usina_kwp', { valueAsNumber: true })}
                    className="w-full h-10 text-base"
                    placeholder="Ex: 5.5"
                  />
                </div>

                <div className="flex items-end">
                  <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer w-full h-10 justify-center">
                    <Checkbox
                      id="possui_internet"
                      checked={posssuiInternet}
                      onCheckedChange={(checked) => setPossuiInternet(checked as boolean)}
                      className="h-5 w-5"
                    />
                    <Label htmlFor="possui_internet" className="text-base font-semibold cursor-pointer flex items-center gap-2 whitespace-nowrap m-0">
                      <Wifi className="h-5 w-5 text-blue-600" />
                      Internet
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* CRONOGRAMA */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b">
                <Clock className="h-7 w-7 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Cronograma</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="data_install" className="text-base font-semibold">Data de Instalação</Label>
                  <Input
                    id="data_install"
                    type="date"
                    {...register('data_install')}
                    className="w-full h-10 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="venc_garantia" className="text-base font-semibold">Vencimento da Garantia</Label>
                  <Input
                    id="venc_garantia"
                    type="date"
                    {...register('venc_garantia')}
                    className="w-full h-10 text-base"
                  />
                </div>
              </div>
            </div>

            {/* INVERSORES */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b">
                <Zap className="h-7 w-7 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Inversores</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="quant_inverter" className="text-base font-semibold">Quantidade</Label>
                  <Input
                    id="quant_inverter"
                    type="number"
                    {...register('quant_inverter', { valueAsNumber: true })}
                    className="w-full h-10 text-base"
                    placeholder="Ex: 2"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="marca_inverter" className="text-base font-semibold">Marca</Label>
                  <Input
                    id="marca_inverter"
                    {...register('marca_inverter')}
                    className="w-full h-10 text-base"
                    placeholder="Ex: Fronius"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="mod_inverter" className="text-base font-semibold">Modelo</Label>
                  <Input
                    id="mod_inverter"
                    {...register('mod_inverter')}
                    className="w-full h-10 text-base"
                    placeholder="Ex: Primo GEN24"
                  />
                </div>

                <div className="space-y-3 md:col-span-3">
                  <Label htmlFor="serie_inverter" className="text-base font-semibold">Série</Label>
                  <Input
                    id="serie_inverter"
                    {...register('serie_inverter')}
                    className="w-full h-10 text-base"
                    placeholder="Número de série do inversor"
                  />
                </div>
              </div>
            </div>

            {/* PAINÉIS SOLARES */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b">
                <Sun className="h-7 w-7 text-yellow-500" />
                <h3 className="text-xl font-bold text-gray-900">Painéis Solares</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="quant_modulos" className="text-base font-semibold">Quantidade de Módulos</Label>
                  <Input
                    id="quant_modulos"
                    type="number"
                    {...register('quant_modulos', { valueAsNumber: true })}
                    className="w-full h-10 text-base"
                    placeholder="Ex: 20"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="marca_modulos" className="text-base font-semibold">Marca</Label>
                  <Input
                    id="marca_modulos"
                    {...register('marca_modulos')}
                    className="w-full h-10 text-base"
                    placeholder="Ex: Canadian Solar"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="mod_modulos" className="text-base font-semibold">Modelo</Label>
                  <Input
                    id="mod_modulos"
                    {...register('mod_modulos')}
                    className="w-full h-10 text-base"
                    placeholder="Ex: BiHiKu8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t bg-white">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel ? onCancel : () => router.push('/tecnica')}
            className="w-full sm:w-auto order-2 sm:order-1"
            size="lg"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full sm:w-auto order-1 sm:order-2"
            size="lg"
          >
            {(isSubmitting || loading) && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            )}
            <Save className="h-4 w-4 mr-2" />
            {tecnicaData ? 'Atualizar' : 'Cadastrar'} Dados Técnicos
          </Button>
        </div>
      </form>
    </div>
  )
}
