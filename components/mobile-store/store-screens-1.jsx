// store-screens-1.jsx — HomeScreen + CatalogueScreen
const { useState } = React;

// ── HomeScreen ────────────────────────────────────────────
function HomeScreen() {
  const [favs, setFavs] = useState(new Set());
  const [activeCat, setActiveCat] = useState('Tous');
  const cats = ['Tous', 'Textile', 'Cosmétique', 'Alimentation', 'Accessoires'];

  const toggleFav = id => setFavs(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const s = { fontFamily: FONTS.sans, WebkitFontSmoothing: 'antialiased' };

  return (
    <div style={{ ...s, minHeight:874, display:'flex', flexDirection:'column', background:C.white }}>
      {/* ── scrollable content ── */}
      <div style={{ flex:1, overflowY:'auto', paddingTop:62 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 10px' }}>
          <div>
            <div style={{ fontFamily:FONTS.serif, fontStyle:'italic', fontSize:21, color:C.ink, lineHeight:1, letterSpacing:'-0.01em' }}>Maison Diallo</div>
            <div style={{ fontSize:10, color:C.muted2, marginTop:2, letterSpacing:'0.08em', textTransform:'uppercase' }}>Artisanat Africain</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button style={{ color:C.ink, padding:5, background:'none', border:'none', cursor:'pointer', borderRadius:9, display:'grid', placeItems:'center' }}>
              <IcSearch s={20}/>
            </button>
            <button style={{ color:C.ink, padding:5, background:'none', border:'none', cursor:'pointer', borderRadius:9, position:'relative', display:'grid', placeItems:'center' }}>
              <IcBag s={22}/>
              <span style={{ position:'absolute', top:1, right:1, width:15, height:15, borderRadius:99, background:C.brand, color:'#fff', fontSize:8.5, fontWeight:700, display:'grid', placeItems:'center', fontFamily:FONTS.mono }}>3</span>
            </button>
          </div>
        </div>

        {/* Hero */}
        <div style={{ margin:'0 16px', borderRadius:18, overflow:'hidden', position:'relative' }}>
          <PImg swatch="#1F3D6E" h={196} label="hero · collection wax" />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(10,8,5,0.76) 0%, rgba(10,8,5,0.08) 52%, transparent 100%)', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'22px' }}>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', marginBottom:6 }}>Collection Printemps 2026</div>
            <div style={{ fontFamily:FONTS.serif, fontStyle:'italic', fontSize:28, color:'#fff', lineHeight:1.08, marginBottom:14 }}>Wax &amp; Artisanat</div>
            <button style={{ alignSelf:'flex-start', background:'#fff', color:C.ink, border:'none', borderRadius:99, padding:'9px 18px', fontSize:12.5, fontWeight:600, fontFamily:FONTS.sans, cursor:'pointer', letterSpacing:'-0.01em' }}>
              Découvrir la collection
            </button>
          </div>
        </div>

        {/* Categories */}
        <div style={{ overflowX:'auto', scrollbarWidth:'none' }}>
          <div style={{ display:'flex', gap:7, padding:'14px 16px 8px', width:'max-content' }}>
            {cats.map(c => (
              <button key={c} onClick={() => setActiveCat(c)} style={{ padding:'7px 14px', borderRadius:99, border:`1.5px solid ${activeCat===c ? C.ink : C.border}`, background:activeCat===c ? C.ink : 'transparent', color:activeCat===c ? '#fff' : C.muted, fontSize:12.5, fontWeight:500, fontFamily:FONTS.sans, cursor:'pointer', whiteSpace:'nowrap', letterSpacing:'-0.005em' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Nouveautés */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px 8px' }}>
          <div style={{ fontSize:16, fontWeight:500, letterSpacing:'-0.02em', color:C.ink }}>Nouveautés</div>
          <button style={{ fontSize:12, color:C.accent, background:'none', border:'none', cursor:'pointer', fontFamily:FONTS.sans }}>Voir tout →</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'0 16px' }}>
          {PRODUCTS.slice(0,2).map(p => (
            <div key={p.id} style={{ background:C.white, borderRadius:14, overflow:'hidden', border:`1px solid ${C.border}`, cursor:'pointer' }}>
              <div style={{ position:'relative' }}>
                <PImg swatch={p.swatch} h={122} label={p.cat.toLowerCase()} />
                <button onClick={() => toggleFav(p.id)} style={{ position:'absolute', top:8, right:8, width:30, height:30, borderRadius:99, background:'rgba(255,255,255,0.92)', border:'none', cursor:'pointer', display:'grid', placeItems:'center', padding:0, color:favs.has(p.id)?C.brand:C.muted }}>
                  <IcHeart s={14} f={favs.has(p.id)}/>
                </button>
                {p.badge && (
                  <div style={{ position:'absolute', top:8, left:8 }}>
                    <Badge label={p.badge} color={p.badge==='Bio' ? C.ok : C.brand}/>
                  </div>
                )}
              </div>
              <div style={{ padding:'9px 11px 12px' }}>
                <div style={{ fontSize:9.5, color:C.muted2, marginBottom:2, textTransform:'uppercase', letterSpacing:'0.06em' }}>{p.brand}</div>
                <div style={{ fontSize:12.5, color:C.ink, fontWeight:500, lineHeight:1.25, marginBottom:7, letterSpacing:'-0.01em' }}>{p.name}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:13, fontFamily:FONTS.mono, fontWeight:500 }}>{fmt(p.price)}</div>
                  <button style={{ width:26, height:26, borderRadius:99, background:C.ink, color:'#fff', border:'none', display:'grid', placeItems:'center', padding:0, cursor:'pointer' }}>
                    <IcPlus s={13}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Best-sellers */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 16px 8px' }}>
          <div style={{ fontSize:16, fontWeight:500, letterSpacing:'-0.02em', color:C.ink }}>Best-sellers</div>
          <button style={{ fontSize:12, color:C.accent, background:'none', border:'none', cursor:'pointer', fontFamily:FONTS.sans }}>Voir tout →</button>
        </div>

        {/* Featured row card */}
        <div style={{ margin:'0 16px 8px', display:'flex', borderRadius:14, border:`1px solid ${C.border}`, overflow:'hidden', cursor:'pointer' }}>
          <div style={{ width:96, flexShrink:0 }}>
            <PImg swatch={PRODUCTS[2].swatch} h={96} label="textile"/>
          </div>
          <div style={{ flex:1, padding:'12px 14px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:9.5, color:C.muted2, marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{PRODUCTS[2].brand}</div>
              <div style={{ fontSize:13, fontFamily:FONTS.serif, fontStyle:'italic', color:C.ink, lineHeight:1.2, marginBottom:5 }}>{PRODUCTS[2].name}</div>
              <Stars n={4} count="124" size={11}/>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
              <div style={{ fontSize:14, fontFamily:FONTS.mono, fontWeight:500, color:C.ink }}>{fmt(PRODUCTS[2].price)}</div>
              <button style={{ padding:'6px 13px', borderRadius:99, background:C.ink, color:'#fff', border:'none', fontSize:11.5, fontWeight:600, fontFamily:FONTS.sans, cursor:'pointer' }}>+ Panier</button>
            </div>
          </div>
        </div>

        {/* Spacer for fourth product teaser */}
        <div style={{ display:'flex', gap:10, padding:'0 16px 20px', overflowX:'auto', scrollbarWidth:'none' }}>
          {PRODUCTS.slice(3,6).map(p => (
            <div key={p.id} style={{ width:150, flexShrink:0, borderRadius:12, border:`1px solid ${C.border}`, overflow:'hidden', cursor:'pointer' }}>
              <PImg swatch={p.swatch} h={100} label={p.cat.toLowerCase()}/>
              <div style={{ padding:'8px 10px 10px' }}>
                <div style={{ fontSize:12, fontWeight:500, color:C.ink, marginBottom:3, letterSpacing:'-0.01em', lineHeight:1.25 }}>{p.name}</div>
                <div style={{ fontSize:12, fontFamily:FONTS.mono, color:C.muted }}>{fmt(p.price)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="home" cartCount={3}/>
    </div>
  );
}

// ── CatalogueScreen ───────────────────────────────────────
function CatalogueScreen() {
  const [favs, setFavs] = useState(new Set());
  const [filter, setFilter] = useState('Tous');
  const filters = ['Tous', 'Textile', 'Cosmétique', 'Alimentation', 'Accessoires'];

  const toggleFav = id => setFavs(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const visible = filter === 'Tous' ? PRODUCTS : PRODUCTS.filter(p => p.cat === filter);

  return (
    <div style={{ fontFamily:FONTS.sans, WebkitFontSmoothing:'antialiased', minHeight:874, display:'flex', flexDirection:'column', background:C.white }}>
      <div style={{ flex:1, overflowY:'auto', paddingTop:62 }}>

        {/* Nav header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:`1px solid ${C.border}` }}>
          <button style={{ color:C.ink, padding:4, background:'none', border:'none', cursor:'pointer', display:'grid', placeItems:'center' }}><IcBack s={22}/></button>
          <div style={{ flex:1, fontSize:17, fontWeight:500, letterSpacing:'-0.025em', color:C.ink }}>Catalogue</div>
          <button style={{ color:C.muted, padding:4, background:'none', border:'none', cursor:'pointer', display:'grid', placeItems:'center' }}><IcFilter s={20}/></button>
        </div>

        {/* Search bar */}
        <div style={{ padding:'12px 16px 8px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, background:C.bg, border:`1px solid ${C.border}`, borderRadius:12, padding:'10px 14px' }}>
            <IcSearch s={17}/>
            <span style={{ fontSize:13.5, color:C.muted2, flex:1 }}>Rechercher un produit…</span>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ overflowX:'auto', scrollbarWidth:'none' }}>
          <div style={{ display:'flex', gap:7, padding:'4px 16px 12px', width:'max-content' }}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding:'6px 13px', borderRadius:99, border:`1.5px solid ${filter===f ? C.ink : C.border}`, background:filter===f ? C.ink : 'transparent', color:filter===f ? '#fff' : C.muted, fontSize:12, fontWeight:500, fontFamily:FONTS.sans, cursor:'pointer', whiteSpace:'nowrap' }}>
                {f}
                {f==='Tous' && <span style={{ marginLeft:5, opacity:0.7 }}>{PRODUCTS.length}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Results label */}
        <div style={{ padding:'0 16px 10px', fontSize:12, color:C.muted2 }}>
          {visible.length} produit{visible.length > 1 ? 's' : ''}
        </div>

        {/* Product grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'0 16px 20px' }}>
          {visible.map(p => (
            <div key={p.id} style={{ background:C.white, borderRadius:14, overflow:'hidden', border:`1px solid ${C.border}`, cursor:'pointer' }}>
              <div style={{ position:'relative' }}>
                <PImg swatch={p.swatch} h={130} label={p.cat.toLowerCase()}/>
                <button onClick={() => toggleFav(p.id)} style={{ position:'absolute', top:8, right:8, width:30, height:30, borderRadius:99, background:'rgba(255,255,255,0.92)', border:'none', cursor:'pointer', display:'grid', placeItems:'center', padding:0 }}>
                  <IcHeart s={14} f={favs.has(p.id)}/>
                </button>
                {p.badge && (
                  <div style={{ position:'absolute', top:8, left:8 }}>
                    <Badge label={p.badge} color={p.badge==='Bio' ? C.ok : C.brand}/>
                  </div>
                )}
              </div>
              <div style={{ padding:'9px 11px 12px' }}>
                <div style={{ fontSize:9.5, color:C.muted2, marginBottom:2, textTransform:'uppercase', letterSpacing:'0.06em' }}>{p.brand}</div>
                <div style={{ fontSize:12.5, color:C.ink, fontWeight:500, lineHeight:1.25, marginBottom:6, letterSpacing:'-0.01em' }}>{p.name}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:13, fontFamily:FONTS.mono, fontWeight:500 }}>{fmt(p.price)}</div>
                  <button style={{ width:26, height:26, borderRadius:99, background:C.ink, color:'#fff', border:'none', display:'grid', placeItems:'center', padding:0, cursor:'pointer' }}>
                    <IcPlus s={13}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="catalogue" cartCount={3}/>
    </div>
  );
}

Object.assign(window, { HomeScreen, CatalogueScreen });
