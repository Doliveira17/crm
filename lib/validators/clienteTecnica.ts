import { z } from 'zod'

export const clienteTecnicaSchema = z.object({
  cliente_id: z.string().uuid().nullable().optional(),
  documento: z.string().min(1, 'Documento é obrigatório'),
  razao_social: z.string().nullable().optional(),
  nome_planta: z.string().nullable().optional(),
  modalidade: z.string().nullable().optional(),
  classificacao: z.string().nullable().optional(),
  possui_internet: z.boolean().nullable().optional(),
  data_install: z.string().nullable().optional(),
  venc_garantia: z.string().nullable().optional(),
  garantia_extendida: z.string().nullable().optional(),
  tipo_local: z.string().nullable().optional(),
  potencia_usina_kwp: z.number().nullable().optional(),
  quant_inverter: z.number().nullable().optional(),
  marca_inverter: z.string().nullable().optional(),
  mod_inverter: z.string().nullable().optional(),
  serie_inverter: z.string().nullable().optional(),
  quant_modulos: z.number().nullable().optional(),
  marca_modulos: z.string().nullable().optional(),
  mod_modulos: z.string().nullable().optional(),
})

export type ClienteTecnicaFormData = z.infer<typeof clienteTecnicaSchema>
