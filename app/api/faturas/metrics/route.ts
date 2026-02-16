import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'

type AppRole = 'admin' | 'limitada'

type BaseRow = {
  CLIENTE: string | null
  'CPF/CNPJ': string | null
  Unidades: string | null
  Tipo: string | null
  Rateio: string | null
  Data_ativacao: string | null
  historico_gerado: string | null
  saldo_credito: string | null
  ROI: string | null
  projetada: string | null
  dados_extraidos: string | null
  investido: string | null
}

interface ClienteAgrupado {
  cliente: string
  totalUCs: number
  ucs: Array<{
    uc: string
    injetado: number | null
    status: 'ok' | 'injetado_zerado' | 'sem_dados'
    mes_referente: string | null
    Plant_ID: string | null
    INVERSOR: string | null
    meta_mensal: number | null
  }>
  totalInjetado: number
  ucsComProblema: number
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

function normalizeDocument(value: string | null | undefined): string {
  return (value || '').replace(/\D/g, '')
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value !== 'string') {
    return 0
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return 0
  }

  const cleaned = trimmed.replace(/[^\d,.-]/g, '')
  if (!cleaned) {
    return 0
  }

  const hasComma = cleaned.includes(',')
  const hasDot = cleaned.includes('.')

  let normalized = cleaned
  if (hasComma && hasDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    normalized = cleaned.replace(',', '.')
  }

  const parsed = parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseMaybeJson(text: unknown): Record<string, unknown> | null {
  if (!text) {
    return null
  }

  if (typeof text === 'object' && !Array.isArray(text)) {
    return text as Record<string, unknown>
  }

  if (typeof text !== 'string') {
    return null
  }

  const raw = text.trim()
  if (!raw) {
    return null
  }

  const withoutFence = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    const parsed = JSON.parse(withoutFence)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

function getInjetadoInfoFromDadosExtraidos(payload: unknown): {
  injetado: number | null
  status: 'ok' | 'injetado_zerado' | 'sem_dados'
} {
  const json = parseMaybeJson(payload)
  if (!json) {
    return { injetado: null, status: 'sem_dados' }
  }

  // Prioridade: injetado_fora_ponta > injetado_ponta > injetado
  let injetadoFoaPonta =
    json['injetado_fora_ponta'] ??
    json['injetado fora ponta'] ??
    null

  let injetadoPonta =
    json['injetado_ponta'] ??
    json['injetado ponta'] ??
    null

  // Parse dos valores
  const forapontaNum = injetadoFoaPonta !== null ? parseNumber(injetadoFoaPonta) : 0
  const pontaNum = injetadoPonta !== null ? parseNumber(injetadoPonta) : 0

  // Se fora ponta > 0, usa esse valor
  if (forapontaNum > 0) {
    return { injetado: forapontaNum, status: 'ok' }
  }

  // Se fora ponta é 0, procura em ponta
  if (pontaNum > 0) {
    return { injetado: pontaNum, status: 'ok' }
  }

  // Se ambos são 0 (problema)
  if (forapontaNum === 0 && pontaNum === 0) {
    return { injetado: 0, status: 'injetado_zerado' }
  }

  // Se não encontrou nenhum valor
  return { injetado: null, status: 'sem_dados' }
}

function getMesReferencia(payload: unknown): string | null {
  const json = parseMaybeJson(payload)
  if (!json) {
    return null
  }

  const value = json['mês'] ?? json['mes'] ?? json['mes_referente']
  if (typeof value !== 'string') {
    return null
  }

  const month = value.trim()
  return month || null
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não definidas'
      )
    }

    const authorization = request.headers.get('authorization') || ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    const { data: authData, error: authError } = await supabase.auth.getUser(token)
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    }

    const { data: roleRow, error: roleError } = await (supabase as any)
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (roleError) {
      return NextResponse.json(
        { error: 'Configuração de permissões ausente. Execute o script de RBAC no Supabase.' },
        { status: 500 }
      )
    }

    const userRole = ((roleRow as { role?: AppRole } | null)?.role ?? 'admin') as AppRole
    if (userRole !== 'admin' && userRole !== 'limitada') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const data = await getMetrics(supabase)
    const response = NextResponse.json(data)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('❌ Erro na API GET:', error)
    const err = error as Error
    return NextResponse.json(
      { error: 'Erro ao processar requisição: ' + err.message, stack: err.stack },
      { status: 500 }
    )
  }
}

async function getMetrics(supabase: ReturnType<typeof createClient<Database>>) {
  const { data: baseRows, error } = await (supabase as any)
    .from('base')
    .select('*') as any

  if (error) {
    throw new Error(`Erro ao buscar base: ${error.message}`)
  }

  const geradoras = (baseRows || []).filter(
    (row: any) => (row.Tipo || '').trim().toLowerCase() === 'geradora'
  )

  const clientsMap = new Map<string, ClienteAgrupado>()

  geradoras.forEach((row: any) => {
    const documentNormalized = normalizeDocument(row['CPF/CNPJ'])
    const clientName = (row.CLIENTE || '').trim()
    const unidade = (row.Unidades || '').trim()

    if (!unidade) {
      return
    }

    const clientKey = documentNormalized || `nome:${clientName || unidade}`
    const clientLabel = clientName || row['CPF/CNPJ'] || 'Cliente sem identificação'

    if (!clientsMap.has(clientKey)) {
      clientsMap.set(clientKey, {
        cliente: clientLabel,
        totalUCs: 0,
        ucs: [],
        totalInjetado: 0,
        ucsComProblema: 0,
        porcentagemProblema: 0,
      })
    }

    const { injetado, status } = getInjetadoInfoFromDadosExtraidos(row.dados_extraidos)
    const cliente = clientsMap.get(clientKey)!

    cliente.totalUCs += 1
    if (injetado && injetado > 0) {
      cliente.totalInjetado += injetado
    }
    if (status === 'injetado_zerado') {
      cliente.ucsComProblema += 1
    }

    cliente.ucs.push({
      uc: unidade,
      injetado,
      status,
      mes_referente: getMesReferencia(row.dados_extraidos),
      Plant_ID: null,
      INVERSOR: null,
      meta_mensal: parseNumber(row.projetada),
    })
  })

  const clientesAgrupados = Array.from(clientsMap.values())
    .map((cliente) => ({
      ...cliente,
      porcentagemProblema:
        cliente.totalUCs > 0 ? (cliente.ucsComProblema / cliente.totalUCs) * 100 : 0,
    }))
    .sort((a, b) => {
      if (b.ucsComProblema !== a.ucsComProblema) {
        return b.ucsComProblema - a.ucsComProblema
      }
      return a.cliente.localeCompare(b.cliente)
    })

  const allUCs = clientesAgrupados.flatMap((cliente) => cliente.ucs)
  const totalUCs = allUCs.length
  const ucsInjetadoZero = allUCs.filter((uc) => uc.status === 'injetado_zerado').length
  const ucsInjetadoOk = allUCs.filter((uc) => uc.status === 'ok').length
  const ucsSemDados = allUCs.filter((uc) => uc.status === 'sem_dados').length
  const totalInjetado = clientesAgrupados.reduce(
    (acc, cliente) => acc + cliente.totalInjetado,
    0
  )
  const taxaProblema = totalUCs > 0 ? (ucsInjetadoZero / totalUCs) * 100 : 0

  const metricas: Metricas = {
    totalClientes: clientsMap.size,
    totalUCs,
    ucsInjetadoZero,
    ucsInjetadoOk,
    ucsSemDados,
    taxaProblema,
    totalInjetado,
  }

  const response: ApiResponse = {
    clientesAgrupados,
    metricas,
    total: totalUCs,
  }

  return response
}
