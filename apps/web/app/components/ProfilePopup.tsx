/**
 * ProfilePopup.tsx — Popup di login e registrazione
 *
 * Questo componente è un pannello che appare nell'angolo in alto a destra
 * quando l'utente clicca sul bottone profilo nella navbar.
 *
 * Contiene due tab ("Accedi" / "Registrati") che mostrano form diversi.
 * Lo stato di quale tab è attiva è gestito localmente in questo componente,
 * perché non serve condividerlo con altri componenti.
 *
 * La visibilità (aperto/chiuso) è invece controllata dal genitore (Navbar),
 * perché è Navbar a decidere quando mostrarlo.
 */
'use client';

import { useState } from 'react';

/**
 * ProfilePopupProps — interfaccia per le props del componente
 */
interface ProfilePopupProps {
  open: boolean;       // true → il popup è visibile; false → nascosto
  onClose: () => void; // Callback per chiudere il popup (passata dal genitore)
}

/**
 * Tab — tipo union per le due schede disponibili
 * TypeScript con "union types": Tab può essere SOLO 'login' o 'register',
 * non qualsiasi stringa. Questo previene errori di battitura.
 */
type Tab = 'login' | 'register';

/**
 * ProfilePopup — il componente principale
 *
 * L'apertura/chiusura avviene tramite CSS (opacity + transform + pointer-events)
 * invece di montare/smontare il componente dal DOM.
 * Questo approccio permette animazioni fluide: il componente è sempre
 * nel DOM ma visivamente appare/scompare con una transizione CSS.
 */
export function ProfilePopup({ open, onClose }: ProfilePopupProps) {

  // Tiene traccia di quale tab è selezionata. Inizia con 'login'.
  const [tab, setTab] = useState<Tab>('login');

  return (
    <div
      className="glass"  // Classe CSS globale: effetto vetro smerigliato (definito in globals.css)
      style={{
        position: 'fixed',
        // Posizionato subito sotto la navbar (altezza navbar + 8px di margine)
        top: 'calc(var(--navbar-h) + 8px)',
        right: 24,   // Allineato al bordo destro con 24px di margine
        width: 295,
        borderRadius: 20,
        padding: 26,
        zIndex: 300, // Sopra la navbar (z-index 200) e l'overlay (z-index 250)

        // Animazione apertura/chiusura tramite CSS:
        // Quando open=false: invisibile, spostato in su di 10px e leggermente rimpicciolito
        // Quando open=true: completamente visibile, nella posizione corretta
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.96)',
        // pointer-events: none quando chiuso → i click "passano attraverso" il popup
        pointerEvents: open ? 'all' : 'none',
        transition: 'opacity .28s cubic-bezier(.22,1,.36,1), transform .28s cubic-bezier(.22,1,.36,1)',
      }}
    >
      {/* Titolo e sottotitolo del popup */}
      <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '.95rem', fontWeight: 700, marginBottom: 5, color: 'var(--gold-light)' }}>
        Bentornato su AetherDeck
      </div>
      <div style={{ fontSize: '.74rem', color: 'var(--text-dim)', marginBottom: 20, fontWeight: 300 }}>
        Accedi per gestire mazzi e seguire la community
      </div>

      {/*
        ── Selector tab (Accedi / Registrati) ──
        Due bottoni dentro un contenitore scuro. Il bottone attivo
        ha un background leggero (effetto "tab selezionata").
        Il casting `as Tab[]` serve perché TypeScript di default inferisce
        ['login', 'register'] come string[] anziché Tab[].
      */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 18, background: 'rgba(0,0,0,0.22)', borderRadius: 11, padding: 4 }}>
        {(['login', 'register'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}  // Cambia la tab attiva al click
            style={{
              flex: 1, padding: 7, borderRadius: 8, textAlign: 'center',
              fontSize: '.8rem', fontWeight: 500, cursor: 'pointer',
              transition: 'all .2s', border: 'none', fontFamily: 'var(--font-outfit)',
              // Stile diverso per la tab attiva vs inattiva
              background: tab === t ? 'var(--glass-bg)' : 'none',
              color:      tab === t ? 'var(--text)'     : 'var(--text-dim)',
              boxShadow:  tab === t ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {t === 'login' ? 'Accedi' : 'Registrati'}
          </button>
        ))}
      </div>

      {/*
        Rendering condizionale dei form:
        React mostra UN SOLO pannello alla volta in base alla tab attiva.
        I form non sono controllati (uncontrolled) per semplicità — in produzione
        andrebbero gestiti con useState o una libreria come React Hook Form.
      */}

      {/* Form di login (visibile solo se tab === 'login') */}
      {tab === 'login' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PopupInput type="email"    placeholder="Email" />
          <PopupInput type="password" placeholder="Password" />
          <PopupButton>Accedi →</PopupButton>
          <Divider />
          <OAuthButtons />
        </div>
      )}

      {/* Form di registrazione (visibile solo se tab === 'register') */}
      {tab === 'register' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PopupInput type="text"     placeholder="Username" />
          <PopupInput type="email"    placeholder="Email" />
          <PopupInput type="password" placeholder="Password" />
          <PopupInput type="password" placeholder="Conferma password" />
          <PopupButton>Crea account →</PopupButton>
          <Divider />
          <OAuthButtons />
        </div>
      )}
    </div>
  );
}

// ── Componenti interni (privati, non esportati) ────────────────────────────────

/**
 * PopupInput — campo di testo stilizzato per il popup
 * Riceve type (email, password, text) e placeholder come props.
 * Fattorizzare questo componente evita di ripetere gli stessi inline style
 * per ogni campo del form.
 */
function PopupInput({ type, placeholder }: { type: string; placeholder: string }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid var(--glass-border)',
        borderRadius: 11, padding: '10px 13px',
        fontSize: '.83rem', color: 'var(--text)',
        fontFamily: 'var(--font-outfit)', outline: 'none',
      }}
    />
  );
}

/**
 * PopupButton — bottone principale dorato del popup
 * Accetta children (il testo del bottone) come prop.
 * React.ReactNode è il tipo per qualsiasi contenuto JSX/testo.
 */
function PopupButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      style={{
        padding: 11, borderRadius: 11, fontSize: '.86rem', fontWeight: 600,
        background: 'linear-gradient(135deg, var(--gold), #a07020)',
        color: '#1a0f00', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-outfit)',
        boxShadow: '0 2px 14px rgba(201,168,76,0.28)', marginTop: 2,
      }}
    >
      {children}
    </button>
  );
}

/**
 * Divider — separatore orizzontale con testo "oppure" al centro
 * Usato tra il form principale e i bottoni OAuth.
 * La linea è creata con un div assoluto (top 50%), il testo sta sopra con z-index 1.
 */
function Divider() {
  return (
    <div style={{ textAlign: 'center', fontSize: '.72rem', color: 'var(--text-dim)', position: 'relative', margin: '2px 0' }}>
      <span style={{ position: 'relative', zIndex: 1, background: 'transparent', padding: '0 8px' }}>oppure</span>
      {/* Linea orizzontale centrata verticalmente rispetto al testo */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--glass-border)' }} />
    </div>
  );
}

/**
 * OAuthButtons — bottoni di autenticazione social (Google, Apple)
 * Generati con .map() dall'array di provider per non ripetere il codice.
 * In produzione, onClick chiamerebbe le API di autenticazione OAuth.
 */
function OAuthButtons() {
  return (
    <div style={{ display: 'flex', gap: 7 }}>
      {[{ icon: '🌐', label: 'Google' }, { icon: '🍎', label: 'Apple' }].map(({ icon, label }) => (
        <button
          key={label}
          style={{
            flex: 1, padding: 9, borderRadius: 10, fontSize: '.75rem', fontWeight: 500,
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)',
            color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'var(--font-outfit)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}
