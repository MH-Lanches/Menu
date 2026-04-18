import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, Lock, User } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err: any) {
      setError('Credenciais inválidas. Tente admin@mhlanches.com / admin123');
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute -top-40 -left-20 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] bg-brand-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-surface border border-border-dim rounded-[40px] p-10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-primary/20 border-2 border-white/10">
             <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">MH LANCHES <span className="text-brand-primary tracking-widest text-xs not-italic ml-2 opacity-60">ADMIN</span></h1>
          <p className="text-text-dim text-[10px] font-black uppercase tracking-[0.3em]">Acesse o Painel Gerencial</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="group">
            <label className="block text-[10px] font-black uppercase text-text-dim mb-2 tracking-widest group-focus-within:text-brand-primary transition-colors">Identificador de Usuário</label>
            <div className="relative">
              <User className="absolute left-4 top-4 h-5 w-5 text-text-dim group-focus-within:text-brand-primary transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-base border border-border-dim rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-bold text-sm"
                placeholder="admin@mhlanches.com"
                required
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-[10px] font-black uppercase text-text-dim mb-2 tracking-widest group-focus-within:text-brand-primary transition-colors">Código de Segurança</label>
            <div className="relative">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-text-dim group-focus-within:text-brand-primary transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-base border border-border-dim rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-bold text-sm"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
             <motion.div 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               className="p-4 bg-danger-base/10 border border-danger-base/20 rounded-xl text-danger-base text-xs font-bold text-center"
             >
               {error}
             </motion.div>
          )}

          <button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-primary/80 text-white font-black py-4 rounded-2xl transition-all shadow-[0_10px_20px_rgba(124,58,237,0.3)] flex items-center justify-center gap-3 uppercase italic tracking-widest text-sm active:scale-95"
          >
            <LogIn size={20} strokeWidth={3} />
            Entrar no ERP
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-border-dim text-center grayscale opacity-30">
          <p className="text-[9px] text-text-dim font-black uppercase tracking-[0.3em]">MH LANCHES - Cloud ERP v2.4.0</p>
        </div>
      </motion.div>
    </div>
  );
}
