# CRM - Sistema de Gestão de Clientes e Contatos

Sistema web moderno e performático para gestão de clientes (PF e PJ), contatos e relatórios de envios, conectado ao Supabase.

## ?? Tecnologias

- **Next.js 14+** com App Router
- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** + lucide-react
- **Supabase** (PostgreSQL + Auth)
- **React Hook Form** + Zod
- **TanStack React Query**
- **react-input-mask**

## ?? Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase com projeto criado
- Banco de dados Supabase configurado com as tabelas necessárias

## ??? Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas no Supabase:

1. **crm_clientes** - Cadastro de clientes (PF e PJ)
2. **crm_contatos** - Cadastro de contatos
3. **crm_clientes_contatos** - Vínculos entre clientes e contatos
4. **relatorio_envios** - Histórico de envios (somente leitura)

Execute o script SQL em `supabase/rls_policies.sql` para criar as políticas RLS necessárias.

## ?? Instalação

1. **Clone ou baixe o projeto**

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
```

Você encontra essas informações no painel do Supabase em:
`Project Settings > API > Project URL e anon/public key`

4. **Execute o projeto em modo de desenvolvimento**
```bash
npm run dev
```

5. **Acesse o sistema**
Abra [http://localhost:3000](http://localhost:3000) no navegador

## ?? Autenticação

O sistema usa Supabase Auth. Para fazer login:

1. Crie um usuário no painel do Supabase (Authentication > Users > Add User)
2. Use o e-mail e senha cadastrados para acessar o sistema

## ?? Funcionalidades

### Dashboard
- Visão geral com cards de estatísticas
- Total de clientes, contatos e envios
- Taxa de visualização dos envios
- Links rápidos para as principais seções

### Clientes
- ? Listagem com busca avançada
- ? Cadastro de clientes PF e PJ
- ? Edição de dados cadastrais
- ? Exclusão de clientes
- ? Gerenciamento de contatos vinculados
- ? Definir contato principal
- ? Máscaras de CPF/CNPJ, telefone e CEP
- ? Validação de formulários

### Contatos
- ? Listagem com busca
- ? Cadastro de contatos
- ? Edição de informações
- ? Exclusão de contatos
- ? Visualização de clientes vinculados
- ? Máscaras de telefone
- ? Validação de formulários

### Relatórios
- ? Visualização do histórico de envios
- ? Filtros por status e visualização
- ? Links para PDFs dos envios
- ? Visualização de dados JSON
- ? Indicadores visuais de status

## ?? Design

Interface minimalista inspirada no design Apple:
- Amplo espaço em branco
- Tipografia limpa e legível
- Componentes discretos e funcionais
- Foco em produtividade
- Responsivo e acessível

## ?? Estrutura do Projeto

```
+-- app/
¦   +-- (auth)/
¦   ¦   +-- login/          # Página de login
¦   +-- (app)/              # Páginas protegidas
¦   ¦   +-- dashboard/      # Dashboard
¦   ¦   +-- clientes/       # Gestão de clientes
¦   ¦   +-- contatos/       # Gestão de contatos
¦   ¦   +-- relatorios/     # Relatórios de envios
¦   +-- layout.tsx
¦   +-- page.tsx
+-- components/
¦   +-- ui/                 # Componentes shadcn
¦   +-- layout/             # Layout (Sidebar, Topbar, AppShell)
¦   +-- clientes/           # Componentes de clientes
¦   +-- contatos/           # Componentes de contatos
¦   +-- common/             # Componentes reutilizáveis
+-- lib/
¦   +-- supabase/           # Configuração Supabase
¦   +-- validators/         # Schemas Zod
¦   +-- hooks/              # React Query hooks
¦   +-- utils/              # Funções utilitárias
+-- supabase/
    +-- rls_policies.sql    # Políticas de segurança RLS
```

## ?? Segurança

- Autenticação obrigatória em todas as rotas protegidas
- Row Level Security (RLS) habilitado no Supabase
- Validação de dados no cliente e servidor
- Normalização de dados sensíveis
- Proteção contra injeção de código

## ?? Validações

Todos os formulários possuem validação com Zod:
- Campos obrigatórios são marcados com *
- E-mails são validados
- Máscaras aplicadas em tempo real
- Dados normalizados antes de salvar

## ?? Build para Produção

```bash
npm run build
npm start
```

## ??? Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter

## ?? Licença

Este projeto é proprietário e confidencial.

## ????? Desenvolvido por

Davi Oliveira

---

**Nota**: Lembre-se de configurar corretamente as variáveis de ambiente e as políticas RLS no Supabase antes de usar o sistema em produção.
