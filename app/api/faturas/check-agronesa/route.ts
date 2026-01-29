import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient<Database>(supabaseUrl, supabaseKey)

    // Buscar AGRONESA apenas na tabela `fila_extracao` (fonte canônica)
    const { data: filaData, error: filaError } = await supabase
      .from('fila_extracao')
      .select('*')
      .ilike('cliente', '%AGRONESA%')

    if (filaError) {
      console.error('Erro ao buscar na fila_extracao:', filaError)
      return NextResponse.json({ error: filaError.message }, { status: 500 })
    }

    // Normalizar e parsear campos relevantes (ex: injetado pode ser text)
    const mapped = (filaData || []).map((r: any) => {
      const uc = (r.UC || '').toString().trim() || null
      const cliente = r.cliente || null
      const mes_referente = r.mes_referente || null

      let injetadoNum = 0
      if (r.injetado !== null && r.injetado !== undefined) {
        if (typeof r.injetado === 'string') {
          const clean = r.injetado.replace(/,/g, '.').replace(/[^\d.-]/g, '')
          const parsed = parseFloat(clean)
          injetadoNum = isNaN(parsed) ? 0 : parsed
        } else if (typeof r.injetado === 'number') {
          injetadoNum = r.injetado
        }
      }

      return {
        id: r.id,
        created_at: r.created_at,
        caminho_arquivo: r.caminho_arquivo,
        status: r.status,
        UC: uc,
        cliente,
        cnpj: r.cnpj || null,
        dados_inversor: r.dados_inversor || null,
        injetado_original: r.injetado ?? null,
        injetado: injetadoNum,
        mes_referente
      }
    })

    return NextResponse.json({
      count: mapped.length,
      data: mapped
    })

  } catch (err) {
    console.error('Erro na busca AGRONESA:', err)
    return NextResponse.json(
      { error: 'Erro inesperado: ' + (err as Error).message },
      { status: 500 }
    )
  }
}