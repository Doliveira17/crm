import { z } from 'zod'

export const contatoSchema = z.object({
  nome_completo: z.string().min(1, 'Nome completo é obrigatório'),
  apelido_relacionamento: z.string().nullable().optional(),
  cargo: z.string().nullable().optional(),
  celular: z.string().nullable().optional(),
  email: z.string().email('E-mail inválido').nullable().optional().or(z.literal('')),
  observacoes: z.string().nullable().optional(),
})

export type ContatoFormData = z.infer<typeof contatoSchema>
