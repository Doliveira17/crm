# 🔧 Executar Script de UCs Validação

## ⚠️ IMPORTANTE: A tabela `crm_ucs_validacao` precisa ser criada no Supabase!

Sem executar este script, os cliques nos cards não vão funcionar.

---

## 📋 Passo 1: Abrir SQL Editor no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Faça login com sua conta
3. Selecione **seu projeto**
4. No menu esquerdo, clique em **SQL Editor**
5. Clique em **New Query** (botão verde)

---

## 📋 Passo 2: Copiar o Script SQL

Abra o arquivo: `supabase/EXECUTE_UCS_VALIDACAO.sql`

Copie **TODO o conteúdo** do arquivo.

---

## 📋 Passo 3: Colar no Supabase SQL Editor

1. Na janela do SQL Editor, **cole o conteúdo inteiro**
2. Clique no botão **"RUN"** (verde, no canto inferior direito)
3. Aguarde a execução

### ✅ Resultado esperado:
```
✅ Tabela crm_ucs_validacao criada com sucesso!
```

---

## 🧪 Passo 4: Testar no Dashboard

1. Volte para o dashboard: [http://localhost:3000/faturas](http://localhost:3000/faturas)
2. Procure por uma UC **vermelha** (com injetado_zerado)
3. **Clique na UC vermelha**
4. O card deve mudar para **cor laranja** 🟠
5. O contador "Validando" no topo deve **incrementar**

---

## 🔍 Se der erro:

### ❌ "Tabela já existe" ou "Índice já existe"
Isso é normal. O script tem `IF NOT EXISTS`, então é seguro executar novamente.

### ❌ "Permission denied"
Significa que você não tem permissão. Verifique:
- Se está logado com a conta correta
- Se o projeto é o correto

### ❌ Clique ainda não funciona
Verifique se:
1. ✅ A tabela foi criada com sucesso
2. ✅ A página foi recarregada (`F5`)
3. ✅ Você está clicando em uma UC **vermelha** (status = injetado_zerado)
4. ✅ Checa o console do navegador (F12) para ver erros

---

## 📊 Verificar se funcionou:

No Supabase, vá em:
1. **Database** (menu esquerdo)
2. **Tables**
3. Procure por `crm_ucs_validacao`
4. Se aparece, a tabela foi criada com sucesso! ✅

---

## 🎯 Como usar depois:

- **Clicar em UC vermelha** → muda para laranja (Validando)
- **Injetado volta > 0** → muda para verde (Ok)
- **qtd_dias volta para 27-33** → muda para verde (Ok)
