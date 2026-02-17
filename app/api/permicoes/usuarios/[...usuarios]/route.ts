import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Função para criar cliente Supabase com credenciais de serviço
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Verificar se é admin
async function verifyAdmin(authHeader: string | null) {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false, error: 'Token ausente' }
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseAdmin = getSupabaseAdmin()

    // Verificar usuário usando JWT diretamente
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data.user) {
      console.error('Erro ao verificar usuário:', error)
      return { authorized: false, error: 'Token inválido' }
    }

    // Verificar se é admin
    const { data: roleData, error: roleError } = await (supabaseAdmin as any)
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .single()

    if (roleError) {
      console.error('Erro ao buscar role:', roleError)
      
      // Se a tabela não existir, assume que é admin (compatibilidade retroativa)
      if (roleError.code === '42P01' || roleError.message?.includes('does not exist')) {
        console.warn('Tabela user_roles não existe. Assumindo role admin por padrão.')
        return { authorized: true, userId: data.user.id }
      }
      
      return { authorized: false, error: 'Erro ao verificar permissões' }
    }

    if (roleData?.role !== 'admin') {
      return { authorized: false, error: 'Usuário não é administrador' }
    }

    return { authorized: true, userId: data.user.id }
  } catch (error) {
    console.error('Erro na verificação:', error)
    return { authorized: false, error: 'Erro ao verificar autenticação' }
  }
}

// PUT - Atualizar permissões do usuário
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ usuarios: string[] }> | { usuarios: string[] } }
) {
  try {
    const params = await context.params
    const userId = params?.usuarios?.[0]
    
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 })
    }
    
    const authHeader = request.headers.get('authorization')
    console.log('PUT /api/permicoes/usuarios/[id] - Auth header presente:', !!authHeader)

    const auth = await verifyAdmin(authHeader)
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.error === 'Token ausente' ? 401 : 403 }
      )
    }

    const body = await request.json()
    const { role, permissions } = body

    console.log('Atualizando usuário:', { userId, role })

    // Atualizar user_roles
    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await (supabaseAdmin as any)
      .from('user_roles')
      .update({
        role: role || 'limitada',
        permissions: permissions || {},
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao atualizar user_roles:', error)
      
      // Se a tabela não existir
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Execute o SQL de migração para criar a tabela user_roles' },
          { status: 500 }
        )
      }
      
      throw error
    }

    console.log('Usuário atualizado com sucesso')

    return NextResponse.json({ message: 'Permissões atualizadas com sucesso' })
  } catch (error) {
    console.error('Erro em PUT /api/permicoes/usuarios/[id]:', error)
    const message = error instanceof Error ? error.message : 'Erro ao atualizar permissões'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE - Remover usuário
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ usuarios: string[] }> | { usuarios: string[] } }
) {
  try {
    const params = await context.params
    const userId = params?.usuarios?.[0]
    
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 })
    }
    
    const authHeader = request.headers.get('authorization')
    console.log('DELETE /api/permicoes/usuarios/[id] - Auth header presente:', !!authHeader)

    const auth = await verifyAdmin(authHeader)
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.error === 'Token ausente' ? 401 : 403 }
      )
    }

    console.log('Removendo usuário:', userId)

    // Buscar dados do usuário
    const supabaseAdmin = getSupabaseAdmin()
    const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    // Não permitir deletar usuário gestora
    if (authUserData?.user?.email?.toLowerCase().includes('gestora')) {
      return NextResponse.json(
        { error: 'O usuário gestora não pode ser removido (usuário principal)' },
        { status: 403 }
      )
    }

    // Não permitir deletar a própria conta
    if (auth.userId === userId) {
      return NextResponse.json(
        { error: 'Você não pode remover sua própria conta' },
        { status: 400 }
      )
    }

    // Remover da tabela user_roles
    const { error: roleError } = await (supabaseAdmin as any)
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    if (roleError) {
      console.error('Erro ao deletar de user_roles:', roleError)
      
      // Se a tabela não existir
      if (roleError.code === '42P01' || roleError.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Execute o SQL de migração para criar a tabela user_roles' },
          { status: 500 }
        )
      }
      
      throw roleError
    }

    // Remover do auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) {
      console.error('Erro ao deletar do auth:', authError)
      // Continuar mesmo que haja erro no auth
    }

    console.log('Usuário removido com sucesso')

    return NextResponse.json({ message: 'Usuário removido com sucesso' })
  } catch (error) {
    console.error('Erro em DELETE /api/permicoes/usuarios/[id]:', error)
    const message = error instanceof Error ? error.message : 'Erro ao remover usuário'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
