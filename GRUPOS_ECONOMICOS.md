# Funcionalidade de Grupos Econômicos

## 📋 Resumo

Sistema completo de Grupos Econômicos implementado, permitindo agrupar clientes relacionados empresarialmente.

## 🎯 Funcionalidades Implementadas

### 1. **Banco de Dados**
- ✅ Tabela `grupos_economicos` criada com:
  - `id` (UUID, chave primária)
  - `nome` (texto único)
  - `descricao` (texto opcional)
  - Timestamps automáticos
  
- ✅ Campo `grupo_economico_id` adicionado em `crm_clientes`
- ✅ Índices criados para performance
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de acesso configuradas

### 2. **Componentes e Hooks**

#### `useGruposEconomicos` Hook
Localização: `lib/hooks/useGruposEconomicos.ts`

**Funções disponíveis:**
- `fetchGrupos(search)` - Buscar grupos
- `findOrCreateGrupo(nome)` - Buscar ou criar automaticamente
- `createGrupo(nome, descricao)` - Criar novo grupo
- `updateGrupo(id, nome, descricao)` - Atualizar grupo
- `deleteGrupo(id)` - Excluir grupo
- `getClientesByGrupo(grupoId)` - Listar clientes do grupo

#### `GrupoEconomicoSelector` Componente
Localização: `components/clientes/GrupoEconomicoSelector.tsx`

**Recursos:**
- ✨ Autocomplete inteligente
- 🔍 Busca em tempo real
- ➕ Criação automática ao digitar novo nome
- 🎨 Interface amigável com sugestões
- ⌨️ Suporte a teclado (Enter, Escape)
- 🧹 Botão para limpar campo

### 3. **Integração no Formulário**
- Campo integrado ao formulário de clientes
- Salvamento automático do `grupo_economico_id`
- Detecção de mudanças no formulário

## 📝 Como Usar

### Para o Desenvolvedor

#### 1. **Executar Script SQL**
Execute no SQL Editor do Supabase:
```bash
supabase/create_grupos_economicos.sql
```

#### 2. **Atualização Automática de Tipos** (Opcional)
Se quiser atualizar os tipos TypeScript automaticamente:
```bash
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

### Para o Usuário Final

#### 1. **Criar/Vincular Grupo ao Cadastrar Cliente**

1. Acesse o formulário de novo cliente ou edição
2. Localize o campo **"Grupo Econômico"** (abaixo do campo "Relacionamento")
3. Digite o nome do grupo econômico:
   - Se o grupo **já existir**: aparecerá nas sugestões, clique para selecionar
   - Se o grupo **não existir**: digite o nome e pressione **Enter** ou clique fora do campo
   - O grupo será **criado automaticamente** e vinculado ao cliente

#### 2. **Exemplos de Uso**

**Cenário 1: Primeiro Cliente de um Grupo**
```
Cliente: Empresa ABC Ltda
Grupo Econômico: [Digite] "Grupo XYZ Holding"
[Pressione Enter]
✓ Grupo "Grupo XYZ Holding" criado
✓ Cliente vinculado ao grupo
```

**Cenário 2: Adicionar Outro Cliente ao Mesmo Grupo**
```
Cliente: Empresa DEF S.A.
Grupo Econômico: [Digite] "Grupo XYZ"
[Sugestão aparece] "Grupo XYZ Holding"
[Clique na sugestão]
✓ Cliente vinculado ao grupo existente
```

**Cenário 3: Remover Grupo de um Cliente**
```
[Clique no X no campo Grupo Econômico]
✓ Vínculo removido (grupo não é excluído)
```

## 🔍 Recursos Técnicos

### Busca Inteligente
- Case-insensitive
- Busca parcial (substring)
- Debounce de 300ms
- Limitado a 10 sugestões por padrão

### Criação Automática
- Verifica duplicatas antes de criar
- Tratamento de erros de concorrência
- Feedback visual ao usuário
- Trim automático de espaços

### Performance
- Índices no banco para queries rápidas
- Lazy loading de sugestões
- Cache de grupos carregados

## 🗂️ Estrutura de Arquivos Criados/Modificados

```
supabase/
  ├── create_grupos_economicos.sql          ✨ NOVO

lib/
  ├── hooks/
  │   └── useGruposEconomicos.ts            ✨ NOVO
  └── supabase/
      └── database.types.ts                  📝 ATUALIZADO

components/
  └── clientes/
      ├── GrupoEconomicoSelector.tsx        ✨ NOVO
      └── ClienteForm.tsx                    📝 ATUALIZADO
```

## 🎨 Interface do Usuário

### Campo no Formulário
```
┌─────────────────────────────────────────────┐
│ 🏢 Grupo Econômico                          │
├─────────────────────────────────────────────┤
│ Digite para buscar ou criar um grupo...  ✖ │
└─────────────────────────────────────────────┘
  Digite o nome do grupo. Se não existir,
  será criado automaticamente.

  [Dropdown de Sugestões - aparece ao digitar]
  ┌─────────────────────────────────────────┐
  │ 🏢 Grupo ABC Holding                    │
  │ 🏢 Grupo XYZ Corporation                │
  │ 🏢 Grupo 123 Empresarial                │
  └─────────────────────────────────────────┘
```

## ⚠️ Observações Importantes

1. **Grupos não são excluídos automaticamente**: Mesmo que todos os clientes sejam desvinculados, o grupo permanece no sistema

2. **Nome único**: Não é possível ter dois grupos com o mesmo nome (case-insensitive)

3. **Permissões**: Todos os usuários autenticados podem criar/editar grupos (ajuste as políticas RLS se necessário)

4. **Relacionamento**: Um cliente pode ter apenas UM grupo econômico (many-to-one)

## 🔮 Possíveis Melhorias Futuras

- [ ] Página de gerenciamento de grupos
- [ ] Visualização de todos os clientes de um grupo
- [ ] Estatísticas por grupo econômico
- [ ] Hierarquia de grupos (subgrupos)
- [ ] Importação em massa de grupos
- [ ] Merge de grupos duplicados
- [ ] Dashboard de grupos econômicos
- [ ] Exportação de relatórios por grupo

## 🐛 Troubleshooting

### Erro: "Já existe um grupo econômico com este nome"
**Causa**: Tentativa de criar grupo duplicado
**Solução**: Use a busca para encontrar o grupo existente

### Campo não aparece no formulário
**Causa**: Componente não importado
**Solução**: Verifique se `GrupoEconomicoSelector` está importado em `ClienteForm.tsx`

### Grupos não aparecem nas sugestões
**Causa**: Problemas de permissão RLS
**Solução**: Execute o script SQL completo incluindo as políticas

### Erro ao salvar cliente
**Causa**: Campo `grupo_economico_id` não está sendo enviado
**Solução**: Verifique se `grupoEconomicoId` está incluído em `finalData` no `handleFormSubmit`

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console do navegador
2. Verifique os logs do Supabase
3. Revise as políticas RLS no Supabase Dashboard
4. Confira se todos os arquivos foram criados/atualizados corretamente

---

**Status**: ✅ Implementação Completa
**Data**: 04/02/2026
**Versão**: 1.0
