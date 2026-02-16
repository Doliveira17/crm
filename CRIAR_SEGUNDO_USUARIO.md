## ⚠️ Usuário Faltante: monitoramento@hewertonmartins.com.br

Você vê apenas **1 usuário** porque o segundo ainda não foi criado em `auth.users`.

### ✅ O que foi feito:
- ✓ `gestora@hewertonmartins.com.br` → Role **admin** atribuída

### ❌ O que falta:
- ✗ `monitoramento@hewertonmartins.com.br` → Usuário não existe

---

## 📝 Como Criar o Segundo Usuário

### Passo 1: Abra o Painel Supabase
1. Vá para https://app.supabase.com
2. Selecione seu projeto
3. Clique em **Authentication** (menu lateral)
4. Clique em **Users**

### Passo 2: Adicione o Novo Usuário
1. Clique no botão **"Add User"** (verde, canto superior direito)
2. Preencha:
   - **Email**: `monitoramento@hewertonmartins.com.br`
   - **Password**: `SenhaForte123!` (mínimo 6 caracteres)
   - **Confirm password**: Repita a senha

### Passo 3: Salve e Atribua a Role
1. Clique em **Save**
2. Volte ao **SQL Editor** do Supabase
3. Execute novamente o script `assign_user_roles.sql`

### 🎯 Resultado Esperado:
Depois de executar o script novamente, você verá **2 usuários** com suas respectivas roles:

```
email                                    | role    | created_at                    | updated_at
gestora@hewertonmartins.com.br          | admin   | 2026-02-16 13:37:13.609426-03 | 2026-02-16 13:37:13.609426-03
monitoramento@hewertonmartins.com.br    | faturas | 2026-02-16 13:37:XX.XXXXXX-03 | 2026-02-16 13:37:XX.XXXXXX-03
```

---

## 🔍 Verificar Usuários Existentes

Se quiser verificar rapidamente quais usuários já existem, execute no SQL Editor:

```sql
SELECT email, created_at FROM auth.users ORDER BY created_at DESC;
```

Isso mostrará todos os usuários cadastrados no seu projeto.
