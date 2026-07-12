import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { tokens } from '../styles/tokens';
import { useIsMobile } from '../hooks/useIsMobile';
import Orders from './Orders';
import MenuEditor from './MenuEditor';
import Stats from './Stats';

const TABS = [
  { key: 'orders', label: 'Pedidos', icon: '🧾' },
  { key: 'stats', label: 'Estadísticas', icon: '📊' },
  { key: 'menu', label: 'Menú', icon: '🍽️' },
];

export default function DashboardLayout() {
  const [view, setView] = useState('orders');
  const [business, setBusiness] = useState(null);
  const isMobile = useIsMobile();

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

  const content = business ? (
    view === 'orders' ? <Orders businessId={business.id} />
    : view === 'stats' ? <Stats businessId={business.id} />
    : <MenuEditor businessId={business.id} />
  ) : (
    <div style={styles.loading}>Cargando tu negocio…</div>
  );

  if (isMobile) {
    return (
      <div style={styles.mobilePage}>
        <header style={styles.mobileHeader}>
          <span style={styles.brandName}>{business?.name || 'Cargando…'}</span>
          <button onClick={handleLogout} style={styles.mobileLogout}>Salir</button>
        </header>

        <main style={styles.mobileMain}>{content}</main>

        <nav style={styles.tabBar}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              style={{ ...styles.tabItem, color: view === t.key ? tokens.colors.text : tokens.colors.textMuted }}
            >
              <span style={styles.tabIcon}>{t.icon}</span>
              <span style={styles.tabLabel}>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.brandName}>{business?.name || 'Cargando…'}</div>

          <nav style={styles.nav}>
            {TABS.map((t) => (
              <NavItem key={t.key} label={t.label} active={view === t.key} onClick={() => setView(t.key)} />
            ))}
          </nav>
        </div>

        <button onClick={handleLogout} style={styles.logout}>Cerrar sesión</button>
      </aside>

      <main style={styles.main}>{content}</main>
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
  // Escritorio
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
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '0 8px',
    marginTop: '24px',
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

  // Móvil
  mobilePage: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: tokens.colors.bg,
    fontFamily: tokens.fonts.sans,
  },
  mobileHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px',
    background: tokens.colors.surface,
    borderBottom: `1px solid ${tokens.colors.border}`,
    position: 'sticky', top: 0, zIndex: 10,
  },
  mobileLogout: {
    fontSize: '12px', color: tokens.colors.textMuted,
    background: 'transparent', border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.sm, padding: '6px 10px', cursor: 'pointer',
  },
  mobileMain: {
    flex: 1,
    padding: '16px',
    paddingBottom: '84px', // deja espacio para la barra inferior
    overflowY: 'auto',
  },
  tabBar: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    display: 'flex',
    background: tokens.colors.surface,
    borderTop: `1px solid ${tokens.colors.border}`,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    zIndex: 10,
  },
  tabItem: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
    padding: '10px 0 8px', background: 'none', border: 'none', cursor: 'pointer',
  },
  tabIcon: { fontSize: '18px' },
  tabLabel: { fontSize: '11px' },
};
