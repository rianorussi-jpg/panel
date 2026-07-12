import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { tokens } from '../styles/tokens';
import MenuEditor from './MenuEditor';
import Stats from './Stats';

export default function DashboardLayout() {
  const [view, setView] = useState('stats'); // 'stats' | 'menu'
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    const loadBusiness = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_id', user.id)
        .single();
      setBusiness(data);
    };
    loadBusiness();
  }, []);

  const handleLogout = () => supabase.auth.signOut();

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.brandEyebrow}>PANEL DE NEGOCIO</div>
          <div style={styles.brandName}>{business?.name || 'Cargando…'}</div>
        </div>

        <nav style={styles.nav}>
          <NavItem label="Estadísticas" active={view === 'stats'} onClick={() => setView('stats')} />
          <NavItem label="Editar menú" active={view === 'menu'} onClick={() => setView('menu')} />
        </nav>

        <button onClick={handleLogout} style={styles.logout}>Cerrar sesión</button>
      </aside>

      <main style={styles.main}>
        {business ? (
          view === 'stats' ? <Stats businessId={business.id} /> : <MenuEditor businessId={business.id} />
        ) : (
          <div style={styles.loading}>Cargando tu negocio…</div>
        )}
      </main>
    </div>
  );
}

function NavItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navItem,
        color: active ? tokens.colors.onCounter : tokens.colors.onCounterFaded,
        borderLeft: `2px solid ${active ? tokens.colors.pendingAmber : 'transparent'}`,
        background: active ? tokens.colors.counterRaised : 'transparent',
      }}
    >
      {label}
    </button>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    background: tokens.colors.counter,
    fontFamily: tokens.fonts.sans,
  },
  sidebar: {
    width: '220px',
    flexShrink: 0,
    background: tokens.colors.counterRaised,
    borderRight: `1px solid ${tokens.colors.counterLine}`,
    padding: '28px 0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  brandEyebrow: {
    fontFamily: tokens.fonts.mono,
    fontSize: '10px',
    letterSpacing: '0.12em',
    color: tokens.colors.onCounterFaded,
    padding: '0 24px',
    marginBottom: '4px',
  },
  brandName: {
    fontFamily: tokens.fonts.mono,
    fontSize: '16px',
    color: tokens.colors.onCounter,
    padding: '0 24px',
    marginBottom: '36px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
  },
  navItem: {
    textAlign: 'left',
    padding: '13px 24px',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
  },
  logout: {
    margin: '0 24px',
    padding: '10px',
    fontSize: '12px',
    fontFamily: tokens.fonts.mono,
    background: 'transparent',
    border: `1px solid ${tokens.colors.counterLine}`,
    borderRadius: tokens.radius.sm,
    color: tokens.colors.onCounterFaded,
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    padding: '36px 40px',
    overflowY: 'auto',
  },
  loading: {
    color: tokens.colors.onCounterFaded,
    fontFamily: tokens.fonts.mono,
  },
};
