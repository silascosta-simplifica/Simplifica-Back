import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';
import { 
    LogOut, Table as TableIcon, Users, Search, Filter, Settings2, Check, 
    ChevronDown, ChevronLeft, ChevronRight, KeyRound, CheckCircle2, ShieldAlert, Loader2,
    Zap, DollarSign, PiggyBank, Receipt, Download
} from 'lucide-react';

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

    const [activeTab, setActiveTab] = useState<'carteira' | 'gestao'>('carteira');
    
    const [busca, setBusca] = useState('');
    const [filtroEtapa, setFiltroEtapa] = useState<string[]>([]);
    const [filtroConc, setFiltroConc] = useState<string[]>([]);
    const [filtroMes, setFiltroMes] = useState<string[]>([]);
    const [filtroStatus, setFiltroStatus] = useState<string[]>([]);
    const [filtroParceiro, setFiltroParceiro] = useState<string[]>([]); 
    
    const colunasOpcoes = ['Concessionária', 'Data Ganho', 'Data Protocolo', 'Data Cancelamento', 'Mês Referência', 'Etapa', 'Economia (R$)', 'Status Pagamento', 'Data Emissão', 'Vencimento', 'Código PIX', 'Código de Barras'];
    const [colunasAtivas, setColunasAtivas] = useState<string[]>(['Mês Referência', 'Etapa', 'Status Pagamento']);

    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 25;

    const [parceirosPendentes, setParceirosPendentes] = useState<any[]>([]);
    const [parceirosAtivos, setParceirosAtivos] = useState<any[]>([]);

    useEffect(() => {
        if (!parceiroLogado) { navigate('/login-parceiro'); return; }
        if (isAdmin) fetchAcessos();
    }, [parceiroLogado]);

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
            boleto_simplifica: parseNum(d.boleto_simplifica) || parseNum(d.valor_real_cobranca),
            consumo_kwh: (parseNum(d.consumo_crm_mwh) || parseNum(d['consumo_médio_na_venda_mwh'])) * 1000,
            compensacao_kwh: parseNum(d.compensacao_kwh) || parseNum(d['compensação_total_kwh']),
            economia_rs: parseNum(d.economia_rs),
            data_ganho: d.data_ganho,
            data_protocolo: d.data_protocolo || d['data_do_1º_protocolo'],
            data_cancelamento: d.data_cancelamento || d['data_de_pedido_de_cancelamento'],
            data_emissao: d.data_emissao || d.emissão_do_boleto,
            vencimento: d.vencimento || d.vencimento_do_boleto,
            codigo_pix: d.codigo_pix,       
            codigo_barras: d.codigo_barras  
        }));

        dadosTratados = dadosTratados.filter((d: any) => {
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
        return filteredData.reduce((acc, row) => {
            acc.consumo += (row.consumo_kwh || 0);
            acc.compensacao += (row.compensacao_kwh || 0);
            acc.boleto += (row.boleto_simplifica || 0);
            acc.economia += (row.economia_rs || 0);
            return acc;
        }, { consumo: 0, compensacao: 0, boleto: 0, economia: 0 });
    }, [filteredData]);

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

    // --- FUNÇÃO DE EXPORTAÇÃO CSV ---
    const handleDownloadCSV = () => {
        if (filteredData.length === 0) return;

        // Cabeçalhos (Respeitando a ordem do que o usuário vê)
        const headers = ['UC', 'Cliente'];
        if (isAdmin) headers.push('Parceiro Dono');
        headers.push('Consumo (kWh)', 'Compensacao (kWh)', 'Boleto (R$)');
        
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

        // Mapeando as linhas
        const csvRows = filteredData.map(row => {
            const badge = getPaymentBadge(row.status);
            
            const rowData = [row.uc, row.nome_cliente];
            if (isAdmin) rowData.push(row.quem_indicou || '-');
            
            rowData.push(
                row.consumo_kwh, 
                row.compensacao_kwh, 
                row.boleto_simplifica
            );

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
            if (colunasAtivas.includes('Código PIX')) rowData.push(row.codigo_pix || '-');
            if (colunasAtivas.includes('Código de Barras')) rowData.push(row.codigo_barras || '-');

            return rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';');
        });

        // Junta tudo e faz o download
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
            <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <img src="https://www.ludfor.com.br/arquivos/0d5ce42bc0728ac08a186e725fafac7db6421507.png" alt="Simplifica" className="h-8" />
                    <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>
                    <div className="hidden sm:block">
                        <h1 className="text-lg font-bold font-display text-white">Portal do Parceiro</h1>
                        <p className="text-xs text-yellow-500 font-medium">Acesso: {parceiroLogado}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isAdmin && (
                        <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                            <button onClick={() => setActiveTab('carteira')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'carteira' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><TableIcon size={16}/> Carteira</button>
                            <button onClick={() => setActiveTab('gestao')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${activeTab === 'gestao' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><KeyRound size={16}/> Gerenciar Senhas</button>
                        </div>
                    )}
                    <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-2 text-sm font-bold">
                        <LogOut size={18} /> Sair
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
                
                {activeTab === 'carteira' && (
                    <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                            <div className="bg-blue-500/10 p-3 rounded-full"><Zap size={24} className="text-blue-500"/></div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Consumo</p>
                                <p className="text-xl font-bold font-mono text-white">{Math.round(metrics.consumo).toLocaleString('pt-BR')} <span className="text-sm text-slate-400">kWh</span></p>
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                            <div className="bg-emerald-500/10 p-3 rounded-full"><Zap size={24} className="text-emerald-500"/></div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Compensação</p>
                                <p className="text-xl font-bold font-mono text-white">{Math.round(metrics.compensacao).toLocaleString('pt-BR')} <span className="text-sm text-slate-400">kWh</span></p>
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                            <div className="bg-yellow-500/10 p-3 rounded-full"><Receipt size={24} className="text-yellow-500"/></div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Faturamento</p>
                                <p className="text-xl font-bold font-display text-white">{formatMoney(metrics.boleto)}</p>
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm">
                            <div className="bg-emerald-500/10 p-3 rounded-full"><PiggyBank size={24} className="text-emerald-400"/></div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Economia Cliente</p>
                                <p className="text-xl font-bold font-display text-emerald-400">{formatMoney(metrics.economia)}</p>
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
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h2 className="font-display font-bold text-white flex items-center gap-2"><TableIcon className="text-yellow-500" size={20}/> Tabela de Acompanhamento</h2>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">{filteredData.length} registros</span>
                                
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
                                        {isAdmin && <th className="px-5 py-4 text-indigo-400 bg-indigo-900/10">Parceiro Dono</th>}
                                        <th className="px-5 py-4 text-right">Consumo (kWh)</th>
                                        <th className="px-5 py-4 text-right">Compensação (kWh)</th>
                                        <th className="px-5 py-4 text-right">Boleto (R$)</th>
                                        
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
                                    {paginatedData.map((row, idx) => {
                                        const badge = getPaymentBadge(row.status);
                                        return (
                                            <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="font-mono text-slate-200 font-bold">{row.uc}</div>
                                                    <div className="text-xs text-slate-500 truncate max-w-[200px]" title={row.nome_cliente}>{row.nome_cliente || 'Sem Nome'}</div>
                                                </td>
                                                {isAdmin && <td className="px-5 py-3 text-xs font-medium text-indigo-300 bg-indigo-900/5">{row.quem_indicou || '-'}</td>}
                                                <td className="px-5 py-3 text-right font-mono text-slate-300">{Number(row.consumo_kwh).toLocaleString('pt-BR')}</td>
                                                <td className="px-5 py-3 text-right font-mono text-emerald-400">{Number(row.compensacao_kwh).toLocaleString('pt-BR')}</td>
                                                <td className="px-5 py-3 text-right font-medium text-yellow-400">{formatMoney(row.boleto_simplifica)}</td>

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
                                                        {row.codigo_pix ? <span className="bg-slate-950 border border-slate-700 px-2 py-1 rounded truncate max-w-[120px] inline-block" title={row.codigo_pix}>{row.codigo_pix}</span> : '-'}
                                                    </td>
                                                )}
                                                {colunasAtivas.includes('Código de Barras') && (
                                                    <td className="px-5 py-3 text-xs font-mono text-slate-400">
                                                        {row.codigo_barras ? <span className="bg-slate-950 border border-slate-700 px-2 py-1 rounded truncate max-w-[120px] inline-block" title={row.codigo_barras}>{row.codigo_barras}</span> : '-'}
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
                    </>
                )}

                {isAdmin && activeTab === 'gestao' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-300">
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