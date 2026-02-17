import { z } from 'zod'

// Schema para preferências de comunicação por cliente vinculado
export const preferenciasClienteSchema = z.object({
  cliente_id: z.string().uuid(),
  cliente_nome: z.string().optional(),
  tipo_cliente: z.string().optional(),
  grupo_whatsapp: z.string().nullable().optional(),
  
  // Campos da tabela crm_clientes_contatos
  cargo_no_cliente: z.string().nullable().optional(),
  observacoes_relacionamento: z.string().nullable().optional(),
  contato_principal: z.boolean().default(false),
  pref_email: z.boolean(),
  pref_whatsapp: z.boolean(),
  pref_grupo_whatsapp: z.boolean(),
  
  // Campos de contato específicos para este cliente
  email_contato: z.string().email('E-mail inválido').nullable().optional().or(z.literal('')),
  telefone_contato: z.string().nullable().optional(),
  website_contato: z.string().url('URL inválida').nullable().optional().or(z.literal('')),
})

export type PreferenciasClienteData = z.infer<typeof preferenciasClienteSchema>

export const contatoSchema = z.object({
  nome_completo: z.string().min(1, 'Nome completo é obrigatório'),
  apelido_relacionamento: z.string().nullable().optional(),
  cargo: z.string().nullable().optional(),
  celular: z.string().nullable().optional(),
  email: z.string().email('E-mail inválido').nullable().optional().or(z.literal('')),
  observacoes: z.string().nullable().optional(),
  data_aniversario: z.string().nullable().optional(),
  pessoa_site: z.string().url('URL inválida').nullable().optional().or(z.literal('')),
  pessoa_redes: z.string().nullable().optional(),
  canal_relatorio: z.array(z.enum(['email', 'whatsapp', 'grupo_whatsapp'])).nullable().optional(),
  
  // Clientes vinculados com preferências específicas
  clientes_vinculados: z.array(preferenciasClienteSchema).optional(),
})

export type ContatoFormData = z.infer<typeof contatoSchema>
