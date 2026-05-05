import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, LogIn, AlertCircle, CheckCircle, KeyRound } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]           = useState({ email: '', password: '' });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [newPwMode, setNewPwMode] = useState(false);
  const [newPw, setNewPw]         = useState({ password: '', confirm: '' });
  const [pwUpdated, setPwUpdated] = useState(false);

  // Detecta cuando Supabase redirige con tipo=recovery (enlace del email)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setNewPwMode(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await supabase.auth.signOut();

    const { data: sessionData, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    if (authError) {
      setError('Email o contraseña incorrectos');
      setLoading(false);
      return;
    }

    const userId = sessionData?.user?.id;
    let clubId = 'city-fc';
    if (userId) {
      const { data: member } = await supabase
        .from('club_members')
        .select('club_id')
        .eq('user_id', userId)
        .single();
      if (member?.club_id) clubId = member.club_id;
    }

    localStorage.setItem('clubId', clubId);
    navigate('/');
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) { setError('Ingresa tu email.'); return; }
    setLoading(true);
    setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      form.email.trim(),
      { redirectTo: `${window.location.origin}/login` }
    );
    setLoading(false);
    if (resetError) setError('No se pudo enviar el correo. Verifica el email.');
    else setResetSent(true);
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    if (newPw.password !== newPw.confirm) { setError('Las contraseñas no coinciden.'); return; }
    if (newPw.password.length < 8) { setError('Mínimo 8 caracteres.'); return; }
    setLoading(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password: newPw.password });
    setLoading(false);
    if (updateError) setError('Error al actualizar: ' + updateError.message);
    else setPwUpdated(true);
  };

  // ── Pantalla: contraseña actualizada ──
  if (pwUpdated) {
    return (
      <div className="min-h-screen bg-[#060C18] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="w-12 h-12 text-[#00D084] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">¡Contraseña actualizada!</h2>
          <p className="text-sm text-gray-400 mb-6">Ya puedes ingresar con tu nueva contraseña.</p>
          <button onClick={() => { setNewPwMode(false); setPwUpdated(false); }}
            className="text-sm text-[#00AAFF] hover:underline">
            Ir al login
          </button>
        </div>
      </div>
    );
  }

  // ── Pantalla: establecer nueva contraseña (viene del enlace del email) ──
  if (newPwMode) {
    return (
      <div className="min-h-screen bg-[#060C18] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <KeyRound className="w-12 h-12 text-[#00AAFF] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">Nueva contraseña</h1>
            <p className="text-sm text-gray-400 mt-1">Elige una contraseña segura</p>
          </div>
          <div className="bg-[#0A1628] rounded-2xl border border-[#1A3A5C] p-6">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(255,94,94,0.12)] border border-[#FF5E5E]/20 mb-4">
                <AlertCircle className="w-4 h-4 text-[#FF5E5E] flex-shrink-0" />
                <p className="text-sm text-[#FF5E5E]">{error}</p>
              </div>
            )}
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Nueva contraseña</label>
                <input type="password" value={newPw.password} required minLength={8}
                  onChange={e => setNewPw(p => ({ ...p, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full bg-white/5 border border-[#1A3A5C] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00AAFF] transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Confirmar contraseña</label>
                <input type="password" value={newPw.confirm} required
                  onChange={e => setNewPw(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repite la contraseña"
                  className="w-full bg-white/5 border border-[#1A3A5C] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00AAFF] transition-colors" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00AAFF] text-white text-sm font-bold hover:bg-[#0066FF] transition-colors disabled:opacity-50">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Actualizando...</> : 'Guardar nueva contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Pantalla: email enviado ──
  if (resetSent) {
    return (
      <div className="min-h-screen bg-[#060C18] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="w-12 h-12 text-[#00D084] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Revisa tu correo</h2>
          <p className="text-sm text-gray-400 mb-6">
            Enviamos un enlace a <strong className="text-white">{form.email}</strong>.
            Ábrelo desde el mismo navegador donde usas el dashboard.
          </p>
          <button onClick={() => { setResetMode(false); setResetSent(false); }}
            className="text-sm text-[#00AAFF] hover:underline">
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  // ── Pantalla principal: login / olvidé contraseña ──
  return (
    <div className="min-h-screen bg-[#060C18] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(0,170,255,0.12)] border border-[#00AAFF]/20 flex items-center justify-center mx-auto mb-4">
            <img src="/10894351.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">ClubContable</h1>
          <p className="text-sm text-gray-400 mt-1">
            {resetMode ? 'Recupera tu contraseña' : 'Ingresa a tu panel de gestión'}
          </p>
        </div>

        <div className="bg-[#0A1628] rounded-2xl border border-[#1A3A5C] p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(255,94,94,0.12)] border border-[#FF5E5E]/20 mb-4">
              <AlertCircle className="w-4 h-4 text-[#FF5E5E] flex-shrink-0" />
              <p className="text-sm text-[#FF5E5E]">{error}</p>
            </div>
          )}
          <form onSubmit={resetMode ? handleReset : handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <input type="email" value={form.email} required autoComplete="email"
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com"
                className="w-full bg-white/5 border border-[#1A3A5C] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00AAFF] transition-colors" />
            </div>
            {!resetMode && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Contraseña</label>
                <input type="password" value={form.password} required autoComplete="current-password"
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-[#1A3A5C] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00AAFF] transition-colors" />
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00AAFF] text-white text-sm font-bold hover:bg-[#0066FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {resetMode ? 'Enviando...' : 'Ingresando...'}</>
                : resetMode ? 'Enviar enlace de recuperación'
                : <><LogIn className="w-4 h-4" /> Ingresar</>}
            </button>
          </form>
        </div>

        <div className="text-center mt-4">
          <button onClick={() => { setResetMode(!resetMode); setError(''); }}
            className="text-xs text-[#6B7280] hover:text-[#00AAFF] transition-colors">
            {resetMode ? '← Volver al login' : '¿Olvidaste tu contraseña?'}
          </button>
        </div>
      </div>
    </div>
  );
}
