# 🔍 Debugar Clique em UC com Problema

## 📝 Passo 1: Abrir Developer Tools

1. **Abra o Dashboard de Faturas**: [http://localhost:3000/faturas](http://localhost:3000/faturas)
2. **Pressione F12** (ou Ctrl+Shift+I) para abrir o Developer Tools
3. Vá na aba **Console**

## 🔴 Passo 2: Identificar UC Vermelha

Procure por uma UC com:
- Injetado = 0 kWh
- Card com **borda vermelha**
- Status de "injetado_zerado"

## 🖱️ Passo 3: Clicar e Verificar Logs

1. **Clique no card vermelho**
2. **Verifique o console** e procure por logs começando com:
   - `🖱️ CARD CLICADO!` - vai aparecer depois do clique
   - `🔴 CLIQUE DETECTADO!` - deve aparecer se a função foi chamada
   - `⏳ Marcando UC...` - deve aparecer se entrou na função

## 📊 Possíveis Resultados

### ✅ Se funcionou:
```
🖱️ CARD CLICADO! Status: injetado_zerado EstadoUc: null CPF: 08123456789
✅ Condição atendida: vai marcar como Validando
🔴 CLIQUE DETECTADO! CPF: 08123456789 UC: 1234567890
⏳ Marcando UC 1234567890 como Validando...
📋 Chave completa: 08123456789:1234567890
✅ Estado local atualizado! Total de UCs em validação: 1
⏳ Enviando para banco de dados...
✅ UC 1234567890 marcada como Validando
```

### ❌ Se não funcionou - Causas possíveis:

#### 1️⃣ "Condição NÃO atendida: vai abrir diálogo"
**Causa**: A UC não tem status `injetado_zerado` ou já tem um estado

**Solução**: 
- Verifique se a UC está realmente vermelha
- Procure por UCs que têm injetado = 0 kWh

#### 2️⃣ "Sem CPF/CNPJ - não vai processar"
**Causa**: O cliente não tem CPF/CNPJ cadastrado

**Solução**:
- Verifique no banco se `crm_clientes.cpf_cnpj` está preenchido
- Execute SQL no Supabase:
```sql
SELECT documento, uc FROM crm_ucs_validacao LIMIT 5;
```

#### 3️⃣ "Erro ao atualizar UC no banco"
**Causa**: Problema na conexão com Supabase ou RLS

**Solução**:
- Verifique no console qual é o código do erro
- Se for **PGRST116**: problemas de RLS
- Verifique se as políticas estão corretas:
```sql
SELECT * FROM pg_policies WHERE tablename = 'crm_ucs_validacao';
```

#### 4️⃣ Nada aparece no console
**Causa**: O onClick não está disparando

**Solução**:
- Certifique-se de clicar **no card inteiro**
- Não clique em textos ou ícones específicos
- Tente clicar na área vazia do card

## 🎯 Teste Rápido

Execute isso no console do navegador:

```javascript
// Verificar se o mapa de validação tem dados
console.log('Validações carregadas:', window.__ucsValidacao?.size)

// Ver todas as UCs em validação
window.__ucsValidacao?.forEach((val, key) => {
  console.log(key, '→', val.estado)
})
```

## 📤 Se ainda não funcionar:

Copie os **logs completos do console** e compartilhe:
1. Abra o Developer Tools (F12)
2. Clique direito no console → **Save as** → salve como arquivo
3. Compartilhe comigo os erros

---

## 🟠 O que deve aparecer no card após funcionar:

- **Cor**: Mude de vermelho para **laranja**
- **Topo do Dashboard**: Contador de "Validando" deve **incrementar**
- **Header do Cliente**: Deve aparecer "X validando"
