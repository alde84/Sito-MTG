'use client';

import { useState, useRef, useEffect } from 'react';
import type { CardFilters, ManaColor, CardRarity, CardType, Format } from '@aether-deck/types';

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: CardFilters;
  onFiltersChange: (filters: CardFilters) => void;
}

const FORMATS: Format[] = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander', 'pauper', 'explorer', 'historic', 'alchemy', 'brawl', 'oathbreaker'];
const FORMAT_LABELS: Record<Format, string> = { standard: 'Standard', pioneer: 'Pioneer', modern: 'Modern', legacy: 'Legacy', vintage: 'Vintage', commander: 'Commander', pauper: 'Pauper', explorer: 'Explorer', historic: 'Historic', alchemy: 'Alchemy', brawl: 'Brawl', oathbreaker: 'Oathbreaker' };
const CARD_TYPES: CardType[] = ['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Planeswalker', 'Land', 'Battle', 'Tribal'];
const RARITIES: { key: CardRarity; label: string; color: string }[] = [
  { key: 'common', label: 'Common', color: '#aaa' },
  { key: 'uncommon', label: 'Uncommon', color: '#8ab4f8' },
  { key: 'rare', label: 'Rare', color: '#f0c040' },
  { key: 'mythic', label: 'Mythic', color: '#f87c7c' },
  { key: 'special', label: 'Special', color: '#c9a84c' },
];
const COLORS: { key: ManaColor; label: string; emoji: string; bg: string }[] = [
  { key: 'W', label: 'Bianco', emoji: '⬜', bg: 'linear-gradient(135deg,#e8e0c8,#c8b870)' },
  { key: 'U', label: 'Blu', emoji: '💧', bg: 'linear-gradient(135deg,#1a4a8a,#3a7ad0)' },
  { key: 'B', label: 'Nero', emoji: '🖤', bg: 'linear-gradient(135deg,#1a1428,#3a2858)' },
  { key: 'R', label: 'Rosso', emoji: '🔥', bg: 'linear-gradient(135deg,#8a1a1a,#d04030)' },
  { key: 'G', label: 'Verde', emoji: '🌿', bg: 'linear-gradient(135deg,#1a5a1a,#2a9a30)' },
  { key: 'C', label: 'Incolore', emoji: '◇', bg: 'linear-gradient(135deg,#3a3a3a,#6a6a6a)' },
];
const COLOR_MODES = [
  { key: 'exactly', label: 'Esattamente questi colori' },
  { key: 'including', label: 'Includendo questi colori' },
  { key: 'atmost', label: 'Al massimo questi colori' },
  { key: 'commander', label: 'Colori Commander' },
] as const;


export function FilterPanel({ open, onClose, filters, onFiltersChange }: FilterPanelProps) {
  const [colorMode, setColorMode] = useState<'exactly' | 'including' | 'atmost' | 'commander'>('exactly');

  const toggleColor = (color: ManaColor) => {
    const curr = filters.colors ?? [];
    onFiltersChange({ ...filters, colors: curr.includes(color) ? curr.filter(c => c !== color) : [...curr, color] });
  };
  const toggleFormat = (format: Format) => {
    const curr = filters.formats ?? [];
    onFiltersChange({ ...filters, formats: curr.includes(format) ? curr.filter(f => f !== format) : [...curr, format] });
  };
  const toggleRarity = (rarity: CardRarity) => {
    const curr = filters.rarities ?? [];
    onFiltersChange({ ...filters, rarities: curr.includes(rarity) ? curr.filter(r => r !== rarity) : [...curr, rarity] });
  };
  const toggleType = (type: CardType) => {
    const curr = filters.types ?? [];
    onFiltersChange({ ...filters, types: curr.includes(type) ? curr.filter(t => t !== type) : [...curr, type] });
  };
  const resetFilters = () => {
    onFiltersChange({});
    setColorMode('exactly');
  };

  const activeCount = [
    ...(filters.colors ?? []),
    ...(filters.formats ?? []),
    ...(filters.rarities ?? []),
    ...(filters.types ?? []),
  ].length;

  return (
    <>
      {/* Overlay scuro */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(6,8,12,0.75)',
          backdropFilter: 'blur(6px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity .35s',
        }}
      />

      {/*
        Pannello filtri.
        Il background è più opaco rispetto al .glass standard:
        usiamo rgba(18,20,28,0.92) invece di rgba(255,255,255,0.065)
        per garantire una buona leggibilità del testo.
      */}
      <div
        style={{
          position: 'fixed',
          top: 'calc(var(--navbar-h) + 12px)',
          left: '50%',
          transform: open
            ? 'translateX(-50%) translateY(0) scale(1)'
            : 'translateX(-50%) translateY(-18px) scale(0.98)',
          width: 'min(860px, calc(100vw - 48px))',
          maxHeight: 'calc(100vh - var(--navbar-h) - 36px)',
          borderRadius: 24,
          zIndex: 500,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity .35s cubic-bezier(.22,1,.36,1), transform .35s cubic-bezier(.22,1,.36,1)',
          // ── Sfondo più opaco per leggibilità ──
          background: 'rgba(18,20,28,0.92)',
          backdropFilter: 'blur(32px) saturate(165%) brightness(1.07)',
          WebkitBackdropFilter: 'blur(32px) saturate(165%) brightness(1.07)',
          border: '1px solid rgba(255,255,255,0.13)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.7), inset 0 1.5px 0 rgba(255,255,255,0.09)',
        }}
      >
        {/* Header — solo titolo e bottone chiudi, senza il toggle rimosso */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px 18px', borderBottom: '1px solid rgba(255,255,255,0.11)', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold-light)' }}>
            🔍 Filtri avanzati
          </span>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.11)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--text-dim)', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>

        {/* Body scrollabile */}
        <div style={{ overflowY: 'auto', padding: '24px 28px', flex: 1, scrollbarWidth: 'thin' }}>

          {/* COLORI */}
          <Section title="Colori">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {COLORS.map(({ key, label, emoji, bg }) => (
                <button
                  key={key}
                  onClick={() => toggleColor(key)}
                  title={label}
                  style={{
                    width: 42, height: 42, borderRadius: '50%', background: bg, cursor: 'pointer',
                    border: filters.colors?.includes(key) ? '2px solid var(--gold)' : '2px solid transparent',
                    boxShadow: filters.colors?.includes(key) ? '0 0 0 3px rgba(201,168,76,0.25)' : 'none',
                    transform: filters.colors?.includes(key) ? 'scale(1.12)' : 'scale(1)',
                    transition: 'all .2s', display: 'grid', placeItems: 'center', fontSize: '1.1rem',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {COLOR_MODES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setColorMode(key)}
                  style={{
                    padding: '6px 14px', borderRadius: 100, fontSize: '.74rem', fontWeight: 500, cursor: 'pointer',
                    background: colorMode === key ? 'var(--gold-dim)' : 'rgba(255,255,255,0.06)',
                    border: colorMode === key ? '1px solid rgba(201,168,76,0.35)' : '1px solid rgba(255,255,255,0.11)',
                    color: colorMode === key ? 'var(--gold-light)' : 'var(--text-dim)',
                    transition: 'all .2s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Section>

          {/* FORMATO */}
          <Section title="Formato">
            <ChipGrid>
              {FORMATS.map(f => (
                <Chip key={f} active={filters.formats?.includes(f) ?? false} onClick={() => toggleFormat(f)}>
                  {FORMAT_LABELS[f]}
                </Chip>
              ))}
            </ChipGrid>
          </Section>

          {/* RARITÀ */}
          <Section title="Rarità">
            <div style={{ display: 'flex', gap: 8 }}>
              {RARITIES.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => toggleRarity(key)}
                  style={{
                    padding: '8px 18px', borderRadius: 12, fontSize: '.8rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all .2s', color,
                    border: filters.rarities?.includes(key) ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.11)',
                    background: filters.rarities?.includes(key) ? `${color}1a` : 'rgba(255,255,255,0.05)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Section>

          {/* TIPO DI CARTA */}
          <Section title="Tipo di carta">
            <ChipGrid>
              {CARD_TYPES.map(t => (
                <Chip key={t} active={filters.types?.includes(t) ?? false} onClick={() => toggleType(t)}>
                  {t}
                </Chip>
              ))}
            </ChipGrid>
          </Section>

          {/* CMC */}
          <Section title="Valore di mana (CMC)">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <RangeField label="Da" placeholder="0" type="number" value={String(filters.cmcMin ?? '')} onChange={v => onFiltersChange({ ...filters, cmcMin: v ? Number(v) : undefined })} />
              <RangeField label="A" placeholder="20" type="number" value={String(filters.cmcMax ?? '')} onChange={v => onFiltersChange({ ...filters, cmcMax: v ? Number(v) : undefined })} />
            </div>
          </Section>

          {/* FORZA / COSTITUZIONE */}
          <Section title="Forza / Costituzione (creature)">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
              <RangeField label="Forza da" placeholder="0" type="number" value={String(filters.powerMin ?? '')} onChange={v => onFiltersChange({ ...filters, powerMin: v ? Number(v) : undefined })} />
              <RangeField label="Forza a" placeholder="∞" type="number" value={String(filters.powerMax ?? '')} onChange={v => onFiltersChange({ ...filters, powerMax: v ? Number(v) : undefined })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <RangeField label="Costituzione da" placeholder="0" type="number" value={String(filters.toughnessMin ?? '')} onChange={v => onFiltersChange({ ...filters, toughnessMin: v ? Number(v) : undefined })} />
              <RangeField label="Costituzione a" placeholder="∞" type="number" value={String(filters.toughnessMax ?? '')} onChange={v => onFiltersChange({ ...filters, toughnessMax: v ? Number(v) : undefined })} />
            </div>
          </Section>

          {/* TESTO ORACLE */}
          <Section title="Testo oracle">
            <TextField prefix="Contiene" placeholder="es. flying, trample, whenever…" value={filters.oracleText ?? ''} onChange={v => onFiltersChange({ ...filters, oracleText: v })} />
          </Section>

          {/* NOME / SOTTOTIPO */}
          <Section title="Nome e sottotipo">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <RangeField label="Nome carta" placeholder="Nome esatto o parziale" type="text" value={filters.name ?? ''} onChange={v => onFiltersChange({ ...filters, name: v })} />
              <RangeField label="Sottotipo" placeholder="es. Elf, Wizard, Dragon…" type="text" value={filters.subtype ?? ''} onChange={v => onFiltersChange({ ...filters, subtype: v })} />
            </div>
          </Section>

          {/* PREZZO */}
          <Section title="Prezzo (Cardmarket €)">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <RangeField label="Da €" placeholder="0.00" type="number" value={String(filters.priceMin ?? '')} onChange={v => onFiltersChange({ ...filters, priceMin: v ? Number(v) : undefined })} />
              <RangeField label="A €" placeholder="999.00" type="number" value={String(filters.priceMax ?? '')} onChange={v => onFiltersChange({ ...filters, priceMax: v ? Number(v) : undefined })} />
            </div>
          </Section>

          {/* ARTISTA — con autocompletamento Scryfall */}
          <Section title="Artista">
            <ArtistAutocomplete
              value={filters.artist ?? ''}
              onChange={v => onFiltersChange({ ...filters, artist: v })}
            />
          </Section>

        </div>

        {/* Footer */}
        <div style={{ padding: '18px 28px', borderTop: '1px solid rgba(255,255,255,0.11)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 12 }}>
          <span style={{ fontSize: '.78rem', color: 'var(--text-dim)' }}>
            {activeCount > 0 ? `${activeCount} filtro/i attivo/i` : ''}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={resetFilters} style={{ padding: '10px 20px', borderRadius: 12, fontSize: '.83rem', fontWeight: 500, background: 'transparent', border: '1px solid rgba(255,255,255,0.11)', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'var(--font-outfit)' }}>
              Azzera filtri
            </button>
            <button onClick={onClose} style={{ padding: '10px 28px', borderRadius: 12, fontSize: '.86rem', fontWeight: 600, background: 'linear-gradient(135deg, var(--gold), #a07020)', color: '#1a0f00', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-outfit)', boxShadow: '0 2px 14px rgba(201,168,76,0.3)' }}>
              Applica →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


// ══════════════════════════════════════════════════════════════
// ARTISTA AUTOCOMPLETE
// ══════════════════════════════════════════════════════════════

/**
 * ArtistAutocomplete — campo di ricerca artisti con suggerimenti in tempo reale
 *
 * Usa l'API Scryfall `/cards/autocomplete` per cercare artisti mentre l'utente
 * scrive. La chiamata viene ritardata di 300ms (debounce) per non sovraccaricare
 * l'API ad ogni singolo tasto premuto.
 *
 * Flusso:
 * 1. Utente scrive almeno 2 caratteri
 * 2. Dopo 300ms di pausa viene chiamata l'API Scryfall
 * 3. I risultati appaiono in un dropdown sotto il campo
 * 4. L'utente clicca un suggerimento → viene salvato nei filtri
 */
function ArtistAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Lista di suggerimenti restituiti dall'API
  const [suggestions, setSuggestions] = useState<string[]>([]);
  // true mentre la chiamata API è in corso → mostra "Ricerca..."
  const [loading, setLoading] = useState(false);
  // true quando il dropdown è visibile
  const [open, setOpen] = useState(false);
  // Ref per il timer del debounce (conserva il riferimento tra i render)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref al contenitore per rilevare click fuori e chiudere il dropdown
  const wrapperRef = useRef<HTMLDivElement>(null);

  /**
   * Chiude il dropdown quando l'utente clicca fuori dal componente.
   * useEffect con cleanup per rimuovere il listener quando il componente smonta.
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * handleInput — gestisce la digitazione nel campo
   *
   * 1. Aggiorna subito il valore visibile nel campo
   * 2. Se ci sono meno di 2 caratteri, chiude il dropdown e non cerca
   * 3. Altrimenti: cancella il timer precedente (debounce) e ne avvia uno nuovo
   *    che dopo 300ms chiama l'API Scryfall
   */
  const handleInput = (v: string) => {
    onChange(v);

    // Con meno di 2 caratteri non ha senso cercare
    if (v.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    // Cancella la ricerca precedente se l'utente sta ancora scrivendo
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Attende 300ms di pausa prima di chiamare l'API
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        /**
         * API Scryfall autocomplete:
         * - `q=artist%3A${v}` → cerca nel campo "artist" della carta
         * - Restituisce un JSON con `{ data: string[] }` — lista di nomi carta,
         *   ma noi la usiamo per estrarre i nomi degli artisti.
         *
         * Nota: Scryfall non ha un endpoint dedicato agli artisti, quindi
         * usiamo la ricerca per carte e poi estraiamo i nomi unici degli artisti
         * tramite l'endpoint /cards/search con il parametro unique=art.
         */
        const res = await fetch(
          `https://api.scryfall.com/cards/search?q=artist%3A"${encodeURIComponent(v)}"&unique=art&order=name&select=artist`,
          { headers: { 'User-Agent': 'AetherDeck/1.0' } }
        );
        const json = await res.json();

        if (json.data) {
          // Estrae i nomi artisti, rimuove i duplicati con Set, ordina alfabeticamente
          const artists = [...new Set<string>(
            json.data
              .map((card: { artist?: string }) => card.artist)
              .filter((a: string | undefined): a is string =>
                // Filtra solo gli artisti che contengono le lettere cercate
                typeof a === 'string' && a.toLowerCase().includes(v.toLowerCase())
              )
          )].sort().slice(0, 8); // Mostra massimo 8 suggerimenti

          setSuggestions(artists);
          setOpen(artists.length > 0);
        }
      } catch {
        // In caso di errore di rete, semplicemente non mostriamo suggerimenti
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  /**
   * handleSelect — l'utente ha cliccato un suggerimento
   * Salva il nome scelto, chiude il dropdown e svuota i suggerimenti.
   */
  const handleSelect = (artist: string) => {
    onChange(artist);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    // position: relative sul wrapper per posizionare il dropdown in assoluto sotto il campo
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Campo di input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', border: `1px solid ${open ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.11)'}`, borderRadius: open ? '11px 11px 0 0' : 11, padding: '10px 14px', transition: 'border-color .2s' }}>
        <span style={{ fontSize: '.85rem', color: 'var(--text-dim)', flexShrink: 0 }}>🎨</span>
        <input
          type="text"
          placeholder="es. John Avon, Terese Nielsen…"
          value={value}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '.85rem', fontFamily: 'var(--font-outfit)' }}
        />
        {/* Indicatore di caricamento mentre l'API risponde */}
        {loading && (
          <span style={{ fontSize: '.72rem', color: 'var(--text-dim)', flexShrink: 0 }}>Ricerca…</span>
        )}
        {/* Bottone per cancellare il valore inserito */}
        {value && !loading && (
          <button
            onClick={() => { onChange(''); setSuggestions([]); setOpen(false); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '.85rem', padding: 0, flexShrink: 0 }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown suggerimenti */}
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
          background: 'rgba(18,20,28,0.98)',
          border: '1px solid rgba(201,168,76,0.5)',
          borderTop: 'none',
          borderRadius: '0 0 11px 11px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {suggestions.map((artist, i) => (
            <div
              key={artist}
              onClick={() => handleSelect(artist)}
              style={{
                padding: '10px 14px',
                fontSize: '.85rem',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                transition: 'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.1)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <span style={{ color: 'var(--gold)', fontSize: '.75rem' }}>🎨</span>
              {/* Evidenzia la parte del nome che corrisponde alla ricerca */}
              <HighlightMatch text={artist} query={value} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * HighlightMatch — evidenzia la parte del testo che corrisponde alla query
 *
 * Divide il testo in tre parti: prima della corrispondenza, la corrispondenza,
 * e dopo. La corrispondenza viene mostrata in grassetto dorato.
 *
 * Esempio: testo="John Avon", query="avo" → "John " + "Avo" (dorato) + "n"
 */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;

  return (
    <span>
      {text.slice(0, idx)}
      <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </span>
  );
}


// ══════════════════════════════════════════════════════════════
// COMPONENTI INTERNI RIUSABILI
// ══════════════════════════════════════════════════════════════

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        {title}
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.11)' }} />
      </div>
      {children}
    </div>
  );
}

function ChipGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{children}</div>;
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 15px', borderRadius: 100, fontSize: '.78rem', fontWeight: 500,
        cursor: 'pointer', fontFamily: 'var(--font-outfit)',
        background: active ? 'var(--gold-dim)' : 'rgba(255,255,255,0.06)',
        border: active ? '1px solid rgba(201,168,76,0.35)' : '1px solid rgba(255,255,255,0.11)',
        color: active ? 'var(--gold-light)' : 'var(--text-dim)',
        transition: 'all .2s',
      }}
    >
      {children}
    </button>
  );
}

function RangeField({ label, placeholder, type, value, onChange }: { label: string; placeholder: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: '.72rem', color: 'var(--text-dim)' }}>{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 10, padding: '9px 12px', fontSize: '.85rem', color: 'var(--text)', fontFamily: 'var(--font-outfit)', outline: 'none', width: '100%' }}
      />
    </div>
  );
}

function TextField({ prefix, placeholder, value, onChange }: { prefix?: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 11, padding: '10px 14px' }}>
      {prefix && <span style={{ fontSize: '.7rem', color: 'var(--text-dim)', flexShrink: 0 }}>{prefix}</span>}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '.85rem', fontFamily: 'var(--font-outfit)' }}
      />
    </div>
  );
}
