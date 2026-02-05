import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'

type RelatorioEnvio = Database['public']['Tables']['relatorio_envios']['Row']

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

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient<Database>(supabaseUrl, supabaseKey)

    // Parâmetros de query
    const searchParams = request.nextUrl.searchParams
    const filtroViewed = searchParams.get('viewed') || 'todos' // 'todos' | 'visto' | 'naoVisto'
    const filtroStatus = searchParams.get('status') || 'todos' // 'todos' | 'enviado' | 'naoEnviado'
    const busca = searchParams.get('busca') || null

    // Query base - buscar dados completos
    let query = supabase
      .from('relatorio_envios')
      .select(`
        id,
        nome_falado_dono,
        status_envio,
        viewed,
        enviado_em,
        created_at,
        cliente_id,
        contato_id
      `)
      .order('created_at', { ascending: false })

    // Total de registros (sem filtros)
    const { count: totalCount } = await supabase
      .from('relatorio_envios')
      .select('*', { count: 'exact', head: true })

    // Aplicar filtros
    if (filtroViewed === 'visto') {
      query = query.eq('viewed', true)
    } else if (filtroViewed === 'naoVisto') {
      query = query.or('viewed.is.null,viewed.eq.false')
    }

    if (filtroStatus === 'enviado') {
      query = query.eq('status_envio', '✅ Enviado')
    } else if (filtroStatus === 'naoEnviado') {
      query = query.or('status_envio.is.null,status_envio.neq.✅ Enviado')
    }

    if (busca) {
      query = query.ilike('nome_falado_dono', `%${busca}%`)
    }

    const { data: relatorios, error } = await query

    if (error) {
      console.error('Erro ao buscar relatórios:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar relatórios' },
        { status: 500 }
      )
    }

    // Buscar dados dos clientes e contatos relacionados
    const relatoriosComDados = await Promise.all(
      (relatorios || []).map(async (rel: any) => {
        let clienteNome = null
        let contatoCelular = null
        let contatoCargo = null

        if (rel.cliente_id) {
          const { data: cliente } = await supabase
            .from('crm_clientes')
            .select('razao_social')
            .eq('id', rel.cliente_id)
            .single()
          clienteNome = (cliente as any)?.razao_social || null
        }

        if (rel.contato_id) {
          const { data: contato } = await supabase
            .from('crm_contatos')
            .select('celular, cargo')
            .eq('id', rel.contato_id)
            .single()
          contatoCelular = (contato as any)?.celular || null
          contatoCargo = (contato as any)?.cargo || null
        }

        return {
          ...rel,
          cliente_nome: clienteNome,
          contato_celular: contatoCelular,
          contato_cargo: contatoCargo,
        }
      })
    )

    // Transformar dados para formato do frontend
    // LÓGICA CORRIGIDA:
    // ENVIADO: status_envio === '✅ Enviado'
    // INTERAGIDO: viewed === true E foi enviado primeiro
    const contatos: Contato[] = relatoriosComDados.map((rel: any) => {
      const foiEnviado = rel.status_envio === '✅ Enviado'
      const temMarcaInteracao = rel.viewed === true
      // Só conta como interagido se FOI ENVIADO PRIMEIRO
      const foiInteragido = foiEnviado && temMarcaInteracao
      
      return {
        id: rel.id,
        nome: rel.nome_falado_dono || 'Sem nome',
        telefone: rel.contato_celular || '-',
        empresa: rel.cliente_nome,
        cargo: rel.contato_cargo,
        viewed: rel.viewed ? 'sim' : null,
        status_envio: rel.status_envio,
        interagido: foiInteragido,
        enviado: foiEnviado,
      }
    })

    // Calcular métricas baseadas nos dados filtrados
    const enviados = contatos.filter((c) => c.enviado).length
    const naoEnviados = contatos.filter((c) => !c.enviado).length
    const vistos = contatos.filter((c) => c.interagido).length
    const naoVistos = contatos.filter((c) => !c.interagido).length

    const totalFiltrado = contatos.length
    const taxaEnvio = totalFiltrado > 0 ? (enviados / totalFiltrado) * 100 : 0
    const taxaInteracao = enviados > 0 ? (vistos / enviados) * 100 : 0

    const metricas: Metricas = {
      enviados,
      naoEnviados,
      vistos,
      naoVistos,
      taxaEnvio: Math.round(taxaEnvio * 100) / 100,
      taxaInteracao: Math.round(taxaInteracao * 100) / 100,
    }

    const filtrosAplicados: FiltrosAplicados = {
      viewed: filtroViewed,
      status: filtroStatus,
      busca,
    }

    const response: ApiResponse = {
      contatos: contatos, // Retornar TODOS os contatos (sem limitação)
      total: totalCount || 0,
      totalFiltrado,
      metricas,
      filtrosAplicados,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro no endpoint /api/tv/metrics:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
