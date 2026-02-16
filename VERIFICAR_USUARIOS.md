# Verificar Usuários no Supabase

## 1. Vá para o SQL Editor do Supabase:
https://supabase.com/dashboard/project/lodgnyduaezlcjxfcxrh/sql/new

## 2. Execute este SQL para ver todos os usuários:

```sql
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
```

## 3. Verifique qual email exato está cadastrado

Compare com o email que você está tentando usar no login.

## 4. Se NÃO houver usuário "gestora", crie assim:

- Vá em: Authentication > Users
- Clique em "Add user" > "Create new user"
- Email: gestora@solarenergy.com (ou outro email)
- Password: (defina uma senha)
- Clique em "Create user"

## 5. Após criar, tente fazer login com o email EXATO que você cadastrou

---

**IMPORTANTE**: O email deve ser EXATAMENTE igual ao cadastrado (maiúsculas/minúsculas importam!)
