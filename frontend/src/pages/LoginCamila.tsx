import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function LoginCamila() {
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    setTimeout(() => {
      // A senha genial validada aqui:
      if (senha === 'silaseusouteufa') { 
        localStorage.setItem('@Simplifica:camilaLogado', 'true');
        navigate('/portal-camila');
      } else {
        setErro('Senha incorreta.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
            <img src="https://www.ludfor.com.br/arquivos/0d5ce42bc0728ac08a186e725fafac7db6421507.png" alt="Simplifica" className="h-12 object-contain mb-4"/>
            <h1 className="text-2xl font-bold font-display text-white">Portal da Camila</h1>
            <p className="text-sm text-slate-400 mt-1">Acesso Back-Office</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Senha de Acesso</label>
            <input 
              type="password" 
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              placeholder="Digite a senha..."
              autoFocus
            />
          </div>

          {erro && <div className="text-rose-400 text-sm font-medium text-center bg-rose-500/10 py-2 rounded-lg">{erro}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center gap-2 mt-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin"/> Verificando</> : 'Acessar Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}