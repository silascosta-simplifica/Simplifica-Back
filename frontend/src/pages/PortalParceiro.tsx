import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';
import { 
    LogOut, Table as TableIcon, Search, Settings2, Check, 
    ChevronDown, ChevronLeft, ChevronRight, KeyRound, CheckCircle2, ShieldAlert, Loader2,
    Zap, PiggyBank, Receipt, Download, PlayCircle, Wallet, Users, FileText, Printer, Activity, FileDown, TrendingUp, ExternalLink
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const MultiSelect = ({ options, selected, onChange, placeholder, icon: Icon, fullWidth = false, searchable = false }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [termoBusca, setTermoBusca] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: any) => { 
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setTermoBusca(''); 
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (option: string) => {
        if (selected.includes(option)) onChange(selected.filter((item: string) => item !== option));
        else onChange([...selected, option]);
    };

    const displayValue = selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} selecionados`;
    const opcoesFiltradas = searchable && termoBusca ? options.filter((o: string) => o.toLowerCase().includes(termoBusca.toLowerCase())) : options;

    return (
        <div className={`relative ${fullWidth ? 'w-full' : ''}`} ref={containerRef}>
            <button onClick={() => setIsOpen(!isOpen)} className={`bg-slate-800 border ${isOpen ? 'border-yellow-500 ring-1 ring-yellow-500/50' : 'border-slate-700'} rounded-lg px-3 py-2.5 text-sm text-white outline-none flex items-center justify-between transition-all hover:bg-slate-700 w-full`}>
                <div className="flex items-center gap-2 min-w-0">
                    {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
                    <span className={`truncate ${selected.length === 0 ? 'text-slate-400' : 'text-slate-200'}`}>{displayValue}</span>
                </div>
                <ChevronDown size={14} className={`text-slate-500 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-full min-w-[220px] max-h-72 flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    {searchable && (
                        <div className="p-2 border-b border-slate-700 bg-slate-900 sticky top-0 z-10">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2 text-slate-500" size={14} />
                                <input 
                                    type="text" 
                                    value={termoBusca}
                                    onChange={(e) => setTermoBusca(e.target.value)}
                                    placeholder="Buscar..." 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-md pl-8 pr-2 py-1.5 text-xs text-white outline-none focus:border-yellow-500"
                                />
                            </div>
                        </div>
                    )}
                    <div className="overflow-y-auto flex-1 p-1 scrollbar-thin scrollbar-thumb-slate-700">
                        <div className="px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded cursor-pointer flex items-center gap-2 font-medium mb-1 border-b border-slate-800" onClick={() => onChange(selected.length > 0 ? [] : options)}>
                            {selected.length > 0 ? 'Limpar Seleção' : 'Selecionar Todos'}
                        </div>
                        {opcoesFiltradas.length > 0 ? opcoesFiltradas.map((opt: string) => (
                            <div key={opt} onClick={() => toggleOption(opt)} className="flex items-center gap-2 px-2 py-2 hover:bg-slate-800 rounded cursor-pointer group">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${selected.includes(opt) ? 'bg-yellow-500 border-yellow-500' : 'border-slate-600 group-hover:border-slate-500'}`}>
                                    {selected.includes(opt) && <Check size={10} className="text-slate-950" />}
                                </div>
                                <span className={`text-sm break-words ${selected.includes(opt) ? 'text-white font-medium' : 'text-slate-400'}`}>{opt}</span>
                            </div>
                        )) : (
                            <div className="p-3 text-center text-xs text-slate-500">Nenhum resultado</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const SingleSearchSelect = ({ options, selected, onChange, placeholder, icon: Icon, fullWidth = false }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [termoBusca, setTermoBusca] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: any) => { 
            if (containerRef.current && !containerRef.current.contains(e.target)) { setIsOpen(false); setTermoBusca(''); }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectOption = (option: string) => {
        onChange(option); 
        setIsOpen(false);
        setTermoBusca('');
    };

    const displayValue = selected ? selected : placeholder;
    const opcoesFiltradas = termoBusca ? options.filter((o: string) => o.toLowerCase().includes(termoBusca.toLowerCase())) : options;

    return (
        <div className={`relative ${fullWidth ? 'w-full' : ''}`} ref={containerRef}>
            <button onClick={() => setIsOpen(!isOpen)} className={`bg-slate-800 border ${isOpen ? 'border-yellow-500 ring-1 ring-yellow-500/50' : 'border-slate-700'} rounded-lg px-3 py-2 text-sm text-white outline-none flex items-center justify-between transition-all hover:bg-slate-700 w-full`}>
                <div className="flex items-center gap-2 min-w-0">
                    {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
                    <span className={`truncate ${selected === '' ? 'text-slate-400' : 'text-slate-200'}`}>{displayValue}</span>
                </div>
                <ChevronDown size={14} className={`text-slate-500 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-full min-w-[220px] max-h-72 flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-slate-700 bg-slate-900 sticky top-0 z-10">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2 text-slate-500" size={14} />
                            <input type="text" value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} placeholder="Buscar..." className="w-full bg-slate-950 border border-slate-700 rounded-md pl-8 pr-2 py-1.5 text-xs text-white outline-none focus:border-yellow-500"/>
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-1 scrollbar-thin scrollbar-thumb-slate-700">
                        <div className="px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded cursor-pointer font-medium border-b border-slate-800" onClick={() => selectOption('')}>Limpar Seleção</div>
                        {opcoesFiltradas.length > 0 ? opcoesFiltradas.map((opt: string) => (
                            <div key={opt} onClick={() => selectOption(opt)} className={`flex items-center gap-2 px-2 py-2 hover:bg-slate-800 rounded cursor-pointer group ${selected === opt ? 'bg-slate-800/50' : ''}`}>
                                <span className={`text-sm break-words ${selected === opt ? 'text-white font-medium' : 'text-slate-400'}`}>{opt}</span>
                            </div>
                        )) : (
                            <div className="p-3 text-center text-xs text-slate-500">Nenhum resultado</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function PortalParceiro() {
    const navigate = useNavigate();
    const parceiroLogado = localStorage.getItem('@Simplifica:parceiroLogado') || '';
    const isAdmin = parceiroLogado === 'admin';

    const { data: rawDataOriginal, loading: analyticsLoading } = useAnalytics(parceiroLogado, isAdmin);
    
    // MÁGICA AQUI: Forçando o tipo para any[] para evitar TODOS os erros de tipagem no arquivo.
    const rawData = rawDataOriginal as any[];

    const [activeTab, setActiveTab] = useState<'carteira' | 'gestao' | 'relatorio' | 'comissao'>('carteira');
    
    const [busca, setBusca] = useState('');
    const [filtroEtapa, setFiltroEtapa] = useState<string[]>([]);
    const [filtroConc, setFiltroConc] = useState<string[]>([]);
    const [filtroMes, setFiltroMes] = useState<string[]>([]);
    const [filtroStatus, setFiltroStatus] = useState<string[]>([]);
    const [filtroParceiro, setFiltroParceiro] = useState<string[]>([]); 
    const [filtroIndicador, setFiltroIndicador] = useState<string[]>([]); 
    
    const [comissaoMes, setComissaoMes] = useState<string>('');
    const [comissaoParceiro, setComissaoParceiro] = useState<string>(isAdmin ? '' : parceiroLogado);
    const [comissaoIndicador, setComissaoIndicador] = useState<string>(''); 

    const colunasOpcoes = isAdmin 
    ? ['Ações (Links)', 'Concessionária', 'Data Ganho', 'Data Protocolo', 'Data Cancelamento', 'Mês Referência', 'Etapa', 'Economia (R$)', 'Fatura Dist. (R$)', 'Eficiência (%)', 'Percentual Parceiro (%)', 'Comissão Parceiro (R$)', 'Nome Indicador', 'Percentual Indicador (%)', 'Comissão Indicador (R$)', 'Percentual Total (%)', 'Saldo (kWh)', 'Status Pagamento', 'Data Emissão', 'Vencimento', 'Código PIX', 'Código de Barras']
    : ['Ações (Links)', 'Concessionária', 'Data Ganho', 'Data Protocolo', 'Data Cancelamento', 'Mês Referência', 'Etapa', 'Economia (R$)', 'Fatura Dist. (R$)', 'Eficiência (%)', 'Percentual Parceiro (%)', 'Comissão Parceiro (R$)', 'Nome Indicador', 'Percentual Indicador (%)', 'Comissão Indicador (R$)', 'Saldo (kWh)', 'Status Pagamento', 'Data Emissão', 'Vencimento', 'Código PIX', 'Código de Barras'];

    const [colunasAtivas, setColunasAtivas] = useState<string[]>(
        isAdmin 
        ? ['Ações (Links)', 'Mês Referência', 'Etapa', 'Status Pagamento', 'Eficiência (%)', 'Comissão Parceiro (R$)', 'Nome Indicador', 'Comissão Indicador (R$)', 'Código PIX']
        : ['Ações (Links)', 'Mês Referência', 'Etapa', 'Status Pagamento', 'Eficiência (%)', 'Comissão Parceiro (R$)', 'Nome Indicador', 'Comissão Indicador (R$)', 'Código PIX']
    );

    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 25;

    const [parceirosPendentes, setParceirosPendentes] = useState<any[]>([]);
    const [parceirosAtivos, setParceirosAtivos] = useState<any[]>([]);

    const [codigosAsaas, setCodigosAsaas] = useState<Record<string, { pix?: string, barcode?: string, loading?: boolean, error?: string }>>({});
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
    
    const [relatorioUc, setRelatorioUc] = useState<string>('');
    const [buscaRelatorio, setBuscaRelatorio] = useState('');
    const [showUcDropdown, setShowUcDropdown] = useState(false);
    const dropdownRelatorioRef = useRef<HTMLDivElement>(null);
    const [loadingDownloads, setLoadingDownloads] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const handleClickOutsideDropdown = (e: any) => { 
            if (dropdownRelatorioRef.current && !dropdownRelatorioRef.current.contains(e.target)) setShowUcDropdown(false);
        };
        document.addEventListener('mousedown', handleClickOutsideDropdown);
        return () => document.removeEventListener('mousedown', handleClickOutsideDropdown);
    }, []);

    useEffect(() => {
        if (!parceiroLogado) { navigate('/login-parceiro'); return; }
        if (isAdmin && activeTab === 'gestao') fetchAcessos();
    }, [parceiroLogado, isAdmin, navigate, activeTab]);

    const fetchAcessos = async () => {
        const { data: pendentes } = await supabase.from('view_parceiros_sem_acesso').select('*');
        const { data: ativos } = await supabase.from('parceiros_auth').select('*').neq('nome_parceiro', 'admin');
        setParceirosPendentes(pendentes || []);
        setParceirosAtivos(ativos || []);
    };

    const gerarSenha = async (nomeParceiro: string) => {
        const senhaAleatoria = Math.random().toString(36).slice(-6) + Math.floor(Math.random() * 100);
        const { error } = await supabase.from('parceiros_auth').insert({ nome_parceiro: nomeParceiro, senha: senhaAleatoria });
        if (!error) fetchAcessos();
        else alert('Erro ao gerar senha: ' + error.message);
    };

    const handleLogout = () => {
        localStorage.removeItem('@Simplifica:parceiroLogado');
        navigate('/login-parceiro');
    };

    const setBtnLoading = (id: string, isLoading: boolean) => setLoadingDownloads(prev => ({ ...prev, [id]: isLoading }));

    const handleDownloadGestao = async (uc: string, mesRef: string, type: 'FATURA'|'BOLETO', buttonId: string) => {
        if (!uc || !mesRef) return;
        setBtnLoading(buttonId, true);
        try {
            const strMesRef = String(mesRef);
            const parts = strMesRef.split('/');
            let refYm = strMesRef;
            if (parts.length === 2) refYm = `${parts[1]}-${parts[0]}`;
            const { data, error } = await supabase.functions.invoke('gestao-docs', { body: { uc: uc, mes_ref: refYm, tipo: type }});
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            if (!data?.url) throw new Error("A plataforma não devolveu a URL.");
            window.open(data.url, '_blank');
        } catch (err: any) { alert(`Falha ao buscar ${type}. Detalhe: ${err.message}`); } finally { setBtnLoading(buttonId, false); }
    };

    const handleDownloadBoletoLumi = async (uc: string, mesRef: string, buttonId: string) => {
        if (!uc || !mesRef) return;
        setBtnLoading(buttonId, true);
        try {
            const { data, error } = await supabase.functions.invoke('lumi-boleto', { body: { uc, mes_referencia: mesRef } });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            const byteCharacters = atob(data.pdfBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const safeMesRef = String(mesRef).replace('/', '-');
            link.setAttribute('download', `Boleto_${uc}_${safeMesRef}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err: any) { alert(`Falha ao buscar Boleto na Lumi. Detalhe: ${err.message}`); } finally { setBtnLoading(buttonId, false); }
    };

    const handleGerarCodigos = async (asaasId: string, chaveLinha: string) => {
        if (!asaasId) return;
        setCodigosAsaas(prev => ({ ...prev, [chaveLinha]: { loading: true } }));
        try {
            const { data, error } = await supabase.functions.invoke('asaas-cobranca', { body: { asaas_id: asaasId } });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            const pixResult = data.pix || (data.error_pix ? `Erro: ${data.error_pix}` : 'Pix indisponível para esta cobrança');
            const barcodeResult = data.barcode || (data.error_barcode ? `Erro: ${data.error_barcode}` : 'Código indisponível');
            setCodigosAsaas(prev => ({ ...prev, [chaveLinha]: { pix: pixResult, barcode: barcodeResult, loading: false } }));
        } catch (err: any) {
            setCodigosAsaas(prev => ({ ...prev, [chaveLinha]: { loading: false, error: err.message } }));
            alert('Erro na integração Asaas: ' + err.message);
        }
    };

    const handleGerarMassa = async () => {
        if (!isAdmin || filtroParceiro.length === 0) { alert("Selecione ao menos um parceiro no filtro para gerar códigos em massa."); return; }
        const itemsToProcess = filteredData.filter((r: any) => {
            const isPago = getPaymentBadge(r.status).text === 'Pago';
            const canGeneratePix = r.quem_indicou === 'Alexandria - LEX'; 
            return r.asaas_id && !r.codigo_pix && !codigosAsaas[r.id_chave_composta]?.pix && !isPago && canGeneratePix;
        });

        if (itemsToProcess.length === 0) { alert("Nenhum boleto Lumi elegível e pendente de geração para este(s) parceiro(s)."); return; }
        if (!confirm(`Deseja gerar os códigos de ${itemsToProcess.length} faturas pendentes agora?`)) return;

        setIsBulkLoading(true);
        setBulkProgress({ current: 0, total: itemsToProcess.length });

        for (let i = 0; i < itemsToProcess.length; i++) {
            const row = itemsToProcess[i];
            const chave = row.id_chave_composta || `${row.uc}-${row.mes_referencia}`;
            setCodigosAsaas(prev => ({ ...prev, [chave]: { loading: true } }));

            try {
                const { data, error } = await supabase.functions.invoke('asaas-cobranca', { body: { asaas_id: row.asaas_id } });
                if (!error && !data?.error) {
                    const pixResult = data.pix || (data.error_pix ? `Erro Asaas: ${data.error_pix}` : 'Pix indisponível');
                    const barcodeResult = data.barcode || (data.error_barcode ? `Erro Asaas: ${data.error_barcode}` : 'Código indisponível');
                    setCodigosAsaas(prev => ({ ...prev, [chave]: { pix: pixResult, barcode: barcodeResult, loading: false } }));
                } else {
                    setCodigosAsaas(prev => ({ ...prev, [chave]: { loading: false, error: data?.error || 'Erro' } }));
                }
            } catch (err: any) { setCodigosAsaas(prev => ({ ...prev, [chave]: { loading: false, error: 'Falha na rede' } })); }
            setBulkProgress({ current: i + 1, total: itemsToProcess.length });
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        setIsBulkLoading(false);
    };

    const getPaymentBadge = (status: string) => {
        const sNorm = (status || '').toUpperCase();
        if (['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH', 'PAID', 'LIQUIDATED'].includes(sNorm)) return { color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800', text: 'Pago' };
        if (['OVERDUE', 'LATE'].includes(sNorm)) return { color: 'text-rose-400', bg: 'bg-rose-900/40 border-rose-800', text: 'Atrasado' };
        if (['SENT', 'OPEN', 'AWAITING_PAYMENT', 'PENDING'].includes(sNorm)) return { color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-800', text: 'Aberto' };
        return { color: 'text-slate-500', bg: 'bg-transparent', text: '-' };
    };

    const formatMoney = (val: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);
    const toDateBR = (d: any) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }); } catch { return '-'; } };
    
    const formatMesRef = (m: any) => { 
        if (!m) return '-'; 
        const strM = String(m);
        const parts = strM.split('-'); 
        if (parts.length >= 2) return `${parts[1]}/${parts[0]}`; 
        return strM; 
    };

    const getSortableDate = (mesRef: any) => {
        if (!mesRef || mesRef === 'N/D' || mesRef === '-') return 0;
        const str = String(mesRef);
        if (str.includes('/')) {
            const parts = str.split('/');
            if (parts.length === 2) return parseInt(parts[1]) * 100 + parseInt(parts[0]); 
        } else if (str.includes('-')) {
            const parts = str.split('-');
            if (parts.length >= 2) return parseInt(parts[0]) * 100 + parseInt(parts[1]); 
        }
        return 0;
    };

    const data = useMemo(() => {
        if (!rawData) return [];
        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth() + 1; 

        let dadosTratados = rawData.filter((d: any) => {
            if (d.fonte_dados === 'RD') return false; 
            if (!d.mes_referencia || d.mes_referencia === 'N/D' || d.mes_referencia === '-') return true; 
            const strMes = String(d.mes_referencia);
            if (strMes.includes('-')) {
                const parts = strMes.split('-');
                if (parts.length >= 2) {
                    if (Number(parts[0]) > anoAtual) return false; 
                    if (Number(parts[0]) === anoAtual && Number(parts[1]) > mesAtual) return false; 
                }
            } else if (strMes.includes('/')) {
                const parts = strMes.split('/');
                if (parts.length === 2) {
                    if (Number(parts[1]) > anoAtual) return false;
                    if (Number(parts[1]) === anoAtual && Number(parts[0]) > mesAtual) return false;
                }
            }
            return true;
        });

        let finalData = isAdmin ? dadosTratados : dadosTratados.filter((d: any) => d.quem_indicou === parceiroLogado);
        return [...finalData].sort((a: any, b: any) => getSortableDate(b.mes_referencia) - getSortableDate(a.mes_referencia));
    }, [rawData, isAdmin, parceiroLogado]);

    const ucsUnicas = useMemo(() => {
        const map = new Map();
        data.forEach(d => { if(!map.has(d.uc)) map.set(d.uc, `${d.uc} - ${d.nome_cliente}`); });
        return Array.from(map.entries()).map(([uc, label]) => ({ uc, label })).sort((a,b) => a.label.localeCompare(b.label));
    }, [data]);

    // OPÇÕES DE FILTROS GERAIS
    const optEtapas = Array.from(new Set(data.map(d => d.objetivo_etapa))).sort();
    const optConc = Array.from(new Set(data.map(d => d.concessionaria))).sort();
    const optParceiros = Array.from(new Set(data.map(d => d.quem_indicou))).filter(Boolean).sort();
    const optStatus = ['Pago', 'Atrasado', 'Aberto', '-'];
    
    // OPÇÕES DE INDICADOR EM CASCATA PARA A TELA DE CARTEIRA
    const optIndicadores = useMemo(() => {
        let baseData = data;
        if (filtroParceiro.length > 0) {
            baseData = baseData.filter(d => filtroParceiro.includes(d.quem_indicou));
        }
        return Array.from(new Set(baseData.map(d => d.nome_indicador))).filter(i => i && i !== '-').sort();
    }, [data, filtroParceiro]);

    // OPÇÕES DE INDICADOR EM CASCATA PARA O RELATÓRIO DE COMISSÃO
    const optIndicadoresComissao = useMemo(() => {
        let baseData = data;
        if (comissaoParceiro) {
            baseData = baseData.filter(d => d.quem_indicou === comissaoParceiro);
        }
        return Array.from(new Set(baseData.map(d => d.nome_indicador))).filter(i => i && i !== '-').sort();
    }, [data, comissaoParceiro]);

    const optMes = Array.from(new Set(data.map(d => formatMesRef(d.mes_referencia))))
        .filter(m => m !== '-')
        .sort((a: any, b: any) => {
            const [mA, yA] = a.split('/'); const [mB, yB] = b.split('/');
            return new Date(yB, mB - 1).getTime() - new Date(yA, mA - 1).getTime();
        });

    useEffect(() => { if (optMes.length > 0 && !comissaoMes) setComissaoMes(optMes[0]); }, [optMes, comissaoMes]);

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const s = busca.toLowerCase();
            const matchBusca = !s || ((item.uc || '').toLowerCase().includes(s)) || ((item.nome_cliente || '').toLowerCase().includes(s));
            const matchEtapa = filtroEtapa.length === 0 || filtroEtapa.includes(item.objetivo_etapa);
            const matchConc = filtroConc.length === 0 || filtroConc.includes(item.concessionaria);
            const matchMes = filtroMes.length === 0 || filtroMes.includes(formatMesRef(item.mes_referencia));
            const matchStatus = filtroStatus.length === 0 || filtroStatus.includes(getPaymentBadge(item.status).text);
            const matchParceiro = filtroParceiro.length === 0 || filtroParceiro.includes(item.quem_indicou);
            const matchIndicador = filtroIndicador.length === 0 || filtroIndicador.includes(item.nome_indicador);

            return matchBusca && matchEtapa && matchConc && matchMes && matchStatus && matchParceiro && matchIndicador;
        });
    }, [data, busca, filtroEtapa, filtroConc, filtroMes, filtroStatus, filtroParceiro, filtroIndicador]);

    const metrics = useMemo(() => {
        const uniqueUcs = new Set();
        const totals = filteredData.reduce((acc, row) => {
            if (!uniqueUcs.has(row.uc)) {
                uniqueUcs.add(row.uc);
                acc.saldoAtual += (row.saldo || 0);
            }
            
            acc.consumo += (row.consumo_kwh || 0);
            acc.compensacao += (row.compensacao_kwh || 0);
            acc.boleto += (row.boleto_simplifica || 0);
            acc.economia += (row.economia_rs || 0);

            const badge = getPaymentBadge(row.status);
            if (badge.text === 'Pago') {
                let baseCalculoComissao = row.valor_real_cobranca || row.boleto_simplifica || 0;
                if ((row.concessionaria || '').toUpperCase().includes('EQUATORIAL') && (row.concessionaria || '').toUpperCase().includes('GO') && (row.is_consorcio || '').toUpperCase() === 'SIM') {
                    baseCalculoComissao = Math.max(0, (row.valor_real_cobranca || row.boleto_simplifica || 0) - (row.valor_fatura_distribuidora || 0));
                }
                
                acc.comissaoParceiro += (baseCalculoComissao * ((row.perc_parceiro_rec || 0) / 100));
                acc.comissaoIndicador += (baseCalculoComissao * ((row.perc_indicador_rec || 0) / 100));
            }

            return acc;
        }, { consumo: 0, compensacao: 0, boleto: 0, economia: 0, comissaoParceiro: 0, comissaoIndicador: 0, saldoAtual: 0 });

        return { ...totals, totalUcs: uniqueUcs.size, comissaoTotalGeral: totals.comissaoParceiro + totals.comissaoIndicador };
    }, [filteredData]);

    const paginatedData = filteredData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    const handleDownloadCSV = () => {
        if (filteredData.length === 0) return;

        const headers = ['UC', 'Cliente'];
        if (isAdmin) headers.push('Parceiro Dono');
        headers.push('Consumo (kWh)', 'Compensacao (kWh)', 'Boleto (R$)');
        
        if (colunasAtivas.includes('Fatura Dist. (R$)')) headers.push('Fatura Dist. (R$)');
        if (colunasAtivas.includes('Eficiência (%)')) headers.push('Eficiência (%)');
        
        if (colunasAtivas.includes('Percentual Parceiro (%)')) headers.push('Percentual Parceiro (%)');
        if (colunasAtivas.includes('Comissão Parceiro (R$)')) headers.push('Comissao Parceiro (R$)');
        if (colunasAtivas.includes('Nome Indicador')) headers.push('Nome Indicador');
        if (colunasAtivas.includes('Percentual Indicador (%)')) headers.push('Percentual Indicador (%)');
        if (colunasAtivas.includes('Comissão Indicador (R$)')) headers.push('Comissao Indicador (R$)');
        if (colunasAtivas.includes('Percentual Total (%)')) headers.push('Percentual Total (%)');

        if (colunasAtivas.includes('Saldo (kWh)')) headers.push('Saldo (kWh)');
        if (colunasAtivas.includes('Etapa')) headers.push('Etapa');
        if (colunasAtivas.includes('Status Pagamento')) headers.push('Status Pagamento');
        if (colunasAtivas.includes('Concessionária')) headers.push('Concessionaria');
        if (colunasAtivas.includes('Mês Referência')) headers.push('Mes Referencia');
        if (colunasAtivas.includes('Economia (R$)')) headers.push('Economia (R$)');
        if (colunasAtivas.includes('Data Ganho')) headers.push('Data Ganho');
        if (colunasAtivas.includes('Data Protocolo')) headers.push('Data Protocolo');
        if (colunasAtivas.includes('Data Cancelamento')) headers.push('Data Cancelamento');
        if (colunasAtivas.includes('Data Emissão')) headers.push('Data Emissao');
        if (colunasAtivas.includes('Vencimento')) headers.push('Vencimento');
        if (colunasAtivas.includes('Código PIX')) headers.push('Codigo PIX');
        if (colunasAtivas.includes('Código de Barras')) headers.push('Codigo de Barras');

        const csvRows = filteredData.map(row => {
            const badge = getPaymentBadge(row.status);
            const isPago = badge.text === 'Pago';
            
            const rowData = [row.uc, row.nome_cliente];
            if (isAdmin) rowData.push(row.quem_indicou || '-');
            
            rowData.push(row.consumo_kwh, row.compensacao_kwh, row.boleto_simplifica);

            let valComissaoParc = 0; let valComissaoInd = 0;
            if (isPago) {
                let baseCalc = row.valor_real_cobranca || row.boleto_simplifica || 0;
                if ((row.concessionaria || '').toUpperCase().includes('EQUATORIAL') && (row.concessionaria || '').toUpperCase().includes('GO') && (row.is_consorcio || '').toUpperCase() === 'SIM') {
                    baseCalc = Math.max(0, (row.valor_real_cobranca || row.boleto_simplifica || 0) - (row.valor_fatura_distribuidora || 0));
                }
                valComissaoParc = baseCalc * ((row.perc_parceiro_rec || 0) / 100);
                valComissaoInd = baseCalc * ((row.perc_indicador_rec || 0) / 100);
            }

            if (colunasAtivas.includes('Fatura Dist. (R$)')) rowData.push(row.valor_fatura_distribuidora || 0);
            if (colunasAtivas.includes('Eficiência (%)')) rowData.push(row.eficiencia_compensacao > 0 ? (row.eficiencia_compensacao * 100).toFixed(1) + '%' : '-');
            
            if (colunasAtivas.includes('Percentual Parceiro (%)')) rowData.push(row.perc_parceiro_rec > 0 ? `${row.perc_parceiro_rec}%` : '-');
            if (colunasAtivas.includes('Comissão Parceiro (R$)')) rowData.push(isPago && valComissaoParc > 0 ? valComissaoParc : '-');
            if (colunasAtivas.includes('Nome Indicador')) rowData.push(row.nome_indicador || '-');
            if (colunasAtivas.includes('Percentual Indicador (%)')) rowData.push(row.perc_indicador_rec > 0 ? `${row.perc_indicador_rec}%` : '-');
            if (colunasAtivas.includes('Comissão Indicador (R$)')) rowData.push(isPago && valComissaoInd > 0 ? valComissaoInd : '-');
            if (colunasAtivas.includes('Percentual Total (%)')) rowData.push(row.perc_total_rec > 0 ? `${row.perc_total_rec}%` : '-');

            if (colunasAtivas.includes('Saldo (kWh)')) rowData.push(row.saldo || 0);
            if (colunasAtivas.includes('Etapa')) rowData.push(row.objetivo_etapa || '-');
            if (colunasAtivas.includes('Status Pagamento')) rowData.push(badge.text !== '-' ? badge.text : '');
            if (colunasAtivas.includes('Concessionária')) rowData.push(row.concessionaria || '-');
            if (colunasAtivas.includes('Mês Referência')) rowData.push(formatMesRef(row.mes_referencia));
            if (colunasAtivas.includes('Economia (R$)')) rowData.push(row.economia_rs || 0);
            if (colunasAtivas.includes('Data Ganho')) rowData.push(toDateBR(row.data_ganho));
            if (colunasAtivas.includes('Data Protocolo')) rowData.push(toDateBR(row.data_protocolo));
            if (colunasAtivas.includes('Data Cancelamento')) rowData.push(toDateBR(row.data_cancelamento));
            if (colunasAtivas.includes('Data Emissão')) rowData.push(toDateBR(row.data_emissao));
            if (colunasAtivas.includes('Vencimento')) rowData.push(toDateBR(row.vencimento));
            
            const cPix = isPago ? 'FATURA PAGA' : (row.codigo_pix || codigosAsaas[row.id_chave_composta]?.pix || '-');
            const cBar = isPago ? 'FATURA PAGA' : (row.codigo_barras || codigosAsaas[row.id_chave_composta]?.barcode || '-');

            if (colunasAtivas.includes('Código PIX')) rowData.push(cPix);
            if (colunasAtivas.includes('Código de Barras')) rowData.push(cBar);

            return rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';');
        });

        const csvContent = [headers.join(';'), ...csvRows].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const safeName = parceiroLogado.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.setAttribute('download', `Carteira_${safeName}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const relatorioData = useMemo(() => {
        if (!relatorioUc) return null;
        
        const historico = data.filter(d => d.uc === relatorioUc).sort((a:any, b:any) => {
            const strMesA = String(a.mes_referencia || '0/0');
            const strMesB = String(b.mes_referencia || '0/0');
            const [mA, yA] = strMesA.includes('/') ? strMesA.split('/') : strMesA.split('-').reverse(); 
            const [mB, yB] = strMesB.includes('/') ? strMesB.split('/') : strMesB.split('-').reverse();
            return new Date(Number(yA), Number(mA) - 1).getTime() - new Date(Number(yB), Number(mB) - 1).getTime();
        });

        if (historico.length === 0) return null;

        const infoCadastral = historico[historico.length - 1]; 
        let totalEco = 0; let custoCom = 0; let custoSem = 0; let totalConsumo = 0; let totalComp = 0; let countFaturasValidas = 0;
        let sumEficiencia = 0; let countEficiencia = 0; let chartData: any[] = [];

        historico.forEach(row => {
            totalEco += (row.economia_rs || 0); totalComp += (row.compensacao_kwh || 0); totalConsumo += (row.consumo_kwh || 0);
            let isEqGoConsorcio = (row.concessionaria || '').toUpperCase().includes('EQUATORIAL') && (row.concessionaria || '').toUpperCase().includes('GO') && (row.is_consorcio || '').toUpperCase() === 'SIM';
            let pagoSimplifica = row.boleto_simplifica || 0;
            let faturaDist = row.valor_fatura_distribuidora || 0;
            let economia = row.economia_rs || 0;

            let pagoTotalCliente = isEqGoConsorcio ? pagoSimplifica : (pagoSimplifica + faturaDist);
            let valorSemSimplifica = pagoTotalCliente + economia;

            custoCom += pagoTotalCliente; custoSem += valorSemSimplifica;
            if (valorSemSimplifica > 0) countFaturasValidas++;
            if (row.eficiencia_compensacao > 0) { sumEficiencia += row.eficiencia_compensacao; countEficiencia++; }

            if (row.mes_referencia && row.mes_referencia !== 'N/D') {
                chartData.push({
                    mes: formatMesRef(row.mes_referencia), consumo: row.consumo_kwh || 0, compensacao: row.compensacao_kwh || 0, economia: row.economia_rs || 0
                });
            }
        });

        return {
            infoCadastral, totalEco, custoCom, custoSem, totalConsumo, totalComp,
            eficienciaMedia: countEficiencia > 0 ? (sumEficiencia / countEficiencia) * 100 : 0,
            mesesGratis: (countFaturasValidas > 0 ? custoSem / countFaturasValidas : 0) > 0 ? (totalEco / (countFaturasValidas > 0 ? custoSem / countFaturasValidas : 0)) : 0,
            chartData: chartData.slice(-12), ultimasFaturas: [...historico].reverse().slice(0, 6)
        };
    }, [relatorioUc, data]);

    const relatorioComissaoData = useMemo(() => {
        if (!comissaoMes || !comissaoParceiro) return null;

        const filtered = data.filter(row => {
            const isMes = formatMesRef(row.mes_referencia) === comissaoMes;
            const isParceiro = row.quem_indicou === comissaoParceiro;
            const isPago = getPaymentBadge(row.status).text === 'Pago';
            
            // Adicionado o filtro de indicador no relatório
            const matchIndicador = comissaoIndicador === '' || row.nome_indicador === comissaoIndicador;
            
            return isMes && isParceiro && isPago && matchIndicador;
        });

        if (filtered.length === 0) return null;

        let consumoTotal = 0; let compensacaoTotal = 0; let boletoTotal = 0; 
        let comissaoParceiroTotal = 0; let comissaoIndicadorTotal = 0;

        const rows = filtered.map(row => {
            let baseCalc = row.valor_real_cobranca || row.boleto_simplifica || 0;
            if ((row.concessionaria || '').toUpperCase().includes('EQUATORIAL') && (row.concessionaria || '').toUpperCase().includes('GO') && (row.is_consorcio || '').toUpperCase() === 'SIM') {
                baseCalc = Math.max(0, (row.valor_real_cobranca || row.boleto_simplifica || 0) - (row.valor_fatura_distribuidora || 0));
            }
            
            const valParceiro = baseCalc * ((row.perc_parceiro_rec || 0) / 100);
            const valIndicador = baseCalc * ((row.perc_indicador_rec || 0) / 100);

            consumoTotal += (row.consumo_kwh || 0); compensacaoTotal += (row.compensacao_kwh || 0); boletoTotal += (row.boleto_simplifica || 0); 
            comissaoParceiroTotal += valParceiro; comissaoIndicadorTotal += valIndicador;

            return { ...row, baseCalc, valParceiro, valIndicador };
        }).sort((a, b) => (a.nome_cliente || '').localeCompare(b.nome_cliente || ''));

        const uniqueConcessionariasReport = Array.from(new Set(rows.map(r => r.concessionaria))).join(' / ');

        return { 
            parceiro: comissaoParceiro, 
            indicador: comissaoIndicador,
            mes: comissaoMes, 
            concessionarias: uniqueConcessionariasReport,
            consumoTotal, 
            compensacaoTotal, 
            boletoTotal, 
            comissaoParceiroTotal, 
            comissaoIndicadorTotal, 
            comissaoTotalGeral: comissaoParceiroTotal + comissaoIndicadorTotal, 
            rows 
        };
    }, [data, comissaoMes, comissaoParceiro, comissaoIndicador]);

    if (analyticsLoading) {
        return (
          <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-white p-6 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center opacity-[0.03] pointer-events-none">
               <img src="https://www.ludfor.com.br/arquivos/0d5ce42bc0728ac08a186e725fafac7db6421507.png" alt="Background" className="w-full max-w-5xl object-contain scale-150" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
              <img src="https://www.ludfor.com.br/arquivos/0d5ce42bc0728ac08a186e725fafac7db6421507.png" alt="Simplifica Energia" className="w-full max-w-[280px] object-contain mb-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]"/>
              <Loader2 className="animate-spin h-10 w-10 text-yellow-500 mb-6" />
              <div className="text-center">
                  <h2 className="text-2xl font-bold font-display text-white tracking-wide">Bem-vindo(a), {parceiroLogado === 'admin' ? 'Administrador' : parceiroLogado}!</h2>
                  <p className="text-sm text-slate-400 mt-2 font-medium">Aguarde enquanto carregamos a sua carteira...</p>
              </div>
            </div>
          </div>
        );
    }

    return (
        <div className="min-h-screen print:min-h-0 bg-slate-950 print:bg-white text-white print:text-black font-sans flex flex-col">
            
            {activeTab === 'relatorio' && (
                <style>{`@media print { @page { size: A4 portrait; margin: 10mm; } html, body, #root { background-color: #ffffff !important; color: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; height: auto !important; min-height: 100% !important; display: block !important; margin: 0 !important; padding: 0 !important; } #relatorio-print-container { margin-top: 15mm !important; } .recharts-responsive-container { width: 100% !important; height: 220px !important; margin-bottom: 80px !important; } .print-break-avoid { page-break-inside: avoid !important; break-inside: avoid !important; } }`}</style>
            )}

            {activeTab === 'comissao' && (
                <style>{`@media print { @page { size: A4 landscape; margin: 10mm; } html, body, #root { background-color: #ffffff !important; color: #000000 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; height: auto !important; min-height: 100% !important; display: block !important; margin: 0 !important; padding: 0 !important; } .print-break-avoid { page-break-inside: avoid !important; break-inside: avoid !important; } }`}</style>
            )}

            <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40 print:hidden">
                <div className="flex items-center gap-4">
                    <img src="https://www.ludfor.com.br/arquivos/0d5ce42bc0728ac08a186e725fafac7db6421507.png" alt="Simplifica" className="h-8" />
                    <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>
                    <div className="hidden sm:block">
                        <h1 className="text-lg font-bold font-display text-white">Portal do Parceiro</h1>
                        <p className="text-xs text-yellow-500 font-medium">Acesso: {parceiroLogado}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800 overflow-x-auto max-w-full">
                        <button onClick={() => setActiveTab('carteira')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'carteira' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><TableIcon size={16}/> Carteira</button>
                        <button onClick={() => setActiveTab('relatorio')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'relatorio' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><FileText size={16}/> Relatório Cliente</button>
                        {isAdmin && <button onClick={() => setActiveTab('comissao')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'comissao' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><Wallet size={16}/> Relatório Comissão</button>}
                        {isAdmin && <button onClick={() => setActiveTab('gestao')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'gestao' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><KeyRound size={16}/> Senhas</button>}
                    </div>
                    <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-2 text-sm font-bold"><LogOut size={18} /> Sair</button>
                </div>
            </header>

            <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1600px] w-full mx-auto print:p-0 print:m-0 print:block print:bg-white">
                
                {activeTab === 'carteira' && (
                    <div className="print:hidden space-y-6 flex-1 flex flex-col">
                        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-9 gap-3 animate-in fade-in zoom-in duration-300">
                            
                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-sm flex flex-col gap-1 justify-center min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <Users size={14} className="text-indigo-400 shrink-0"/>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">UCs Vinculadas</p>
                                </div>
                                <p className="text-lg xl:text-xl font-bold font-display text-white truncate w-full" title={new Intl.NumberFormat('pt-BR').format(metrics.totalUcs)}>{new Intl.NumberFormat('pt-BR').format(metrics.totalUcs)}</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-sm flex flex-col gap-1 justify-center min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <Zap size={14} className="text-blue-500 shrink-0"/>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">Consumo Real</p>
                                </div>
                                <p className="text-lg xl:text-xl font-bold font-display text-white truncate w-full" title={Math.round(metrics.consumo).toLocaleString('pt-BR')}>{Math.round(metrics.consumo).toLocaleString('pt-BR')} <span className="text-xs text-slate-400 font-normal">kWh</span></p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-sm flex flex-col gap-1 justify-center min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <Zap size={14} className="text-emerald-500 shrink-0"/>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">Compensação</p>
                                </div>
                                <p className="text-lg xl:text-xl font-bold font-display text-white truncate w-full" title={Math.round(metrics.compensacao).toLocaleString('pt-BR')}>{Math.round(metrics.compensacao).toLocaleString('pt-BR')} <span className="text-xs text-slate-400 font-normal">kWh</span></p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-sm flex flex-col gap-1 justify-center min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <Receipt size={14} className="text-yellow-500 shrink-0"/>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">Faturamento</p>
                                </div>
                                <p className="text-lg xl:text-xl font-bold font-display text-white truncate w-full" title={formatMoney(metrics.boleto)}>{formatMoney(metrics.boleto)}</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-sm flex flex-col gap-1 justify-center min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <PiggyBank size={14} className="text-emerald-400 shrink-0"/>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">Economia Cliente</p>
                                </div>
                                <p className="text-lg xl:text-xl font-bold font-display text-emerald-400 truncate w-full" title={formatMoney(metrics.economia)}>{formatMoney(metrics.economia)}</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-sm flex flex-col gap-1 justify-center min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <Wallet size={14} className="text-cyan-400 shrink-0"/>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">Saldo (Atual)</p>
                                </div>
                                <p className="text-lg xl:text-xl font-bold font-display text-cyan-400 truncate w-full" title={Math.round(metrics.saldoAtual).toLocaleString('pt-BR')}>{Math.round(metrics.saldoAtual).toLocaleString('pt-BR')} <span className="text-xs text-cyan-400/50 font-normal">kWh</span></p>
                            </div>

                            <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-xl shadow-sm flex flex-col gap-1 justify-center min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <Wallet size={14} className="text-blue-400 shrink-0"/>
                                    <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider truncate">Comissão Total</p>
                                </div>
                                <p className="text-lg xl:text-xl font-bold font-display text-blue-400 truncate w-full" title={formatMoney(metrics.comissaoTotalGeral)}>{formatMoney(metrics.comissaoTotalGeral)}</p>
                            </div>

                            <div className="bg-indigo-900/20 border border-indigo-500/30 p-3 rounded-xl shadow-sm flex flex-col gap-1 justify-center min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <Wallet size={14} className="text-indigo-400 shrink-0"/>
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider truncate">Comis. Parceiro</p>
                                </div>
                                <p className="text-lg xl:text-xl font-bold font-display text-indigo-400 truncate w-full" title={formatMoney(metrics.comissaoParceiro)}>{formatMoney(metrics.comissaoParceiro)}</p>
                            </div>
                            
                            <div className="bg-fuchsia-900/20 border border-fuchsia-500/30 p-3 rounded-xl shadow-sm flex flex-col gap-1 justify-center min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <Wallet size={14} className="text-fuchsia-400 shrink-0"/>
                                    <p className="text-[10px] font-bold text-fuchsia-300 uppercase tracking-wider truncate">Comis. Indicador</p>
                                </div>
                                <p className="text-lg xl:text-xl font-bold font-display text-fuchsia-400 truncate w-full" title={formatMoney(metrics.comissaoIndicador)}>{formatMoney(metrics.comissaoIndicador)}</p>
                            </div>

                        </div>

                        <section className={`bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm grid gap-3 items-end ${isAdmin ? 'grid-cols-1 md:grid-cols-3 xl:grid-cols-8' : 'grid-cols-1 md:grid-cols-3 xl:grid-cols-7'}`}>
                            <div className="xl:col-span-2">
                                <label className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider mb-1 block">Buscar UC/Cliente</label>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                                    <input type="text" value={busca} onChange={e => {setBusca(e.target.value); setPage(1);}} placeholder="Digite aqui..." className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-500 transition-all"/>
                                </div>
                            </div>
                            
                            {isAdmin && (
                                <div>
                                    <label className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider mb-1 block text-indigo-400">Parceiro</label>
                                    <MultiSelect options={optParceiros} selected={filtroParceiro} onChange={(v:any) => {setFiltroParceiro(v); setPage(1);}} placeholder="Todos" fullWidth searchable={true}/>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider mb-1 block text-fuchsia-400">Indicador</label>
                                <MultiSelect options={optIndicadores} selected={filtroIndicador} onChange={(v:any) => {setFiltroIndicador(v); setPage(1);}} placeholder="Todos" fullWidth searchable={true}/>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider mb-1 block">Concessionária</label>
                                <MultiSelect options={optConc} selected={filtroConc} onChange={(v:any) => {setFiltroConc(v); setPage(1);}} placeholder="Todas" fullWidth/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider mb-1 block">Mês Ref.</label>
                                <MultiSelect options={optMes} selected={filtroMes} onChange={(v:any) => {setFiltroMes(v); setPage(1);}} placeholder="Até atual" fullWidth/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider mb-1 block">Etapa</label>
                                <MultiSelect options={optEtapas} selected={filtroEtapa} onChange={(v:any) => {setFiltroEtapa(v); setPage(1);}} placeholder="Todas" fullWidth/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider mb-1 block">Status Pagamento</label>
                                <MultiSelect options={optStatus} selected={filtroStatus} onChange={(v:any) => {setFiltroStatus(v); setPage(1);}} placeholder="Todos" fullWidth/>
                            </div>
                        </section>

                        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col flex-1 min-h-[600px]">
                            <div className="p-4 border-b border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/50">
                                <h2 className="font-display font-bold text-white flex items-center gap-2"><TableIcon className="text-yellow-500" size={20}/> Tabela de Acompanhamento</h2>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">{filteredData.length} registros</span>
                                    
                                    {isAdmin && filtroParceiro.length > 0 && (
                                        <button onClick={handleGerarMassa} disabled={isBulkLoading} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50" title="Gera códigos em massa">
                                            {isBulkLoading ? <><Loader2 size={16} className="animate-spin" /> {bulkProgress.current}/{bulkProgress.total}</> : <><PlayCircle size={16} /> Gerar em Massa</>}
                                        </button>
                                    )}

                                    <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-white transition-colors" title="Baixar CSV">
                                        <Download size={16} /> <span className="hidden sm:inline">CSV</span>
                                    </button>
                                    
                                    <MultiSelect options={colunasOpcoes} selected={colunasAtivas} onChange={setColunasAtivas} placeholder="Colunas Opcionais" icon={Settings2} />
                                </div>
                            </div>

                            <div className="overflow-x-auto flex-1 max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                                <table className="w-full text-sm text-left sticky-header">
                                    <thead className="bg-slate-950 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800 whitespace-nowrap sticky top-0 z-10">
                                        <tr>
                                            <th className="px-5 py-4 text-left min-w-[280px]">UC / Cliente</th>
                                            {colunasAtivas.includes('Ações (Links)') && <th className="px-5 py-4 text-center">Ações (Links)</th>}
                                            {isAdmin && <th className="px-5 py-4 text-left text-indigo-400 bg-indigo-900/10">Parceiro Dono</th>}
                                            <th className="px-5 py-4 text-right">Consumo (kWh)</th>
                                            <th className="px-5 py-4 text-right">Compensação (kWh)</th>
                                            <th className="px-5 py-4 text-right">Boleto (R$)</th>
                                            
                                            {colunasAtivas.includes('Fatura Dist. (R$)') && <th className="px-5 py-4 text-right text-slate-300">Fatura Dist. (R$)</th>}
                                            {colunasAtivas.includes('Eficiência (%)') && <th className="px-5 py-4 text-center">Eficiência (%)</th>}
                                            
                                            {colunasAtivas.includes('Percentual Parceiro (%)') && <th className="px-5 py-4 text-center text-slate-300">% Parc.</th>}
                                            {colunasAtivas.includes('Comissão Parceiro (R$)') && <th className="px-5 py-4 text-right text-indigo-400">Comis. Parc. (R$)</th>}
                                            
                                            {colunasAtivas.includes('Nome Indicador') && <th className="px-5 py-4 text-left text-slate-300">Indicador</th>}
                                            {colunasAtivas.includes('Percentual Indicador (%)') && <th className="px-5 py-4 text-center text-slate-300">% Ind.</th>}
                                            {colunasAtivas.includes('Comissão Indicador (R$)') && <th className="px-5 py-4 text-right text-fuchsia-400">Comis. Ind. (R$)</th>}
                                            {colunasAtivas.includes('Percentual Total (%)') && <th className="px-5 py-4 text-center text-slate-300">% Total</th>}

                                            {colunasAtivas.includes('Saldo (kWh)') && <th className="px-5 py-4 text-right text-cyan-400">Saldo (kWh)</th>}
                                            {colunasAtivas.includes('Etapa') && <th className="px-5 py-4 text-left">Etapa</th>}
                                            {colunasAtivas.includes('Status Pagamento') && <th className="px-5 py-4 text-center">Status</th>}
                                            {colunasAtivas.includes('Concessionária') && <th className="px-5 py-4 text-left">Concessionária</th>}
                                            {colunasAtivas.includes('Mês Referência') && <th className="px-5 py-4 text-center">Mês Ref.</th>}
                                            {colunasAtivas.includes('Economia (R$)') && <th className="px-5 py-4 text-right text-emerald-400">Economia (R$)</th>}
                                            {colunasAtivas.includes('Data Ganho') && <th className="px-5 py-4 text-left text-slate-500">Dt. Ganho</th>}
                                            {colunasAtivas.includes('Data Protocolo') && <th className="px-5 py-4 text-left text-slate-500">Dt. Protocolo</th>}
                                            {colunasAtivas.includes('Data Cancelamento') && <th className="px-5 py-4 text-left text-slate-500">Dt. Cancelamento</th>}
                                            {colunasAtivas.includes('Data Emissão') && <th className="px-5 py-4 text-left text-slate-500">Dt. Emissão</th>}
                                            {colunasAtivas.includes('Vencimento') && <th className="px-5 py-4 text-left text-slate-500">Vencimento</th>}
                                            {colunasAtivas.includes('Código PIX') && <th className="px-5 py-4 text-left text-slate-300">Código PIX</th>}
                                            {colunasAtivas.includes('Código de Barras') && <th className="px-5 py-4 text-left text-slate-300">Código de Barras</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {paginatedData.map((row, index) => {
                                            const badge = getPaymentBadge(row.status);
                                            const isPago = badge.text === 'Pago';
                                            const isAlexandria = row.quem_indicou === 'Alexandria - LEX';
                                            const chaveLinha = row.id_chave_composta || `${row.uc}-${row.mes_referencia}`;
                                            const eficPercent = (row.eficiencia_compensacao || 0) * 100;
                                            let eficColor = 'text-rose-400'; let eficBg = 'bg-rose-900/40 border-rose-800/50';
                                            if (eficPercent >= 90) { eficColor = 'text-emerald-400'; eficBg = 'bg-emerald-900/40 border-emerald-800/50'; }
                                            else if (eficPercent >= 70) { eficColor = 'text-yellow-400'; eficBg = 'bg-yellow-900/40 border-yellow-800/50'; }

                                            const linkBoletoLumiDireto = row.fonte_dados === 'LUMI' && row.link_boleto ? `https://api.labs-lumi.com.br/faturas/download/${row.link_boleto}` : null;

                                            return (
                                                <tr key={`${chaveLinha}-${index}`} className="hover:bg-slate-800/40 transition-colors whitespace-nowrap">
                                                    <td className="px-5 py-3 text-left">
                                                        <div className="font-mono text-slate-200 font-bold">{row.uc}</div>
                                                        <div className="text-xs text-slate-500 whitespace-normal max-w-[350px] leading-tight mt-0.5" title={row.nome_cliente}>
                                                            {row.id_negocio ? (
                                                                <a href={`https://crm.rdstation.com/app/deals/${row.id_negocio}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors inline-flex items-center gap-1 group">
                                                                    <span>{row.nome_cliente || 'Sem Nome'}</span><ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                                </a>
                                                            ) : <span>{row.nome_cliente || 'Sem Nome'}</span>}
                                                        </div>
                                                    </td>

                                                    {colunasAtivas.includes('Ações (Links)') && (
                                                        <td className="px-5 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {row.fonte_dados === 'UNIFICA' ? (
                                                                    <button onClick={() => handleDownloadGestao(row.uc, row.mes_referencia, 'FATURA', `btn_fat_${chaveLinha}`)} disabled={loadingDownloads[`btn_fat_${chaveLinha}`]} title="Fatura da Concessionária" className="p-1.5 bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-400 rounded-md transition-colors disabled:opacity-50">
                                                                        {loadingDownloads[`btn_fat_${chaveLinha}`] ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16} />}
                                                                    </button>
                                                                ) : linkBoletoLumiDireto ? (
                                                                    <a href={linkBoletoLumiDireto} target="_blank" rel="noopener noreferrer" title="Fatura da Concessionária" className="p-1.5 bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-400 rounded-md transition-colors flex items-center justify-center"><FileDown size={16} /></a>
                                                                ) : <div title="Indisponível" className="p-1.5 bg-slate-900 text-slate-700 rounded-md cursor-not-allowed"><FileDown size={16} /></div>}
                                                                
                                                                {row.fonte_dados === 'UNIFICA' ? (
                                                                    <button onClick={() => handleDownloadGestao(row.uc, row.mes_referencia, 'BOLETO', `btn_bol_${chaveLinha}`)} disabled={loadingDownloads[`btn_bol_${chaveLinha}`]} title="Boleto Simplifica" className="p-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-md transition-colors disabled:opacity-50">
                                                                        {loadingDownloads[`btn_bol_${chaveLinha}`] ? <Loader2 size={16} className="animate-spin"/> : <Receipt size={16} />}
                                                                    </button>
                                                                ) : row.fonte_dados === 'LUMI' ? (
                                                                    <button onClick={() => handleDownloadBoletoLumi(row.uc, row.mes_referencia, `btn_bol_${chaveLinha}`)} disabled={loadingDownloads[`btn_bol_${chaveLinha}`]} title="Boleto Simplifica (Lumi)" className="p-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center">
                                                                        {loadingDownloads[`btn_bol_${chaveLinha}`] ? <Loader2 size={16} className="animate-spin"/> : <Receipt size={16} />}
                                                                    </button>
                                                                ) : <div title="Indisponível" className="p-1.5 bg-slate-900 text-slate-700 rounded-md cursor-not-allowed"><Receipt size={16} /></div>}
                                                            </div>
                                                        </td>
                                                    )}

                                                    {isAdmin && <td className="px-5 py-3 text-left text-xs font-medium text-indigo-300 bg-indigo-900/5">{row.quem_indicou || '-'}</td>}
                                                    <td className="px-5 py-3 text-right font-mono text-slate-300">{Number(row.consumo_kwh).toLocaleString('pt-BR')}</td>
                                                    <td className="px-5 py-3 text-right font-mono text-emerald-400">{Number(row.compensacao_kwh).toLocaleString('pt-BR')}</td>
                                                    <td className="px-5 py-3 text-right font-medium text-yellow-400">{formatMoney(row.boleto_simplifica)}</td>

                                                    {colunasAtivas.includes('Fatura Dist. (R$)') && <td className="px-5 py-3 text-right font-mono text-slate-300">{formatMoney(row.valor_fatura_distribuidora || 0)}</td>}
                                                    {colunasAtivas.includes('Eficiência (%)') && <td className="px-5 py-3 text-center">{row.eficiencia_compensacao > 0 ? <span className={`px-2 py-1 rounded text-[10px] font-bold border ${eficColor} ${eficBg}`}>{eficPercent.toFixed(1)}%</span> : <span className="text-slate-600">-</span>}</td>}

                                                    {colunasAtivas.includes('Percentual Parceiro (%)') && <td className="px-5 py-3 text-center text-slate-400 font-mono">{row.perc_parceiro_rec > 0 ? `${row.perc_parceiro_rec}%` : '-'}</td>}
                                                    {colunasAtivas.includes('Comissão Parceiro (R$)') && (
                                                        <td className="px-5 py-3 text-right font-mono text-indigo-400 font-bold">
                                                            {(() => {
                                                                if (!isPago) return <span className="text-slate-600 font-normal">-</span>;
                                                                let baseCalc = row.valor_real_cobranca || row.boleto_simplifica || 0;
                                                                if ((row.concessionaria || '').toUpperCase().includes('EQUATORIAL') && (row.concessionaria || '').toUpperCase().includes('GO') && (row.is_consorcio || '').toUpperCase() === 'SIM') {
                                                                    baseCalc = Math.max(0, (row.valor_real_cobranca || row.boleto_simplifica || 0) - (row.valor_fatura_distribuidora || 0));
                                                                }
                                                                const comissaoVal = baseCalc * ((row.perc_parceiro_rec || 0) / 100);
                                                                return comissaoVal > 0 ? formatMoney(comissaoVal) : <span className="text-slate-600 font-normal">-</span>;
                                                            })()}
                                                        </td>
                                                    )}
                                                    
                                                    {colunasAtivas.includes('Nome Indicador') && <td className="px-5 py-3 text-left text-xs font-medium text-slate-300">{row.nome_indicador || '-'}</td>}
                                                    {colunasAtivas.includes('Percentual Indicador (%)') && <td className="px-5 py-3 text-center text-slate-400 font-mono">{row.perc_indicador_rec > 0 ? `${row.perc_indicador_rec}%` : '-'}</td>}
                                                    {colunasAtivas.includes('Comissão Indicador (R$)') && (
                                                        <td className="px-5 py-3 text-right font-mono text-fuchsia-400 font-bold">
                                                            {(() => {
                                                                if (!isPago) return <span className="text-slate-600 font-normal">-</span>;
                                                                let baseCalc = row.valor_real_cobranca || row.boleto_simplifica || 0;
                                                                if ((row.concessionaria || '').toUpperCase().includes('EQUATORIAL') && (row.concessionaria || '').toUpperCase().includes('GO') && (row.is_consorcio || '').toUpperCase() === 'SIM') {
                                                                    baseCalc = Math.max(0, (row.valor_real_cobranca || row.boleto_simplifica || 0) - (row.valor_fatura_distribuidora || 0));
                                                                }
                                                                const comissaoVal = baseCalc * ((row.perc_indicador_rec || 0) / 100);
                                                                return comissaoVal > 0 ? formatMoney(comissaoVal) : <span className="text-slate-600 font-normal">-</span>;
                                                            })()}
                                                        </td>
                                                    )}
                                                    
                                                    {colunasAtivas.includes('Percentual Total (%)') && <td className="px-5 py-3 text-center text-slate-400 font-mono">{row.perc_total_rec > 0 ? `${row.perc_total_rec}%` : '-'}</td>}

                                                    {colunasAtivas.includes('Saldo (kWh)') && <td className="px-5 py-3 text-right font-mono text-cyan-400">{Number(row.saldo || 0).toLocaleString('pt-BR')}</td>}
                                                    {colunasAtivas.includes('Etapa') && <td className="px-5 py-3 text-left text-xs text-slate-300">{row.objetivo_etapa || '-'}</td>}
                                                    {colunasAtivas.includes('Status Pagamento') && <td className="px-5 py-3 text-center">{badge.text !== '-' ? <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${badge.color} ${badge.bg}`}>{badge.text}</span> : <span className="text-slate-600">-</span>}</td>}
                                                    {colunasAtivas.includes('Concessionária') && <td className="px-5 py-3 text-left text-xs text-slate-400">{row.concessionaria || '-'}</td>}
                                                    {colunasAtivas.includes('Mês Referência') && <td className="px-5 py-3 text-center font-mono text-xs text-slate-400">{formatMesRef(row.mes_referencia)}</td>}
                                                    {colunasAtivas.includes('Economia (R$)') && <td className="px-5 py-3 text-right text-emerald-500">{formatMoney(row.economia_rs)}</td>}
                                                    {colunasAtivas.includes('Data Ganho') && <td className="px-5 py-3 text-left text-xs text-slate-500">{toDateBR(row.data_ganho)}</td>}
                                                    {colunasAtivas.includes('Data Protocolo') && <td className="px-5 py-3 text-left text-xs text-slate-500">{toDateBR(row.data_protocolo)}</td>}
                                                    {colunasAtivas.includes('Data Cancelamento') && <td className="px-5 py-3 text-left text-xs text-slate-500">{toDateBR(row.data_cancelamento)}</td>}
                                                    {colunasAtivas.includes('Data Emissão') && <td className="px-5 py-3 text-left text-xs text-slate-500">{toDateBR(row.data_emissao)}</td>}
                                                    {colunasAtivas.includes('Vencimento') && <td className="px-5 py-3 text-left text-xs text-slate-500">{toDateBR(row.vencimento)}</td>}
                                                    
                                                    {colunasAtivas.includes('Código PIX') && (
                                                        <td className="px-5 py-3 text-left text-xs font-mono text-slate-400">
                                                            {isPago ? <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Fatura Paga</span> : row.codigo_pix ? <span className="bg-slate-950 border border-slate-700 px-2 py-1 rounded truncate max-w-[120px] inline-block cursor-pointer hover:border-yellow-500" onClick={() => navigator.clipboard.writeText(row.codigo_pix)}>{row.codigo_pix}</span> : row.asaas_id ? (!isAlexandria ? <span className="text-slate-500 text-[10px] uppercase font-bold px-2 py-1 bg-slate-800 rounded border border-slate-700">Emissão Restrita</span> : codigosAsaas[chaveLinha]?.pix ? <span className="bg-slate-950 border border-slate-700 px-2 py-1 rounded truncate max-w-[120px] inline-block cursor-pointer hover:border-emerald-500 text-emerald-400" onClick={() => navigator.clipboard.writeText(codigosAsaas[chaveLinha]?.pix!)}>{codigosAsaas[chaveLinha]?.pix}</span> : <button onClick={() => handleGerarCodigos(row.asaas_id, chaveLinha)} disabled={codigosAsaas[chaveLinha]?.loading} className="px-2 py-1 bg-slate-800 hover:bg-blue-600 text-white border border-slate-700 rounded font-sans text-[10px] uppercase font-bold disabled:opacity-50 transition-colors shadow-sm">{codigosAsaas[chaveLinha]?.loading ? 'Gerando...' : 'Gerar PIX Lumi'}</button>) : '-'}
                                                        </td>
                                                    )}
                                                    {colunasAtivas.includes('Código de Barras') && (
                                                        <td className="px-5 py-3 text-left text-xs font-mono text-slate-400">
                                                            {isPago ? <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Fatura Paga</span> : row.codigo_barras ? <span className="bg-slate-950 border border-slate-700 px-2 py-1 rounded truncate max-w-[120px] inline-block cursor-pointer hover:border-yellow-500" onClick={() => navigator.clipboard.writeText(row.codigo_barras)}>{row.codigo_barras}</span> : row.asaas_id ? (!isAlexandria ? <span className="text-slate-500 text-[10px] uppercase font-bold px-2 py-1 bg-slate-800 rounded border border-slate-700">Emissão Restrita</span> : codigosAsaas[chaveLinha]?.barcode ? <span className="bg-slate-950 border border-slate-700 px-2 py-1 rounded truncate max-w-[120px] inline-block cursor-pointer hover:border-emerald-500 text-emerald-400" onClick={() => navigator.clipboard.writeText(codigosAsaas[chaveLinha]?.barcode!)}>{codigosAsaas[chaveLinha]?.barcode}</span> : <span className="text-slate-600 text-[10px] uppercase font-bold px-2 py-1 bg-slate-900 rounded border border-slate-800">Gere via botão PIX</span>) : '-'}
                                                        </td>
                                                    )}
                                                </tr>
                                            )
                                        })}
                                        {paginatedData.length === 0 && <tr><td colSpan={25} className="text-center py-12 text-slate-500">Nenhum dado encontrado com os filtros atuais.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-950 border-t border-slate-800 text-sm text-slate-400 sticky bottom-0 z-10">
                                <div>Página <span className="font-bold text-white">{page}</span> de {totalPages || 1}</div>
                                <div className="flex gap-2">
                                    <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50"><ChevronLeft size={16}/></button>
                                    <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50"><ChevronRight size={16}/></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ABA 2: RELATÓRIO DO CLIENTE (PRINT-FRIENDLY A4) */}
                {activeTab === 'relatorio' && (
                    <div id="relatorio-print-container" className="flex flex-col gap-6 w-full mx-auto print:max-w-[210mm] page-break-inside-avoid">
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl print:hidden flex flex-col sm:flex-row gap-4 justify-between items-center z-20 max-w-[900px] w-full mx-auto">
                            <div className="flex flex-col gap-1 w-full sm:w-[400px]">
                                <label className="text-xs font-bold font-display text-slate-400 uppercase tracking-wider">Selecione o Cliente / UC</label>
                                <div className="relative w-full" ref={dropdownRelatorioRef}>
                                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                                    <input type="text" placeholder="Digite nome ou UC..." value={buscaRelatorio} onChange={e => { setBuscaRelatorio(e.target.value); setShowUcDropdown(true); }} onFocus={() => setShowUcDropdown(true)} className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
                                    {showUcDropdown && buscaRelatorio && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                                            {ucsUnicas.filter(c => c.label.toLowerCase().includes(buscaRelatorio.toLowerCase())).map(c => (
                                                <div key={c.uc} className="p-3 border-b border-slate-800 hover:bg-slate-800 cursor-pointer text-sm text-slate-200" onClick={() => { setRelatorioUc(c.uc); setBuscaRelatorio(c.label); setShowUcDropdown(false); }}>{c.label}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => window.print()} disabled={!relatorioData} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-bold flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"><Printer size={18}/> Salvar / Imprimir (PDF)</button>
                        </div>

                        {relatorioData ? (
                            <div className="bg-slate-900 print:bg-[#0a0a0a] border border-slate-800 rounded-2xl p-8 shadow-2xl print:border-none print:shadow-none print:p-2 print:m-0 w-full max-w-[900px] mx-auto print:max-w-full print:text-white page-break-inside-avoid">
                                <div className="flex justify-between items-start border-b border-slate-800 pb-6 print:pb-3 mb-6 print:mb-5">
                                    <div>
                                        <h1 className="text-3xl print:text-2xl font-display font-bold text-white mb-1">{relatorioData.infoCadastral.nome_cliente}</h1>
                                        <p className="text-slate-400 font-mono text-sm print:text-xs">UC: {relatorioData.infoCadastral.uc}</p>
                                    </div>
                                    <div className="text-right">
                                        <img src="https://www.ludfor.com.br/arquivos/0d5ce42bc0728ac08a186e725fafac7db6421507.png" alt="Logo" className="h-8 print:h-6 mb-2 print:mb-1 opacity-80 ml-auto" />
                                        <p className="text-xs print:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Relatório de Desempenho</p>
                                        <p className="text-[10px] print:text-[8px] text-slate-600 mt-1">Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-3 mb-8 print:mb-6">
                                    <div className="bg-slate-950 p-4 print:p-3 rounded-xl border border-slate-800 print:border-slate-800">
                                        <p className="text-[10px] print:text-[9px] font-bold text-slate-500 uppercase mb-1">Concessionária</p>
                                        <p className="text-sm print:text-xs font-bold text-slate-200">{relatorioData.infoCadastral.concessionaria}</p>
                                    </div>
                                    <div className="bg-slate-950 p-4 print:p-3 rounded-xl border border-slate-800 print:border-slate-800">
                                        <p className="text-[10px] print:text-[9px] font-bold text-slate-500 uppercase mb-1">Cliente Desde</p>
                                        <p className="text-sm print:text-xs font-bold text-slate-200">{toDateBR(relatorioData.infoCadastral.data_ganho) !== '-' ? toDateBR(relatorioData.infoCadastral.data_ganho) : 'Não informado'}</p>
                                    </div>
                                    <div className="bg-slate-950 p-4 print:p-3 rounded-xl border border-slate-800 print:border-slate-800">
                                        <p className="text-[10px] print:text-[9px] font-bold text-slate-500 uppercase mb-1">Eficiência Média</p>
                                        <p className={`text-sm print:text-xs font-bold ${relatorioData.eficienciaMedia >= 90 ? 'text-emerald-400' : relatorioData.eficienciaMedia >= 70 ? 'text-yellow-400' : 'text-rose-400'}`}>{relatorioData.eficienciaMedia > 0 ? relatorioData.eficienciaMedia.toFixed(1) + '%' : 'N/D'}</p>
                                    </div>
                                    <div className="bg-slate-950 p-4 print:p-3 rounded-xl border border-slate-800 print:border-slate-800">
                                        <p className="text-[10px] print:text-[9px] font-bold text-slate-500 uppercase mb-1">Consumo Total</p>
                                        <p className="text-sm print:text-xs font-bold text-slate-200">{Math.round(relatorioData.totalConsumo).toLocaleString('pt-BR')} kWh</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-6 print:gap-5 mb-8 print:mb-6 page-break-inside-avoid">
                                    <div className="flex-1 bg-emerald-900/10 border border-emerald-800/30 print:border-emerald-800/50 p-6 print:p-5 rounded-2xl flex items-center justify-center flex-col text-center">
                                        <PiggyBank size={32} className="text-emerald-500 mb-3 print:mb-2 print:h-8 print:w-8"/>
                                        <p className="text-xs print:text-[11px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Economia Total Acumulada</p>
                                        <h2 className="text-4xl print:text-3xl font-display font-extrabold text-white">{formatMoney(relatorioData.totalEco)}</h2>
                                        {relatorioData.mesesGratis > 0 && <div className="mt-3 print:mt-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 print:py-1 rounded-full text-[10px] print:text-[9px] font-bold uppercase tracking-wider border border-emerald-500/30">🎉 Equivale a {relatorioData.mesesGratis.toFixed(1).replace('.0', '')} faturas grátis</div>}
                                    </div>
                                    <div className="flex-1 bg-blue-900/10 border border-blue-800/30 print:border-blue-800/50 p-6 print:p-5 rounded-2xl flex items-center justify-center flex-col text-center">
                                        <Zap size={32} className="text-blue-500 mb-3 print:mb-2 print:h-8 print:w-8"/>
                                        <p className="text-xs print:text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-1">Total de Energia Compensada</p>
                                        <h2 className="text-4xl print:text-3xl font-display font-extrabold text-white">{Math.round(relatorioData.totalComp).toLocaleString('pt-BR')} <span className="text-lg print:text-base text-blue-400">kWh</span></h2>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:gap-3 mb-10 print:mb-8 page-break-inside-avoid">
                                    <div className="bg-slate-900 p-4 print:p-3 border border-slate-700 rounded-xl flex justify-between items-center">
                                        <div className="flex items-center gap-3 print:gap-2">
                                            <div className="bg-rose-500/10 p-2 print:p-1.5 rounded-full"><TrendingUp size={18} className="text-rose-400 print:h-5 print:w-5"/></div>
                                            <span className="text-sm print:text-xs font-bold text-slate-400">Sem a Simplifica Energia</span>
                                        </div>
                                        <span className="text-lg print:text-base font-bold text-white">{formatMoney(relatorioData.custoSem)}</span>
                                    </div>
                                    <div className="bg-slate-900 p-4 print:p-3 border border-emerald-500/30 rounded-xl flex justify-between items-center">
                                        <div className="flex items-center gap-3 print:gap-2">
                                            <div className="bg-emerald-500/10 p-2 print:p-1.5 rounded-full"><CheckCircle2 size={18} className="text-emerald-400 print:h-5 print:w-5"/></div>
                                            <span className="text-sm print:text-xs font-bold text-emerald-400">Com a Simplifica Energia</span>
                                        </div>
                                        <span className="text-xl print:text-lg font-bold text-white">{formatMoney(relatorioData.custoCom)}</span>
                                    </div>
                                </div>

                                <div className="mb-10 print:mb-30 print-break-avoid relative z-0">
                                    <h3 className="text-sm print:text-xs font-bold text-slate-300 mb-6 print:mb-4 flex items-center gap-2"><Activity size={16}/> Consumo vs Compensação (Últimos 12 meses)</h3>
                                    <div className="w-full h-[300px] print:h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={relatorioData.chartData} margin={{ top: 10, right: 30, left: -10, bottom: 5 }} barGap={2}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis dataKey="mes" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} tickMargin={10}/>
                                                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false}/>
                                                <Bar dataKey="consumo" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Consumo (kWh)" isAnimationActive={false} />
                                                <Bar dataKey="compensacao" fill="#eab308" radius={[2, 2, 0, 0]} name="Compensação (kWh)" isAnimationActive={false} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="print-break-avoid pt-4 print:pt-[42px] relative z-10">
                                    <h3 className="text-sm print:text-xs font-bold text-slate-300 mb-4 print:mb-3 border-b border-slate-800 pb-2">Extrato das Últimas Faturas</h3>
                                    <table className="w-full text-sm print:text-xs text-left">
                                        <thead className="text-xs print:text-[10px] uppercase text-slate-500 border-b border-slate-800">
                                            <tr>
                                                <th className="py-2 print:py-2">Mês Ref.</th>
                                                <th className="py-2 print:py-2">Vencimento</th>
                                                <th className="py-2 print:py-2 text-right">Consumo</th>
                                                <th className="py-2 print:py-2 text-right">Compensação</th>
                                                <th className="py-2 print:py-2 text-center">Eficiência</th>
                                                <th className="py-2 print:py-2 text-right">Boleto (R$)</th>
                                                <th className="py-2 print:py-2 text-right">Economia</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {relatorioData.ultimasFaturas.map((row:any, i:number) => {
                                                const eficPercent = row.eficiencia_compensacao * 100;
                                                return (
                                                    <tr key={i} className="text-slate-300">
                                                        <td className="py-3 print:py-2.5 font-mono text-xs">{formatMesRef(row.mes_referencia)}</td>
                                                        <td className="py-3 print:py-2.5 text-xs">{toDateBR(row.vencimento)}</td>
                                                        <td className="py-3 print:py-2.5 text-right text-xs">{Math.round(row.consumo_kwh).toLocaleString('pt-BR')} kWh</td>
                                                        <td className="py-3 print:py-2.5 text-right text-xs">{Math.round(row.compensacao_kwh).toLocaleString('pt-BR')} kWh</td>
                                                        <td className="py-3 print:py-2.5 text-center text-xs">{row.eficiencia_compensacao > 0 ? eficPercent.toFixed(1) + '%' : '-'}</td>
                                                        <td className="py-3 print:py-2.5 text-right text-xs">{formatMoney(row.boleto_simplifica)}</td>
                                                        <td className="py-3 print:py-2.5 text-right font-bold text-emerald-400 text-xs">{formatMoney(row.economia_rs)}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-20 text-slate-500 print:hidden">
                                <FileText size={64} className="opacity-20 mb-4"/>
                                <p className="text-lg font-bold font-display">Nenhum cliente selecionado</p>
                                <p className="text-sm">Busque uma UC ou nome no campo acima para gerar o relatório.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ABA DE COMISSÃO ATUALIZADA */}
                {activeTab === 'comissao' && (
                    <div className="flex flex-col gap-6 w-full mx-auto print:max-w-[297mm]">
                        
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl print:hidden flex flex-col sm:flex-row gap-4 items-end z-20 max-w-[1300px] w-full mx-auto">
                            {isAdmin && (
                                <div className="flex flex-col gap-1 w-full sm:w-[350px]">
                                    <label className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider text-indigo-400">Selecione o Parceiro</label>
                                    <SingleSearchSelect options={optParceiros} selected={comissaoParceiro} onChange={setComissaoParceiro} placeholder="Selecione..." fullWidth={true} />
                                </div>
                            )}

                            {/* NOVO FILTRO CASCATA PARA INDICADOR NO RELATÓRIO DE COMISSÃO */}
                            <div className="flex flex-col gap-1 w-full sm:w-[350px]">
                                <label className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider text-fuchsia-400">Filtrar por Indicador</label>
                                <SingleSearchSelect options={optIndicadoresComissao} selected={comissaoIndicador} onChange={setComissaoIndicador} placeholder="Todos os Indicadores" fullWidth={true} />
                            </div>

                            <div className="flex flex-col gap-1 w-full sm:w-[200px]">
                                <label className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider">Mês de Referência</label>
                                <select value={comissaoMes} onChange={e => setComissaoMes(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#a3e635] transition-all">
                                    <option value="">Selecione...</option>
                                    {optMes.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            
                            <button onClick={() => window.print()} disabled={!relatorioComissaoData} className="px-6 py-2.5 bg-[#84cc16] hover:bg-[#65a30d] disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-bold flex items-center gap-2 transition-colors ml-auto shadow-[0_0_15px_rgba(132,204,22,0.3)] disabled:shadow-none">
                                <Printer size={18}/> Salvar / Imprimir (PDF)
                            </button>
                        </div>

                        {!relatorioComissaoData ? (
                            <div className="flex flex-col items-center justify-center p-20 text-slate-500 print:hidden bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[1300px] mx-auto">
                                <Wallet size={64} className="opacity-20 mb-4"/>
                                <p className="text-lg font-bold font-display">Nenhum dado encontrado</p>
                                <p className="text-sm text-center">Selecione o parceiro e o mês acima, ou verifique se existem faturas pagas neste mês.</p>
                            </div>
                        ) : (
                            <div className="bg-white text-slate-800 p-8 rounded-2xl shadow-xl print:shadow-none print:p-0 w-full max-w-[1300px] mx-auto print:max-w-full page-break-inside-avoid relative overflow-hidden">
                                
                                <div className="flex justify-between items-center mb-6 px-2 relative z-10">
                                    <img src="https://www.ludfor.com.br/arquivos/2010a4818c8689275e42d724e5084d4a43400d86.jpg" alt="Simplifica" className="h-16 object-contain" />
                                    <div className="text-right text-xs font-bold text-slate-500 tracking-wide uppercase">
                                        CANAL DE PARCEIROS SIMPLIFICA ENERGIA
                                    </div>
                                </div>

                                <div className="bg-[#a3e635] print:bg-[#a3e635] text-white text-center font-bold py-2 text-lg uppercase tracking-widest mb-6">
                                    RELATÓRIO DE COMISSÃO
                                </div>

                                <div className="flex justify-between items-center text-center border-y-2 border-slate-200 py-4 mb-8 px-2">
                                    <div className="flex-1 px-2 border-r border-slate-200">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Parceiro Dono</p>
                                        <p className="text-sm font-bold text-slate-700 uppercase">{relatorioComissaoData.parceiro}</p>
                                    </div>
                                    <div className="flex-1 px-2 border-r border-slate-200">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider whitespace-nowrap">Concessionárias</p>
                                        <p className="text-sm font-bold text-slate-700">{relatorioComissaoData.concessionarias}</p>
                                    </div>
                                    <div className="flex-1 px-2 border-r border-slate-200">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider whitespace-nowrap">Consumo (MWh)</p>
                                        <p className="text-[15px] font-bold text-slate-700">{new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(relatorioComissaoData.consumoTotal / 1000)} MWh</p>
                                    </div>
                                    <div className="flex-1 px-2 border-r border-slate-200">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider whitespace-nowrap">Mês Ref.</p>
                                        <p className="text-sm font-bold text-slate-700 uppercase">{relatorioComissaoData.mes}</p>
                                    </div>
                                    <div className="flex-1 px-2 border-r border-slate-200">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider whitespace-nowrap">Comissão Parceiro</p>
                                        <p className="text-[15px] font-extrabold text-slate-900">{formatMoney(relatorioComissaoData.comissaoParceiroTotal)}</p>
                                    </div>
                                    <div className="flex-1 px-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider whitespace-nowrap">Comissão Indicador</p>
                                        <p className="text-[15px] font-extrabold text-slate-900">{formatMoney(relatorioComissaoData.comissaoIndicadorTotal)}</p>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-lg p-4 overflow-x-auto">
                                    <table className="w-full text-xs text-left border-collapse">
                                        <thead>
                                            <tr className="text-[#84cc16] border-b border-slate-200 whitespace-nowrap px-1">
                                                <th className="pb-3 px-2 font-bold uppercase tracking-wide">Cliente</th>
                                                <th className="pb-3 px-2 font-bold uppercase tracking-wide">UC</th>
                                                <th className="pb-3 px-2 font-bold uppercase tracking-wide text-right">Boleto Pago</th>
                                                <th className="pb-3 px-2 font-bold uppercase tracking-wide text-center">% Parc.</th>
                                                <th className="pb-3 px-2 font-bold uppercase tracking-wide text-right">Comis. Parc.</th>
                                                <th className="pb-3 px-2 font-bold uppercase tracking-wide text-left border-l border-slate-200 pl-4">Indicador</th>
                                                <th className="pb-3 px-2 font-bold uppercase tracking-wide text-center">% Ind.</th>
                                                <th className="pb-3 px-2 font-bold uppercase tracking-wide text-right">Comis. Ind.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {relatorioComissaoData.rows.map((row, i) => (
                                                <tr key={i} className="text-slate-600">
                                                    <td className="py-3 px-2 text-left font-semibold text-slate-800">{row.nome_cliente}</td>
                                                    <td className="py-3 px-2 text-left">{row.uc}</td>
                                                    <td className="py-3 px-2 text-right">{formatMoney(row.baseCalc)}</td>
                                                    
                                                    <td className="py-3 px-2 text-center font-bold text-slate-500">{row.perc_parceiro_rec > 0 ? `${row.perc_parceiro_rec}%` : '-'}</td>
                                                    <td className="py-3 px-2 text-right font-bold text-slate-800">{row.valParceiro > 0 ? formatMoney(row.valParceiro) : '-'}</td>
                                                    
                                                    <td className="py-3 px-2 text-left border-l border-slate-200 pl-4 text-[10px] text-slate-500">{row.nome_indicador || '-'}</td>
                                                    <td className="py-3 px-2 text-center font-bold text-slate-500">{row.perc_indicador_rec > 0 ? `${row.perc_indicador_rec}%` : '-'}</td>
                                                    <td className="py-3 px-2 text-right font-bold text-slate-800">{row.valIndicador > 0 ? formatMoney(row.valIndicador) : '-'}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-[#a3e635]">
                                                <td className="py-3 px-2 text-left" colSpan={2}>
                                                    Total: <span className="font-medium text-slate-700 ml-2">{relatorioComissaoData.rows.length} UCs</span>
                                                </td>
                                                <td className="py-3 px-2 text-right whitespace-nowrap">{formatMoney(relatorioComissaoData.boletoTotal)}</td>
                                                <td className="py-3 px-2 text-center"></td>
                                                <td className="py-3 px-2 text-right whitespace-nowrap">{formatMoney(relatorioComissaoData.comissaoParceiroTotal)}</td>
                                                <td className="py-3 px-2 border-l border-slate-200"></td>
                                                <td className="py-3 px-2 text-center"></td>
                                                <td className="py-3 px-2 text-right whitespace-nowrap">{formatMoney(relatorioComissaoData.comissaoIndicadorTotal)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ABA 3: GESTÃO DE SENHAS */}
                {isAdmin && activeTab === 'gestao' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-300 print:hidden">
                        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-slate-800 bg-amber-900/10">
                                <h3 className="font-display font-bold text-amber-500 flex items-center gap-2"><ShieldAlert size={20}/> Parceiros Pendentes (Sem Senha)</h3>
                                <p className="text-xs text-slate-400 mt-1">Identificados no campo "Quem indicou" do RD Station, mas que ainda não possuem acesso ao portal.</p>
                            </div>
                            <div className="overflow-y-auto max-h-[600px] p-2">
                                {parceirosPendentes.map((p, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 hover:bg-slate-800/50 border-b border-slate-800/50 transition-colors">
                                        <div className="font-medium text-slate-200">{p.nome_parceiro}</div>
                                        <button onClick={() => gerarSenha(p.nome_parceiro)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                                            <KeyRound size={14}/> Gerar Acesso
                                        </button>
                                    </div>
                                ))}
                                {parceirosPendentes.length === 0 && <div className="p-8 text-center text-slate-500">Nenhum parceiro pendente.</div>}
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-slate-800 bg-emerald-900/10">
                                <h3 className="font-display font-bold text-emerald-400 flex items-center gap-2"><CheckCircle2 size={20}/> Parceiros com Acesso Ativo</h3>
                                <p className="text-xs text-slate-400 mt-1">Copie a senha abaixo e envie para o parceiro acessar a plataforma.</p>
                            </div>
                            <div className="overflow-y-auto max-h-[600px] p-2">
                                {parceirosAtivos.map((p, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 hover:bg-slate-800/50 border-b border-slate-800/50 transition-colors">
                                        <div className="font-medium text-slate-200">{p.nome_parceiro}</div>
                                        <div className="bg-slate-950 border border-slate-700 px-4 py-2 rounded-lg text-sm font-mono text-yellow-400 flex items-center justify-center min-w-[120px] tracking-wider font-bold">
                                            {p.senha}
                                        </div>
                                    </div>
                                ))}
                                {parceirosAtivos.length === 0 && <div className="p-8 text-center text-slate-500">Nenhum parceiro ativo.</div>}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}