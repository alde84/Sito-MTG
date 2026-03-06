'use client';

/**
 * CardModal.tsx — Popup dettagli carta, responsive mobile
 *
 * Desktop: due colonne affiancate (immagine | dettagli)
 * Mobile:  colonna singola verticale (immagine → dettagli → versioni)
 *
 * Il cambio layout avviene tramite CSS media query iniettata con <style>.
 */

import { useEffect, useState } from 'react';
import { ScryfallCard } from '../CardsPageInner';

interface CardModalProps {
  card: ScryfallCard;
  onClose: () => void;
}

const RARITY_LABEL: Record<string, string> = {
  common: 'Comune', uncommon: 'Non comune', rare: 'Rara', mythic: 'Mitica', special: 'Speciale',
};
const RARITY_COLOR: Record<string, string> = {
  common: '#aaa', uncommon: '#8ab4f8', rare: '#f0c040', mythic: '#f87c7c', special: '#c9a84c',
};

const CONDITIONS = [
  { key: 'nm', label: 'NM', labelFull: 'Near Mint', mult: 1.00 },
  { key: 'ex', label: 'EX', labelFull: 'Excellent', mult: 0.80 },
  { key: 'gd', label: 'GD', labelFull: 'Good', mult: 0.64 },
  { key: 'lp', label: 'LP', labelFull: 'Light Played', mult: 0.50 },
  { key: 'pl', label: 'PL', labelFull: 'Played', mult: 0.32 },
  { key: 'poor', label: 'Poor', labelFull: 'Poor', mult: 0.20 },
];

function getCardImage(card: ScryfallCard, size: 'normal' | 'large' = 'large'): string | null {
  if (card.image_uris) return card.image_uris[size];
  if (card.card_faces?.[0]?.image_uris) return card.card_faces[0].image_uris[size];
  return null;
}

function formatMana(cost?: string): string {
  if (!cost) return '—';
  return cost.replace(/\{([^}]+)\}/g, '$1 ').trim();
}

function getLegalities(legalities: Record<string, string>) {
  const relevant = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander', 'pauper'];
  return relevant.map(f => ({ format: f, status: legalities[f] ?? 'not_legal' }));
}

interface Ruling {
  source: string;
  published_at: string;
  comment: string;
}

export function CardModal({ card, onClose }: CardModalProps) {
  const [selectedPrint, setSelectedPrint] = useState<ScryfallCard>(card);
  const [prints, setPrints] = useState<ScryfallCard[]>([card]);
  const [loadingPrints, setLoadingPrints] = useState(true);
  const [rulings, setRulings] = useState<Ruling[]>([]);
  const [loadingRulings, setLoadingRulings] = useState(false);
  const [rulingsOpen, setRulingsOpen] = useState(false);

  const image = getCardImage(selectedPrint, 'large');
  const rarityColor = RARITY_COLOR[selectedPrint.rarity] ?? '#aaa';
  const legalities = getLegalities(selectedPrint.legalities ?? {});

  // Chiude con Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  // Blocca scroll body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Carica tutte le stampe
  useEffect(() => {
    const fetchPrints = async () => {
      setLoadingPrints(true);
      try {
        const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(`!"${card.name}"`)}&unique=prints&order=released`);
        const json = await res.json();
        if (json.data?.length > 0) {
          setPrints(json.data);
          const match = json.data.find((p: ScryfallCard) => p.id === card.id);
          setSelectedPrint(match ?? json.data[0]);
        }
      } catch { /* fallback alla carta originale */ }
      finally { setLoadingPrints(false); }
    };
    fetchPrints();
  }, [card.id, card.name]);

  // Carica ruling
  const handleOpenRulings = async () => {
    setRulingsOpen(r => !r);
    if (rulings.length > 0) return;
    setLoadingRulings(true);
    try {
      const res = await fetch(`https://api.scryfall.com/cards/${card.id}/rulings`);
      const json = await res.json();
      setRulings(json.data ?? []);
    } catch { setRulings([]); }
    finally { setLoadingRulings(false); }
  };

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(4,6,10,0.88)', backdropFilter: 'blur(8px)', animation: 'fadeIn .2s ease both' }} />

      {/* Wrapper centrato */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', pointerEvents: 'none' }}>

        {/* Pannello modale */}
        <div
          className="card-modal-panel"
          style={{
            pointerEvents: 'all',
            width: '100%', maxWidth: 960,
            maxHeight: 'calc(100vh - 24px)',
            borderRadius: 20, overflow: 'hidden',
            display: 'flex', flexDirection: 'row', // override a column su mobile via CSS
            background: 'rgba(14,16,22,0.97)',
            border: '1px solid rgba(255,255,255,0.13)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
            animation: 'slideUp .3s cubic-bezier(.22,1,.36,1) both',
          }}
        >

          {/* ── COLONNA SINISTRA: immagine + regolamento ── */}
          <div
            className="card-modal-left"
            style={{
              flexShrink: 0, width: 270,
              background: 'rgba(0,0,0,0.3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '20px 18px',
              overflowY: 'auto', scrollbarWidth: 'thin',
            }}
          >
            {/* Immagine */}
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={selectedPrint.name} style={{ width: '100%', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '488/680', background: 'rgba(255,255,255,0.04)', borderRadius: 10, display: 'grid', placeItems: 'center', fontSize: '3rem', flexShrink: 0 }}>🃏</div>
            )}

            {/* Bottone regolamento */}
            <button
              onClick={handleOpenRulings}
              style={{
                marginTop: 12, width: '100%', padding: '10px 12px', borderRadius: 10,
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
              <span style={{ display: 'inline-block', transform: rulingsOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
            </button>

            {/* Ruling espandibili */}
            {rulingsOpen && (
              <div style={{ marginTop: 10, width: '100%', flexShrink: 0 }}>
                {loadingRulings ? (
                  <div style={{ textAlign: 'center', padding: '14px 0', fontSize: '.78rem', color: 'var(--text-dim)' }}>Caricamento…</div>
                ) : rulings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '14px 0', fontSize: '.78rem', color: 'var(--text-dim)' }}>Nessuna ruling disponibile.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rulings.map((r, i) => (
                      <div key={i} style={{ padding: '9px 11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9 }}>
                        <div style={{ fontSize: '.62rem', color: 'var(--gold)', marginBottom: 4, fontWeight: 600 }}>
                          {new Date(r.published_at).toLocaleDateString('it-IT', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '.75rem', lineHeight: 1.6, color: 'var(--text-dim)' }}>{r.comment}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── COLONNA DESTRA: dettagli + versioni ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', scrollbarWidth: 'thin', minWidth: 0 }}>

            {/* Chiudi */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
              <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.11)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--text-dim)', fontSize: '.95rem' }}>✕</button>
            </div>

            {/* Nome */}
            <h2 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(1rem, 3vw, 1.4rem)', fontWeight: 700, marginBottom: 3, lineHeight: 1.2 }}>
              {selectedPrint.name}
            </h2>

            {/* Tipo */}
            <div style={{ fontSize: '.8rem', color: 'var(--text-dim)', marginBottom: 12 }}>{selectedPrint.type_line}</div>

            {/* Costo mana + rarità + set */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
              {selectedPrint.mana_cost && (
                <span style={{ padding: '3px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', fontSize: '.78rem', fontWeight: 600, fontFamily: 'monospace' }}>
                  {formatMana(selectedPrint.mana_cost)}
                </span>
              )}
              <span style={{ padding: '3px 10px', borderRadius: 7, fontSize: '.74rem', fontWeight: 600, background: `${rarityColor}1a`, border: `1px solid ${rarityColor}66`, color: rarityColor }}>
                {RARITY_LABEL[selectedPrint.rarity] ?? selectedPrint.rarity}
              </span>
              <span style={{ fontSize: '.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {selectedPrint.set.toUpperCase()} · {selectedPrint.set_name}
              </span>
            </div>

            {/* Oracle text */}
            {selectedPrint.oracle_text && (
              <div style={{ marginBottom: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 11, border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '.82rem', lineHeight: 1.65, color: 'var(--text)', whiteSpace: 'pre-line' }}>{selectedPrint.oracle_text}</div>
              </div>
            )}

            {/* Flavor text */}
            {selectedPrint.flavor_text && (
              <div style={{ marginBottom: 12, padding: '9px 14px', borderLeft: `2px solid ${rarityColor}55` }}>
                <div style={{ fontSize: '.76rem', lineHeight: 1.6, color: 'var(--text-dim)', fontStyle: 'italic' }}>{selectedPrint.flavor_text}</div>
              </div>
            )}

            {/* Forza/Costituzione */}
            {(selectedPrint.power || selectedPrint.toughness) && (
              <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '.74rem', color: 'var(--text-dim)' }}>Forza/Cost.:</span>
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '.92rem', fontWeight: 700 }}>{selectedPrint.power}/{selectedPrint.toughness}</span>
              </div>
            )}

            {/* Fedeltà */}
            {selectedPrint.loyalty && (
              <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '.74rem', color: 'var(--text-dim)' }}>Fedeltà:</span>
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '.92rem', fontWeight: 700, color: 'var(--gold)' }}>{selectedPrint.loyalty}</span>
              </div>
            )}

            {/* Artista */}
            {selectedPrint.artist && (
              <div style={{ fontSize: '.74rem', color: 'var(--text-dim)', marginBottom: 12 }}>🎨 {selectedPrint.artist}</div>
            )}

            {/* Separatore */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />

            {/* Legalità */}
            <SectionTitle>Legalità</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
              {legalities.map(({ format, status }) => <LegalityBadge key={format} format={format} status={status} />)}
            </div>

            {/* Separatore */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />

            {/* Versioni */}
            <SectionTitle>
              Tutte le versioni
              {!loadingPrints && <span style={{ fontWeight: 400, color: 'var(--text-dim)', fontSize: '.72rem', marginLeft: 6 }}>({prints.length})</span>}
            </SectionTitle>

            {loadingPrints ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: 68, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
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
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '9px 11px', borderRadius: 11, cursor: 'pointer',
                        background: isSelected ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSelected ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.07)'}`,
                        transition: 'all .15s',
                      }}
                    >
                      {/* Thumbnail */}
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt={print.set_name} style={{ width: 40, borderRadius: 4, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }} />
                      ) : (
                        <div style={{ width: 40, aspectRatio: '488/680', background: 'rgba(255,255,255,0.06)', borderRadius: 4, flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: '.7rem' }}>🃏</div>
                      )}

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Set + rarità */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.05em', color: 'var(--text)', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }}>
                            {print.set.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '.68rem', fontWeight: 600, color: RARITY_COLOR[print.rarity] ?? '#aaa' }}>
                            {RARITY_LABEL[print.rarity] ?? print.rarity}
                          </span>
                          <span style={{ fontSize: '.65rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                            {print.set_name}
                          </span>
                        </div>

                        {/* Prezzi normale */}
                        {priceNm && priceNm !== '0.00' && (
                          <div style={{ marginBottom: 3 }}>
                            <div style={{ fontSize: '.6rem', color: 'var(--text-dim)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>Normale</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                              {CONDITIONS.map(({ key, label, labelFull, mult }) => (
                                <div key={key} title={`${labelFull}: € ${(parseFloat(priceNm) * mult).toFixed(2)}`}
                                  style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '.65rem' }}>
                                  <span style={{ color: 'var(--text-dim)', marginRight: 2 }}>{label}</span>
                                  <span style={{ color: 'var(--gold)', fontWeight: 600 }}>€{(parseFloat(priceNm) * mult).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Prezzi foil */}
                        {priceFoil && priceFoil !== '0.00' && (
                          <div>
                            <div style={{ fontSize: '.6rem', color: 'var(--text-dim)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>✨ Foil</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                              {CONDITIONS.map(({ key, label, labelFull, mult }) => (
                                <div key={key} title={`${labelFull} foil: € ${(parseFloat(priceFoil) * mult).toFixed(2)}`}
                                  style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', fontSize: '.65rem' }}>
                                  <span style={{ color: 'var(--text-dim)', marginRight: 2 }}>{label}</span>
                                  <span style={{ color: 'var(--gold)', fontWeight: 600 }}>€{(parseFloat(priceFoil) * mult).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Nessun prezzo */}
                        {(!priceNm || priceNm === '0.00') && (!priceFoil || priceFoil === '0.00') && (
                          <span style={{ fontSize: '.7rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>Prezzo non disponibile</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stili responsive */}
      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes shimmer { from { background-position:200% 0 } to { background-position:-200% 0 } }

        /* Mobile: layout a colonna singola */
        @media (max-width: 640px) {
          .card-modal-panel {
            flex-direction: column !important;
            max-height: calc(100vh - 24px) !important;
            border-radius: 16px !important;
            overflow-y: auto !important;
          }
          .card-modal-left {
            width: 100% !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            padding: 16px !important;
            gap: 14px;
            overflow-y: visible !important;
          }
          /* Su mobile l'immagine è più piccola a sinistra */
          .card-modal-left img:first-child,
          .card-modal-left > div:first-child {
            width: 120px !important;
            flex-shrink: 0;
          }
          /* Le ruling e il bottone regolamento si espandono nella colonna */
          .card-modal-left > button,
          .card-modal-left > div:not(:first-child) {
            flex: 1;
          }
        }
      `}</style>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
      {children}
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}

function LegalityBadge({ format, status }: { format: string; status: string }) {
  const isLegal = status === 'legal';
  const isBanned = status === 'banned';
  const isRestricted = status === 'restricted';
  const color = isLegal ? '#4ade80' : isBanned ? '#f87171' : isRestricted ? '#f0c040' : 'rgba(255,255,255,0.25)';
  const bg = isLegal ? 'rgba(74,222,128,0.1)' : isBanned ? 'rgba(248,113,113,0.1)' : isRestricted ? 'rgba(240,192,64,0.1)' : 'rgba(255,255,255,0.04)';
  const FORMAT_LABELS: Record<string, string> = { standard: 'STD', pioneer: 'PIO', modern: 'MOD', legacy: 'LEG', vintage: 'VIN', commander: 'CMD', pauper: 'PAU' };
  return (
    <div title={`${format}: ${status}`} style={{ padding: '3px 9px', borderRadius: 6, background: bg, border: `1px solid ${color}44`, fontSize: '.68rem', fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '.05em' }}>
      {FORMAT_LABELS[format] ?? format}
    </div>
  );
}
