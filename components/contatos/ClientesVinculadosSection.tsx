'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Briefcase, Mail, Phone, MessageCircle, Star, Globe, Building2, ExternalLink } from 'lucide-react'
import { PreferenciasClienteData } from '@/lib/validators/contato'
import { Textarea } from '@/components/ui/textarea'

interface ClientesVinculadosSectionProps {
  clientes: PreferenciasClienteData[]
  onUpdate: (clienteId: string, data: Partial<PreferenciasClienteData>) => void
}

export function ClientesVinculadosSection({ clientes, onUpdate }: ClientesVinculadosSectionProps) {
  const router = useRouter()

  const getTipoClienteLabel = (tipo: string) => {
    const tiposMap: Record<string, string> = {
      'PJ': 'Pessoa Jurídica',
      'PF': 'Pessoa Física',
      'pj': 'Pessoa Jurídica',
      'pf': 'Pessoa Física',
    }
    return tiposMap[tipo] || tipo
  }

  if (!clientes || clientes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg border border-blue-200">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            Clientes Vinculados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum cliente vinculado a este contato.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-lg border border-blue-200">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          Clientes Vinculados
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {clientes.map((cliente) => {
          return (
            <div key={cliente.cliente_id} className="space-y-4 p-5 bg-white rounded-lg border border-slate-300">
              {/* Header - Nome do Cliente */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    {cliente.contato_principal && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                    <h4 className="font-semibold text-gray-900">{cliente.cliente_nome}</h4>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {getTipoClienteLabel(cliente.tipo_cliente || '')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/clientes/${cliente.cliente_id}`)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {/* Contato Principal */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`contato-principal-${cliente.cliente_id}`}
                    checked={cliente.contato_principal || false}
                    onCheckedChange={(checked) =>
                      onUpdate(cliente.cliente_id, { contato_principal: !!checked })
                    }
                  />
                  <Label
                    htmlFor={`contato-principal-${cliente.cliente_id}`}
                    className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2 m-0"
                  >
                    <Star className="h-3.5 w-3.5" />
                    Contato Principal
                  </Label>
                </div>
              </div>

              {/* Cargo/Função */}
              <div className="space-y-2">
                <Label htmlFor={`cargo-${cliente.cliente_id}`} className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-600" />
                  Cargo/Função
                </Label>
                <Input
                  id={`cargo-${cliente.cliente_id}`}
                  placeholder="Ex: Gerente, Sócio, Responsável Técnico..."
                  defaultValue={cliente.cargo_no_cliente || ''}
                  onChange={(e) =>
                    onUpdate(cliente.cliente_id, { cargo_no_cliente: e.target.value })
                  }
                  className="w-full text-sm"
                />
              </div>

              {/* Preferências de Comunicação */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-gray-600" />
                  Comunicação
                </p>
                
                <div className="space-y-2">
                  {/* E-mail */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`pref-email-${cliente.cliente_id}`}
                      checked={cliente.pref_email || false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onUpdate(cliente.cliente_id, { pref_email: true })
                        } else {
                          onUpdate(cliente.cliente_id, { pref_email: false, email_contato: '' })
                        }
                      }}
                    />
                    <Label
                      htmlFor={`pref-email-${cliente.cliente_id}`}
                      className="text-sm text-gray-700 cursor-pointer flex items-center gap-2 m-0"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      E-mail
                    </Label>
                  </div>
                  {cliente.pref_email && (
                    <div className="ml-6 -mt-1">
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        defaultValue={cliente.email_contato || ''}
                        onChange={(e) =>
                          onUpdate(cliente.cliente_id, { email_contato: e.target.value })
                        }
                        className="w-full text-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {/* WhatsApp */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`pref-whatsapp-${cliente.cliente_id}`}
                      checked={cliente.pref_whatsapp || false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onUpdate(cliente.cliente_id, { pref_whatsapp: true })
                        } else {
                          onUpdate(cliente.cliente_id, { pref_whatsapp: false, telefone_contato: '' })
                        }
                      }}
                    />
                    <Label
                      htmlFor={`pref-whatsapp-${cliente.cliente_id}`}
                      className="text-sm text-gray-700 cursor-pointer flex items-center gap-2 m-0"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      WhatsApp
                    </Label>
                  </div>
                  {cliente.pref_whatsapp && (
                    <div className="ml-6 -mt-1">
                      <Input
                        type="tel"
                        placeholder="(11) 99999-9999"
                        defaultValue={cliente.telefone_contato || ''}
                        onChange={(e) =>
                          onUpdate(cliente.cliente_id, { telefone_contato: e.target.value })
                        }
                        className="w-full text-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Grupo WhatsApp */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`pref-grupo-${cliente.cliente_id}`}
                      checked={cliente.pref_grupo_whatsapp || false}
                      onCheckedChange={(checked) => {
                        onUpdate(cliente.cliente_id, {
                          pref_grupo_whatsapp: !!checked,
                        })
                      }}
                    />
                    <Label
                      htmlFor={`pref-grupo-${cliente.cliente_id}`}
                      className="text-sm text-gray-700 cursor-pointer flex items-center gap-2 m-0"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Grupo
                    </Label>
                  </div>
                  {cliente.pref_grupo_whatsapp && (
                    <div className="ml-6 -mt-1">
                      {cliente.grupo_whatsapp ? (
                        <Input
                          disabled
                          value={cliente.grupo_whatsapp}
                          className="bg-slate-100 text-slate-600 text-sm"
                        />
                      ) : (
                        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                          Sem grupo cadastrado
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Website */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <Label htmlFor={`website-${cliente.cliente_id}`} className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-600" />
                  Website
                </Label>
                <Input
                  id={`website-${cliente.cliente_id}`}
                  type="url"
                  placeholder="https://exemplo.com.br"
                  defaultValue={cliente.website_contato || ''}
                  onChange={(e) =>
                    onUpdate(cliente.cliente_id, { website_contato: e.target.value })
                  }
                  className="w-full text-sm"
                />
              </div>

              {/* Observações */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <Label htmlFor={`obs-${cliente.cliente_id}`} className="text-sm font-semibold text-gray-700">
                  Observações
                </Label>
                <Textarea
                  id={`obs-${cliente.cliente_id}`}
                  rows={2}
                  placeholder="Observações..."
                  defaultValue={cliente.observacoes_relacionamento || ''}
                  onChange={(e) =>
                    onUpdate(cliente.cliente_id, { observacoes_relacionamento: e.target.value })
                  }
                  className="w-full text-sm"
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
