import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { tokens, perforatedEdge } from '../styles/tokens';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError('Correo o contraseña incorrectos.');
  };

  return (
    <div style={styles.page}>
      <div style={styles.ticket}>
        <div style={{ ...perforatedEdge(tokens.colors.counter), marginBottom: '-1px' }} />
        <div style={styles.ticketBody}>
          <div style={styles.eyebrow}>PANEL DE NEGOCIO</div>
          <h1 style={styles.title}>Iniciar sesión</h1>
          <p style={styles.subtitle}>Accede a tu menú y estadísticas</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>
              Correo
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                placeholder="tucorreo@negocio.com"
              />
            </label>
            <label style={styles.label}>
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="••••••••"
              />
            </label>

            {error && <div style={styles.error}>{error}</div>}

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
        <div style={{ ...perforatedEdge(tokens.colors.counter), marginTop: '-1px', transform: 'scaleY(-1)' }} />
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: tokens.colors.counter,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: tokens.fonts.sans,
    padding: '24px',
  },
  ticket: {
    width: '100%',
    maxWidth: '380px',
  },
  ticketBody: {
    background: tokens.colors.paper,
    padding: '40px 32px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
  },
  eyebrow: {
    fontFamily: tokens.fonts.mono,
    fontSize: '11px',
    letterSpacing: '0.12em',
    color: tokens.colors.inkFaded,
    marginBottom: '8px',
  },
  title: {
    fontFamily: tokens.fonts.mono,
    fontSize: '26px',
    color: tokens.colors.ink,
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: tokens.colors.inkFaded,
    margin: '0 0 28px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: tokens.colors.inkFaded,
  },
  input: {
    fontFamily: tokens.fonts.sans,
    fontSize: '15px',
    padding: '11px 12px',
    borderRadius: tokens.radius.sm,
    border: `1px solid ${tokens.colors.border}`,
    background: '#fff',
    color: tokens.colors.ink,
    outline: 'none',
  },
  error: {
    fontSize: '13px',
    color: tokens.colors.stampRed,
  },
  button: {
    fontFamily: tokens.fonts.mono,
    fontSize: '14px',
    letterSpacing: '0.04em',
    padding: '13px',
    borderRadius: tokens.radius.sm,
    border: 'none',
    background: tokens.colors.counter,
    color: tokens.colors.onCounter,
    cursor: 'pointer',
    marginTop: '6px',
  },
};
