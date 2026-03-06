/**
 * TrendingDecks.tsx — Sezione "Mazzi più interagiti"
 *
 * Mostra una griglia di card per i mazzi MTG più popolari della settimana.
 * Al momento usa dati statici (mock data): in produzione questi verranno
 * sostituiti da una chiamata API al backend NestJS.
 *
 * Questo componente è un Server Component (nessuna direttiva 'use client'),
 * il che significa che Next.js lo renderizza lato server: è più veloce
 * e migliora la SEO, perché l'HTML arriva già popolato al browser.
 * È possibile perché non usa useState, useEffect o eventi browser.
 */
import type { Deck, ManaColor } from '@aether-deck/types';

// ── Dati mock ────────────────────────────────────────────────────────────────
// Partial<Deck> significa che NON tutti i campi di Deck sono obbligatori.
// Questo è utile per i mock: includiamo solo i campi che il componente usa,
// senza dover compilare tutti i 15+ campi dell'interfaccia Deck completa.
// In produzione, qui ci sarà un fetch('/api/decks?trending=true').
const TRENDING_DECKS: Partial<Deck>[] = [
  {
    id: '1',
    name: 'Izzet Murktide',
    format: 'modern',
    colors: ['U', 'R'],            // Blu + Rosso (Izzet = combinazione Blu/Rosso in MTG)
    authorUsername: 'Lorenzo M.',
    likes: 148,
    comments: 34,
    copies: 62,
    updatedAt: '3 giorni fa',
  },
  {
    id: '2',
    name: 'Domain Ramp',
    format: 'standard',
    colors: ['W', 'U', 'B', 'R', 'G'], // 5 colori = "Domain" (tutti i tipi di terra base)
    authorUsername: 'Sara R.',
    likes: 112,
    comments: 28,
    copies: 49,
    updatedAt: '5 giorni fa',
  },
  {
    id: '3',
    name: 'Atraxa Superfriends',
    format: 'commander',
    colors: ['W', 'U', 'B', 'G'], // 4 colori di Atraxa (tutti tranne Rosso)
    authorUsername: 'Marco V.',
    likes: 98,
    comments: 21,
    copies: 41,
    updatedAt: '6 giorni fa',
  },
];

/** Mappa dei formati verso le loro etichette leggibili */
const FORMAT_LABELS: Record<string, string> = {
  modern: 'Modern', standard: 'Standard', commander: 'Commander',
  pioneer: 'Pioneer', legacy: 'Legacy', vintage: 'Vintage',
};

/**
 * Configurazione visiva per ogni colore MTG.
 * Record<ManaColor, {...}> → TypeScript garantisce che ci siano
 * esattamente le 6 chiavi W, U, B, R, G, C (tutte e nessuna di più).
 */
const COLOR_CONFIG: Record<ManaColor, { bg: string; emoji: string }> = {
  W: { bg: '#e8e0c8', emoji: '⬜' }, // Bianco → crema/oro chiaro
  U: { bg: '#1a4a8a', emoji: '💧' }, // Blu → blu navy
  B: { bg: '#1a1428', emoji: '🖤' }, // Nero → viola scurissimo
  R: { bg: '#8a1a1a', emoji: '🔥' }, // Rosso → bordeaux
  G: { bg: '#1a5a1a', emoji: '🌿' }, // Verde → verde foresta
  C: { bg: '#3a3a3a', emoji: '◇'  }, // Incolore → grigio scuro
};


/**
 * TrendingDecks — componente principale della sezione
 *
 * La sezione ha la classe "reveal" per l'animazione scroll (gestita da useReveal).
 * La griglia usa auto-fill con minmax(300px, 1fr):
 * - Crea quante colonne possono stare con min. 300px ciascuna
 * - 1fr → occupano tutto lo spazio disponibile equamente
 * - Su schermi grandi: 3 colonne; su tablet: 2; su mobile: 1
 */
export function TrendingDecks() {
  return (
    <section className="reveal" style={{ paddingBottom: 80 }}>
      {/* Intestazione sezione */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '.7rem', fontWeight: 600, letterSpacing: '.14em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>
          🔥 Trending questa settimana
        </div>
        <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700 }}>
          {/* <em> stilizzato (fontStyle: normal) per evidenziare la parola chiave con il colore dorato */}
          Mazzi più <em style={{ fontStyle: 'normal', color: 'var(--gold-light)' }}>interagiti</em>
        </h2>
      </div>

      {/* Griglia responsiva delle card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
        {/*
          .map() itera sull'array e genera un DeckCard per ogni mazzo.
          (deck, i) → deck è l'elemento corrente, i è l'indice (0, 1, 2...)
          key={deck.id} → React usa questa chiave per tracciare gli elementi
          nella lista ed ottimizzare i re-render.
          rank={i + 1} → converte l'indice 0-based in ranking 1-based (#1, #2, #3)
        */}
        {TRENDING_DECKS.map((deck, i) => (
          <DeckCard key={deck.id} deck={deck} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}

/**
 * DeckCard — card singola per un mazzo
 *
 * Gli effetti hover (translateY + boxShadow) sono gestiti con onMouseEnter/Leave
 * invece di CSS puro perché gli stili sono inline (non c'è un file CSS).
 * In un progetto con CSS modules o Tailwind sarebbe più elegante farlo in CSS.
 *
 * (e.currentTarget as HTMLElement) → TypeScript richiede il cast esplicito
 * perché EventTarget non ha la proprietà style di default.
 */
function DeckCard({ deck, rank }: { deck: Partial<Deck>; rank: number }) {
  return (
    <div
      className="glass deck-card"
      style={{ borderRadius: 20, padding: 24, cursor: 'pointer', transition: 'transform .25s, box-shadow .25s' }}
      onMouseEnter={e => {
        // Al mouseover: solleva la card verso l'alto e aumenta l'ombra
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 24px 64px rgba(0,0,0,0.65), inset 0 1.5px 0 rgba(255,255,255,0.14)';
      }}
      onMouseLeave={e => {
        // Al mouseout: riporta la card alla posizione originale
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      {/* Riga superiore: badge formato + ranking */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 13 }}>
        {/*
          FORMAT_LABELS[deck.format ?? ''] cerca l'etichetta del formato.
          ?? deck.format → fallback: usa il valore grezzo se non c'è l'etichetta
          ?? '' → evita undefined se format non è impostato
        */}
        <span style={{ fontSize: '.67rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 100, background: 'var(--gold-dim)', border: '1px solid rgba(201,168,76,0.22)', color: 'var(--gold)' }}>
          {FORMAT_LABELS[deck.format ?? ''] ?? deck.format}
        </span>
        <span style={{ fontSize: '.74rem', color: '#f97316' }}>🔥 #{rank}</span>
      </div>

      {/* Nome del mazzo (font serif per stile fantasy) */}
      <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1.03rem', fontWeight: 700, marginBottom: 5 }}>
        {deck.name}
      </div>

      {/* Autore e data di aggiornamento */}
      <div style={{ fontSize: '.76rem', color: 'var(--text-dim)', marginBottom: 13 }}>
        di {deck.authorUsername} · {deck.updatedAt}
      </div>

      {/* Pip dei colori del mazzo */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 15 }}>
        {/*
          (deck.colors ?? []) → usa array vuoto se colors è undefined.
          COLOR_CONFIG[c]?.bg → optional chaining (?.) per evitare errori
          se il colore non è nella mappa (situazione teoricamente impossibile
          grazie a TypeScript, ma gestita per sicurezza).
        */}
        {(deck.colors ?? []).map(c => (
          <div
            key={c}
            style={{
              width: 19, height: 19, borderRadius: '50%',
              background: COLOR_CONFIG[c]?.bg,
              border: '1.5px solid rgba(255,255,255,0.14)',
              display: 'grid', placeItems: 'center', fontSize: '.6rem',
            }}
          >
            {COLOR_CONFIG[c]?.emoji}
          </div>
        ))}
      </div>

      {/* Statistiche di engagement */}
      <div style={{ display: 'flex', gap: 16 }}>
        <Stat icon="❤️" value={deck.likes    ?? 0} />
        <Stat icon="💬" value={deck.comments ?? 0} />
        <Stat icon="🔁" value={deck.copies   ?? 0} />
      </div>
    </div>
  );
}

/**
 * Stat — singola statistica (icona + numero)
 * Componente semplice per evitare di ripetere lo stesso codice tre volte.
 */
function Stat({ icon, value }: { icon: string; value: number }) {
  return (
    <div style={{ fontSize: '.77rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
      {icon} <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{value}</strong>
    </div>
  );
}
