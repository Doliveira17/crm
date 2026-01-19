import { z } from 'zod'

export const clienteSchema = z.object({
  nome_cadastro: z.string().min(1, 'Nome é obrigatório'),
  tipo_cliente: z.enum(['PF', 'PJ']).nullable().optional(),
  documento: z.string().nullable().optional(),
  razao_social: z.string().nullable().optional(),
  nome_fantasia: z.string().nullable().optional(),
  apelido_relacionamento: z.string().nullable().optional(),
  telefone_principal: z.string().nullable().optional(),
  email_principal: z.string().email('E-mail inválido').nullable().optional().or(z.literal('')),
  logradouro: z.string().nullable().optional(),
  numero: z.string().nullable().optional(),
  complemento: z.string().nullable().optional(),
  bairro: z.string().nullable().optional(),
  municipio: z.string().nullable().optional(),
  uf: z.string().max(2).nullable().optional(),
  cep: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  favorito: z.boolean().nullable().optional(),
}).refine((data) => {
  // Se não tem documento preenchido, passa
  if (!data.documento || data.documento.trim() === '') {
    return true
  }

  // Remove caracteres não numéricos
  const docNumeros = data.documento.replace(/\D/g, '')

  // Se é Pessoa Física, deve ter 11 dígitos (CPF)
  if (data.tipo_cliente === 'PF' && docNumeros.length !== 11) {
    return false
  }

  // Se é Pessoa Jurídica, deve ter 14 dígitos (CNPJ)
  if (data.tipo_cliente === 'PJ' && docNumeros.length !== 14) {
    return false
  }

  return true
}, {
  message: 'Documento inválido para o tipo de cliente selecionado',
  path: ['documento']
})

export type ClienteFormData = z.infer<typeof clienteSchema>
