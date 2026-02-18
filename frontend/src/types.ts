export interface AnalyticsData {
  uc: string;
  mes_referencia: string;
  nome: string;
  cliente: string;
  
  // Financeiro Consolidado
  total_cobranca: number;     // Valor Realizado
  valor_estimado: number;     // Valor Estimado (RD)
  consumo_kwh: number;
  compensacao_kwh: number;
  economia_rs: number;
  remuneracao_geracao: number;

  // Status e Datas
  status: string;
  vencimento: string | null;
  data_emissao: string | null;          // Data Real
  data_emissao_prevista: string | null; // Data Prevista (Calculada)
  dia_leitura: number;
  
  // Dados Bancários
  codigo_barras: string | null;
  codigo_pix: string | null;
  
  // Comercial (RD Station)
  concessionaria: string;
  area_de_gestao: string;
  data_ganho: string | null;
  data_protocolo: string | null;
  data_cancelamento: string | null;
  quem_indicou: string | null;
  
  // Extras
  link_fatura: string | null;
  fonte_dados: 'LUMI' | 'LUMI_COOP' | 'UNIFICA' | string;
  
  // Mapeamento Legado (Para compatibilidade com gráficos antigos)
  "total_cobrança_r$": number;
  "consumo_médio_na_venda_mwh": number;
  "compensação_total_kwh": number;
  "concessionária": string;
  "área_de_gestão": string;
  "mês_referência": string;
  "vencimento_do_boleto": string | null;
  "emissão_do_boleto": string | null;
  "data_do_1º_protocolo": string | null;
  "data_de_pedido_de_cancelamento": string | null;
}