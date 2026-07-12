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
  const [loading, setLoading] = useState(true);

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
                background: range === r.key ? tokens.colors.text : 'transparent',
                color: range === r.key ? '#fff' : tokens.colors.textMuted,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.statRow}>
        <Stat label="Ingresos" value={`$${revenue.toFixed(2)}`} />
        <Stat label="Pedidos" value={orders.length} />
        <Stat
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
              <XAxis dataKey="day" tick={{ fontFamily: tokens.fonts.sans, fontSize: 11, fill: tokens.colors.textMuted }} axisLine={{ stroke: tokens.colors.border }} tickLine={false} />
              <YAxis tick={{ fontFamily: tokens.fonts.sans, fontSize: 11, fill: tokens.colors.textMuted }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Ingresos']} />
              <Line type="monotone" dataKey="total" stroke={tokens.colors.accent} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={styles.panel}>
        <div style={styles.panelTitle}>Productos más vendidos</div>
        {topProducts.length === 0 ? (
          <div style={styles.empty}>Sin ventas en este período.</div>
        ) : (
          topProducts.map((p, i) => (
            <div key={p.name} style={styles.rankRow}>
              <span style={styles.rankNum}>{i + 1}</span>
              <span style={styles.rankName}>{p.name}</span>
              <span style={styles.rankQty}>{p.qty}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
  title: { fontSize: '20px', fontWeight: 600, color: tokens.colors.text, margin: 0 },
  rangeSwitch: { display: 'flex', gap: '2px', background: tokens.colors.surface, border: `1px solid ${tokens.colors.border}`, padding: '3px', borderRadius: tokens.radius.sm },
  rangeButton: {
    fontSize: '12px', padding: '6px 11px', border: 'none', borderRadius: '4px', cursor: 'pointer',
  },
  statRow: { display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' },
  statCard: { flex: '1 1 140px', background: tokens.colors.surface, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md, padding: '16px 18px' },
  statLabel: { fontSize: '12px', color: tokens.colors.textMuted },
  statValue: { fontSize: '22px', fontWeight: 600, color: tokens.colors.text, marginTop: '4px' },
  panel: { background: tokens.colors.surface, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md, padding: '18px', marginBottom: '16px' },
  panelTitle: { fontSize: '13px', fontWeight: 600, color: tokens.colors.text, marginBottom: '12px' },
  loading: { color: tokens.colors.textMuted, fontSize: '13px' },
  empty: { color: tokens.colors.textMuted, fontSize: '13px' },
  rankRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: `1px solid ${tokens.colors.border}` },
  rankNum: { fontSize: '12px', color: tokens.colors.textMuted, width: '14px' },
  rankName: { flex: 1, fontSize: '14px', color: tokens.colors.text },
  rankQty: { fontFamily: tokens.fonts.mono, fontSize: '13px', color: tokens.colors.textMuted },
};
