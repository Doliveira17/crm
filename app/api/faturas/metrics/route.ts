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
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient<Database>(supabaseUrl, supabaseKey)

    // Buscar dados da view
    const { data: faturas, error } = await supabase
      .from('view_faturas_completa')
      .select('*')
      .order('UC_Final', { ascending: true })

    if (error) {
      console.error('Erro ao buscar faturas:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar faturas: ' + error.message },
        { status: 500 }
      )
    }

    if (!faturas || faturas.length === 0) {
      return NextResponse.json({
        clientesAgrupados: [],
        metricas: {
          totalClientes: 0,
          totalUCs: 0,
          ucsInjetadoZero: 0,
          ucsInjetadoOk: 0,
          taxaProblema: 0,
          totalInjetado: 0
        },
        total: 0
      })
    }

    // Agrupar por cliente
    const clientesMap = new Map<string, ClienteAgrupado>()
    
    faturas.forEach((fatura: any) => {
      const cliente = fatura.cliente_cadastro || fatura.cliente_fatura || 'Cliente não identificado'
      const uc = fatura.UC_Final
      const injetado = fatura.injetado !== null ? Number(fatura.injetado) : null
      
      // Determinar status
      let status = 'ok'
      if (injetado === null || injetado === 0) {
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
        injetado,
        status,
        mes_referente: fatura.mes_referente,
        Plant_ID: fatura.Plant_ID,
        INVERSOR: fatura.INVERSOR,
        meta_mensal: fatura.meta_mensal
      })

      if (injetado !== null && injetado > 0) {
        clienteData.totalInjetado += injetado
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

    // Calcular métricas globais
    const totalUCs = faturas.length
    const ucsInjetadoZero = faturas.filter((f: any) => 
      f.injetado === null || f.injetado === 0
    ).length
    const ucsInjetadoOk = totalUCs - ucsInjetadoZero
    const taxaProblema = totalUCs > 0 ? (ucsInjetadoZero / totalUCs) * 100 : 0
    const totalInjetado = faturas.reduce((sum: number, f: any) => {
      const inj = f.injetado !== null ? Number(f.injetado) : 0
      return sum + inj
    }, 0)

    const metricas: Metricas = {
      totalClientes: clientesMap.size,
      totalUCs,
      ucsInjetadoZero,
      ucsInjetadoOk,
      taxaProblema,
      totalInjetado
    }

    const response: ApiResponse = {
      clientesAgrupados,
      metricas,
      total: faturas.length
    }

    return NextResponse.json(response)

  } catch (err) {
    console.error('Erro inesperado:', err)
    return NextResponse.json(
      { error: 'Erro inesperado ao processar requisição' },
      { status: 500 }
    )
  }
}
