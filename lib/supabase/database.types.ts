export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      crm_clientes: {
        Row: {
          id: string
          nome_cadastro: string
          tipo_cliente: string | null
          documento: string | null
          razao_social: string | null
          nome_fantasia: string | null
          apelido_relacionamento: string | null
          telefone_principal: string | null
          email_principal: string | null
          logradouro: string | null
          numero: string | null
          complemento: string | null
          bairro: string | null
          municipio: string | null
          uf: string | null
          cep: string | null
          observacoes: string | null
          tags: string[] | null
          favorito: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome_cadastro: string
          tipo_cliente?: string | null
          documento?: string | null
          razao_social?: string | null
          nome_fantasia?: string | null
          apelido_relacionamento?: string | null
          telefone_principal?: string | null
          email_principal?: string | null
          logradouro?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          municipio?: string | null
          uf?: string | null
          cep?: string | null
          observacoes?: string | null
          tags?: string[] | null
          favorito?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome_cadastro?: string
          tipo_cliente?: string | null
          documento?: string | null
          razao_social?: string | null
          nome_fantasia?: string | null
          apelido_relacionamento?: string | null
          telefone_principal?: string | null
          email_principal?: string | null
          logradouro?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          municipio?: string | null
          uf?: string | null
          cep?: string | null
          observacoes?: string | null
          tags?: string[] | null
          favorito?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      crm_contatos: {
        Row: {
          id: string
          nome_completo: string
          apelido_relacionamento: string | null
          cargo: string | null
          celular: string | null
          email: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome_completo: string
          apelido_relacionamento?: string | null
          cargo?: string | null
          celular?: string | null
          email?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome_completo?: string
          apelido_relacionamento?: string | null
          cargo?: string | null
          celular?: string | null
          email?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      crm_clientes_contatos: {
        Row: {
          id: string
          cliente_id: string
          contato_id: string
          contato_principal: boolean
          cargo_no_cliente: string | null
          observacoes_relacionamento: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          contato_id: string
          contato_principal?: boolean
          cargo_no_cliente?: string | null
          observacoes_relacionamento?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          contato_id?: string
          contato_principal?: boolean
          cargo_no_cliente?: string | null
          observacoes_relacionamento?: string | null
          created_at?: string
        }
      }
      relatorio_envios: {
        Row: {
          id: number
          cliente_id: string | null
          contato_id: string | null
          plant_id: string | null
          nome_falado_dono: string | null
          url: string | null
          url_pdf: string | null
          status_envio: string | null
          viewed: boolean | null
          id_poll: string | null
          etapa_lead: number | null
          verifica: string | null
          jsonfinal: Json | null
          enviado_em: string | null
          visualizado_em: string | null
          created_at: string
        }
        Insert: {
          id?: number
          cliente_id?: string | null
          contato_id?: string | null
          plant_id?: string | null
          nome_falado_dono?: string | null
          url?: string | null
          url_pdf?: string | null
          status_envio?: string | null
          viewed?: boolean | null
          id_poll?: string | null
          etapa_lead?: number | null
          verifica?: string | null
          jsonfinal?: Json | null
          enviado_em?: string | null
          visualizado_em?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          cliente_id?: string | null
          contato_id?: string | null
          plant_id?: string | null
          nome_falado_dono?: string | null
          url?: string | null
          url_pdf?: string | null
          status_envio?: string | null
          viewed?: boolean | null
          id_poll?: string | null
          etapa_lead?: number | null
          verifica?: string | null
          jsonfinal?: Json | null
          enviado_em?: string | null
          visualizado_em?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
