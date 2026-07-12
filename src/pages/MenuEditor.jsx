import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { tokens } from '../styles/tokens';

const emptyProduct = { name: '', price: '', category: '', image_url: '', active: true };

export default function MenuEditor({ businessId }) {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null); // producto en edición, o null
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

  const handleSave = async (product) => {
    if (product.id) {
      await supabase.from('products').update({
        name: product.name,
        price: product.price,
        category: product.category,
        image_url: product.image_url,
        active: product.active,
      }).eq('id', product.id);
    } else {
      await supabase.from('products').insert({ ...product, business_id: businessId });
    }
    setEditing(null);
    loadProducts();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto del menú?')) return;
    await supabase.from('products').delete().eq('id', id);
    loadProducts();
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
        <button style={styles.addButton} onClick={() => setEditing({ ...emptyProduct })}>
          + Agregar producto
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>Cargando menú…</div>
      ) : products.length === 0 ? (
        <div style={styles.empty}>Todavía no tienes productos. Agrega el primero.</div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} style={{ marginBottom: '28px' }}>
            <div style={styles.categoryLabel}>{category}</div>
            <div style={styles.list}>
              {items.map((p) => (
                <div key={p.id} style={styles.row}>
                  {p.image_url && <img src={p.image_url} alt={p.name} style={styles.thumb} />}
                  <div style={{ flex: 1 }}>
                    <div style={styles.rowName}>{p.name}</div>
                    <div style={styles.rowMeta}>
                      ${Number(p.price).toFixed(2)} · {p.active ? 'Activo' : 'Oculto'}
                    </div>
                  </div>
                  <button style={styles.linkButton} onClick={() => setEditing(p)}>Editar</button>
                  <button style={{ ...styles.linkButton, color: tokens.colors.stampRed }} onClick={() => handleDelete(p.id)}>
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {editing && (
        <ProductModal
          product={editing}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function ProductModal({ product, onCancel, onSave }) {
  const [form, setForm] = useState(product);
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.modalTitle}>{form.id ? 'Editar producto' : 'Nuevo producto'}</h2>

        <label style={styles.label}>
          Nombre
          <input style={styles.input} value={form.name} onChange={update('name')} />
        </label>
        <label style={styles.label}>
          Precio
          <input style={styles.input} type="number" step="0.01" value={form.price} onChange={update('price')} />
        </label>
        <label style={styles.label}>
          Categoría
          <input style={styles.input} value={form.category} onChange={update('category')} placeholder="Ej. Bebidas" />
        </label>
        <label style={styles.label}>
          URL de imagen (ibb.co)
          <input style={styles.input} value={form.image_url} onChange={update('image_url')} />
        </label>
        <label style={{ ...styles.label, flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Visible en el menú
        </label>

        <div style={styles.modalActions}>
          <button style={styles.cancelButton} onClick={onCancel}>Cancelar</button>
          <button style={styles.addButton} onClick={() => onSave(form)}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' },
  title: { fontFamily: tokens.fonts.mono, fontSize: '22px', color: tokens.colors.onCounter, margin: 0 },
  addButton: {
    fontFamily: tokens.fonts.mono, fontSize: '13px', padding: '10px 16px',
    background: tokens.colors.pendingAmber, color: tokens.colors.counter,
    border: 'none', borderRadius: tokens.radius.sm, cursor: 'pointer',
  },
  loading: { color: tokens.colors.onCounterFaded, fontFamily: tokens.fonts.mono },
  empty: { color: tokens.colors.onCounterFaded, fontFamily: tokens.fonts.sans, fontSize: '14px' },
  categoryLabel: {
    fontFamily: tokens.fonts.mono, fontSize: '11px', letterSpacing: '0.1em',
    color: tokens.colors.onCounterFaded, marginBottom: '10px', textTransform: 'uppercase',
  },
  list: { background: tokens.colors.paper, borderRadius: tokens.radius.md, overflow: 'hidden' },
  row: {
    display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px',
    borderBottom: `1px solid ${tokens.colors.border}`,
  },
  thumb: { width: '40px', height: '40px', borderRadius: tokens.radius.sm, objectFit: 'cover' },
  rowName: { fontFamily: tokens.fonts.sans, fontSize: '14px', color: tokens.colors.ink, fontWeight: 500 },
  rowMeta: { fontFamily: tokens.fonts.mono, fontSize: '12px', color: tokens.colors.inkFaded, marginTop: '2px' },
  linkButton: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: tokens.fonts.sans, fontSize: '13px', color: tokens.colors.inkFaded,
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
  },
  modal: {
    background: tokens.colors.paper, borderRadius: tokens.radius.md,
    padding: '28px', width: '100%', maxWidth: '400px',
    display: 'flex', flexDirection: 'column', gap: '14px',
  },
  modalTitle: { fontFamily: tokens.fonts.mono, fontSize: '18px', color: tokens.colors.ink, margin: '0 0 6px 0' },
  label: { display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', color: tokens.colors.inkFaded },
  input: {
    fontFamily: tokens.fonts.sans, fontSize: '14px', padding: '9px 10px',
    borderRadius: tokens.radius.sm, border: `1px solid ${tokens.colors.border}`, outline: 'none',
  },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' },
  cancelButton: {
    fontFamily: tokens.fonts.sans, fontSize: '13px', padding: '10px 16px',
    background: 'transparent', border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.sm, cursor: 'pointer', color: tokens.colors.inkFaded,
  },
};
