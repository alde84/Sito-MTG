'use client';

import { ScryfallCard } from '../page';

interface CardGridProps {
  cards: ScryfallCard[];
  loading: boolean;
  error: string | null;
  onCardClick: (card: ScryfallCard) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
}

// Colori rarity → colore testo e sfondo badge
const RARITY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  common:   { color: '#aaa',    bg: 'rgba(170,170,170,0.12)', label: 'C' },
  uncommon: { color: '#8ab4f8', bg: 'rgba(138,180,248,0.12)', label: 'U' },
  rare:     { color: '#f0c040', bg: 'rgba(240,192,64,0.12)',  label: 'R' },
  mythic:   { color: '#f87c7c', bg: 'rgba(248,124,124,0.12)', label: 'M' },
  special:  { color: '#c9a84c', bg: 'rgba(201,168,76,0.12)',  label: 'S' },
};

/**
 * getCardImage — restituisce l'URL dell'immagine della carta
 *
 * Le carte double-faced (es. werewolf, trasformazioni) non hanno image_uris
 * al livello radice ma le hanno dentro card_faces[0].
 */
function getCardImage(card: ScryfallCard, size: 'small' | 'normal' = 'normal'): string | null {
  if (card.image_uris) return card.image_uris[size];
  if (card.card_faces?.[0]?.image_uris) return card.card_faces[0].image_uris[size];
  return null;
}

/**
 * formatPrice — formatta il prezzo in € con 2 decimali
 */
function formatPrice(price?: string): string | null {
  if (!price || price === '0.00') return null;
  return `€ ${parseFloat(price).toFixed(2)}`;
}

export function CardGrid({ cards, loading, error, onCardClick, onLoadMore, hasMore, loadingMore }: CardGridProps) {

  // ── Stato di caricamento iniziale ──
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // ── Stato di errore ──
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🔍</div>
        <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1.1rem', color: 'var(--gold-light)', marginBottom: 8 }}>
          Nessun risultato
        </div>
        <div style={{ fontSize: '.85rem', color: 'var(--text-dim)', maxWidth: 360, margin: '0 auto' }}>
          {error}
        </div>
      </div>
    );
  }

  // ── Nessuna carta ──
  if (cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✨</div>
        <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1.1rem', color: 'var(--gold-light)' }}>
          Inizia una ricerca
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Griglia carte */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {cards.map(card => (
          <CardTile key={card.id} card={card} onClick={() => onCardClick(card)} />
        ))}
      </div>

      {/* Bottone "Carica altri" */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            style={{
              padding: '12px 32px', borderRadius: 14, fontSize: '.88rem', fontWeight: 600,
              background: loadingMore ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, var(--gold), #a07020)',
              color: loadingMore ? 'var(--text-dim)' : '#1a0f00',
              border: 'none', cursor: loadingMore ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-outfit)', transition: 'all .2s',
              boxShadow: loadingMore ? 'none' : '0 2px 14px rgba(201,168,76,0.3)',
            }}
          >
            {loadingMore ? 'Caricamento…' : 'Carica altri risultati'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * CardTile — singola carta nella griglia
 *
 * Mostra l'immagine della carta con un overlay che appare all'hover
 * contenente il nome, set/rarità e prezzo.
 */
function CardTile({ card, onClick }: { card: ScryfallCard; onClick: () => void }) {
  const image = getCardImage(card, 'normal');
  const price = formatPrice(card.prices?.eur);
  const rarity = RARITY_STYLE[card.rarity] ?? RARITY_STYLE.common;

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        position: 'relative',
        transition: 'transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px) scale(1.02)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 48px rgba(0,0,0,0.7)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Immagine carta */}
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={card.name}
          style={{ width: '100%', display: 'block', aspectRatio: '488/680' }}
          loading="lazy"
        />
      ) : (
        // Placeholder se l'immagine non è disponibile
        <div style={{ width: '100%', aspectRatio: '488/680', background: 'rgba(255,255,255,0.04)', display: 'grid', placeItems: 'center', fontSize: '2rem' }}>
          🃏
        </div>
      )}

      {/* Info sotto l'immagine */}
      <div style={{ padding: '10px 12px 12px' }}>
        {/* Nome carta */}
        <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {card.name}
        </div>

        {/* Riga set + rarità + prezzo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {/* Badge rarità */}
            <span style={{ fontSize: '.62rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: rarity.bg, color: rarity.color }}>
              {rarity.label}
            </span>
            {/* Codice set */}
            <span style={{ fontSize: '.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              {card.set}
            </span>
          </div>

          {/* Prezzo Cardmarket */}
          {price && (
            <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--gold)' }}>
              {price}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonCard — placeholder animato durante il caricamento
 * Usa un'animazione shimmer per indicare che il contenuto sta arrivando.
 */
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Placeholder immagine */}
      <div style={{ width: '100%', aspectRatio: '488/680', background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      {/* Placeholder testo */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }} />
        <div style={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.04)', width: '60%' }} />
      </div>
      <style>{`@keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }`}</style>
    </div>
  );
}
