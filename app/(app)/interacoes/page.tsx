'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Search, 
  User, 
  Building2, 
  MessageCircle,
  Lightbulb,
  Calendar,
  ChevronRight,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { formatPhoneBR } from '@/lib/utils/normalize'

interface Interacao {
  id: number
  cliente_id: string | null
  contato_id: string | null
  nome_falado_dono: string | null
  status_envio: string | null
  viewed: boolean | null
  resposta1: string | null
  resposta2: string | null
  sugestao_cliente: string | null
  Interagiu_em: string | null
  created_at: string
  cliente?: {
    razao_social: string
    tipo_cliente: string | null
  } | null
  contato?: {
    nome_completo: string
    celular: string | null
    email: string | null
    cargo: string | null
  } | null
}

export default function InteracoesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'interagidos' | 'pendentes'>('todos')
  const [selectedInteracao, setSelectedInteracao] = useState<Interacao | null>(null)

  // OTIMIZAÇÃO: Usar React Query para cache automático
  const { data: interacoes = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['interacoes'],
    queryFn: async () => {
      // Buscar relatórios com joins em uma única query (evita N+1)
      const { data, error } = await (supabase as any)
        .from('relatorio_envios')
        .select(`
          id,
          cliente_id,
          contato_id,
          nome_falado_dono,
          status_envio,
          viewed,
          resposta1,
          resposta2,
          sugestão_cliente,
          Interagiu_em,
          created_at,
          cliente:crm_clientes(razao_social, tipo_cliente),
          contato:crm_contatos(nome_completo, celular, email, cargo)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((item: any) => ({
        ...item,
        sugestao_cliente: item['sugestão_cliente'] ?? null,
      })) as Interacao[]
    },
    staleTime: 2 * 60 * 1000, // 2 minutos - dados mais dinâmicos
  })

  // Filtrar interações
  const interacoesFiltradas = interacoes.filter((interacao) => {
    // Filtro de busca
    const matchSearch = searchTerm === '' || 
      interacao.nome_falado_dono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interacao.cliente?.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interacao.contato?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase())

    // Filtro de status
    const temInteracao = interacao.viewed || interacao.resposta1 || interacao.resposta2 || interacao.sugestao_cliente
    const matchStatus = filtroStatus === 'todos' || 
      (filtroStatus === 'interagidos' && temInteracao) ||
      (filtroStatus === 'pendentes' && !temInteracao)

    return matchSearch && matchStatus
  })

  // Estatísticas
  const totalInteracoes = interacoes.length
  const comInteracao = interacoes.filter(i => i.viewed || i.resposta1 || i.resposta2 || i.sugestao_cliente).length
  const pendentes = totalInteracoes - comInteracao

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            Interações
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe todas as interações dos contatos com os relatórios
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500/10 via-card to-card border-blue-500/20 hover:border-blue-500/40 transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Registros</p>
                <p className="text-4xl font-black text-blue-500">{totalInteracoes}</p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <MessageSquare className="h-7 w-7 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 via-card to-card border-emerald-500/20 hover:border-emerald-500/40 transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Com Interação</p>
                <p className="text-4xl font-black text-emerald-500">{comInteracao}</p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 via-card to-card border-amber-500/20 hover:border-amber-500/40 transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-4xl font-black text-amber-500">{pendentes}</p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-7 w-7 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do contato ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as any)}
                className="rounded-lg border bg-background px-4 py-2 text-sm"
              >
                <option value="todos">Todos</option>
                <option value="interagidos">Com Interação</option>
                <option value="pendentes">Pendentes</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Interações */}
      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          // Skeleton loading
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : interacoesFiltradas.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Nenhuma interação encontrada</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Tente buscar com outros termos' : 'Ainda não há interações registradas'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          interacoesFiltradas.map((interacao) => {
            const temInteracao = interacao.viewed || interacao.resposta1 || interacao.resposta2 || interacao.sugestao_cliente
            const quantasRespostas = [interacao.resposta1, interacao.resposta2].filter(Boolean).length

            return (
              <Card 
                key={interacao.id}
                className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                  selectedInteracao?.id === interacao.id ? 'ring-2 ring-primary' : ''
                } ${temInteracao ? 'border-emerald-500/30' : 'border-amber-500/30'}`}
                onClick={() => setSelectedInteracao(selectedInteracao?.id === interacao.id ? null : interacao)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Nome do Contato */}
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${
                          temInteracao ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'
                        }`}>
                          {interacao.nome_falado_dono?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {interacao.nome_falado_dono || 'Sem nome'}
                          </p>
                          {interacao.contato?.cargo && (
                            <p className="text-xs text-muted-foreground">{interacao.contato.cargo}</p>
                          )}
                        </div>
                      </div>

                      {/* Cliente Vinculado */}
                      {interacao.cliente && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span 
                            className="hover:text-primary hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/clientes/${interacao.cliente_id}`)
                            }}
                          >
                            {interacao.cliente.razao_social}
                          </span>
                          {interacao.cliente.tipo_cliente && (
                            <Badge variant="outline" className="text-xs">
                              {interacao.cliente.tipo_cliente === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Status e Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {temInteracao ? (
                          <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Interagiu
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                        {quantasRespostas > 0 && (
                          <Badge variant="outline" className="text-blue-500 border-blue-500/30">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Respondeu até a questão {quantasRespostas}
                          </Badge>
                        )}
                        {interacao.sugestao_cliente && (
                          <Badge variant="outline" className="text-violet-500 border-violet-500/30">
                            <Lightbulb className="h-3 w-3 mr-1" />
                            Sugestão
                          </Badge>
                        )}
                      </div>

                      {/* Data */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Criado em: {formatDate(interacao.created_at)}</span>
                        {interacao.Interagiu_em && (
                          <>
                            <span className="mx-1">•</span>
                            <span className="text-emerald-500">Interagiu em: {interacao.Interagiu_em}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${
                      selectedInteracao?.id === interacao.id ? 'rotate-90' : ''
                    }`} />
                  </div>

                  {/* Detalhes expandidos */}
                  {selectedInteracao?.id === interacao.id && (
                    <div className="mt-6 pt-6 border-t space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Respostas */}
                      {interacao.resposta1 && (
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-blue-500">1</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-blue-500 mb-1">Pergunta 1</p>
                              <p className="text-xs text-muted-foreground mb-2 italic">
                                Você gostou do relatório e do vídeo?
                              </p>
                              <div className="p-3 rounded-lg bg-background/50 border border-blue-500/20">
                                <p className="text-sm font-medium text-foreground">{interacao.resposta1}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {interacao.resposta2 && (
                        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-indigo-500">2</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-indigo-500 mb-1">Pergunta 2</p>
                              <p className="text-xs text-muted-foreground mb-2 italic">
                                Gostaria de ter inteligência artificial no seu negócio?
                              </p>
                              <div className="p-3 rounded-lg bg-background/50 border border-indigo-500/20">
                                <p className="text-sm font-medium text-foreground">{interacao.resposta2}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sugestão */}
                      {interacao.sugestao_cliente && (
                        <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-violet-500" />
                            <span className="text-sm font-semibold text-violet-500">Sugestão do Cliente</span>
                          </div>
                          <p className="text-sm text-foreground">{interacao.sugestao_cliente}</p>
                        </div>
                      )}

                      {/* Informações da Pessoa */}
                      {interacao.contato && (
                        <div className="p-4 rounded-xl bg-muted/50 border">
                          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Informações da Pessoa
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {interacao.contato.celular && (
                              <div>
                                <span className="text-muted-foreground">Celular: </span>
                                <span>{formatPhoneBR(interacao.contato.celular)}</span>
                              </div>
                            )}
                            {interacao.contato.email && (
                              <div>
                                <span className="text-muted-foreground">Email: </span>
                                <span>{interacao.contato.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Botões de ação */}
                      <div className="flex gap-2">
                        {interacao.contato_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/contatos/${interacao.contato_id}`)
                            }}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Ver Contato
                          </Button>
                        )}
                        {interacao.cliente_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/clientes/${interacao.cliente_id}`)
                            }}
                          >
                            <Building2 className="h-4 w-4 mr-2" />
                            Ver Cliente
                          </Button>
                        )}
                      </div>

                      {/* Sem interação ainda */}
                      {!interacao.resposta1 && !interacao.resposta2 && !interacao.sugestao_cliente && (
                        <div className="text-center py-4 text-muted-foreground">
                          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhuma interação registrada ainda</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Paginação info */}
      {!loading && interacoesFiltradas.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Mostrando {interacoesFiltradas.length} de {totalInteracoes} registros
        </div>
      )}
    </div>
  )
}
