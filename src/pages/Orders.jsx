import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { tokens } from '../styles/tokens';

const STATUS_LABEL = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

export default function Orders({ businessId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [itemsByOrder, setItemsByOrder] = useState({});
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('orders')
        .select('id, customer_name, phone, delivery_type, address, delivery_time, notes, total, status, created_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(50);
      setOrders(data || []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`orders-page-${businessId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` },
        (payload) => setOrders((prev) => [payload.new, ...prev])
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` },
        (payload) => setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? payload.new : o)))
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [businessId]);

  const toggleExpand = async (orderId) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    if (!itemsByOrder[orderId]) {
      const { data } = await supabase
        .from('order_items')
        .select('product_name, products(name), quantity, price')
        .eq('order_id', orderId);
      setItemsByOrder((prev) => ({ ...prev, [orderId]: data || [] }));
    }
  };

  const markCompleted = async (orderId, e) => {
    e.stopPropagation();
    await supabase.from('orders').update({ status: 'completado' }).eq('id', orderId);
  };

  const pending = orders.filter((o) => o.status !== 'completado' && o.status !== 'cancelado');
  const history = orders.filter((o) => o.status === 'completado' || o.status === 'cancelado');

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Pedidos</h1>
        <div style={styles.count}>{pending.length} pendiente{pending.length !== 1 ? 's' : ''}</div>
      </div>

      {loading ? (
        <div style={styles.empty}>Cargando…</div>
      ) : pending.length === 0 ? (
        <div style={styles.emptyBox}>No hay pedidos pendientes.</div>
      ) : (
        <div style={styles.list}>
          {pending.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              expanded={expandedId === o.id}
              items={itemsByOrder[o.id]}
              onToggle={() => toggleExpand(o.id)}
              onComplete={(e) => markCompleted(o.id, e)}
            />
          ))}
        </div>
      )}

      <button style={styles.historyToggle} onClick={() => setShowHistory((v) => !v)}>
        {showHistory ? 'Ocultar historial' : `Ver historial (${history.length})`}
      </button>

      {showHistory && (
        <div style={{ ...styles.list, marginTop: '12px' }}>
          {history.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              expanded={expandedId === o.id}
              items={itemsByOrder[o.id]}
              onToggle={() => toggleExpand(o.id)}
              muted
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, expanded, items, onToggle, onComplete, muted }) {
  return (
    <div style={{ ...styles.card, opacity: muted ? 0.6 : 1 }}>
      <div style={styles.row} onClick={onToggle}>
        <div style={styles.rowMain}>
          <span style={styles.customerName}>{order.customer_name || 'Cliente'}</span>
          <span style={styles.time}>{new Date(order.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <span style={{ ...styles.badge, ...statusStyle(order.status) }}>{STATUS_LABEL[order.status] || order.status}</span>
        <span style={styles.total}>${Number(order.total).toFixed(2)}</span>
        {!muted && order.status !== 'completado' && (
          <button style={styles.completeButton} onClick={onComplete}>
            Marcar completado
          </button>
        )}
      </div>

      {expanded && (
        <div style={styles.detail}>
          {items === undefined ? (
            <div style={styles.empty}>Cargando…</div>
          ) : (
            <>
              {items.map((item, idx) => (
                <div key={idx} style={styles.detailItem}>
                  {item.quantity}× {item.products?.name || item.product_name} — ${Number(item.price).toFixed(2)}
                </div>
              ))}
              <div style={styles.detailMeta}>
                {order.phone && <div>{order.phone}</div>}
                {order.delivery_type === 'domicilio' && order.address && <div>{order.address}</div>}
                {order.delivery_type === 'recoger' && <div>Recoger en tienda</div>}
                {order.delivery_time && <div>{order.delivery_time}</div>}
                {order.notes && <div>Nota: {order.notes}</div>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function statusStyle(status) {
  if (status === 'completado') return { background: tokens.colors.successSoft, color: tokens.colors.success };
  if (status === 'cancelado') return { background: tokens.colors.dangerSoft, color: tokens.colors.danger };
  if (status === 'pagado') return { background: tokens.colors.successSoft, color: tokens.colors.success };
  return { background: tokens.colors.warningSoft, color: tokens.colors.warning };
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' },
  title: { fontFamily: tokens.fonts.sans, fontSize: '20px', fontWeight: 600, color: tokens.colors.text, margin: 0 },
  count: { fontSize: '13px', color: tokens.colors.textMuted },
  empty: { color: tokens.colors.textMuted, fontSize: '13px' },
  emptyBox: {
    color: tokens.colors.textMuted, fontSize: '14px', padding: '32px',
    textAlign: 'center', border: `1px dashed ${tokens.colors.border}`, borderRadius: tokens.radius.md,
  },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  card: {
    background: tokens.colors.surface, border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.md, overflow: 'hidden',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', cursor: 'pointer',
  },
  rowMain: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  customerName: { fontSize: '14px', fontWeight: 500, color: tokens.colors.text },
  time: { fontSize: '12px', color: tokens.colors.textMuted },
  badge: {
    fontSize: '11px', fontWeight: 600, padding: '4px 9px', borderRadius: '999px', textTransform: 'uppercase',
  },
  total: { fontFamily: tokens.fonts.mono, fontSize: '13px', color: tokens.colors.text, minWidth: '64px', textAlign: 'right' },
  completeButton: {
    fontSize: '12px', fontWeight: 600, padding: '7px 12px', borderRadius: tokens.radius.sm,
    border: 'none', background: tokens.colors.text, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  detail: {
    borderTop: `1px solid ${tokens.colors.border}`, padding: '12px 16px',
    fontSize: '13px', color: tokens.colors.text, background: tokens.colors.bg,
  },
  detailItem: { marginBottom: '4px' },
  detailMeta: {
    marginTop: '8px', paddingTop: '8px', borderTop: `1px dashed ${tokens.colors.border}`,
    display: 'flex', flexDirection: 'column', gap: '3px', color: tokens.colors.textMuted, fontSize: '12px',
  },
  historyToggle: {
    marginTop: '16px', fontSize: '13px', color: tokens.colors.textMuted,
    background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline',
  },
};
