/**
 * PriceMovements.tsx — Sezione oscillazioni di prezzo Cardmarket
 *
 * Mostra due pannelli affiancati:
 * - Sinistra: le carte con i maggiori rialzi di prezzo (ultimi 7 giorni)
 * - Destra: le carte con i maggiori ribassi
 *
 * Ogni riga mostra: miniatura carta, nome, set/rarità, sparkline (mini-grafico),
 * e la variazione percentuale colorata (verde = su, rosso = giù).
 *
 * Come TrendingDecks, è un Server Component (nessun 'use client').
 * I dati statici andranno sostituiti da chiamate API a Cardmarket.
 */
import type { PriceMovement } from '@aether-deck/types';

// ── Dati mock ────────────────────────────────────────────────────────────────
// Omit<PriceMovement, 'previousPrice' | 'currentPrice'> crea un nuovo tipo
// che è identico a PriceMovement MA senza i campi previousPrice e currentPrice.
// Questo permette di scrivere dati mock più concisi (quei valori non sono
// necessari per la visualizzazione, ci interessa solo changePercent).

/** Carte con rialzo di prezzo (direction: 'up') */
const RISING: Omit<PriceMovement, 'previousPrice' | 'currentPrice'>[] = [
  {
    card: { id: '1', name: 'Jace, the Mind Sculptor', set: 'WWK', setName: 'Worldwake', rarity: 'mythic', colors: ['U'] },
    changePercent: 18.4,
    direction: 'up',
    // sparkline: 7 punti Y per il mini-grafico (andamento settimanale).
    // Per i rialzi: i valori SCENDONO (da sinistra a destra) perché nel
    // sistema di coordinate SVG Y=0 è in ALTO — valori bassi = posizione alta = prezzo alto.
    sparkline: [22, 18, 20, 14, 10, 7, 3],
  },
  {
    card: { id: '2', name: 'Ragavan, Nimble Pilferer', set: 'MH2', setName: 'Modern Horizons 2', rarity: 'mythic', colors: ['R'] },
    changePercent: 12.1,
    direction: 'up',
    sparkline: [24, 22, 19, 16, 12, 9, 5],
  },
  {
    card: { id: '3', name: 'Force of Will', set: 'ALL', setName: 'Alliances', rarity: 'uncommon', colors: ['U'] },
    changePercent: 9.7,
    direction: 'up',
    sparkline: [26, 23, 20, 17, 13, 10, 7],
  },
  {
    card: { id: '4', name: 'Tarmogoyf', set: 'FUT', setName: 'Future Sight', rarity: 'rare', colors: ['G'] },
    changePercent: 7.3,
    direction: 'up',
    sparkline: [25, 24, 21, 18, 14, 11, 8],
  },
];

/** Carte con ribasso di prezzo (direction: 'down') */
const FALLING: Omit<PriceMovement, 'previousPrice' | 'currentPrice'>[] = [
  {
    card: { id: '5', name: 'The One Ring', set: 'LTR', setName: 'Lord of the Rings', rarity: 'mythic', colors: ['C'] },
    changePercent: -15.2,
    direction: 'down',
    // Per i ribassi: i valori SALGONO nel sistema SVG → la linea va verso il basso visivamente
    sparkline: [4, 7, 10, 13, 17, 21, 25],
  },
  {
    card: { id: '6', name: 'Sheoldred, Whispering One', set: 'ONE', setName: 'Phyrexia: All Will Be One', rarity: 'mythic', colors: ['B'] },
    changePercent: -11.8,
    direction: 'down',
    sparkline: [3, 6, 9, 14, 18, 22, 26],
  },
  {
    card: { id: '7', name: 'Grief', set: 'MH2', setName: 'Modern Horizons 2', rarity: 'mythic', colors: ['B'] },
    changePercent: -8.4,
    direction: 'down',
    sparkline: [5, 8, 11, 15, 19, 22, 26],
  },
  {
    card: { id: '8', name: 'Yorion, Sky Nomad', set: 'IKO', setName: 'Ikoria', rarity: 'rare', colors: ['W', 'U'] },
    changePercent: -6.1,
    direction: 'down',
    sparkline: [4, 7, 12, 15, 19, 23, 26],
  },
];


/**
 * PriceMovements — componente principale della sezione
 *
 * Usa un layout a due colonne (1fr 1fr) per affiancare i pannelli.
 * La classe "reveal" + transitionDelay crea un effetto di apparizione
 * leggermente in ritardo rispetto alla sezione TrendingDecks sopra.
 */
export function PriceMovements() {
  return (
    <section className="reveal" style={{ paddingBottom: 80, transitionDelay: '.1s' }}>
      {/* Intestazione sezione */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: '.7rem', fontWeight: 600, letterSpacing: '.14em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>
          📊 Aggiornato oggi · fonte Cardmarket
        </div>
        <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700 }}>
          Oscillazioni di <em style={{ fontStyle: 'normal', color: 'var(--gold-light)' }}>prezzo</em> notevoli
        </h2>
      </div>

      {/* Griglia a due colonne per i pannelli rialzi/ribassi */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <PricePanel title="Maggiori rialzi" icon="📈" subtitle="ultimi 7 giorni" items={RISING}  />
        <PricePanel title="Maggiori ribassi" icon="📉" subtitle="ultimi 7 giorni" items={FALLING} />
      </div>
    </section>
  );
}

/**
 * PricePanel — pannello con lista di carte e variazioni di prezzo
 *
 * Il tipo dei items è derivato da RISING (typeof RISING) per non doverlo
 * ridefinire — TypeScript inferisce il tipo corretto automaticamente.
 * Questo è un pattern comune quando il tipo è complesso e già implicito.
 */
function PricePanel({
  title, icon, subtitle, items,
}: {
  title: string;
  icon: string;
  subtitle: string;
  items: typeof RISING;  // Stesso tipo dell'array RISING (e FALLING, che è identico)
}) {
  return (
    <div className="glass" style={{ borderRadius: 20, overflow: 'hidden' }}>
      {/* Header del pannello con icona, titolo e sottotitolo */}
      <div style={{ padding: '15px 20px 12px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.05rem' }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '.88rem', fontWeight: 700 }}>{title}</span>
        {/* marginLeft: auto spinge il sottotitolo a destra (flexbox trick) */}
        <span style={{ fontSize: '.7rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>{subtitle}</span>
      </div>

      {/* Lista delle righe carta */}
      <div>
        {items.map(item => (
          <PriceRow key={item.card.id} item={item} />
        ))}
      </div>
    </div>
  );
}

/**
 * PriceRow — singola riga con dati di una carta
 *
 * Calcola dinamicamente il colore e i punti della sparkline in base a direction.
 * typeof RISING[0] → tipo del primo elemento dell'array RISING
 * (equivale a Omit<PriceMovement, 'previousPrice' | 'currentPrice'>)
 */
function PriceRow({ item }: { item: typeof RISING[0] }) {
  // Determina colore e direzione in base a direction
  const isUp  = item.direction === 'up';
  const color = isUp ? '#4ade80' : '#f87171'; // Verde per rialzo, rosso per ribasso

  /**
   * Genera i punti SVG per la polyline della sparkline.
   * sparkline è un array di 7 valori Y (uno per giorno).
   * Per l'asse X: ogni punto è distanziato di 10 unità (i * 10).
   * Il viewBox SVG è "0 0 50 28" → larghezza 50, altezza 28.
   *
   * map() trasforma ogni [valore, indice] in una stringa "x,y".
   * join(' ') unisce tutto con spazi: "0,22 10,18 20,20 ..."
   * Questo è il formato richiesto dall'attributo SVG `points`.
   */
  const points = item.sparkline.map((y, i) => `${i * 10},${y}`).join(' ');

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 20px', cursor: 'pointer', transition: 'background .2s' }}
      // Effetti hover gestiti inline (come in DeckCard)
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      {/*
        Miniatura carta (thumbnail):
        In produzione qui ci sarà un <Image> da Scryfall API.
        Per ora è un placeholder con emoji e sfondo colorato.
        flexShrink: 0 → non si restringe mai, mantiene sempre 34x48px.
      */}
      <div style={{ width: 34, height: 48, borderRadius: 5, flexShrink: 0, background: 'var(--glass-bg)', border: '1px solid rgba(255,255,255,0.09)', display: 'grid', placeItems: 'center', fontSize: '1.05rem' }}>
        {isUp ? '✨' : '⬇️'}
      </div>

      {/*
        Informazioni carta: nome e set/rarità.
        minWidth: 0 è necessario con flex: 1 per far funzionare text-overflow: ellipsis.
        Senza minWidth: 0, un elemento flex non si restringe mai sotto la sua dimensione naturale.
      */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Nome carta: troncato con "..." se troppo lungo */}
        <div style={{ fontSize: '.83rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.card.name}
        </div>
        {/* Set + rarità capitalizzata */}
        <div style={{ fontSize: '.7rem', color: 'var(--text-dim)' }}>
          {item.card.setName} · {item.card.rarity.charAt(0).toUpperCase() + item.card.rarity.slice(1)}
          {/* charAt(0).toUpperCase() + slice(1) → capitalizza la prima lettera */}
        </div>
      </div>

      {/*
        Sparkline — mini-grafico SVG a linee.
        viewBox="0 0 50 28": sistema di coordinate interno (50 wide, 28 tall).
        La larghezza e altezza reali sono 58x26px (specificati con width/height).
        SVG scala automaticamente dal viewBox alle dimensioni reali.

        <polyline> disegna una linea spezzata passando per tutti i punti.
        fill="none" → solo il contorno, nessun riempimento.
        stroke={color} → verde o rosso in base alla direzione.
        strokeLinecap="round" → estremità arrotondate per un look più morbido.
      */}
      <svg width="58" height="26" viewBox="0 0 50 28" style={{ flexShrink: 0 }}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/*
        Variazione percentuale.
        toFixed(1) → arrotonda a 1 decimale (es. 18.4, non 18.3999...)
        isUp ? '+' : '' → aggiunge il "+" solo per i rialzi (i ribassi hanno già il "-")
      */}
      <span style={{ fontSize: '.88rem', fontWeight: 700, color, flexShrink: 0 }}>
        {isUp ? '+' : ''}{item.changePercent.toFixed(1)}%
      </span>
    </div>
  );
}
