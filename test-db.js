// Script de teste para verificar conexão e estrutura do banco
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://lodgnyduaezlcjxfcxrh.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZGdueWR1YWV6bGNqeGZjeHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MzY4NywiZXhwIjoyMDcwOTY5Njg3fQ.lKFf0-GmzUk1Dng6nw2hQQW3bkFmQ1EctFZ_I33nFx8"

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...')

    // Testar conexão listando tabelas
    const { data: tables, error: tablesError } = await supabase.rpc('exec', { 
      sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'" 
    })
    
    console.log('📊 Tabelas no banco:', tables)

    // Testar fila_extracao
    console.log('🔍 Testando fila_extracao...')
    const { data: filas, error: filaError, count: filaCount } = await supabase
      .from('fila_extracao')
      .select('*', { count: 'exact' })
      .limit(1)
    
    console.log('📊 Fila extração:', { count: filaCount, error: filaError?.message, sample: filas?.[0] })

    // Testar growatt
    console.log('🔍 Testando growatt...')
    const { data: growatt, error: growattError, count: growattCount } = await supabase
      .from('growatt')
      .select('*', { count: 'exact' })
      .limit(1)
    
    console.log('📊 Growatt:', { count: growattCount, error: growattError?.message, sample: growatt?.[0] })

    // Testar view
    console.log('🔍 Testando view...')
    const { data: view, error: viewError } = await supabase
      .from('view_faturas_completa')
      .select('*')
      .limit(1)
    
    console.log('📊 View:', { error: viewError?.message, sample: view?.[0] })

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

testConnection()