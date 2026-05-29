// store-screens-3.jsx — CheckoutScreen + ConfirmScreen
const { useState } = React;

// ── CheckoutScreen ────────────────────────────────────────
function CheckoutScreen() {
  const [payMethod, setPayMethod] = useState('wave');
  const [step] = useState(2); // 1=Adresse, 2=Paiement, 3=Confirmation

  const methods = [
    {
      id: 'wave',
      label: 'Wave',
      sub: 'Paiement mobile instantané',
      icon: () => (
        <div style={{ width:38, height:38, borderRadius:10, background:'#1A73E8', display:'grid', placeItems:'center' }}>
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none"><path d="M2 8 C2 8 5 2 11 2 C17 2 20 8 20 8 C20 8 17 14 11 14 C5 14 2 8 2 8Z" fill="white" opacity="0.9"/><circle cx="11" cy="8" r="3.5" fill="#1A73E8"/></svg>
        </div>
      ),
    },
    {
      id: 'orange',
      label: 'Orange Money',
      sub: 'Transfert Orange Mobile',
      icon: () => (
        <div style={{ width:38, height:38, borderRadius:10, background:'#FF6600', display:'grid', placeItems:'center' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" fill="white" opacity="0.9"/><circle cx="10" cy="10" r="4" fill="#FF6600"/></svg>
        </div>
      ),
    },
    {
      id: 'card',
      label: 'Carte bancaire',
      sub: 'Visa · Mastercard · CB',
      icon: () => (
        <div style={{ width:38, height:38, borderRadius:10, background:C.ink, display:'grid', placeItems:'center' }}>
          <IcCard s={20}/>
        </div>
      ),
    },
  ];

  const Steps = () => (
    <div style={{ display:'flex', alignItems:'center', padding:'14px 20px', gap:0 }}>
      {['Adresse', 'Paiement', 'Confirmation'].map((s, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <React.Fragment key={s}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:26, height:26, borderRadius:99, display:'grid', placeItems:'center', background: done ? C.ok : active ? C.ink : C.bg, border:`1.5px solid ${done ? C.ok : active ? C.ink : C.border}`, color: (done || active) ? '#fff' : C.muted2, fontSize:11, fontWeight:600, fontFamily:FONTS.mono }}>
                {done ? <IcCheck s={12} col="#fff"/> : n}
              </div>
              <span style={{ fontSize:10, fontWeight: active ? 600 : 400, color: active ? C.ink : C.muted2, letterSpacing:'-0.01em' }}>{s}</span>
            </div>
            {i < 2 && <div style={{ flex:1, height:1.5, background: done ? C.ok : C.border, margin:'0 6px', marginBottom:16 }}/>}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <div style={{ fontFamily:FONTS.sans, WebkitFontSmoothing:'antialiased', minHeight:874, display:'flex', flexDirection:'column', background:C.white }}>
      <div style={{ flex:1, overflowY:'auto', paddingTop:62 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px 0', borderBottom:`1px solid ${C.border}` }}>
          <button style={{ color:C.ink, padding:4, background:'none', border:'none', cursor:'pointer', display:'grid', placeItems:'center' }}><IcBack s={22}/></button>
          <div style={{ flex:1, fontSize:17, fontWeight:500, letterSpacing:'-0.025em', color:C.ink }}>Paiement</div>
        </div>

        <Steps />

        {/* Delivery address — summary */}
        <div style={{ margin:'0 16px 16px', padding:'14px 16px', background:C.bg, borderRadius:14, border:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:2 }}>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:C.muted2, marginBottom:6 }}>Adresse de livraison</div>
            <button style={{ fontSize:11.5, color:C.accent, background:'none', border:'none', cursor:'pointer', fontFamily:FONTS.sans, fontWeight:500 }}>Modifier</button>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <IcLoc s={16}/>
            <div>
              <div style={{ fontSize:13.5, fontWeight:500, color:C.ink, marginBottom:2 }}>Amina Kouyaté</div>
              <div style={{ fontSize:12.5, color:C.muted, lineHeight:1.4 }}>14 Rue des Artisans, Plateau<br/>Dakar 10700, Sénégal</div>
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <div style={{ padding:'0 16px' }}>
          <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:C.muted2, marginBottom:10 }}>Mode de paiement</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {methods.map(m => {
              const on = payMethod === m.id;
              return (
                <button key={m.id} onClick={() => setPayMethod(m.id)} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', borderRadius:14, border:`1.5px solid ${on ? C.ink : C.border}`, background: on ? C.bgElev : 'transparent', cursor:'pointer', textAlign:'left', transition:'all .15s ease' }}>
                  <m.icon />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:500, color:C.ink, marginBottom:1 }}>{m.label}</div>
                    <div style={{ fontSize:11.5, color:C.muted }}>{m.sub}</div>
                  </div>
                  {/* Radio */}
                  <div style={{ width:18, height:18, borderRadius:99, border:`1.5px solid ${on ? C.ink : C.border}`, display:'grid', placeItems:'center', flexShrink:0 }}>
                    {on && <div style={{ width:9, height:9, borderRadius:99, background:C.ink }}/>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wave phone input (conditional) */}
        {payMethod === 'wave' && (
          <div style={{ padding:'14px 16px 0' }}>
            <div style={{ display:'flex', gap:10, padding:'11px 14px', border:`1px solid ${C.border}`, borderRadius:12, background:C.bg, alignItems:'center' }}>
              <IcPhone s={17}/>
              <input defaultValue="+221 77 123 45 67" style={{ flex:1, border:'none', background:'transparent', fontSize:13.5, fontFamily:FONTS.sans, color:C.ink, outline:'none' }}/>
            </div>
          </div>
        )}

        {/* Card form (conditional) */}
        {payMethod === 'card' && (
          <div style={{ padding:'14px 16px 0', display:'flex', flexDirection:'column', gap:8 }}>
            <input placeholder="Numéro de carte" style={{ padding:'11px 14px', border:`1px solid ${C.border}`, borderRadius:12, fontSize:13.5, fontFamily:FONTS.sans, color:C.ink, background:C.bg, outline:'none' }}/>
            <div style={{ display:'flex', gap:8 }}>
              <input placeholder="MM / AA" style={{ flex:1, padding:'11px 14px', border:`1px solid ${C.border}`, borderRadius:12, fontSize:13.5, fontFamily:FONTS.sans, color:C.ink, background:C.bg, outline:'none' }}/>
              <input placeholder="CVC" style={{ width:80, padding:'11px 14px', border:`1px solid ${C.border}`, borderRadius:12, fontSize:13.5, fontFamily:FONTS.sans, color:C.ink, background:C.bg, outline:'none' }}/>
            </div>
          </div>
        )}

        {/* Order mini summary */}
        <div style={{ margin:'16px 16px 0', padding:'12px 14px', background:C.bg, borderRadius:12, border:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <span style={{ fontSize:12, color:C.muted }}>3 articles</span>
            <span style={{ fontSize:12, fontFamily:FONTS.mono, color:C.muted }}>35&thinsp;500&thinsp;F</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <span style={{ fontSize:12, color:C.muted }}>Livraison</span>
            <span style={{ fontSize:12, color:C.ok, fontWeight:500 }}>Offerte 🎁</span>
          </div>
          <div style={{ height:1, background:C.border, margin:'8px 0' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:14, fontWeight:500, color:C.ink }}>Total</span>
            <span style={{ fontSize:15, fontFamily:FONTS.mono, fontWeight:500, color:C.ink }}>35&thinsp;500&thinsp;F</span>
          </div>
        </div>

        <div style={{ height:16 }}/>
      </div>

      {/* Confirm CTA */}
      <div style={{ padding:'12px 16px 28px', background:'rgba(255,255,255,0.96)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderTop:`1px solid ${C.border}` }}>
        <button style={{ width:'100%', height:50, borderRadius:14, background:C.ink, color:'#fff', border:'none', fontSize:15, fontWeight:600, fontFamily:FONTS.sans, cursor:'pointer', letterSpacing:'-0.01em', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          Confirmer · 35&thinsp;500&thinsp;F →
        </button>
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:5, marginTop:9, fontSize:11, color:C.muted2 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Paiement 100% sécurisé · SSL
        </div>
      </div>
    </div>
  );
}

// ── ConfirmScreen ─────────────────────────────────────────
function ConfirmScreen() {
  const items = [
    { ...PRODUCTS[0], qty:1 },
    { ...PRODUCTS[1], qty:2 },
    { ...PRODUCTS[3], qty:1 },
  ];

  return (
    <div style={{ fontFamily:FONTS.sans, WebkitFontSmoothing:'antialiased', minHeight:874, display:'flex', flexDirection:'column', background:C.white }}>
      <div style={{ flex:1, overflowY:'auto', paddingTop:62 }}>

        {/* Success zone */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'36px 24px 28px', textAlign:'center' }}>
          {/* Big check circle */}
          <div style={{ width:80, height:80, borderRadius:99, background:C.okBg, display:'grid', placeItems:'center', marginBottom:20 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.ok} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <div style={{ fontFamily:FONTS.serif, fontStyle:'italic', fontSize:28, color:C.ink, lineHeight:1.1, marginBottom:6, letterSpacing:'-0.01em' }}>
            Commande confirmée !
          </div>
          <div style={{ fontSize:14, color:C.muted, marginBottom:4 }}>Order confirmed!</div>
          <div style={{ fontSize:12.5, fontFamily:FONTS.mono, color:C.muted2, marginBottom:24, background:C.bg, padding:'5px 12px', borderRadius:99, border:`1px solid ${C.border}` }}>
            #MDL-2847 · 28 mai 2026
          </div>

          {/* Delivery estimate banner */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:C.bg, borderRadius:12, border:`1px solid ${C.border}`, width:'100%', marginBottom:24 }}>
            <IcTruck s={18}/>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:13, fontWeight:500, color:C.ink }}>Livraison estimée</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>Mercredi 2 – Vendredi 4 juin · Dakar</div>
            </div>
          </div>
        </div>

        {/* Order items summary */}
        <div style={{ margin:'0 16px', padding:'14px 16px', background:C.bg, borderRadius:14, border:`1px solid ${C.border}`, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:C.muted2, marginBottom:10 }}>Récapitulatif</div>
          {items.map((it, i) => (
            <div key={it.id} style={{ display:'flex', alignItems:'center', gap:10, paddingTop: i>0 ? 10 : 0, borderTop: i>0 ? `1px solid ${C.border}` : 'none', marginTop: i>0 ? 10 : 0 }}>
              <div style={{ width:40, flexShrink:0 }}>
                <PImg swatch={it.swatch} h={40} radius={8} label=""/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:500, color:C.ink, lineHeight:1.2 }}>{it.name}</div>
                <div style={{ fontSize:11, color:C.muted2, marginTop:2 }}>×{it.qty}</div>
              </div>
              <div style={{ fontSize:13, fontFamily:FONTS.mono, fontWeight:500, color:C.ink, flexShrink:0 }}>{fmt(it.price * it.qty)}</div>
            </div>
          ))}
          <div style={{ height:1, background:C.border, margin:'12px 0 10px' }}/>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:13.5, fontWeight:500, color:C.ink }}>Total payé</span>
            <span style={{ fontSize:14, fontFamily:FONTS.mono, fontWeight:500, color:C.ink }}>35&thinsp;500&thinsp;F</span>
          </div>
        </div>

        {/* Confetti visual accent */}
        <div style={{ textAlign:'center', fontSize:28, letterSpacing:8, padding:'8px 0 4px' }}>🎁 🪡 🌍</div>

        <div style={{ height:16 }}/>
      </div>

      {/* CTAs */}
      <div style={{ padding:'12px 16px 28px', background:'rgba(255,255,255,0.96)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderTop:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:10 }}>
        <button style={{ width:'100%', height:50, borderRadius:14, background:C.ink, color:'#fff', border:'none', fontSize:15, fontWeight:600, fontFamily:FONTS.sans, cursor:'pointer', letterSpacing:'-0.01em', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <IcTruck s={18}/> Suivre ma commande
        </button>
        <button style={{ width:'100%', height:44, borderRadius:14, background:'transparent', color:C.ink, border:`1.5px solid ${C.border}`, fontSize:14, fontWeight:500, fontFamily:FONTS.sans, cursor:'pointer', letterSpacing:'-0.01em' }}>
          Continuer mes achats
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { CheckoutScreen, ConfirmScreen });
