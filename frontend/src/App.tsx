import { useMemo, useState, useRef, useEffect } from 'react';
import { useAnalytics } from './hooks/useAnalytics'; // Importando o hook atualizado
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  Area, ComposedChart, Bar
} from 'recharts';
import { 
  LayoutDashboard, Loader2, Filter, AlertCircle, CheckCircle2, DollarSign, FileText, Send, Clock, Zap, Download, Wallet, Calendar, Search, MousePointerClick, TrendingUp, ArrowUpDown, Briefcase, Users, ChevronDown, Check, MapPin, RefreshCw
} from 'lucide-react';
import { subMonths, isAfter, isBefore, endOfMonth } from 'date-fns';

// --- COMPONENTES AUXILIARES ---

// 1. Componente MultiSelect Customizado
const MultiSelect = ({ options, selected, onChange, placeholder, icon: Icon }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter((item: string) => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    const displayValue = selected.length === 0 
        ? placeholder 
        : selected.length === 1 
            ? selected[0] 
            : `${selected.length} selecionados`;

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full md:w-48 bg-slate-800 border ${isOpen ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-slate-700'} rounded-lg px-3 py-2 text-sm text-white outline-none flex items-center justify-between transition-all hover:bg-slate-700`}
            >
                <div className="flex items-center gap-2 truncate">
                    {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
                    <span className={`truncate ${selected.length === 0 ? 'text-slate-400' : 'text-slate-200'}`}>
                        {displayValue}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 max-h-64 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 p-1">
                     <div 
                        className="px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded cursor-pointer flex items-center gap-2 font-medium mb-1 border-b border-slate-800"
                        onClick={() => onChange(selected.length > 0 ? [] : options)}
                     >
                        {selected.length > 0 ? 'Limpar Seleção' : 'Selecionar Todos'}
                     </div>
                    {options.map((opt: string) => (
                        <div 
                            key={opt} 
                            onClick={() => toggleOption(opt)}
                            className="flex items-center gap-2 px-2 py-2 hover:bg-slate-800 rounded cursor-pointer group"
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selected.includes(opt) ? 'bg-blue-600 border-blue-600' : 'border-slate-600 group-hover:border-slate-500'}`}>
                                {selected.includes(opt) && <Check size={10} className="text-white" />}
                            </div>
                            <span className={`text-sm ${selected.includes(opt) ? 'text-white font-medium' : 'text-slate-400'}`}>{opt}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// 2. Card de KPI CRM
const CrmKpiCard = ({ title, count, mwh, color = "blue" }: any) => {
    const colorClasses: any = {
        blue: "text-blue-400 border-blue-500/30 bg-blue-500/10",
        green: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
        amber: "text-amber-400 border-amber-500/30 bg-amber-500/10",
        rose: "text-rose-400 border-rose-500/30 bg-rose-500/10",
        purple: "text-purple-400 border-purple-500/30 bg-purple-500/10",
        slate: "text-slate-400 border-slate-500/30 bg-slate-500/10"
    };
    
    let dynamicColor = color;
    const t = title.toLowerCase();
    if (t.includes('operacional')) dynamicColor = 'green';
    else if (t.includes('exclusão') || t.includes('excluído')) dynamicColor = 'rose';
    else if (t.includes('protocolad')) dynamicColor = 'blue';
    else if (t.includes('pré')) dynamicColor = 'purple';
    else dynamicColor = 'slate';

    const activeClass = colorClasses[dynamicColor] || colorClasses.slate;

    return (
        <div className={`p-4 rounded-xl border ${activeClass} flex flex-col justify-between min-w-[180px] flex-1 shadow-sm`}>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-2 truncate" title={title}>{title}</p>
            <div>
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                   <Zap size={10}/> {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(mwh)} MWh
                </p>
            </div>
        </div>
    );
};

// 3. Tabela Financeira
const FinancialTable = ({ title, data, colorClass, totalValue, totalCompensated, showHeader = true }: any) => (
  <div className={`bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-full shadow-lg`}>
    {showHeader && (
      <div className={`p-4 border-b border-slate-700 ${colorClass} bg-opacity-10`}>
        <h3 className="font-bold text-sm uppercase tracking-wide text-slate-200 mb-1">{title}</h3>
        <div className="flex justify-between items-end">
          <div><p className="text-xs text-slate-400">Total Valor</p><p className="text-xl font-bold text-white">{totalValue}</p></div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Compensado</p>
            <p className="text-sm font-mono text-yellow-400 flex items-center gap-1 justify-end"><Zap size={14}/> {totalCompensated}</p>
          </div>
        </div>
      </div>
    )}
    <div className="overflow-auto flex-1 h-[300px] relative"> 
      {!showHeader && <div className={`sticky top-0 p-2 text-xs font-bold uppercase tracking-wider text-center ${colorClass.split(' ')[0]} bg-slate-950/80 backdrop-blur-sm z-10 border-b border-slate-800`}>{title}</div>}
      
      <table className="w-full text-sm text-left text-slate-400">
        <thead className="text-xs text-slate-200 uppercase bg-slate-900/50 sticky top-0 z-0">
          <tr><th className="px-4 py-3 font-semibold">UC</th><th className="px-4 py-3 font-semibold">Cliente</th><th className="px-4 py-3 text-right font-semibold">Valor R$</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {data.map((row: any, idx: number) => (
            <tr key={idx} className="hover:bg-slate-700/50 transition-colors">
              <td className="px-4 py-2 font-mono text-xs text-slate-300">{row.uc}</td>
              <td className="px-4 py-2 truncate max-w-[150px] text-slate-200" title={row.nome}>{row.nome}</td>
              <td className="px-4 py-2 text-right text-white font-medium">{new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(row.total_fatura)}</td>
            </tr>
          ))}
          {data.length === 0 && (<tr><td colSpan={3} className="text-center py-10 text-slate-500">Nenhum registro encontrado.</td></tr>)}
        </tbody>
      </table>
    </div>
    <div className="p-2 border-t border-slate-700 text-xs text-center text-slate-500 bg-slate-900">{data.length} registros</div>
  </div>
);

// --- APP PRINCIPAL ---

function App() {
  // Agora pegamos 'refreshSnapshot' e 'refreshing' do hook
  const { data: rawData, crmData, loading, refreshSnapshot, refreshing } = useAnalytics();
  
  // Estado das Abas
  const [currentTab, setCurrentTab] = useState<'faturamento' | 'recebimento' | 'operacional' | 'carteira' | 'crm' | 'localizacao'>('faturamento');
  
  // Filtros Globais
  const [selectedConcessionaria, setSelectedConcessionaria] = useState('Todas');
  const [selectedMesRef, setSelectedMesRef] = useState('Todos');
  const [selectedArea, setSelectedArea] = useState('Todas');
  
  // Filtros Operacional
  const [searchText, setSearchText] = useState('');
  const [opFilterStatus, setOpFilterStatus] = useState('Todos'); 
  const [opFilterEtapa, setOpFilterEtapa] = useState('Todas'); 
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null); 

  // Filtros CRM
  const [crmSearch, setCrmSearch] = useState('');
  const [crmFilterConcessionaria, setCrmFilterConcessionaria] = useState<string[]>([]);
  const [crmFilterArea, setCrmFilterArea] = useState<string[]>([]);
  const [crmFilterEtapa, setCrmFilterEtapa] = useState<string[]>([]);
  const [crmFilterStatus, setCrmFilterStatus] = useState<string[]>([]);

  // 1. TRATAMENTO INICIAL
  const data = useMemo(() => {
    if (!rawData) return [];
    return rawData.map((d: any) => {
      const conc = d['concessionária'] || d.concessionaria || d.concessionaria_rd || 'Outra';
      const area = d['área_de_gestão'] || d.area_de_gestao || 'Outros';
      const mes = d['mês_referência'] || d.mes_referencia_formatado || 'N/D';
      
      const dataEntrada = d.data_protocolo || d['data_do_1º_protocolo'] || d.data_ganho || d.created_at || null;
      
      const valorTotal = parseFloat(d.total_cobranca) || parseFloat(d['total_cobrança_r$']) || 0;
      const valorEstimado = parseFloat(d.valor_estimado) || 0;
      
      const statusRaw = d.status || d['Status Pagamento'];
      const statusFinal = (statusRaw && statusRaw !== 'null' && statusRaw !== '') ? statusRaw : 'Indefinido';
      
      const isRD = d.fonte_dados === 'RD';
      
      return {
        ...d,
        uc: d.uc,
        nome: d.nome || d.nome_cliente || 'Sem Nome',
        concessionaria_norm: conc,
        area_norm: area,
        mes_norm: mes,
        objetivo_etapa_norm: d.objetivo_etapa || 'Sem Objetivo',
        status_norm: statusFinal,
        fonte_dados: d.fonte_dados, 
        valor_realizado: !isRD ? valorTotal : 0,
        valor_potencial: valorEstimado,
        total_fatura: valorTotal,
        consumo_mwh: parseFloat(d.consumo_crm_mwh) || parseFloat(d['consumo_médio_na_venda_mwh']) || 0,
        compensado_kwh: parseFloat(d.compensacao_kwh) || parseFloat(d['compensação_total_kwh']) || 0,
        data_entrada_norm: dataEntrada,
        data_saida_norm: d.data_cancelamento || d['data_de_pedido_de_cancelamento'],
        vencimento_norm: d.vencimento || d.vencimento_do_boleto,
        data_emissao_norm: d.data_emissao || d.emissão_do_boleto,
        data_prevista_norm: d.data_emissao_prevista
      };
    });
  }, [rawData]);

  // --- LÓGICA CRM ---
  const crmProcessed = useMemo(() => {
    if (!crmData) return { filtered: [], stats: null, options: { concessionarias: [], areas: [], etapas: [], status: [] } };

    const concessionariasRaw = Array.from(new Set(crmData.map(d => d.concessionaria || 'Outra').filter(Boolean))).sort();
    const areasRaw = Array.from(new Set(crmData.map(d => d.area_de_gestao || 'Outros').filter(Boolean))).sort();
    const etapasRaw = Array.from(new Set(crmData.map(d => d.objetivo_etapa || 'Sem Etapa').filter(Boolean)));
    const statusRaw = Array.from(new Set(crmData.map(d => d.status_rd || 'Sem Status').filter(Boolean))).sort();

    const etapaOrder: Record<string, number> = {
        'Pré-protocolo': 1,
        'Protocolados': 2,
        'Operacional': 3,
        'Em Exclusão': 4,
        'Excluído': 5,
        'Sem Etapa': 99
    };
    const getEtapaWeight = (etapa: string) => {
        const key = Object.keys(etapaOrder).find(k => etapa.includes(k));
        return key ? etapaOrder[key] : 99;
    };
    const etapasSorted = etapasRaw.sort((a, b) => getEtapaWeight(a) - getEtapaWeight(b));

    const filtered = crmData.filter(item => {
        const s = crmSearch.toLowerCase();
        const matchSearch = !s || (item.uc && item.uc.toLowerCase().includes(s)) || (item.nome_negocio && item.nome_negocio.toLowerCase().includes(s));
        
        const matchConc = crmFilterConcessionaria.length === 0 || crmFilterConcessionaria.includes(item.concessionaria || 'Outra');
        const matchArea = crmFilterArea.length === 0 || crmFilterArea.includes(item.area_de_gestao || 'Outros');
        const matchEtapa = crmFilterEtapa.length === 0 || crmFilterEtapa.includes(item.objetivo_etapa || 'Sem Etapa');
        const matchStatus = crmFilterStatus.length === 0 || crmFilterStatus.includes(item.status_rd || 'Sem Status');
        
        return matchSearch && matchConc && matchArea && matchEtapa && matchStatus;
    });

    const sumMwh = (arr: any[]) => arr.reduce((acc, curr) => acc + (Number(curr.consumo_medio_mwh) || 0), 0);
    
    const groupBy = (keyField: string, defaultVal: string) => {
        const group: any = {};
        filtered.forEach(d => {
            const k = d[keyField] || defaultVal;
            if (!group[k]) group[k] = { count: 0, mwh: 0 };
            group[k].count++;
            group[k].mwh += (Number(d.consumo_medio_mwh) || 0);
        });
        return group;
    };

    const stats = {
        totalUCs: filtered.length,
        totalMwh: sumMwh(filtered),
        byArea: groupBy('area_de_gestao', 'Outros'),
        byEtapa: groupBy('objetivo_etapa', 'Sem Etapa'),
        byStatus: groupBy('status_rd', 'Sem Status')
    };

    return { filtered, stats, options: { concessionarias: concessionariasRaw, areas: areasRaw, etapas: etapasSorted, status: statusRaw } };
  }, [crmData, crmSearch, crmFilterConcessionaria, crmFilterArea, crmFilterEtapa, crmFilterStatus]);


  // Helpers
  const parseBrDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
        if (dateStr.includes('/')) {
             const parts = dateStr.split('/');
             if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
        }
        return null;
    } catch { return null; }
  };

  const parseRefMonth = (mesRefStr: string) => {
    if (!mesRefStr || mesRefStr === 'Todos') return new Date();
    const parts = mesRefStr.split('/');
    if (parts.length === 2) return new Date(parseInt(parts[1], 10), parseInt(parts[0], 10) - 1, 1);
    return new Date();
  };

  const formatMoney = (val: number | null) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatTarifa = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 5, maximumFractionDigits: 5 }).format(val) + '/kWh';
  };
    
  const formatEnergySmart = (val: number, inputUnit: 'MWh' | 'kWh' = 'MWh') => {
    let valInMwh = inputUnit === 'kWh' ? val / 1000 : val;
    if (valInMwh >= 1) return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(valInMwh)} MWh`;
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(valInMwh * 1000)} kWh`;
  };

  const toDateBR = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch { return '-'; }
  };

  const getStatusColor = (prevista: string | null, real: string | null) => {
    if (real) return { color: 'text-emerald-400', bg: 'bg-emerald-900/30 border border-emerald-800', text: 'Concluído', value: 'Concluído' };
    if (!prevista) return { color: 'text-gray-500', bg: 'bg-transparent', text: '-', value: 'Pendente' };
    const hoje = new Date().toISOString().split('T')[0];
    if (hoje > prevista) return { color: 'text-red-300', bg: 'bg-red-900/40 border border-red-800', text: 'Atrasado', value: 'Atrasado' };
    return { color: 'text-blue-300', bg: 'bg-blue-900/40 border border-blue-800', text: 'No Prazo', value: 'No Prazo' };
  };
    
  // Listas de Filtros
  const uniqueConcessionarias = useMemo(() => ['Todas', ...new Set(data.map(d => d.concessionaria_norm).filter(Boolean).sort())], [data]);
  const uniqueAreas = useMemo(() => ['Todas', ...new Set(data.map(d => d.area_norm).filter(Boolean).sort())], [data]);
  const uniqueMesesRef = useMemo(() => {
    const meses = [...new Set(data.map(d => d.mes_norm).filter(Boolean))];
    return ['Todos', ...meses.sort((a, b) => {
      if (a === 'N/D') return 1;
      if (b === 'N/D') return -1;
      const [mesA, anoA] = a.split('/').map(Number);
      const [mesB, anoB] = b.split('/').map(Number);
      if (anoA !== anoB) return anoA - anoB;
      return mesA - mesB;
    })];
  }, [data]);

  const uniqueUCsProfile = useMemo(() => {
    const map = new Map();
    data.forEach(item => map.set(item.uc, item)); 
    return Array.from(map.values());
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchConc = selectedConcessionaria === 'Todas' || item.concessionaria_norm === selectedConcessionaria;
      const matchArea = selectedArea === 'Todas' || item.area_norm === selectedArea;
      const matchMes = selectedMesRef === 'Todos' || item.mes_norm === selectedMesRef;
      return matchConc && matchArea && matchMes;
    });
  }, [data, selectedConcessionaria, selectedArea, selectedMesRef]);

  // --- MACRO METRICS ---
  const macroMetrics = useMemo(() => {
    const activeData = filteredData;
    const hasStatus = (s: string) => s && s !== 'Indefinido' && s !== 'null' && s.trim() !== '';

    const itensRealizados = activeData.filter(d => hasStatus(d.status_norm));
    const realizadoValor = itensRealizados.reduce((acc, curr) => acc + curr.total_fatura, 0); 
    const realizadoEnergiaKwh = itensRealizados.reduce((acc, curr) => acc + curr.compensado_kwh, 0);
    const realizadoEnergiaMWh = realizadoEnergiaKwh / 1000;
    const tarifaMediaRealizada = realizadoEnergiaKwh > 0 ? realizadoValor / realizadoEnergiaKwh : 0;

    const itensPendentes = activeData.filter(d => !hasStatus(d.status_norm) && d.total_fatura !== 0 && d.compensado_kwh !== 0);
    const pendenteValor = itensPendentes.reduce((acc, curr) => acc + curr.total_fatura, 0); 
    const pendenteEnergiaKwh = itensPendentes.reduce((acc, curr) => acc + curr.compensado_kwh, 0);
    const pendenteEnergiaMwh = pendenteEnergiaKwh / 1000;
    const tarifaPendente = pendenteEnergiaKwh > 0 ? pendenteValor / pendenteEnergiaKwh : 0;

    const estimadoValor = realizadoValor + pendenteValor;
    const estimadoEnergiaMwh = realizadoEnergiaMWh + pendenteEnergiaMwh;
    const qtdEstimado = itensRealizados.length + itensPendentes.length;
    const tarifaMediaEstimada = estimadoEnergiaMwh > 0 ? estimadoValor / (estimadoEnergiaMwh * 1000) : 0;

    return { 
        estimado: estimadoValor, 
        qtdEstimado: qtdEstimado, 
        energiaEstimada: estimadoEnergiaMwh, 
        tarifaEstimada: tarifaMediaEstimada,
        realizado: realizadoValor, 
        qtdRealizado: itensRealizados.length, 
        energiaRealizada: realizadoEnergiaMWh, 
        tarifaRealizada: tarifaMediaRealizada, 
        pendente: pendenteValor, 
        qtdPendente: itensPendentes.length, 
        energiaPendente: pendenteEnergiaMwh, 
        tarifaPendente: tarifaPendente
    };
  }, [filteredData]);

  // --- CHART DATA ---
  const chartData = useMemo(() => {
    const endDate = selectedMesRef === 'Todos' ? new Date() : endOfMonth(parseRefMonth(selectedMesRef));
    const startDate = subMonths(endDate, 11);
    const monthsKeys: string[] = [];
    let curr = new Date(startDate);
    while (curr <= endDate) {
      monthsKeys.push(`${(curr.getMonth()+1).toString().padStart(2,'0')}/${curr.getFullYear()}`);
      curr = new Date(curr.setMonth(curr.getMonth()+1));
    }

    let previousTotalMwh = 0;

    return monthsKeys.map((mesKey, index) => {
       const [mes, ano] = mesKey.split('/').map(Number);
       const dateRef = new Date(ano, mes - 1, 28);
       let mwhEntrada = 0, mwhSaida = 0, mwhCarteira = 0;

       uniqueUCsProfile.forEach(uc => {
          if (selectedConcessionaria !== 'Todas' && uc.concessionaria_norm !== selectedConcessionaria) return;
          if (selectedArea !== 'Todas' && uc.area_norm !== selectedArea) return;
          
          const dtProto = parseBrDate(uc.data_entrada_norm);
          const dtCancel = parseBrDate(uc.data_saida_norm);
          const consumo = uc.consumo_mwh || 0;

          if (dtProto && dtProto.getMonth() === (mes-1) && dtProto.getFullYear() === ano) mwhEntrada += consumo;
          if (dtCancel && dtCancel.getMonth() === (mes-1) && dtCancel.getFullYear() === ano) mwhSaida += consumo;
          
          const isActive = (!dtProto || isBefore(dtProto, dateRef)) && (!dtCancel || isAfter(dtCancel, dateRef));
          if (isActive) mwhCarteira += consumo;
       });

       const currentTotalMwh = Math.round(mwhCarteira);
       let growthPct = 0;
       if (index > 0 && previousTotalMwh > 0) {
          const netChange = mwhEntrada - mwhSaida;
          growthPct = (netChange / previousTotalMwh) * 100;
       }
       previousTotalMwh = currentTotalMwh;

       return { name: mesKey, mwhAdded: Number(mwhEntrada.toFixed(1)), mwhLost: Number(mwhSaida.toFixed(1)), mwhAccumulated: currentTotalMwh, growthPct: Number(growthPct.toFixed(1)) };
    });
  }, [uniqueUCsProfile, selectedConcessionaria, selectedArea, selectedMesRef]);

  // --- DADOS CARTEIRA ---
  const portfolioData = useMemo(() => {
    const allConcessionarias = Array.from(new Set(data.map(d => d.concessionaria_norm).filter(c => c !== 'Outra'))).sort();
    const matrix: any = {};
    const concessionariaTotals: any = {};
    const areaTotals: any = {}; 

    allConcessionarias.forEach(conc => concessionariaTotals[conc] = { ucs: 0, mwh: 0 });
    const globalTotal = { ucs: 0, mwh: 0 };

    uniqueUCsProfile.forEach(item => {
        const area = item.area_norm || 'Outros';
        const etapa = item.objetivo_etapa_norm || 'Sem Etapa';
        const conc = item.concessionaria_norm;
        const mwh = item.consumo_mwh || 0;

        if (!matrix[area]) matrix[area] = {};
        if (!matrix[area][etapa]) {
            matrix[area][etapa] = { rows: {}, totalRow: { ucs: 0, mwh: 0 } };
            allConcessionarias.forEach(c => matrix[area][etapa].rows[c] = { ucs: 0, mwh: 0 });
        }

        if (!areaTotals[area]) {
            areaTotals[area] = { rows: {}, totalRow: { ucs: 0, mwh: 0 } };
            allConcessionarias.forEach(c => areaTotals[area].rows[c] = { ucs: 0, mwh: 0 });
        }

        if (allConcessionarias.includes(conc)) {
            matrix[area][etapa].rows[conc].ucs += 1;
            matrix[area][etapa].rows[conc].mwh += mwh;
            matrix[area][etapa].totalRow.ucs += 1;
            matrix[area][etapa].totalRow.mwh += mwh;

            concessionariaTotals[conc].ucs += 1;
            concessionariaTotals[conc].mwh += mwh;
            globalTotal.ucs += 1;
            globalTotal.mwh += mwh;

            areaTotals[area].rows[conc].ucs += 1;
            areaTotals[area].rows[conc].mwh += mwh;
            areaTotals[area].totalRow.ucs += 1;
            areaTotals[area].totalRow.mwh += mwh;
        }
    });

    return { matrix, allConcessionarias, concessionariaTotals, globalTotal, areaTotals };
  }, [uniqueUCsProfile]);

  // --- DADOS OPERACIONAIS ---
  const operationalData = useMemo(() => {
    if (selectedMesRef === 'Todos') return [];
    
    let filtered = filteredData.filter(item => {
        const termo = searchText.toLowerCase();
        const matchBusca = !termo || item.nome.toLowerCase().includes(termo) || item.uc.includes(termo);
        
        let matchStatus = true;
        if (opFilterStatus !== 'Todos') {
            const statusInfo = getStatusColor(item.data_prevista_norm, item.data_emissao_norm);
            matchStatus = statusInfo.value === opFilterStatus;
        }

        const matchEtapa = opFilterEtapa === 'Todas' || item.objetivo_etapa_norm === opFilterEtapa;

        return matchBusca && matchStatus && matchEtapa;
    });

    if (sortConfig !== null) {
        filtered.sort((a, b) => {
            const valA = a[sortConfig.key] ?? -Infinity;
            const valB = b[sortConfig.key] ?? -Infinity;
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return filtered;
  }, [filteredData, searchText, opFilterStatus, opFilterEtapa, sortConfig, selectedMesRef]);

  const uniqueEtapasOperational = useMemo(() => {
      return ['Todas', ...new Set(filteredData.map(d => d.objetivo_etapa_norm).filter(Boolean))].sort();
  }, [filteredData]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const financialGroups = useMemo(() => {
    const normalize = (st: string) => (st || '').toUpperCase();
    const sum = (arr: any[]) => arr.reduce((acc, curr) => acc + curr.total_fatura, 0);
    const sumEnergy = (arr: any[]) => arr.reduce((acc, curr) => acc + curr.compensado_kwh, 0);

    const recebidoList = filteredData.filter(d => ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH', 'PAID', 'LIQUIDATED'].includes(normalize(d.status_norm)));
    const openList = filteredData.filter(d => ['SENT', 'OPEN', 'AWAITING_PAYMENT', 'PENDING', 'OVERDUE', 'LATE'].includes(normalize(d.status_norm)));
    const enviadoList: any[] = [];
    const atrasadoList: any[] = [];
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    openList.forEach(item => {
        const isExplicitLate = ['OVERDUE', 'LATE'].includes(normalize(item.status_norm));
        let isDateLate = false;
        if (item.vencimento_norm) {
            const dtVenc = parseBrDate(item.vencimento_norm);
            if (dtVenc && dtVenc < hoje) isDateLate = true;
        }
        if (isExplicitLate || isDateLate) atrasadoList.push(item);
        else enviadoList.push(item);
    });

    const naoEnviadoList = filteredData.filter(d => d.status_norm === 'Indefinido' || ['GENERATED_BILL', 'DRAFT', 'NULL', ''].includes(normalize(d.status_norm)));

    return {
      recebido: { list: recebidoList, val: sum(recebidoList), energy: sumEnergy(recebidoList) / 1000 },
      atrasado: { list: atrasadoList, val: sum(atrasadoList), energy: sumEnergy(atrasadoList) / 1000 },
      enviado: { list: enviadoList, val: sum(enviadoList), energy: sumEnergy(enviadoList) / 1000 },
      naoEnviado: { list: naoEnviadoList, val: sum(naoEnviadoList), energy: sumEnergy(naoEnviadoList) / 1000 },
    };
  }, [filteredData]);

  const downloadCSV = (rows: any[], filename: string) => {
    if (!rows.length) return;
    const usefulRows = rows.map(r => ({ UC: r.uc, Nome: r.nome, Concessionaria: r.concessionaria_norm, Mes: r.mes_norm, Valor: r.total_fatura }));
    const headers = Object.keys(usefulRows[0]).join(';');
    const csvContent = usefulRows.map(row => Object.values(row).map(v => `"${v}"`).join(';')).join('\n');
    const blob = new Blob([`\uFEFF${headers}\n${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white"><Loader2 className="animate-spin h-12 w-12 text-blue-500 mr-2" /> Carregando Dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6 pb-20">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-8 border-b border-slate-800 pb-6 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-3 rounded-xl shadow-lg shadow-blue-900/20"><LayoutDashboard className="text-white" size={28} /></div>
          <div>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Simplifica Energia</h1>
                {/* BOTÃO DE ATUALIZAR DADOS */}
                <button 
                    onClick={refreshSnapshot} 
                    disabled={refreshing}
                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50"
                    title="Atualizar Dados do Banco"
                >
                    <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                </button>
            </div>
            <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">Inteligência Comercial e Financeira</p>
          </div>
        </div>
        <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
          <button onClick={() => setCurrentTab('faturamento')} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${currentTab === 'faturamento' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><LayoutDashboard size={18}/> Faturamento</button>
          <button onClick={() => setCurrentTab('recebimento')} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${currentTab === 'recebimento' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Wallet size={18}/> Recebimento</button>
          <button onClick={() => setCurrentTab('operacional')} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${currentTab === 'operacional' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Calendar size={18}/> Operacional</button>
          <button onClick={() => setCurrentTab('carteira')} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${currentTab === 'carteira' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Briefcase size={18}/> Carteira</button>
          <button onClick={() => setCurrentTab('crm')} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${currentTab === 'crm' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Users size={18}/> CRM</button>
          <button onClick={() => setCurrentTab('localizacao')} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${currentTab === 'localizacao' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><MapPin size={18}/> Localização</button>
        </div>
      </header>

      {/* FILTROS GLOBAIS */}
      {currentTab !== 'carteira' && currentTab !== 'crm' && currentTab !== 'localizacao' && (
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-500 font-bold flex items-center gap-1 uppercase tracking-wider"><Filter size={12}/> Concessionária</label>
          <div className="relative"><select value={selectedConcessionaria} onChange={e => setSelectedConcessionaria(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm outline-none text-white focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer hover:border-slate-600 transition-colors">{uniqueConcessionarias.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-500 font-bold flex items-center gap-1 uppercase tracking-wider"><Filter size={12}/> Área de Gestão</label>
          <div className="relative"><select value={selectedArea} onChange={e => setSelectedArea(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm outline-none text-white focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer hover:border-slate-600 transition-colors">{uniqueAreas.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-500 font-bold flex items-center gap-1 uppercase tracking-wider"><Filter size={12}/> Mês Referência</label>
          <div className="relative"><select value={selectedMesRef} onChange={e => setSelectedMesRef(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm outline-none text-white focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer hover:border-slate-600 transition-colors">{uniqueMesesRef.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        </div>
      </section>
      )}

      {/* ABA FATURAMENTO */}
      {currentTab === 'faturamento' && (
        <div className="animate-in fade-in zoom-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="absolute -right-6 -top-6 p-4 opacity-5 bg-white rounded-full"><DollarSign size={120} /></div>
              <h3 className="text-slate-400 font-bold mb-2 text-xs uppercase tracking-wider">Faturamento Potencial</h3>
              <div className="flex flex-col gap-1 relative z-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{formatMoney(macroMetrics.estimado)}</h2>
                <div className="flex flex-wrap gap-2 text-xs mt-3">
                  <span className="text-blue-300 bg-blue-950 border border-blue-900 px-2.5 py-1 rounded-md font-medium">{macroMetrics.qtdEstimado} UCs</span>
                  <span className="text-emerald-300 bg-emerald-950 border border-emerald-900 px-2.5 py-1 rounded-md font-medium flex items-center gap-1"><Zap size={12}/> {formatEnergySmart(macroMetrics.energiaEstimada, 'MWh')}</span>
                  <span className="text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">{formatTarifa(macroMetrics.tarifaEstimada)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="absolute -right-6 -top-6 p-4 opacity-5 bg-blue-500 rounded-full"><FileText size={120} /></div>
              <h3 className="text-slate-400 font-bold mb-2 text-xs uppercase tracking-wider">Faturamento Realizado</h3>
              <div className="flex flex-col gap-1 relative z-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-blue-500 tracking-tight">{formatMoney(macroMetrics.realizado)}</h2>
                <div className="flex flex-wrap gap-2 text-xs mt-3">
                  <span className="text-blue-300 bg-blue-950 border border-blue-900 px-2.5 py-1 rounded-md font-medium">{macroMetrics.qtdRealizado} UCs</span>
                  <span className="text-yellow-300 bg-yellow-950 border border-yellow-900 px-2.5 py-1 rounded-md font-medium flex items-center gap-1"><Zap size={12}/> {formatEnergySmart(macroMetrics.energiaRealizada, 'MWh')}</span>
                  <span className="text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">{formatTarifa(macroMetrics.tarifaRealizada)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden border-l-4 border-l-amber-500 group hover:bg-slate-800/50 transition-all">
              <div className="absolute -right-6 -top-6 p-4 opacity-5 bg-amber-500 rounded-full"><Clock size={120} /></div>
              <h3 className="text-slate-400 font-bold mb-2 text-xs uppercase tracking-wider">Pendente</h3>
              <div className="flex flex-col gap-1 relative z-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-amber-500 tracking-tight">{formatMoney(macroMetrics.pendente)}</h2>
                <div className="flex gap-2 text-xs mt-3">
                    <span className="text-amber-200 bg-amber-950 border border-amber-900 px-2.5 py-1 rounded-md inline-block font-medium">{macroMetrics.qtdPendente} UCs</span>
                    <span className="text-amber-200 bg-amber-950 border border-amber-900 px-2.5 py-1 rounded-md flex items-center gap-1"><Zap size={12}/> {formatEnergySmart(macroMetrics.energiaPendente, 'MWh')}</span>
                    <span className="text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">{formatTarifa(macroMetrics.tarifaPendente)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><TrendingUp size={20} className="text-blue-500"/> Crescimento de Carga (MWh)</h3>
                <div className="flex gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-400"><div className="w-3 h-3 bg-emerald-500/20 border border-emerald-500 rounded-full"></div> Carteira Total</span>
                  <span className="flex items-center gap-1.5 text-emerald-400"><div className="w-3 h-3 bg-emerald-400 rounded-sm"></div> Nova Carga</span>
                  <span className="flex items-center gap-1.5 text-rose-400"><div className="w-3 h-3 bg-rose-400 rounded-sm"></div> Perda Carga</span>
                </div>
              </div>
              <div className="h-[400px] w-full flex-1 min-h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={0}>
                    <defs>
                      <linearGradient id="gradMwh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis yAxisId="left" stroke="#64748b" tick={{fontSize: 11}} tickFormatter={(val) => `${val} MWh`} axisLine={false} tickLine={false} dx={-10} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{fontSize: 11}} allowDecimals={false} axisLine={false} tickLine={false} dx={10} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                      itemStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                      labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
                    />
                    <Area type="monotone" dataKey="mwhAccumulated" yAxisId="left" stroke="#10b981" fill="url(#gradMwh)" strokeWidth={2} name="Carteira Total" />
                    <Bar dataKey="mwhAdded" yAxisId="right" fill="#34d399" radius={[4, 4, 0, 0]} name="Nova Carga" barSize={20} />
                    <Bar dataKey="mwhLost" yAxisId="right" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Perda Carga" barSize={20} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA RECEBIMENTO */}
      {currentTab === 'recebimento' && (
        <div className="animate-in fade-in zoom-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Recebido', data: financialGroups.recebido, color: 'text-emerald-400', icon: CheckCircle2, iconColor: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                { label: 'Atrasado', data: financialGroups.atrasado, color: 'text-rose-400', icon: AlertCircle, iconColor: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                { label: 'Enviado', data: financialGroups.enviado, color: 'text-blue-400', icon: Send, iconColor: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                { label: 'Não Enviado', data: financialGroups.naoEnviado, color: 'text-slate-400', icon: Clock, iconColor: 'text-slate-500', bg: 'bg-slate-800', border: 'border-slate-700' }
              ].map((item, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border flex justify-between items-center group hover:scale-[1.02] transition-all shadow-sm ${item.bg} ${item.border}`}>
                  <div>
                    <p className="text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">{item.label}</p>
                    <p className={`text-xl font-bold ${item.color}`}>{formatMoney(item.data.val)}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Zap size={10}/> {formatEnergySmart(item.data.energy, 'MWh')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <item.icon className={`${item.iconColor} opacity-80`} size={28} />
                    <button onClick={() => downloadCSV(item.data.list, `relatorio_${item.label.toLowerCase()}`)} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1 text-slate-300 hover:text-white bg-slate-900/80 px-2.5 py-1 rounded-md font-medium"><Download size={12}/> CSV</button>
                  </div>
                </div>
              ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[600px]">
            <FinancialTable title="Recebido" data={financialGroups.recebido.list} colorClass="text-emerald-400 border-emerald-900 bg-emerald-900/20" totalValue={formatMoney(financialGroups.recebido.val)} totalCompensated={formatEnergySmart(financialGroups.recebido.energy, 'MWh')} showHeader={false} />
            <FinancialTable title="Atrasado" data={financialGroups.atrasado.list} colorClass="text-rose-400 border-rose-900 bg-rose-900/20" totalValue={formatMoney(financialGroups.atrasado.val)} totalCompensated={formatEnergySmart(financialGroups.atrasado.energy, 'MWh')} showHeader={false} />
            <FinancialTable title="Enviado" data={financialGroups.enviado.list} colorClass="text-blue-400 border-blue-900 bg-blue-900/20" totalValue={formatMoney(financialGroups.enviado.val)} totalCompensated={formatEnergySmart(financialGroups.enviado.energy, 'MWh')} showHeader={false} />
            <FinancialTable title="Não Enviado" data={financialGroups.naoEnviado.list} colorClass="text-slate-400 border-slate-700 bg-slate-800/50" totalValue={formatMoney(financialGroups.naoEnviado.val)} totalCompensated={formatEnergySmart(financialGroups.naoEnviado.energy, 'MWh')} showHeader={false} />
          </div>
        </div>
      )}

      {/* ABA OPERACIONAL */}
      {currentTab === 'operacional' && (
        <div className="animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
             <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50">
               <div>
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><Calendar className="text-blue-500" size={24}/> Previsão vs Realizado</h2>
                 <p className="text-sm text-slate-400">Acompanhamento de emissão de faturas</p>
               </div>
               <div className="relative flex items-center gap-4">
                 <div className="relative group">
                    <Search className="absolute left-2.5 top-2.5 text-slate-500 group-focus-within:text-blue-400" size={16}/>
                    <input 
                       type="text" 
                       value={searchText}
                       onChange={e => setSearchText(e.target.value)}
                       placeholder="Buscar UC ou Nome" 
                       className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm outline-none text-white focus:ring-2 focus:ring-blue-500/50 transition-all w-60"
                    />
                 </div>
                 
                 <div className="relative">
                    <select 
                      value={opFilterEtapa} 
                      onChange={e => setOpFilterEtapa(e.target.value)} 
                      className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm outline-none text-white focus:ring-2 focus:ring-blue-500/50 cursor-pointer w-40"
                    >
                        {uniqueEtapasOperational.map(etapa => (
                            <option key={etapa} value={etapa}>{etapa === 'Todas' ? 'Etapa: Todas' : etapa}</option>
                        ))}
                    </select>
                 </div>

                 <div className="relative">
                    <select 
                      value={opFilterStatus} 
                      onChange={e => setOpFilterStatus(e.target.value)} 
                      className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm outline-none text-white focus:ring-2 focus:ring-blue-500/50 cursor-pointer w-40"
                    >
                        <option value="Todos">Status: Todos</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Atrasado">Atrasado</option>
                        <option value="No Prazo">No Prazo</option>
                    </select>
                 </div>
               </div>
             </div>
             
             {selectedMesRef === 'Todos' ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-500">
                    <MousePointerClick size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium">Selecione um Mês de Referência</p>
                    <p className="text-sm opacity-70">Para carregar a análise operacional detalhada, escolha um mês no filtro acima.</p>
                </div>
             ) : (
                 <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                        <thead className="bg-slate-950 text-xs uppercase text-slate-400 font-semibold tracking-wider">
                            <tr>
                            <th className="px-6 py-4">UC / Cliente</th>
                            <th className="px-6 py-4">Distribuidora</th>
                            <th className="px-6 py-4">Etapa</th>
                            <th className="px-6 py-4">Data Prevista</th>
                            <th className="px-6 py-4">Data Emissão (Real)</th>
                            <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('valor_potencial')}>
                                <div className="flex items-center justify-end gap-1">Valor Estimado <ArrowUpDown size={14}/></div>
                            </th>
                            <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('valor_realizado')}>
                                <div className="flex items-center justify-end gap-1">Valor Realizado <ArrowUpDown size={14}/></div>
                            </th>
                            <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {operationalData.map((row: any) => {
                            const status = getStatusColor(row.data_prevista_norm, row.data_emissao_norm);
                            return (
                                <tr key={`${row.uc}-${row.mes_norm}`} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-mono text-slate-200">{row.uc}</div>
                                    <div className="text-xs text-slate-500 truncate max-w-[200px]" title={row.nome}>{row.nome}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-400">{row.concessionaria_norm}</td>
                                <td className="px-6 py-4 text-slate-400 text-xs">
                                    <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                                        {row.objetivo_etapa_norm}
                                    </span>
                                </td>

                                <td className="px-6 py-4 font-medium text-slate-300">{toDateBR(row.data_prevista_norm)}</td>
                                <td className="px-6 py-4 text-slate-400">{toDateBR(row.data_emissao_norm)}</td>
                                <td className="px-6 py-4 text-right font-medium text-blue-400">{formatMoney(row.valor_potencial)}</td>
                                <td className="px-6 py-4 text-right font-bold text-emerald-400">
                                    {row.valor_realizado > 0 ? formatMoney(row.valor_realizado) : <span className="text-slate-600">-</span>}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${status.bg} ${status.color}`}>{status.text}</span>
                                </td>
                                </tr>
                            );
                            })}
                            {operationalData.length === 0 && (
                            <tr><td colSpan={8} className="text-center py-12 text-slate-500">Nenhum dado encontrado para os filtros selecionados.</td></tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                    <div className="bg-slate-900 p-4 border-t border-slate-800 text-xs text-slate-500 text-center">Exibindo {operationalData.length} registros</div>
                 </>
             )}
          </div>
        </div>
      )}

      {/* ABA CARTEIRA (ATUALIZADA COM VISUAL MELHOR E SUBTOTAL) */}
      {currentTab === 'carteira' && (
        <div className="animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Briefcase className="text-blue-500" size={24}/> Carteira de Clientes</h2>
                    <p className="text-sm text-slate-400">Visão consolidada por Canal e Concessionária (Base Total RD Station)</p>
                </div>
                
                <div className="overflow-x-auto p-6">
                    <table className="w-full text-xs text-left border-collapse border border-slate-700">
                        <thead>
                            <tr className="bg-blue-900 text-white">
                                <th rowSpan={2} className="p-3 border border-slate-700 text-center uppercase font-bold w-32">Canal</th>
                                <th rowSpan={2} className="p-3 border border-slate-700 text-center uppercase font-bold w-48">Etapa</th>
                                {portfolioData.allConcessionarias.map((conc: string) => (
                                    <th key={conc} colSpan={2} className="p-2 border border-slate-700 text-center font-bold">{conc}</th>
                                ))}
                                <th colSpan={2} className="p-2 border border-slate-700 text-center font-bold bg-slate-800">TOTAL</th>
                            </tr>
                            <tr className="bg-blue-950 text-slate-300">
                                {portfolioData.allConcessionarias.map((conc: string) => (
                                    <>
                                        <th key={`${conc}-ucs`} className="p-2 border border-slate-700 text-center w-16">UCs</th>
                                        <th key={`${conc}-mwh`} className="p-2 border border-slate-700 text-center w-16 text-yellow-300/80">MWh</th>
                                    </>
                                ))}
                                <th className="p-2 border border-slate-700 text-center w-16 bg-slate-800">UCs</th>
                                <th className="p-2 border border-slate-700 text-center w-16 bg-slate-800 text-yellow-300/80">MWh</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(portfolioData.matrix).sort().map((area, areaIdx) => {
                                const etapas = Object.keys(portfolioData.matrix[area]).sort();
                                
                                return (
                                    <>
                                        {/* LINHAS DE ETAPAS */}
                                        {etapas.map((etapa, etapaIdx) => {
                                            const rowData = portfolioData.matrix[area][etapa].rows;
                                            const totalRow = portfolioData.matrix[area][etapa].totalRow;
                                            const bgClass = areaIdx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/30';
                                            
                                            return (
                                                <tr key={`${area}-${etapa}`} className={`hover:bg-slate-700/30 transition-colors border-b border-slate-800 ${bgClass}`}>
                                                    {etapaIdx === 0 && (
                                                        <td rowSpan={etapas.length + 1} className="p-3 border border-slate-700 font-extrabold text-center align-middle text-white uppercase tracking-wider text-[10px]">
                                                            {area}
                                                        </td>
                                                    )}
                                                    <td className="p-3 border border-slate-700 text-slate-400 font-medium">{etapa}</td>
                                                    
                                                    {portfolioData.allConcessionarias.map((conc: string) => {
                                                        const cellData = rowData[conc] || { ucs: 0, mwh: 0 };
                                                        return (
                                                            <>
                                                                <td key={`${conc}-val-ucs`} className="p-2 border border-slate-700 text-center text-slate-300">
                                                                    {cellData.ucs > 0 ? cellData.ucs : '-'}
                                                                </td>
                                                                <td key={`${conc}-val-mwh`} className="p-2 border border-slate-700 text-center text-slate-400 text-[10px]">
                                                                    {cellData.mwh > 0 ? Math.round(cellData.mwh) : '-'}
                                                                </td>
                                                            </>
                                                        );
                                                    })}
                                                    
                                                    <td className="p-2 border border-slate-700 text-center font-bold text-white bg-slate-800">
                                                        {totalRow.ucs}
                                                    </td>
                                                    <td className="p-2 border border-slate-700 text-center font-bold text-yellow-400 bg-slate-800">
                                                        {Math.round(totalRow.mwh)}
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {/* NOVA LINHA DE SUBTOTAL POR ÁREA (CANAL) */}
                                        <tr key={`${area}-subtotal`} className="bg-blue-900/20 border-y-2 border-slate-600 font-bold">
                                            <td className="p-2 border border-slate-700 text-right uppercase text-[10px] tracking-wider text-blue-300">Total {area}</td>
                                            {portfolioData.allConcessionarias.map((conc: string) => {
                                                const subData = portfolioData.areaTotals[area]?.rows[conc] || { ucs: 0, mwh: 0 };
                                                return (
                                                    <>
                                                        <td key={`${conc}-sub-ucs`} className="p-2 border border-slate-700 text-center text-white">
                                                            {subData.ucs > 0 ? subData.ucs : '-'}
                                                        </td>
                                                        <td key={`${conc}-sub-mwh`} className="p-2 border border-slate-700 text-center text-yellow-300/80 text-[11px]">
                                                            {subData.mwh > 0 ? Math.round(subData.mwh) : '-'}
                                                        </td>
                                                    </>
                                                );
                                            })}
                                            <td className="p-2 border border-slate-700 text-center text-white text-lg bg-blue-900/40">
                                                {portfolioData.areaTotals[area]?.totalRow.ucs}
                                            </td>
                                            <td className="p-2 border border-slate-700 text-center text-yellow-400 text-lg bg-blue-900/40">
                                                {Math.round(portfolioData.areaTotals[area]?.totalRow.mwh)}
                                            </td>
                                        </tr>
                                    </>
                                );
                            })}
                            
                            {/* TOTAL GERAL FINAL */}
                            <tr className="bg-slate-800 font-black border-t-4 border-slate-500 shadow-xl">
                                <td colSpan={2} className="p-4 border border-slate-700 text-right uppercase tracking-widest text-lg text-white">TOTAL GERAL DA CARTEIRA</td>
                                {portfolioData.allConcessionarias.map((conc: string) => (
                                    <>
                                        <td key={`${conc}-tot-ucs`} className="p-2 border border-slate-700 text-center text-white text-sm">
                                            {portfolioData.concessionariaTotals[conc].ucs}
                                        </td>
                                        <td key={`${conc}-tot-mwh`} className="p-2 border border-slate-700 text-center text-yellow-400 text-sm">
                                            {Math.round(portfolioData.concessionariaTotals[conc].mwh)}
                                        </td>
                                    </>
                                ))}
                                <td className="p-2 border border-slate-700 text-center text-white text-xl bg-slate-700">
                                    {portfolioData.globalTotal.ucs}
                                </td>
                                <td className="p-2 border border-slate-700 text-center text-yellow-400 text-xl bg-slate-700">
                                    {Math.round(portfolioData.globalTotal.mwh)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* --- ABA CRM --- */}
      {currentTab === 'crm' && (
        <div className="animate-in fade-in zoom-in duration-300 flex flex-col gap-6">
            
            {/* 1. KPI CARDS */}
            {crmProcessed.stats && (
            <div className="grid grid-cols-1 gap-6">
                {/* CARD GLOBAL */}
                <div className="bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-800/50 rounded-2xl p-6 flex items-center gap-8 shadow-lg">
                    <div className="bg-blue-600 p-4 rounded-full shadow-lg shadow-blue-500/20"><Users size={32} className="text-white"/></div>
                    <div>
                        <p className="text-sm font-bold text-blue-300 uppercase tracking-wider">Total CRM</p>
                        <h2 className="text-4xl font-extrabold text-white mt-1">{crmProcessed.stats.totalUCs} <span className="text-lg font-medium text-slate-400">UCs</span></h2>
                    </div>
                    <div className="h-12 w-px bg-blue-800/50 mx-4"></div>
                    <div>
                        <p className="text-sm font-bold text-blue-300 uppercase tracking-wider">Energia Total</p>
                        <h2 className="text-4xl font-extrabold text-white mt-1 flex items-center gap-2">
                             {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(crmProcessed.stats.totalMwh)} 
                             <span className="text-lg font-medium text-slate-400">MWh</span>
                        </h2>
                    </div>
                </div>

                {/* CARDS POR AREA (SCROLLABLE) */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Briefcase size={14}/> Por Área de Gestão</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/50">
                        {Object.entries(crmProcessed.stats.byArea).map(([key, val]: any) => (
                            <CrmKpiCard key={key} title={key} count={val.count} mwh={val.mwh} color="blue" />
                        ))}
                    </div>
                </div>

                 {/* CARDS POR ETAPA (ORDENAÇÃO PERSONALIZADA) */}
                 <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><TrendingUp size={14}/> Por Etapa do Funil</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/50">
                        {/* Iteramos sobre options.etapas que já está ordenado, e buscamos os dados no stats */}
                        {crmProcessed.options.etapas.filter(k => k !== 'Todas').map((key: string) => {
                            const val = crmProcessed.stats.byEtapa[key];
                            if (!val) return null; 
                            return <CrmKpiCard key={key} title={key} count={val.count} mwh={val.mwh} color="amber" />;
                        })}
                    </div>
                </div>
            </div>
            )}

            {/* 2. TABELA FILTRÁVEL (MULTI-SELECT) */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden flex flex-col">
                
                {/* TOOLBAR */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col xl:flex-row gap-4 justify-between items-end xl:items-center">
                    <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center">
                        <div className="relative group w-full md:w-48">
                            <Search className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16}/>
                            <input 
                                type="text" 
                                placeholder="Buscar UC ou Nome..." 
                                value={crmSearch}
                                onChange={e => setCrmSearch(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                            />
                        </div>
                        
                        {/* COMPONENTES MULTI-SELECT CUSTOMIZADOS */}
                        <MultiSelect 
                            options={crmProcessed.options.concessionarias.filter(o => o !== 'Todas')} 
                            selected={crmFilterConcessionaria} 
                            onChange={setCrmFilterConcessionaria} 
                            placeholder="Concessionárias" 
                            icon={Filter} 
                        />
                         <MultiSelect 
                            options={crmProcessed.options.areas.filter(o => o !== 'Todas')} 
                            selected={crmFilterArea} 
                            onChange={setCrmFilterArea} 
                            placeholder="Áreas de Gestão" 
                        />
                         <MultiSelect 
                            options={crmProcessed.options.etapas.filter(o => o !== 'Todas')} 
                            selected={crmFilterEtapa} 
                            onChange={setCrmFilterEtapa} 
                            placeholder="Etapas" 
                        />
                         <MultiSelect 
                            options={crmProcessed.options.status.filter(o => o !== 'Todos')} 
                            selected={crmFilterStatus} 
                            onChange={setCrmFilterStatus} 
                            placeholder="Status" 
                        />
                    </div>

                    <div className="text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1 rounded border border-slate-700">
                        {crmProcessed.filtered.length} Registros
                    </div>
                </div>

                {/* TABELA */}
                <div className="overflow-auto max-h-[600px] relative">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-950 font-semibold tracking-wider sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4">UC / Nome</th>
                                <th className="px-6 py-4">Concessionária</th>
                                <th className="px-6 py-4">Área</th>
                                <th className="px-6 py-4">Objetivo / Etapa</th>
                                <th className="px-6 py-4">Status RD</th>
                                <th className="px-6 py-4 text-center">Datas (Ganho/Proto/Canc)</th>
                                <th className="px-6 py-4 text-right bg-slate-900 border-l border-slate-800">Consumo (MWh)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {crmProcessed.filtered.map((row: any, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-3">
                                        <div className="font-mono text-slate-200 group-hover:text-blue-400 transition-colors">{row.uc}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-[220px]" title={row.nome_negocio}>{row.nome_negocio || '-'}</div>
                                    </td>
                                    <td className="px-6 py-3 text-slate-400">{row.concessionaria || '-'}</td>
                                    <td className="px-6 py-3 text-slate-400 text-xs">
                                        <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{row.area_de_gestao || 'N/D'}</span>
                                    </td>
                                    <td className="px-6 py-3 text-slate-300 text-xs font-medium truncate max-w-[150px]" title={row.objetivo_etapa}>
                                        {row.objetivo_etapa || '-'}
                                    </td>
                                    <td className="px-6 py-3 text-slate-400 text-xs">{row.status_rd || '-'}</td>
                                    <td className="px-6 py-3 text-center text-[10px] text-slate-500 space-y-1">
                                        <div title="Data Ganho" className={row.data_ganho ? "text-emerald-500/70" : ""}>G: {toDateBR(row.data_ganho)}</div>
                                        <div title="Data Protocolo">P: {toDateBR(row.data_protocolo)}</div>
                                        {row.data_cancelamento && <div title="Cancelamento" className="text-rose-500">C: {toDateBR(row.data_cancelamento)}</div>}
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-slate-200 bg-slate-900/30 border-l border-slate-800">
                                        {row.consumo_medio_mwh > 0 ? Number(row.consumo_medio_mwh).toFixed(2) : '-'}
                                    </td>
                                </tr>
                            ))}
                            {crmProcessed.filtered.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-12 text-slate-500">Nenhum registro encontrado.</td></tr>
                            )}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-slate-900 border-t border-slate-700 font-bold text-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-10">
                            <tr>
                                <td colSpan={6} className="px-6 py-3 text-right uppercase text-xs tracking-wider text-slate-500">Total Filtrado</td>
                                <td className="px-6 py-3 text-right text-yellow-400 font-mono border-l border-slate-700 text-lg">
                                    {crmProcessed.stats ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(crmProcessed.stats.totalMwh) : 0}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* --- ABA LOCALIZAÇÃO (PLACEHOLDER) --- */}
      {currentTab === 'localizacao' && (
        <div className="animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg p-10 flex flex-col items-center justify-center h-[600px] text-center relative overflow-hidden">
               <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
               
               <div className="bg-slate-800/50 p-6 rounded-full mb-6 border border-slate-700 relative z-10">
                   <MapPin size={64} className="text-blue-500" />
               </div>
               
               <h2 className="text-3xl font-bold text-white relative z-10 mb-3">Mapa de Clientes</h2>
               <p className="text-slate-400 max-w-md relative z-10 text-lg">
                   Estamos preparando a visualização geográfica da sua carteira. 
                   <br/>
                   <span className="text-sm opacity-70 mt-2 block">Em breve você poderá analisar a distribuição dos clientes diretamente no mapa interativo.</span>
               </p>
               
               <div className="mt-8 relative z-10 flex gap-2">
                   <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
                   <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                   <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
               </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default App;