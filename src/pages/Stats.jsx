import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '../supabaseClient';
import { tokens } from '../styles/tokens';

const RANGES = [
  { key: '7d', label: '7 días', days: 7 },
  { key: '30d', label: '30 días', days: 30 },
  { key: '90d', label: '90 días', days: 90 },
];

export default function Stats({ businessId }) {
  const [range, setRange] = useState('7d');
  const [orders, setOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [liveOrders, setLiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carga ventas del período + productos más vendidos
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const days = RANGES.find((r) => r.key === range).days;
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, total, created_at, status')
        .eq('business_id', businessId)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });
      setOrders(ordersData || []);

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('product_id, product_name, quantity, price, products(name), orders!inner(business_id, created_at)')
        .eq('orders.business_id', businessId)
        .gte('orders.created_at', since.toISOString());

      const ranking = {};
      (itemsData || []).forEach((item) => {
        const name = item.products?.name || item.product_name || 'Producto sin nombre';
        ranking[name] = (ranking[name] || 0) + item.quantity;
      });
      const sorted = Object.entries(ranking)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, qty]) => ({ name, qty }));
      setTopProducts(sorted);

      setLoading(false);
    };
    load();
  }, [businessId, range]);

  // Historial reciente + suscripción en tiempo real a pedidos nuevos
  useEffect(() => {
    const loadRecent = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, customer_name, total, status, created_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(15);
      setLiveOrders(data || []);
    };
    loadRecent();

    const channel = supabase
      .channel(`orders-${businessId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` },
        (payload) => setLiveOrders((prev) => [payload.new, ...prev].slice(0, 15))
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` },
        (payload) => setLiveOrders((prev) => prev.map((o) => (o.id === payload.new.id ? payload.new : o)))
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [businessId]);

  const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const chartData = buildDailySeries(orders, RANGES.find((r) => r.key === range).days);

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Estadísticas</h1>
        <div style={styles.rangeSwitch}>
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              style={{
                ...styles.rangeButton,
                background: range === r.key ? tokens.colors.pendingAmber : 'transparent',
                color: range === r.key ? tokens.colors.counter : tokens.colors.onCounterFaded,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.ticketRow}>
        <StatTicket label="Ingresos" value={`$${revenue.toFixed(2)}`} />
        <StatTicket label="Pedidos" value={orders.length} />
        <StatTicket
          label="Ticket promedio"
          value={`$${orders.length ? (revenue / orders.length).toFixed(2) : '0.00'}`}
        />
      </div>

      <div style={styles.panel}>
        <div style={styles.panelTitle}>Ventas por día</div>
        {loading ? (
          <div style={styles.loading}>Cargando…</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid stroke={tokens.colors.border} vertical={false} />
              <XAxis dataKey="day" tick={{ fontFamily: tokens.fonts.mono, fontSize: 11, fill: tokens.colors.inkFaded }} />
              <YAxis tick={{ fontFamily: tokens.fonts.mono, fontSize: 11, fill: tokens.colors.inkFaded }} />
              <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Ingresos']} />
              <Line type="monotone" dataKey="total" stroke={tokens.colors.stampRed} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={styles.twoCol}>
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Productos más vendidos</div>
          {topProducts.length === 0 ? (
            <div style={styles.empty}>Sin ventas en este período.</div>
          ) : (
            topProducts.map((p, i) => (
              <div key={p.name} style={styles.rankRow}>
                <span style={styles.rankNum}>{String(i + 1).padStart(2, '0')}</span>
                <span style={styles.rankName}>{p.name}</span>
                <span style={styles.rankQty}>{p.qty}</span>
              </div>
            ))
          )}
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}>
            Pedidos en vivo <span style={styles.liveDot} />
          </div>
          {liveOrders.length === 0 ? (
            <div style={styles.empty}>Aún no hay pedidos.</div>
          ) : (
            liveOrders.map((o) => (
              <div key={o.id} style={styles.orderRow}>
                <span style={styles.orderName}>{o.customer_name || 'Cliente'}</span>
                <span style={{ ...styles.orderStatus, color: statusColor(o.status) }}>{o.status}</span>
                <span style={styles.orderTotal}>${Number(o.total).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatTicket({ label, value }) {
  return (
    <div style={styles.ticket}>
      <div style={styles.ticketLabel}>{label}</div>
      <div style={styles.ticketValue}>{value}</div>
    </div>
  );
}

function statusColor(status) {
  if (status === 'pagado' || status === 'completado') return tokens.colors.registerGreen;
  if (status === 'cancelado') return tokens.colors.stampRed;
  return tokens.colors.pendingAmber;
}

function buildDailySeries(orders, days) {
  const buckets = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
    buckets[key] = 0;
  }
  orders.forEach((o) => {
    const key = new Date(o.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
    if (key in buckets) buckets[key] += Number(o.total);
  });
  return Object.entries(buckets).map(([day, total]) => ({ day, total }));
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontFamily: tokens.fonts.mono, fontSize: '22px', color: tokens.colors.onCounter, margin: 0 },
  rangeSwitch: { display: 'flex', gap: '4px', background: tokens.colors.counterRaised, padding: '4px', borderRadius: tokens.radius.sm },
  rangeButton: {
    fontFamily: tokens.fonts.mono, fontSize: '12px', padding: '7px 12px',
    border: 'none', borderRadius: tokens.radius.sm, cursor: 'pointer',
  },
  ticketRow: { display: 'flex', gap: '16px', marginBottom: '24px' },
  ticket: { flex: 1, background: tokens.colors.paper, borderRadius: tokens.radius.md, padding: '18px 20px' },
  ticketLabel: { fontFamily: tokens.fonts.mono, fontSize: '11px', letterSpacing: '0.08em', color: tokens.colors.inkFaded, textTransform: 'uppercase' },
  ticketValue: { fontFamily: tokens.fonts.mono, fontSize: '26px', color: tokens.colors.ink, marginTop: '6px' },
  panel: { background: tokens.colors.paper, borderRadius: tokens.radius.md, padding: '20px', marginBottom: '20px' },
  panelTitle: {
    fontFamily: tokens.fonts.mono, fontSize: '13px', letterSpacing: '0.05em',
    color: tokens.colors.ink, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px',
  },
  liveDot: {
    width: '7px', height: '7px', borderRadius: '50%', background: tokens.colors.registerGreen, display: 'inline-block',
  },
  loading: { color: tokens.colors.inkFaded, fontFamily: tokens.fonts.mono, fontSize: '13px' },
  empty: { color: tokens.colors.inkFaded, fontFamily: tokens.fonts.sans, fontSize: '13px' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  rankRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0', borderBottom: `1px solid ${tokens.colors.border}` },
  rankNum: { fontFamily: tokens.fonts.mono, fontSize: '12px', color: tokens.colors.pendingAmber },
  rankName: { flex: 1, fontFamily: tokens.fonts.sans, fontSize: '14px', color: tokens.colors.ink },
  rankQty: { fontFamily: tokens.fonts.mono, fontSize: '13px', color: tokens.colors.inkFaded },
  orderRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: `1px solid ${tokens.colors.border}` },
  orderName: { flex: 1, fontFamily: tokens.fonts.sans, fontSize: '14px', color: tokens.colors.ink },
  orderStatus: { fontFamily: tokens.fonts.mono, fontSize: '11px', textTransform: 'uppercase' },
  orderTotal: { fontFamily: tokens.fonts.mono, fontSize: '13px', color: tokens.colors.ink },
};
