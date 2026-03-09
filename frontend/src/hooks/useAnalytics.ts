import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { AnalyticsData } from '../types';

export const useAnalytics = (parceiroLogado?: string, isAdmin: boolean = true) => {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [crmData, setCrmData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [parceiroLogado, isAdmin]);

  const refreshSnapshot = async () => {
    try {
      setRefreshing(true);
      const { error } = await supabase.rpc('refresh_analytics');
      if (error) throw error;
      await fetchAllData(); 
    } catch (err: any) {
      alert("Aviso: " + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  // --- FUNÇÃO AJUDANTE PARA BAIXAR DADOS EM PARALELO (TURBO) ---
  const fetchTableInParallel = async (
      tableName: string, 
      selectCols: string, 
      pageSize: number, 
      applyOrder: boolean, 
      partnerFilter?: string
  ) => {
      // 1. Descobre o total de registros primeiro
      let countQuery = supabase.from(tableName).select('*', { count: 'estimated', head: true });
      if (partnerFilter && !isAdmin) {
          countQuery = countQuery.eq('quem_indicou', partnerFilter);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
          console.error(`Erro ao contar registros da tabela ${tableName}:`, countError);
          return []; // Retorna vazio em vez de quebrar silenciosamente
      }
      
      if (!count || count === 0) return [];

      const totalPages = Math.ceil(count / pageSize);
      const allData: any[] = [];
      const concurrency = 4; // Faz 4 requisições simultâneas para não travar o navegador

      // 2. Dispara os blocos de busca em paralelo
      for (let i = 0; i < totalPages; i += concurrency) {
          const promises = [];
          for (let j = 0; j < concurrency && (i + j) < totalPages; j++) {
              const from = (i + j) * pageSize;
              const to = from + pageSize - 1;
              
              let q = supabase.from(tableName).select(selectCols).range(from, to);
              if (applyOrder) q = q.order('uc', { ascending: true });
              if (partnerFilter && !isAdmin) q = q.eq('quem_indicou', partnerFilter);
              
              promises.push(q);
          }

          // Espera o bloco atual terminar antes de puxar o próximo
          const results = await Promise.all(promises);
          results.forEach(res => {
              if (res.error) {
                  console.error(`Falha no bloco de dados da tabela ${tableName}:`, res.error);
              }
              if (res.data) allData.push(...res.data);
          });
      }
      return allData;
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TAMANHO DO PACOTE AJUSTADO PARA EVITAR TIMEOUT 500
      const pageSize = 1000; 
      
      console.time("⏳ Download Total Administrativo");

      // BAIXA AS 3 TABELAS AO MESMO TEMPO EM PARALELO!
      const [allRows, comissoesRows, crmRows] = await Promise.all([
          // 1. Analytics Geral
          fetchTableInParallel('analytics_materializada', '*', pageSize, true, parceiroLogado),
          
          // 2. Comissões (SEM o parceiroLogado aqui para evitar quebra caso a view não tenha a coluna 'quem_indicou')
          fetchTableInParallel('view_comissoes_calculadas', 'uc, percentual_final, percentual_personal', pageSize, true),
          
          // 3. CRM
          (!isAdmin && parceiroLogado) 
              ? Promise.resolve([]) 
              : fetchTableInParallel('view_crm_dashboard', '*', pageSize, true)
      ]);

      console.timeEnd("⏳ Download Total Administrativo");

      // --- DEDUPLICAÇÃO E MAPS ---
      const uniqueRowsMap = new Map();
      allRows.forEach(row => {
        const key = row.id_chave_composta || `${row.uc}-${row.mes_referencia}`;
        uniqueRowsMap.set(key, row); 
      });
      const deduplicatedRows = Array.from(uniqueRowsMap.values());

      const comissoesMap = new Map();
      comissoesRows.forEach(c => {
          if (c.uc) {
              // Garante que é string e remove espaços em branco para a junção funcionar 100%
              comissoesMap.set(String(c.uc).trim(), {
                  final: c.percentual_final || 0,
                  personal: c.percentual_personal || 0
              });
          }
      });

      // --- 4. FORMATAÇÃO DOS DADOS ---
      const formattedData: AnalyticsData[] = deduplicatedRows.map(row => {
        const n = (v: any) => (typeof v === 'number' ? v : Number(v) || 0);
        let mesRefFmt = 'N/D';
        if (row.mes_referencia) {
            const parts = row.mes_referencia.split('-');
            if (parts.length >= 2) mesRefFmt = `${parts[1]}/${parts[0]}`;
        }

        // Pega a comissão limpa do banco de dados garantindo a leitura via String sem espaços
        const safeUc = row.uc ? String(row.uc).trim() : '';
        const comissaoInfo = comissoesMap.get(safeUc) || { final: 0, personal: 0 };

        return {
          ...row, 
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
          data_emissao_distribuidora: row.data_emissao_distribuidora,
          dia_leitura: n(row.dia_leitura),
          concessionaria: row.concessionaria || 'Não Identificada (RD)',
          area_de_gestao: row.area_de_gestao || 'Outros',
          data_ganho: row.data_ganho,
          data_protocolo: row.data_protocolo,
          data_cancelamento: row.data_cancelamento,
          quem_indicou: row.quem_indicou,
          link_fatura: row.link_fatura,
          codigo_barras: row.codigo_barras,
          codigo_pix: row.codigo_pix,
          mes_referencia: row.mes_referencia,
          
          percentual_comissao: comissaoInfo.final, 
          percentual_personal: comissaoInfo.personal,

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
          
          tarifa_estimada: n(row.tarifa_estimada),
          tarifa_real: n(row.tarifa_real),
          eficiencia_compensacao: n(row.eficiencia_compensacao),
          perc_desconto: n(row.perc_desconto),
          natureza_cliente: row.natureza_cliente || 'Outros',
          grupo_tarifario: row.grupo_tarifario || 'N/D',
          motivo_cancelamento: row.motivo_cancelamento || 'Não Informado'
        };
      });

      const crmFormatted = crmRows.map(row => ({
          ...row,
          latitude: row.latitude,   
          longitude: row.longitude, 
          cidade: row.cidade,        
          uf: row.uf,                
          cep_norm: row.cep_uc ? String(row.cep_uc).replace(/\D/g, '') : null
      }));

      setData(formattedData);
      setCrmData(crmFormatted);

    } catch (err: any) {
      console.error('Erro Fatal no Dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false); 
    }
  };

  return { data, crmData, loading, error, refetch: fetchAllData, refreshSnapshot, refreshing };
};