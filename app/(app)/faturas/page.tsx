'use client'

import { 
  Zap, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Activity,
  BarChart3,
  TrendingUp,
  Clock,
  Building2,
  Gauge
} from 'lucide-react'
import { useEffect, useState, useRef, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

// 🎨 CORES E INDICADORES
const COLORS = {
  injetadoOk: '#22c55e',      // Verde (sucesso)
  injetadoZero: '#ef4444',    // Vermelho (problema)
  warning: '#f59e0b',         // Amarelo (atenção)
}

// ⏱️ CONFIGURAÇÕES
const POLLING_INTERVAL = 5000 // 5 segundos (tempo real)

// 📦 INTERFACES
interface UC {
  uc: string
  injetado: number | null
  status: string
  mes_referente: string | null
  Plant_ID: string | null
  INVERSOR: string | null
  meta_mensal: number | null
}

interface ClienteAgrupado {
  cliente: string
  totalUCs: number
  ucs: UC[]
  totalInjetado: number
  ucsComProblema: number
  porcentagemProblema: number
}

interface Metricas {
  totalClientes: number
  totalUCs: number
  ucsInjetadoZero: number
  ucsInjetadoOk: number
  taxaProblema: number
  totalInjetado: number
}

interface ApiResponse {
  clientesAgrupados: ClienteAgrupado[]
  metricas: Metricas
  total: number
}

// 📊 COMPONENTE DE ANEL DE PROGRESSO
function ProgressRing({ 
  percentage, 
  size = 140, 
  strokeWidth = 12,
  color = '#22c55e',
  label = ''
}: { 
  percentage: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
}) {
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
          className="transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-foreground">{percentage.toFixed(1)}%</span>
        {label && <span className="text-xs text-muted-foreground mt-1">{label}</span>}
      </div>
    </div>
  )
}

// 🎯 COMPONENTE PRINCIPAL DO DASHBOARD
export default function FaturasDashboardPage() {
  // 📊 Estados principais
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isLive, setIsLive] = useState(true)
  const [currentClienteIndex, setCurrentClienteIndex] = useState(0)
  
  // 🕐 Tempo atual
  const [currentTime, setCurrentTime] = useState(new Date())

  // 📍 Referências
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 🔄 FUNÇÃO PARA BUSCAR DADOS
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      // Forçar bypass do cache adicionando timestamp
      const timestamp = new Date().getTime()
      const url = forceRefresh 
        ? `/api/faturas/metrics?force=${timestamp}` 
        : `/api/faturas/metrics?t=${timestamp}`
        
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (!response.ok) {
        throw new Error('Erro ao buscar dados')
      }

      const apiData: ApiResponse = await response.json()
      console.log('🔄 Dados atualizados:', {
        totalClientes: apiData.metricas.totalClientes,
        primeirosClientes: apiData.clientesAgrupados.slice(0, 3).map(c => c.cliente)
      })
      
      setData(apiData)
      setLastUpdate(new Date())
      setError(null)
      setLoading(false)
    } catch (err) {
      console.error('Erro ao buscar faturas:', err)
      setError('Erro ao carregar dados. Tentando novamente...')
      setLoading(false)
    }
  }, [])

  // 🚀 INICIALIZAÇÃO E POLLING
  useEffect(() => {
    // Primeira busca
    fetchData()

    // Configurar polling se modo live estiver ativo
    if (isLive) {
      intervalRef.current = setInterval(fetchData, POLLING_INTERVAL)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchData, isLive])

  // ⏰ Relógio
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 🔄 Rotação CORRIGIDA - sem conflitos
  useEffect(() => {
    if (!data?.clientesAgrupados) return
    
    const clientesComProblema = data.clientesAgrupados.filter(c => c.ucsComProblema > 0)
    console.log('🔄 Iniciando rotação com', clientesComProblema.length, 'clientes')
    
    if (clientesComProblema.length <= 1) {
      setCurrentClienteIndex(0)
      return
    }

    // Começar do índice 0
    setCurrentClienteIndex(0)
    
    let currentIndex = 0
    const intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % clientesComProblema.length
      console.log('🔄 Mudando para índice:', currentIndex, 'cliente:', clientesComProblema[currentIndex]?.cliente)
      setCurrentClienteIndex(currentIndex)
    }, 8000) // Troca a cada 8 segundos

    return () => {
      console.log('🧹 Limpando interval')
      clearInterval(intervalId)
    }
  }, [data?.clientesAgrupados?.length]) // Só reexecuta se a quantidade de clientes mudar

  // 🎨 FUNÇÕES AUXILIARES
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchData()
  }

  const handleForceRefresh = () => {
    console.log('🔄 Forçando refresh completo...')
    setLoading(true)
    fetchData(true) // Passando true para forçar refresh
  }

  const toggleLive = () => {
    setIsLive(!isLive)
    if (!isLive) {
      // Reativar polling
      fetchData()
    }
  }

  const formatNumber = (num: number | null) => {
    if (num === null) return '0'
    return new Intl.NumberFormat('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(num)
  }

  // 📊 PREPARAR DADOS PARA GRÁFICOS
  const chartData = data ? [
    { name: 'UCs OK', value: data.metricas.ucsInjetadoOk, color: COLORS.injetadoOk },
    { name: 'Injetado Zerado', value: data.metricas.ucsInjetadoZero, color: COLORS.injetadoZero },
  ] : []

  // 🎯 LOADING STATE
  if (loading && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-xl text-muted-foreground">Carregando Dashboard de Faturas...</p>
        </div>
      </div>
    )
  }

  // ❌ ERROR STATE
  if (error && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500" />
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

  return (
    <div className="min-h-screen bg-background p-8 lg:p-12">
      {/* 🎯 HEADER */}
      <header className="mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Botão Voltar */}
          <a
            href="/dashboard"
            className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary/20 bg-card hover:bg-primary/10 hover:border-primary/40 transition-all shadow-lg hover:shadow-xl group"
            title="Voltar ao dashboard"
          >
            <svg className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/50 animate-pulse">
            <Zap className="h-8 w-8 text-white" />
          </div>
          
          <div>
            <h1 className="text-4xl font-bold text-foreground">Dashboard de Faturas</h1>
            <p className="text-lg text-muted-foreground mt-1">Monitoramento em Tempo Real - Injeção de Energia</p>
          </div>
        </div>

        {/* DATA E HORA */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 rounded-xl bg-card px-6 py-3 shadow-md border border-border">
            <Clock className="h-5 w-5 text-primary" />
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground tabular-nums">{formatTime(currentTime)}</p>
              <p className="text-xs text-muted-foreground capitalize">{formatDate(currentTime)}</p>
            </div>
          </div>

          {/* CONTROLES */}
          <div className="flex items-center gap-3">
            {/* Última Atualização */}
            {lastUpdate && (
              <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm border border-border">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Atualizado: {formatTime(lastUpdate)}
                </span>
              </div>
            )}

            {/* Botão Live */}
            <button
              onClick={toggleLive}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
                isLive
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {isLive ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  <span>LIVE</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  <span>PAUSADO</span>
                </>
              )}
            </button>

            {/* Botão Refresh */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all hover:shadow-lg"
              title="Atualizar dados"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* 📊 MÉTRICAS PRINCIPAIS */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total de Contratos */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Building2 className="h-8 w-8 text-blue-500" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Contratos</span>
          </div>
          <p className="text-4xl font-bold text-foreground">{metricas?.totalClientes || 0}</p>
          <p className="text-sm text-muted-foreground mt-2">Total de contratos</p>
        </div>

        {/* Total de UCs */}
        <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Gauge className="h-8 w-8 text-purple-500" />
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Unidades</span>
          </div>
          <p className="text-4xl font-bold text-foreground">{metricas?.totalUCs || 0}</p>
          <p className="text-sm text-muted-foreground mt-2">Total de UCs</p>
        </div>

        {/* UCs com Injetado OK */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Operando</span>
          </div>
          <p className="text-4xl font-bold text-foreground">{metricas?.ucsInjetadoOk || 0}</p>
          <p className="text-sm text-muted-foreground mt-2">UCs operando normalmente</p>
        </div>

        {/* UCs com Problema */}
        <div className="rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400">Problemas</span>
          </div>
          <p className="text-4xl font-bold text-red-600 dark:text-red-400">{metricas?.ucsInjetadoZero || 0}</p>
          <p className="text-sm text-muted-foreground mt-2">Injetado Zerado</p>
        </div>

        {/* Total Injetado */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/20 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8 text-amber-500" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Injetado</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{formatNumber(metricas?.totalInjetado || 0)}</p>
          <p className="text-sm text-muted-foreground mt-2">kWh Total</p>
        </div>
      </div>

      {/* 📊 GRÁFICOS E ALERTAS */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Esquerdo - Gráfico e Taxa */}
        <div className="space-y-6">
          {/* Gráfico de Pizza Compacto */}
          <div className="rounded-xl bg-card border border-border p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Distribuição de Status</h2>
            </div>
            
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Taxa de Problema Compacta */}
          <div className="rounded-xl bg-card border border-border p-4 shadow-lg flex items-center justify-around">
            <div className="text-center">
              <h3 className="text-sm font-bold text-muted-foreground mb-3">Taxa de Problemas</h3>
              <ProgressRing 
                percentage={metricas?.taxaProblema || 0} 
                size={120}
                strokeWidth={10}
                color={
                  (metricas?.taxaProblema || 0) > 50 ? COLORS.injetadoZero :
                  (metricas?.taxaProblema || 0) > 20 ? COLORS.warning :
                  COLORS.injetadoOk
                }
                label="das UCs"
              />
            </div>
            <div className="text-center space-y-2">
              <div className="text-xs text-muted-foreground">UCs com Problema</div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {metricas?.ucsInjetadoZero || 0}
              </div>
              <div className="text-xs text-muted-foreground">de {metricas?.totalUCs || 0} UCs</div>
            </div>
          </div>
        </div>

        {/* Lado Direito - Rotação de Clientes com Problemas */}
        <div className="rounded-xl bg-card border border-border shadow-lg overflow-hidden">
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
              <h2 className="text-lg font-bold text-foreground">Clientes com Problemas</h2>
            </div>
            <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {data?.clientesAgrupados.filter(c => c.ucsComProblema > 0).length || 0}
            </div>
          </div>

          <div className="h-[360px] p-6 flex items-center justify-center">
            {data?.clientesAgrupados && data.clientesAgrupados.filter(c => c.ucsComProblema > 0).length > 0 ? (
              (() => {
                const clientesComProblema = data.clientesAgrupados.filter(c => c.ucsComProblema > 0)
                const cliente = clientesComProblema[currentClienteIndex] || clientesComProblema[0]
                
                return (
                  <div className="w-full text-center transform transition-all duration-700">
                    {/* Nome do Cliente */}
                    <div className="mb-6">
                      <h3 className="text-4xl font-bold text-foreground mb-2">{cliente.cliente}</h3>
                    </div>

                    {/* Quantidade de Problemas */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                      <AlertTriangle className="h-12 w-12 text-red-500" />
                      <div className="text-center">
                        <div className="text-6xl font-bold text-red-600 dark:text-red-400 mb-2">
                          {cliente.ucsComProblema}
                        </div>
                        <div className="text-lg text-muted-foreground">
                          {cliente.ucsComProblema === 1 ? 'UC com problema' : 'UCs com problemas'}
                        </div>
                      </div>
                    </div>

                    {/* Indicador de Progresso */}
                    {clientesComProblema.length > 1 && (
                      <div className="flex justify-center items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {currentClienteIndex + 1} de {clientesComProblema.length}
                        </span>
                        <div className="flex gap-2">
                          {clientesComProblema.map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-2 w-12 rounded-full transition-all duration-500 ${
                                idx === currentClienteIndex 
                                  ? 'bg-red-500' 
                                  : 'bg-red-500/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()
            ) : (
              <div className="flex flex-col items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
                <p className="text-lg font-medium text-foreground">Nenhum problema detectado</p>
                <p className="text-sm text-muted-foreground mt-1">Todas as UCs operando normalmente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📋 TABELA DE CLIENTES E UCs - VISUALIZAÇÃO OTIMIZADA */}
      <div className="rounded-xl bg-card border border-border shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-2.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-foreground">Monitoramento em Tempo Real</h2>
            <span className="text-xs text-muted-foreground">
              {data?.clientesAgrupados.length || 0} clientes • {metricas?.totalUCs || 0} UCs
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <span className="text-muted-foreground">Operando</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-muted-foreground">Problema</span>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-2.5 max-h-[calc(100vh-450px)] overflow-y-auto">
          {data?.clientesAgrupados && data.clientesAgrupados.length > 0 ? (
            data.clientesAgrupados.map((cliente, idx) => (
              <div
                key={idx}
                className={`rounded-lg border transition-all ${
                  cliente.ucsComProblema > 0
                    ? 'border-red-500/40 bg-red-500/[0.03]'
                    : 'border-border/50 bg-card'
                }`}
              >
                {/* HEADER DO CLIENTE - INLINE */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/30">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0 ${
                      cliente.ucsComProblema > 0 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}>
                      <Building2 className="h-3.5 w-3.5 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{cliente.cliente}</h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">UCs:</span>
                        <span className="font-bold text-foreground">{cliente.totalUCs}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Total Injetado:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatNumber(cliente.totalInjetado)} kWh
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Taxa Problema:</span>
                        <span className={`font-bold ${cliente.porcentagemProblema > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {cliente.porcentagemProblema.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {cliente.ucsComProblema > 0 ? (
                      <div className="flex items-center gap-1 bg-red-500 px-2.5 py-0.5 rounded-full">
                        <AlertTriangle className="h-3 w-3 text-white" />
                        <span className="text-[11px] font-bold text-white">
                          {cliente.ucsComProblema}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-emerald-500 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                        <span className="text-[11px] font-bold text-white">OK</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* GRID DE UCs - DENSIDADE MÁXIMA */}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-14 gap-1.5 p-2.5">
                  {cliente.ucs.map((uc, ucIdx) => (
                    <div
                      key={ucIdx}
                      className={`group relative rounded border p-1.5 text-center transition-all hover:scale-110 hover:z-10 hover:shadow-lg cursor-pointer ${
                        uc.status === 'injetado_zerado'
                          ? 'border-red-500/60 bg-red-500/10'
                          : 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10'
                      }`}
                      title={`UC: ${uc.uc} | Injetado: ${formatNumber(uc.injetado)} kWh | Clique para mais detalhes`}
                      onClick={() => {
                        // Mostrar detalhes da UC em um alert por enquanto (pode ser melhorado com modal)
                        const detalhes = [
                          `🏠 Cliente: ${cliente.cliente}`,
                          `⚡ UC: ${uc.uc}`,
                          `📊 Injetado: ${formatNumber(uc.injetado)} kWh`,
                          `📅 Mês Ref.: ${uc.mes_referente || 'N/A'}`,
                          `🎯 Meta: ${uc.meta_mensal ? formatNumber(uc.meta_mensal) + ' kWh' : 'N/A'}`,
                          `🏭 Plant ID: ${uc.Plant_ID || 'N/A'}`,
                          `🔌 Inversor: ${uc.INVERSOR || 'N/A'}`,
                          `📈 Status: ${uc.status === 'injetado_zerado' ? '⚠️ Zero' : '✅ OK'}`
                        ].join('\n')
                        alert(detalhes)
                      }}
                    >
                      {/* Badge de Status */}
                      <div className="flex items-center justify-center mb-0.5">
                        {uc.status === 'injetado_zerado' ? (
                          <div className="flex items-center gap-0.5">
                            <Zap className="h-2.5 w-2.5 text-red-500" />
                            <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase leading-none">
                              Zero
                            </span>
                          </div>
                        ) : (
                          <Zap className="h-2.5 w-2.5 text-emerald-500" />
                        )}
                      </div>
                      
                      {/* UC */}
                      <div className="font-mono text-[10px] font-bold text-foreground mb-0.5 truncate leading-none">
                        {uc.uc}
                      </div>
                      
                      {/* Valor */}
                      <div className={`text-xs font-bold leading-none ${
                        uc.status === 'injetado_zerado' 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {formatNumber(uc.injetado)}
                      </div>

                      {/* Tooltip no hover - Versão melhorada */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                        <div className="bg-popover border border-border rounded-lg shadow-xl px-3 py-2 text-left whitespace-nowrap">
                          <div className="text-xs font-bold text-foreground mb-1">🏠 {cliente.cliente}</div>
                          <div className="text-xs font-bold text-foreground mb-1">⚡ UC: {uc.uc}</div>
                          <div className="text-[11px] text-muted-foreground space-y-0.5">
                            <div className={`font-bold ${uc.status === 'injetado_zerado' ? 'text-red-500' : 'text-emerald-500'}`}>
                              📊 Injetado: {formatNumber(uc.injetado)} kWh 
                              {uc.status === 'injetado_zerado' ? ' ⚠️' : ' ✅'}
                            </div>
                            {uc.meta_mensal && (
                              <div>🎯 Meta: <span className="font-bold text-foreground">{formatNumber(uc.meta_mensal)} kWh</span></div>
                            )}
                            {uc.mes_referente && (
                              <div>📅 Mês: <span className="font-bold text-foreground">{uc.mes_referente}</span></div>
                            )}
                            {uc.Plant_ID && (
                              <div>🏭 Plant: <span className="font-bold text-foreground">{uc.Plant_ID}</span></div>
                            )}
                            {uc.INVERSOR && (
                              <div>🔌 Inversor: <span className="font-bold text-foreground">{uc.INVERSOR}</span></div>
                            )}
                            <div className="text-[10px] text-muted-foreground mt-1 pt-1 border-t border-border">
                              💡 Clique para mais detalhes
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg text-muted-foreground">Nenhuma fatura encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
