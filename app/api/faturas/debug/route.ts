import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'

type ViewFaturasDebugRow = {
  UC_Final: string | null
  cliente_cadastro: string | null
  cliente_fatura: string | null
  injetado: number | string | null
  status: string | null
  mes_referente: string | null
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient<Database>(supabaseUrl, supabaseKey)

    // Verificar se a view existe
    const { data: viewExists, error: viewError } = await supabase
      .from('view_faturas_completa')
      .select('count', { count: 'exact', head: true })

    if (viewError) {
      return NextResponse.json({
        error: `Erro ao verificar view: ${viewError.message}`,
        suggestion: 'Execute o script supabase/verify_and_create_view.sql no console SQL do Supabase'
      }, { status: 500 })
    }

    // Buscar amostra de dados
    const { data: amostra, error: amostraError } = await supabase
      .from('view_faturas_completa')
      .select('*')
      .limit(10)
      .returns<ViewFaturasDebugRow[]>()

    if (amostraError) {
      return NextResponse.json({
        error: `Erro ao buscar dados da view: ${amostraError.message}`
      }, { status: 500 })
    }

    // Buscar estatísticas
    const { data: stats, error: statsError } = await supabase
      .from('view_faturas_completa')
      .select('UC_Final, cliente_cadastro, cliente_fatura, injetado')
      .returns<ViewFaturasDebugRow[]>()

    if (statsError) {
      return NextResponse.json({
        error: `Erro ao buscar estatísticas: ${statsError.message}`
      }, { status: 500 })
    }

    const clientesComCadastro = stats?.filter(s => s.cliente_cadastro).length || 0
    const clientesComFatura = stats?.filter(s => s.cliente_fatura).length || 0
    const clientesSemNome = stats?.filter(s => !s.cliente_cadastro && !s.cliente_fatura).length || 0
    
    const clientesUnicosCadastro = new Set(
      stats?.filter(s => s.cliente_cadastro).map(s => s.cliente_cadastro) || []
    ).size

    const clientesUnicosFatura = new Set(
      stats?.filter(s => s.cliente_fatura).map(s => s.cliente_fatura) || []
    ).size

    return NextResponse.json({
      viewExists: true,
      totalRegistros: stats?.length || 0,
      estatisticas: {
        registrosComClienteCadastro: clientesComCadastro,
        registrosComClienteFatura: clientesComFatura,
        registrosSemCliente: clientesSemNome,
        clientesUnicosCadastro,
        clientesUnicosFatura
      },
      amostraDados: amostra?.map(item => ({
        UC_Final: item.UC_Final,
        cliente_cadastro: item.cliente_cadastro,
        cliente_fatura: item.cliente_fatura,
        injetado: item.injetado,
        status: item.status,
        mes_referente: item.mes_referente
      })) || []
    })

  } catch (err) {
    console.error('Erro no debug:', err)
    return NextResponse.json(
      { error: 'Erro inesperado no debug' },
      { status: 500 }
    )
  }
}
