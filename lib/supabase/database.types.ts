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
          razao_social: string
          tipo_cliente: string | null
          documento: string | null
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
          // Novos campos
          nome_grupo: string | null
          status: string | null
          tipo_relacionamento: string | null
          ins_estadual: string | null
          emp_redes: string | null
          data_fundacao: string | null
          emp_site: string | null
          ins_municipal: string | null
          grupo_economico_id: string | null
          estado_de_chamado: string | null
          historico_validacao: Json | null
        }
        Insert: {
          id?: string
          razao_social: string
          tipo_cliente?: string | null
          documento?: string | null
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
          // Novos campos
          nome_grupo?: string | null
          status?: string | null
          tipo_relacionamento?: string | null
          ins_estadual?: string | null
          emp_redes?: string | null
          data_fundacao?: string | null
          emp_site?: string | null
          ins_municipal?: string | null
          grupo_economico_id?: string | null
          estado_de_chamado?: string | null
          historico_validacao?: Json |null
        }
        Update: {
          id?: string
          razao_social?: string
          tipo_cliente?: string | null
          documento?: string | null
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
          // Novos campos
          nome_grupo?: string | null
          status?: string | null
          tipo_relacionamento?: string | null
          ins_estadual?: string | null
          emp_redes?: string | null
          data_fundacao?: string | null
          emp_site?: string | null
          ins_municipal?: string | null
          grupo_economico_id?: string | null
          estado_de_chamado?: string | null
          historico_validacao?: Json | null
        }
        Relationships: []
      }
      crm_contatos: {
        Row: {
          id: string
          nome_completo: string
          apelido_relacionamento: string | null
          cargo: string | null
          celular: string | null
          email: string | null
          data_aniversario: string | null
          pessoa_site: string | null
          pessoa_redes: string | null
          autorizacao_mensagem: boolean | null
          canal_relatorio: string[] | null
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
          data_aniversario?: string | null
          pessoa_site?: string | null
          pessoa_redes?: string | null
          autorizacao_mensagem?: boolean | null
          canal_relatorio?: string[] | null
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
          data_aniversario?: string | null
          pessoa_site?: string | null
          pessoa_redes?: string | null
          autorizacao_mensagem?: boolean | null
          canal_relatorio?: string[] | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      crm_tags: {
        Row: {
          id: string
          nome: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          created_at?: string
        }
        Relationships: []
      }
      crm_clientes_tecnica: {
        Row: {
          id: string
          cliente_id: string | null
          documento: string
          razao_social: string | null
          nome_planta: string | null
          modalidade: string | null
          classificacao: string | null
          tipo_local: string | null
          possui_internet: boolean | null
          data_install: string | null
          venc_garantia: string | null
          potencia_usina_kwp: number | null
          quant_inverter: number | null
          marca_inverter: string | null
          mod_inverter: string | null
          serie_inverter: string | null
          quant_modulos: number | null
          marca_modulos: string | null
          mod_modulos: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente_id?: string | null
          documento: string
          razao_social?: string | null
          nome_planta?: string | null
          modalidade?: string | null
          classificacao?: string | null
          tipo_local?: string | null
          possui_internet?: boolean | null
          data_install?: string | null
          venc_garantia?: string | null
          potencia_usina_kwp?: number | null
          quant_inverter?: number | null
          marca_inverter?: string | null
          mod_inverter?: string | null
          serie_inverter?: string | null
          quant_modulos?: number | null
          marca_modulos?: string | null
          mod_modulos?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string | null
          documento?: string
          razao_social?: string | null
          nome_planta?: string | null
          modalidade?: string | null
          classificacao?: string | null
          tipo_local?: string | null
          possui_internet?: boolean | null
          data_install?: string | null
          venc_garantia?: string | null
          potencia_usina_kwp?: number | null
          quant_inverter?: number | null
          marca_inverter?: string | null
          mod_inverter?: string | null
          serie_inverter?: string | null
          quant_modulos?: number | null
          marca_modulos?: string | null
          mod_modulos?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      fila_extracao: {
        Row: {
          id: string
          UC: string | null
          cliente: string | null
          mes_referente: string | null
          injetado: string | number | null
          dados_inversor: Json | null
          caminho_arquivo: string | null
          status: string | null
          dados_extraidos: Json | null
          cnpj: string | null
          created_at: string
        }
        Insert: {
          id?: string
          UC?: string | null
          cliente?: string | null
          mes_referente?: string | null
          injetado?: string | number | null
          dados_inversor?: Json | null
          caminho_arquivo?: string | null
          status?: string | null
          dados_extraidos?: Json | null
          cnpj?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          UC?: string | null
          cliente?: string | null
          mes_referente?: string | null
          injetado?: string | number | null
          dados_inversor?: Json | null
          caminho_arquivo?: string | null
          status?: string | null
          dados_extraidos?: Json | null
          cnpj?: string | null
          created_at?: string
        }
        Relationships: []
      }
      growatt: {
        Row: {
          id?: string
          CLIENTE: string | null
          "CPF/CNPJ": string | null
          UNIDADES_CONSUMIDORAS: string | null
          Plant_ID: string | null
          INVERSOR: string | null
          saldo_credito: number | null
          porcentagem: number | null
          "histórico_gerado": Json | null
          "data_ativação": string | null
          Geracao_Ac_Mensal: number | null
          Geracao_Ac_Anual: number | null
          Retorno_Financeiro: number | null
        }
        Insert: {
          id?: string
          CLIENTE?: string | null
          "CPF/CNPJ"?: string | null
          UNIDADES_CONSUMIDORAS?: string | null
          Plant_ID?: string | null
          INVERSOR?: string | null
          saldo_credito?: number | null
          porcentagem?: number | null
          "histórico_gerado"?: Json | null
          "data_ativação"?: string | null
          Geracao_Ac_Mensal?: number | null
          Geracao_Ac_Anual?: number | null
          Retorno_Financeiro?: number | null
        }
        Update: {
          id?: string
          CLIENTE?: string | null
          "CPF/CNPJ"?: string | null
          UNIDADES_CONSUMIDORAS?: string | null
          Plant_ID?: string | null
          INVERSOR?: string | null
          saldo_credito?: number | null
          porcentagem?: number | null
          "histórico_gerado"?: Json | null
          "data_ativação"?: string | null
          Geracao_Ac_Mensal?: number | null
          Geracao_Ac_Anual?: number | null
          Retorno_Financeiro?: number | null
        }
        Relationships: []
      }
      grupos_economicos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_ucs_validacao: {
        Row: {
          id: string
          documento: string
          uc: string
          estado_de_chamado: string | null
          historico_validacao: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          documento: string
          uc: string
          estado_de_chamado?: string | null
          historico_validacao?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          documento?: string
          uc?: string
          estado_de_chamado?: string | null
          historico_validacao?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      view_faturas_completa: {
        Row: {
          UC_Final: string | null
          id_fatura: number | null
          cliente_fatura: string | null
          uc_fatura: string | null
          mes_referente: string | null
          injetado: number | null
          dados_inversor: Json | null
          caminho_arquivo: string | null
          status: string | null
          dados_extraidos: Json | null
          cliente_cadastro: string | null
          cpf_cnpj: string | null
          uc_cadastro: string | null
          Plant_ID: string | null
          INVERSOR: string | null
          saldo_credito: number | null
          porcentagem: number | null
          historico_gerado: Json | null
          data_ativacao: string | null
          meta_mensal: number | null
          Geracao_Ac_Anual: number | null
          Retorno_Financeiro: number | null
        }
        Insert: {
          [_ in never]: never
        }
        Update: {
          [_ in never]: never
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
