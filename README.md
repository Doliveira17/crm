# Cadastro Web (CRM)

Aplicacao web de CRM com Next.js + Supabase para gestao de clientes, contatos, interacoes, dados tecnicos, tags, faturas e permissoes.

## Manual principal

Use este guia como fonte de verdade para setup completo:

- `MANUAL_OPERACIONAL.md`

## Inicio rapido

1. Copie o ambiente:
```bash
cp .env.example .env.local
```
2. Preencha as variaveis no arquivo `.env.local`.
3. Configure o Supabase seguindo `MANUAL_OPERACIONAL.md`.
4. Instale dependencias:
```bash
npm install
```
5. Rode em desenvolvimento:
```bash
npm run dev
```
6. Acesse `http://localhost:3000`.

## Scripts

- `npm run dev` inicia o app local na porta 3000.
- `npm run dev:3001` inicia o app local na porta 3001.
- `npm run fallback:proxy` inicia proxy de fallback em 3000 apontando para 3001.
- `npm run build` gera build de producao.
- `npm run start` sobe build em producao na porta padrao.
- `npm run start:3001` sobe build em producao na porta 3001.
- `npm run lint` executa o lint.
