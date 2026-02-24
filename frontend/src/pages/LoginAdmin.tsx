import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, LogIn } from 'lucide-react';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/admin');
    } catch (err: any) {
      setError('E-mail ou senha incorretos.');
      setLoading(false);
    } 
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative z-10 overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="flex flex-col items-center mb-8">
            <img src="https://www.ludfor.com.br/arquivos/0d5ce42bc0728ac08a186e725fafac7db6421507.png" alt="Simplifica" className="w-48 object-contain mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]"/>
            <h2 className="text-2xl font-bold font-display text-white">Gestão Interna</h2>
          </div>

          {error && <div className="mb-6 bg-rose-500/10 border border-rose-500/50 text-rose-400 text-sm p-3 rounded-lg text-center">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">E-mail Administrativo</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400" size={18} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500/50" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400" size={18} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500/50" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-2">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <><LogIn size={20} /> Entrar</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}