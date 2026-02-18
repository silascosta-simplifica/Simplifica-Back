import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { AnalyticsData } from '../types';

export const useAnalytics = () => {
  // Dados do Dashboard Principal
  const [data, setData] = useState<AnalyticsData[]>([]);
  
  // NOVOS DADOS: CRM
  const [crmData, setCrmData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para controlar o botão de atualizar
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const refreshSnapshot = async () => {
    try {
      setRefreshing(true);
      console.log("🔄 Solicitando atualização da Materialized View...");
      
      // Aumenta o timeout do client do Supabase para essa chamada específica
      // (Isso evita que o navegador desista antes do banco terminar)
      const { error } = await supabase.rpc('refresh_analytics');
      
      if (error) {
        console.error("Erro RPC:", error);
        // Se for erro de timeout, tratamos de forma amigável
        if (error.message && (error.message.includes('timeout') || error.message.includes('canceling statement'))) {
            throw new Error("O banco de dados demorou para responder. Tente novamente em 1 minuto.");
        }
        throw error;
      }
      
      console.log("✅ View atualizada! Recarregando dados...");
      await fetchAllData(); 
      
    } catch (err: any) {
      console.error("Erro ao atualizar snapshot:", err);
      alert("Aviso: " + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const pageSize = 1000; 
      
      // --- 1. BUSCA ANALYTICS GERAL ---
      let allRows: any[] = [];
      let page = 0;
      let hasMore = true;

      console.time("Fetching Analytics");

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data: result, error } = await supabase
          .from('analytics_completo')
          .select('*')
          .range(from, to);

        if (error) throw error;

        if (result && result.length > 0) {
          allRows.push(...result);
          if (result.length < pageSize) hasMore = false;
          else page++;
        } else {
          hasMore = false;
        }
      }
      console.timeEnd("Fetching Analytics");

      // --- 2. BUSCA DADOS CRM ---
      let crmRows: any[] = [];
      let crmPage = 0;
      let crmHasMore = true;

      console.time("Fetching CRM");
      while (crmHasMore) {
        const from = crmPage * pageSize;
        const to = from + pageSize - 1;
        const { data: resultCrm, error: errorCrm } = await supabase
          .from('view_crm_dashboard')
          .select('*')
          .range(from, to);

        if (errorCrm) throw errorCrm;

        if (resultCrm && resultCrm.length > 0) {
          crmRows.push(...resultCrm);
          if (resultCrm.length < pageSize) crmHasMore = false;
          else crmPage++;
        } else {
          crmHasMore = false;
        }
      }
      console.timeEnd("Fetching CRM");
      
      console.log(`✅ Analytics Total: ${allRows.length} | ✅ CRM Total: ${crmRows.length}`);

      // Formatação Analytics Geral
      const formattedData: AnalyticsData[] = allRows.map(row => {
        const n = (v: any) => (typeof v === 'number' ? v : Number(v) || 0);
        let mesRefFmt = 'N/D';
        if (row.mes_referencia) {
            const parts = row.mes_referencia.split('-');
            if (parts.length >= 2) mesRefFmt = `${parts[1]}/${parts[0]}`;
        }

        return {
          uc: row.uc,
          nome: row.nome_cliente || 'Sem Nome',
          cliente: row.nome_cliente,
          status: row.status || 'Indefinido',
          fonte_dados: row.fonte_dados,
          objetivo_etapa: row.objetivo_etapa,
          total_cobranca: n(row.total_cobranca),
          boleto_simplifica: n(row.boleto_simplifica),
          valor_estimado: n(row.valor_estimado),      
          consumo_kwh: n(row.consumo_kwh),
          compensacao_kwh: n(row.compensacao_kwh),
          economia_rs: n(row.economia_rs),
          remuneracao_geracao: n(row.remuneracao_geracao),
          vencimento: row.vencimento,
          data_emissao: row.data_emissao,        
          data_emissao_prevista: row.data_emissao_prevista, 
          dia_leitura: n(row.dia_leitura),
          concessionaria: row.concessionaria || 'Não Identificada (RD)',
          area_de_gestao: row.area_de_gestao || 'Outros',
          data_ganho: row.data_ganho,
          data_protocolo: row.data_protocolo,
          data_cancelamento: row.data_cancelamento,
          quem_indicou: null,
          link_fatura: row.link_fatura,
          codigo_barras: row.codigo_barras,
          codigo_pix: row.codigo_pix,
          mes_referencia: row.mes_referencia,
          "mês_referência": mesRefFmt,
          "concessionária": row.concessionaria || 'Outra',
          "área_de_gestão": row.area_de_gestao || 'Outros',
          "total_cobrança_r$": n(row.total_cobranca),
          "consumo_médio_na_venda_mwh": n(row.consumo_crm_mwh), 
          "compensação_total_kwh": n(row.compensacao_kwh),
          "emissão_do_boleto": row.data_emissao,
          "vencimento_do_boleto": row.vencimento,
          "data_do_1º_protocolo": row.data_protocolo,
          "data_de_pedido_de_cancelamento": row.data_cancelamento,
        };
      });

      setData(formattedData);
      setCrmData(crmRows);

    } catch (err: any) {
      console.error('Erro Fatal no Dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, crmData, loading, error, refetch: fetchAllData, refreshSnapshot, refreshing };
};