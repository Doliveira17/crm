'use client'

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Gauge,
  RefreshCw,
  Search,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const COLORS = {
  injetadoOk: '#22c55e',
  injetadoZero: '#ef4444',
  semDados: '#94a3b8',
  warning: '#f59e0b',
}

const POLLING_INTERVAL = 5000
const ITEMS_POR_PAGINA = 20

interface UC {
  uc: string
  injetado: number | null
  status: 'ok' | 'injetado_zerado' | 'sem_dados'
  mes_referente: string | null
  Plant_ID: string | null
  INVERSOR: string | null
  meta_mensal: number | null
}

interface ClienteAgrupado {
  cliente: string
  cpfCnpj: string | null
  totalUCs: number
  ucs: UC[]
  totalInjetado: number
  ucsComProblema: number
  ucsSemDados: number
  porcentagemProblema: number
}

interface Metricas {
  totalClientes: number
  totalUCs: number
  ucsInjetadoZero: number
  ucsInjetadoOk: number
  ucsSemDados: number
  taxaProblema: number
  totalInjetado: number
}

interface ApiResponse {
  clientesAgrupados: ClienteAgrupado[]
  metricas: Metricas
  total: number
}

function ProgressRing({
  percentage,
  size = 92,
  strokeWidth = 10,
  color = COLORS.injetadoOk,
  label = '',
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
    <div className="relative shrink-0" style={{ width: size, height: size }}>
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
        <span className="text-xl font-semibold tabular-nums">{percentage.toFixed(1)}%</span>
        {label ? <span className="text-[10px] text-muted-foreground">{label}</span> : null}
      </div>
    </div>
  )
}

type StatusFilter = 'todos' | 'com_problema' | 'sem_dados' | 'ok'
type SortBy = 'problemas_desc' | 'nome_asc' | 'ucs_desc' | 'injetado_desc'

export default function FaturasDashboardPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isLive, setIsLive] = useState(true)
  const [ucsValidacao, setUcsValidacao] = useState<Map<string, { estado: string | null; historico: any[] }>>(new Map())

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [sortBy, setSortBy] = useState<SortBy>('problemas_desc')
  const [ucDialog, setUcDialog] = useState<{ cliente: string; uc: UC } | null>(null)
  const [expandedClientes, setExpandedClientes] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstLoad = useRef(true)
  const previousDataRef = useRef<string | null>(null)

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      const timestamp = new Date().getTime()
      const url = forceRefresh
        ? `/api/faturas/metrics?force=${timestamp}`
        : `/api/faturas/metrics?t=${timestamp}`

      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar dados')
      }

      const apiData: ApiResponse = await response.json()
      
      // Comparar com os dados anteriores para evitar re-renders desnecessários
      const dataString = JSON.stringify(apiData)
      if (previousDataRef.current !== dataString) {
        setData(apiData)
        previousDataRef.current = dataString
      }
      
      setLastUpdate(new Date())
      setError(null)
      setLoading(false)
    } catch (err) {
      console.error('Erro ao buscar faturas:', err)
      setError('Erro ao carregar dados. Tentando novamente…')
      setLoading(false)
    }
  }, [])

  // Carregar estados de validação das UCs do banco de dados
  useEffect(() => {
    const carregarEstadosUcs = async () => {
      try {
        const { data: ucsDb, error } = await (supabase as any)
          .from('crm_ucs_validacao')
          .select('documento, uc, estado_de_chamado, historico_validacao')

        if (error) {
          console.error('Erro ao carregar estados das UCs:', error)
          return
        }

        if (ucsDb && ucsDb.length > 0) {
          const mapa = new Map<string, { estado: string | null; historico: any[] }>()
          ucsDb.forEach((row: any) => {
            const chave = `${row.documento}:${row.uc}`
            mapa.set(chave, {
              estado: row.estado_de_chamado,
              historico: (row.historico_validacao as any[]) || []
            })
          })
          setUcsValidacao(mapa)
          console.log('📋 Estados de UCs carregados:', mapa.size, 'UCs')
        }
      } catch (erro) {
        console.error('Erro ao carregar estados das UCs:', erro)
      }
    }

    void carregarEstadosUcs()
  }, []) // Executar apenas uma vez ao montar

  // Auto-resolver UCs quando injetado volta a ser maior que 0
  useEffect(() => {
    const autoResolverUcs = async () => {
      if (!data?.clientesAgrupados) return

      // Procurar UCs em validação que agora estão OK
      const ucsParaResolver: Array<{ 
        documento: string
        uc: string
        chaveUc: string
        historicoAtual: any[]
      }> = []

      data.clientesAgrupados.forEach(cliente => {
        if (!cliente.cpfCnpj) return
        const documentoNormalizado = cliente.cpfCnpj.replace(/[.\-\/]/g, '')

        cliente.ucs.forEach(uc => {
          const chaveUc = `${documentoNormalizado}:${uc.uc}`
          const validacao = ucsValidacao.get(chaveUc)

          // Se está em "Validando" mas agora o injetado > 0, resolver para Verde
          if (validacao?.estado === 'Validando' && uc.status === 'ok') {
            ucsParaResolver.push({
              documento: documentoNormalizado,
              uc: uc.uc,
              chaveUc,
              historicoAtual: validacao.historico || []
            })
          }
        })
      })

      // Atualizar UCs resolvidas para "Verde"
      for (const ucResolving of ucsParaResolver) {
        const agora = new Date()
        const dia = String(agora.getDate()).padStart(2, '0')
        const mes = String(agora.getMonth() + 1).padStart(2, '0')
        const ano = agora.getFullYear()
        const dataFormatada = `${dia}/${mes}/${ano}`

        const novoHistorico = [
          ...ucResolving.historicoAtual,
          {
            estado: 'Verde',
            data: dataFormatada,
            timestamp: new Date().toISOString()
          }
        ]

        // Atualizar no banco
        const { error } = await (supabase as any)
          .from('crm_ucs_validacao')
          .update({
            estado_de_chamado: 'Verde',
            historico_validacao: novoHistorico
          })
          .eq('documento', ucResolving.documento)
          .eq('uc', ucResolving.uc)

        if (!error) {
          // Atualizar estado local
          setUcsValidacao(prev => {
            const novoMapa = new Map(prev)
            novoMapa.set(ucResolving.chaveUc, {
              estado: 'Verde',
              historico: novoHistorico
            })
            return novoMapa
          })
          console.log(`✅ UC ${ucResolving.uc} auto-resolvida para Verde`)
        } else {
          console.error('❌ Erro ao resolver UC:', error)
        }
      }
    }

    void autoResolverUcs()
  }, [data?.clientesAgrupados, ucsValidacao])

  useEffect(() => {
    void fetchData()

    if (isLive) {
      intervalRef.current = setInterval(fetchData, POLLING_INTERVAL)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchData, isLive])

  const refresh = (force = false) => {
    setLoading(true)
    void fetchData(force)
  }

  const toggleLive = () => {
    setIsLive((prev) => !prev)
    if (!isLive) {
      void fetchData()
    }
  }

  // Marcar UC como "Validando" quando clicar em UC vermelha
  const marcarUcComoValidando = async (cpfCnpj: string | null, uc: UC) => {
    if (!cpfCnpj) {
      console.warn('❌ Sem CPF/CNPJ')
      return
    }

    const documentoNormalizado = cpfCnpj.replace(/[.\-\/]/g, '')
    const chaveUc = `${documentoNormalizado}:${uc.uc}`

    try {
      console.log(`⏳ Marcando UC ${uc.uc} como Validando...`)

      // Formatar data como DD/MM/YYYY
      const agora = new Date()
      const dia = String(agora.getDate()).padStart(2, '0')
      const mes = String(agora.getMonth() + 1).padStart(2, '0')
      const ano = agora.getFullYear()
      const dataFormatada = `${dia}/${mes}/${ano}`

      // Adicionar ao histórico
      const validacaoAtual = ucsValidacao.get(chaveUc)
      const historicoAtual = validacaoAtual?.historico || []
      const novoHistorico = [
        ...historicoAtual,
        {
          estado: 'Validando',
          data: dataFormatada,
          timestamp: new Date().toISOString()
        }
      ]

      // ✅ ATUALIZAR ESTADO LOCAL IMEDIATAMENTE
      setUcsValidacao(prev => {
        const novoMapa = new Map(prev)
        novoMapa.set(chaveUc, {
          estado: 'Validando',
          historico: novoHistorico
        })
        return novoMapa
      })

      // Atualizar ou inserir no banco
      const { data, error } = await (supabase as any)
        .from('crm_ucs_validacao')
        .upsert({
          documento: documentoNormalizado,
          uc: uc.uc,
          estado_de_chamado: 'Validando',
          historico_validacao: novoHistorico
        })

      if (error) {
        console.error('❌ Erro ao atualizar UC no banco:', error)
        console.error('❌ Detalhes do erro:', error.message, error.code)
        return
      }

      console.log(`✅ UC ${uc.uc} marcada como Validando em ${dataFormatada}`)
      console.log('✅ Dados salvos no banco:', { documento: documentoNormalizado, uc: uc.uc, estado: 'Validando' })
      
      // Forçar refresh em background
      setTimeout(() => {
        void fetchData(true)
      }, 300)
      
    } catch (erro) {
      console.error('❌ Erro ao marcar UC:', erro)
    }
  }

  const formatTimeShort = (date: Date) =>
    date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const formatNumber = (num: number | null) => {
    if (num === null) return '0'
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  const formatUcInjetado = (uc: UC) => {
    if (uc.status === 'sem_dados' || uc.injetado === null) return 'N/D'
    return formatNumber(uc.injetado)
  }

  const metricas = data?.metricas

  const chartData = data
    ? [
        { name: 'UCs OK', value: data.metricas.ucsInjetadoOk, color: COLORS.injetadoOk },
        { name: 'Injetado Zerado', value: data.metricas.ucsInjetadoZero, color: COLORS.injetadoZero },
        { name: 'Sem Dados', value: data.metricas.ucsSemDados, color: COLORS.semDados },
      ]
    : []

  const clientesComputed = useMemo(() => {
    const clientes = data?.clientesAgrupados ?? []
    // Remover duplicatas baseado no nome do cliente
    const clientesUnicos = clientes.reduce((acc, cliente) => {
      const existing = acc.find(c => c.cliente === cliente.cliente)
      if (!existing) {
        acc.push(cliente)
      }
      return acc
    }, [] as typeof clientes)
    
    return clientesUnicos.map((cliente) => {
      const ucsSemDados = cliente.ucs.filter((uc) => uc.status === 'sem_dados').length
      const ucsOk = cliente.ucs.filter((uc) => uc.status === 'ok').length
      return { ...cliente, ucsSemDados, ucsOk }
    })
  }, [data?.clientesAgrupados])

  // UCs com problemas para a sidebar (excluindo UCs em validação)
  const ucsComProblemas = useMemo(() => {
    const clientes = data?.clientesAgrupados ?? []
    const problemas: Array<{ uc: string; cliente: string; injetado: number | null }> = []
    
    clientes.forEach((cliente) => {
      cliente.ucs.forEach((uc) => {
        if (uc.status === 'injetado_zerado') {
          // Normalizar documento igual ao salvamento no banco (sem pontuação)
          const documentoNormalizado = (cliente.cpfCnpj || cliente.cliente).replace(/[.\-\/]/g, '')
          const chaveUc = `${documentoNormalizado}:${uc.uc}`
          const estadoUc = ucsValidacao.get(chaveUc)
          // Só adiciona como problema se NÃO estiver em validação
          if (!estadoUc || estadoUc.estado !== 'Validando') {
            problemas.push({
              uc: uc.uc,
              cliente: cliente.cliente,
              injetado: uc.injetado
            })
          }
        }
      })
    })
    
    return problemas
  }, [data?.clientesAgrupados, ucsValidacao])

  // Contar UCs em validação para o card "Validando"
  const ucsValidandoContagem = useMemo(() => {
    let total = 0
    ucsValidacao.forEach((validacao) => {
      if (validacao.estado === 'Validando') {
        total++
      }
    })
    return total
  }, [ucsValidacao])

  const filteredClientes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const matchesQuery = (cliente: (typeof clientesComputed)[number]) => {
      if (!query) return true
      if (cliente.cliente.toLowerCase().includes(query)) return true
      return cliente.ucs.some((uc) => uc.uc.toLowerCase().includes(query))
    }

    const matchesFilter = (cliente: (typeof clientesComputed)[number]) => {
      if (statusFilter === 'todos') return true
      if (statusFilter === 'com_problema') return cliente.ucsComProblema > 0
      if (statusFilter === 'sem_dados') return cliente.ucsSemDados > 0
      return cliente.ucsComProblema === 0 && cliente.ucsSemDados === 0
    }

    const compare = (a: (typeof clientesComputed)[number], b: (typeof clientesComputed)[number]) => {
      // Prioridade de ordenação:
      // 1º: Injetados zerados (problemas)
      // 2º: Injetados OK (maior que zero)
      // 3º: Sem dados (nulos)
      
      const getPrioridade = (cliente: typeof a) => {
        if (cliente.ucsComProblema > 0) return 1 // Problemas = maior prioridade
        if (cliente.ucsOk > 0) return 2 // OK = média prioridade
        return 3 // Sem dados = menor prioridade
      }
      
      const prioridadeA = getPrioridade(a)
      const prioridadeB = getPrioridade(b)
      
      if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB
      
      // Dentro da mesma prioridade, ordenar por quantidade de problemas
      if (prioridadeA === 1 && b.ucsComProblema !== a.ucsComProblema) {
        return b.ucsComProblema - a.ucsComProblema
      }
      
      // Depois por nome
      return a.cliente.localeCompare(b.cliente, 'pt-BR')
    }

    return clientesComputed.filter(matchesQuery).filter(matchesFilter).sort(compare)
  }, [clientesComputed, searchQuery, statusFilter, sortBy])

  // Resetar para p\u00e1gina 1 quando mudar filtros ou busca
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, sortBy])

  // Pagina\u00e7\u00e3o
  const paginationData = useMemo(() => {
    const totalClientes = filteredClientes.length
    const totalPages = Math.ceil(totalClientes / ITEMS_POR_PAGINA)
    const startIndex = (currentPage - 1) * ITEMS_POR_PAGINA
    const endIndex = startIndex + ITEMS_POR_PAGINA
    const clientesPaginados = filteredClientes.slice(startIndex, endIndex)
    
    return {
      totalClientes,
      totalPages,
      startIndex,
      endIndex,
      clientesPaginados,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    }
  }, [filteredClientes, currentPage])

  const goToNextPage = () => {
    if (paginationData.hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const goToPrevPage = () => {
    if (paginationData.hasPrevPage) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, paginationData.totalPages)))
  }

  // Auto-expandir clientes com problemas APENAS na primeira vez
  useEffect(() => {
    if (isFirstLoad.current && filteredClientes.length > 0) {
      const clientesComProblema = filteredClientes
        .filter((c) => c.ucsComProblema > 0)
        .map((c) => c.cliente)
      setExpandedClientes(new Set(clientesComProblema))
      isFirstLoad.current = false
    }
  }, [filteredClientes])

  const toggleCliente = (clienteNome: string) => {
    setExpandedClientes((prev) => {
      const next = new Set(prev)
      if (next.has(clienteNome)) {
        next.delete(clienteNome)
      } else {
        next.add(clienteNome)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedClientes(new Set(filteredClientes.map((c) => c.cliente)))
  }

  const collapseAll = () => {
    setExpandedClientes(new Set())
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <div>
            <p className="text-base font-medium">Carregando…</p>
            <p className="text-sm text-muted-foreground">Preparando o dashboard de faturas.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Erro ao carregar
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button onClick={() => refresh()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight">Faturas</h1>
          <p className="text-xs text-muted-foreground">
            Monitoramento em tempo real da injeção de energia (UCs).
          </p>
        </div>

        <div className="flex flex-col gap-1.5 sm:items-end">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant={isLive ? 'default' : 'secondary'}
              className={cn('gap-1.5 text-[10px] py-0', isLive ? 'bg-emerald-600 hover:bg-emerald-600' : undefined)}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', isLive ? 'bg-white' : 'bg-muted-foreground')} />
              {isLive ? 'LIVE' : 'PAUSADO'}
            </Badge>

            {lastUpdate ? (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Activity className="h-3 w-3" />
                Atualizado às {formatTimeShort(lastUpdate)}
              </span>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              onClick={toggleLive}
              className="gap-1.5 h-7 text-xs px-2.5"
              title={isLive ? 'Pausar atualização automática' : 'Ativar atualização automática'}
            >
              {isLive ? 'Pausar' : 'Ativar'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refresh()}
              disabled={loading}
              title="Atualizar agora"
              className="h-7 w-7"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading ? 'animate-spin' : undefined)} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refresh(true)}
              disabled={loading}
              className="text-muted-foreground h-7 text-xs px-2.5"
              title="Recarregar sem cache"
            >
              Recarregar
            </Button>
          </div>

          <div className="flex w-full flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente ou UC…"
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs">
                <SelectValue placeholder="Filtro" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="com_problema">Com problema</SelectItem>
                <SelectItem value="sem_dados">Sem dados</SelectItem>
                <SelectItem value="ok">Somente OK</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="problemas_desc">Mais problemas</SelectItem>
                <SelectItem value="injetado_desc">Mais injetado</SelectItem>
                <SelectItem value="ucs_desc">Mais UCs</SelectItem>
                <SelectItem value="nome_asc">Nome (A–Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        <Card className="border border-blue-200 dark:border-blue-900/50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <div className="p-1.5 rounded-md bg-blue-500/10">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-muted-foreground font-medium">Clientes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="text-2xl font-bold tabular-nums">{metricas?.totalClientes ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Clientes</p>
          </CardContent>
        </Card>

        <Card className="border border-violet-200 dark:border-violet-900/50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <div className="p-1.5 rounded-md bg-violet-500/10">
                <Gauge className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-muted-foreground font-medium">UCs</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="text-2xl font-bold tabular-nums">{metricas?.totalUCs ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Unidades cadastradas</p>
          </CardContent>
        </Card>

        <Card className="border border-emerald-200 dark:border-emerald-900/50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <div className="p-1.5 rounded-md bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-muted-foreground font-medium">Operando</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{metricas?.ucsInjetadoOk ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Injetado &gt; 0</p>
          </CardContent>
        </Card>

        <Card className="border border-amber-200 dark:border-amber-900/50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <div className="p-1.5 rounded-md bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-muted-foreground font-medium">Validando</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{ucsValidandoContagem}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Sendo investigadas</p>
          </CardContent>
        </Card>

        <Card className="border border-red-200 dark:border-red-900/50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <div className="p-1.5 rounded-md bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-muted-foreground font-medium">Problemas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
              {ucsComProblemas.length}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Sem dados: {metricas?.ucsSemDados ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border border-amber-200 dark:border-amber-900/50 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <div className="p-1.5 rounded-md bg-amber-500/10">
                <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-muted-foreground font-medium">Injetado</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-500">{formatNumber(metricas?.totalInjetado ?? 0)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">kWh total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Coluna Direita - Estatísticas */}
        <div className="lg:col-span-1 space-y-3">
          {/* Gráfico de Status */}
          <Card className="border border-indigo-200 dark:border-indigo-900/50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <div className="p-1.5 rounded-md bg-indigo-500/10">
                  <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span>Status das UCs</span>
              </CardTitle>
              <CardDescription className="text-xs">Período atual</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <div className="h-[160px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={chartData} 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={65} 
                      innerRadius={35}
                      dataKey="value" 
                      nameKey="name"
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 pt-3 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-xs text-muted-foreground">UCs OK</span>
                  </div>
                  <span className="text-sm font-semibold">{metricas?.ucsInjetadoOk ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-red-500" />
                    <span className="text-xs text-muted-foreground">Zerados</span>
                  </div>
                  <span className="text-sm font-semibold">{metricas?.ucsInjetadoZero ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-gray-400" />
                    <span className="text-xs text-muted-foreground">Sem dados</span>
                  </div>
                  <span className="text-sm font-semibold">{metricas?.ucsSemDados ?? 0}</span>
                </div>
                <div className="pt-2 mt-2 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Taxa de problemas</span>
                  <span className="text-base font-bold text-red-600 dark:text-red-400">{(metricas?.taxaProblema ?? 0).toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de UCs com Problemas */}
          {ucsComProblemas.length > 0 && (
            <Card className="border border-red-200 dark:border-red-900/50 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="p-1.5 rounded-md bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span>UCs com Problemas</span>
                </CardTitle>
                <CardDescription className="text-xs">Injetado zerado</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {ucsComProblemas.map((item, idx) => (
                    <div
                      key={`${item.cliente}-${item.uc}-${idx}`}
                      className="flex items-start justify-between gap-2 p-2.5 rounded-md border border-red-200 dark:border-red-800/50 bg-gradient-to-br from-red-50/50 to-red-100/30 dark:from-red-950/20 dark:to-red-900/10 hover:border-red-300 dark:hover:border-red-700 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => {
                        const cliente = clientesComputed.find(c => c.cliente === item.cliente)
                        const uc = cliente?.ucs.find(u => u.uc === item.uc)
                        if (cliente && uc) {
                          setUcDialog({ cliente: cliente.cliente, uc })
                        }
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold text-red-700 dark:text-red-400 truncate mb-0.5">
                          {item.cliente}
                        </div>
                        <div className="text-xs font-mono font-bold truncate" title={item.uc}>
                          {item.uc}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="destructive" className="text-[10px] px-2 py-0.5 font-semibold">
                          0,00 kWh
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna Principal - Grid de Clientes */}
        <div className="lg:col-span-3">
          {/* Controles de Expansão e Paginação */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              {paginationData.totalClientes > 0 && (
                <div className="text-sm text-muted-foreground">
                  Mostrando <span className="font-semibold text-foreground">{paginationData.startIndex + 1}</span>-
                  <span className="font-semibold text-foreground">{Math.min(paginationData.endIndex, paginationData.totalClientes)}</span> de{' '}
                  <span className="font-semibold text-foreground">{paginationData.totalClientes}</span> clientes
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {paginationData.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={!paginationData.hasPrevPage}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronUp className="h-4 w-4 rotate-[-90deg]" />
                  </Button>
                  <div className="text-xs font-medium min-w-[60px] text-center">
                    Pág {currentPage}/{paginationData.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={!paginationData.hasNextPage}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                className="gap-1.5 h-8 text-xs px-3"
              >
                <ChevronsDown className="h-3.5 w-3.5" />
                Expandir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                className="gap-1.5 h-8 text-xs px-3"
              >
                <ChevronsUp className="h-3.5 w-3.5" />
                Colapsar
              </Button>
            </div>
          </div>

          {paginationData.totalClientes === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                Nenhum cliente encontrado
              </CardContent>
            </Card>
          ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 auto-rows-max">
            {paginationData.clientesPaginados.map((cliente, index) => {
              const taxa = cliente.totalUCs > 0 ? (cliente.ucsComProblema / cliente.totalUCs) * 100 : 0
              const temProblema = cliente.ucsComProblema > 0
              
              // Contar UCs em validação para este cliente
              const ucsValidandoCliente = cliente.ucs.filter(uc => {
                const chaveUc = `${cliente.cpfCnpj?.replace(/[.\-\/]/g, '')}:${uc.uc}`
                return ucsValidacao.get(chaveUc)?.estado === 'Validando'
              }).length

              const ucsValidadoCliente = cliente.ucs.filter(uc => {
                const chaveUc = `${cliente.cpfCnpj?.replace(/[.\-\/]/g, '')}:${uc.uc}`
                return ucsValidacao.get(chaveUc)?.estado === 'Verde'
              }).length
              
              // Definir cor do ícone de status
              const statusIcon = ucsValidandoCliente > 0
                ? 'bg-amber-500'  // Amarelo quando tem UCs em validação
                : temProblema
                  ? 'bg-red-500'   // Vermelho quando tem problema
                  : cliente.ucsSemDados > 0
                    ? 'bg-gray-500' // Cinza quando sem dados
                    : 'bg-emerald-500' // Verde quando OK
              
              const isExpanded = expandedClientes.has(cliente.cliente)
              // Criar chave única usando o nome do cliente que já é único após deduplicação
              const uniqueKey = cliente.cliente

              return (
                <Card key={uniqueKey} className={cn(
                  "overflow-hidden transition-all duration-200 hover:shadow-md",
                  isExpanded && "md:col-span-2 lg:col-span-3 xl:col-span-4 2xl:col-span-5",
                  !isExpanded && "shadow-sm"
                )}>
                  {/* Header do Cliente */}
                  <CardHeader 
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-all",
                      isExpanded ? "border-b bg-muted/30 p-4" : "bg-gradient-to-br from-muted/20 to-muted/5 p-3"
                    )} 
                    onClick={() => toggleCliente(cliente.cliente)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={cn(
                          'rounded-full flex-shrink-0 mt-0.5',
                          'h-3 w-3',
                          statusIcon
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className={cn(
                              "leading-tight font-semibold",
                              isExpanded ? "text-base" : "text-sm truncate"
                            )}>
                              {cliente.cliente}
                            </CardTitle>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                          <CardDescription className="flex flex-wrap gap-x-2.5 gap-y-1 text-xs">
                            <span className="font-semibold text-foreground">{cliente.totalUCs} UCs</span>
                            <span className="text-emerald-600 font-semibold">{cliente.ucsOk} OK</span>
                            {cliente.ucsSemDados > 0 && (
                              <span className="text-gray-500 font-semibold">{cliente.ucsSemDados} s/dados</span>
                            )}
                            {cliente.ucsComProblema > 0 && (
                              <span className="text-red-600 font-semibold">{cliente.ucsComProblema} problemas</span>
                            )}
                          </CardDescription>
                          {isExpanded && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <span className="font-mono font-semibold">{formatNumber(cliente.totalInjetado)} kWh</span> total injetado
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0 items-start">
                        {ucsValidandoCliente > 0 && (
                          <Badge className="bg-amber-500 text-white gap-1 px-2.5 py-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {isExpanded ? <span>{ucsValidandoCliente} validando</span> : <span>{ucsValidandoCliente}</span>}
                          </Badge>
                        )}
                        {ucsValidadoCliente > 0 && ucsValidandoCliente === 0 && (
                          <Badge className="bg-emerald-600 text-white gap-1 px-2.5 py-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {isExpanded ? <span>{ucsValidadoCliente} OK</span> : <span>{ucsValidadoCliente}</span>}
                          </Badge>
                        )}
                        {cliente.ucsComProblema === 0 && cliente.ucsSemDados === 0 && ucsValidandoCliente === 0 && ucsValidadoCliente === 0 ? (
                          <Badge className="bg-emerald-600 text-white gap-1 px-2.5 py-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {isExpanded && <span>OK</span>}
                          </Badge>
                        ) : (
                          <>
                            {cliente.ucsComProblema > 0 && (
                              <Badge variant="destructive" className="gap-1 px-2.5 py-1">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>{cliente.ucsComProblema}</span>
                              </Badge>
                            )}
                            {cliente.ucsSemDados > 0 && (
                              <Badge variant="secondary" className="gap-1 px-2.5 py-1">
                                <Activity className="h-3.5 w-3.5" />
                                <span>{cliente.ucsSemDados}</span>
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {/* Grid de UCs do Cliente - Expansível */}
                  {isExpanded && (
                    <CardContent className="p-4 bg-muted/10">
                      {cliente.ucs.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-8">
                          Nenhuma UC encontrada
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5">
                        {cliente.ucs.map((uc, ucIndex) => {
                          const chaveUc = `${cliente.cpfCnpj?.replace(/[.\-\/]/g, '')}:${uc.uc}` 
                          const validacao = ucsValidacao.get(chaveUc)
                          const estadoUc = validacao?.estado || null // null (vermelho), 'Validando' (amarelo), 'Verde' (verde)

                          return (
                            <div
                              key={`${uc.uc}-${ucIndex}`}
                              onClick={() => {
                                // Se vermelho, marcar como validando com single click
                                if (uc.status === 'injetado_zerado' && !estadoUc) {
                                  void marcarUcComoValidando(cliente.cpfCnpj, uc)
                                } else {
                                  // Senão, abrir diálogo
                                  setUcDialog({ cliente: cliente.cliente, uc })
                                }
                              }}
                              className={cn(
                                'group relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200',
                                'hover:shadow-lg hover:scale-105 active:scale-95',
                                'flex flex-col gap-2',
                                // Estados baseados em validacao + status
                                estadoUc === 'Validando' && 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20',
                                estadoUc === 'Validando' && 'border-amber-400 dark:border-amber-600 hover:border-amber-500',
                                estadoUc === 'Verde' && 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20',
                                estadoUc === 'Verde' && 'border-emerald-400 dark:border-emerald-600 hover:border-emerald-500',
                                // Se não tem validacao, usar status original
                                !estadoUc && uc.status === 'ok' && 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20',
                                !estadoUc && uc.status === 'ok' && 'border-emerald-300 dark:border-emerald-700 hover:border-emerald-500',
                                !estadoUc && uc.status === 'injetado_zerado' && 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20',
                                !estadoUc && uc.status === 'injetado_zerado' && 'border-red-300 dark:border-red-700 hover:border-red-500',
                                !estadoUc && uc.status === 'sem_dados' && 'bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900/30 dark:to-gray-800/20',
                                !estadoUc && uc.status === 'sem_dados' && 'border-gray-300 dark:border-gray-700 hover:border-gray-500'
                              )}
                            >
                              {/* UC Number */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                                    UC
                                  </div>
                                  <div className="font-mono font-bold text-xs truncate leading-tight" title={uc.uc}>
                                    {uc.uc}
                                  </div>
                                </div>
                                {/* Status Indicator */}
                                <div className={cn(
                                  'w-2 h-2 rounded-full flex-shrink-0',
                                  estadoUc === 'Validando' && 'bg-amber-500',
                                  estadoUc === 'Verde' && 'bg-emerald-500',
                                  !estadoUc && uc.status === 'ok' && 'bg-emerald-500',
                                  !estadoUc && uc.status === 'injetado_zerado' && 'bg-red-500',
                                  !estadoUc && uc.status === 'sem_dados' && 'bg-gray-400'
                                )} />
                              </div>

                              {/* Injetado Value */}
                              <div className="text-center py-2">
                                <div
                                  className={cn(
                                    'text-xl font-bold font-mono leading-none mb-1',
                                    uc.status === 'ok' && 'text-emerald-600 dark:text-emerald-400',
                                    uc.status === 'injetado_zerado' && 'text-red-600 dark:text-red-400',
                                    uc.status === 'sem_dados' && 'text-gray-500'
                                  )}
                                >
                                  {formatUcInjetado(uc)}
                                </div>
                                <div className="text-[10px] font-medium text-muted-foreground">
                                  {uc.status === 'sem_dados' ? 'Sem dados' : 'kWh'}
                                </div>
                              </div>

                              {/* Status Badge */}
                              <Badge
                                className={cn(
                                  'rounded-md text-[10px] font-semibold w-full justify-center py-1 border-0',
                                  estadoUc === 'Validando' && 'bg-amber-600 text-white',
                                  estadoUc === 'Verde' && 'bg-emerald-600 text-white',
                                  !estadoUc && uc.status === 'ok' && 'bg-emerald-600 text-white',
                                  !estadoUc && uc.status === 'injetado_zerado' && 'bg-red-600 text-white',
                                  !estadoUc && uc.status === 'sem_dados' && 'bg-gray-500 text-white'
                                )}
                              >
                                {estadoUc === 'Validando' ? '🔍 Validando' : estadoUc === 'Verde' ? '✅ OK' : uc.status === 'ok' ? 'OK' : uc.status === 'injetado_zerado' ? 'Zero' : 'N/D'}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })}
            </div>

            {/* Controles de Paginação Rodapé */}
            {paginationData.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={!paginationData.hasPrevPage}
                  className="gap-1.5 h-9 px-3"
                >
                  <ChevronUp className="h-4 w-4 rotate-[-90deg]" />
                  Anterior
                </Button>
                <div className="flex items-center gap-1.5 px-3">
                  <span className="text-sm text-muted-foreground">Página</span>
                  <span className="text-sm font-bold">{currentPage}</span>
                  <span className="text-sm text-muted-foreground">de</span>
                  <span className="text-sm font-bold">{paginationData.totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={!paginationData.hasNextPage}
                  className="gap-1.5 h-9 px-3"
                >
                  Próximo
                  <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                </Button>
              </div>
            )}
            </>
          )}
        </div>
      </div>

      <Dialog open={ucDialog !== null} onOpenChange={(open) => !open && setUcDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da UC</DialogTitle>
            <DialogDescription>{ucDialog ? ucDialog.cliente : ''}</DialogDescription>
          </DialogHeader>
          {ucDialog ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">UC</span>
                <span className="font-mono font-semibold">{ucDialog.uc.uc}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">
                  {ucDialog.uc.status === 'injetado_zerado'
                    ? 'Injetado zerado'
                    : ucDialog.uc.status === 'sem_dados'
                      ? 'Sem dados'
                      : 'OK'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Injetado</span>
                <span className="font-medium tabular-nums">
                  {formatUcInjetado(ucDialog.uc)}
                  {ucDialog.uc.status === 'sem_dados' ? '' : ' kWh'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Meta mensal</span>
                <span className="font-medium tabular-nums">
                  {ucDialog.uc.meta_mensal ? `${formatNumber(ucDialog.uc.meta_mensal)} kWh` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Mês referente</span>
                <span className="font-medium">{ucDialog.uc.mes_referente ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Plant ID</span>
                <span className="font-medium">{ucDialog.uc.Plant_ID ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Inversor</span>
                <span className="font-medium">{ucDialog.uc.INVERSOR ?? '—'}</span>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

