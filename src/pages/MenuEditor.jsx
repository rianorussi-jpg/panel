import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { tokens } from '../styles/tokens';

export default function MenuEditor({ businessId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .order('category')
      .order('name');
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, [businessId]);

  const toggleActive = async (product) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p)));
    await supabase.from('products').update({ active: !product.active }).eq('id', product.id);
  };

  const grouped = products.reduce((acc, p) => {
    const cat = p.category || 'Sin categoría';
    (acc[cat] = acc[cat] || []).push(p);
    return acc;
  }, {});

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Editar menú</h1>
      </div>
      <p style={styles.hint}>Prende o apaga productos para que aparezcan o no en tu menú.</p>

      {loading ? (
        <div style={styles.loading}>Cargando menú…</div>
      ) : products.length === 0 ? (
        <div style={styles.emptyBox}>Todavía no tienes productos configurados.</div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} style={{ marginBottom: '24px' }}>
            <div style={styles.categoryLabel}>{category}</div>
            <div style={styles.list}>
              {items.map((p) => (
                <div key={p.id} style={styles.row}>
                  {p.image_url && <img src={p.image_url} alt={p.name} style={styles.thumb} />}
                  <div style={{ flex: 1 }}>
                    <div style={styles.rowName}>{p.name}</div>
                    <div style={styles.rowMeta}>${Number(p.price).toFixed(2)}</div>
                  </div>
                  <span style={styles.statusLabel}>{p.active ? 'Disponible' : 'Agotado'}</span>
                  <Switch checked={p.active} onChange={() => toggleActive(p)} />
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: '38px', height: '22px', borderRadius: '999px', border: 'none', cursor: 'pointer',
        background: checked ? tokens.colors.success : tokens.colors.borderStrong,
        position: 'relative', flexShrink: 0, transition: 'background 0.15s',
      }}
    >
      <span
        style={{
          position: 'absolute', top: '3px', left: checked ? '19px' : '3px',
          width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
          transition: 'left 0.15s',
        }}
      />
    </button>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  title: { fontSize: '20px', fontWeight: 600, color: tokens.colors.text, margin: 0 },
  hint: { fontSize: '13px', color: tokens.colors.textMuted, margin: '0 0 20px 0' },
  loading: { color: tokens.colors.textMuted, fontSize: '13px' },
  emptyBox: {
    color: tokens.colors.textMuted, fontSize: '14px', padding: '32px',
    textAlign: 'center', border: `1px dashed ${tokens.colors.border}`, borderRadius: tokens.radius.md,
  },
  categoryLabel: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em',
    color: tokens.colors.textMuted, marginBottom: '8px', textTransform: 'uppercase',
  },
  list: { background: tokens.colors.surface, border: `1px solid ${tokens.colors.border}`, borderRadius: tokens.radius.md, overflow: 'hidden' },
  row: {
    display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px',
    borderBottom: `1px solid ${tokens.colors.border}`,
  },
  thumb: { width: '38px', height: '38px', borderRadius: tokens.radius.sm, objectFit: 'cover' },
  rowName: { fontSize: '14px', color: tokens.colors.text, fontWeight: 500 },
  rowMeta: { fontSize: '12px', color: tokens.colors.textMuted, marginTop: '2px' },
  statusLabel: { fontSize: '12px', color: tokens.colors.textMuted, minWidth: '68px', textAlign: 'right' },
};
