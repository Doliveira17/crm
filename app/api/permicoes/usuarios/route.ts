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

// Verificar se o usuário é admin
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

// GET - Listar todos os usuários
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    console.log('GET /api/permicoes/usuarios - Auth header presente:', !!authHeader)

    const auth = await verifyAdmin(authHeader)
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.error === 'Token ausente' ? 401 : 403 }
      )
    }

    // Buscar todos os usuários
    const supabaseAdmin = getSupabaseAdmin()
    const { data: users, error } = await (supabaseAdmin as any)
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar user_roles:', error)
      
      // Se a tabela não existir, retorna array vazio
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Tabela user_roles não existe. Retornando lista vazia.')
        return NextResponse.json([])
      }
      
      throw error
    }

    // Buscar emails dos usuários
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers()
    if (authUsersError) {
      console.error('Erro ao listar usuários de auth:', authUsersError)
      throw authUsersError
    }

    // Combinar dados
    const combinedUsers = users.map((userRole: any) => {
      const authUser = authUsers.users.find(u => u.id === userRole.user_id)
      return {
        id: userRole.user_id,
        email: authUser?.email || 'Desconhecido',
        role: userRole.role,
        login_count: userRole.login_count || 0,
        last_login_at: userRole.last_login_at,
        created_at: userRole.created_at,
        permissions: userRole.permissions || {},
      }
    })

    return NextResponse.json(combinedUsers)
  } catch (error) {
    console.error('Erro em GET /api/permicoes/usuarios:', error)
    const message = error instanceof Error ? error.message : 'Erro ao carregar usuários'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    console.log('POST /api/permicoes/usuarios - Auth header presente:', !!authHeader)

    const auth = await verifyAdmin(authHeader)
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.error === 'Token ausente' ? 401 : 403 }
      )
    }

    const body = await request.json()
    const { email, password, role, permissions } = body

    console.log('Criando usuário:', { email, role })

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar usuário no Supabase Auth
    const supabaseAdmin = getSupabaseAdmin()
    const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      console.error('Erro ao criar usuário em auth:', createError)
      
      // Mensagens mais específicas
      if (createError.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado no sistema' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: createError.message || 'Erro ao criar usuário' },
        { status: 400 }
      )
    }

    if (!newAuthUser.user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 400 }
      )
    }

    console.log('Usuário criado no auth:', newAuthUser.user.id)

    // Criar entrada na tabela user_roles
    const { error: roleError } = await (supabaseAdmin as any)
      .from('user_roles')
      .insert({
        user_id: newAuthUser.user.id,
        role: role || 'limitada',
        permissions: permissions || {},
      })

    if (roleError) {
      console.error('Erro ao criar user_role:', roleError)
      
      // Se a tabela não existir
      if (roleError.code === '42P01' || roleError.message?.includes('does not exist')) {
        // Tentar remover o usuário do auth
        await supabaseAdmin.auth.admin.deleteUser(newAuthUser.user.id).catch(e => 
          console.error('Erro ao limpar usuário:', e)
        )
        return NextResponse.json(
          { error: 'Execute o SQL de migração para criar a tabela user_roles antes de criar usuários' },
          { status: 500 }
        )
      }
      
      // Se o usuário já existir na user_roles (possível se o SQL já inseriu)
      if (roleError.code === '23505') { // Unique constraint violation
        console.log('Usuário já existe na user_roles, atualizando ao invés de inserir')
        
        // Atualizar ao invés de inserir
        const { error: updateError } = await (supabaseAdmin as any)
          .from('user_roles')
          .update({
            role: role || 'limitada',
            permissions: permissions || {},
          })
          .eq('user_id', newAuthUser.user.id)
        
        if (updateError) {
          console.error('Erro ao atualizar user_role:', updateError)
          return NextResponse.json(
            { error: 'Usuário criado no auth, mas erro ao configurar permissões' },
            { status: 500 }
          )
        }
        
        // Sucesso!
        console.log('Usuário criado com sucesso (permissões atualizadas)')
        return NextResponse.json(
          {
            message: 'Usuário criado com sucesso',
            user_id: newAuthUser.user.id,
            email: newAuthUser.user.email,
          },
          { status: 201 }
        )
      }
      
      // Tentar remover o usuário do auth se falhar por outro motivo
      await supabaseAdmin.auth.admin.deleteUser(newAuthUser.user.id).catch(e => 
        console.error('Erro ao limpar usuário:', e)
      )
      
      return NextResponse.json(
        { error: `Erro no banco de dados: ${roleError.message}` },
        { status: 500 }
      )
    }

    console.log('Usuário criado com sucesso')

    return NextResponse.json(
      {
        message: 'Usuário criado com sucesso',
        user_id: newAuthUser.user.id,
        email: newAuthUser.user.email,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro em POST /api/permicoes/usuarios:', error)
    const message = error instanceof Error ? error.message : 'Erro ao criar usuário'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
