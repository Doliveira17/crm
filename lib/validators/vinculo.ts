import { z } from 'zod'

export const vinculoSchema = z.object({
  cliente_id: z.string().uuid(),
  contato_id: z.string().uuid(),
  contato_principal: z.boolean().default(false),
  cargo_no_cliente: z.string().nullable().optional(),
  observacoes_relacionamento: z.string().nullable().optional(),
})

export type VinculoFormData = z.infer<typeof vinculoSchema>
