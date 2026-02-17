'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Users, 
  UserCircle, 
  Building2,
  User,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Mail,
  Phone,
  Calendar,
  Activity,
  Star,
  Tag,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface DashboardData {
  totalClientes: number
  clientesPF: number
  clientesPJ: number
  clientesFavoritos: number
  totalContatos: number
  contatosComEmail: number
  contatosComTelefone: number
  totalVinculos: number
  totalTags: number
  totalInteracoes: number
  interacoesRespondidas: number
  interacoesPendentes: number
  ultimosClientes: any[]
  ultimosContatos: any[]
  crescimentoSemanal: {
    clientes: number
    contatos: number
  }
}

function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard-data'],
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const agora = new Date()
      const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000)

      // OTIMIZAÇÃO: Dividir em 3 batches ao invés de 16 queries simultâneas
      // Isso reduz sobrecarga no banco e melhora performance
      
      // BATCH 1: Contadores de clientes
      const [
        clientesResult,
        clientesPFResult,
        clientesPJResult,
        clientesFavoritosResult,
        clientesSemanaisResult,
      ] = await Promise.all([
        supabase.from('crm_clientes').select('id', { count: 'exact', head: true }),
        supabase.from('crm_clientes').select('id', { count: 'exact', head: true }).eq('tipo_cliente', 'PF'),
        supabase.from('crm_clientes').select('id', { count: 'exact', head: true }).eq('tipo_cliente', 'PJ'),
        supabase.from('crm_clientes').select('id', { count: 'exact', head: true }).eq('favorito', true),
        supabase.from('crm_clientes').select('id', { count: 'exact', head: true }).gte('created_at', seteDiasAtras.toISOString()),
      ])

      // BATCH 2: Contadores de contatos
      const [
        contatosResult,
        contatosEmailResult,
        contatosTelResult,
        contatosSemanaisResult,
      ] = await Promise.all([
        supabase.from('crm_contatos').select('id', { count: 'exact', head: true }),
        supabase.from('crm_contatos').select('id', { count: 'exact', head: true }).not('email', 'is', null),
        supabase.from('crm_contatos').select('id', { count: 'exact', head: true }).not('celular', 'is', null),
        supabase.from('crm_contatos').select('id', { count: 'exact', head: true }).gte('created_at', seteDiasAtras.toISOString()),
      ])

      // BATCH 3: Outros contadores e listas
      const [
        vinculosResult,
        tagsResult,
        interacoesResult,
        interacoesRespondidasResult,
        interacoesPendentesResult,
        ultimosClientesResult,
        ultimosContatosResult,
      ] = await Promise.all([
        supabase.from('crm_clientes_contatos').select('id', { count: 'exact', head: true }),
        supabase.from('crm_tags').select('id', { count: 'exact', head: true }),
        supabase.from('relatorio_envios').select('id', { count: 'exact', head: true }),
        supabase.from('relatorio_envios').select('id', { count: 'exact', head: true }).eq('viewed', true),
        supabase.from('relatorio_envios').select('id', { count: 'exact', head: true }).eq('viewed', false),
        supabase.from('crm_clientes').select('id, razao_social, tipo_cliente, created_at, favorito, tags').order('created_at', { ascending: false }).limit(5),
        supabase.from('crm_contatos').select('id, nome_completo, email, celular, cargo, created_at').order('created_at', { ascending: false }).limit(5),
      ])

      return {
        totalClientes: clientesResult.count || 0,
        clientesPF: clientesPFResult.count || 0,
        clientesPJ: clientesPJResult.count || 0,
        clientesFavoritos: clientesFavoritosResult.count || 0,
        totalContatos: contatosResult.count || 0,
        contatosComEmail: contatosEmailResult.count || 0,
        contatosComTelefone: contatosTelResult.count || 0,
        totalVinculos: vinculosResult.count || 0,
        totalTags: tagsResult.count || 0,
        totalInteracoes: interacoesResult.count || 0,
        interacoesRespondidas: interacoesRespondidasResult.count || 0,
        interacoesPendentes: interacoesPendentesResult.count || 0,
        ultimosClientes: ultimosClientesResult.data || [],
        ultimosContatos: ultimosContatosResult.data || [],
        crescimentoSemanal: {
          clientes: clientesSemanaisResult.count || 0,
          contatos: contatosSemanaisResult.count || 0,
        }
      } as DashboardData
    },
  })
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  color 
}: { 
  icon: any
  label: string
  value: number | string
  subValue?: string
  color: string
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-500',
    violet: 'bg-violet-500/10 text-violet-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
    pink: 'bg-pink-500/10 text-pink-500',
    cyan: 'bg-cyan-500/10 text-cyan-500',
  }

  return (
    <div className="rounded-xl border bg-card p-5 transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
      {subValue && (
        <p className="mt-2 text-xs text-muted-foreground">{subValue}</p>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboardData()

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const percentPF = data?.totalClientes ? Math.round((data.clientesPF / data.totalClientes) * 100) : 0
  const percentPJ = data?.totalClientes ? Math.round((data.clientesPJ / data.totalClientes) * 100) : 0
  const percentEmail = data?.totalContatos ? Math.round((data.contatosComEmail / data.totalContatos) * 100) : 0
  const percentTel = data?.totalContatos ? Math.round((data.contatosComTelefone / data.totalContatos) * 100) : 0
  const taxaResposta = data?.totalInteracoes ? Math.round((data.interacoesRespondidas / data.totalInteracoes) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1.5">Visão geral e métricas do seu CRM</p>
        </div>
        <Link href="/tv" target="_blank">
          <Button variant="outline" size="lg" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Monitor de Envios
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20 p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            {data?.crescimentoSemanal.clientes ? (
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                +{data.crescimentoSemanal.clientes}
              </Badge>
            ) : null}
          </div>
          <h3 className="text-3xl font-bold mb-1">{data?.totalClientes || 0}</h3>
          <p className="text-sm text-muted-foreground">Total de Clientes</p>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/50 dark:to-violet-900/20 p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <UserCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            {data?.crescimentoSemanal.contatos ? (
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                +{data.crescimentoSemanal.contatos}
              </Badge>
            ) : null}
          </div>
          <h3 className="text-3xl font-bold mb-1">{data?.totalContatos || 0}</h3>
          <p className="text-sm text-muted-foreground">Total de Contatos</p>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/20 p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <Badge variant="secondary">{taxaResposta}%</Badge>
          </div>
          <h3 className="text-3xl font-bold mb-1">{data?.interacoesRespondidas || 0}</h3>
          <p className="text-sm text-muted-foreground">Interações Respondidas</p>
        </div>

        <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/20 p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <Badge variant="secondary">{100 - taxaResposta}%</Badge>
          </div>
          <h3 className="text-3xl font-bold mb-1">{data?.interacoesPendentes || 0}</h3>
          <p className="text-sm text-muted-foreground">Interações Pendentes</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/clientes?favorito=true" className="block">
          <div className="rounded-lg border bg-card p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data?.clientesFavoritos || 0}</p>
                <p className="text-xs text-muted-foreground">Clientes Favoritos</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/tags" className="block">
          <div className="rounded-lg border bg-card p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <Tag className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data?.totalTags || 0}</p>
                <p className="text-xs text-muted-foreground">Tags Criadas</p>
              </div>
            </div>
          </div>
        </Link>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.totalVinculos || 0}</p>
              <p className="text-xs text-muted-foreground">Vínculos Ativos</p>
            </div>
          </div>
        </div>

        <Link href="/interacoes" className="block">
          <div className="rounded-lg border bg-card p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data?.totalInteracoes || 0}</p>
                <p className="text-xs text-muted-foreground">Total Interações</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Stats - Grid clean */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card Clientes */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total de Clientes</p>
              <p className="text-4xl font-semibold">{data?.totalClientes || 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Users className="h-6 w-6 text-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pessoa Física</span>
              </div>
              <p className="text-2xl font-semibold mb-2">{data?.clientesPF || 0}</p>
              <div className="h-1 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${percentPF}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{percentPF}% do total</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pessoa Jurídica</span>
              </div>
              <p className="text-2xl font-semibold mb-2">{data?.clientesPJ || 0}</p>
              <div className="h-1 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${percentPJ}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{percentPJ}% do total</p>
            </div>
          </div>
        </div>

        {/* Card Contatos */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total de Contatos</p>
              <p className="text-4xl font-semibold">{data?.totalContatos || 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <UserCircle className="h-6 w-6 text-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Com E-mail</span>
              </div>
              <p className="text-2xl font-semibold mb-2">{data?.contatosComEmail || 0}</p>
              <div className="h-1 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${percentEmail}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{percentEmail}% do total</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Com Telefone</span>
              </div>
              <p className="text-2xl font-semibold mb-2">{data?.contatosComTelefone || 0}</p>
              <div className="h-1 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${percentTel}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{percentTel}% do total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Últimos Clientes */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Últimos Clientes</h3>
            </div>
            <Link href="/clientes">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y">
            {data?.ultimosClientes?.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">
                Nenhum cliente cadastrado
              </div>
            ) : (
              data?.ultimosClientes?.map((cliente: any) => (
                <Link 
                  key={cliente.id} 
                  href={`/clientes/${cliente.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
                      cliente.tipo_cliente === 'PF' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                    }`}>
                      {cliente.tipo_cliente === 'PF' ? (
                        <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{cliente.razao_social}</p>
                        {cliente.favorito && (
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-muted-foreground">
                          {cliente.tipo_cliente === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                        </p>
                        {cliente.tags && cliente.tags.length > 0 && (
                          <Badge variant="outline" className="text-xs h-5">
                            {cliente.tags[0]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Últimos Contatos */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Últimos Contatos</h3>
            </div>
            <Link href="/contatos">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y">
            {data?.ultimosContatos?.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">
                Nenhum contato cadastrado
              </div>
            ) : (
              data?.ultimosContatos?.map((contato: any) => (
                <Link
                  key={contato.id}
                  href={`/contatos/${contato.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 shrink-0">
                      <UserCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{contato.nome_completo}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {contato.cargo && (
                          <Badge variant="outline" className="text-xs h-5">{contato.cargo}</Badge>
                        )}
                        <p className="text-xs text-muted-foreground truncate">
                          {contato.email || contato.celular || 'Sem informações de contato'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {contato.email && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-pink-500/10">
                        <Mail className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
                      </div>
                    )}
                    {contato.celular && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/10">
                        <Phone className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
