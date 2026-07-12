import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { tokens } from '../styles/tokens';
import Orders from './Orders';
import MenuEditor from './MenuEditor';
import Stats from './Stats';

export default function DashboardLayout() {
  const [view, setView] = useState('orders'); // 'orders' | 'stats' | 'menu'
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
          <div style={styles.brandName}>{business?.name || 'Cargando…'}</div>

          <nav style={styles.nav}>
            <NavItem label="Pedidos" active={view === 'orders'} onClick={() => setView('orders')} />
            <NavItem label="Estadísticas" active={view === 'stats'} onClick={() => setView('stats')} />
            <NavItem label="Editar menú" active={view === 'menu'} onClick={() => setView('menu')} />
          </nav>
        </div>

        <button onClick={handleLogout} style={styles.logout}>Cerrar sesión</button>
      </aside>

      <main style={styles.main}>
        {business ? (
          view === 'orders' ? <Orders businessId={business.id} />
          : view === 'stats' ? <Stats businessId={business.id} />
          : <MenuEditor businessId={business.id} />
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
        color: active ? tokens.colors.text : tokens.colors.textMuted,
        background: active ? tokens.colors.bg : 'transparent',
        fontWeight: active ? 600 : 400,
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
    background: tokens.colors.bg,
    fontFamily: tokens.fonts.sans,
  },
  sidebar: {
    width: '200px',
    flexShrink: 0,
    background: tokens.colors.sidebar,
    borderRight: `1px solid ${tokens.colors.border}`,
    padding: '24px 0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  brandName: {
    fontSize: '14px',
    fontWeight: 600,
    color: tokens.colors.text,
    padding: '0 20px',
    marginBottom: '24px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '0 8px',
  },
  navItem: {
    textAlign: 'left',
    padding: '9px 12px',
    fontSize: '14px',
    border: 'none',
    borderRadius: tokens.radius.sm,
    cursor: 'pointer',
    background: 'transparent',
  },
  logout: {
    margin: '0 20px',
    padding: '9px',
    fontSize: '12px',
    background: 'transparent',
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.sm,
    color: tokens.colors.textMuted,
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    padding: '32px 40px',
    overflowY: 'auto',
  },
  loading: {
    color: tokens.colors.textMuted,
    fontSize: '14px',
  },
};
