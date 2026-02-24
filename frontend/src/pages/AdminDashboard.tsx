import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  Area, ComposedChart, Bar, Cell, LabelList, BarChart
} from 'recharts';
import { 
  Loader2, Filter, AlertCircle, CheckCircle2, DollarSign, FileText, Send, Clock, Zap, Download, Wallet, Calendar as CalendarIcon, Search, MousePointerClick, TrendingUp, ArrowUpDown, Briefcase, Users, ChevronDown, Check, MapPin, RefreshCw, ChevronLeft, ChevronRight, X, Activity, PieChart, Target, FileCheck, PiggyBank, Receipt, ArrowRight, ArrowDown, ShieldAlert, ClipboardList, ExternalLink, Settings2
} from 'lucide-react';
import { 
  subMonths, isAfter, isBefore, startOfMonth, endOfMonth, format, 
  addMonths, eachDayOfInterval, isSameDay, isWithinInterval, startOfDay, differenceInDays 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const ClientMap = ({ clients }: { clients: any[] }) => {
    const locations = useMemo(() => {
        const points: any[] = [];
        clients.forEach(c => {
            if (c.latitude && c.longitude) {
                const lat = Number(c.latitude) + (Math.random() - 0.5) * 0.0002;
                const lng = Number(c.longitude) + (Math.random() - 0.5) * 0.0002;
                const idNegocioEncontrado = c.id_negocio || c.ID_NEGOCIO || c.deal_id || c.id_rd || null;
                points.push({ id: c.uc || Math.random(), lat: lat, lng: lng, name: c.nome_negocio || 'Sem Nome', city: c.cidade || 'Desconhecido', uf: c.uf || '', mwh: Number(c.consumo_medio_mwh) || 0, dealId: idNegocioEncontrado });
            }
        });
        return points;
    }, [clients]);

    if (locations.length === 0) return (<div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 text-center p-6 relative z-10"><div className="bg-slate-800 p-6 rounded-full mb-6 border border-slate-700 shadow-xl"><MapPin size={48} className="text-slate-500" /></div><h3 className="text-2xl font-display font-bold text-white mb-2">Sem dados geográficos</h3><p className="text-slate-400 mb-4 max-w-md">Nenhum cliente na lista atual possui coordenadas cadastradas no banco de dados.</p></div>);

    return (
        <div className="h-full w-full bg-slate-900 rounded-xl overflow-hidden relative z-0">
            <MapContainer center={[-15.79, -47.88]} zoom={4} style={{ height: '100%', width: '100%' }} preferCanvas={true}><TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                {locations.map((loc) => (
                    <Marker key={loc.id} position={[loc.lat, loc.lng]}><Popup className="custom-popup"><div className="p-1 min-w-[150px]"><h4 className="font-bold font-display text-slate-800 text-sm mb-1 border-b pb-1">{loc.city}-{loc.uf}</h4><div className="text-xs text-slate-600 mt-1">{loc.dealId ? (<a href={`https://crm.rdstation.com/app/deals/${loc.dealId}`} target="_blank" rel="noopener noreferrer" className="truncate font-bold text-blue-600 hover:text-blue-800 hover:underline block mb-1" title="Abrir Negócio no RD Station">{loc.name}</a>) : (<p className="truncate font-medium text-slate-800 mb-1">{loc.name}</p>)}<p className="mt-1">Consumo: <span className="font-bold text-emerald-600">{new Intl.NumberFormat('pt-BR').format(Math.round(loc.mwh * 1000))} kWh</span></p></div></div></Popup></Marker>
                ))}
            </MapContainer>
            <div className="absolute top-4 right-4 z-[400]"><div className="bg-slate-900/90 backdrop-blur text-xs text-white px-4 py-2 rounded-lg border border-slate-600 shadow-md font-medium">{locations.length} Locais Encontrados</div></div>
        </div>
    );
};

const DateRangePicker = ({ onChange, selectedRange }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: any) => { if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDayClick = (day: Date) => {
        if (!selectedRange.from || (selectedRange.from && selectedRange.to)) onChange({ from: day, to: undefined });
        else {
            if (isBefore(day, selectedRange.from)) { onChange({ from: day, to: selectedRange.from }); setIsOpen(false); }
            else { onChange({ ...selectedRange, to: day }); setIsOpen(false); }
        }
    };

    const daysInMonth = eachDayOfInterval({ start: startOfMonth(viewDate), end: endOfMonth(viewDate) });
    const emptyDays = Array(startOfMonth(viewDate).getDay()).fill(null);
    const displayValue = selectedRange.from ? `${format(selectedRange.from, 'dd/MM')}${selectedRange.to ? ` - ${format(selectedRange.to, 'dd/MM')}` : ''}` : 'Período Previsto';

    return (
        <div className="relative" ref={containerRef}>
            <button onClick={() => setIsOpen(!isOpen)} className={`min-w-[180px] w-full bg-slate-800 border ${isOpen || selectedRange.from ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-slate-700'} rounded-lg px-3 py-2.5 text-sm text-white outline-none flex items-center justify-between transition-all hover:bg-slate-700`}>
                <div className="flex items-center gap-2"><CalendarIcon size={14} className={selectedRange.from ? "text-blue-400" : "text-slate-400"} /><span className={selectedRange.from ? "text-white font-medium" : "text-slate-400"}>{displayValue}</span></div>
                {selectedRange.from ? <div onClick={(e) => { e.stopPropagation(); onChange({ from: undefined, to: undefined }); }} className="hover:bg-slate-600 rounded-full p-0.5"><X size={12} className="text-slate-400" /></div> : <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 p-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 w-[300px]">
                    <div className="flex justify-between items-center mb-4"><button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronLeft size={16}/></button><span className="text-sm font-bold font-display text-white capitalize">{format(viewDate, 'MMMM yyyy', { locale: ptBR })}</span><button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronRight size={16}/></button></div>
                    <div className="grid grid-cols-7 gap-1 mb-2 text-center">{['D','S','T','Q','Q','S','S'].map((d, i) => <span key={`dow-${i}`} className="text-xs font-bold text-slate-500">{d}</span>)}</div>
                    <div className="grid grid-cols-7 gap-1">
                        {emptyDays.map((_, i) => <div key={`empty-${i}`} />)}
                        {daysInMonth.map((day) => {
                            const isSelected = selectedRange.from && isSameDay(day, selectedRange.from) || (selectedRange.to && isSameDay(day, selectedRange.to));
                            const isInRange = selectedRange.from && selectedRange.to && isWithinInterval(day, { start: selectedRange.from, end: selectedRange.to });
                            return (
                                <button key={day.toISOString()} onClick={() => handleDayClick(day)} className={`h-8 w-8 text-xs rounded-full flex items-center justify-center transition-all relative z-10 ${isSelected ? 'bg-blue-600 text-white font-bold' : ''} ${isInRange && !isSelected ? 'bg-blue-900/40 text-blue-200 rounded-none' : ''} ${!isSelected && !isInRange ? 'text-slate-300 hover:bg-slate-800' : ''}`}>{format(day, 'd')}</button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const MultiSelect = ({ options, selected, onChange, placeholder, icon: Icon, fullWidth = false }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: any) => { if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (option: string) => {
        if (selected.includes(option)) onChange(selected.filter((item: string) => item !== option));
        else onChange([...selected, option]);
    };

    const displayValue = selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} selecionados`;

    return (
        <div className={`relative ${fullWidth ? 'w-full' : ''}`} ref={containerRef}>
            <button onClick={() => setIsOpen(!isOpen)} className={`bg-slate-800 border ${isOpen ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-slate-700'} rounded-lg px-3 py-2.5 text-sm text-white outline-none flex items-center justify-between transition-all hover:bg-slate-700 ${fullWidth ? 'w-full' : 'w-full md:w-48'}`}>
                <div className="flex items-center gap-2 truncate">{Icon && <Icon size={14} className="text-slate-400 shrink-0" />}<span className={`truncate ${selected.length === 0 ? 'text-slate-400' : 'text-slate-200'}`}>{displayValue}</span></div>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full min-w-[220px] max-h-64 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 p-1">
                     <div className="px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded cursor-pointer flex items-center gap-2 font-medium mb-1 border-b border-slate-800" onClick={() => onChange(selected.length > 0 ? [] : options)}>{selected.length > 0 ? 'Limpar Seleção' : 'Selecionar Todos'}</div>
                    {options.map((opt: string) => (
                        <div key={opt} onClick={() => toggleOption(opt)} className="flex items-center gap-2 px-2 py-2 hover:bg-slate-800 rounded cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${selected.includes(opt) ? 'bg-blue-600 border-blue-600' : 'border-slate-600 group-hover:border-slate-500'}`}>
                                {selected.includes(opt) && <Check size={10} className="text-white" />}
                            </div>
                            <span className={`text-sm break-words ${selected.includes(opt) ? 'text-white font-medium' : 'text-slate-400'}`}>{opt}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CrmKpiCard = ({ title, count, mwh, color = "blue" }: any) => {
    const colorClasses: any = { blue: "text-blue-400 border-blue-500/30 bg-blue-500/10", green: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", amber: "text-amber-400 border-amber-500/30 bg-amber-500/10", rose: "text-rose-400 border-rose-500/30 bg-rose-500/10", purple: "text-purple-400 border-purple-500/30 bg-purple-500/10", slate: "text-slate-400 border-slate-500/30 bg-slate-500/10", indigo: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10" };
    let dynamicColor = color; const t = title.toLowerCase();
    if (t.includes('operacional')) dynamicColor = 'green'; else if (t.includes('exclusão') || t.includes('excluído')) dynamicColor = 'rose'; else if (t.includes('protocolad')) dynamicColor = 'blue'; else if (t.includes('pré')) dynamicColor = 'purple'; else dynamicColor = 'slate';
    const activeClass = colorClasses[dynamicColor] || colorClasses.slate;
    return (
        <div className={`p-4 rounded-xl border ${activeClass} flex flex-col justify-between min-w-[160px] flex-1 shadow-sm`}>
            <p className="text-[10px] font-bold font-display uppercase tracking-wider opacity-80 mb-2 truncate" title={title}>{title}</p>
            <div>
                <p className="text-2xl font-bold font-display text-white">{count}</p>
                <p className="text-xs opacity-70 mt-1 flex items-center gap-1"><Zap size={10}/> {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(mwh)} MWh</p>
            </div>
        </div>
    );
};

const FinancialTable = ({ title, data, colorClass, totalValue, totalCompensated, showHeader = true }: any) => (
  <div className={`bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-full shadow-lg`}>
    {showHeader && (
      <div className={`p-4 border-b border-slate-700 ${colorClass} bg-opacity-10`}>
        <h3 className="font-bold font-display text-sm uppercase tracking-wide text-slate-200 mb-1">{title}</h3>
        <div className="flex justify-between items-end">
          <div><p className="text-xs text-slate-400">Total Valor</p><p className="text-xl font-display font-bold text-white">{totalValue}</p></div>
          <div className="text-right"><p className="text-xs text-slate-400">Total Compensado</p><p className="text-sm font-mono text-yellow-400 flex items-center gap-1 justify-end"><Zap size={14}/> {totalCompensated}</p></div>
        </div>
      </div>
    )}
    <div className="overflow-auto flex-1 h-[300px] relative"> 
      {!showHeader && <div className={`sticky top-0 p-2 text-xs font-bold font-display uppercase tracking-wider text-center ${colorClass.split(' ')[0]} bg-slate-950/80 backdrop-blur-sm z-10 border-b border-slate-800`}>{title}</div>}
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

const Pagination = ({ page, totalPages, setPage, totalItems }: { page: number, totalPages: number, setPage: (p: number) => void, totalItems: number }) => (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-slate-900 border-t border-slate-800 text-sm text-slate-400">
      <div>Exibindo página <span className="font-bold text-white">{totalPages > 0 ? page : 0}</span> de <span className="font-bold text-white">{totalPages}</span> ({totalItems} registros)</div>
      <div className="flex gap-2">
        <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-white"><ChevronLeft size={14}/> Anterior</button>
        <button onClick={() => setPage(page + 1)} disabled={page >= totalPages || totalPages === 0} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-white">Próxima <ChevronRight size={14}/></button>
      </div>
    </div>
);

const CustomTooltipEvolucao = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 p-3 border border-slate-700 rounded-lg shadow-xl text-xs min-w-[200px] z-50 relative">
                <p className="font-bold text-white mb-3 border-b border-slate-700 pb-2">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry: any, index: number) => {
                        let ucs = 0;
                        if (entry.dataKey === 'mwhAccumulated') ucs = entry.payload.ucsAccumulated;
                        if (entry.dataKey === 'mwhAdded') ucs = entry.payload.ucsAdded;
                        if (entry.dataKey === 'mwhLost') ucs = entry.payload.ucsLost;

                        return (
                            <div key={index} className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }}></div><span className="text-slate-300 font-medium">{entry.name}</span></div>
                                <div className="text-right"><div className="font-bold text-white">{entry.value} MWh</div><div className="text-[10px] text-slate-400">{ucs} UCs</div></div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
};

const CustomTooltipTicket = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl min-w-[200px]">
                <p className="text-slate-400 font-bold mb-2 border-b border-slate-700 pb-1.5 text-xs uppercase tracking-wider">{label} <span className="font-normal opacity-70">({data.macro})</span></p>
                <p className="text-white text-3xl font-bold font-display mb-1 drop-shadow-md">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.ticketMedio)}</p>
                <p className="text-emerald-400 text-xs font-medium flex items-center gap-1"><Zap size={12}/> {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(data.consumoMedio)} kWh / UC</p>
            </div>
        )
    }
    return null;
}

function AdminDashboard() {
  const { data: rawData, crmData, loading, refreshSnapshot, refreshing } = useAnalytics();
  
  const [currentTab, setCurrentTab] = useState<'geral' | 'financeiro' | 'emissao' | 'carteira' | 'crm' | 'auditoria' | 'localizacao'>('geral');
  
  const [selectedConcessionaria, setSelectedConcessionaria] = useState('Todas');
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [selectedEtapa, setSelectedEtapa] = useState('Todas');
  const [selectedMesRef, setSelectedMesRef] = useState(() => {
      const now = new Date();
      return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  });
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  const [searchText, setSearchText] = useState('');
  const [opFilterStatus, setOpFilterStatus] = useState('Todos'); 
  const [opFilterEtapa, setOpFilterEtapa] = useState('Todas'); 
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null); 
  const [emissaoPage, setEmissaoPage] = useState(1);
  const [emissaoColunas, setEmissaoColunas] = useState<string[]>([]);
  const emissaoColunasOptions = ['Consumo RD (kWh)', 'Tarifa RD (Estimada)', 'Tarifa Fatura (Real)', 'Consumo (Fatura)', 'Compensação (Fatura)', 'Eficiência (%)', 'Status Pagamento'];

  const [crmSearch, setCrmSearch] = useState('');
  const [crmFilterConcessionaria, setCrmFilterConcessionaria] = useState<string[]>([]);
  const [crmFilterArea, setCrmFilterArea] = useState<string[]>([]);
  const [crmFilterEtapa, setCrmFilterEtapa] = useState<string[]>([]);
  const [crmFilterStatus, setCrmFilterStatus] = useState<string[]>([]);
  const [crmPage, setCrmPage] = useState(1);

  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilterEtapa] = useState<string[]>([]);
  const [auditFilterInconsistencia, setAuditFilterInconsistencia] = useState<string[]>([]);
  const [auditPage, setAuditPage] = useState(1);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => { setEmissaoPage(1); }, [searchText, opFilterStatus, opFilterEtapa, selectedMesRef, selectedConcessionaria, selectedArea, dateRange]);
  useEffect(() => { setAuditPage(1); }, [auditSearch, auditFilterEtapa, auditFilterInconsistencia, selectedConcessionaria, selectedArea]);
  useEffect(() => { setCrmPage(1); }, [crmSearch, crmFilterConcessionaria, crmFilterArea, crmFilterEtapa, crmFilterStatus]);

  const data = useMemo(() => {
    if (!rawData) return [];
    const parseNum = (val: any) => { if (val === null || val === undefined || val === '') return 0; const n = Number(val); return isNaN(n) ? 0 : n; };
    return rawData.map((d: any) => {
      const conc = d['concessionária'] || d.concessionaria || d.concessionaria_rd || 'Outra';
      const area = d['área_de_gestão'] || d.area_de_gestao || 'Outros';
      const mes = d['mês_referência'] || d.mes_referencia_formatado || 'N/D';
      const dataEntrada = d.data_protocolo || d['data_do_1º_protocolo'] || d.data_ganho || d.created_at || null;
      const valorTotal = parseNum(d.total_cobranca) || parseNum(d['total_cobrança_r$']);
      const valorEstimado = parseNum(d.valor_estimado);
      const valorRealizado = parseNum(d.valor_real_cobranca);
      const statusRaw = d.status || d['Status Pagamento'];
      const statusFinal = (statusRaw && statusRaw !== 'null' && statusRaw !== '') ? statusRaw : 'Indefinido';
      
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
        valor_realizado: valorRealizado,
        valor_potencial: valorEstimado,
        total_fatura: valorTotal,
        consumo_mwh: parseNum(d.consumo_crm_mwh) || parseNum(d['consumo_médio_na_venda_mwh']),
        compensado_kwh: parseNum(d.compensacao_kwh) || parseNum(d['compensação_total_kwh']),
        data_entrada_norm: dataEntrada,
        data_saida_norm: d.data_cancelamento || d['data_de_pedido_de_cancelamento'],
        vencimento_norm: d.vencimento || d.vencimento_do_boleto,
        data_emissao_norm: d.data_emissao || d.emissão_do_boleto,
        data_prevista_norm: d.data_emissao_prevista,
        data_emissao_distribuidora: d.data_emissao_distribuidora, 
        tarifa_estimada: parseNum(d.tarifa_estimada),
        tarifa_real: parseNum(d.tarifa_real),
        eficiencia_compensacao: parseNum(d.eficiencia_compensacao),
        consumo_real_kwh: parseNum(d.consumo_kwh ?? d.consumo_real_kwh),
        compensacao_real_kwh: parseNum(d.compensacao_kwh ?? d['compensação_total_kwh']) 
      };
    });
  }, [rawData]);

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

  const formatTarifa = (val: number | null) => {
    if (val === null || val === undefined || val === 0) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 5, maximumFractionDigits: 5 }).format(val);
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

  const getStatusColor = (prevista: string | null, real: string | null, valorRealizado: number) => {
    if (real || valorRealizado > 0) return { color: 'text-emerald-400', bg: 'bg-emerald-900/30 border border-emerald-800', text: 'Emitido', value: 'Emitido' };
    if (!prevista) return { color: 'text-gray-500', bg: 'bg-transparent', text: '-', value: 'Aguardando' };
    const hoje = new Date().toISOString().split('T')[0];
    if (hoje > prevista) return { color: 'text-red-300', bg: 'bg-red-900/40 border border-red-800', text: 'Atrasado', value: 'Atrasado' };
    return { color: 'text-blue-300', bg: 'bg-blue-900/40 border border-blue-800', text: 'Aguardando', value: 'Aguardando' };
  };

  const getPaymentBadge = (status: string) => {
    const sNorm = (status || '').toUpperCase();
    if (['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH', 'PAID', 'LIQUIDATED'].includes(sNorm)) return { color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800', text: 'Pago' };
    if (['OVERDUE', 'LATE'].includes(sNorm)) return { color: 'text-rose-400', bg: 'bg-rose-900/40 border-rose-800', text: 'Atrasado' };
    if (['SENT', 'OPEN', 'AWAITING_PAYMENT', 'PENDING'].includes(sNorm)) return { color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-800', text: 'Aberto' };
    return { color: 'text-slate-500', bg: 'bg-transparent', text: '-' };
  };
    
  const uniqueConcessionarias = useMemo(() => ['Todas', ...new Set(data.map(d => d.concessionaria_norm).filter(Boolean).sort())], [data]);
  const uniqueAreas = useMemo(() => ['Todas', ...new Set(data.map(d => d.area_norm).filter(Boolean).sort())], [data]);
  const uniqueEtapasGlobal = useMemo(() => ['Todas', ...new Set(data.map(d => d.objetivo_etapa_norm).filter(Boolean).sort())], [data]);
  
  const uniqueEtapasOperational = useMemo(() => {
    return ['Todas', ...new Set(data.map(d => d.objetivo_etapa_norm).filter(Boolean))].sort();
  }, [data]);

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
      const matchEtapa = selectedEtapa === 'Todas' || item.objetivo_etapa_norm === selectedEtapa;
      
      let matchDateRange = true;
      if (dateRange.from && dateRange.to && item.data_prevista_norm) {
          const dtPrevista = parseBrDate(item.data_prevista_norm);
          if (dtPrevista) {
              matchDateRange = isWithinInterval(startOfDay(dtPrevista), { start: startOfDay(dateRange.from), end: startOfDay(dateRange.to) });
          } else matchDateRange = false;
      } else if (dateRange.from && !dateRange.to && item.data_prevista_norm) {
          const dtPrevista = parseBrDate(item.data_prevista_norm);
          if (dtPrevista) matchDateRange = isSameDay(dtPrevista, dateRange.from);
          else matchDateRange = false;
      }

      return matchConc && matchArea && matchMes && matchDateRange && matchEtapa;
    });
  }, [data, selectedConcessionaria, selectedArea, selectedEtapa, selectedMesRef, dateRange]);

  const macroMetrics = useMemo(() => {
    const activeData = filteredData;
    
    const itensRealizados = activeData.filter(d => getStatusColor(d.data_prevista_norm, d.data_emissao_norm, d.valor_realizado).value === 'Emitido');
    const realizadoValor = itensRealizados.reduce((acc, curr) => acc + (curr.valor_realizado || 0), 0); 
    const realizadoEnergiaKwh = itensRealizados.reduce((acc, curr) => acc + (curr.compensacao_real_kwh || 0), 0);
    const realizadoEnergiaMWh = realizadoEnergiaKwh / 1000;
    const tarifaMediaRealizada = realizadoEnergiaKwh > 0 ? realizadoValor / realizadoEnergiaKwh : 0;

    const itensPendentes = activeData.filter(d => getStatusColor(d.data_prevista_norm, d.data_emissao_norm, d.valor_realizado).value !== 'Emitido');
    const pendenteValor = itensPendentes.reduce((acc, curr) => acc + (curr.valor_potencial || 0), 0); 
    const pendenteEnergiaKwh = itensPendentes.reduce((acc, curr) => acc + ((curr.consumo_mwh || 0) * 1000), 0);
    const pendenteEnergiaMwh = pendenteEnergiaKwh / 1000;
    const tarifaPendente = pendenteEnergiaKwh > 0 ? pendenteValor / pendenteEnergiaKwh : 0;

    const estimadoValor = activeData.reduce((acc, curr) => acc + (curr.valor_potencial || 0), 0);
    const estimadoEnergiaMwh = activeData.reduce((acc, curr) => acc + (curr.consumo_mwh || 0), 0);
    const qtdEstimado = activeData.length;
    const tarifaMediaEstimada = estimadoEnergiaMwh > 0 ? estimadoValor / (estimadoEnergiaMwh * 1000) : 0;

    return { 
        estimado: estimadoValor, qtdEstimado: qtdEstimado, energiaEstimada: estimadoEnergiaMwh, tarifaEstimada: tarifaMediaEstimada,
        realizado: realizadoValor, qtdRealizado: itensRealizados.length, energiaRealizada: realizadoEnergiaMWh, tarifaRealizada: tarifaMediaRealizada, 
        pendente: pendenteValor, qtdPendente: itensPendentes.length, energiaPendente: pendenteEnergiaMwh, tarifaPendente: tarifaPendente
    };
  }, [filteredData]);

  const generalMetrics = useMemo(() => {
    const totalUCs = filteredData.length;
    const totalRevenue = macroMetrics.realizado + macroMetrics.pendente;
    const totalEnergy = macroMetrics.energiaRealizada + macroMetrics.energiaPendente;
    const avgTicket = totalUCs > 0 ? totalRevenue / totalUCs : 0;
    const avgTicketConsumo = totalUCs > 0 ? (totalEnergy * 1000) / totalUCs : 0;

    return { totalUCs, totalRevenue, totalEnergy, avgTicket, avgTicketConsumo };
  }, [filteredData, macroMetrics]);

  const globalJourney = useMemo(() => {
    let sumGanhoProt = 0, countGanhoProt = 0, ucsGanho = 0, kwhGanho = 0;
    let sumProtEcon = 0, countProtEcon = 0, ucsProt = 0, kwhProt = 0;
    let sumEconFat = 0, countEconFat = 0, ucsEcon = 0, kwhEcon = 0;
    let ucsFat = 0, kwhFat = 0;

    crmData.forEach(d => {
        const matchConc = selectedConcessionaria === 'Todas' || (d.concessionaria || 'Outra') === selectedConcessionaria;
        const matchArea = selectedArea === 'Todas' || (d.area_de_gestao || 'Outros') === selectedArea;
        const matchEtapa = selectedEtapa === 'Todas' || (d.objetivo_etapa || 'Sem Etapa') === selectedEtapa;
        
        if (!matchConc || !matchArea || !matchEtapa) return;

        const dtGanho = parseBrDate(d.data_ganho);
        const dtProt = parseBrDate(d.data_protocolo);
        const dtEcon = parseBrDate(d.data_primeira_economia);
        const dtFat = parseBrDate(d.data_primeira_fatura);
        const kwh = (Number(d.consumo_medio_mwh) || 0) * 1000;

        if (dtGanho) { ucsGanho++; kwhGanho += kwh; }
        if (dtProt) { ucsProt++; kwhProt += kwh; }
        if (dtEcon) { ucsEcon++; kwhEcon += kwh; }
        if (dtFat) { ucsFat++; kwhFat += kwh; }

        if (dtGanho && dtProt && (isAfter(dtProt, dtGanho) || isSameDay(dtProt, dtGanho))) { sumGanhoProt += differenceInDays(dtProt, dtGanho); countGanhoProt++; }
        if (dtProt && dtEcon && (isAfter(dtEcon, dtProt) || isSameDay(dtEcon, dtProt))) { sumProtEcon += differenceInDays(dtEcon, dtProt); countProtEcon++; }
        if (dtEcon && dtFat && (isAfter(dtFat, dtEcon) || isSameDay(dtFat, dtEcon))) { sumEconFat += differenceInDays(dtFat, dtEcon); countEconFat++; }
    });

    return {
        ganhoProt: countGanhoProt > 0 ? Math.round(sumGanhoProt / countGanhoProt) : 0,
        protEcon: countProtEcon > 0 ? Math.round(sumProtEcon / countProtEcon) : 0,
        econFat: countEconFat > 0 ? Math.round(sumEconFat / countEconFat) : 0,
        metrics: { ganho: { ucs: ucsGanho, kwh: kwhGanho }, protocolo: { ucs: ucsProt, kwh: kwhProt }, economia: { ucs: ucsEcon, kwh: kwhEcon }, fatura: { ucs: ucsFat, kwh: kwhFat } }
    };
  }, [crmData, selectedConcessionaria, selectedArea, selectedEtapa]);

  const auditData = useMemo(() => {
      const issuesAll: any[] = [];
      let stats = { totalAnalisados: 0, percIntegridade: 0 };

      crmData.forEach(item => {
          const matchConc = selectedConcessionaria === 'Todas' || (item.concessionaria || 'Outra') === selectedConcessionaria;
          const matchArea = selectedArea === 'Todas' || (item.area_de_gestao || 'Outros') === selectedArea;
          const matchEtapaGlob = selectedEtapa === 'Todas' || (item.objetivo_etapa || 'Sem Etapa') === selectedEtapa;
          if(!matchConc || !matchArea || !matchEtapaGlob) return;

          stats.totalAnalisados++;
          const obj = item.objetivo_etapa || ''; const status = item.status_rd || ''; const missingFields: string[] = [];
          const checkEmpty = (val: any) => !val || String(val).trim() === '' || String(val).toLowerCase() === 'null';

          if (obj.includes('Protocolados')) { if(checkEmpty(item.data_protocolo)) missingFields.push('Data do 1º protocolo'); if(checkEmpty(item.usina_alocada)) missingFields.push('Usina Alocada'); }
          if (obj.includes('Operacional')) { if(checkEmpty(item.data_protocolo)) missingFields.push('Data do 1º protocolo'); if(checkEmpty(item.usina_alocada)) missingFields.push('Usina Alocada'); if(checkEmpty(item.data_primeira_economia)) missingFields.push('Data de 1ª Economia da UC'); if(checkEmpty(item.data_primeira_fatura)) missingFields.push('Data da 1ª fatura'); }
          if (obj.includes('Em Exclusão') || obj.includes('Excluído')) { if(checkEmpty(item.data_cancelamento)) missingFields.push('Data de pedido de cancelamento'); if(checkEmpty(item.motivo_cancelamento)) missingFields.push('Motivo do cancelamento'); }
          if (obj.includes('Excluído')) { if(checkEmpty(item.data_ultimo_faturamento)) missingFields.push('Data do último faturamento'); }
          if (status === 'Stand-by') { if(checkEmpty(item.monitoramento_operacao)) missingFields.push('Monitoramento - Operação'); }

          if (missingFields.length > 0) {
              const idNegocioEncontrado = item.id_negocio || item.ID_NEGOCIO || item.deal_id || item.id_rd || null;
              issuesAll.push({ ...item, missingFields, rdLink: idNegocioEncontrado ? `https://crm.rdstation.com/app/deals/${idNegocioEncontrado}` : null });
          }
      });

      if (stats.totalAnalisados > 0) stats.percIntegridade = Math.round(((stats.totalAnalisados - issuesAll.length) / stats.totalAnalisados) * 100);

      const uniqueEtapas = Array.from(new Set(issuesAll.map(i => i.objetivo_etapa || 'Sem Etapa'))).sort();
      const uniqueInconsistencias = Array.from(new Set(issuesAll.flatMap(i => i.missingFields))).sort();

      const filteredIssues = issuesAll.filter(item => {
          const s = auditSearch.toLowerCase();
          const matchSearch = !s || item.uc?.toLowerCase().includes(s) || item.nome_negocio?.toLowerCase().includes(s);
          const matchEtapa = auditFilterEtapa.length === 0 || auditFilterEtapa.includes(item.objetivo_etapa || 'Sem Etapa');
          const matchInconsistencia = auditFilterInconsistencia.length === 0 || item.missingFields.some((f: string) => auditFilterInconsistencia.includes(f));
          return matchSearch && matchEtapa && matchInconsistencia;
      });

      return { issues: filteredIssues, stats, options: { etapas: uniqueEtapas, inconsistencias: uniqueInconsistencias } };
  }, [crmData, selectedConcessionaria, selectedArea, selectedEtapa, auditSearch, auditFilterEtapa, auditFilterInconsistencia]);

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
       let ucsEntrada = 0, ucsSaida = 0, ucsCarteira = 0;

       uniqueUCsProfile.forEach(uc => {
          if (selectedConcessionaria !== 'Todas' && uc.concessionaria_norm !== selectedConcessionaria) return;
          if (selectedArea !== 'Todas' && uc.area_norm !== selectedArea) return;
          if (selectedEtapa !== 'Todas' && uc.objetivo_etapa_norm !== selectedEtapa) return;
          
          const dtProto = parseBrDate(uc.data_entrada_norm);
          const dtCancel = parseBrDate(uc.data_saida_norm);
          const consumo = uc.consumo_mwh || 0;

          if (dtProto && dtProto.getMonth() === (mes-1) && dtProto.getFullYear() === ano) { mwhEntrada += consumo; ucsEntrada++; }
          if (dtCancel && dtCancel.getMonth() === (mes-1) && dtCancel.getFullYear() === ano) { mwhSaida += consumo; ucsSaida++; }
          
          const isActive = (!dtProto || isBefore(dtProto, dateRef)) && (!dtCancel || isAfter(dtCancel, dateRef));
          if (isActive) { mwhCarteira += consumo; ucsCarteira++; }
       });

       const currentTotalMwh = Math.round(mwhCarteira);
       let growthPct = 0;
       if (index > 0 && previousTotalMwh > 0) {
          const netChange = mwhEntrada - mwhSaida;
          growthPct = (netChange / previousTotalMwh) * 100;
       }
       previousTotalMwh = currentTotalMwh;

       return { 
           name: mesKey, 
           mwhAdded: Number(mwhEntrada.toFixed(1)), ucsAdded: ucsEntrada,
           mwhLost: Number(mwhSaida.toFixed(1)), ucsLost: ucsSaida,
           mwhAccumulated: currentTotalMwh, ucsAccumulated: ucsCarteira,
           growthPct: Number(growthPct.toFixed(1)) 
       };
    });
  }, [uniqueUCsProfile, selectedConcessionaria, selectedArea, selectedEtapa, selectedMesRef]);

  const consumptionChartData = useMemo(() => {
    const endDate = selectedMesRef === 'Todos' ? new Date() : endOfMonth(parseRefMonth(selectedMesRef));
    const startDate = subMonths(endDate, 11);
    const monthsKeys: string[] = [];
    let curr = new Date(startDate);
    while (curr <= endDate) {
        monthsKeys.push(`${(curr.getMonth()+1).toString().padStart(2,'0')}/${curr.getFullYear()}`);
        curr = new Date(curr.setMonth(curr.getMonth()+1));
    }

    const validData = data.filter(item => {
        const matchConc = selectedConcessionaria === 'Todas' || item.concessionaria_norm === selectedConcessionaria;
        const matchArea = selectedArea === 'Todas' || item.area_norm === selectedArea;
        const matchEtapa = selectedEtapa === 'Todas' || item.objetivo_etapa_norm === selectedEtapa;
        const s = item.status_norm;
        const isValidStatus = s && s !== 'Indefinido' && s !== 'null' && s.trim() !== '';
        return matchConc && matchArea && matchEtapa && isValidStatus;
    });

    let totalValue = 0;
    let totalCompensated = 0;

    const monthlyData = monthsKeys.map(mesKey => {
        const items = validData.filter(d => d.mes_norm === mesKey);
        let consMwh = 0; let compKwh = 0; let val = 0;

        items.forEach(item => {
            consMwh += item.consumo_mwh || 0;
            compKwh += item.compensado_kwh || 0;
            val += item.total_fatura || 0;
        });

        const consKwh = consMwh * 1000;
        totalValue += val; totalCompensated += compKwh;

        return { name: mesKey, consumoKwh: Math.round(consKwh), compensadoKwh: Math.round(compKwh), faturado: val };
    });

    const tarifaMedia = totalCompensated > 0 ? totalValue / totalCompensated : 0;
    return { data: monthlyData, tarifaMedia };
  }, [data, selectedConcessionaria, selectedArea, selectedEtapa, selectedMesRef]);

  // --- NOVAS MÉTRICAS DE INTELIGÊNCIA DE NEGÓCIO E FUNIL ---
  const biMetrics = useMemo(() => {
    const pfPj = { PF: { count: 0, consumo: 0 }, PJ: { count: 0, consumo: 0 }, Outros: { count: 0, consumo: 0 } };
    const churn: Record<string, { count: number, consumo: number }> = {};
    const ticketGrupo: Record<string, { soma: number, count: number, consumo: number, macro: string }> = {};
    const descontos: Record<string, { sum: number, count: number }> = {};
    
    const slaFaturamentoMap: Record<string, { sumDays: number, count: number }> = {};
    let totalSlaDays = 0; let countSla = 0;
    let totalDesconto = 0; let countDesconto = 0;

    const uniqueUcs = Array.from(new Map(filteredData.map((item: any) => [item.uc, item])).values()) as any[];

    uniqueUcs.forEach((c: any) => {
        const nat = c.natureza_cliente === 'PJ' ? 'PJ' : (c.natureza_cliente === 'PF' ? 'PF' : 'Outros');
        if (pfPj[nat as keyof typeof pfPj]) { 
            pfPj[nat as keyof typeof pfPj].count++; 
            pfPj[nat as keyof typeof pfPj].consumo += (c.consumo_mwh ? c.consumo_mwh * 1000 : c.consumo_kwh || 0); 
        }

        const etapaNorm = c.objetivo_etapa_norm || c.objetivo_etapa;
        if (etapaNorm === 'Em Exclusão' || etapaNorm === 'Excluído' || etapaNorm === 'Cancelado') {
            const motivo = c.motivo_cancelamento || 'Não informado';
            churn[motivo] = churn[motivo] || { count: 0, consumo: 0 };
            churn[motivo].count++;
            churn[motivo].consumo += (c.consumo_mwh ? c.consumo_mwh * 1000 : c.consumo_kwh || 0);
        }
    });

    filteredData.forEach((c: any) => {
        if (c.concessionaria_norm && c.perc_desconto > 0) {
            const conc = c.concessionaria_norm;
            descontos[conc] = descontos[conc] || { sum: 0, count: 0 };
            descontos[conc].sum += c.perc_desconto;
            descontos[conc].count++;
            totalDesconto += c.perc_desconto;
            countDesconto++;
        }

        if (c.grupo_tarifario && c.grupo_tarifario !== 'N/D' && c.total_fatura > 0) {
            const g = String(c.grupo_tarifario).trim().toUpperCase();
            const macro = g.startsWith('A') ? 'Grupo A' : 'Grupo B';
            ticketGrupo[g] = ticketGrupo[g] || { soma: 0, count: 0, consumo: 0, macro };
            ticketGrupo[g].soma += c.total_fatura;
            ticketGrupo[g].count++;
            ticketGrupo[g].consumo += (c.consumo_kwh || 0); 
        }

        if (c.data_emissao_distribuidora && c.data_emissao_norm) {
            const dtDist = parseBrDate(c.data_emissao_distribuidora);
            const dtNossa = parseBrDate(c.data_emissao_norm);
            if (dtDist && dtNossa) {
                const diff = differenceInDays(dtNossa, dtDist);
                if (diff >= -5 && diff <= 60) {
                    const conc = c.concessionaria_norm || 'Outra';
                    slaFaturamentoMap[conc] = slaFaturamentoMap[conc] || { sumDays: 0, count: 0 };
                    slaFaturamentoMap[conc].sumDays += diff;
                    slaFaturamentoMap[conc].count++;
                    totalSlaDays += diff;
                    countSla++;
                }
            }
        }
    });

    const churnUcs = Object.values(churn).reduce((a, b) => a + b.count, 0);
    const churnRate = uniqueUcs.length > 0 ? ((churnUcs / uniqueUcs.length) * 100).toFixed(1) : '0.0';
    
    const slaGeral = countSla > 0 ? Math.round(totalSlaDays / countSla) : 0;
    const slaDist = Object.keys(slaFaturamentoMap).map(k => ({ name: k.replace('EQUATORIAL', 'EQTL').replace('ENERGISA', 'ENG'), dias: Math.round(slaFaturamentoMap[k].sumDays / slaFaturamentoMap[k].count) })).sort((a,b) => b.dias - a.dias).slice(0, 6);

    return {
        pfPjData: [ { name: 'Pessoa Jurídica', ucs: pfPj.PJ.count, consumo: pfPj.PJ.consumo, cor: '#10b981' }, { name: 'Pessoa Física', ucs: pfPj.PF.count, consumo: pfPj.PF.consumo, cor: '#3b82f6' } ].filter(d => d.ucs > 0),
        churnData: Object.keys(churn).map(k => ({ name: k, value: churn[k].count, consumo: churn[k].consumo })).sort((a,b) => b.value - a.value).slice(0, 7),
        churnRate,
        ticketData: Object.keys(ticketGrupo).map(k => ({ name: k, macro: ticketGrupo[k].macro, ticketMedio: ticketGrupo[k].soma / ticketGrupo[k].count, consumoMedio: ticketGrupo[k].consumo / ticketGrupo[k].count, fill: ticketGrupo[k].macro === 'Grupo A' ? '#6366f1' : '#eab308' })).sort((a,b) => a.name.localeCompare(b.name)),
        descontoGeral: countDesconto > 0 ? (totalDesconto / countDesconto).toFixed(1) : '0',
        descontoDist: Object.keys(descontos).map(k => ({ name: k.replace('EQUATORIAL', 'EQTL').replace('ENERGISA', 'ENG'), desconto: Number((descontos[k].sum / descontos[k].count).toFixed(1)) })).sort((a,b) => b.desconto - a.desconto).slice(0, 6),
        slaGeral, slaDist
    };
  }, [filteredData]);

  const funnelMetrics = useMemo(() => {
        const stages: Record<string, { ucs: number, kwh: number, color: string, bg: string, border: string }> = {
            'Pré-protocolo': { ucs: 0, kwh: 0, color: 'text-purple-400', bg: 'bg-slate-900', border: 'border-slate-700' },
            'Protocolado': { ucs: 0, kwh: 0, color: 'text-blue-400', bg: 'bg-slate-900', border: 'border-slate-700' },
            'Operacional': { ucs: 0, kwh: 0, color: 'text-emerald-400', bg: 'bg-slate-900', border: 'border-slate-700' },
            'Em Exclusão': { ucs: 0, kwh: 0, color: 'text-orange-400', bg: 'bg-slate-900', border: 'border-slate-700' },
            'Excluído': { ucs: 0, kwh: 0, color: 'text-rose-400', bg: 'bg-slate-900', border: 'border-slate-700' },
            'Sem Etapa': { ucs: 0, kwh: 0, color: 'text-slate-400', bg: 'bg-slate-900', border: 'border-slate-700' }
        };

        const uniqueUcs = Array.from(new Map(filteredData.map((item: any) => [item.uc, item])).values()) as any[];

        uniqueUcs.forEach(c => {
            const etapa = c.objetivo_etapa_norm || 'Sem Etapa';
            let key = 'Sem Etapa';
            if (etapa.includes('Pré')) key = 'Pré-protocolo';
            else if (etapa.includes('Protocolado')) key = 'Protocolado';
            else if (etapa.includes('Operacional')) key = 'Operacional';
            else if (etapa.includes('Em Exclusão')) key = 'Em Exclusão';
            else if (etapa.includes('Excluído')) key = 'Excluído';

            stages[key].ucs++;
            stages[key].kwh += (c.consumo_mwh ? c.consumo_mwh * 1000 : c.consumo_kwh || 0); 
        });

        return Object.keys(stages).map(k => ({ name: k, ...stages[k] }));
  }, [filteredData]);

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

  const operationalData = useMemo(() => {
    if (selectedMesRef === 'Todos') return [];
    
    let filtered = filteredData.filter(item => {
        const termo = searchText.toLowerCase();
        const matchBusca = !termo || item.nome.toLowerCase().includes(termo) || item.uc.includes(termo);
        
        let matchStatus = true;
        if (opFilterStatus !== 'Todos') {
            const statusInfo = getStatusColor(item.data_prevista_norm, item.data_emissao_norm, item.valor_realizado);
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

  const emissaoMetrics = useMemo(() => {
    const itensRealizados = operationalData.filter(d => {
        const status = getStatusColor(d.data_prevista_norm, d.data_emissao_norm, d.valor_realizado).value;
        return status === 'Emitido';
    });
    
    const realizadoValor = itensRealizados.reduce((acc, curr) => acc + (curr.valor_realizado || 0), 0); 
    const realizadoEnergiaMWh = itensRealizados.reduce((acc, curr) => acc + ((curr.compensacao_real_kwh || 0) / 1000), 0);
    const tarifaMediaRealizada = (realizadoEnergiaMWh * 1000) > 0 ? realizadoValor / (realizadoEnergiaMWh * 1000) : 0;

    const itensPendentes = operationalData.filter(d => {
        const status = getStatusColor(d.data_prevista_norm, d.data_emissao_norm, d.valor_realizado).value;
        return status !== 'Emitido';
    });
    
    const pendenteValor = itensPendentes.reduce((acc, curr) => acc + (curr.valor_potencial || 0), 0); 
    const pendenteEnergiaMwh = itensPendentes.reduce((acc, curr) => acc + (curr.consumo_mwh || 0), 0);
    const tarifaPendente = (pendenteEnergiaMwh * 1000) > 0 ? pendenteValor / (pendenteEnergiaMwh * 1000) : 0;

    const estimadoValor = operationalData.reduce((acc, curr) => acc + (curr.valor_potencial || 0), 0);
    const estimadoEnergiaMwh = operationalData.reduce((acc, curr) => acc + (curr.consumo_mwh || 0), 0);
    const qtdEstimado = operationalData.length;
    const tarifaMediaEstimada = (estimadoEnergiaMwh * 1000) > 0 ? estimadoValor / (estimadoEnergiaMwh * 1000) : 0;

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
  }, [operationalData]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

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

  const downloadAuditCSV = (rows: any[], filename: string) => {
    if (!rows.length) return;
    const usefulRows = rows.map(r => ({
        UC: r.uc,
        Nome: r.nome_negocio || r.nome,
        Concessionaria: r.concessionaria || '-',
        Area: r.area_de_gestao || '-',
        Etapa: r.objetivo_etapa || '-',
        Status: r.status_rd || '-',
        Inconsistencias: r.missingFields.join(', ')
    }));
    const headers = Object.keys(usefulRows[0]).join(';');
    const csvContent = usefulRows.map(row => Object.values(row).map(v => `"${v}"`).join(';')).join('\n');
    const blob = new Blob([`\uFEFF${headers}\n${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-white p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center opacity-[0.03] pointer-events-none">
           <img src="https://www.ludfor.com.br/arquivos/0d5ce42bc0728ac08a186e725fafac7db6421507.png" alt="Background" className="w-full max-w-5xl object-contain scale-150" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
          <img src="https://www.ludfor.com.br/arquivos/0d5ce42bc0728ac08a186e725fafac7db6421507.png" alt="Simplifica Energia" className="w-full max-w-[280px] object-contain mb-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]"/>
          <Loader2 className="animate-spin h-10 w-10 text-blue-500 mb-6" />
          <div className="text-center">
              <h2 className="text-2xl font-bold font-display text-white tracking-wide">Bem-vindo(a)!</h2>
              <p className="text-sm text-slate-400 mt-2 font-medium">Aguarde enquanto sincronizamos o seu dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const paginatedEmissaoData = operationalData.slice((emissaoPage - 1) * ITEMS_PER_PAGE, emissaoPage * ITEMS_PER_PAGE);
  const totalEmissaoPages = Math.ceil(operationalData.length / ITEMS_PER_PAGE);
  const totalEmissaoEstimado = operationalData.reduce((acc, curr) => acc + (curr.valor_potencial || 0), 0);
  const totalEmissaoRealizado = operationalData.reduce((acc, curr) => acc + (curr.valor_realizado || 0), 0);

  const paginatedAuditData = auditData.issues.slice((auditPage - 1) * ITEMS_PER_PAGE, auditPage * ITEMS_PER_PAGE);
  const totalAuditPages = Math.ceil(auditData.issues.length / ITEMS_PER_PAGE);

  const paginatedCrmData = crmProcessed.filtered.slice((crmPage - 1) * ITEMS_PER_PAGE, crmPage * ITEMS_PER_PAGE);
  const totalCrmPages = Math.ceil(crmProcessed.filtered.length / ITEMS_PER_PAGE);

  const pf = biMetrics.pfPjData.find(d => d.name === 'Pessoa Física')?.ucs || 0;
  const pfConsumo = biMetrics.pfPjData.find(d => d.name === 'Pessoa Física')?.consumo || 0;
  const pj = biMetrics.pfPjData.find(d => d.name === 'Pessoa Jurídica')?.ucs || 0;
  const pjConsumo = biMetrics.pfPjData.find(d => d.name === 'Pessoa Jurídica')?.consumo || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6 pb-20">
      <header className="flex flex-col md:flex-row items-center justify-between mb-6 border-b border-slate-800 pb-5 gap-6">
        <div className="flex items-center gap-4">
          <img src="https://www.ludfor.com.br/arquivos/0d5ce42bc0728ac08a186e725fafac7db6421507.png" alt="Logo Simplifica Energia" className="h-10 w-auto object-contain" />
          <div>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold font-display text-white tracking-tight">Dashboard de Gestão</h1>
                <button onClick={refreshSnapshot} disabled={refreshing} className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50" title="Atualizar Dados do Banco">
                    <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                </button>
            </div>
            <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">Inteligência Comercial e Financeira</p>
          </div>
        </div>
        <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
            <button onClick={() => setCurrentTab('geral')} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${currentTab === 'geral' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Activity size={18}/> Visão Geral</button>
            <button onClick={() => setCurrentTab('financeiro')} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${currentTab === 'financeiro' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><DollarSign size={18}/> Financeiro</button>
            <button onClick={() => setCurrentTab('emissao')} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${currentTab === 'emissao' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><CalendarIcon size={18}/> Emissão</button>
            <button onClick={() => setCurrentTab('carteira')} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${currentTab === 'carteira' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Briefcase size={18}/> Carteira</button>
            <button onClick={() => setCurrentTab('crm')} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${currentTab === 'crm' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Users size={18}/> CRM</button>
            <button onClick={() => setCurrentTab('auditoria')} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${currentTab === 'auditoria' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><ShieldAlert size={18}/> Auditoria</button>
            <button onClick={() => setCurrentTab('localizacao')} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${currentTab === 'localizacao' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><MapPin size={18}/> Localização</button>
        </div>
      </header>

      {/* --- FILTROS GLOBAIS NO TOPO UNIFICADOS --- */}
      {currentTab !== 'carteira' && currentTab !== 'localizacao' && (
      <section className="grid gap-3 mb-6 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm animate-in fade-in zoom-in duration-300 grid-cols-1 md:grid-cols-3 xl:grid-cols-5">
        
        {currentTab !== 'crm' && (
            <>
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-500 font-bold font-display flex items-center gap-1 uppercase tracking-wider"><Filter size={12}/> Concessionária</label>
                    <div className="relative"><select value={selectedConcessionaria} onChange={e => setSelectedConcessionaria(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm outline-none text-white focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer hover:border-slate-600 transition-colors">{uniqueConcessionarias.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-500 font-bold font-display flex items-center gap-1 uppercase tracking-wider"><Filter size={12}/> Área de Gestão</label>
                    <div className="relative"><select value={selectedArea} onChange={e => setSelectedArea(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm outline-none text-white focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer hover:border-slate-600 transition-colors">{uniqueAreas.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-500 font-bold font-display flex items-center gap-1 uppercase tracking-wider"><Filter size={12}/> Etapa</label>
                    <div className="relative"><select value={selectedEtapa} onChange={e => setSelectedEtapa(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm outline-none text-white focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer hover:border-slate-600 transition-colors">{uniqueEtapasGlobal.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
            </>
        )}

        {(currentTab === 'geral' || currentTab === 'financeiro' || currentTab === 'emissao') && (
            <>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-500 font-bold font-display flex items-center gap-1 uppercase tracking-wider"><Filter size={12}/> Mês Referência</label>
                  <div className="relative"><select value={selectedMesRef} onChange={e => setSelectedMesRef(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm outline-none text-white focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer hover:border-slate-600 transition-colors">{uniqueMesesRef.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-500 font-bold font-display flex items-center gap-1 uppercase tracking-wider"><CalendarIcon size={12}/> Período de Emissão Prevista</label>
                    <DateRangePicker selectedRange={dateRange} onChange={setDateRange} />
                </div>
            </>
        )}

        {currentTab === 'auditoria' && (
            <>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-500 font-bold font-display flex items-center gap-1 uppercase tracking-wider"><Search size={12}/> Buscar UC/Negócio</label>
                  <input type="text" value={auditSearch} onChange={e => setAuditSearch(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm outline-none text-white focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" placeholder="Buscar..."/>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-500 font-bold font-display flex items-center gap-1 uppercase tracking-wider"><Filter size={12}/> Inconsistência</label>
                  <MultiSelect fullWidth options={auditData.options.inconsistencias} selected={auditFilterInconsistencia} onChange={setAuditFilterInconsistencia} placeholder="Qualquer Inconsistência" />
                </div>
            </>
        )}

        {currentTab === 'crm' && (
            <>
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-500 font-bold font-display flex items-center gap-1 uppercase tracking-wider"><Search size={12}/> Buscar UC/Nome</label>
                    <div className="relative group w-full">
                        <Search className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16}/>
                        <input type="text" placeholder="Buscar..." value={crmSearch} onChange={e => setCrmSearch(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" />
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-500 font-bold font-display flex items-center gap-1 uppercase tracking-wider"><Filter size={12}/> Concessionária</label>
                    <MultiSelect options={crmProcessed.options.concessionarias.filter((o: string) => o !== 'Todas')} selected={crmFilterConcessionaria} onChange={setCrmFilterConcessionaria} placeholder="Todas" fullWidth />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-500 font-bold font-display flex items-center gap-1 uppercase tracking-wider"><Filter size={12}/> Área de Gestão</label>
                    <MultiSelect options={crmProcessed.options.areas.filter((o: string) => o !== 'Todas')} selected={crmFilterArea} onChange={setCrmFilterArea} placeholder="Todas" fullWidth />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-500 font-bold font-display flex items-center gap-1 uppercase tracking-wider"><Filter size={12}/> Etapa</label>
                    <MultiSelect options={crmProcessed.options.etapas.filter((o: string) => o !== 'Todas')} selected={crmFilterEtapa} onChange={setCrmFilterEtapa} placeholder="Todas" fullWidth />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-500 font-bold font-display flex items-center gap-1 uppercase tracking-wider"><Filter size={12}/> Status RD</label>
                    <MultiSelect options={crmProcessed.options.status.filter((o: string) => o !== 'Todos')} selected={crmFilterStatus} onChange={setCrmFilterStatus} placeholder="Todos" fullWidth />
                </div>
            </>
        )}
      </section>
      )}

      {currentTab === 'geral' && (
          <div className="animate-in fade-in zoom-in duration-300">
              {/* TOP KPIS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  {[
                      { title: 'Total UCs (Filtro)', value: new Intl.NumberFormat('pt-BR').format(generalMetrics.totalUCs), sub: 'Unidades Consumidoras', icon: Users, color: 'blue' },
                      { title: 'Energia Gerida', value: formatEnergySmart(generalMetrics.totalEnergy, 'MWh'), sub: 'Total Acumulado', icon: Zap, color: 'emerald' },
                      { title: 'Projeção do Mês', value: formatMoney(macroMetrics.estimado), sub: 'Faturamento Estimado', icon: Target, color: 'indigo' },
                      { title: 'Receita do Período', value: formatMoney(generalMetrics.totalRevenue), sub: 'Faturado + Pendente', icon: DollarSign, color: 'amber' },
                      { title: 'Ticket Médio', value: formatMoney(generalMetrics.avgTicket), sub: `${new Intl.NumberFormat('pt-BR', {maximumFractionDigits:0}).format(generalMetrics.avgTicketConsumo)} kWh / UC`, icon: PieChart, color: 'purple' },
                      { 
                          title: 'Perfil de Cliente', 
                          isCustom: true,
                          icon: Briefcase, 
                          color: 'teal',
                          content: (
                              <div className="flex justify-between items-center mt-2">
                                  <div className="flex-1 flex flex-col justify-center">
                                      <p className="text-lg font-bold font-display text-white leading-none text-center"><span className="text-xs text-teal-400 font-bold mr-1">PJ</span>{new Intl.NumberFormat('pt-BR').format(pj)}</p>
                                      <p className="text-[9px] text-slate-400 font-medium mt-1 text-center bg-slate-950/50 rounded">{formatEnergySmart(pjConsumo, 'kWh')}</p>
                                  </div>
                                  <div className="w-px h-8 bg-slate-700 mx-2"></div>
                                  <div className="flex-1 flex flex-col justify-center">
                                      <p className="text-lg font-bold font-display text-white leading-none text-center"><span className="text-xs text-blue-400 font-bold mr-1">PF</span>{new Intl.NumberFormat('pt-BR').format(pf)}</p>
                                      <p className="text-[9px] text-slate-400 font-medium mt-1 text-center bg-slate-950/50 rounded">{formatEnergySmart(pfConsumo, 'kWh')}</p>
                                  </div>
                              </div>
                          )
                      }
                  ].map((kpi, idx) => (
                      <div key={idx} className={`bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group hover:border-${kpi.color}-500/30 transition-all`}>
                          <div className={`absolute -right-4 -top-4 p-3 bg-${kpi.color}-500/10 rounded-full opacity-50`}><kpi.icon size={50} className={`text-${kpi.color}-500`} /></div>
                          <p className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider mb-1">{kpi.title}</p>
                          {kpi.isCustom ? kpi.content : (
                              <>
                                  <h3 className="text-xl font-bold font-display text-white truncate" title={kpi.value}>{kpi.value}</h3>
                                  <p className={`text-[10px] mt-1 text-${kpi.color}-400 font-medium truncate`} title={kpi.sub}>{kpi.sub}</p>
                              </>
                          )}
                      </div>
                  ))}
              </div>

              {/* JORNADA DO CLIENTE E SLA LADO A LADO */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                  {/* FUNIL DA CARTEIRA */}
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-5 flex flex-col justify-center relative overflow-hidden">
                      <h3 className="text-xs font-bold font-display text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
                          <TrendingUp size={16} className="text-emerald-500"/> Funil da Carteira
                      </h3>
                      <div className="flex w-full justify-between items-center gap-2 relative z-10 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                          {funnelMetrics.map((step, idx) => (
                              <React.Fragment key={step.name}>
                                  <div className={`flex-1 min-w-[110px] p-2 rounded-xl border ${step.bg} ${step.border} flex flex-col items-center justify-center text-center`}>
                                      <span className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${step.color}`}>{step.name}</span>
                                      <span className="text-lg font-bold font-mono text-white leading-tight">{new Intl.NumberFormat('pt-BR').format(step.ucs)} <span className="text-[9px] text-slate-400 font-sans uppercase">UCs</span></span>
                                      <span className="text-[10px] font-medium text-slate-300 flex items-center gap-1 mt-1"><Zap size={10} className={step.color}/> {formatEnergySmart(step.kwh, 'kWh')}</span>
                                  </div>
                                  {idx < funnelMetrics.length - 1 && (
                                      <div className="flex flex-col items-center justify-center text-slate-600 px-1"><ArrowRight size={14} /></div>
                                  )}
                              </React.Fragment>
                          ))}
                      </div>
                  </div>

                  {/* SLA HORIZONTAL */}
                  <div className="flex flex-col gap-6">
                      {globalJourney && (
                          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-5 flex flex-col justify-center relative overflow-hidden flex-1">
                              <h3 className="text-xs font-bold font-display text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10" title="Tempo médio (em dias) que os clientes levam para avançar de etapa">
                                  <Clock size={16} className="text-blue-500"/> Tempo Médio de Jornada
                              </h3>
                              <div className="flex w-full justify-between items-center relative z-10 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 pt-2">
                                  <div className="flex flex-col items-center min-w-[70px]">
                                      <Target size={24} className="text-blue-500 mb-1.5"/>
                                      <span className="text-[10px] font-bold uppercase text-slate-400">Ganho</span>
                                  </div>
                                  <div className="flex-1 flex flex-col items-center min-w-[50px] px-2">
                                      <span className="text-2xl font-mono font-bold text-white mb-1">{globalJourney.ganhoProt}<span className="text-xs text-slate-500 ml-0.5">d</span></span>
                                      <div className="w-full h-1 bg-slate-800 rounded-full relative"><div className="absolute right-0 h-full w-1/2 bg-gradient-to-r from-transparent to-blue-500/50 rounded-full"></div></div>
                                  </div>
                                  <div className="flex flex-col items-center min-w-[70px]">
                                      <FileCheck size={24} className="text-purple-500 mb-1.5"/>
                                      <span className="text-[10px] font-bold uppercase text-slate-400">1º Protocolo</span>
                                  </div>
                                  <div className="flex-1 flex flex-col items-center min-w-[50px] px-2">
                                      <span className="text-2xl font-mono font-bold text-white mb-1">{globalJourney.protEcon}<span className="text-xs text-slate-500 ml-0.5">d</span></span>
                                      <div className="w-full h-1 bg-slate-800 rounded-full relative"><div className="absolute right-0 h-full w-1/2 bg-gradient-to-r from-transparent to-purple-500/50 rounded-full"></div></div>
                                  </div>
                                  <div className="flex flex-col items-center min-w-[70px]">
                                      <PiggyBank size={24} className="text-emerald-500 mb-1.5"/>
                                      <span className="text-[10px] font-bold uppercase text-slate-400">1ª Economia</span>
                                  </div>
                                  <div className="flex-1 flex flex-col items-center min-w-[50px] px-2">
                                      <span className="text-2xl font-mono font-bold text-white mb-1">{globalJourney.econFat}<span className="text-xs text-slate-500 ml-0.5">d</span></span>
                                      <div className="w-full h-1 bg-slate-800 rounded-full relative"><div className="absolute right-0 h-full w-1/2 bg-gradient-to-r from-transparent to-emerald-500/50 rounded-full"></div></div>
                                  </div>
                                  <div className="flex flex-col items-center min-w-[70px]">
                                      <Receipt size={24} className="text-rose-500 mb-1.5"/>
                                      <span className="text-[10px] font-bold uppercase text-slate-400">1ª Fatura</span>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              {/* LINHA DE INTELIGÊNCIA COMERCIAL (BI) COM 4 COLUNAS */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                
                {/* Ticket Médio */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col lg:col-span-1">
                    <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><DollarSign size={16} className="text-indigo-400"/> Ticket Médio por Grupo Tarifário</h3>
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={biMetrics.ticketData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(1)}k`} />
                                <RechartsTooltip cursor={{fill: '#1e293b'}} content={<CustomTooltipTicket />} />
                                <Bar dataKey="ticketMedio" radius={[4, 4, 0, 0]}>
                                    {biMetrics.ticketData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Grupo A (Alta)</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Grupo B (Baixa)</span>
                    </div>
                </div>

                {/* Descontos Médios */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col lg:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><Receipt size={16} className="text-rose-400"/> Descontos Aplicados</h3>
                        <span className="text-xs bg-slate-950 border border-slate-700 px-2 py-1 rounded-lg font-bold text-rose-400">Média Geral: {biMetrics.descontoGeral}%</span>
                    </div>
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={biMetrics.descontoDist} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={10} hide />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} axisLine={false} tickLine={false} />
                                <RechartsTooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', color: '#fff' }} formatter={(val: any) => `${val}%`} />
                                <Bar dataKey="desconto" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={16}>
                                    <LabelList dataKey="desconto" position="right" fill="#cbd5e1" fontSize={10} formatter={(v:any) => `${v}%`}/>
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* NOVO: SLA DE FATURAMENTO */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col relative overflow-hidden lg:col-span-1">
                    <div className="absolute top-0 right-0 p-5 opacity-5"><Clock size={100} className="text-blue-500"/></div>
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2" title="Tempo entre Fatura da Distribuidora e Nosso Boleto">
                            <Clock size={16} className="text-blue-400"/> Atraso no Faturamento
                        </h3>
                        <span className="text-xs bg-blue-950/50 border border-blue-900/50 px-2 py-1 rounded-lg font-bold text-blue-400">Média: {biMetrics.slaGeral} dias</span>
                    </div>
                    <div className="flex-1 min-h-[200px] relative z-10">
                        {biMetrics.slaDist.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={biMetrics.slaDist} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={10} hide />
                                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', color: '#fff' }} formatter={(val: any) => `${val} dias`} />
                                    <Bar dataKey="dias" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16}>
                                        <LabelList dataKey="dias" position="right" fill="#cbd5e1" fontSize={10} formatter={(v:any) => `${v}d`}/>
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-xs text-center p-4">
                                Sem dados de emissão da distribuidora no banco para calcular o delay.
                            </div>
                        )}
                    </div>
                </div>

                {/* Churn Analítico */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col lg:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><ShieldAlert size={16} className="text-orange-500"/> Top Motivos Cancelamento</h3>
                        <span className="text-xs bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-lg font-bold text-orange-400" title="Proporção de Cancelados em relação à base total">Churn Rate: {biMetrics.churnRate}%</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-start space-y-4 pr-2">
                        {biMetrics.churnData.length > 0 ? biMetrics.churnData.map((c, i) => (
                            <div key={i} className="flex justify-between items-center text-xs border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                                <span className="text-slate-400 truncate pr-2 flex-1 font-medium" title={c.name}>{c.name}</span>
                                <div className="flex flex-col items-end min-w-max">
                                    <span className="font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded shadow-sm">{c.value} UCs</span>
                                    <span className="text-[10px] text-slate-500 mt-1 font-mono">{formatEnergySmart(c.consumo, 'kWh')}</span>
                                </div>
                            </div>
                        )) : <p className="text-xs text-slate-500 text-center py-4">Nenhum cancelamento ("Em Exclusão"/"Excluído") na base atual.</p>}
                    </div>
                </div>
              </div>

              {/* GRÁFICO DE EVOLUÇÃO (Expandido Horizontalmente) */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold font-display text-white flex items-center gap-2"><TrendingUp size={20} className="text-blue-500"/> Evolução da Carteira (MWh vs UCs)</h3>
                  <div className="flex gap-4 text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-slate-400"><div className="w-3 h-3 bg-emerald-500/20 border border-emerald-500 rounded-full"></div> Carteira Total</span>
                    <span className="flex items-center gap-1.5 text-emerald-400"><div className="w-3 h-3 bg-emerald-400 rounded-sm"></div> Nova Carga</span>
                    <span className="flex items-center gap-1.5 text-rose-400"><div className="w-3 h-3 bg-rose-400 rounded-sm"></div> Perda Carga</span>
                  </div>
                </div>
                <div className="h-[400px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={0}>
                      <defs><linearGradient id="gradMwh" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#9FD140" stopOpacity={0.3}/><stop offset="95%" stopColor="#9FD140" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                      <YAxis yAxisId="left" stroke="#10b981" fontSize={12} tickFormatter={(val) => Math.round(val).toString()} />
                      <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" fontSize={12} />
                      <RechartsTooltip content={<CustomTooltipEvolucao />} cursor={{fill: '#233328', opacity: 0.4}} />
                      <Area type="monotone" dataKey="mwhAccumulated" yAxisId="left" stroke="#9FD140" fill="url(#gradMwh)" strokeWidth={2} name="Carteira Total" />
                      <Bar dataKey="mwhAdded" yAxisId="right" fill="#8BBA35" radius={[4, 4, 0, 0]} name="Nova Carga" barSize={20} />
                      <Bar dataKey="mwhLost" yAxisId="right" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Perda Carga" barSize={20} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* GRÁFICO DE CONSUMO/COMPENSAÇÃO (Comprimido) */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                      <h3 className="text-lg font-bold font-display text-white flex items-center gap-2"><Zap size={20} className="text-yellow-500"/> Consumo vs Compensação (kWh)</h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-500" /> Apenas faturas capturadas (Status válido)
                      </p>
                  </div>
                  <div className="text-right bg-slate-800 p-3 rounded-xl border border-slate-700">
                      <p className="text-[10px] font-display text-slate-400 uppercase tracking-wider font-bold mb-1 flex items-center gap-1 justify-end"><DollarSign size={10}/> Tarifa Média (Período)</p>
                      <div className="text-lg font-display text-emerald-400 font-bold">
                          {formatTarifa(consumptionChartData.tarifaMedia)}<span className="text-xs text-emerald-600 ml-1">/kWh</span>
                      </div>
                  </div>
                </div>
                <div className="h-[280px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={consumptionChartData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={2}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A4032" vertical={false} />
                          <XAxis dataKey="name" stroke="#8C8C8C" fontSize={12} tickMargin={10} />
                          <YAxis yAxisId="left" stroke="#8C8C8C" fontSize={11} tickFormatter={(val) => `${(val/1000).toFixed(0)}k kWh`} dx={-10} />
                          <RechartsTooltip 
                              cursor={{fill: '#233328', opacity: 0.4}}
                              contentStyle={{ backgroundColor: '#14211A', borderColor: '#2A4032', borderRadius: '12px' }} 
                              itemStyle={{ color: '#F6F6F6', fontSize: '12px', fontWeight: 'bold' }}
                              labelStyle={{ color: '#8C8C8C', fontSize: '12px', marginBottom: '8px', borderBottom: '1px solid #2A4032', paddingBottom: '4px' }}
                              formatter={(value: any, name: any) => {
                                  if (name === "Consumo" || name === "Compensação") {
                                      return [`${new Intl.NumberFormat('pt-BR').format(value)} kWh`, name];
                                  }
                                  return [value, name];
                              }}
                          />
                          <Bar dataKey="consumoKwh" yAxisId="left" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Consumo" barSize={30} />
                          <Bar dataKey="compensadoKwh" yAxisId="left" fill="#eab308" radius={[4, 4, 0, 0]} name="Compensação" barSize={30} />
                      </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
          </div>
      )}

      {currentTab === 'financeiro' && (
          <div className="animate-in fade-in zoom-in duration-300">
             <div>
                 <h3 className="text-sm font-bold font-display text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Wallet size={16}/> Detalhamento de Recebimentos</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Recebido', data: financialGroups.recebido, color: 'text-emerald-400', icon: CheckCircle2, iconColor: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                        { label: 'Atrasado', data: financialGroups.atrasado, color: 'text-rose-400', icon: AlertCircle, iconColor: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                        { label: 'Enviado', data: financialGroups.enviado, color: 'text-blue-400', icon: Send, iconColor: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                        { label: 'Não Enviado', data: financialGroups.naoEnviado, color: 'text-slate-400', icon: Clock, iconColor: 'text-slate-500', bg: 'bg-slate-800', border: 'border-slate-700' }
                    ].map((item, idx) => (
                        <div key={idx} className={`p-5 rounded-2xl border flex justify-between items-center group hover:scale-[1.02] transition-all shadow-sm ${item.bg} ${item.border}`}>
                        <div>
                            <p className="text-xs text-slate-400 mb-1 font-bold font-display uppercase tracking-wider">{item.label}</p>
                            <p className={`text-xl font-display font-bold ${item.color}`}>{formatMoney(item.data.val)}</p>
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
          </div>
      )}

      {currentTab === 'emissao' && (
        <div className="animate-in fade-in zoom-in duration-300 space-y-8">
            <div>
                <h3 className="text-sm font-bold font-display text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><DollarSign size={16}/> Resumo de Faturamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 p-4 opacity-5 bg-white rounded-full"><DollarSign size={120} /></div>
                    <h3 className="text-slate-400 font-bold font-display mb-2 text-xs uppercase tracking-wider">Projeção do Mês</h3>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight">{formatMoney(emissaoMetrics.estimado)}</h2>
                        <div className="flex flex-wrap gap-2 text-xs mt-3">
                        <span className="text-blue-300 bg-blue-950 border border-blue-900 px-2.5 py-1 rounded-md font-medium">{new Intl.NumberFormat('pt-BR').format(emissaoMetrics.qtdEstimado)} UCs</span>
                        <span className="text-emerald-300 bg-emerald-950 border border-emerald-900 px-2.5 py-1 rounded-md font-medium flex items-center gap-1"><Zap size={12}/> {formatEnergySmart(emissaoMetrics.energiaEstimada, 'MWh')}</span>
                        <span className="text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md font-medium flex items-center gap-1" title="Tarifa Média Estimada">
                            <DollarSign size={12}/> {formatTarifa(emissaoMetrics.tarifaEstimada)}/kWh
                        </span>
                        </div>
                    </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 p-4 opacity-5 bg-blue-500 rounded-full"><FileText size={120} /></div>
                    <h3 className="text-slate-400 font-bold font-display mb-2 text-xs uppercase tracking-wider">Faturas Emitidas</h3>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-display font-extrabold text-blue-500 tracking-tight">{formatMoney(emissaoMetrics.realizado)}</h2>
                        <div className="flex flex-wrap gap-2 text-xs mt-3">
                        <span className="text-blue-300 bg-blue-950 border border-blue-900 px-2.5 py-1 rounded-md font-medium">{new Intl.NumberFormat('pt-BR').format(emissaoMetrics.qtdRealizado)} UCs</span>
                        <span className="text-yellow-300 bg-yellow-950 border border-yellow-900 px-2.5 py-1 rounded-md font-medium flex items-center gap-1"><Zap size={12}/> {formatEnergySmart(emissaoMetrics.energiaRealizada, 'MWh')}</span>
                        <span className="text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md font-medium flex items-center gap-1" title="Tarifa Média Realizada">
                            <DollarSign size={12}/> {formatTarifa(emissaoMetrics.tarifaRealizada)}/kWh
                        </span>
                        </div>
                    </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg relative overflow-hidden border-l-4 border-l-amber-500">
                    <div className="absolute -right-6 -top-6 p-4 opacity-5 bg-amber-500 rounded-full"><Clock size={120} /></div>
                    <h3 className="text-slate-400 font-bold font-display mb-2 text-xs uppercase tracking-wider">Aguardando Emissão</h3>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-display font-extrabold text-amber-500 tracking-tight">{formatMoney(emissaoMetrics.pendente)}</h2>
                        <div className="flex flex-wrap gap-2 text-xs mt-3">
                            <span className="text-amber-200 bg-amber-950 border border-amber-900 px-2.5 py-1 rounded-md font-medium">{new Intl.NumberFormat('pt-BR').format(emissaoMetrics.qtdPendente)} UCs</span>
                            <span className="text-amber-200 bg-amber-950 border border-amber-900 px-2.5 py-1 rounded-md flex items-center gap-1"><Zap size={12}/> {formatEnergySmart(emissaoMetrics.energiaPendente, 'MWh')}</span>
                            <span className="text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md font-medium flex items-center gap-1" title="Tarifa Média Pendente">
                                <DollarSign size={12}/> {formatTarifa(emissaoMetrics.tarifaPendente)}/kWh
                            </span>
                        </div>
                    </div>
                    </div>
                </div>
            </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden flex flex-col">
             <div className="p-5 border-b border-slate-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-900/50">
               <div>
                 <h2 className="text-xl font-display font-bold text-white flex items-center gap-2"><CalendarIcon className="text-blue-500" size={24}/> Previsão vs Realizado</h2>
                 <p className="text-sm text-slate-400">Acompanhamento de emissão de faturas</p>
               </div>
               
               <div className="flex flex-wrap items-center justify-between w-full xl:w-auto gap-4 flex-1 xl:ml-8">
                   <div className="flex flex-wrap items-center gap-3">
                     <div className="relative group">
                        <Search className="absolute left-2.5 top-2.5 text-slate-500 group-focus-within:text-blue-400" size={16}/>
                        <input 
                           type="text" 
                           value={searchText}
                           onChange={e => setSearchText(e.target.value)}
                           placeholder="Buscar UC ou Nome" 
                           className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm outline-none text-white focus:ring-2 focus:ring-blue-500/50 transition-all w-52"
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
                            <option value="Emitido">Emitido</option>
                            <option value="Atrasado">Atrasado</option>
                            <option value="Aguardando">Aguardando</option>
                        </select>
                     </div>
                   </div>

                   <div className="w-full sm:w-auto ml-auto z-20">
                       <MultiSelect 
                          options={emissaoColunasOptions} 
                          selected={emissaoColunas} 
                          onChange={setEmissaoColunas} 
                          placeholder="Colunas Opcionais" 
                          icon={Settings2}
                       />
                   </div>
               </div>
             </div>
             
             {selectedMesRef === 'Todos' ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-500">
                    <MousePointerClick size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-display font-medium">Selecione um Mês de Referência</p>
                    <p className="text-sm opacity-70">Para carregar a análise detalhada, escolha um mês no filtro acima.</p>
                </div>
             ) : (
                 <div className="flex flex-col flex-1">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-sm text-left">
                        <thead className="bg-slate-950 text-xs uppercase text-slate-400 font-semibold tracking-wider border-b border-slate-800 whitespace-nowrap">
                            <tr>
                                <th className="px-6 py-4">UC / Cliente</th>
                                <th className="px-6 py-4">Distribuidora</th>
                                <th className="px-6 py-4">Etapa</th>
                                <th className="px-6 py-4">Data Prevista</th>
                                <th className="px-6 py-4">Data Emissão (Real)</th>
                                
                                {emissaoColunas.includes('Consumo RD (kWh)') && <th className="px-6 py-4 text-right text-blue-400 bg-blue-900/10">Cons. RD (kWh)</th>}
                                {emissaoColunas.includes('Tarifa RD (Estimada)') && <th className="px-6 py-4 text-right text-blue-400 bg-blue-900/10">Tarifa RD</th>}
                                {emissaoColunas.includes('Tarifa Fatura (Real)') && <th className="px-6 py-4 text-right text-emerald-400 bg-emerald-900/10">Tarifa Real</th>}
                                {emissaoColunas.includes('Consumo (Fatura)') && <th className="px-6 py-4 text-right text-emerald-400 bg-emerald-900/10">Cons. Fatura</th>}
                                {emissaoColunas.includes('Compensação (Fatura)') && <th className="px-6 py-4 text-right text-emerald-400 bg-emerald-900/10">Compensação</th>}
                                {emissaoColunas.includes('Eficiência (%)') && <th className="px-6 py-4 text-center text-emerald-400 bg-emerald-900/10">Eficiência</th>}

                                <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('valor_potencial')}>
                                    <div className="flex items-center justify-end gap-1">Projeção (R$) <ArrowUpDown size={14}/></div>
                                </th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('valor_realizado')}>
                                    <div className="flex items-center justify-end gap-1">Valor Faturado (R$) <ArrowUpDown size={14}/></div>
                                </th>
                                
                                <th className="px-6 py-4 text-center">Status Fatura</th>

                                {emissaoColunas.includes('Status Pagamento') && <th className="px-6 py-4 text-center bg-slate-900 border-l border-slate-800">Pagamento</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {paginatedEmissaoData.map((row: any) => {
                            const status = getStatusColor(row.data_prevista_norm, row.data_emissao_norm, row.valor_realizado);
                            const payBadge = getPaymentBadge(row.status_norm);
                            
                            const eficPercent = row.eficiencia_compensacao * 100;
                            let eficColor = 'text-rose-400';
                            let eficBg = 'bg-rose-900/40 border-rose-800/50';
                            
                            if (eficPercent >= 90) { eficColor = 'text-emerald-400'; eficBg = 'bg-emerald-900/40 border-emerald-800/50'; }
                            else if (eficPercent >= 70) { eficColor = 'text-yellow-400'; eficBg = 'bg-yellow-900/40 border-yellow-800/50'; }

                            const isMeasuredEfic = status.value === 'Emitido' || status.value === 'Atrasado' || row.consumo_real_kwh > 0 || row.compensacao_real_kwh > 0;

                            return (
                                <tr key={`${row.uc}-${row.mes_norm}`} className="hover:bg-slate-800/50 transition-colors whitespace-nowrap">
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
                                
                                {emissaoColunas.includes('Consumo RD (kWh)') && (
                                    <td className="px-6 py-4 text-right font-mono text-blue-300 bg-blue-900/10 border-l border-slate-800/50">
                                        {new Intl.NumberFormat('pt-BR').format(Math.round(row.consumo_mwh * 1000))} <span className="text-[10px]">kWh</span>
                                    </td>
                                )}
                                {emissaoColunas.includes('Tarifa RD (Estimada)') && (
                                    <td className="px-6 py-4 text-right font-mono text-blue-300 bg-blue-900/10">
                                        {formatTarifa(row.tarifa_estimada)}
                                    </td>
                                )}
                                {emissaoColunas.includes('Tarifa Fatura (Real)') && (
                                    <td className="px-6 py-4 text-right font-mono text-emerald-300 bg-emerald-900/10 border-l border-slate-800/50">
                                        {formatTarifa(row.tarifa_real)}
                                    </td>
                                )}
                                {emissaoColunas.includes('Consumo (Fatura)') && (
                                    <td className="px-6 py-4 text-right font-mono text-emerald-300 bg-emerald-900/10">
                                        {new Intl.NumberFormat('pt-BR').format(row.consumo_real_kwh)} <span className="text-[10px]">kWh</span>
                                    </td>
                                )}
                                {emissaoColunas.includes('Compensação (Fatura)') && (
                                    <td className="px-6 py-4 text-right font-mono text-emerald-300 bg-emerald-900/10">
                                        {new Intl.NumberFormat('pt-BR').format(row.compensacao_real_kwh)} <span className="text-[10px]">kWh</span>
                                    </td>
                                )}
                                {emissaoColunas.includes('Eficiência (%)') && (
                                    <td className="px-6 py-4 text-center bg-emerald-900/10 border-r border-slate-800/50">
                                        {isMeasuredEfic ? (
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${eficColor} ${eficBg}`}>
                                                {eficPercent.toFixed(1)}%
                                            </span>
                                        ) : <span className="text-slate-500">-</span>}
                                    </td>
                                )}

                                <td className="px-6 py-4 text-right font-medium text-blue-400">{formatMoney(row.valor_potencial)}</td>
                                <td className="px-6 py-4 text-right font-bold text-emerald-400">
                                    {row.valor_realizado > 0 ? formatMoney(row.valor_realizado) : <span className="text-slate-600">-</span>}
                                </td>
                                
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${status.bg} ${status.color}`}>{status.text}</span>
                                </td>

                                {emissaoColunas.includes('Status Pagamento') && (
                                    <td className="px-6 py-4 text-center border-l border-slate-800/50 bg-slate-900/30">
                                        {payBadge.text !== '-' ? (
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${payBadge.color} ${payBadge.bg}`}>
                                                {payBadge.text}
                                            </span>
                                        ) : <span className="text-slate-500">-</span>}
                                    </td>
                                )}
                                </tr>
                            );
                            })}
                            {paginatedEmissaoData.length === 0 && (
                            <tr><td colSpan={9 + emissaoColunas.length} className="text-center py-12 text-slate-500">Nenhum dado encontrado para os filtros selecionados.</td></tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-900 border-t-2 border-slate-700 font-bold text-slate-200">
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-right font-display uppercase text-xs tracking-wider text-slate-500">Total Filtrado</td>
                                
                                {emissaoColunas.includes('Consumo RD (kWh)') && <td></td>}
                                {emissaoColunas.includes('Tarifa RD (Estimada)') && <td></td>}
                                {emissaoColunas.includes('Tarifa Fatura (Real)') && <td></td>}
                                {emissaoColunas.includes('Consumo (Fatura)') && <td></td>}
                                {emissaoColunas.includes('Compensação (Fatura)') && <td></td>}
                                {emissaoColunas.includes('Eficiência (%)') && <td></td>}

                                <td className="px-6 py-4 text-right text-blue-400 text-base">{formatMoney(totalEmissaoEstimado)}</td>
                                <td className="px-6 py-4 text-right text-emerald-400 text-base border-r border-slate-800">{formatMoney(totalEmissaoRealizado)}</td>
                                
                                <td></td>
                                {emissaoColunas.includes('Status Pagamento') && <td></td>}
                            </tr>
                        </tfoot>
                        </table>
                    </div>
                    <Pagination page={emissaoPage} totalPages={totalEmissaoPages} setPage={setEmissaoPage} totalItems={operationalData.length} />
                 </div>
             )}
          </div>
        </div>
      )}

      {currentTab === 'carteira' && (
        <div className="animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-xl font-display font-bold text-white flex items-center gap-2"><Briefcase className="text-blue-500" size={24}/> Carteira de Clientes</h2>
                    <p className="text-sm text-slate-400">Visão consolidada por Canal e Concessionária (Base Total RD Station)</p>
                </div>
                
                <div className="overflow-x-auto p-6">
                    <table className="w-full text-sm text-left border-collapse border border-slate-700">
                        <thead>
                            <tr className="bg-blue-900 text-white">
                                <th rowSpan={2} className="p-3 border border-slate-700 text-center font-display uppercase font-bold w-32">Canal</th>
                                <th rowSpan={2} className="p-3 border border-slate-700 text-center font-display uppercase font-bold w-48">Etapa</th>
                                {portfolioData.allConcessionarias.map((conc: string) => (
                                    <th key={conc} colSpan={2} className="p-3 border border-slate-700 text-center font-bold text-sm tracking-wide">{conc}</th>
                                ))}
                                <th colSpan={2} className="p-3 border border-slate-700 text-center font-display font-bold bg-slate-800 tracking-wide text-sm">TOTAL</th>
                            </tr>
                            <tr className="bg-blue-950 text-slate-300">
                                {portfolioData.allConcessionarias.map((conc: string) => (
                                    <React.Fragment key={conc}>
                                        <th className="p-2 border border-slate-700 text-center w-20 text-xs">UCs</th>
                                        <th className="p-2 border border-slate-700 text-center w-20 text-yellow-300/80 text-xs">MWh</th>
                                    </React.Fragment>
                                ))}
                                <th className="p-2 border border-slate-700 text-center w-20 bg-slate-800 text-xs">UCs</th>
                                <th className="p-2 border border-slate-700 text-center w-20 bg-slate-800 text-yellow-300/80 text-xs">MWh</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(portfolioData.matrix).sort().map((area, areaIdx) => {
                                const etapaOrderMap: Record<string, number> = {
                                    'Pré-protocolo': 1,
                                    'Protocolado': 2,
                                    'Operacional': 3,
                                    'Em Exclusão': 4,
                                    'Excluído': 5,
                                    'Sem Etapa': 6
                                };
                                const getW = (e: string) => {
                                    const key = Object.keys(etapaOrderMap).find(k => e.includes(k));
                                    return key ? etapaOrderMap[key] : 99;
                                };
                                const etapas = Object.keys(portfolioData.matrix[area]).sort((a, b) => getW(a) - getW(b));
                                
                                return (
                                    <React.Fragment key={area}>
                                        {etapas.map((etapa, etapaIdx) => {
                                            const rowData = portfolioData.matrix[area][etapa].rows;
                                            const totalRow = portfolioData.matrix[area][etapa].totalRow;
                                            const bgClass = areaIdx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/30';
                                            
                                            return (
                                                <tr key={`${area}-${etapa}`} className={`hover:bg-slate-700/30 transition-colors border-b border-slate-800 ${bgClass}`}>
                                                    {etapaIdx === 0 && (
                                                        <td rowSpan={etapas.length + 1} className="p-3 border border-slate-700 font-extrabold font-display text-center align-middle text-white uppercase tracking-wider text-xs">
                                                            {area}
                                                        </td>
                                                    )}
                                                    <td className="p-3 border border-slate-700 text-slate-400 font-medium text-xs">{etapa}</td>
                                                    
                                                    {portfolioData.allConcessionarias.map((conc: string) => {
                                                        const cellData = rowData[conc] || { ucs: 0, mwh: 0 };
                                                        return (
                                                            <React.Fragment key={conc}>
                                                                <td className="p-2 border border-slate-700 text-center text-slate-300 text-sm font-medium">
                                                                    {cellData.ucs > 0 ? new Intl.NumberFormat('pt-BR').format(cellData.ucs) : '-'}
                                                                </td>
                                                                <td className="p-2 border border-slate-700 text-center text-slate-400 text-sm font-medium">
                                                                    {cellData.mwh > 0 ? new Intl.NumberFormat('pt-BR').format(Math.round(cellData.mwh)) : '-'}
                                                                </td>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                    
                                                    <td className="p-2 border border-slate-700 text-center font-bold text-white bg-slate-800 text-sm">
                                                        {new Intl.NumberFormat('pt-BR').format(totalRow.ucs)}
                                                    </td>
                                                    <td className="p-2 border border-slate-700 text-center font-bold text-yellow-400 bg-slate-800 text-sm">
                                                        {new Intl.NumberFormat('pt-BR').format(Math.round(totalRow.mwh))}
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        <tr key={`${area}-subtotal`} className="bg-blue-900/20 border-y-2 border-slate-600 font-bold">
                                            <td className="p-2 border border-slate-700 text-right font-display uppercase text-[10px] tracking-wider text-blue-300">Total {area}</td>
                                            {portfolioData.allConcessionarias.map((conc: string) => {
                                                const subData = portfolioData.areaTotals[area]?.rows[conc] || { ucs: 0, mwh: 0 };
                                                return (
                                                    <React.Fragment key={conc}>
                                                        <td className="p-2 border border-slate-700 text-center text-white text-base">
                                                            {subData.ucs > 0 ? new Intl.NumberFormat('pt-BR').format(subData.ucs) : '-'}
                                                        </td>
                                                        <td className="p-2 border border-slate-700 text-center text-yellow-300/80 text-base">
                                                            {subData.mwh > 0 ? new Intl.NumberFormat('pt-BR').format(Math.round(subData.mwh)) : '-'}
                                                        </td>
                                                    </React.Fragment>
                                                );
                                            })}
                                            <td className="p-2 border border-slate-700 text-center text-white text-lg bg-blue-900/40">
                                                {new Intl.NumberFormat('pt-BR').format(portfolioData.areaTotals[area]?.totalRow.ucs || 0)}
                                            </td>
                                            <td className="p-2 border border-slate-700 text-center text-yellow-400 text-lg bg-blue-900/40">
                                                {new Intl.NumberFormat('pt-BR').format(Math.round(portfolioData.areaTotals[area]?.totalRow.mwh || 0))}
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                            
                            <tr className="bg-slate-800 font-black border-t-4 border-slate-500 shadow-xl">
                                <td colSpan={2} className="p-4 border border-slate-700 font-display text-right uppercase tracking-widest text-lg text-white">TOTAL GERAL DA CARTEIRA</td>
                                {portfolioData.allConcessionarias.map((conc: string) => (
                                    <React.Fragment key={conc}>
                                        <td className="p-3 border border-slate-700 text-center text-white text-lg">
                                            {new Intl.NumberFormat('pt-BR').format(portfolioData.concessionariaTotals[conc].ucs)}
                                        </td>
                                        <td className="p-3 border border-slate-700 text-center text-yellow-400 text-lg">
                                            {new Intl.NumberFormat('pt-BR').format(Math.round(portfolioData.concessionariaTotals[conc].mwh))}
                                        </td>
                                    </React.Fragment>
                                ))}
                                <td className="p-3 border border-slate-700 text-center text-white text-2xl bg-slate-700">
                                    {new Intl.NumberFormat('pt-BR').format(portfolioData.globalTotal.ucs)}
                                </td>
                                <td className="p-3 border border-slate-700 text-center text-yellow-400 text-2xl bg-slate-700">
                                    {new Intl.NumberFormat('pt-BR').format(Math.round(portfolioData.globalTotal.mwh))}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {currentTab === 'crm' && (
        <div className="animate-in fade-in zoom-in duration-300 flex flex-col gap-6">
            {crmProcessed.stats && (
            <div className="flex flex-col gap-5 mb-2">
                {/* Linha 1: Totais + Área de Gestão lado a lado */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                    
                    {/* Bloco 1: Totais (Span 4) */}
                    <div className="xl:col-span-4 bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-800/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-center gap-6 shadow-lg">
                        <div className="flex flex-col items-center sm:items-start">
                            <p className="text-sm font-bold font-display text-blue-300 uppercase tracking-wider mb-1">Total CRM</p>
                            <h2 className="text-4xl font-display font-extrabold text-white flex items-center gap-2">
                                <Users size={24} className="text-blue-500 opacity-50"/>
                                {new Intl.NumberFormat('pt-BR').format(crmProcessed.stats.totalUCs)} 
                                <span className="text-lg font-medium text-slate-400">UCs</span>
                            </h2>
                        </div>
                        <div className="hidden sm:block h-12 w-px bg-blue-800/50"></div>
                        <div className="flex flex-col items-center sm:items-start">
                            <p className="text-sm font-bold font-display text-blue-300 uppercase tracking-wider mb-1">Energia Total</p>
                            <h2 className="text-4xl font-display font-extrabold text-white flex items-center gap-2">
                                <Zap size={24} className="text-emerald-500 opacity-50"/>
                                {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(crmProcessed.stats.totalMwh)} 
                                <span className="text-lg font-medium text-slate-400">MWh</span>
                            </h2>
                        </div>
                    </div>

                    {/* Bloco 2: Área de Gestão (Span 8) */}
                    <div className="xl:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-center">
                        <h3 className="text-xs font-bold font-display text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Briefcase size={14}/> Por Área de Gestão</h3>
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/50">
                            {Object.entries(crmProcessed.stats.byArea).sort((a: any, b: any) => {
                                if (a[0] === 'Outros') return 1;
                                if (b[0] === 'Outros') return -1;
                                return b[1].count - a[1].count;
                            }).map(([key, val]: any) => (
                                <CrmKpiCard key={key} title={key} count={new Intl.NumberFormat('pt-BR').format(val.count)} mwh={val.mwh} color="blue" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Linha 2: Etapa do Funil ocupando 100% da largura */}
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
                    <h3 className="text-xs font-bold font-display text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><TrendingUp size={14}/> Por Etapa do Funil</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/50">
                        {crmProcessed.options.etapas.filter((k: string) => k !== 'Todas').map((key: string) => {
                            const val = crmProcessed.stats.byEtapa[key];
                            if (!val) return null; 
                            return <CrmKpiCard key={key} title={key} count={new Intl.NumberFormat('pt-BR').format(val.count)} mwh={val.mwh} color="amber" />;
                        })}
                    </div>
                </div>
            </div>
            )}

            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-display font-bold text-white flex items-center gap-2"><Users className="text-blue-500" size={24}/> Base de Clientes (CRM)</h2>
                    </div>
                    <div className="text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
                        Exibindo {crmProcessed.filtered.length} Registros
                    </div>
                </div>

                <div className="flex flex-col flex-1">
                    <div className="overflow-auto min-h-[400px]">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-950 font-semibold tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-800">
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
                                {paginatedCrmData.map((row: any, idx) => (
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
                                {paginatedCrmData.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-12 text-slate-500">Nenhum registro encontrado.</td></tr>
                                )}
                            </tbody>
                            <tfoot className="sticky bottom-0 bg-slate-900 border-t border-slate-700 font-bold text-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-10">
                                <tr>
                                    <td colSpan={6} className="px-6 py-3 text-right font-display uppercase text-xs tracking-wider text-slate-500">Total Filtrado</td>
                                    <td className="px-6 py-3 text-right text-yellow-400 font-mono border-l border-slate-700 text-lg">
                                        {crmProcessed.stats ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(crmProcessed.stats.totalMwh) : 0}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <Pagination page={crmPage} totalPages={totalCrmPages} setPage={setCrmPage} totalItems={crmProcessed.filtered.length} />
                </div>
            </div>
        </div>
      )}

      {currentTab === 'auditoria' && (
        <div className="animate-in fade-in zoom-in duration-300 flex flex-col gap-6">
            {auditData && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10"><ClipboardList size={80} className="text-blue-500"/></div>
                        <p className="text-xs font-bold font-display text-slate-400 uppercase tracking-wider mb-2">Total de UCs Analisadas</p>
                        <h2 className="text-4xl font-display font-extrabold text-white">{new Intl.NumberFormat('pt-BR').format(auditData.stats.totalAnalisados)}</h2>
                    </div>

                    <div className="bg-slate-900 rounded-2xl border border-rose-900/50 shadow-lg p-6 relative overflow-hidden bg-gradient-to-br from-slate-900 to-rose-950/20">
                        <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldAlert size={80} className="text-rose-500"/></div>
                        <p className="text-xs font-bold font-display text-rose-400 uppercase tracking-wider mb-2">Com Inconsistência (Filtrado)</p>
                        <h2 className="text-4xl font-display font-extrabold text-rose-500">{new Intl.NumberFormat('pt-BR').format(auditData.issues.length)} <span className="text-sm text-slate-400 font-medium">UCs</span></h2>
                    </div>

                    <div className="bg-slate-900 rounded-2xl border border-emerald-900/50 shadow-lg p-6 relative overflow-hidden bg-gradient-to-br from-slate-900 to-emerald-950/20">
                        <div className="absolute top-0 right-0 p-6 opacity-10"><CheckCircle2 size={80} className="text-emerald-500"/></div>
                        <p className="text-xs font-bold font-display text-emerald-400 uppercase tracking-wider mb-2">% de Integridade (Data Quality)</p>
                        <h2 className="text-4xl font-display font-extrabold text-emerald-500">{auditData.stats.percIntegridade}%</h2>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden flex flex-col mt-4">
                    <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2"><ShieldAlert className="text-rose-500" size={24}/> Relatório de Auditoria</h2>
                            <p className="text-sm text-slate-400">Campos obrigatórios faltantes baseado nas regras de SLA de cada Etapa.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button 
                                onClick={() => downloadAuditCSV(auditData.issues, 'relatorio_auditoria')} 
                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Download size={16} /> Baixar CSV
                            </button>
                            <div className="text-xs text-rose-400 font-mono bg-rose-950/30 px-3 py-2 rounded border border-rose-900/50">
                                Exibindo {auditData.issues.length} pendências
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col flex-1">
                        <div className="overflow-x-auto min-h-[400px]">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-950 font-semibold tracking-wider border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4">UC / Negócio</th>
                                        <th className="px-6 py-4">Status / Etapa</th>
                                        <th className="px-6 py-4 w-1/3">Inconsistência(s) Encontrada(s)</th>
                                        <th className="px-6 py-4 text-center">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {paginatedAuditData.map((row: any, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-slate-200">{row.uc}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-[250px]" title={row.nome_negocio}>{row.nome_negocio || '-'}</div>
                                                <div className="text-[10px] text-slate-600 mt-1">{row.concessionaria} • {row.area_de_gestao}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-medium text-slate-300">{row.objetivo_etapa || '-'}</div>
                                                <div className="text-[10px] text-slate-500 mt-1">{row.status_rd || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {row.missingFields.map((field: string, fIdx: number) => (
                                                        <span key={fIdx} className="bg-rose-950/40 text-rose-400 border border-rose-900/50 px-2 py-0.5 rounded text-[10px] font-medium tracking-wide">
                                                            Falta: {field}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {row.rdLink ? (
                                                    <a 
                                                        href={row.rdLink} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                                    >
                                                        <ExternalLink size={14} /> Corrigir no RD
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-slate-600 italic">ID não encontrado</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedAuditData.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-16">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="bg-emerald-500/10 p-4 rounded-full mb-4">
                                                        <CheckCircle2 size={48} className="text-emerald-500" />
                                                    </div>
                                                    <h3 className="text-lg font-bold font-display text-white">Nenhuma pendência encontrada!</h3>
                                                    <p className="text-slate-400 mt-1">Para os filtros selecionados, a base está íntegra.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={auditPage} totalPages={totalAuditPages} setPage={setAuditPage} totalItems={auditData.issues.length} />
                    </div>
                </div>
                </>
            )}
        </div>
      )}

      {currentTab === 'localizacao' && (
        <div className="animate-in fade-in zoom-in duration-300 h-[calc(100vh-200px)] flex flex-col">
            <div className="bg-slate-900 p-4 rounded-t-2xl border border-slate-800 border-b-0 flex flex-wrap gap-3 items-center z-10">
                <span className="text-sm font-bold font-display text-slate-400 mr-2 flex items-center gap-2"><Filter size={16}/> Filtros do Mapa:</span>
                <div className="w-full md:w-48">
                    <MultiSelect 
                        options={crmProcessed.options.concessionarias.filter(o => o !== 'Todas')} 
                        selected={crmFilterConcessionaria} onChange={setCrmFilterConcessionaria} placeholder="Concessionárias" 
                    />
                </div>
                <div className="w-full md:w-48">
                    <MultiSelect 
                        options={crmProcessed.options.areas.filter(o => o !== 'Todas')} 
                        selected={crmFilterArea} onChange={setCrmFilterArea} placeholder="Áreas" 
                    />
                </div>
                <div className="w-full md:w-48">
                    <MultiSelect 
                        options={crmProcessed.options.etapas.filter(o => o !== 'Todas')} 
                        selected={crmFilterEtapa} onChange={setCrmFilterEtapa} placeholder="Etapas" 
                    />
                </div>
                <div className="ml-auto text-xs text-slate-500">
                    {new Intl.NumberFormat('pt-BR').format(crmProcessed.filtered.length)} clientes listados
                </div>
            </div>

            <div className="bg-slate-900 flex-1 rounded-b-2xl border border-slate-800 shadow-lg overflow-hidden relative">
               <ClientMap clients={crmProcessed.filtered} />
            </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;