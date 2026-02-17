'use client'

import { 
  Users, 
  UserCircle, 
  Send, 
  Eye, 
  EyeOff, 
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  RefreshCw,
  Activity,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useRef, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { supabase } from '@/lib/supabase/client'

// 🎨 CORES E INDICADORES
const COLORS = {
  enviado: '#22c55e',      // Verde (sucesso)
  naoEnviado: '#94a3b8',   // Cinza (aguardando)
  visto: '#3b82f6',        // Azul (interagido)
  naoVisto: '#ef4444',     // Vermelho (não interagido)
}

// ⏱️ CONFIGURAÇÕES
const POLLING_INTERVAL = 5000 // 5 segundos (tempo real)
const DEBOUNCE_DELAY = 500    // 500ms para busca

// 📦 INTERFACES
interface Contato {
  id: number
  nome: string
  telefone: string
  empresa: string | null
  cargo: string | null
  viewed: string | null
  status_envio: string | null
  interagido: boolean
  enviado: boolean
}

interface Metricas {
  enviados: number
  naoEnviados: number
  vistos: number
  naoVistos: number
  taxaEnvio: number
  taxaInteracao: number
}

interface FiltrosAplicados {
  viewed: string
  status: string
  busca: string | null
}

interface ApiResponse {
  contatos: Contato[]
  total: number
  totalFiltrado: number
  metricas: Metricas
  filtrosAplicados: FiltrosAplicados
}

interface DashboardStats {
  totalClientes: number
  totalContatos: number
}

// 🔄 FUNÇÃO PARA BUSCAR ESTATÍSTICAS GERAIS
async function fetchDashboardStats(): Promise<DashboardStats> {
  const [clientesResult, contatosResult] = await Promise.all([
    (supabase as any).from('crm_clientes').select('id', { count: 'exact', head: true }),
    (supabase as any).from('crm_contatos').select('id', { count: 'exact', head: true }),
  ])

  return {
    totalClientes: clientesResult.count || 0,
    totalContatos: contatosResult.count || 0,
  }
}

// 📊 COMPONENTE DE ANEL DE PROGRESSO
function ProgressRing({ percentage, size = 140, strokeWidth = 12 }: { percentage: number, size?: number, strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-emerald-500 transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-foreground">{percentage.toFixed(0)}%</span>
        <span className="text-xs text-muted-foreground">Interação</span>
      </div>
    </div>
  )
}

// 🎯 COMPONENTE PRINCIPAL DO DASHBOARD
export default function TVDashboardPage() {
  // 📊 Estados principais
  const [data, setData] = useState<ApiResponse | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isLive, setIsLive] = useState(true)
  
  // 🕐 Tempo atual
  const [currentTime, setCurrentTime] = useState(new Date())

  // 🔍 Estados de filtro
  const [filtroViewed, setFiltroViewed] = useState<'todos' | 'visto' | 'naoVisto'>('todos')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'enviado' | 'naoEnviado'>('todos')
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')


  // �📍 Referências
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 🔄 FUNÇÃO PARA BUSCAR CONTATOS
  const fetchContatos = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.append('viewed', filtroViewed)
      params.append('status', filtroStatus)
      if (buscaDebounced) {
        params.append('busca', buscaDebounced)
      }

      const response = await fetch(`/api/tv/metrics?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Erro ao buscar dados')
      }

      const apiData: ApiResponse = await response.json()
      setData(apiData)
      setLastUpdate(new Date())
      setError(null)
      setLoading(false)
    } catch (err) {
      console.error('Erro ao buscar contatos:', err)
      setError('Erro ao carregar dados. Tentando novamente...')
      setLoading(false)
    }
  }, [filtroViewed, filtroStatus, buscaDebounced])

  // 🚀 INICIALIZAÇÃO E POLLING
  useEffect(() => {
    // Buscar stats gerais
    fetchDashboardStats().then(setStats)

    // Primeira busca
    fetchContatos()

    // Configurar polling se modo live estiver ativo
    if (isLive) {
      intervalRef.current = setInterval(fetchContatos, POLLING_INTERVAL)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchContatos, isLive])

  // ⏰ Relógio
  // ⏰ Relógio
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 🔍 Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca)
    }, DEBOUNCE_DELAY)

    return () => clearTimeout(timer)
  }, [busca])

  // 🎨 FUNÇÕES AUXILIARES
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchContatos()
  }

  const toggleLive = () => {
    setIsLive(!isLive)
    if (!isLive) {
      // Reativar polling
      fetchContatos()
    }
  }

  // 📊 PREPARAR DADOS PARA GRÁFICOS
  const chartDataEnvio = data ? [
    { name: 'Enviados', value: data.metricas.enviados, color: COLORS.enviado },
    { name: 'Não Enviados', value: data.metricas.naoEnviados, color: COLORS.naoEnviado },
  ] : []

  const chartDataInteracao = data ? [
    { name: 'Interagidos', value: data.metricas.vistos, color: COLORS.visto },
    { name: 'Não Interagidos', value: data.metricas.naoVistos, color: COLORS.naoVisto },
  ] : []

  // 🎯 LOADING STATE
  if (loading && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-xl text-muted-foreground">Carregando Dashboard...</p>
        </div>
      </div>
    )
  }

  // ❌ ERROR STATE
  if (error && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <XCircle className="h-16 w-16 text-red-500" />
          <p className="text-xl text-red-500">{error}</p>
          <button
            onClick={handleRefresh}
            className="rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  const metricas = data?.metricas
  const totalContatos = stats?.totalContatos || 1 // Evita divisão por zero
  
  // TAXAS BASEADAS NO TOTAL DE CONTATOS (não sobre relatórios)
  const taxaEnvio = ((metricas?.enviados || 0) / totalContatos) * 100
  const taxaInteracao = ((metricas?.vistos || 0) / totalContatos) * 100

  return (
    <div className="min-h-screen bg-background p-8 lg:p-12">
      {/* 🎯 HEADER */}
      <header className="mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Botão Voltar */}
          <Link
            href="/"
            className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary/20 bg-card hover:bg-primary/10 hover:border-primary/40 transition-all shadow-lg hover:shadow-xl group"
            title="Voltar à página inicial"
          >
            <svg className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/50 animate-pulse">
            <BarChart3 className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Dashboard de Monitoramento de Atenção
            </h1>
            <p className="text-muted-foreground capitalize flex items-center gap-2 mt-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {formatDate(currentTime)}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Botão Live */}
          <button
            onClick={toggleLive}
            className={`flex items-center gap-3 rounded-xl border px-5 py-3 transition-all shadow-lg ${
              isLive 
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-emerald-500/30' 
                : 'border-muted bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            <Activity className={`h-5 w-5 ${isLive ? 'animate-pulse' : ''}`} />
            <div className="text-left">
              <span className="text-xs font-medium block">Modo</span>
              <span className="font-bold">{isLive ? 'AO VIVO' : 'PAUSADO'}</span>
            </div>
          </button>

          {/* Relógio */}
          <div className="flex items-center gap-4 rounded-xl border bg-card/50 backdrop-blur-sm p-4 shadow-lg">
            <Clock className="h-7 w-7 text-primary animate-pulse" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {lastUpdate ? `Atualizado ${formatTime(lastUpdate)}` : 'Aguardando...'}
              </p>
              <p className="text-2xl font-mono font-black text-foreground tabular-nums">
                {formatTime(currentTime)}
              </p>
            </div>
          </div>

          {/* Botão Refresh Manual */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex h-14 w-14 items-center justify-center rounded-xl border bg-card hover:bg-muted disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
            title="Atualizar manualmente"
          >
            <RefreshCw className={`h-6 w-6 text-primary ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* 🎨 FILTROS */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border bg-gradient-to-r from-card to-card/50 backdrop-blur-sm p-5 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Filter className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Filtros Avançados:</span>
        </div>

        {/* Filtro de Interação */}
        <select
          value={filtroViewed}
          onChange={(e) => setFiltroViewed(e.target.value as any)}
          className="rounded-xl border border-muted bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm font-medium hover:border-primary transition-all shadow-sm"
        >
          <option value="todos">📊 Todos</option>
          <option value="visto">👁️ Interagidos</option>
          <option value="naoVisto">🚫 Não Interagidos</option>
        </select>

        {/* Filtro de Status */}
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as any)}
          className="rounded-xl border border-muted bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm font-medium hover:border-primary transition-all shadow-sm"
        >
          <option value="todos">📮 Todos</option>
          <option value="enviado">✅ Enviados</option>
          <option value="naoEnviado">⏳ Não Enviados</option>
        </select>

        {/* Busca */}
        <div className="flex-1 min-w-[250px]">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="🔍 Buscar por nome do cliente..."
            className="w-full rounded-xl border border-muted bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm font-medium hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>

        {/* Indicador de filtros aplicados */}
        {(filtroViewed !== 'todos' || filtroStatus !== 'todos' || busca) && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gradient-to-r from-primary to-primary/70 px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30">
              {data?.totalFiltrado || 0} de {data?.total || 0} registros
            </span>
            <button
              onClick={() => {
                setFiltroViewed('todos')
                setFiltroStatus('todos')
                setBusca('')
              }}
              className="p-2 rounded-lg hover:bg-muted transition-all"
              title="Limpar filtros"
            >
              <XCircle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Total de Clientes */}
        <div className="group rounded-2xl border bg-gradient-to-br from-blue-500/10 via-card to-card p-6 transition-all hover:shadow-2xl hover:scale-105 hover:border-blue-500/50">
          <div className="flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50 group-hover:shadow-xl group-hover:shadow-blue-500/60 transition-all">
              <Users className="h-7 w-7 text-white" />
            </div>
            <span className="text-xs font-bold tracking-wider text-muted-foreground">CLIENTES</span>
          </div>
          <div className="mt-6">
            <p className="text-6xl font-black text-foreground bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
              {stats?.totalClientes || 0}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Total cadastrado</p>
          </div>
        </div>

        {/* Total de Contatos */}
        <div className="group rounded-2xl border bg-gradient-to-br from-violet-500/10 via-card to-card p-6 transition-all hover:shadow-2xl hover:scale-105 hover:border-violet-500/50">
          <div className="flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/50 group-hover:shadow-xl group-hover:shadow-violet-500/60 transition-all">
              <UserCircle className="h-7 w-7 text-white" />
            </div>
            <span className="text-xs font-bold tracking-wider text-muted-foreground">CONTATOS</span>
          </div>
          <div className="mt-6">
            <p className="text-6xl font-black text-foreground bg-gradient-to-r from-violet-500 to-violet-600 bg-clip-text text-transparent">
              {stats?.totalContatos || 0}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Total cadastrado</p>
          </div>
        </div>

        {/* Relatórios Enviados */}
        <div className="group rounded-2xl border bg-gradient-to-br from-amber-500/10 via-card to-card p-6 transition-all hover:shadow-2xl hover:scale-105 hover:border-amber-500/50">
          <div className="flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/50 group-hover:shadow-xl group-hover:shadow-amber-500/60 transition-all">
              <Send className="h-7 w-7 text-white" />
            </div>
            <span className="text-xs font-bold tracking-wider text-muted-foreground">ENVIOS</span>
          </div>
          <div className="mt-6">
            <p className="text-6xl font-black text-foreground bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
              {metricas?.enviados || 0}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Relatórios enviados</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(taxaEnvio, 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-amber-500">{taxaEnvio.toFixed(1)}%</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">do total de contatos</p>
          </div>
        </div>

        {/* Taxa de Interação */}
        <div className="group rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-card to-card p-6 transition-all hover:shadow-2xl hover:scale-105 hover:border-emerald-500/50">
          <div className="flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/50 group-hover:shadow-xl group-hover:shadow-emerald-500/60 transition-all">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <span className="text-xs font-bold tracking-wider text-muted-foreground">INTERAÇÃO</span>
          </div>
          <div className="mt-6">
            <p className="text-6xl font-black text-foreground bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              {metricas?.vistos || 0}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Relatórios interagidos</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(taxaInteracao, 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-emerald-500">{taxaInteracao.toFixed(1)}%</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">do total de contatos</p>
          </div>
        </div>
      </div>

      {/* 📊 GRÁFICOS E MÉTRICAS */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Gráfico de Taxa de Envio */}
        <div className="rounded-2xl border bg-gradient-to-br from-card to-card/50 p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Taxa de Envio</h3>
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
              {taxaEnvio.toFixed(1)}%
            </div>
          </div>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataEnvio}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={(entry) => {
                    const total = (metricas?.enviados || 0) + (metricas?.naoEnviados || 0);
                    if (total === 0) return '';
                    const percent = ((entry.value / total) * 100).toFixed(0);
                    return entry.value > 0 && percent !== '0' ? `${percent}%` : '';
                  }}
                  outerRadius={95}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive={false}
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
                >
                  {chartDataEnvio.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}
                  formatter={(value: any, name?: string) => [
                    `${value} relatórios`,
                    name || ''
                  ]}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '13px', fontWeight: '600' }}
                  iconType="circle"
                  iconSize={10}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 p-3 rounded-xl bg-muted/30 text-center border border-muted">
            <p className="text-xs font-medium text-muted-foreground">
              {metricas?.enviados || 0} enviados / {(metricas?.enviados || 0) + (metricas?.naoEnviados || 0)} total
            </p>
          </div>
        </div>

        {/* Gráfico de Taxa de Interação */}
        <div className="rounded-2xl border bg-gradient-to-br from-card to-card/50 p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Taxa de Interação</h3>
            <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold">
              {taxaInteracao.toFixed(1)}%
            </div>
          </div>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataInteracao}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={(entry) => {
                    const total = (metricas?.vistos || 0) + (metricas?.naoVistos || 0);
                    if (total === 0) return '';
                    const percent = ((entry.value / total) * 100).toFixed(0);
                    return entry.value > 0 && percent !== '0' ? `${percent}%` : '';
                  }}
                  outerRadius={95}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive={false}
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
                >
                  {chartDataInteracao.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}
                  formatter={(value: any, name?: string) => [
                    `${value} relatórios`,
                    name || ''
                  ]}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '13px', fontWeight: '600' }}
                  iconType="circle"
                  iconSize={10}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 p-3 rounded-xl bg-muted/30 text-center border border-muted">
            <p className="text-xs font-medium text-muted-foreground">
              {metricas?.vistos || 0} interagidos / {(metricas?.vistos || 0) + (metricas?.naoVistos || 0)} total
            </p>
          </div>
        </div>

        {/* Resumo de Métricas */}
        <div className="rounded-2xl border bg-gradient-to-br from-card to-card/50 p-6 shadow-lg hover:shadow-xl transition-all">
          <h3 className="text-lg font-bold text-foreground mb-4">Resumo de Métricas</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="text-sm font-medium text-foreground">Enviados</span>
              </div>
              <span className="text-2xl font-black text-emerald-500">{metricas?.enviados || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-500/20 to-gray-500/5 border border-gray-500/20 hover:border-gray-500/40 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-500/20">
                  <XCircle className="h-5 w-5 text-gray-500" />
                </div>
                <span className="text-sm font-medium text-foreground">Não Enviados</span>
              </div>
              <span className="text-2xl font-black text-gray-500">{metricas?.naoEnviados || 0}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-foreground">Interagidos</span>
              </div>
              <span className="text-2xl font-black text-blue-500">{metricas?.vistos || 0}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-red-500/5 border border-red-500/20 hover:border-red-500/40 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <EyeOff className="h-5 w-5 text-red-500" />
                </div>
                <span className="text-sm font-medium text-foreground">Não Interagidos</span>
              </div>
              <span className="text-2xl font-black text-red-500">{metricas?.naoVistos || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📋 TABELA DE TODOS OS RELATÓRIOS COM SCROLL */}
      <div className="rounded-2xl border bg-gradient-to-br from-card to-card/50 p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
              📊 Todos os Relatórios
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Scroll para ver todos os registros
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold border border-primary/20">
              Total: {data?.totalFiltrado || 0} registros
            </span>
            {loading && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
            )}
          </div>
        </div>

        <div className="overflow-auto max-h-[600px] rounded-xl border border-muted/50 custom-scrollbar">
          <table className="w-full">
            <thead className="bg-muted/30 sticky top-0 z-10">
              <tr className="border-b border-muted/50">
                <th className="text-left py-4 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="text-left py-4 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome do Contato</th>
                <th className="text-center py-4 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status Geral</th>
                <th className="text-center py-4 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Enviado</th>
                <th className="text-center py-4 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Interagido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/50">
              {data?.contatos.map((contato, index) => (
                <tr 
                  key={contato.id} 
                  className="hover:bg-muted/20 transition-all duration-200 group"
                >
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-sm group-hover:bg-primary/20 transition-all">
                      #{contato.id}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3 group/tooltip relative">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                        {contato.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {contato.nome}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{contato.telefone}</p>
                      </div>
                      
                      {/* TOOLTIP ELEGANTE */}
                      <div className="absolute left-0 top-full mt-3 z-50 hidden group-hover/tooltip:block animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl shadow-2xl p-6 min-w-[350px] border-2 border-gray-700/50 backdrop-blur-xl">
                          {/* Header do Tooltip */}
                          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {contato.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{contato.nome}</p>
                              <p className="text-xs text-gray-400">Detalhes da Pessoa</p>
                            </div>
                          </div>
                          
                          {/* Conteúdo */}
                          <div className="space-y-3">
                            {contato.empresa && (
                              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
                                  <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-400 font-medium mb-1">🏢 Empresa</p>
                                  <p className="text-sm font-bold text-blue-400 truncate">{contato.empresa}</p>
                                </div>
                              </div>
                            )}
                            
                            {contato.cargo && (
                              <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                <div className="p-2 rounded-lg bg-violet-500/20 flex-shrink-0">
                                  <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-400 font-medium mb-1">💼 Cargo</p>
                                  <p className="text-sm text-gray-200 truncate">{contato.cargo}</p>
                                </div>
                              </div>
                            )}
                            
                            {contato.telefone && contato.telefone !== '-' && (
                              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <div className="p-2 rounded-lg bg-emerald-500/20 flex-shrink-0">
                                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-400 font-medium mb-1">📱 Telefone</p>
                                  <p className="text-sm font-mono font-bold text-emerald-400">{contato.telefone}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all ${
                      contato.enviado && contato.interagido
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/50' 
                        : contato.enviado
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/50'
                        : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-gray-500/50'
                    }`}>
                      {contato.enviado && contato.interagido ? (
                        <>✅ Concluído</>
                      ) : contato.enviado ? (
                        <>📤 Enviado</>
                      ) : (
                        <>⏳ Pendente</>
                      )}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex justify-center">
                      {contato.enviado ? (
                        <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-all">
                          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-gray-500/20 group-hover:bg-gray-500/30 transition-all">
                          <XCircle className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex justify-center">
                      {contato.interagido ? (
                        <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-all">
                          <Activity className="h-6 w-6 text-blue-500" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-all">
                          <EyeOff className="h-6 w-6 text-red-500" />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(!data?.contatos || data.contatos.length === 0) && (
            <div className="text-center py-16">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhum relatório encontrado
                </p>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros ou remova a busca
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 rounded-2xl border bg-gradient-to-r from-card to-card/50 p-6 text-center shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <p className="text-sm font-medium text-muted-foreground">
              Sistema CRM • Atualização automática a cada {POLLING_INTERVAL / 1000} segundos
            </p>
          </div>
          {isLive && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
              🟢 Monitoramento Ativo
            </span>
          )}
        </div>
        {error && (
          <div className="mt-4 flex items-center justify-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <XCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-500 font-medium">{error}</p>
          </div>
        )}
      </footer>
    </div>
  )
}
