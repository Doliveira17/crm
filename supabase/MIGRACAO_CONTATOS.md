# ⚠️ MIGRAÇÃO DE CAMPOS - EXECUTE NO SUPABASE PRIMEIRO!

## 🚨 IMPORTANTE
**Os scripts SQL precisam ser executados no Supabase ANTES de usar os novos campos no sistema!**

## Scripts Criados

### 1. add_contatos_fields.sql ✅
Adiciona os primeiros 3 campos à tabela crm_contatos:
- `data_aniversario` (date)
- `pessoa_site` (text)
- `pessoa_redes` (jsonb)

### 2. add_contatos_autorizacao_canal.sql ✅  
Adiciona os campos de autorização e canais de comunicação:
- `autorizacao_mensagem` (boolean, default false)
- `canal_relatorio` (text[], valores permitidos: 'email', 'whatsapp')

## 🎯 Como Executar no Supabase

1. **Acesse o Supabase SQL Editor:**
   - Vá para https://supabase.com/dashboard
   - Selecione seu projeto
   - Clique em "SQL Editor" no menu lateral

2. **Execute os scripts na ordem:**
   
   **Primeiro:** Execute `supabase/add_contatos_fields.sql`
   ```sql
   -- Cole o conteúdo do arquivo e clique em RUN (ou F5)
   ```
   
   **Depois:** Execute `supabase/add_contatos_autorizacao_canal.sql`
   ```sql
   -- Cole o conteúdo do arquivo e clique em RUN (ou F5)
   ```

3. **Verifique se funcionou:**
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'crm_contatos'
   ORDER BY ordinal_position;
   ```
   
   **Deve mostrar TODOS estes campos:**
   - ✅ data_aniversario
   - ✅ pessoa_site  
   - ✅ pessoa_redes
   - ✅ autorizacao_mensagem
   - ✅ canal_relatorio

## 🐛 Erros Comuns

**"Erro ao criar contato" no aplicativo:**
- ❌ Você ainda não executou os scripts SQL no Supabase
- ✅ Execute ambos os scripts na ordem acima

**"column already exists":**
- ✅ O campo já foi criado, pode ignorar

**"permission denied":**
- ❌ Faça login como owner/admin do projeto no Supabase

## Estrutura Final da Tabela crm_contatos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Identificador único |
| nome_completo | text | Nome completo (obrigatório) |
| apelido_relacionamento | text | Apelido ou como prefere ser chamado |
| cargo | text | Cargo/função |
| celular | text | Número de celular |
| email | text | E-mail |
| **data_aniversario** | **date** | **Data de aniversário** |
| **pessoa_site** | **text** | **Website pessoal** |
| **pessoa_redes** | **jsonb** | **Redes sociais (formato JSON)** |
| **autorizacao_mensagem** | **boolean** | **Autorização para receber relatórios** |
| **canal_relatorio** | **text[]** | **Canais: email e/ou whatsapp** |
| observacoes | text | Observações adicionais |
| created_at | timestamptz | Data de criação |
| updated_at | timestamptz | Data de atualização |

## Regras de Negócio

- ✅ Se `autorizacao_mensagem` = `false`, o campo `canal_relatorio` deve ser `null` ou vazio
- ✅ Se `autorizacao_mensagem` = `true`, o usuário pode escolher:
  - Receber por E-mail
  - Receber por WhatsApp
  - Ou ambos

## Arquivos Atualizados

- ✅ `supabase/add_contatos_autorizacao_canal.sql` - Novo script de migração
- ✅ `supabase/setup_tables.sql` - Atualizado com todos os campos
- ✅ `lib/validators/contato.ts` - Schema de validação atualizado
- ✅ `lib/hooks/useContatos.ts` - Hooks CRUD atualizados
- ✅ `components/contatos/ContatoForm.tsx` - Formulário com novos campos

## Interface do Formulário

O formulário agora possui:

1. **Card "Informações do Contato":**
   - Nome Completo, Apelido
   - Cargo/Função, Celular
   - E-mail
   - Data de Aniversário
   - Website Pessoal
   - Redes Sociais

2. **Card "Preferências de Comunicação":**
   - ☑ Autorizar recebimento de relatórios
     - Se marcado, mostra:
       - ☐ Receber por E-mail
       - ☐ Receber por WhatsApp

3. **Card "Observações":**
   - Campo de texto livre

## Validações Implementadas

- ✅ Nome completo é obrigatório
- ✅ E-mail validado (formato válido)
- ✅ Website validado (URL válida)
- ✅ Canal de relatório só pode conter 'email' e/ou 'whatsapp'
- ✅ Se autorização desativada, canal deve estar vazio
