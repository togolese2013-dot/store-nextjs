// store-screens-2.jsx — ProductScreen + CartScreen
const { useState } = React;

// ── ProductScreen ─────────────────────────────────────────
function ProductScreen() {
  const p = PRODUCTS[0]; // Pagne wax — Indigo Royal
  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);
  const [variant, setVariant] = useState('5m');
  const [imgIdx, setImgIdx] = useState(0);
  const variants = ['2,5m', '5m', '10m'];

  return (
    <div style={{ fontFamily:FONTS.sans, WebkitFontSmoothing:'antialiased', minHeight:874, display:'flex', flexDirection:'column', background:C.white }}>
      <div style={{ flex:1, overflowY:'auto' }}>

        {/* Hero image */}
        <div style={{ position:'relative' }}>
          <PImg swatch={p.swatch} h={280} label="pagne wax · indigo royal" radius={0}/>

          {/* Overlay top controls */}
          <div style={{ position:'absolute', top:0, left:0, right:0, paddingTop:62, display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'68px 16px 0' }}>
            <button style={{ width:36, height:36, borderRadius:99, background:'rgba(255,255,255,0.88)', border:'none', cursor:'pointer', display:'grid', placeItems:'center', backdropFilter:'blur(8px)' }}>
              <IcBack s={20}/>
            </button>
            <div style={{ display:'flex', gap:10 }}>
              <button style={{ width:36, height:36, borderRadius:99, background:'rgba(255,255,255,0.88)', border:'none', cursor:'pointer', display:'grid', placeItems:'center', backdropFilter:'blur(8px)' }}>
                <IcShare s={17}/>
              </button>
              <button onClick={() => setFav(v => !v)} style={{ width:36, height:36, borderRadius:99, background:'rgba(255,255,255,0.88)', border:'none', cursor:'pointer', display:'grid', placeItems:'center', backdropFilter:'blur(8px)' }}>
                <IcHeart s={17} f={fav}/>
              </button>
            </div>
          </div>

          {/* Swipe dots */}
          <div style={{ position:'absolute', bottom:12, left:0, right:0, display:'flex', justifyContent:'center', gap:5 }}>
            {[0,1,2].map(i => (
              <div key={i} onClick={() => setImgIdx(i)} style={{ width: imgIdx===i ? 18 : 6, height:6, borderRadius:99, background: imgIdx===i ? '#fff' : 'rgba(255,255,255,0.5)', transition:'width .2s ease', cursor:'pointer' }}/>
            ))}
          </div>
        </div>

        {/* Product info */}
        <div style={{ padding:'18px 20px 0' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:6 }}>
            <div>
              <div style={{ fontSize:10.5, color:C.muted2, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{p.brand}</div>
              <div style={{ fontFamily:FONTS.serif, fontStyle:'italic', fontSize:24, color:C.ink, lineHeight:1.1, letterSpacing:'-0.01em', marginBottom:8 }}>{p.name}</div>
            </div>
          </div>

          {/* Price + stock */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontSize:22, fontFamily:FONTS.mono, fontWeight:500, color:C.ink, letterSpacing:'-0.02em' }}>{fmt(p.price)}</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:C.ok, fontWeight:500 }}>
              <div style={{ width:6, height:6, borderRadius:99, background:C.ok }}/>
              En stock · 42 unités
            </div>
          </div>

          <Stars n={4} count="38" size={12}/>

          {/* Divider */}
          <div style={{ height:1, background:C.border, margin:'14px 0' }}/>

          {/* Variant selector */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:500, color:C.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Longueur / Length</div>
            <div style={{ display:'flex', gap:8 }}>
              {variants.map(v => (
                <button key={v} onClick={() => setVariant(v)} style={{ padding:'8px 14px', borderRadius:9, border:`1.5px solid ${variant===v ? C.ink : C.border}`, background: variant===v ? C.ink : 'transparent', color: variant===v ? '#fff' : C.ink, fontSize:13, fontWeight:500, fontFamily:FONTS.sans, cursor:'pointer', letterSpacing:'-0.01em', transition:'all .15s ease' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Qty selector */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:500, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em' }}>Quantité</div>
            <div style={{ display:'flex', alignItems:'center', gap:0, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ width:38, height:38, background:C.bg, border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:C.ink }}>
                <IcMinus s={14}/>
              </button>
              <div style={{ width:38, textAlign:'center', fontSize:14, fontWeight:500, fontFamily:FONTS.mono, color:C.ink, borderLeft:`1px solid ${C.border}`, borderRight:`1px solid ${C.border}`, height:38, display:'grid', placeItems:'center' }}>{qty}</div>
              <button onClick={() => setQty(q => q+1)} style={{ width:38, height:38, background:C.bg, border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:C.ink }}>
                <IcPlus s={14}/>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height:1, background:C.border, margin:'0 0 14px' }}/>

          {/* Shipping info */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:C.bg, borderRadius:10, marginBottom:14 }}>
            <IcTruck s={17}/>
            <div>
              <div style={{ fontSize:12.5, fontWeight:500, color:C.ink }}>Livraison offerte · Free shipping</div>
              <div style={{ fontSize:11.5, color:C.muted, marginTop:1 }}>Livraison estimée : 3–5 jours ouvrés</div>
            </div>
          </div>

          {/* Description */}
          <div style={{ fontSize:13.5, color:C.muted, lineHeight:1.55, marginBottom:24, letterSpacing:'-0.005em' }}>
            Pagne wax 100% coton imprimé, collection indigo royal. Tissage traditionnel à motifs géométriques, teinture végétale. Idéal pour confection de tenues de cérémonie ou prêt-à-porter.
          </div>
        </div>
      </div>

      {/* Sticky Add to cart */}
      <div style={{ padding:'12px 16px 28px', background:'rgba(255,255,255,0.96)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderTop:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', gap:10 }}>
          <button style={{ flex:1, height:50, borderRadius:14, background:C.ink, color:'#fff', border:'none', fontSize:15, fontWeight:600, fontFamily:FONTS.sans, cursor:'pointer', letterSpacing:'-0.01em', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <IcBag s={18}/>
            Ajouter au panier · {fmt(p.price * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CartScreen ────────────────────────────────────────────
function CartScreen() {
  const [items, setItems] = useState([
    { id:1, ...PRODUCTS[0], qty:1  },
    { id:2, ...PRODUCTS[1], qty:2  },
    { id:4, ...PRODUCTS[3], qty:1  },
  ]);
  const [promo, setPromo] = useState('');

  const updateQty = (id, delta) => setItems(prev =>
    prev.map(it => it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it)
  );
  const removeItem = id => setItems(prev => prev.filter(it => it.id !== id));

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const total = subtotal;

  return (
    <div style={{ fontFamily:FONTS.sans, WebkitFontSmoothing:'antialiased', minHeight:874, display:'flex', flexDirection:'column', background:C.white }}>
      <div style={{ flex:1, overflowY:'auto', paddingTop:62 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px 14px', borderBottom:`1px solid ${C.border}` }}>
          <button style={{ color:C.ink, padding:4, background:'none', border:'none', cursor:'pointer', display:'grid', placeItems:'center' }}><IcBack s={22}/></button>
          <div style={{ flex:1, fontSize:17, fontWeight:500, letterSpacing:'-0.025em', color:C.ink }}>
            Mon Panier <span style={{ color:C.muted2, fontWeight:400 }}>({items.length})</span>
          </div>
        </div>

        {/* Items */}
        <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:12 }}>
          {items.map(it => (
            <div key={it.id} style={{ display:'flex', gap:12, padding:'12px', background:C.white, borderRadius:14, border:`1px solid ${C.border}` }}>
              <div style={{ width:72, flexShrink:0 }}>
                <PImg swatch={it.swatch} h={72} radius={10} label={it.cat.toLowerCase()}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:9.5, color:C.muted2, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{it.brand}</div>
                <div style={{ fontSize:13, fontWeight:500, color:C.ink, lineHeight:1.25, marginBottom:6, letterSpacing:'-0.01em' }}>{it.name}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  {/* Qty controls */}
                  <div style={{ display:'flex', alignItems:'center', gap:0, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
                    <button onClick={() => updateQty(it.id, -1)} style={{ width:30, height:30, background:C.bg, border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:C.ink }}>
                      <IcMinus s={12}/>
                    </button>
                    <div style={{ width:30, textAlign:'center', fontSize:13, fontWeight:500, fontFamily:FONTS.mono, borderLeft:`1px solid ${C.border}`, borderRight:`1px solid ${C.border}`, height:30, display:'grid', placeItems:'center' }}>{it.qty}</div>
                    <button onClick={() => updateQty(it.id, 1)} style={{ width:30, height:30, background:C.bg, border:'none', cursor:'pointer', display:'grid', placeItems:'center', color:C.ink }}>
                      <IcPlus s={12}/>
                    </button>
                  </div>
                  <div style={{ fontSize:14, fontFamily:FONTS.mono, fontWeight:500, color:C.ink }}>{fmt(it.price * it.qty)}</div>
                </div>
              </div>
              <button onClick={() => removeItem(it.id)} style={{ alignSelf:'flex-start', color:C.muted2, background:'none', border:'none', cursor:'pointer', padding:4, display:'grid', placeItems:'center' }}>
                <IcTrash s={16}/>
              </button>
            </div>
          ))}
        </div>

        {/* Promo code */}
        <div style={{ padding:'0 16px 16px' }}>
          <div style={{ display:'flex', gap:8 }}>
            <input value={promo} onChange={e => setPromo(e.target.value)} placeholder="Code promo / Promo code" style={{ flex:1, padding:'11px 14px', border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, fontFamily:FONTS.sans, color:C.ink, background:C.bg, outline:'none' }}/>
            <button style={{ padding:'11px 16px', borderRadius:10, background:C.ink, color:'#fff', border:'none', fontSize:13, fontWeight:600, fontFamily:FONTS.sans, cursor:'pointer', whiteSpace:'nowrap' }}>Appliquer</button>
          </div>
        </div>

        {/* Order summary */}
        <div style={{ margin:'0 16px 16px', padding:'14px 16px', background:C.bg, borderRadius:14, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:14, fontWeight:500, letterSpacing:'-0.02em', color:C.ink, marginBottom:12 }}>Récapitulatif</div>
          {[
            { label:'Sous-total', val:fmt(subtotal) },
            { label:'Livraison', val:'Offerte 🎁', ok:true },
            { label:'Réduction', val:'—', muted:true },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:13.5, color:C.muted }}>{r.label}</span>
              <span style={{ fontSize:13.5, fontFamily:r.ok?FONTS.sans:FONTS.mono, fontWeight:r.ok?500:400, color:r.ok?C.ok:r.muted?C.muted2:C.ink }}>{r.val}</span>
            </div>
          ))}
          <div style={{ height:1, background:C.border, margin:'10px 0' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:15, fontWeight:500, color:C.ink }}>Total</span>
            <span style={{ fontSize:17, fontFamily:FONTS.mono, fontWeight:500, color:C.ink }}>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Checkout CTA */}
      <div style={{ padding:'12px 16px 28px', background:'rgba(255,255,255,0.96)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderTop:`1px solid ${C.border}` }}>
        <button style={{ width:'100%', height:50, borderRadius:14, background:C.ink, color:'#fff', border:'none', fontSize:15, fontWeight:600, fontFamily:FONTS.sans, cursor:'pointer', letterSpacing:'-0.01em', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          Passer la commande →
        </button>
        <div style={{ textAlign:'center', fontSize:11.5, color:C.muted2, marginTop:8 }}>
          Paiement sécurisé · Wave · Orange Money · Carte
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProductScreen, CartScreen });
