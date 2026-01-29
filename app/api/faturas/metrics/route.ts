import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'

interface FaturaCompleta {
  UC_Final: string
  id_fatura: number | null
  cliente_fatura: string | null
  cliente_cadastro: string | null
  mes_referente: string | null
  injetado: number | null
  dados_inversor: any | null
  status: string | null
  cpf_cnpj: string | null
  Plant_ID: string | null
  INVERSOR: string | null
  saldo_credito: number | null
  porcentagem: number | null
  historico_gerado: any | null
  data_ativacao: string | null
  meta_mensal: number | null
}

interface ClienteAgrupado {
  cliente: string
  totalUCs: number
  ucs: Array<{
    uc: string
    injetado: number | null
    status: string
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
  taxaProblema: number
  totalInjetado: number
}

interface ApiResponse {
  clientesAgrupados: ClienteAgrupado[]
  metricas: Metricas
  total: number
  totalFromFila?: number
  totalsMatch?: boolean
  totalsDiff?: number
}

export async function GET(request: NextRequest) {
  try {
    // Forçar não usar cache
    const data = await getMetrics()
    const response = NextResponse.json(data)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('❌ Erro na API GET:', error)
    const err = error as Error
    // Retornar detalhes em dev para facilitar debug
    return NextResponse.json(
      { error: 'Erro ao processar requisição: ' + err.message, stack: err.stack },
      { status: 500 }
    )
  }
}

async function getMetrics() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não definidas')
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey)

    console.log('🔍 Iniciando busca na view_faturas_completa...')

    // Buscar as tabelas diretamente (mais confiável)
    console.log('🔁 Buscando `fila_extracao` e `growatt` diretamente')

    const { data: filas, error: errFila } = await supabase.from('fila_extracao').select('*')
    const { data: growatt, error: errGrowatt } = await supabase.from('growatt').select('*')

    if (errFila) {
      console.error('❌ Erro ao buscar `fila_extracao`:', errFila)
      throw new Error(`Erro ao buscar fila_extracao: ${errFila.message}`)
    }
    if (errGrowatt) {
      console.error('❌ Erro ao buscar `growatt`:', errGrowatt)
      throw new Error(`Erro ao buscar growatt: ${errGrowatt.message}`)
    }

    console.log(`📊 Dados obtidos: ${filas?.length || 0} filas, ${growatt?.length || 0} registros growatt`)

    // Mapear os dados para junção
    const mapFila = new Map()
    const mapGrow = new Map()

    if (filas) {
      filas.forEach((f) => {
        const key = (f.UC || '').toString().trim()
        if (key) mapFila.set(key, f)
      })
    }

    if (growatt) {
      growatt.forEach((g) => {
        const key = (g.UNIDADES_CONSUMIDORAS || '').toString().trim()
        if (key) mapGrow.set(key, g)
      })
    }

    // Construir lista apenas a partir de `fila_extracao` (fonte canônica)
    const combined: any[] = []

    for (const [key, f] of mapFila.entries()) {
      // Ignorar se não houver UC
      const ucRaw = f?.UC ?? ''
      const ucFinal = ucRaw.toString().trim()
      if (!ucFinal) continue

      // Ignorar registros onde injetado é null/undefined (não contabilizar)
      if (f.injetado === null || f.injetado === undefined) continue

      // Tratar injetado (pode ser string ou number)
      let injetadoNumero = 0
      if (typeof f.injetado === 'string') {
        const clean = f.injetado.replace(/,/g, '.').replace(/[^\d.-]/g, '')
        const parsed = parseFloat(clean)
        injetadoNumero = isNaN(parsed) ? 0 : parsed
      } else if (typeof f.injetado === 'number') {
        injetadoNumero = f.injetado
      }

      // Obter dados do cadastro (se existir)
      const g = mapGrow.get(key)

      combined.push({
        UC_Final: ucFinal,
        id_fatura: f?.id ?? null,
        dados_extraidos: f?.dados_extraidos ?? null,
        uc_fatura: f?.UC ?? null,
        cnpj: f?.cnpj ?? null,
        dados_inversor: f?.dados_inversor ?? null,
        mes_referente: f?.mes_referente ?? null,
        cliente_fatura: f?.cliente ?? null,
        cliente_cadastro: g?.CLIENTE ?? null,
        uc_cadastro: g?.UNIDADES_CONSUMIDORAS ?? null,
        Plant_ID: g?.Plant_ID ?? null,
        data_ativacao: g?.['data_ativação'] || g?.data_ativacao || null,
        Geracao_Ac_Anual: g?.Geracao_Ac_Anual ?? null,
        Geracao_Ac_Mensal: g?.Geracao_Ac_Mensal ?? null,
        Retorno_Financeiro: g?.Retorno_Financeiro ?? null,
        historico_gerado: g?.['histórico_gerado'] ?? null,
        porcentagem: g?.porcentagem ?? null,
        injetado: injetadoNumero,
        INVERSOR: g?.INVERSOR ?? null,
        meta_mensal: g?.Geracao_Ac_Mensal ?? null
      })
    }

    // Ordenar por UC
    const faturas = combined.sort((a, b) => {
      const A = (a.UC_Final || '').toString()
      const B = (b.UC_Final || '').toString()
      return A.localeCompare(B)
    })

    console.log(`✅ Dados processados: ${faturas.length} registros válidos (apenas a partir de fila_extracao)`)

    // Agrupar por cliente - priorizar cliente_cadastro sobre cliente_fatura
    const clientesMap = new Map<string, ClienteAgrupado>()
    
    faturas.forEach((fatura: any) => {
      // Priorizar cliente_cadastro, depois cliente_fatura, só usar genérico se nenhum existir
      const cliente = fatura.cliente_cadastro || fatura.cliente_fatura
      
      // Pular registros sem cliente identificado
      if (!cliente || cliente.trim() === '') {
        return
      }
      
      const uc = fatura.UC_Final
      // Tratar injetado de forma robusta (pode vir como text ou number)
      let injetadoValue = 0
      if (fatura.injetado !== null && fatura.injetado !== undefined) {
        if (typeof fatura.injetado === 'string') {
          const cleanValue = fatura.injetado.replace(/,/g, '.').replace(/[^\d.-]/g, '')
          const parsed = parseFloat(cleanValue)
          injetadoValue = isNaN(parsed) ? 0 : parsed
        } else if (typeof fatura.injetado === 'number') {
          injetadoValue = fatura.injetado
        }
      }
      
      // Determinar status baseado no valor numérico do injetado
      let status = 'ok'
      if (injetadoValue === 0 || isNaN(injetadoValue)) {
        status = 'injetado_zerado'
      }

      if (!clientesMap.has(cliente)) {
        clientesMap.set(cliente, {
          cliente,
          totalUCs: 0,
          ucs: [],
          totalInjetado: 0,
          ucsComProblema: 0,
          porcentagemProblema: 0
        })
      }

      const clienteData = clientesMap.get(cliente)!
      clienteData.totalUCs++
      clienteData.ucs.push({
        uc,
        injetado: injetadoValue,
        status,
        mes_referente: fatura.mes_referente,
        Plant_ID: fatura.Plant_ID,
        INVERSOR: fatura.INVERSOR,
        meta_mensal: fatura.meta_mensal
      })

      if (injetadoValue > 0) {
        clienteData.totalInjetado += injetadoValue
      }

      if (status === 'injetado_zerado') {
        clienteData.ucsComProblema++
      }
    })

    // Calcular porcentagem de problema para cada cliente
    const clientesAgrupados: ClienteAgrupado[] = Array.from(clientesMap.values()).map(cliente => ({
      ...cliente,
      porcentagemProblema: cliente.totalUCs > 0 
        ? (cliente.ucsComProblema / cliente.totalUCs) * 100 
        : 0
    }))

    // Ordenar por clientes com mais problemas primeiro
    clientesAgrupados.sort((a, b) => b.ucsComProblema - a.ucsComProblema)

    // Calcular métricas globais com tratamento robusto do injetado
    const totalUCs = faturas.length
    const ucsInjetadoZero = faturas.filter((f: any) => {
      let injetadoNum = 0
      if (f.injetado !== null && f.injetado !== undefined) {
        if (typeof f.injetado === 'string') {
          const cleanValue = f.injetado.replace(/,/g, '.').replace(/[^\d.-]/g, '')
          injetadoNum = parseFloat(cleanValue) || 0
        } else if (typeof f.injetado === 'number') {
          injetadoNum = f.injetado
        }
      }
      return injetadoNum === 0 || isNaN(injetadoNum)
    }).length
    const ucsInjetadoOk = totalUCs - ucsInjetadoZero
    const taxaProblema = totalUCs > 0 ? (ucsInjetadoZero / totalUCs) * 100 : 0
    const totalInjetado = faturas.reduce((sum: number, f: any) => {
      let injetadoNum = 0
      if (f.injetado !== null && f.injetado !== undefined) {
        if (typeof f.injetado === 'string') {
          const cleanValue = f.injetado.replace(/,/g, '.').replace(/[^\d.-]/g, '')
          injetadoNum = parseFloat(cleanValue) || 0
        } else if (typeof f.injetado === 'number') {
          injetadoNum = f.injetado
        }
      }
      return sum + injetadoNum
    }, 0)

    const metricas: Metricas = {
      totalClientes: clientesMap.size,
      totalUCs,
      ucsInjetadoZero,
      ucsInjetadoOk,
      taxaProblema,
      totalInjetado
    }

    // Validar soma direta dos injetados na tabela `fila_extracao`
    let totalFromFila = 0
    for (const f of filas || []) {
      if (f.injetado === null || f.injetado === undefined) continue
      let val = 0
      if (typeof f.injetado === 'string') {
        const clean = f.injetado.replace(/,/g, '.').replace(/[^\d.-]/g, '')
        const parsed = parseFloat(clean)
        val = isNaN(parsed) ? 0 : parsed
      } else if (typeof f.injetado === 'number') {
        val = f.injetado
      }
      totalFromFila += val
    }

    const totalsMatch = Math.abs(totalFromFila - totalInjetado) < 0.0001
    const totalsDiff = totalInjetado - totalFromFila

    // Log de verificação dos totais
    console.log(`🔎 totalInjetado (calculado): ${totalInjetado}, totalFromFila (fila_extracao): ${totalFromFila}, match: ${totalsMatch}`)

    const response: ApiResponse = {
      clientesAgrupados,
      metricas,
      total: faturas.length,
      totalFromFila,
      totalsMatch,
      totalsDiff
    }

    console.log(`✅ Processamento concluído: ${clientesMap.size} clientes, ${faturas.length} UCs`)
    return response

  } catch (err) {
    console.error('❌ Erro inesperado na getMetrics:', err)
    throw err
  }
}