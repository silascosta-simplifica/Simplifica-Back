import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';
import { 
    LogOut, Table as TableIcon, Search, Settings2, Check, 
    ChevronDown, ChevronLeft, ChevronRight, KeyRound, CheckCircle2, ShieldAlert, Loader2,
    Zap, PiggyBank, Receipt, Download, PlayCircle, Wallet, Users, FileText, Printer, Activity, FileDown, ExternalLink, TrendingUp
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
                <div className="flex items-center gap-2 truncate">
                    {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
                    <span className={`truncate ${selected.length === 0 ? 'text-slate-400' : 'text-slate-200'}`}>{displayValue}</span>
                </div>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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

export default function PortalParceiro() {
    const navigate = useNavigate();
    const parceiroLogado = localStorage.getItem('@Simplifica:parceiroLogado') || '';
    const isAdmin = parceiroLogado === 'admin';

    const { data: rawData, loading: analyticsLoading } = useAnalytics();

    const [activeTab, setActiveTab] = useState<'carteira' | 'gestao' | 'relatorio'>('carteira');
    
    const [busca, setBusca] = useState('');
    const [filtroEtapa, setFiltroEtapa] = useState<string[]>([]);
    const [filtroConc, setFiltroConc] = useState<string[]>([]);
    const [filtroMes, setFiltroMes] = useState<string[]>([]);
    const [filtroStatus, setFiltroStatus] = useState<string[]>([]);
    const [filtroParceiro, setFiltroParceiro] = useState<string[]>([]); 
    
    const colunasOpcoes = ['Ações (Links)', 'Concessionária', 'Data Ganho', 'Data Protocolo', 'Data Cancelamento', 'Mês Referência', 'Etapa', 'Economia (R$)', 'Fatura Dist. (R$)', 'Eficiência (%)', 'Percentual (%)', 'Comissão (R$)', 'Status Pagamento', 'Data Emissão', 'Vencimento', 'Código PIX', 'Código de Barras'];
    const [colunasAtivas, setColunasAtivas] = useState<string[]>(['Ações (Links)', 'Mês Referência', 'Etapa', 'Status Pagamento', 'Eficiência (%)', 'Comissão (R$)', 'Código PIX']);

    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 25;

    const [parceirosPendentes, setParceirosPendentes] = useState<any[]>([]);
    const [parceirosAtivos, setParceirosAtivos] = useState<any[]>([]);

    const [codigosAsaas, setCodigosAsaas] = useState<Record<string, { pix?: string, barcode?: string, loading?: boolean, error?: string }>>({});
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

    const [comissoes, setComissoes] = useState<Record<string, number>>({});
    
    const [relatorioUc, setRelatorioUc] = useState<string>('');
    const [buscaRelatorio, setBuscaRelatorio] = useState('');
    const [showUcDropdown, setShowUcDropdown] = useState(false);
    const dropdownRelatorioRef = useRef<HTMLDivElement>(null);

    const [loadingDownloads, setLoadingDownloads] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const handleClickOutsideDropdown = (e: any) => { 
            if (dropdownRelatorioRef.current && !dropdownRelatorioRef.current.contains(e.target)) {
                setShowUcDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideDropdown);
        return () => document.removeEventListener('mousedown', handleClickOutsideDropdown);
    }, []);

    useEffect(() => {
        const fetchPlanilhaComissoes = async () => {
            try {
                const sheetId = '1eXq0INVIaa2GFx-xvA4SgS9T4hDrFYflhXwVn-CPDa0';
                const gid = '573005863'; // Altere para o GID da aba "Base API" depois
                const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
                
                const response = await fetch(url);
                const csvText = await response.text();
                
                const parseCSVLine = (text: string) => {
                    const row: string[] = [];
                    let inQuotes = false;
                    let currentVal = '';
                    for (let i = 0; i < text.length; i++) {
                        const char = text[i];
                        if (char === '"') inQuotes = !inQuotes;
                        else if (char === ',' && !inQuotes) { row.push(currentVal.trim()); currentVal = ''; }
                        else currentVal += char;
                    }
                    row.push(currentVal.trim());
                    return row;
                };

                const lines = csvText.split('\n');
                const mapaComissoes: Record<string, number> = {};
                
                lines.slice(1).forEach(line => {
                    const cols = parseCSVLine(line);
                    if(cols.length >= 3) {
                        const uc = cols[0];
                        const percStr = cols[2].replace('%', '').replace(',', '.').trim();
                        const perc = parseFloat(percStr);
                        if(uc && !isNaN(perc)) {
                            mapaComissoes[uc] = perc;
                        }
                    }
                });

                setComissoes(mapaComissoes);
            } catch (err) {
                console.error("Erro ao carregar a planilha de comissões.", err);
            }
        };

        fetchPlanilhaComissoes();
    }, []);

    useEffect(() => {
        if (!parceiroLogado) { navigate('/login-parceiro'); return; }
        if (isAdmin) fetchAcessos();
    }, [parceiroLogado, isAdmin, navigate]);

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

    const setBtnLoading = (id: string, isLoading: boolean) => {
        setLoadingDownloads(prev => ({ ...prev, [id]: isLoading }));
    };

    const handleDownloadGestao = async (uc: string, mesRef: string, type: 'FATURA'|'BOLETO', buttonId: string) => {
        if (!uc || !mesRef) return;
        setBtnLoading(buttonId, true);
        
        try {
            const parts = mesRef.split('/');
            if (parts.length !== 2) throw new Error("Referência de data inválida.");
            const refYm = `${parts[1]}-${parts[0]}`;

            // Chama a NOSSA nova Edge Function segura (Proxy)
            const { data, error } = await supabase.functions.invoke('gestao-docs', {
                body: { uc: uc, mes_ref: refYm, tipo: type }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            if (!data?.url) throw new Error("A plataforma não devolveu a URL.");

            window.open(data.url, '_blank');
            
        } catch (err: any) {
            alert(`Falha ao buscar ${type}: ${err.message}`);
        } finally {
            setBtnLoading(buttonId, false);
        }
    };

    const handleDownloadLumiBoleto = async (uc: string, mesRef: string, buttonId: string) => {
        setBtnLoading(buttonId, true);
        try {
            const email = import.meta.env.VITE_LUMI_EMAIL;
            const senha = import.meta.env.VITE_LUMI_SENHA;
            
            if (!email || !senha) {
                throw new Error("Credenciais da API Lumi não configuradas no arquivo .env (Fale com o suporte técnico)");
            }

            const resLogin = await fetch('https://api.labs-lumi.com.br/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            const loginData = await resLogin.json();
            if (loginData.status !== 'sucesso') throw new Error("Falha de autenticação na Lumi.");
            const token = loginData.token;

            const parts = mesRef.split('/');
            const driveId = `${uc}-${parts[0]}-${parts[1]}`;

            const resBoleto = await fetch('https://api.labs-lumi.com.br/pagamentos/preview-cobranca/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ drive_id: driveId })
            });
            const boletoData = await resBoleto.json();
            
            if (boletoData.status !== 'successo' || !boletoData.data?.toRender?.data) {
                throw new Error("A Lumi não gerou o boleto para esta referência.");
            }

            const byteArray = new Uint8Array(boletoData.data.toRender.data);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `Boleto_Simplifica_${uc}_${parts[0]}_${parts[1]}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (err: any) {
            alert(`Falha ao gerar Boleto Lumi: ${err.message}`);
        } finally {
            setBtnLoading(buttonId, false);
        }
    };

    const handleGerarCodigos = async (asaasId: string, chaveLinha: string) => {
        if (!asaasId) return;
        setCodigosAsaas(prev => ({ ...prev, [chaveLinha]: { loading: true } }));
        
        try {
            const { data, error } = await supabase.functions.invoke('asaas-cobranca', {
                body: { asaas_id: asaasId }
            });
            
            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            const pixResult = data.pix || (data.error_pix ? `Erro: ${data.error_pix}` : 'Pix indisponível para esta cobrança');
            const barcodeResult = data.barcode || (data.error_barcode ? `Erro: ${data.error_barcode}` : 'Código indisponível');

            setCodigosAsaas(prev => ({ 
                ...prev, 
                [chaveLinha]: { pix: pixResult, barcode: barcodeResult, loading: false } 
            }));
        } catch (err: any) {
            setCodigosAsaas(prev => ({ ...prev, [chaveLinha]: { loading: false, error: err.message } }));
            alert('Erro na integração Asaas: ' + err.message);
        }
    };

    const handleGerarMassa = async () => {
        if (!isAdmin || filtroParceiro.length === 0) {
            alert("Selecione ao menos um parceiro no filtro para gerar códigos em massa.");
            return;
        }

        const itemsToProcess = filteredData.filter(r => {
            const isPago = getPaymentBadge(r.status).text === 'Pago';
            const canGeneratePix = r.quem_indicou === 'Alexandria - LEX'; 
            
            return r.asaas_id && !r.codigo_pix && !codigosAsaas[r.id_chave_composta]?.pix && !isPago && canGeneratePix;
        });

        if (itemsToProcess.length === 0) {
            alert("Nenhum boleto Lumi elegível e pendente de geração para este(s) parceiro(s).");
            return;
        }

        if (!confirm(`Deseja gerar os códigos de ${itemsToProcess.length} faturas pendentes agora?`)) return;

        setIsBulkLoading(true);
        setBulkProgress({ current: 0, total: itemsToProcess.length });

        for (let i = 0; i < itemsToProcess.length; i++) {
            const row = itemsToProcess[i];
            const chave = row.id_chave_composta;
            
            setCodigosAsaas(prev => ({ ...prev, [chave]: { loading: true } }));

            try {
                const { data, error } = await supabase.functions.invoke('asaas-cobranca', {
                    body: { asaas_id: row.asaas_id }
                });
                
                if (!error && !data?.error) {
                    const pixResult = data.pix || (data.error_pix ? `Erro Asaas: ${data.error_pix}` : 'Pix indisponível');
                    const barcodeResult = data.barcode || (data.error_barcode ? `Erro Asaas: ${data.error_barcode}` : 'Código indisponível');
                    
                    setCodigosAsaas(prev => ({ ...prev, [chave]: { pix: pixResult, barcode: barcodeResult, loading: false } }));
                } else {
                    setCodigosAsaas(prev => ({ ...prev, [chave]: { loading: false, error: data?.error || 'Erro' } }));
                }
            } catch (err: any) {
                setCodigosAsaas(prev => ({ ...prev, [chave]: { loading: false, error: 'Falha na rede' } }));
            }

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
    const formatMesRef = (m: string) => { if (!m) return '-'; const parts = m.split('-'); if (parts.length >= 2) return `${parts[1]}/${parts[0]}`; return m; };

    // Base bruta tratada
    const data = useMemo(() => {
        if (!rawData) return [];
        const parseNum = (val: any) => (val === null || val === undefined || val === '') ? 0 : (isNaN(Number(val)) ? 0 : Number(val));
        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth() + 1; 

        let dadosTratados = rawData.map((d: any) => ({
            ...d,
            uc: d.uc,
            nome_cliente: d.nome || d.nome_cliente || 'Sem Nome',
            concessionaria: d['concessionária'] || d.concessionaria || d.concessionaria_rd || 'Outra',
            mes_referencia: d['mês_referência'] || d.mes_referencia_formatado || 'N/D',
            objetivo_etapa: d.objetivo_etapa || 'Sem Etapa',
            status: d.status || d['Status Pagamento'],
            quem_indicou: d.quem_indicou || 'Sem Parceiro',
            valor_real_cobranca: parseNum(d.valor_real_cobranca),
            valor_fatura_distribuidora: parseNum(d.valor_fatura_distribuidora),
            is_consorcio: d.is_consorcio || 'Não',
            fonte_dados: d.fonte_dados, 
            boleto_simplifica: parseNum(d.boleto_simplifica) || parseNum(d.valor_real_cobranca),
            consumo_kwh: parseNum(d.consumo_kwh),
            consumo_crm_kwh: (parseNum(d.consumo_crm_mwh) || parseNum(d['consumo_médio_na_venda_mwh'])) * 1000,
            compensacao_kwh: parseNum(d.compensacao_kwh) || parseNum(d['compensação_total_kwh']),
            eficiencia_compensacao: parseNum(d.eficiencia_compensacao),
            economia_rs: parseNum(d.economia_rs),
            data_ganho: d.data_ganho,
            data_protocolo: d.data_protocolo || d['data_do_1º_protocolo'],
            data_cancelamento: d.data_cancelamento || d['data_de_pedido_de_cancelamento'],
            data_emissao: d.data_emissao || d.emissão_do_boleto,
            vencimento: d.vencimento || d.vencimento_do_boleto,
            codigo_pix: d.codigo_pix,       
            codigo_barras: d.codigo_barras,
            asaas_id: d.asaas_id,
            id_chave_composta: d.id_chave_composta || `${d.uc}-${d['mês_referência']}`,
            link_fatura: d.link_fatura // campo do banco que tem o UUID da lumi ou link direto
        }));

        dadosTratados = dadosTratados.filter((d: any) => {
            if (d.fonte_dados === 'RD') return false; 

            if (!d.mes_referencia || d.mes_referencia === 'N/D' || d.mes_referencia === '-') return true; 
            if (d.mes_referencia.includes('-')) {
                const parts = String(d.mes_referencia).split('-');
                if (parts.length >= 2) {
                    const anoRef = Number(parts[0]);
                    const mesRef = Number(parts[1]);
                    if (anoRef > anoAtual) return false; 
                    if (anoRef === anoAtual && mesRef > mesAtual) return false; 
                }
            } 
            else if (d.mes_referencia.includes('/')) {
                const parts = String(d.mes_referencia).split('/');
                if (parts.length === 2) {
                    const mesRef = Number(parts[0]);
                    const anoRef = Number(parts[1]);
                    if (anoRef > anoAtual) return false;
                    if (anoRef === anoAtual && mesRef > mesAtual) return false;
                }
            }
            return true;
        });

        if (isAdmin) return dadosTratados; 
        return dadosTratados.filter((d: any) => d.quem_indicou === parceiroLogado);
    }, [rawData, isAdmin, parceiroLogado]);

    const ucsUnicas = useMemo(() => {
        const map = new Map();
        data.forEach(d => {
            if(!map.has(d.uc)) map.set(d.uc, `${d.uc} - ${d.nome_cliente}`);
        });
        return Array.from(map.entries()).map(([uc, label]) => ({ uc, label })).sort((a,b) => a.label.localeCompare(b.label));
    }, [data]);

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const s = busca.toLowerCase();
            const matchBusca = !s || (item.uc?.toLowerCase().includes(s)) || (item.nome_cliente?.toLowerCase().includes(s));
            const matchEtapa = filtroEtapa.length === 0 || filtroEtapa.includes(item.objetivo_etapa);
            const matchConc = filtroConc.length === 0 || filtroConc.includes(item.concessionaria);
            const matchMes = filtroMes.length === 0 || filtroMes.includes(formatMesRef(item.mes_referencia));
            const matchStatus = filtroStatus.length === 0 || filtroStatus.includes(getPaymentBadge(item.status).text);
            const matchParceiro = filtroParceiro.length === 0 || filtroParceiro.includes(item.quem_indicou);

            return matchBusca && matchEtapa && matchConc && matchMes && matchStatus && matchParceiro;
        });
    }, [data, busca, filtroEtapa, filtroConc, filtroMes, filtroStatus, filtroParceiro]);

    const metrics = useMemo(() => {
        const uniqueUcs = new Set();
        const totals = filteredData.reduce((acc, row) => {
            uniqueUcs.add(row.uc);
            acc.consumo += (row.consumo_kwh || 0);
            acc.compensacao += (row.compensacao_kwh || 0);
            acc.boleto += (row.boleto_simplifica || 0);
            acc.economia += (row.economia_rs || 0);

            const badge = getPaymentBadge(row.status);
            if (badge.text === 'Pago') {
                let baseCalculoComissao = row.valor_real_cobranca || 0;
                if (row.concessionaria?.toUpperCase().includes('EQUATORIAL') && row.concessionaria?.toUpperCase().includes('GO') && row.is_consorcio?.toUpperCase() === 'SIM') {
                    baseCalculoComissao = Math.max(0, (row.valor_real_cobranca || 0) - (row.valor_fatura_distribuidora || 0));
                }
                const perc = comissoes[row.uc] || 0;
                acc.comissao += (baseCalculoComissao * (perc / 100));
            }

            return acc;
        }, { consumo: 0, compensacao: 0, boleto: 0, economia: 0, comissao: 0 });

        return { ...totals, totalUcs: uniqueUcs.size };
    }, [filteredData, comissoes]);

    const paginatedData = filteredData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    const optEtapas = Array.from(new Set(data.map(d => d.objetivo_etapa))).sort();
    const optConc = Array.from(new Set(data.map(d => d.concessionaria))).sort();
    const optParceiros = Array.from(new Set(data.map(d => d.quem_indicou))).filter(Boolean).sort();
    const optStatus = ['Pago', 'Atrasado', 'Aberto', '-'];
    
    const optMes = Array.from(new Set(data.map(d => formatMesRef(d.mes_referencia))))
        .filter(m => m !== '-')
        .sort((a: any, b: any) => {
            const [mA, yA] = a.split('/'); const [mB, yB] = b.split('/');
            return new Date(yB, mB - 1).getTime() - new Date(yA, mA - 1).getTime();
        });

    const handleDownloadCSV = () => {
        if (filteredData.length === 0) return;

        const headers = ['UC', 'Cliente'];
        if (isAdmin) headers.push('Parceiro Dono');
        headers.push('Consumo (kWh)', 'Compensacao (kWh)', 'Boleto (R$)');
        
        if (colunasAtivas.includes('Fatura Dist. (R$)')) headers.push('Fatura Dist. (R$)');
        if (colunasAtivas.includes('Eficiência (%)')) headers.push('Eficiência (%)');
        if (colunasAtivas.includes('Percentual (%)')) headers.push('Percentual (%)');
        if (colunasAtivas.includes('Comissão (R$)')) headers.push('Comissao (R$)');
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
            
            rowData.push(
                row.consumo_kwh, 
                row.compensacao_kwh, 
                row.boleto_simplifica
            );

            const perc = comissoes[row.uc] || 0;
            let comissaoTotal = 0;
            
            if (isPago) {
                let baseCalc = row.valor_real_cobranca || 0;
                if (row.concessionaria?.toUpperCase().includes('EQUATORIAL') && row.concessionaria?.toUpperCase().includes('GO') && row.is_consorcio?.toUpperCase() === 'SIM') {
                    baseCalc = Math.max(0, (row.valor_real_cobranca || 0) - (row.valor_fatura_distribuidora || 0));
                }
                comissaoTotal = baseCalc * (perc / 100);
            }

            if (colunasAtivas.includes('Fatura Dist. (R$)')) rowData.push(row.valor_fatura_distribuidora || 0);
            if (colunasAtivas.includes('Eficiência (%)')) rowData.push(row.eficiencia_compensacao > 0 ? (row.eficiencia_compensacao * 100).toFixed(1) + '%' : '-');
            if (colunasAtivas.includes('Percentual (%)')) rowData.push(perc > 0 ? `${perc}%` : '-');
            if (colunasAtivas.includes('Comissão (R$)')) rowData.push(isPago && comissaoTotal > 0 ? comissaoTotal : '-');
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

    // --- CÁLCULO DOS DADOS DO RELATÓRIO DO CLIENTE ---
    const relatorioData = useMemo(() => {
        if (!relatorioUc) return null;
        
        const historico = data.filter(d => d.uc === relatorioUc).sort((a:any, b:any) => {
            const [mA, yA] = (a.mes_referencia || '0/0').split('/'); 
            const [mB, yB] = (b.mes_referencia || '0/0').split('/');
            return new Date(yA, mA - 1).getTime() - new Date(yB, mB - 1).getTime();
        });

        if (historico.length === 0) return null;

        const infoCadastral = historico[historico.length - 1]; 

        let totalEco = 0;
        let custoCom = 0;
        let custoSem = 0;
        let totalConsumo = 0;
        let totalComp = 0;
        let countFaturasValidas = 0;
        
        let sumEficiencia = 0;
        let countEficiencia = 0;
        const chartData: any[] = [];

        historico.forEach(row => {
            totalEco += (row.economia_rs || 0);
            totalComp += (row.compensacao_kwh || 0);
            totalConsumo += (row.consumo_kwh || 0);

            // Regra Matemática: Valor Sem Simplifica vs Valor Pago
            let isEqGoConsorcio = row.concessionaria?.toUpperCase().includes('EQUATORIAL') && row.concessionaria?.toUpperCase().includes('GO') && row.is_consorcio?.toUpperCase() === 'SIM';
            let pagoSimplifica = row.boleto_simplifica || 0;
            let faturaDist = row.valor_fatura_distribuidora || 0;
            let economia = row.economia_rs || 0;

            let pagoTotalCliente = isEqGoConsorcio ? pagoSimplifica : (pagoSimplifica + faturaDist);
            let valorSemSimplifica = pagoTotalCliente + economia;

            custoCom += pagoTotalCliente;
            custoSem += valorSemSimplifica;
            
            if (valorSemSimplifica > 0) countFaturasValidas++;

            if (row.eficiencia_compensacao > 0) {
                sumEficiencia += row.eficiencia_compensacao;
                countEficiencia++;
            }

            if (row.mes_referencia && row.mes_referencia !== 'N/D') {
                chartData.push({
                    mes: formatMesRef(row.mes_referencia),
                    consumo: row.consumo_kwh || 0,
                    compensacao: row.compensacao_kwh || 0,
                    economia: row.economia_rs || 0
                });
            }
        });

        const eficienciaMedia = countEficiencia > 0 ? (sumEficiencia / countEficiencia) * 100 : 0;
        const mediaCustoSem = countFaturasValidas > 0 ? custoSem / countFaturasValidas : 0;
        const mesesGratis = mediaCustoSem > 0 ? (totalEco / mediaCustoSem) : 0;
        
        const ultimasFaturas = [...historico].reverse().slice(0, 6);

        return {
            infoCadastral,
            totalEco,
            custoCom,
            custoSem,
            totalConsumo,
            totalComp,
            eficienciaMedia,
            mesesGratis,
            chartData,
            ultimasFaturas
        };
    }, [relatorioUc, data]);

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
        <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
            
            {/* CSS BLINDADO PARA IMPRESSÃO EM A4 (FUNDO ESCURO OBRIGATÓRIO) */}
            {activeTab === 'relatorio' && (
                <style>
                    {`
                        @media print {
                            @page { size: A4 portrait; margin: 5mm; }
                            html, body, #root {
                                background-color: #020617 !important;
                                color: white !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                height: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }
                            .page-break-inside-avoid {
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                            }
                        }
                    `}
                </style>
            )}

            {/* CABEÇALHO (Oculto na impressão) */}
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
                        <button onClick={() => setActiveTab('relatorio')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'relatorio' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><FileText size={16}/> Relatório do Cliente</button>
                        {isAdmin && (
                            <button onClick={() => setActiveTab('gestao')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'gestao' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><KeyRound size={16}/> Senhas</button>
                        )}
                    </div>
                    <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-2 text-sm font-bold">
                        <LogOut size={18} /> Sair
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1600px] w-full mx-auto print:p-0 print:m-0 print:block">
                
                {activeTab === 'carteira' && (
                    <div className="print:hidden space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-in fade-in zoom-in duration-300">
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                                <div className="bg-indigo-500/10 p-3 rounded-full"><Users size={24} className="text-indigo-400"/></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">UCs Vinculadas</p>
                                    <p className="text-xl font-bold font-mono text-white">{new Intl.NumberFormat('pt-BR').format(metrics.totalUcs)}</p>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                                <div className="bg-blue-500/10 p-3 rounded-full"><Zap size={24} className="text-blue-500"/></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Consumo Real</p>
                                    <p className="text-xl font-bold font-mono text-white">{Math.round(metrics.consumo).toLocaleString('pt-BR')} <span className="text-[10px] text-slate-400">kWh</span></p>
                                </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                                <div className="bg-emerald-500/10 p-3 rounded-full"><Zap size={24} className="text-emerald-500"/></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Compensação</p>
                                    <p className="text-xl font-bold font-mono text-white">{Math.round(metrics.compensacao).toLocaleString('pt-BR')} <span className="text-[10px] text-slate-400">kWh</span></p>
                                </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                                <div className="bg-yellow-500/10 p-3 rounded-full"><Receipt size={24} className="text-yellow-500"/></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Faturamento</p>
                                    <p className="text-xl font-bold font-display text-white">{formatMoney(metrics.boleto)}</p>
                                </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                                <div className="bg-emerald-500/10 p-3 rounded-full"><PiggyBank size={24} className="text-emerald-400"/></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Economia Cliente</p>
                                    <p className="text-xl font-bold font-display text-emerald-400">{formatMoney(metrics.economia)}</p>
                                </div>
                            </div>
                            <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                                <div className="bg-indigo-500/20 p-3 rounded-full"><Wallet size={24} className="text-indigo-400"/></div>
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-0.5">Comissão Total</p>
                                    <p className="text-xl font-bold font-display text-indigo-400">{formatMoney(metrics.comissao)}</p>
                                </div>
                            </div>
                        </div>

                        <section className={`bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm grid gap-3 items-end ${isAdmin ? 'grid-cols-1 md:grid-cols-3 xl:grid-cols-7' : 'grid-cols-1 md:grid-cols-3 xl:grid-cols-6'}`}>
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

                        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col flex-1">
                            <div className="p-4 border-b border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/50">
                                <h2 className="font-display font-bold text-white flex items-center gap-2"><TableIcon className="text-yellow-500" size={20}/> Tabela de Acompanhamento</h2>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">{filteredData.length} registros</span>
                                    
                                    {isAdmin && filtroParceiro.length > 0 && (
                                        <button 
                                            onClick={handleGerarMassa} 
                                            disabled={isBulkLoading} 
                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                                            title="Gera os códigos em massa apenas para faturas da Lumi pendentes da Alexandria"
                                        >
                                            {isBulkLoading ? (
                                                <><Loader2 size={16} className="animate-spin" /> {bulkProgress.current}/{bulkProgress.total}</>
                                            ) : (
                                                <><PlayCircle size={16} /> Gerar em Massa</>
                                            )}
                                        </button>
                                    )}

                                    <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-white transition-colors" title="Baixar CSV">
                                        <Download size={16} /> <span className="hidden sm:inline">CSV</span>
                                    </button>
                                    
                                    <MultiSelect options={colunasOpcoes} selected={colunasAtivas} onChange={setColunasAtivas} placeholder="Colunas Opcionais" icon={Settings2} />
                                </div>
                            </div>

                            <div className="overflow-x-auto min-h-[400px]">
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="bg-slate-950 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                                        <tr>
                                            <th className="px-5 py-4">UC / Cliente</th>
                                            {colunasAtivas.includes('Ações (Links)') && <th className="px-5 py-4 text-center">Ações (Links)</th>}
                                            {isAdmin && <th className="px-5 py-4 text-indigo-400 bg-indigo-900/10">Parceiro Dono</th>}
                                            <th className="px-5 py-4 text-right">Consumo (kWh)</th>
                                            <th className="px-5 py-4 text-right">Compensação (kWh)</th>
                                            <th className="px-5 py-4 text-right">Boleto (R$)</th>
                                            
                                            {colunasAtivas.includes('Fatura Dist. (R$)') && <th className="px-5 py-4 text-right text-slate-300">Fatura Dist. (R$)</th>}
                                            {colunasAtivas.includes('Eficiência (%)') && <th className="px-5 py-4 text-center">Eficiência (%)</th>}
                                            {colunasAtivas.includes('Percentual (%)') && <th className="px-5 py-4 text-center text-slate-300">Percentual (%)</th>}
                                            {colunasAtivas.includes('Comissão (R$)') && <th className="px-5 py-4 text-right text-indigo-400">Comissão (R$)</th>}
                                            {colunasAtivas.includes('Etapa') && <th className="px-5 py-4">Etapa</th>}
                                            {colunasAtivas.includes('Status Pagamento') && <th className="px-5 py-4 text-center">Status</th>}
                                            {colunasAtivas.includes('Concessionária') && <th className="px-5 py-4">Concessionária</th>}
                                            {colunasAtivas.includes('Mês Referência') && <th className="px-5 py-4 text-center">Mês Ref.</th>}
                                            {colunasAtivas.includes('Economia (R$)') && <th className="px-5 py-4 text-right text-emerald-400">Economia (R$)</th>}
                                            {colunasAtivas.includes('Data Ganho') && <th className="px-5 py-4 text-slate-500">Dt. Ganho</th>}
                                            {colunasAtivas.includes('Data Protocolo') && <th className="px-5 py-4 text-slate-500">Dt. Protocolo</th>}
                                            {colunasAtivas.includes('Data Cancelamento') && <th className="px-5 py-4 text-slate-500">Dt. Cancelamento</th>}
                                            {colunasAtivas.includes('Data Emissão') && <th className="px-5 py-4 text-slate-500">Dt. Emissão</th>}
                                            {colunasAtivas.includes('Vencimento') && <th className="px-5 py-4 text-slate-500">Vencimento</th>}
                                            {colunasAtivas.includes('Código PIX') && <th className="px-5 py-4 text-slate-300">Código PIX (Copia/Cola)</th>}
                                            {colunasAtivas.includes('Código de Barras') && <th className="px-5 py-4 text-slate-300">Código de Barras</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {paginatedData.map((row) => {
                                            const badge = getPaymentBadge(row.status);
                                            const isPago = badge.text === 'Pago';
                                            const isAlexandria = row.quem_indicou === 'Alexandria - LEX';
                                            const chaveLinha = row.id_chave_composta || `${row.uc}-${row.mes_referencia}`;

                                            // Cor da Eficiência
                                            const eficPercent = (row.eficiencia_compensacao || 0) * 100;
                                            let eficColor = 'text-rose-400';
                                            let eficBg = 'bg-rose-900/40 border-rose-800/50';
                                            if (eficPercent >= 90) { eficColor = 'text-emerald-400'; eficBg = 'bg-emerald-900/40 border-emerald-800/50'; }
                                            else if (eficPercent >= 70) { eficColor = 'text-yellow-400'; eficBg = 'bg-yellow-900/40 border-yellow-800/50'; }

                                            // Link direto da Lumi se for o caso
                                            const faturaLumiUrl = (row.fonte_dados === 'LUMI' && row.link_fatura) 
                                                ? `https://api.labs-lumi.com.br/faturas/download/${row.link_fatura}` 
                                                : null;

                                            return (
                                                <tr key={chaveLinha} className="hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <div className="font-mono text-slate-200 font-bold">{row.uc}</div>
                                                        <div className="text-xs text-slate-500 truncate max-w-[200px]" title={row.nome_cliente}>{row.nome_cliente || 'Sem Nome'}</div>
                                                    </td>

                                                    {/* NOVA COLUNA AÇÕES LADO A LADO COM O NOME */}
                                                    {colunasAtivas.includes('Ações (Links)') && (
                                                        <td className="px-5 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {/* BOTÃO FATURA CONCESSIONÁRIA */}
                                                                {row.fonte_dados === 'UNIFICA' ? (
                                                                    <button 
                                                                        onClick={() => handleDownloadGestao(row.uc, row.mes_referencia, 'FATURA', `btn_fat_${chaveLinha}`)}
                                                                        disabled={loadingDownloads[`btn_fat_${chaveLinha}`]}
                                                                        title="Fatura da Concessionária (Unifica)" 
                                                                        className="p-1.5 bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-400 rounded-md transition-colors disabled:opacity-50"
                                                                    >
                                                                        {loadingDownloads[`btn_fat_${chaveLinha}`] ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16} />}
                                                                    </button>
                                                                ) : faturaLumiUrl ? (
                                                                    <a 
                                                                        href={faturaLumiUrl} 
                                                                        target="_blank" rel="noopener noreferrer" 
                                                                        title="Fatura da Concessionária (Lumi)" 
                                                                        className="p-1.5 bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-400 rounded-md transition-colors flex items-center justify-center"
                                                                    >
                                                                        <FileDown size={16} />
                                                                    </a>
                                                                ) : (
                                                                    <div title="Fatura da Concessionária não disponível" className="p-1.5 bg-slate-900 text-slate-700 rounded-md cursor-not-allowed">
                                                                        <FileDown size={16} />
                                                                    </div>
                                                                )}
                                                                
                                                                {/* BOTÃO BOLETO SIMPLIFICA */}
                                                                {row.fonte_dados === 'UNIFICA' ? (
                                                                    <button 
                                                                        onClick={() => handleDownloadGestao(row.uc, row.mes_referencia, 'BOLETO', `btn_bol_${chaveLinha}`)}
                                                                        disabled={loadingDownloads[`btn_bol_${chaveLinha}`]}
                                                                        title="Boleto Simplifica (Unifica)" 
                                                                        className="p-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-md transition-colors disabled:opacity-50"
                                                                    >
                                                                        {loadingDownloads[`btn_bol_${chaveLinha}`] ? <Loader2 size={16} className="animate-spin"/> : <Receipt size={16} />}
                                                                    </button>
                                                                ) : row.fonte_dados === 'LUMI' ? (
                                                                    <button 
                                                                        onClick={() => handleDownloadLumiBoleto(row.uc, row.mes_referencia, `btn_bol_${chaveLinha}`)}
                                                                        disabled={loadingDownloads[`btn_bol_${chaveLinha}`]}
                                                                        title="Gerar PDF Boleto Simplifica (Lumi)" 
                                                                        className="p-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-md transition-colors disabled:opacity-50"
                                                                    >
                                                                        {loadingDownloads[`btn_bol_${chaveLinha}`] ? <Loader2 size={16} className="animate-spin"/> : <Receipt size={16} />}
                                                                    </button>
                                                                ) : (
                                                                    <div title="Link de cobrança não disponível" className="p-1.5 bg-slate-900 text-slate-700 rounded-md cursor-not-allowed">
                                                                        <Receipt size={16} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}

                                                    {isAdmin && <td className="px-5 py-3 text-xs font-medium text-indigo-300 bg-indigo-900/5">{row.quem_indicou || '-'}</td>}
                                                    <td className="px-5 py-3 text-right font-mono text-slate-300">{Number(row.consumo_kwh).toLocaleString('pt-BR')}</td>
                                                    <td className="px-5 py-3 text-right font-mono text-emerald-400">{Number(row.compensacao_kwh).toLocaleString('pt-BR')}</td>
                                                    <td className="px-5 py-3 text-right font-medium text-yellow-400">{formatMoney(row.boleto_simplifica)}</td>

                                                    {colunasAtivas.includes('Fatura Dist. (R$)') && (
                                                        <td className="px-5 py-3 text-right font-mono text-slate-300">
                                                            {formatMoney(row.valor_fatura_distribuidora || 0)}
                                                        </td>
                                                    )}

                                                    {colunasAtivas.includes('Eficiência (%)') && (
                                                        <td className="px-5 py-3 text-center">
                                                            {row.eficiencia_compensacao > 0 ? (
                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold border ${eficColor} ${eficBg}`}>
                                                                    {eficPercent.toFixed(1)}%
                                                                </span>
                                                            ) : <span className="text-slate-600">-</span>}
                                                        </td>
                                                    )}

                                                    {colunasAtivas.includes('Percentual (%)') && (
                                                        <td className="px-5 py-3 text-center text-slate-400 font-mono">
                                                            {comissoes[row.uc] ? `${comissoes[row.uc]}%` : '-'}
                                                        </td>
                                                    )}

                                                    {colunasAtivas.includes('Comissão (R$)') && (
                                                        <td className="px-5 py-3 text-right font-mono text-indigo-400 font-bold">
                                                            {(() => {
                                                                if (!isPago) return <span className="text-slate-600 font-normal">-</span>;
                                                                let baseCalc = row.valor_real_cobranca || 0;
                                                                if (row.concessionaria?.toUpperCase().includes('EQUATORIAL') && row.concessionaria?.toUpperCase().includes('GO') && row.is_consorcio?.toUpperCase() === 'SIM') {
                                                                    baseCalc = Math.max(0, (row.valor_real_cobranca || 0) - (row.valor_fatura_distribuidora || 0));
                                                                }
                                                                const perc = comissoes[row.uc] || 0;
                                                                const comissaoVal = baseCalc * (perc / 100);
                                                                return comissaoVal > 0 ? formatMoney(comissaoVal) : <span className="text-slate-600 font-normal">-</span>;
                                                            })()}
                                                        </td>
                                                    )}

                                                    {colunasAtivas.includes('Etapa') && <td className="px-5 py-3 text-xs text-slate-300">{row.objetivo_etapa || '-'}</td>}
                                                    {colunasAtivas.includes('Status Pagamento') && (
                                                        <td className="px-5 py-3 text-center">
                                                            {badge.text !== '-' ? <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${badge.color} ${badge.bg}`}>{badge.text}</span> : <span className="text-slate-600">-</span>}
                                                        </td>
                                                    )}
                                                    {colunasAtivas.includes('Concessionária') && <td className="px-5 py-3 text-xs text-slate-400">{row.concessionaria || '-'}</td>}
                                                    {colunasAtivas.includes('Mês Referência') && <td className="px-5 py-3 text-center font-mono text-xs text-slate-400">{formatMesRef(row.mes_referencia)}</td>}
                                                    {colunasAtivas.includes('Economia (R$)') && <td className="px-5 py-3 text-right text-emerald-500">{formatMoney(row.economia_rs)}</td>}
                                                    {colunasAtivas.includes('Data Ganho') && <td className="px-5 py-3 text-xs text-slate-500">{toDateBR(row.data_ganho)}</td>}
                                                    {colunasAtivas.includes('Data Protocolo') && <td className="px-5 py-3 text-xs text-slate-500">{toDateBR(row.data_protocolo)}</td>}
                                                    {colunasAtivas.includes('Data Cancelamento') && <td className="px-5 py-3 text-xs text-rose-500/70">{toDateBR(row.data_cancelamento)}</td>}
                                                    {colunasAtivas.includes('Data Emissão') && <td className="px-5 py-3 text-xs text-slate-500">{toDateBR(row.data_emissao)}</td>}
                                                    {colunasAtivas.includes('Vencimento') && <td className="px-5 py-3 text-xs text-slate-500">{toDateBR(row.vencimento)}</td>}
                                                    
                                                    {colunasAtivas.includes('Código PIX') && (
                                                        <td className="px-5 py-3 text-xs font-mono text-slate-400">
                                                            {isPago ? (
                                                                <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Fatura Paga</span>
                                                            ) : row.codigo_pix ? (
                                                                <span className="bg-slate-950 border border-slate-700 px-2 py-1 rounded truncate max-w-[120px] inline-block cursor-pointer hover:border-yellow-500" title="Clique para copiar" onClick={() => navigator.clipboard.writeText(row.codigo_pix)}>{row.codigo_pix}</span>
                                                            ) : row.asaas_id ? (
                                                                !isAlexandria ? (
                                                                    <span className="text-slate-500 text-[10px] uppercase font-bold px-2 py-1 bg-slate-800 rounded border border-slate-700" title="Geração de código via painel desabilitada para este parceiro">Emissão Restrita</span>
                                                                ) : codigosAsaas[chaveLinha]?.pix ? (
                                                                    <span className="bg-slate-950 border border-slate-700 px-2 py-1 rounded truncate max-w-[120px] inline-block cursor-pointer hover:border-emerald-500 text-emerald-400" title={codigosAsaas[chaveLinha]?.pix} onClick={() => navigator.clipboard.writeText(codigosAsaas[chaveLinha]?.pix!)}>{codigosAsaas[chaveLinha]?.pix}</span>
                                                                ) : (
                                                                    <button onClick={() => handleGerarCodigos(row.asaas_id, chaveLinha)} disabled={codigosAsaas[chaveLinha]?.loading} className="px-2 py-1 bg-slate-800 hover:bg-blue-600 text-white border border-slate-700 rounded font-sans text-[10px] uppercase font-bold disabled:opacity-50 transition-colors shadow-sm">
                                                                        {codigosAsaas[chaveLinha]?.loading ? 'Gerando...' : 'Gerar PIX Lumi'}
                                                                    </button>
                                                                )
                                                            ) : '-'}
                                                        </td>
                                                    )}
                                                    
                                                    {colunasAtivas.includes('Código de Barras') && (
                                                        <td className="px-5 py-3 text-xs font-mono text-slate-400">
                                                            {isPago ? (
                                                                <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Fatura Paga</span>
                                                            ) : row.codigo_barras ? (
                                                                <span className="bg-slate-950 border border-slate-700 px-2 py-1 rounded truncate max-w-[120px] inline-block cursor-pointer hover:border-yellow-500" title="Clique para copiar" onClick={() => navigator.clipboard.writeText(row.codigo_barras)}>{row.codigo_barras}</span>
                                                            ) : row.asaas_id ? (
                                                                !isAlexandria ? (
                                                                    <span className="text-slate-500 text-[10px] uppercase font-bold px-2 py-1 bg-slate-800 rounded border border-slate-700" title="Geração de código via painel desabilitada para este parceiro">Emissão Restrita</span>
                                                                ) : codigosAsaas[chaveLinha]?.barcode ? (
                                                                    <span className="bg-slate-950 border border-slate-700 px-2 py-1 rounded truncate max-w-[120px] inline-block cursor-pointer hover:border-emerald-500 text-emerald-400" title={codigosAsaas[chaveLinha]?.barcode} onClick={() => navigator.clipboard.writeText(codigosAsaas[chaveLinha]?.barcode!)}>{codigosAsaas[chaveLinha]?.barcode}</span>
                                                                ) : (
                                                                    <span className="text-slate-600 text-[10px] uppercase font-bold px-2 py-1 bg-slate-900 rounded border border-slate-800">Gere via botão PIX</span>
                                                                )
                                                            ) : '-'}
                                                        </td>
                                                    )}

                                                </tr>
                                            )
                                        })}
                                        {paginatedData.length === 0 && <tr><td colSpan={20} className="text-center py-12 text-slate-500">Nenhum dado encontrado.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-950 border-t border-slate-800 text-sm text-slate-400">
                                <div>Página <span className="font-bold text-white">{page}</span> de {totalPages || 1}</div>
                                <div className="flex gap-2">
                                    <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50"><ChevronLeft size={16}/></button>
                                    <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50"><ChevronRight size={16}/></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ABA: RELATÓRIO DO CLIENTE (PRINT-FRIENDLY A4) --- */}
                {activeTab === 'relatorio' && (
                    <div className="flex flex-col gap-6 w-full mx-auto print:max-w-[210mm] print:m-0 page-break-inside-avoid">
                        {/* CONTROLES DE IMPRESSÃO - SOMEM AO IMPRIMIR */}
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl print:hidden flex flex-col sm:flex-row gap-4 justify-between items-center z-20 max-w-[900px] w-full mx-auto">
                            <div className="flex flex-col gap-1 w-full sm:w-[400px]">
                                <label className="text-xs font-bold font-display text-slate-400 uppercase tracking-wider">Selecione o Cliente / UC</label>
                                <div className="relative w-full" ref={dropdownRelatorioRef}>
                                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                                    <input 
                                        type="text" 
                                        placeholder="Digite nome ou UC..." 
                                        value={buscaRelatorio}
                                        onChange={e => {
                                            setBuscaRelatorio(e.target.value);
                                            setShowUcDropdown(true);
                                        }}
                                        onFocus={() => setShowUcDropdown(true)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                    {showUcDropdown && buscaRelatorio && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                                            {ucsUnicas.filter(c => c.label.toLowerCase().includes(buscaRelatorio.toLowerCase())).map(c => (
                                                <div 
                                                    key={c.uc} 
                                                    className="p-3 border-b border-slate-800 hover:bg-slate-800 cursor-pointer text-sm text-slate-200"
                                                    onClick={() => {
                                                        setRelatorioUc(c.uc);
                                                        setBuscaRelatorio(c.label);
                                                        setShowUcDropdown(false);
                                                    }}
                                                >
                                                    {c.label}
                                                </div>
                                            ))}
                                            {ucsUnicas.filter(c => c.label.toLowerCase().includes(buscaRelatorio.toLowerCase())).length === 0 && (
                                                <div className="p-4 text-center text-sm text-slate-500">Nenhum cliente encontrado</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => window.print()}
                                disabled={!relatorioData}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-bold flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
                            >
                                <Printer size={18}/> Salvar / Imprimir (PDF)
                            </button>
                        </div>

                        {/* O RELATÓRIO EM SI (Forçando fundo escuro mesmo na impressão, constrito no A4) */}
                        {relatorioData ? (
                            <div className="bg-slate-900 print:bg-[#020617] border border-slate-800 rounded-2xl p-8 shadow-2xl print:border-none print:shadow-none print:p-0 print:m-0 w-full max-w-[900px] mx-auto print:max-w-full print:text-white page-break-inside-avoid">
                                
                                {/* HEADER RELATÓRIO */}
                                <div className="flex justify-between items-start border-b border-slate-800 pb-6 print:pb-3 mb-6 print:mb-4">
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

                                {/* INFO CADASTRAL E STATUS */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-2 mb-8 print:mb-4">
                                    <div className="bg-slate-950 p-4 print:p-2 rounded-xl border border-slate-800 print:border-slate-800">
                                        <p className="text-[10px] print:text-[8px] font-bold text-slate-500 uppercase mb-1">Concessionária</p>
                                        <p className="text-sm print:text-xs font-bold text-slate-200">{relatorioData.infoCadastral.concessionaria}</p>
                                    </div>
                                    <div className="bg-slate-950 p-4 print:p-2 rounded-xl border border-slate-800 print:border-slate-800">
                                        <p className="text-[10px] print:text-[8px] font-bold text-slate-500 uppercase mb-1">Cliente Desde</p>
                                        <p className="text-sm print:text-xs font-bold text-slate-200">{toDateBR(relatorioData.infoCadastral.data_ganho) !== '-' ? toDateBR(relatorioData.infoCadastral.data_ganho) : 'Não informado'}</p>
                                    </div>
                                    <div className="bg-slate-950 p-4 print:p-2 rounded-xl border border-slate-800 print:border-slate-800">
                                        <p className="text-[10px] print:text-[8px] font-bold text-slate-500 uppercase mb-1">Eficiência Média</p>
                                        <p className={`text-sm print:text-xs font-bold ${relatorioData.eficienciaMedia >= 90 ? 'text-emerald-400' : relatorioData.eficienciaMedia >= 70 ? 'text-yellow-400' : 'text-rose-400'}`}>
                                            {relatorioData.eficienciaMedia > 0 ? relatorioData.eficienciaMedia.toFixed(1) + '%' : 'N/D'}
                                        </p>
                                    </div>
                                    <div className="bg-slate-950 p-4 print:p-2 rounded-xl border border-slate-800 print:border-slate-800">
                                        <p className="text-[10px] print:text-[8px] font-bold text-slate-500 uppercase mb-1">Consumo Total</p>
                                        <p className="text-sm print:text-xs font-bold text-slate-200">
                                            {Math.round(relatorioData.totalConsumo).toLocaleString('pt-BR')} kWh
                                        </p>
                                    </div>
                                </div>

                                {/* GRANDES NÚMEROS DE ECONOMIA E COMPENSAÇÃO */}
                                <div className="flex flex-col sm:flex-row gap-6 print:gap-4 mb-8 print:mb-4 page-break-inside-avoid">
                                    <div className="flex-1 bg-emerald-900/10 border border-emerald-800/30 print:border-emerald-800/50 p-6 print:p-4 rounded-2xl flex items-center justify-center flex-col text-center">
                                        <PiggyBank size={32} className="text-emerald-500 mb-3 print:mb-1 print:h-6 print:w-6"/>
                                        <p className="text-xs print:text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Economia Total Acumulada</p>
                                        <h2 className="text-4xl print:text-2xl font-display font-extrabold text-white">{formatMoney(relatorioData.totalEco)}</h2>
                                        
                                        {relatorioData.mesesGratis > 0 && (
                                            <div className="mt-3 print:mt-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 print:py-0.5 rounded-full text-[10px] print:text-[8px] font-bold uppercase tracking-wider border border-emerald-500/30">
                                                🎉 Equivale a {relatorioData.mesesGratis.toFixed(1).replace('.0', '')} faturas grátis
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 bg-blue-900/10 border border-blue-800/30 print:border-blue-800/50 p-6 print:p-4 rounded-2xl flex items-center justify-center flex-col text-center">
                                        <Zap size={32} className="text-blue-500 mb-3 print:mb-1 print:h-6 print:w-6"/>
                                        <p className="text-xs print:text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Total de Energia Compensada</p>
                                        <h2 className="text-4xl print:text-2xl font-display font-extrabold text-white">{Math.round(relatorioData.totalComp).toLocaleString('pt-BR')} <span className="text-lg print:text-sm text-blue-400">kWh</span></h2>
                                    </div>
                                </div>

                                {/* MÉTRICAS FINANCEIRAS COMPARATIVAS */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:gap-2 mb-8 print:mb-6 page-break-inside-avoid">
                                    <div className="bg-slate-900 p-4 print:p-2 border border-slate-700 rounded-xl flex justify-between items-center">
                                        <div className="flex items-center gap-3 print:gap-2">
                                            <div className="bg-rose-500/10 p-2 print:p-1 rounded-full"><TrendingUp size={18} className="text-rose-400 print:h-4 print:w-4"/></div>
                                            <span className="text-sm print:text-[10px] font-bold text-slate-400">Total que seria pago na Concessionária</span>
                                        </div>
                                        <span className="text-lg print:text-sm font-bold text-white">{formatMoney(relatorioData.custoSem)}</span>
                                    </div>
                                    <div className="bg-slate-900 p-4 print:p-2 border border-emerald-500/30 rounded-xl flex justify-between items-center">
                                        <div className="flex items-center gap-3 print:gap-2">
                                            <div className="bg-emerald-500/10 p-2 print:p-1 rounded-full"><CheckCircle2 size={18} className="text-emerald-400 print:h-4 print:w-4"/></div>
                                            <span className="text-sm print:text-[10px] font-bold text-emerald-400">Total Pago com a Simplifica</span>
                                        </div>
                                        <span className="text-xl print:text-sm font-bold text-white">{formatMoney(relatorioData.custoCom)}</span>
                                    </div>
                                </div>

                                {/* GRÁFICO (ÚNICO E ALARGADO) */}
                                <div className="mb-8 print:mb-4 page-break-inside-avoid">
                                    <h3 className="text-sm print:text-[10px] font-bold text-slate-300 mb-4 print:mb-2 flex items-center gap-2"><Activity size={16}/> Consumo vs Compensação (kWh)</h3>
                                    <div className="w-full" style={{ height: '220px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={relatorioData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 35 }} barGap={2}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis dataKey="mes" stroke="#64748b" fontSize={9} axisLine={false} tickLine={false} tickMargin={8} angle={-35} textAnchor="end" />
                                                <YAxis stroke="#64748b" fontSize={9} axisLine={false} tickLine={false}/>
                                                <Bar dataKey="consumo" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Consumo (kWh)" isAnimationActive={false} />
                                                <Bar dataKey="compensacao" fill="#eab308" radius={[2, 2, 0, 0]} name="Compensação (kWh)" isAnimationActive={false} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* EXTRATO FINAL DAS ÚLTIMAS FATURAS */}
                                <div className="page-break-inside-avoid mt-8">
                                    <h3 className="text-sm print:text-[10px] font-bold text-slate-300 mb-4 print:mb-2 border-b border-slate-800 pb-2 print:pb-1">Extrato das Últimas Faturas</h3>
                                    <table className="w-full text-sm print:text-[9px] text-left">
                                        <thead className="text-xs print:text-[8px] uppercase text-slate-500 border-b border-slate-800">
                                            <tr>
                                                <th className="py-2 print:py-1">Mês Ref.</th>
                                                <th className="py-2 print:py-1">Vencimento</th>
                                                <th className="py-2 print:py-1 text-right">Consumo</th>
                                                <th className="py-2 print:py-1 text-right">Compensação</th>
                                                <th className="py-2 print:py-1 text-center">Eficiência</th>
                                                <th className="py-2 print:py-1 text-right">Boleto (R$)</th>
                                                <th className="py-2 print:py-1 text-right">Economia</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {relatorioData.ultimasFaturas.map((row:any, i:number) => {
                                                const eficPercent = row.eficiencia_compensacao * 100;
                                                return (
                                                    <tr key={i} className="text-slate-300">
                                                        <td className="py-2 print:py-1.5 font-mono text-xs print:text-[8px]">{formatMesRef(row.mes_referencia)}</td>
                                                        <td className="py-2 print:py-1.5 text-xs print:text-[8px]">{toDateBR(row.vencimento)}</td>
                                                        <td className="py-2 print:py-1.5 text-right text-xs print:text-[8px]">{Math.round(row.consumo_kwh).toLocaleString('pt-BR')} kWh</td>
                                                        <td className="py-2 print:py-1.5 text-right text-xs print:text-[8px]">{Math.round(row.compensacao_kwh).toLocaleString('pt-BR')} kWh</td>
                                                        <td className="py-2 print:py-1.5 text-center text-xs print:text-[8px]">{row.eficiencia_compensacao > 0 ? eficPercent.toFixed(1) + '%' : '-'}</td>
                                                        <td className="py-2 print:py-1.5 text-right text-xs print:text-[8px]">{formatMoney(row.boleto_simplifica)}</td>
                                                        <td className="py-2 print:py-1.5 text-right font-bold text-emerald-400 text-xs print:text-[8px]">{formatMoney(row.economia_rs)}</td>
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
                                        <div className="bg-slate-950 border border-slate-700 px-4 py-2 rounded-lg text-sm font-mono text-yellow-400 flex items-center gap-3">
                                            Senha: {p.senha}
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