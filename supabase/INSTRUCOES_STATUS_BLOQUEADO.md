# 🔧 Correção: Adicionar Status BLOQUEADO ao Banco de Dados

## ❌ Problema
O banco de dados não permite o valor `'BLOQUEADO'` no campo `status` devido a uma constraint que só aceita: ATIVO, INATIVO, PROSPECTO e SUSPENSO.

## ✅ Solução
Execute a migração SQL para atualizar a constraint.

## 📝 Como Executar

### Opção 1: Via Supabase Dashboard (Recomendado)
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **+ New Query**
5. Cole o conteúdo do arquivo: `supabase/update_status_constraint_add_bloqueado.sql`
6. Clique em **Run** (ou pressione Ctrl+Enter)

### Opção 2: Via Supabase CLI
```bash
# Se você tem o Supabase CLI instalado
supabase db execute --file supabase/update_status_constraint_add_bloqueado.sql
```

## 🎯 O que a migração faz
- Remove a constraint antiga `crm_clientes_status_chk`
- Cria nova constraint incluindo o valor `'BLOQUEADO'`
- Atualiza a documentação do campo

## ✅ Verificação
Após executar, você pode verificar se funcionou:
```sql
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'crm_clientes_status_chk';
```

Deve retornar algo como:
```
CHECK ((status IS NULL) OR (status = ''::text) OR (upper(status) = ANY (ARRAY['ATIVO'::text, 'INATIVO'::text, 'PROSPECTO'::text, 'SUSPENSO'::text, 'BLOQUEADO'::text])))
```

## 🚀 Depois da Migração
Após executar a migração, o sistema funcionará corretamente e você poderá:
- Marcar clientes como BLOQUEADO
- Sistema salvará automaticamente
- Todos os campos ficarão protegidos
