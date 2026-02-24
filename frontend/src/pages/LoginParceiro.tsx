import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Users, Lock, Loader2, LogIn, Search, ShieldCheck } from 'lucide-react';

export default function LoginParceiro() {
  const [parceiros, setParceiros] = useState<string[]>([]);
  const [busca, setBusca] = useState('');
  const [parceiroSelecionado, setParceiroSelecionado] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('@Simplifica:parceiroLogado')) navigate('/portal-parceiro');
  }, [navigate]);

  useEffect(() => {
    const fetchParceiros = async () => {
      const { data } = await supabase.from('parceiros_auth').select('nome_parceiro');
      if (data) setParceiros(data.map(p => p.nome_parceiro));
    };
    fetchParceiros();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parceiroSelecionado) return;

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('parceiros_auth')
        .select('*')
        .eq('nome_parceiro', parceiroSelecionado)
        .eq('senha', senha)
        .single();

      if (error || !data) throw new Error('Senha incorreta.');

      setSuccess(true);
      localStorage.setItem('@Simplifica:parceiroLogado', parceiroSelecionado);
      
      setTimeout(() => {
        navigate('/portal-parceiro');
      }, 800);

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    } 
  };

  const parceirosFiltrados = parceiros.filter(p => p !== 'admin' && p.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative z-10">
        <div className="p-8 sm:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-yellow-500/10 p-4 rounded-full mb-4 border border-yellow-500/20">
                <Users size={32} className="text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold font-display text-white">Portal do Parceiro</h2>
            <p className="text-sm text-slate-400 mt-1 text-center">Acompanhe a sua carteira de clientes</p>
          </div>

          {error && !success && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/50 text-rose-400 text-sm p-3 rounded-lg text-center font-medium animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {!parceiroSelecionado ? (
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold font-display text-slate-400 uppercase tracking-wider">Busque seu nome</label>
                  <div className="relative group mb-2">
                    <Search className="absolute left-3 top-3 text-slate-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Comece a digitar..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all placeholder:text-slate-600"
                    />
                  </div>
                  
                  {/* DROPDOWN SÓ APARECE SE TIVER ALGO DIGITADO */}
                  {busca.length > 0 && (
                      <div className="max-h-64 overflow-y-auto bg-slate-950 border border-slate-700 rounded-xl divide-y divide-slate-800 shadow-2xl absolute top-full mt-2 w-full z-50 animate-in fade-in slide-in-from-top-2">
                          {busca.toLowerCase() === 'admin' && (
                              <div onClick={() => setParceiroSelecionado('admin')} className="p-4 bg-indigo-900/20 hover:bg-indigo-900/40 cursor-pointer text-sm text-indigo-400 transition-colors flex items-center gap-2 font-bold border-b border-indigo-900/50">
                                  <ShieldCheck size={16}/> Acesso Administrativo
                              </div>
                          )}

                          {parceirosFiltrados.length > 0 ? parceirosFiltrados.map(p => (
                              <div key={p} onClick={() => setParceiroSelecionado(p)} className="p-4 hover:bg-slate-800 cursor-pointer text-sm text-slate-300 hover:text-yellow-400 transition-colors flex items-center gap-3">
                                 <Users size={14} className="opacity-50"/> {p}
                              </div>
                          )) : (
                              busca.toLowerCase() !== 'admin' && <div className="p-6 text-center text-sm text-slate-500">Nenhum parceiro encontrado</div>
                          )}
                      </div>
                  )}
                </div>
            ) : (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                                {parceiroSelecionado === 'admin' ? 'Acesso Especial' : 'Parceiro Selecionado'}
                            </p>
                            <p className={`text-sm font-bold ${parceiroSelecionado === 'admin' ? 'text-indigo-400' : 'text-white'}`}>{parceiroSelecionado}</p>
                        </div>
                        <button type="button" onClick={() => { setParceiroSelecionado(''); setSenha(''); setBusca(''); }} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-slate-300 transition-colors">
                            Trocar
                        </button>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold font-display text-slate-400 uppercase tracking-wider">Sua Senha</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3 text-slate-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
                            <input 
                            type="password" 
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all placeholder:text-slate-600"
                            required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || !senha}
                        className={`w-full text-slate-950 disabled:opacity-50 font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-2 ${parceiroSelecionado === 'admin' ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-yellow-600 hover:bg-yellow-500'}`}
                    >
                    {loading ? <><Loader2 size={20} className="animate-spin" /> Autenticando...</> : <><LogIn size={20} /> Acessar Carteira</>}
                    </button>
                </div>
            )}
          </form>
        </div>
      </div>
      
      <p className="text-xs text-slate-600 mt-8 text-center relative z-10">
        &copy; {new Date().getFullYear()} Simplifica Energia. Acesso Restrito.
      </p>
    </div>
  );
}