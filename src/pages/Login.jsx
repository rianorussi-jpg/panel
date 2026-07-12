import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { tokens } from '../styles/tokens';

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
      <div style={styles.card}>
        <div style={styles.title}>Panel de negocio</div>
        <p style={styles.subtitle}>Inicia sesión para continuar</p>

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
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: tokens.colors.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: tokens.fonts.sans,
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '360px',
    background: tokens.colors.surface,
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.md,
    padding: '36px 32px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: tokens.colors.text,
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: tokens.colors.textMuted,
    margin: '0 0 24px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: tokens.colors.textMuted,
  },
  input: {
    fontFamily: tokens.fonts.sans,
    fontSize: '14px',
    padding: '10px 12px',
    borderRadius: tokens.radius.sm,
    border: `1px solid ${tokens.colors.border}`,
    background: tokens.colors.bg,
    color: tokens.colors.text,
    outline: 'none',
  },
  error: {
    fontSize: '13px',
    color: tokens.colors.danger,
  },
  button: {
    fontFamily: tokens.fonts.sans,
    fontSize: '14px',
    fontWeight: 600,
    padding: '11px',
    borderRadius: tokens.radius.sm,
    border: 'none',
    background: tokens.colors.text,
    color: '#fff',
    cursor: 'pointer',
    marginTop: '4px',
  },
};
