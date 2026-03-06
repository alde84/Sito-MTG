'use client';

/**
 * CardModal.tsx — Popup dettagli carta
 *
 * STRUTTURA DEL POPUP (due colonne):
 *
 * Colonna sinistra (fissa):
 * - Immagine grande della versione selezionata
 * - Bottone "Regolamento" che espande/chiude le ruling Scryfall
 * - Sezione ruling espandibile
 *
 * Colonna destra (scrollabile):
 * - Nome, tipo, costo mana, rarità
 * - Testo oracle e flavor text
 * - Forza/Costituzione o Fedeltà
 * - Legalità per formato
 * - Artista
 * - Lista versioni: ogni versione ha thumbnail + acronimo set + prezzi per condizione
 *
 * FLUSSO DATI:
 * 1. Al mount, carica tutte le stampe della carta tramite l'API Scryfall
 *    (endpoint /cards/search?q=!"nome" unique=prints)
 * 2. Carica le ruling tramite l'endpoint /cards/:id/rulings
 * 3. La versione selezionata (selectedPrint) parte dalla carta cliccata nella griglia
 */

import { useEffect, useState } from 'react';
import { ScryfallCard } from '../page';

interface CardModalProps {
  card: ScryfallCard;   // Carta cliccata nella griglia (versione di partenza)
  onClose: () => void;
}

// ── Costanti ──────────────────────────────────────────────────────────────────

const RARITY_LABEL: Record<string, string> = {
  common: 'Comune', uncommon: 'Non comune', rare: 'Rara', mythic: 'Mitica', special: 'Speciale',
};
const RARITY_COLOR: Record<string, string> = {
  common: '#aaa', uncommon: '#8ab4f8', rare: '#f0c040', mythic: '#f87c7c', special: '#c9a84c',
};

/**
 * Condizioni di conservazione Cardmarket con i loro moltiplicatori di prezzo.
 * I prezzi delle condizioni diverse da NM sono stime basate su moltiplicatori
 * standard usati nel mercato dell'usato MTG.
 */
const CONDITIONS = [
  { key: 'nm', label: 'NM', labelFull: 'Near Mint', mult: 1.00 },
  { key: 'ex', label: 'EX', labelFull: 'Excellent', mult: 0.80 },
  { key: 'gd', label: 'GD', labelFull: 'Good', mult: 0.64 },
  { key: 'lp', label: 'LP', labelFull: 'Light Played', mult: 0.50 },
  { key: 'pl', label: 'PL', labelFull: 'Played', mult: 0.32 },
  { key: 'poor', label: 'Poor', labelFull: 'Poor', mult: 0.20 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * getCardImage — URL immagine, gestisce carte double-faced
 * Le carte trasformabili non hanno image_uris al livello radice
 * ma le hanno dentro card_faces[0].
 */
function getCardImage(card: ScryfallCard, size: 'normal' | 'large' = 'large'): string | null {
  if (card.image_uris) return card.image_uris[size];
  if (card.card_faces?.[0]?.image_uris) return card.card_faces[0].image_uris[size];
  return null;
}

/**
 * formatMana — converte "{2}{U}{U}" in testo leggibile "2 U U"
 * In produzione si userebbero le icone SVG di Scryfall.
 */
function formatMana(cost?: string): string {
  if (!cost) return '—';
  return cost.replace(/\{([^}]+)\}/g, '$1 ').trim();
}

/**
 * getLegalities — restituisce la legalità nei formati principali
 */
function getLegalities(legalities: Record<string, string>) {
  const relevant = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander', 'pauper'];
  return relevant.map(f => ({ format: f, status: legalities[f] ?? 'not_legal' }));
}

// ── Tipo Ruling ───────────────────────────────────────────────────────────────

/**
 * Ruling — una singola regola/errata ufficiale della carta
 * Restituita dall'endpoint Scryfall /cards/:id/rulings
 */
interface Ruling {
  source: string;        // "wotc" (Wizards) o "scryfall"
  published_at: string;  // Data nel formato "YYYY-MM-DD"
  comment: string;       // Testo della ruling
}

// ── Componente principale ─────────────────────────────────────────────────────

export function CardModal({ card, onClose }: CardModalProps) {
  // Versione attualmente visualizzata nel popup (inizia con la carta cliccata)
  const [selectedPrint, setSelectedPrint] = useState<ScryfallCard>(card);

  // Tutte le stampe/versioni della carta
  const [prints, setPrints] = useState<ScryfallCard[]>([card]);
  const [loadingPrints, setLoadingPrints] = useState(true);

  // Ruling (regolamento ufficiale) della carta
  const [rulings, setRulings] = useState<Ruling[]>([]);
  const [loadingRulings, setLoadingRulings] = useState(false);
  const [rulingsOpen, setRulingsOpen] = useState(false); // Sezione espansa/chiusa

  const image = getCardImage(selectedPrint, 'large');
  const rarityColor = RARITY_COLOR[selectedPrint.rarity] ?? '#aaa';
  const legalities = getLegalities(selectedPrint.legalities ?? {});

  // ── Side effects ────────────────────────────────────────────────────────────

  // Chiude il modale con il tasto Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Blocca lo scroll della pagina mentre il modale è aperto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  /**
   * Carica tutte le stampe della carta al mount.
   *
   * Usa la sintassi !"nome esatto" di Scryfall che cerca corrispondenze esatte
   * del nome (le virgolette doppie con ! evitano falsi positivi su carte
   * con nomi simili). unique=prints → una riga per ogni stampa diversa.
   * order=released → ordina dalla più recente alla più vecchia.
   */
  useEffect(() => {
    const fetchPrints = async () => {
      setLoadingPrints(true);
      try {
        const q = `!"${card.name}"`;
        const res = await fetch(
          `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&unique=prints&order=released`
        );
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setPrints(json.data);
          // Imposta come selezionata la stampa corrispondente a quella cliccata
          // (se presente nel risultato), altrimenti la prima (più recente)
          const match = json.data.find((p: ScryfallCard) => p.id === card.id);
          setSelectedPrint(match ?? json.data[0]);
        }
      } catch { /* Mantieni la carta originale come fallback */ }
      finally { setLoadingPrints(false); }
    };
    fetchPrints();
  }, [card.id, card.name]);

  /**
   * Carica le ruling quando l'utente apre la sezione regolamento.
   * Le ruling sono legate alla carta (non alla stampa specifica),
   * quindi usiamo sempre l'ID della carta originale.
   * Carica solo una volta (se rulings è già popolato non ricarica).
   */
  const handleOpenRulings = async () => {
    setRulingsOpen(r => !r);
    if (rulings.length > 0) return; // Già caricate, non rifare la chiamata
    setLoadingRulings(true);
    try {
      const res = await fetch(`https://api.scryfall.com/cards/${card.id}/rulings`);
      const json = await res.json();
      setRulings(json.data ?? []);
    } catch { setRulings([]); }
    finally { setLoadingRulings(false); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Overlay scuro con blur */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 600,
          background: 'rgba(4,6,10,0.88)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn .2s ease both',
        }}
      />

      {/* Contenitore centrato */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px',
          pointerEvents: 'none',
        }}
      >
        {/*
          Pannello principale del modale.
          maxWidth: 960 → più largo del precedente per ospitare la lista versioni.
          Le due colonne sono affiancate (flexDirection: row).
          Il popup stesso non scrolla: è la colonna destra che ha overflowY: auto.
        */}
        <div
          style={{
            pointerEvents: 'all',
            width: '100%', maxWidth: 960,
            maxHeight: 'calc(100vh - 48px)',
            borderRadius: 24, overflow: 'hidden',
            display: 'flex', flexDirection: 'row',
            background: 'rgba(14,16,22,0.97)',
            border: '1px solid rgba(255,255,255,0.13)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
            animation: 'slideUp .3s cubic-bezier(.22,1,.36,1) both',
          }}
        >

          {/* ══════════════════════════════════════════════════
              COLONNA SINISTRA — immagine + regolamento
              Larghezza fissa, non scrolla. Il bottone regolamento
              e la sezione ruling stanno sotto l'immagine.
          ══════════════════════════════════════════════════ */}
          <div
            style={{
              flexShrink: 0, width: 280,
              background: 'rgba(0,0,0,0.3)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 20px 20px',
              overflowY: 'auto',  // scrolla se le ruling sono molto lunghe
              scrollbarWidth: 'thin',
            }}
          >
            {/* Immagine della versione selezionata */}
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={selectedPrint.name}
                style={{ width: '100%', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: '100%', aspectRatio: '488/680', background: 'rgba(255,255,255,0.04)', borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: '3rem', flexShrink: 0 }}>
                🃏
              </div>
            )}

            {/* Bottone Regolamento */}
            <button
              onClick={handleOpenRulings}
              style={{
                marginTop: 14, width: '100%',
                padding: '10px 14px', borderRadius: 11,
                background: rulingsOpen ? 'rgba(201,168,76,0.14)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${rulingsOpen ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.11)'}`,
                color: rulingsOpen ? 'var(--gold-light)' : 'var(--text-dim)',
                cursor: 'pointer', fontSize: '.8rem', fontWeight: 600,
                fontFamily: 'var(--font-outfit)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all .2s', flexShrink: 0,
              }}
            >
              📜 Regolamento
              {/* Freccia che ruota in base allo stato aperto/chiuso */}
              <span style={{ display: 'inline-block', transform: rulingsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>
                ▾
              </span>
            </button>

            {/* Sezione ruling espandibile */}
            {rulingsOpen && (
              <div style={{ marginTop: 12, width: '100%', flexShrink: 0 }}>
                {loadingRulings ? (
                  <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '.78rem', color: 'var(--text-dim)' }}>
                    Caricamento…
                  </div>
                ) : rulings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '.78rem', color: 'var(--text-dim)' }}>
                    Nessuna ruling disponibile.
                  </div>
                ) : (
                  // Lista delle ruling
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rulings.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '10px 12px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: 10,
                        }}
                      >
                        {/* Data della ruling */}
                        <div style={{ fontSize: '.62rem', color: 'var(--gold)', marginBottom: 5, fontWeight: 600, letterSpacing: '.04em' }}>
                          {new Date(r.published_at).toLocaleDateString('it-IT', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        {/* Testo della ruling */}
                        <div style={{ fontSize: '.75rem', lineHeight: 1.6, color: 'var(--text-dim)' }}>
                          {r.comment}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════
              COLONNA DESTRA — dettagli + versioni
              flex: 1 → occupa tutto lo spazio rimanente.
              overflowY: auto → scrolla internamente.
          ══════════════════════════════════════════════════ */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', scrollbarWidth: 'thin' }}>

            {/* Bottone chiudi nell'angolo in alto a destra */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.11)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--text-dim)', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            {/* Nome carta */}
            <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontWeight: 700, marginBottom: 4, lineHeight: 1.2 }}>
              {selectedPrint.name}
            </h2>

            {/* Tipo */}
            <div style={{ fontSize: '.82rem', color: 'var(--text-dim)', marginBottom: 14 }}>
              {selectedPrint.type_line}
            </div>

            {/* Costo mana + rarità + set */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {selectedPrint.mana_cost && (
                <span style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', fontSize: '.8rem', fontWeight: 600, fontFamily: 'monospace' }}>
                  {formatMana(selectedPrint.mana_cost)}
                </span>
              )}
              <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: '.78rem', fontWeight: 600, background: `${rarityColor}1a`, border: `1px solid ${rarityColor}66`, color: rarityColor }}>
                {RARITY_LABEL[selectedPrint.rarity] ?? selectedPrint.rarity}
              </span>
              <span style={{ fontSize: '.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                {selectedPrint.set_name} · {selectedPrint.set.toUpperCase()}
              </span>
            </div>

            {/* Testo oracle */}
            {selectedPrint.oracle_text && (
              <div style={{ marginBottom: 14, padding: '13px 15px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '.83rem', lineHeight: 1.65, color: 'var(--text)', whiteSpace: 'pre-line' }}>
                  {selectedPrint.oracle_text}
                </div>
              </div>
            )}

            {/* Flavor text */}
            {selectedPrint.flavor_text && (
              <div style={{ marginBottom: 14, padding: '10px 15px', borderLeft: `2px solid ${rarityColor}55` }}>
                <div style={{ fontSize: '.78rem', lineHeight: 1.6, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  {selectedPrint.flavor_text}
                </div>
              </div>
            )}

            {/* Forza / Costituzione */}
            {(selectedPrint.power || selectedPrint.toughness) && (
              <div style={{ marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '.75rem', color: 'var(--text-dim)' }}>Forza/Cost.:</span>
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '.95rem', fontWeight: 700 }}>
                  {selectedPrint.power}/{selectedPrint.toughness}
                </span>
              </div>
            )}

            {/* Fedeltà (Planeswalker) */}
            {selectedPrint.loyalty && (
              <div style={{ marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '.75rem', color: 'var(--text-dim)' }}>Fedeltà:</span>
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '.95rem', fontWeight: 700, color: 'var(--gold)' }}>
                  {selectedPrint.loyalty}
                </span>
              </div>
            )}

            {/* Artista */}
            {selectedPrint.artist && (
              <div style={{ fontSize: '.75rem', color: 'var(--text-dim)', marginBottom: 14 }}>
                🎨 {selectedPrint.artist}
              </div>
            )}

            {/* ── Legalità ── */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '14px 0' }} />
            <div style={{ marginBottom: 20 }}>
              <SectionTitle>Legalità</SectionTitle>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {legalities.map(({ format, status }) => (
                  <LegalityBadge key={format} format={format} status={status} />
                ))}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════
                VERSIONI / STAMPE
                Lista verticale: ogni riga è una versione della carta.
                Ogni riga ha: thumbnail | acronimo set + rarità | prezzi per condizione.
                Cliccando una riga si aggiorna la versione mostrata nel popup.
            ══════════════════════════════════════════════════ */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '14px 0' }} />
            <div style={{ marginBottom: 8 }}>
              <SectionTitle>
                Tutte le versioni
                {!loadingPrints && (
                  <span style={{ fontWeight: 400, color: 'var(--text-dim)', fontSize: '.75rem', marginLeft: 8 }}>
                    ({prints.length})
                  </span>
                )}
              </SectionTitle>

              {loadingPrints ? (
                // Skeleton mentre caricano le versioni
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: 72, borderRadius: 12, background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {prints.map(print => {
                    const isSelected = print.id === selectedPrint.id;
                    const thumb = getCardImage(print, 'normal');
                    const priceNm = print.prices?.eur;
                    const priceFoil = print.prices?.eur_foil;

                    return (
                      <div
                        key={print.id}
                        onClick={() => setSelectedPrint(print)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                          // Evidenzia la versione selezionata con bordo dorato
                          background: isSelected ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.07)'}`,
                          transition: 'all .18s',
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                        }}
                      >
                        {/* Thumbnail della versione */}
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={print.set_name}
                            style={{ width: 44, borderRadius: 5, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                          />
                        ) : (
                          <div style={{ width: 44, aspectRatio: '488/680', background: 'rgba(255,255,255,0.06)', borderRadius: 5, flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: '.8rem' }}>
                            🃏
                          </div>
                        )}

                        {/* Info set + prezzi */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Riga: acronimo set + rarità + anno */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                            {/* Acronimo set evidenziato */}
                            <span style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.06em', color: 'var(--text)', background: 'rgba(255,255,255,0.08)', padding: '2px 7px', borderRadius: 5 }}>
                              {print.set.toUpperCase()}
                            </span>
                            {/* Rarità con colore */}
                            <span style={{ fontSize: '.7rem', fontWeight: 600, color: RARITY_COLOR[print.rarity] ?? '#aaa' }}>
                              {RARITY_LABEL[print.rarity] ?? print.rarity}
                            </span>
                            {/* Nome completo del set */}
                            <span style={{ fontSize: '.68rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                              {print.set_name}
                            </span>
                          </div>

                          {/* Prezzi per condizione (normale) */}
                          {priceNm && priceNm !== '0.00' && (
                            <div style={{ marginBottom: 4 }}>
                              <div style={{ fontSize: '.62rem', color: 'var(--text-dim)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                                Normale
                              </div>
                              {/* Griglia condizioni */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {CONDITIONS.map(({ key, label, labelFull, mult }) => {
                                  const price = parseFloat(priceNm) * mult;
                                  return (
                                    <div
                                      key={key}
                                      title={`${labelFull}: € ${price.toFixed(2)}`}
                                      style={{
                                        padding: '2px 7px', borderRadius: 5,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        fontSize: '.68rem',
                                      }}
                                    >
                                      {/* Sigla condizione */}
                                      <span style={{ color: 'var(--text-dim)', marginRight: 3 }}>{label}</span>
                                      {/* Prezzo calcolato */}
                                      <span style={{ color: 'var(--gold)', fontWeight: 600 }}>€{price.toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Prezzi per condizione (foil) */}
                          {priceFoil && priceFoil !== '0.00' && (
                            <div>
                              <div style={{ fontSize: '.62rem', color: 'var(--text-dim)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                                ✨ Foil
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {CONDITIONS.map(({ key, label, labelFull, mult }) => {
                                  const price = parseFloat(priceFoil) * mult;
                                  return (
                                    <div
                                      key={key}
                                      title={`${labelFull} foil: € ${price.toFixed(2)}`}
                                      style={{
                                        padding: '2px 7px', borderRadius: 5,
                                        // Le foil hanno un bordo leggermente dorato per distinguerle
                                        background: 'rgba(201,168,76,0.06)',
                                        border: '1px solid rgba(201,168,76,0.15)',
                                        fontSize: '.68rem',
                                      }}
                                    >
                                      <span style={{ color: 'var(--text-dim)', marginRight: 3 }}>{label}</span>
                                      <span style={{ color: 'var(--gold)', fontWeight: 600 }}>€{price.toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Nessun prezzo disponibile */}
                          {(!priceNm || priceNm === '0.00') && (!priceFoil || priceFoil === '0.00') && (
                            <span style={{ fontSize: '.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                              Prezzo non disponibile
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>{/* fine colonna destra */}
        </div>
      </div>

      {/* Animazioni CSS */}
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
      `}</style>
    </>
  );
}

// ── Componenti interni ────────────────────────────────────────────────────────

/**
 * SectionTitle — titolo di sezione con linea decorativa
 */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      {children}
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}

/**
 * LegalityBadge — badge colorato per la legalità in un formato
 * Verde = legale, rosso = bannato, giallo = restricted, grigio = non legale
 */
function LegalityBadge({ format, status }: { format: string; status: string }) {
  const isLegal = status === 'legal';
  const isBanned = status === 'banned';
  const isRestricted = status === 'restricted';

  const color = isLegal ? '#4ade80' : isBanned ? '#f87171' : isRestricted ? '#f0c040' : 'rgba(255,255,255,0.25)';
  const bg = isLegal ? 'rgba(74,222,128,0.1)' : isBanned ? 'rgba(248,113,113,0.1)' : isRestricted ? 'rgba(240,192,64,0.1)' : 'rgba(255,255,255,0.04)';

  const FORMAT_LABELS: Record<string, string> = {
    standard: 'STD', pioneer: 'PIO', modern: 'MOD', legacy: 'LEG',
    vintage: 'VIN', commander: 'CMD', pauper: 'PAU',
  };

  return (
    <div
      title={`${format}: ${status}`}
      style={{ padding: '4px 10px', borderRadius: 6, background: bg, border: `1px solid ${color}44`, fontSize: '.7rem', fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '.05em' }}
    >
      {FORMAT_LABELS[format] ?? format}
    </div>
  );
}
