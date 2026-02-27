import React, { useState, useMemo, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';
import { 
    LogOut, Table as TableIcon, Search, Settings2, Check, 
    ChevronDown, ChevronLeft, ChevronRight, Loader2,
    Zap, PiggyBank, Receipt, Download, Users, FileDown, Sparkles,
    Target, FileCheck, ExternalLink, ShieldAlert, Clock, FileText, Printer, Activity, TrendingUp, CheckCircle2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

// =========================================================================
// FUNÇÕES UTILITÁRIAS
// =========================================================================
const formatMoney = (val: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);

const toDateBR = (d: any) => { 
    if (!d) return '-'; 
    try { return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }); } 
    catch { return '-'; } 
};

const formatMesRef = (m: string) => { 
    if (!m || m === 'N/D' || m === '-') return '-'; 
    const parts = m.split('-'); 
    if (parts.length >= 2) return `${parts[1]}/${parts[0]}`; 
    return m; 
};

const getSortableDate = (mesRef: string) => {
    if (!mesRef || mesRef === 'N/D' || mesRef === '-') return 0;
    const parts = mesRef.split('/');
    if (parts.length === 2) return parseInt(parts[1]) * 100 + parseInt(parts[0]); 
    return 0;
};

const getPaymentBadge = (status: string) => {
    const sNorm = (status || '').toUpperCase();
    if (['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH', 'PAID', 'LIQUIDATED'].includes(sNorm)) return { color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800', text: 'Pago' };
    if (['OVERDUE', 'LATE'].includes(sNorm)) return { color: 'text-rose-400', bg: 'bg-rose-900/40 border-rose-800', text: 'Atrasado' };
    if (['SENT', 'OPEN', 'AWAITING_PAYMENT', 'PENDING'].includes(sNorm)) return { color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-800', text: 'Aberto' };
    return { color: 'text-slate-500', bg: 'bg-transparent', text: '-' };
};

// =========================================================================
// COMPONENTES AUXILIARES
// =========================================================================
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
            <button onClick={() => setIsOpen(!isOpen)} className={`bg-slate-800 border ${isOpen ? 'border-purple-500 ring-1 ring-purple-500/50' : 'border-slate-700'} rounded-lg px-3 py-2.5 text-sm text-white outline-none flex items-center justify-between transition-all hover:bg-slate-700 w-full`}>
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
                                    className="w-full bg-slate-950 border border-slate-700 rounded-md pl-8 pr-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
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
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${selected.includes(opt) ? 'bg-purple-500 border-purple-500' : 'border-slate-600 group-hover:border-slate-500'}`}>
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

// =========================================================================
// COMPONENTE PRINCIPAL (PORTAL CAMILA)
// =========================================================================
export default function PortalCamila() {
    const navigate = useNavigate();
    const isCamilaLogged = localStorage.getItem('@Simplifica:camilaLogado');

    // Puxando crmData também para injetar os links
    const { data: rawData, crmData, loading: analyticsLoading } = useAnalytics();
    
    const [activeTab, setActiveTab] = useState<'carteira' | 'relatorio'>('carteira');

    // Estados dos Filtros Principais
    const [busca, setBusca] = useState('');
    const [filtroConc, setFiltroConc] = useState<string[]>([]);
    const [filtroMes, setFiltroMes] = useState<string[]>([]);
    const [filtroStatus, setFiltroStatus] = useState<string[]>([]);
    const [filtroCiclo, setFiltroCiclo] = useState<string[]>([]); 
    const [filtroEtapa, setFiltroEtapa] = useState<string[]>([]); 
    
    const colunasOpcoes = ['Ações (Links)', 'Concessionária', 'Mês Referência', 'Ciclo', '1ª Economia', 'Economia (R$)', 'Status Pagamento', 'Fatura Dist. (R$)', 'Eficiência (%)', 'Etapa', 'Motivo Cancelamento'];
    const [colunasAtivas, setColunasAtivas] = useState<string[]>(['Ações (Links)', 'Mês Referência', 'Ciclo', '1ª Economia', 'Status Pagamento', 'Eficiência (%)']);

    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 25;

    const [loadingDownloads, setLoadingDownloads] = useState<Record<string, boolean>>({});

    // Estados do Relatório
    const [relatorioUc, setRelatorioUc] = useState<string>('');
    const [buscaRelatorio, setBuscaRelatorio] = useState('');
    const [showUcDropdown, setShowUcDropdown] = useState(false);
    const dropdownRelatorioRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isCamilaLogged) {
            navigate('/login-camila');
        }
    }, [isCamilaLogged, navigate]);

    useEffect(() => {
        const handleClickOutsideDropdown = (e: any) => { 
            if (dropdownRelatorioRef.current && !dropdownRelatorioRef.current.contains(e.target)) {
                setShowUcDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideDropdown);
        return () => document.removeEventListener('mousedown', handleClickOutsideDropdown);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('@Simplifica:camilaLogado');
        navigate('/login-camila');
    };

    // --- LÓGICA DE DOWNLOAD (UNIFICA E LUMI) ---
    const setBtnLoading = (id: string, isLoading: boolean) => {
        setLoadingDownloads(prev => ({ ...prev, [id]: isLoading }));
    };

    const handleDownloadGestao = async (uc: string, mesRef: string, type: 'FATURA'|'BOLETO', buttonId: string) => {
        if (!uc || !mesRef || mesRef === '-' || mesRef === 'N/D') {
            alert("Referência inválida para gerar o documento.");
            return;
        }
        setBtnLoading(buttonId, true);
        try {
            const parts = mesRef.split('/');
            const refYm = `${parts[1]}-${parts[0]}`;
            
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
        if (!uc || !mesRef || mesRef === '-' || mesRef === 'N/D') return;
        setBtnLoading(buttonId, true);
        try {
            const email = import.meta.env.VITE_LUMI_EMAIL;
            const senha = import.meta.env.VITE_LUMI_SENHA;
            
            if (!email || !senha) {
                throw new Error("Credenciais da API Lumi não configuradas no .env");
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
                throw new Error("A Lumi não gerou o buffer do boleto para esta referência.");
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

    // PROCESSAMENTO DE DADOS PRINCIPAL
    const data = useMemo(() => {
        if (!rawData) return [];
        const parseNum = (val: any) => (val === null || val === undefined || val === '') ? 0 : (isNaN(Number(val)) ? 0 : Number(val));
        
        const idNegocioMap = new Map<string, string>();
        if (crmData) {
            crmData.forEach((d: any) => {
                const id = d.id_negocio || d.ID_NEGOCIO || d.deal_id || d.id_rd;
                if (d.uc && id) {
                    const ucLimpa = String(d.uc).trim();
                    idNegocioMap.set(ucLimpa, String(id).trim());
                }
            });
        }

        let baseLimpa = rawData.filter((d: any) => d.fonte_dados !== 'RD').map((d: any) => {
            const ucLimpa = String(d.uc).trim();
            const idEncontrado = idNegocioMap.get(ucLimpa) || d.id_negocio || d.ID_NEGOCIO || d.deal_id || d.id_rd || null;

            return {
                ...d,
                uc: d.uc,
                nome_cliente: d.nome || d.nome_cliente || 'Sem Nome',
                concessionaria: d['concessionária'] || d.concessionaria || 'Outra',
                mes_referencia: d['mês_referência'] || d.mes_referencia_formatado || 'N/D',
                status: d.status || d['Status Pagamento'],
                valor_fatura_distribuidora: parseNum(d.valor_fatura_distribuidora),
                boleto_simplifica: parseNum(d.boleto_simplifica) || parseNum(d.valor_real_cobranca),
                consumo_kwh: parseNum(d.consumo_kwh) || parseNum(d.consumo_real_kwh),
                compensacao_kwh: parseNum(d.compensacao_kwh) || parseNum(d['compensação_total_kwh']),
                eficiencia_compensacao: parseNum(d.eficiencia_compensacao),
                economia_rs: parseNum(d.economia_rs),
                objetivo_etapa: d.objetivo_etapa || 'Sem Etapa',
                motivo_cancelamento: d.motivo_cancelamento || d['Motivo do cancelamento'] || '',
                data_ganho: d.data_ganho,
                data_protocolo: d.data_protocolo || d['data_do_1º_protocolo'],
                id_negocio: idEncontrado, 
                id_chave_composta: d.id_chave_composta || `${d.uc}-${d['mês_referência']}`,
                link_boleto_simplifica: d.link_fatura || d.link_boleto || null,
                link_fatura_distribuidora: d.link_fatura_concessionaria || d.fatura_concessionaria_pdf || null
            };
        });

        const ucsMap: Record<string, any[]> = {};
        baseLimpa.forEach((row: any) => {
            if (!ucsMap[row.uc]) ucsMap[row.uc] = [];
            ucsMap[row.uc].push(row);
        });

        const dadosComCiclo: any[] = [];

        Object.values(ucsMap).forEach(grupoUc => {
            grupoUc.sort((a: any, b: any) => getSortableDate(a.mes_referencia) - getSortableDate(b.mes_referencia));

            let dataPrimeiraEconomia: string | null = null;
            let jaTevePrimeiroFaturamento = false;

            for (const row of grupoUc) {
                const statusNormalizado = getPaymentBadge(row.status).text;
                const isValido = statusNormalizado !== '-' && row.status !== 'Em análise';
                
                if (row.compensacao_kwh > 0 && isValido) {
                    dataPrimeiraEconomia = row.mes_referencia;
                    break;
                }
            }

            grupoUc.forEach(row => {
                row.data_primeira_economia = dataPrimeiraEconomia || 'Pendente';

                const statusNormalizado = getPaymentBadge(row.status).text;
                const isValido = statusNormalizado !== '-' && row.status !== 'Em análise';

                let ciclo = "Recorrente";

                if (row.compensacao_kwh === 0) {
                    ciclo = "Sem compensação";
                } else if (!isValido) {
                    ciclo = "Em análise";
                } else if (row.compensacao_kwh > 0 && isValido && !jaTevePrimeiroFaturamento) {
                    ciclo = "Primeiro Faturamento";
                    jaTevePrimeiroFaturamento = true;
                }

                row.ciclo = ciclo;
                dadosComCiclo.push(row);
            });
        });

        return dadosComCiclo.sort((a, b) => getSortableDate(b.mes_referencia) - getSortableDate(a.mes_referencia));
    }, [rawData, crmData]);

    // Lógica da Jornada do Cliente
    const jornadaMetrics = useMemo(() => {
        let countGanhoProt = 0, sumGanhoProt = 0;
        let countProtEco = 0, sumProtEco = 0;
        let countEcoFat = 0, sumEcoFat = 0;

        const ucsProcessadas = new Set();

        const dataForJornada = data.filter(item => filtroConc.length === 0 || filtroConc.includes(item.concessionaria));

        dataForJornada.forEach(row => {
            if (ucsProcessadas.has(row.uc)) return;
            ucsProcessadas.add(row.uc);

            const dtGanho = row.data_ganho ? new Date(row.data_ganho) : null;
            const dtProt = row.data_protocolo ? new Date(row.data_protocolo) : null;
            
            let dtEco = null;
            if (row.data_primeira_economia && row.data_primeira_economia !== 'Pendente') {
                const parts = row.data_primeira_economia.split('/');
                if (parts.length === 2) dtEco = new Date(parseInt(parts[1]), parseInt(parts[0]) - 1, 1);
            }

            if (dtGanho && dtProt && !isNaN(dtGanho.getTime()) && !isNaN(dtProt.getTime())) {
                const diff = (dtProt.getTime() - dtGanho.getTime()) / (1000 * 3600 * 24);
                if (diff >= 0 && diff < 1000) { sumGanhoProt += diff; countGanhoProt++; }
            }

            if (dtProt && dtEco && !isNaN(dtProt.getTime()) && !isNaN(dtEco.getTime())) {
                const diff = (dtEco.getTime() - dtProt.getTime()) / (1000 * 3600 * 24);
                if (diff >= 0 && diff < 1000) { sumProtEco += diff; countProtEco++; }
            }

            if (dtEco) {
                sumEcoFat += 31; // Estimativa padrão
                countEcoFat++;
            }
        });

        return {
            ganhoProt: countGanhoProt > 0 ? Math.round(sumGanhoProt / countGanhoProt) : 0,
            protEco: countProtEco > 0 ? Math.round(sumProtEco / countProtEco) : 0,
            ecoFat: countEcoFat > 0 ? Math.round(sumEcoFat / countEcoFat) : 0,
        };
    }, [data, filtroConc]);

    // Lógica do Churn Rate
    const churnMetrics = useMemo(() => {
        const ucsAtivas = new Set();
        const ucsCanceladas = new Set();
        const motivos: Record<string, { ucs: number, mwh: number }> = {};

        const dataForChurn = data.filter(item => {
            const matchMes = filtroMes.length === 0 || filtroMes.includes(item.mes_referencia);
            const matchConc = filtroConc.length === 0 || filtroConc.includes(item.concessionaria);
            return matchMes && matchConc;
        });

        dataForChurn.forEach(row => {
            const etapa = String(row.objetivo_etapa || '').toUpperCase();
            if (etapa.includes('EXCLUÍDO') || etapa.includes('CANCELADO')) {
                if (!ucsCanceladas.has(row.uc)) {
                    ucsCanceladas.add(row.uc);
                    const motivo = row.motivo_cancelamento || 'Não informado';
                    if (!motivos[motivo]) motivos[motivo] = { ucs: 0, mwh: 0 };
                    motivos[motivo].ucs++;
                    motivos[motivo].mwh += (row.consumo_kwh || 0) / 1000;
                }
            } else {
                ucsAtivas.add(row.uc);
            }
        });

        const totalCancelados = ucsCanceladas.size;
        const totalBase = ucsAtivas.size + totalCancelados;
        const churnRate = totalBase > 0 ? ((totalCancelados / totalBase) * 100).toFixed(1) : '0.0';

        const listaMotivos = Object.entries(motivos)
            .map(([nome, stats]) => ({ nome, ...stats }))
            .sort((a, b) => b.ucs - a.ucs);

        return { churnRate, listaMotivos, totalCancelados };
    }, [data, filtroMes, filtroConc]);

    // FILTRO DINÂMICO DA TABELA
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const s = busca.toLowerCase();
            const matchBusca = !s || (item.uc?.toLowerCase().includes(s)) || (item.nome_cliente?.toLowerCase().includes(s));
            const matchEtapa = filtroEtapa.length === 0 || filtroEtapa.includes(item.objetivo_etapa);
            const matchConc = filtroConc.length === 0 || filtroConc.includes(item.concessionaria);
            const matchMes = filtroMes.length === 0 || filtroMes.includes(item.mes_referencia);
            const matchStatus = filtroStatus.length === 0 || filtroStatus.includes(getPaymentBadge(item.status).text);
            const matchCiclo = filtroCiclo.length === 0 || filtroCiclo.includes(item.ciclo);

            return matchBusca && matchEtapa && matchConc && matchMes && matchStatus && matchCiclo;
        });
    }, [data, busca, filtroEtapa, filtroConc, filtroMes, filtroStatus, filtroCiclo]);

    // MÉTRICAS DO TOPO E ATALHOS
    const metrics = useMemo(() => {
        const uniqueUcs = new Set();
        const countsEtapas = { pre: 0, prot: 0, operacional: 0, emExclusao: 0, excluido: 0 };
        let totalPrimeiros = 0;
        
        const totals = filteredData.reduce((acc, row) => {
            if (!uniqueUcs.has(row.uc)) {
                uniqueUcs.add(row.uc);
                
                const et = String(row.objetivo_etapa || '').toUpperCase();
                if (et === 'PRÉ-PROTOCOLO') countsEtapas.pre++;
                else if (et === 'PROTOCOLADOS' || et === 'PROTOCOLADO') countsEtapas.prot++;
                else if (et === 'OPERACIONAL') countsEtapas.operacional++;
                else if (et === 'EM EXCLUSÃO') countsEtapas.emExclusao++;
                else if (et === 'EXCLUÍDO') countsEtapas.excluido++;
            }

            acc.consumo += (row.consumo_kwh || 0);
            acc.compensacao += (row.compensacao_kwh || 0);
            acc.boleto += (row.boleto_simplifica || 0);
            acc.economia += (row.economia_rs || 0);

            if (row.ciclo === 'Primeiro Faturamento') {
                const et = String(row.objetivo_etapa || '').toUpperCase();
                if (et === 'PRÉ-PROTOCOLO' || et === 'PROTOCOLADOS' || et === 'PROTOCOLADO') {
                    totalPrimeiros++;
                }
            }

            return acc;
        }, { consumo: 0, compensacao: 0, boleto: 0, economia: 0 });

        return { 
            ...totals, 
            totalUcs: uniqueUcs.size, 
            primeirosFaturamentos: totalPrimeiros,
            countsEtapas
        };
    }, [filteredData]);

    const paginatedData = filteredData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    const ucsUnicas = useMemo(() => {
        const map = new Map();
        data.forEach(d => {
            if(!map.has(d.uc)) map.set(d.uc, `${d.uc} - ${d.nome_cliente}`);
        });
        return Array.from(map.entries()).map(([uc, label]) => ({ uc, label })).sort((a,b) => a.label.localeCompare(b.label));
    }, [data]);

    const optConc = Array.from(new Set(data.map(d => d.concessionaria))).sort();
    const optStatus = ['Pago', 'Atrasado', 'Aberto', '-'];
    const optCiclos = ['Primeiro Faturamento', 'Recorrente', 'Sem compensação', 'Em análise'];
    const optEtapas = Array.from(new Set(data.map(d => d.objetivo_etapa))).filter(Boolean).sort();
    
    const optMes = Array.from(new Set(data.map(d => d.mes_referencia)))
        .filter(m => m !== 'N/D' && m !== '-')
        .sort((a, b) => getSortableDate(b) - getSortableDate(a));

    const handleDownloadCSV = () => {
        if (filteredData.length === 0) return;

        const headers = ['UC', 'Cliente', 'Concessionária', 'Mes Referencia', 'Consumo (kWh)', 'Compensacao (kWh)', 'Eficiencia (%)', 'Boleto (R$)', 'Fatura Dist (R$)', 'Economia (R$)', 'Status Pagamento', 'Ciclo', 'Data 1a Economia', 'Etapa', 'Motivo Cancelamento'];
        
        const csvRows = filteredData.map(row => {
            const badge = getPaymentBadge(row.status);
            const efic = row.eficiencia_compensacao > 0 ? (row.eficiencia_compensacao * 100).toFixed(1) + '%' : '-';

            const rowData = [
                row.uc, 
                row.nome_cliente,
                row.concessionaria,
                row.mes_referencia,
                row.consumo_kwh, 
                row.compensacao_kwh, 
                efic,
                row.boleto_simplifica,
                row.valor_fatura_distribuidora || 0,
                row.economia_rs || 0,
                badge.text !== '-' ? badge.text : '',
                row.ciclo,
                row.data_primeira_economia,
                row.objetivo_etapa || '-',
                row.motivo_cancelamento || '-'
            ];

            return rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';');
        });

        const csvContent = [headers.join(';'), ...csvRows].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Backoffice_Simplifica_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleAtalhoEtapa = (etapa: string) => {
        if (filtroEtapa.includes(etapa)) {
            setFiltroEtapa([]); 
        } else {
            setFiltroEtapa([etapa]); 
            setFiltroCiclo([]); 
            setPage(1);
        }
    };

    const toggleAtalhoNovosFaturamentos = () => {
        const isActive = filtroCiclo.includes('Primeiro Faturamento') && (filtroEtapa.includes('Pré-protocolo') || filtroEtapa.includes('Protocolados'));
        if (isActive) {
            setFiltroCiclo([]);
            setFiltroEtapa([]);
        } else {
            setFiltroCiclo(['Primeiro Faturamento']);
            setFiltroEtapa(['Pré-protocolo', 'Protocolados', 'PROTOCOLADO', 'PRÉ-PROTOCOLO']);
            setPage(1);
        }
    };

    // --- CÁLCULO DOS DADOS DO RELATÓRIO DO CLIENTE ---
    const relatorioData = useMemo(() => {
        if (!relatorioUc) return null;
        
        const historico = data.filter(d => d.uc === relatorioUc).sort((a:any, b:any) => {
            return getSortableDate(a.mes_referencia) - getSortableDate(b.mes_referencia);
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
        let chartData: any[] = [];

        historico.forEach(row => {
            totalEco += (row.economia_rs || 0);
            totalComp += (row.compensacao_kwh || 0);
            totalConsumo += (row.consumo_kwh || 0);

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
        chartData = chartData.slice(-12);

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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
              <img src="https://www.ludfor.com.br/arquivos/0d5ce42bc0728ac08a186e725fafac7db6421507.png" alt="Simplifica Energia" className="w-full max-w-[280px] object-contain mb-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]"/>
              <Loader2 className="animate-spin h-10 w-10 text-purple-500 mb-6" />
              <div className="text-center">
                  <h2 className="text-2xl font-bold font-display text-white tracking-wide">Acessando Base de Operações...</h2>
                  <p className="text-sm text-slate-400 mt-2 font-medium">Sincronizando faturamentos e jornada de clientes.</p>
              </div>
            </div>
          </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col pb-20">
            
            {/* CSS BLINDADO PARA IMPRESSÃO EM A4 */}
            {activeTab === 'relatorio' && (
                <style>
                    {`
                        @media print {
                            @page { 
                                size: A4 portrait; 
                                margin: 10mm; 
                            }
                            
                            /* O pulo do gato: remove o flex que cortava a tabela
                               e define TUDO com a mesma cor do relatório (#0f172a / bg-slate-900) 
                               para apagar a borda escura! */
                            html, body, #root {
                                background-color: #0f172a !important; 
                                color: white !important;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                height: auto !important;
                                min-height: 100% !important;
                                display: block !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }
                            
                            /* Dá um respiro pro relatório não colar no teto da folha */
                            #relatorio-print-container {
                                margin-top: 15mm !important;
                            }
                            
                            /* Resolve a sobreposição: define margem gigante no gráfico para empurrar a tabela pra longe */
                            .recharts-responsive-container {
                                width: 100% !important;
                                height: 220px !important; 
                                margin-bottom: 80px !important; 
                            }
                            
                            .print-break-avoid {
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                            }
                        }
                    `}
                </style>
            )}

            {/* CABEÇALHO */}
            <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <Sparkles size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold font-display text-white tracking-wide">Portal da Camila</h1>
                        <p className="text-xs text-purple-400 font-medium uppercase tracking-wider">Back-Office & Customer Success</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800 overflow-x-auto max-w-full">
                        <button onClick={() => setActiveTab('carteira')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'carteira' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}><TableIcon size={16}/> Operação</button>
                        <button onClick={() => setActiveTab('relatorio')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'relatorio' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}><FileText size={16}/> Relatório do Cliente</button>
                    </div>
                    <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-2 text-sm font-bold bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg">
                        <LogOut size={16} /> Encerrar Sessão
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1600px] w-full mx-auto print:p-0 print:m-0 print:block">
                
                {/* ABA 1: CARTEIRA OPERACIONAL */}
                {activeTab === 'carteira' && (
                    <div className="print:hidden space-y-6">
                        
                        {/* COCKPIT: GRID 75% Esquerda / 25% Direita */}
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in duration-500">
                            
                            {/* ESQUERDA (75%) */}
                            <div className="xl:col-span-3 flex flex-col gap-6">
                                
                                {/* LINHA 1: KPIS PRINCIPAIS */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-sm min-w-0">
                                        <div className="bg-blue-500/10 p-3 rounded-full shrink-0"><Users size={20} className="text-blue-400"/></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 truncate">UCs Filtradas</p>
                                            <p className="text-lg lg:text-xl font-bold font-mono text-white truncate">{new Intl.NumberFormat('pt-BR').format(metrics.totalUcs)}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-sm min-w-0">
                                        <div className="bg-blue-500/10 p-3 rounded-full shrink-0"><Zap size={20} className="text-blue-500"/></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 truncate">Consumo Real</p>
                                            <p className="text-lg lg:text-xl font-bold font-mono text-white truncate" title={Math.round(metrics.consumo).toLocaleString('pt-BR')}>
                                                {Math.round(metrics.consumo).toLocaleString('pt-BR')} <span className="text-[10px] text-slate-400">kWh</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-sm min-w-0">
                                        <div className="bg-emerald-500/10 p-3 rounded-full shrink-0"><Zap size={20} className="text-emerald-500"/></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 truncate">Compensação</p>
                                            <p className="text-lg lg:text-xl font-bold font-mono text-white truncate" title={Math.round(metrics.compensacao).toLocaleString('pt-BR')}>
                                                {Math.round(metrics.compensacao).toLocaleString('pt-BR')} <span className="text-[10px] text-slate-400">kWh</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-sm min-w-0">
                                        <div className="bg-yellow-500/10 p-3 rounded-full shrink-0"><Receipt size={20} className="text-yellow-500"/></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 truncate">Faturamento</p>
                                            <p className="text-lg lg:text-xl font-bold font-display text-white truncate" title={formatMoney(metrics.boleto)}>{formatMoney(metrics.boleto)}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-sm min-w-0">
                                        <div className="bg-emerald-500/10 p-3 rounded-full shrink-0"><PiggyBank size={20} className="text-emerald-400"/></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 truncate">Economia Gerada</p>
                                            <p className="text-lg lg:text-xl font-bold font-display text-emerald-400 truncate" title={formatMoney(metrics.economia)}>{formatMoney(metrics.economia)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* LINHA 2: ATALHOS / FUNIL DE STATUS */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                    <button 
                                        onClick={toggleAtalhoNovosFaturamentos}
                                        className={`p-3 rounded-xl border text-left transition-all ${filtroCiclo.includes('Primeiro Faturamento') && (filtroEtapa.includes('Pré-protocolo') || filtroEtapa.includes('Protocolados')) ? 'bg-purple-900/40 border-purple-500 ring-1 ring-purple-500' : 'bg-slate-900 border-slate-800 hover:border-purple-500/50'}`}
                                    >
                                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Sparkles size={12}/> Novos Faturamentos</p>
                                        <p className="text-2xl font-bold font-mono text-white">{metrics.primeirosFaturamentos}</p>
                                    </button>
                                    
                                    <button 
                                        onClick={() => toggleAtalhoEtapa('Pré-protocolo')}
                                        className={`p-3 rounded-xl border text-left transition-all ${filtroEtapa.includes('Pré-protocolo') && filtroCiclo.length === 0 ? 'bg-slate-800 border-slate-500 ring-1 ring-slate-500' : 'bg-slate-900 border-slate-800 hover:border-slate-500/50'}`}
                                    >
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pré-protocolo</p>
                                        <p className="text-2xl font-bold font-mono text-white">{metrics.countsEtapas.pre}</p>
                                    </button>

                                    <button 
                                        onClick={() => toggleAtalhoEtapa('Protocolados')}
                                        className={`p-3 rounded-xl border text-left transition-all ${filtroEtapa.includes('Protocolados') && filtroCiclo.length === 0 ? 'bg-slate-800 border-slate-500 ring-1 ring-slate-500' : 'bg-slate-900 border-slate-800 hover:border-slate-500/50'}`}
                                    >
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Protocolados</p>
                                        <p className="text-2xl font-bold font-mono text-white">{metrics.countsEtapas.prot}</p>
                                    </button>

                                    <button 
                                        onClick={() => toggleAtalhoEtapa('Operacional')}
                                        className={`p-3 rounded-xl border text-left transition-all ${filtroEtapa.includes('Operacional') ? 'bg-emerald-900/40 border-emerald-500 ring-1 ring-emerald-500' : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50'}`}
                                    >
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Operacional</p>
                                        <p className="text-2xl font-bold font-mono text-white">{metrics.countsEtapas.operacional}</p>
                                    </button>

                                    <button 
                                        onClick={() => toggleAtalhoEtapa('Em Exclusão')}
                                        className={`p-3 rounded-xl border text-left transition-all ${filtroEtapa.includes('Em Exclusão') ? 'bg-amber-900/40 border-amber-500 ring-1 ring-amber-500' : 'bg-slate-900 border-slate-800 hover:border-amber-500/50'}`}
                                    >
                                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Em Exclusão</p>
                                        <p className="text-2xl font-bold font-mono text-white">{metrics.countsEtapas.emExclusao}</p>
                                    </button>

                                    <button 
                                        onClick={() => toggleAtalhoEtapa('Excluído')}
                                        className={`p-3 rounded-xl border text-left transition-all ${filtroEtapa.includes('Excluído') ? 'bg-rose-900/40 border-rose-500 ring-1 ring-rose-500' : 'bg-slate-900 border-slate-800 hover:border-rose-500/50'}`}
                                    >
                                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Excluídos (Churn)</p>
                                        <p className="text-2xl font-bold font-mono text-white">{metrics.countsEtapas.excluido}</p>
                                    </button>
                                </div>

                                {/* LINHA 3: JORNADA DO CLIENTE */}
                                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-center flex-1 min-h-[140px]">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Clock size={16} className="text-emerald-400"/>
                                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Tempo Médio de Jornada (Geral)</h3>
                                    </div>
                                    
                                    <div className="flex items-center justify-between w-full relative px-4">
                                        <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-800 -translate-y-1/2 z-0 rounded-full"></div>
                                        
                                        <div className="flex flex-col items-center relative z-10 gap-2">
                                            <div className="bg-slate-900 p-2 rounded-full border-2 border-emerald-500"><Target size={20} className="text-emerald-500"/></div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Ganho</span>
                                        </div>
                                        
                                        <div className="flex flex-col items-center relative z-10 -mt-6">
                                            <span className="text-lg font-bold font-mono text-white mb-1 bg-slate-900 px-2">{jornadaMetrics.ganhoProt} <span className="text-[10px] text-slate-500">dias</span></span>
                                        </div>

                                        <div className="flex flex-col items-center relative z-10 gap-2">
                                            <div className="bg-slate-900 p-2 rounded-full border-2 border-purple-500"><FileCheck size={20} className="text-purple-500"/></div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">1º Protocolo</span>
                                        </div>

                                        <div className="flex flex-col items-center relative z-10 -mt-6">
                                            <span className="text-lg font-bold font-mono text-white mb-1 bg-slate-900 px-2">{jornadaMetrics.protEco} <span className="text-[10px] text-slate-500">dias</span></span>
                                        </div>

                                        <div className="flex flex-col items-center relative z-10 gap-2">
                                            <div className="bg-slate-900 p-2 rounded-full border-2 border-blue-500"><PiggyBank size={20} className="text-blue-500"/></div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">1ª Economia</span>
                                        </div>

                                        <div className="flex flex-col items-center relative z-10 -mt-6">
                                            <span className="text-lg font-bold font-mono text-white mb-1 bg-slate-900 px-2">{jornadaMetrics.ecoFat} <span className="text-[10px] text-slate-500">dias</span></span>
                                        </div>

                                        <div className="flex flex-col items-center relative z-10 gap-2">
                                            <div className="bg-slate-900 p-2 rounded-full border-2 border-yellow-500"><Receipt size={20} className="text-yellow-500"/></div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">1ª Fatura</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DIREITA (25%) - CHURN */}
                            <div className="xl:col-span-1 relative min-h-[300px] xl:min-h-0">
                                <div className="absolute inset-0 bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col">
                                    <div className="flex justify-between items-center mb-4 shrink-0">
                                        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><ShieldAlert size={16} className="text-amber-500"/> Cancelamentos</h3>
                                        <span className="text-xs font-bold bg-rose-900/40 text-rose-400 border border-rose-800/50 px-2 py-1 rounded">Churn: {churnMetrics.churnRate}%</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
                                        {churnMetrics.listaMotivos.map((m, i) => (
                                            <div key={i} className="flex justify-between items-center border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                                                <span className="text-xs text-slate-400 truncate max-w-[150px]" title={m.nome}>{m.nome}</span>
                                                <div className="text-right shrink-0 ml-2">
                                                    <p className="text-sm font-bold text-amber-500">{m.ucs} <span className="text-[10px] font-normal text-slate-500">UCs</span></p>
                                                    <p className="text-[10px] text-slate-500 font-mono">{m.mwh.toFixed(1)} MWh</p>
                                                </div>
                                            </div>
                                        ))}
                                        {churnMetrics.listaMotivos.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Nenhum cancelamento para o filtro.</p>}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* FILTROS ALINHADOS NA MESMA LINHA */}
                        <section className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm flex flex-wrap items-end gap-3">
                            <div className="flex-1 min-w-[220px]">
                                <label className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider mb-1 block">Buscar UC ou Cliente</label>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                                    <input type="text" value={busca} onChange={e => {setBusca(e.target.value); setPage(1);}} placeholder="Digite aqui..." className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500 transition-all"/>
                                </div>
                            </div>

                            <div className="w-full sm:w-auto">
                                <label className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider mb-1 block">Concessionária</label>
                                <MultiSelect options={optConc} selected={filtroConc} onChange={(v:any) => {setFiltroConc(v); setPage(1);}} placeholder="Todas" />
                            </div>
                            <div className="w-full sm:w-auto">
                                <label className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider mb-1 block">Mês Ref.</label>
                                <MultiSelect options={optMes} selected={filtroMes} onChange={(v:any) => {setFiltroMes(v); setPage(1);}} placeholder="Até atual" />
                            </div>
                            <div className="w-full sm:w-auto">
                                <label className="text-[10px] font-bold font-display text-purple-400 uppercase tracking-wider mb-1 block">Filtro de Ciclo</label>
                                <MultiSelect options={optCiclos} selected={filtroCiclo} onChange={(v:any) => {setFiltroCiclo(v); setPage(1);}} placeholder="Todos" />
                            </div>
                            <div className="w-full sm:w-auto">
                                <label className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider mb-1 block">Status Pagamento</label>
                                <MultiSelect options={optStatus} selected={filtroStatus} onChange={(v:any) => {setFiltroStatus(v); setPage(1);}} placeholder="Todos" />
                            </div>
                            <div className="w-full sm:w-auto hidden xl:block">
                                <label className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-wider mb-1 block">Etapa CRM</label>
                                <MultiSelect options={optEtapas} selected={filtroEtapa} onChange={(v:any) => {setFiltroEtapa(v); setPage(1);}} placeholder="Todas" />
                            </div>
                        </section>

                        {/* TABELA */}
                        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col flex-1">
                            <div className="p-4 border-b border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/50">
                                <h2 className="font-display font-bold text-white flex items-center gap-2"><TableIcon className="text-purple-500" size={20}/> Tabela Operacional</h2>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">{filteredData.length} registros</span>
                                    <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-white transition-colors" title="Baixar CSV">
                                        <Download size={16} /> <span className="hidden sm:inline">Exportar CSV</span>
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
                                            
                                            {colunasAtivas.includes('Ciclo') && <th className="px-5 py-4 text-center text-purple-300">Ciclo Atual</th>}
                                            {colunasAtivas.includes('1ª Economia') && <th className="px-5 py-4 text-center text-slate-300">Data 1ª Economia</th>}

                                            <th className="px-5 py-4 text-right">Consumo (kWh)</th>
                                            <th className="px-5 py-4 text-right">Compensação (kWh)</th>
                                            <th className="px-5 py-4 text-right">Boleto (R$)</th>
                                            
                                            {colunasAtivas.includes('Fatura Dist. (R$)') && <th className="px-5 py-4 text-right text-slate-300">Fatura Dist. (R$)</th>}
                                            {colunasAtivas.includes('Eficiência (%)') && <th className="px-5 py-4 text-center">Eficiência (%)</th>}
                                            
                                            {colunasAtivas.includes('Status Pagamento') && <th className="px-5 py-4 text-center">Status</th>}
                                            {colunasAtivas.includes('Concessionária') && <th className="px-5 py-4">Concessionária</th>}
                                            {colunasAtivas.includes('Mês Referência') && <th className="px-5 py-4 text-center">Mês Ref.</th>}
                                            {colunasAtivas.includes('Economia (R$)') && <th className="px-5 py-4 text-right text-emerald-400">Economia (R$)</th>}
                                            {colunasAtivas.includes('Etapa') && <th className="px-5 py-4 text-xs text-slate-300">Etapa</th>}
                                            {colunasAtivas.includes('Motivo Cancelamento') && <th className="px-5 py-4 text-xs text-rose-300">Motivo Cancelamento</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {paginatedData.map((row) => {
                                            const badge = getPaymentBadge(row.status);
                                            const chaveLinha = row.id_chave_composta || `${row.uc}-${row.mes_referencia}`;

                                            const eficPercent = (row.eficiencia_compensacao || 0) * 100;
                                            let eficColor = 'text-rose-400'; let eficBg = 'bg-rose-900/40 border-rose-800/50';
                                            if (eficPercent >= 90) { eficColor = 'text-emerald-400'; eficBg = 'bg-emerald-900/40 border-emerald-800/50'; }
                                            else if (eficPercent >= 70) { eficColor = 'text-yellow-400'; eficBg = 'bg-yellow-900/40 border-yellow-800/50'; }

                                            const linkBoletoLumiDireto = row.fonte_dados === 'LUMI' && row.link_boleto_simplifica ? `https://api.labs-lumi.com.br/faturas/download/${row.link_boleto_simplifica}` : null;
                                            
                                            // RD Link Seguro sem Gambiarra de Texto
                                            const rdLink = row.id_negocio ? `https://crm.rdstation.com/app/deals/${row.id_negocio}` : null;

                                            return (
                                                <tr key={chaveLinha} className="hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <div className="font-mono text-slate-200 font-bold">{row.uc}</div>
                                                        <div className="text-xs text-slate-500 truncate max-w-[200px]" title={row.nome_cliente}>
                                                            {rdLink ? (
                                                                <a href={rdLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors flex items-center gap-1 group" title="Abrir negócio no RD Station CRM">
                                                                    <span className="truncate">{row.nome_cliente || 'Sem Nome'}</span>
                                                                    <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                                </a>
                                                            ) : (
                                                                <span className="truncate">{row.nome_cliente || 'Sem Nome'}</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {colunasAtivas.includes('Ações (Links)') && (
                                                        <td className="px-5 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {row.fonte_dados === 'UNIFICA' ? (
                                                                    <button onClick={() => handleDownloadGestao(row.uc, row.mes_referencia, 'FATURA', `btn_fat_${chaveLinha}`)} disabled={loadingDownloads[`btn_fat_${chaveLinha}`]} title="Fatura da Concessionária (Plataforma Gestão)" className="p-1.5 bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-400 rounded-md transition-colors disabled:opacity-50">
                                                                        {loadingDownloads[`btn_fat_${chaveLinha}`] ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16} />}
                                                                    </button>
                                                                ) : linkBoletoLumiDireto ? (
                                                                    <a href={linkBoletoLumiDireto} target="_blank" rel="noopener noreferrer" title="Fatura da Concessionária (Lumi)" className="p-1.5 bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-400 rounded-md transition-colors flex items-center justify-center"><FileDown size={16} /></a>
                                                                ) : (
                                                                    <div title="Não disponível" className="p-1.5 bg-slate-900 text-slate-700 rounded-md cursor-not-allowed"><FileDown size={16} /></div>
                                                                )}
                                                                
                                                                {row.fonte_dados === 'UNIFICA' ? (
                                                                    <button onClick={() => handleDownloadGestao(row.uc, row.mes_referencia, 'BOLETO', `btn_bol_${chaveLinha}`)} disabled={loadingDownloads[`btn_bol_${chaveLinha}`]} title="Boleto Simplifica (Plataforma Gestão)" className="p-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-md transition-colors disabled:opacity-50">
                                                                        {loadingDownloads[`btn_bol_${chaveLinha}`] ? <Loader2 size={16} className="animate-spin"/> : <Receipt size={16} />}
                                                                    </button>
                                                                ) : linkBoletoLumiDireto ? (
                                                                    <a href={linkBoletoLumiDireto} target="_blank" rel="noopener noreferrer" title="Boleto Simplifica (Lumi)" className="p-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-md transition-colors flex items-center justify-center"><Receipt size={16} /></a>
                                                                ) : (
                                                                    <div title="Não disponível" className="p-1.5 bg-slate-900 text-slate-700 rounded-md cursor-not-allowed"><Receipt size={16} /></div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}

                                                    {colunasAtivas.includes('Ciclo') && (
                                                        <td className="px-5 py-3 text-center">
                                                            {row.ciclo === 'Primeiro Faturamento' ? (
                                                                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-900/40 text-purple-400 border border-purple-500/30">1º Faturamento</span>
                                                            ) : row.ciclo === 'Recorrente' ? (
                                                                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">Recorrente</span>
                                                            ) : (
                                                                <span className="text-[10px] font-medium text-slate-500">{row.ciclo}</span>
                                                            )}
                                                        </td>
                                                    )}

                                                    {colunasAtivas.includes('1ª Economia') && (
                                                        <td className="px-5 py-3 text-center font-mono text-xs text-slate-400">{row.data_primeira_economia}</td>
                                                    )}

                                                    <td className="px-5 py-3 text-right font-mono text-slate-300">{Number(row.consumo_kwh).toLocaleString('pt-BR')}</td>
                                                    <td className="px-5 py-3 text-right font-mono text-emerald-400">{Number(row.compensacao_kwh).toLocaleString('pt-BR')}</td>
                                                    <td className="px-5 py-3 text-right font-medium text-yellow-400">{formatMoney(row.boleto_simplifica)}</td>

                                                    {colunasAtivas.includes('Fatura Dist. (R$)') && (
                                                        <td className="px-5 py-3 text-right font-mono text-slate-300">{formatMoney(row.valor_fatura_distribuidora || 0)}</td>
                                                    )}

                                                    {colunasAtivas.includes('Eficiência (%)') && (
                                                        <td className="px-5 py-3 text-center">
                                                            {row.eficiencia_compensacao > 0 ? (
                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold border ${eficColor} ${eficBg}`}>{eficPercent.toFixed(1)}%</span>
                                                            ) : <span className="text-slate-600">-</span>}
                                                        </td>
                                                    )}

                                                    {colunasAtivas.includes('Status Pagamento') && (
                                                        <td className="px-5 py-3 text-center">
                                                            {badge.text !== '-' ? <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${badge.color} ${badge.bg}`}>{badge.text}</span> : <span className="text-slate-600">-</span>}
                                                        </td>
                                                    )}
                                                    {colunasAtivas.includes('Concessionária') && <td className="px-5 py-3 text-xs text-slate-400">{row.concessionaria || '-'}</td>}
                                                    {colunasAtivas.includes('Mês Referência') && <td className="px-5 py-3 text-center font-mono text-xs text-slate-400">{row.mes_referencia}</td>}
                                                    {colunasAtivas.includes('Economia (R$)') && <td className="px-5 py-3 text-right text-emerald-500">{formatMoney(row.economia_rs)}</td>}
                                                    {colunasAtivas.includes('Etapa') && <td className="px-5 py-3 text-xs text-slate-300">{row.objetivo_etapa || '-'}</td>}
                                                    {colunasAtivas.includes('Motivo Cancelamento') && <td className="px-5 py-3 text-xs text-rose-300/70 truncate max-w-[150px]" title={row.motivo_cancelamento}>{row.motivo_cancelamento || '-'}</td>}
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

                {/* --- ABA 2: RELATÓRIO DO CLIENTE (PRINT-FRIENDLY A4) --- */}
                {activeTab === 'relatorio' && (
                    <div id="relatorio-print-container" className="flex flex-col gap-6 w-full mx-auto print:max-w-[210mm] page-break-inside-avoid">
                        {/* CONTROLES DE IMPRESSÃO */}
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
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all"
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
                                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-bold flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
                            >
                                <Printer size={18}/> Salvar / Imprimir (PDF)
                            </button>
                        </div>

                        {/* O RELATÓRIO EM SI */}
                        {relatorioData ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl print:border-none print:shadow-none print:p-2 w-full max-w-[900px] mx-auto print:w-full print:max-w-full print:text-white print:bg-slate-900">
                                
                                <div className="flex justify-between items-start border-b border-slate-800 pb-6 print:pb-2 mb-6 print:mb-3 print-break-avoid">
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

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-2 mb-8 print:mb-3 print-break-avoid">
                                    <div className="bg-slate-950 p-4 print:p-3 rounded-xl border border-slate-800">
                                        <p className="text-[10px] print:text-[9px] font-bold text-slate-500 uppercase mb-1">Concessionária</p>
                                        <p className="text-sm print:text-xs font-bold text-slate-200">{relatorioData.infoCadastral.concessionaria}</p>
                                    </div>
                                    <div className="bg-slate-950 p-4 print:p-3 rounded-xl border border-slate-800">
                                        <p className="text-[10px] print:text-[9px] font-bold text-slate-500 uppercase mb-1">Cliente Desde</p>
                                        <p className="text-sm print:text-xs font-bold text-slate-200">{toDateBR(relatorioData.infoCadastral.data_ganho) !== '-' ? toDateBR(relatorioData.infoCadastral.data_ganho) : 'Não informado'}</p>
                                    </div>
                                    <div className="bg-slate-950 p-4 print:p-3 rounded-xl border border-slate-800">
                                        <p className="text-[10px] print:text-[9px] font-bold text-slate-500 uppercase mb-1">Eficiência Média</p>
                                        <p className={`text-sm print:text-xs font-bold ${relatorioData.eficienciaMedia >= 90 ? 'text-emerald-400' : relatorioData.eficienciaMedia >= 70 ? 'text-yellow-400' : 'text-rose-400'}`}>
                                            {relatorioData.eficienciaMedia > 0 ? relatorioData.eficienciaMedia.toFixed(1) + '%' : 'N/D'}
                                        </p>
                                    </div>
                                    <div className="bg-slate-950 p-4 print:p-3 rounded-xl border border-slate-800">
                                        <p className="text-[10px] print:text-[9px] font-bold text-slate-500 uppercase mb-1">Consumo Total</p>
                                        <p className="text-sm print:text-xs font-bold text-slate-200">
                                            {Math.round(relatorioData.totalConsumo).toLocaleString('pt-BR')} kWh
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-6 print:gap-4 mb-8 print:mb-3 print-break-avoid">
                                    <div className="flex-1 bg-emerald-900/10 border border-emerald-800/30 p-6 print:p-4 rounded-2xl flex items-center justify-center flex-col text-center">
                                        <PiggyBank size={32} className="text-emerald-500 mb-3 print:mb-2 print:h-8 print:w-8"/>
                                        <p className="text-xs print:text-[11px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Economia Total Acumulada</p>
                                        <h2 className="text-4xl print:text-3xl font-display font-extrabold text-white">{formatMoney(relatorioData.totalEco)}</h2>
                                        
                                        {relatorioData.mesesGratis > 0 && (
                                            <div className="mt-3 print:mt-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 print:py-1 rounded-full text-[10px] print:text-[9px] font-bold uppercase tracking-wider border border-emerald-500/30">
                                                🎉 Equivale a {relatorioData.mesesGratis.toFixed(1).replace('.0', '')} faturas grátis
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 bg-blue-900/10 border border-blue-800/30 p-6 print:p-4 rounded-2xl flex items-center justify-center flex-col text-center">
                                        <Zap size={32} className="text-blue-500 mb-3 print:mb-2 print:h-8 print:w-8"/>
                                        <p className="text-xs print:text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-1">Total de Energia Compensada</p>
                                        <h2 className="text-4xl print:text-3xl font-display font-extrabold text-white">{Math.round(relatorioData.totalComp).toLocaleString('pt-BR')} <span className="text-lg print:text-base text-blue-400">kWh</span></h2>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:gap-2 mb-10 print:mb-6 print-break-avoid">
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
                                    <h3 className="text-sm print:text-xs font-bold text-slate-300 mb-6 print:mb-2 flex items-center gap-2"><Activity size={16}/> Consumo vs Compensação (Últimos 12 meses)</h3>
                                    
                                    {/* Ajuste de Margem e Altura Crítico para Impressão */}
                                    <div className="w-full h-[300px] print:h-[220px] print:pr-4 relative">
                                        <ResponsiveContainer width="99%" height="100%">
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

            </main>
        </div>
    );
}