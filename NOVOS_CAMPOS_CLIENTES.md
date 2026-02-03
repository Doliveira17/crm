# Atualização dos Campos de Clientes - Resumo

## Campos Adicionados na Tabela `crm_clientes`

### Novos Campos:
1. **`nome_grupo`** (text) - Nome do grupo empresarial
2. **`status`** (text) - Status do cliente (ATIVO, INATIVO, PROSPECTO, SUSPENSO)
3. **`tipo_relacionamento`** (text) - Tipo de relacionamento (Cliente, Fornecedor, Parceiro, etc.)
4. **`ins_estadual`** (text) - Inscrição estadual
5. **`emp_redes`** (text) - Redes sociais da empresa
6. **`data_fundacao`** (date) - Data de fundação
7. **`emp_site`** (text) - Site da empresa
8. **`ins_municipal`** (text) - Inscrição municipal

## Funcionalidade Especial - Inscrições

Implementada a funcionalidade solicitada para inscrições:
- **Checkbox "Possui inscrições"** - Quando marcado, exibe os campos de inscrição estadual e municipal
- **Campos condicionais** - Os campos de inscrição só aparecem quando necessário
- **Validação automática** - Limpa os campos quando desmarcado

## Arquivos Modificados

### 1. SQL de Atualização
- **Arquivo**: `supabase/add_new_cliente_fields.sql`
- **Conteúdo**: Script completo para adicionar campos, constraints e índices

### 2. Schema de Validação
- **Arquivo**: `lib/validators/cliente.ts`
- **Alterações**: Adicionados todos os novos campos com validações apropriadas

### 3. Formulário de Cliente
- **Arquivo**: `components/clientes/ClienteForm.tsx`
- **Alterações**: 
  - Nova seção "Informações Complementares"
  - Lógica para checkbox de inscrições
  - Campos condicionais para inscrições

### 4. Hook de Clientes
- **Arquivo**: `lib/hooks/useClientes.ts`
- **Alterações**: Normalização dos novos campos na criação e atualização

### 5. Types do Database
- **Arquivo**: `lib/supabase/database.types.ts`
- **Alterações**: Adicionados tipos para os novos campos (Row, Insert, Update)

### 6. Componente Checkbox
- **Arquivo**: `components/ui/checkbox.tsx`
- **Status**: Criado novo componente baseado no Radix UI

## Como Usar

### 1. Executar o SQL
Execute o arquivo `supabase/add_new_cliente_fields.sql` no seu banco de dados Supabase.

### 2. Instalar Dependência
```bash
npm install @radix-ui/react-checkbox
```

### 3. Acessar o Formulário
- Acesse `/clientes/novo` para criar um novo cliente
- Acesse `/clientes/[id]` para editar um cliente existente

## Validações Implementadas

- **Status**: Limitado aos valores ATIVO, INATIVO, PROSPECTO, SUSPENSO
- **Site**: Validação de URL válida
- **Inscrições**: Campos condicionais baseados no checkbox
- **Normalização**: Todos os campos são normalizados antes de salvar

## Funcionalidades do Formulário

### Seção Informações Complementares
- Nome do grupo empresarial
- Status com dropdown
- Tipo de relacionamento
- Data de fundação
- Site da empresa (com validação de URL)
- Redes sociais

### Seção de Inscrições
- Checkbox para ativar/desativar campos
- Inscrição estadual (aparecem apenas quando ativado)
- Inscrição municipal (aparecem apenas quando ativado)
- Limpeza automática dos campos ao desativar

## Constraints e Índices Criados

- **Status**: Check constraint para valores válidos
- **Site**: Check constraint para formato de URL
- **Índices**: Criados para otimizar consultas nos campos mais utilizados

## Observações

- Todos os novos campos são opcionais (nullable)
- O status tem valor padrão 'ATIVO'
- A validação de inscrições é feita no frontend
- Os campos são normalizados antes de salvar no banco
- A funcionalidade de auto-save funciona com os novos campos