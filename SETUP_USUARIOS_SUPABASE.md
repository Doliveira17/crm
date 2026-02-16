# 🔐 Como Criar Usuários no Supabase

## Erro: "Invalid login credentials"

Se você está recebendo este erro ao tentar fazer login, é porque **nenhum usuário foi criado** no Supabase.

## ✅ Passo a Passo para Criar um Usuário

### 1. Acesse o Painel do Supabase

- Abra [https://app.supabase.com](https://app.supabase.com)
- Faça login com sua conta
- Selecione seu projeto

### 2. Navegue até Authentication

1. No menu lateral esquerdo, clique em **Authentication**
2. Na submenu, clique em **Users**

Você verá uma lista vazia de usuários (a menos que já tenha criado alguns).

### 3. Crie um Novo Usuário

1. Clique no botão **"Add User"** (verde, no canto superior direito)
2. Preencha os campos:
   - **Email**: `admin@solarenergy.com` (ou qualquer email que queira)
   - **Password**: `SenhaForte123!` (mínimo 6 caracteres)
   - **Confirm password**: repita a senha

### 4. Clique em "Save"

O usuário foi criado com sucesso!

### 5. Teste o Login

1. Volte para o seu CRM: [http://localhost:3000](http://localhost:3000)
2. Faça login com:
   - **E-mail**: `admin@solarenergy.com`
   - **Senha**: `SenhaForte123!`

## 🔄 Criar Múltiplos Usuários

Repita os passos acima para cada usuário que desejar criar.

### Exemplo de Usuários Recomendados:
```
admin@solarenergy.com (Administrador)
vendedor@solarenergy.com (Vendedor)
suporte@solarenergy.com (Suporte)
```

## 📝 Notas Importantes

- A senha deve ter **no mínimo 6 caracteres**
- O e-mail não precisa ser confirmado para fazer login (está configurado assim por padrão)
- Você pode editar ou deletar usuários a qualquer momento no painel do Supabase
- As senhas são criptografadas e apenas você (administrador) pode defini-las ou ressetá-las

## 🆘 Dúvidas?

Se o erro persiste após criar o usuário:

1. **Verifique se o Supabase está online**: Abra o Dashboard do Supabase e veja se há alguma mensagem de erro
2. **Confirme as variáveis de ambiente**: Abra `.env.local` e verifique se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão corretos
3. **Reinicie o servidor**: Pare o `npm run dev` e execute novamente
4. **Verifique as policies RLS**: Execute o script `supabase/rls_policies.sql` no editor SQL do Supabase

## 📊 Verificar Usuários Criados

Para ver todos os usuários criados:

1. Vá em **Authentication** → **Users**
2. Você verá uma tabela com todos os usuários, datas de criação e último login
