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
import { phoneMask, documentMask, cepMask } from '@/lib/utils/masks'
import { TagsSelector } from './TagsSelector'
import { useState } from 'react'

interface ClienteFormProps {
  initialData?: Partial<ClienteFormData>
  onSubmit: (data: ClienteFormData) => void
  onCancel: () => void
  loading?: boolean
}

export function ClienteForm({ initialData, onSubmit, onCancel, loading }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: initialData,
  })

  const tipoCliente = watch('tipo_cliente')
  const [documentoValue, setDocumentoValue] = useState(initialData?.documento || '')
  const [telefoneValue, setTelefoneValue] = useState(initialData?.telefone_principal || '')
  const [cepValue, setCepValue] = useState(initialData?.cep || '')
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome_cadastro">
                Nome Cadastro <span className="text-destructive">*</span>
              </Label>
              <Input id="nome_cadastro" {...register('nome_cadastro')} />
              {errors.nome_cadastro && (
                <p className="text-sm text-destructive">{errors.nome_cadastro.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_cliente">Tipo de Cliente</Label>
              <Select
                value={tipoCliente || ''}
                onValueChange={(value) => setValue('tipo_cliente', value as 'PF' | 'PJ')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              {tipoCliente === 'PJ' && documentoValue && documentoValue.length > 0 && documentoValue.replace(/\D/g, '').length === 11 && (
                <p className="text-sm text-muted-foreground">Você selecionou Pessoa Jurídica. Digite um CNPJ (14 dígitos).</p>
              )}
              {tipoCliente === 'PF' && documentoValue && documentoValue.length > 0 && documentoValue.replace(/\D/g, '').length === 14 && (
                <p className="text-sm text-muted-foreground">Você selecionou Pessoa Física. Digite um CPF (11 dígitos).</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apelido_relacionamento">Apelido</Label>
              <Input id="apelido_relacionamento" {...register('apelido_relacionamento')} />
            </div>
          </div>

          {tipoCliente === 'PJ' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="razao_social">Razão Social</Label>
                <Input id="razao_social" {...register('razao_social')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                <Input id="nome_fantasia" {...register('nome_fantasia')} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="telefone_principal">Telefone Principal</Label>
              <Input
                id="telefone_principal"
                value={telefoneValue}
                onChange={(e) => {
                  const masked = phoneMask(e.target.value)
                  setTelefoneValue(masked)
                  setValue('telefone_principal', masked)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_principal">E-mail Principal</Label>
              <Input id="email_principal" type="email" {...register('email_principal')} />
              {errors.email_principal && (
                <p className="text-sm text-destructive">{errors.email_principal.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={cepValue}
                onChange={(e) => {
                  const masked = cepMask(e.target.value)
                  setCepValue(masked)
                  setValue('cep', masked)
                }}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input id="logradouro" {...register('logradouro')} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" {...register('numero')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input id="complemento" {...register('complemento')} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input id="bairro" {...register('bairro')} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="municipio">Município</Label>
              <Input id="municipio" {...register('municipio')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Input id="uf" maxLength={2} {...register('uf')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observações e Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <TagsSelector 
              selectedTags={tags}
              onChange={(newTags) => {
                setTags(newTags)
                setValue('tags', newTags)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              rows={4}
              placeholder="Informações adicionais sobre o cliente..."
              {...register('observacoes')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
