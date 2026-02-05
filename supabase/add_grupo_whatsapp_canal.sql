-- O campo canal_relatorio já é um array de texto (text[])
-- Não é necessário alterar a estrutura da tabela, apenas adicionar
-- o novo valor 'grupo_whatsapp' como uma opção válida no array

-- Comentário sobre os valores aceitos no campo
COMMENT ON COLUMN crm_contatos.canal_relatorio IS 'Canais preferidos para receber relatórios. Valores possíveis: email, whatsapp, grupo_whatsapp';

-- Exemplo de como atualizar um contato para incluir o novo canal (opcional)
-- UPDATE crm_contatos 
-- SET canal_relatorio = array_append(canal_relatorio, 'grupo_whatsapp')
-- WHERE id = 'ID_DO_CONTATO';
