# 🔐 Sistema de Permissões e Controle de Usuários

## Configuração Inicial

Antes de usar o sistema de permissões, execute o script SQL para criar as tabelas necessárias:

```bash
# No Supabase SQL Editor, execute:
supabase/create_user_login_history.sql
```

Este script cria:
- Tabela `user_login_history` - para rastrear acessos dos usuários
- Colnas adicionais em `user_roles`:
  - `login_count` - contagem total de logins
  - `last_login_at` - último login realizado
  - `permissions` - permissões específicas (JSON)

## Recursos

### 👤 Gerenciamento de Usuários

Usuários com papel **administrador (admin)** podem:

1. **Criar novos usuários**
   - Email do usuário
   - Senha do usuário
   - Nível de acesso (Admin ou Faturas)
   - Permissões específicas

2. **Editar usuários existentes**
   - Alterar nível de acesso
   - Ajustar permissões individuais
   - Ver histórico de acessos

3. **Remover usuários**
   - Deletar contas completas
   - Remover do banco de dados

### 📊 Monitoramento de Acessos

Cada login é registrado com:
- Identificação do usuário
- E-mail usado no login
- Timestamp do acesso
- User Agent (navegador/dispositivo)

Exibição de:
- Total de logins por usuário
- Data/hora do último login
- Histórico completo de acessos

### 🔑 Controle de Permissões

Permissões disponíveis:
- Dashboard
- Clientes
- Dados Técnicos
- Interações
- Tags
- Faturas
- Relatórios
- Permissões (admin only)

### 🛡️ Segurança

- Apenas administradores podem acessar a seção "Permissões"
- Senhas são hasheadas no Supabase
- RLS (Row Level Security) implementado
- Proteção contra auto-exclusão de admin
- Usuários normais não conseguem alterar suas próprias permissões

## Acesso à Seção

1. Faça login como um usuário **admin**
2. Verá a opção "Permissões" no menu lateral
3. Gerencie usuários e suas permissões

## Estrutura de Dados

### user_login_history

```sql
- id (UUID) - Identificador único
- user_id (UUID) - Referência ao usuário auth
- user_email (TEXT) - Email do usuário
- login_at (TIMESTAMPTZ) - Data/hora do login
- ip_address (TEXT) - IP do acesso (opcional)
- user_agent (TEXT) - Navegador/Cliente (opcional)
```

### user_roles (atualizado)

```sql
- user_id (UUID) - Identificador do usuário
- role (ENUM) - 'admin' ou 'faturas'
- login_count (INTEGER) - Total de logins
- last_login_at (TIMESTAMPTZ) - Último login
- permissions (JSONB) - Permissões específicas
- created_at (TIMESTAMPTZ) - Criação da conta
- updated_at (TIMESTAMPTZ) - Última atualização
```

## APIs

### GET /api/permicoes/usuarios

Listar todos os usuários (requer autenticação admin)

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "usuario@example.com",
    "role": "admin",
    "login_count": 42,
    "last_login_at": "2026-02-16T10:30:00Z",
    "created_at": "2026-01-15T00:00:00Z",
    "permissions": { "dashboard": true, "clientes": true }
  }
]
```

### POST /api/permicoes/usuarios

Criar novo usuário (requer autenticação admin)

**Request:**
```json
{
  "email": "novo@example.com",
  "password": "senha123",
  "role": "faturas",
  "permissions": { "faturas": true, "relatorios": false }
}
```

### PUT /api/permicoes/usuarios/:id

Atualizar permissões de usuário (requer autenticação admin)

**Request:**
```json
{
  "role": "admin",
  "permissions": { "dashboard": true, "permicoes": true }
}
```

### DELETE /api/permicoes/usuarios/:id

Remover usuário (requer autenticação admin)

## Notas Importantes

- 🚨 Admins não conseguem remover a si mesmos
- 📧 Emails devem ser únicos no Supabase
- 🔄 O login_count é atualizado automaticamente a cada acesso
- ⏰ Os timestamps são em UTC (Z)
- 🌐 Permissões futuras podem incluir controle em nível de menu

## Troubleshooting

### Não vejo a opção "Permissões"
- Verifique se seu papel é 'admin' na tabela `user_roles`
- Atualize a página (F5)

### Erro ao criar usuário
- Verifique se o email já existe
- Certifique-se de que tem permissão admin
- Verifique as chaves de ambiente

### Histórico de logins vazio
- Execute o SQL de migração
- Refaça o login para gerar novo registro
