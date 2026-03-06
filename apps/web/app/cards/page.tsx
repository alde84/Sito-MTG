/**
 * cards/page.tsx — Pagina di ricerca carte
 *
 * Questa è la pagina principale per cercare e sfogliare le carte MTG.
 * Legge il parametro ?q= dall'URL per avviare subito una ricerca
 * quando l'utente arriva dalla homepage (es. /cards?q=lightning+bolt).
 *
 * FLUSSO DI RICERCA:
 * 1. L'utente scrive nella searchbar (o arriva con ?q= nell'URL)
 * 2. Dopo 400ms di pausa (debounce), viene chiamata l'API Scryfall
 * 3. I risultati vengono mostrati nella CardGrid
 * 4. Cliccando una carta si apre il CardModal con tutti i dettagli
 *
 * PAGINAZIONE:
 * Scryfall restituisce al massimo 175 carte per pagina.
 * Il campo next_page nella risposta contiene l'URL della pagina successiva.
 * Il bottone "Carica altri" richiama loadMore() che aggiunge le carte in fondo.
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { CardFilters } from '@aether-deck/types';
import { Background } from '../components/Background';
import { Navbar } from '../components/Navbar';
import { FilterPanel } from '../components/FilterPanel';
import { CardGrid } from './components/CardGrid';
import { CardModal } from './components/CardModal';
import { useReveal } from '../lib/useReveal';

// ── Tipo ScryfallCard ─────────────────────────────────────────────────────────
/**
 * ScryfallCard — rappresenta una carta restituita dall'API Scryfall
 *
 * Scryfall restituisce oltre 70 campi per carta; qui definiamo solo
 * quelli che effettivamente usiamo nell'interfaccia.
 * Esportato (export interface) perché viene usato anche da CardGrid e CardModal.
 */
export interface ScryfallCard {
  id: string;             // ID univoco Scryfall (UUID)
  name: string;           // Nome della carta
  mana_cost?: string;     // Costo di mana es. "{2}{U}{U}" (opzionale: le terre non ce l'hanno)
  cmc: number;            // Converted Mana Cost (valore numerico totale)
  type_line: string;      // Riga del tipo es. "Legendary Creature — Human Wizard"
  oracle_text?: string;   // Testo delle regole (opzionale: alcune carte non ce l'hanno)
  colors?: string[];      // Colori della carta ["U", "R"] (opzionale)
  color_identity: string[];// Color identity (usata in Commander)
  rarity: string;         // "common" | "uncommon" | "rare" | "mythic" | "special"
  set: string;            // Codice set es. "mh2"
  set_name: string;       // Nome completo del set es. "Modern Horizons 2"
  artist?: string;        // Nome dell'artista
  flavor_text?: string;   // Testo di sapore (corsivo nelle carte fisiche)
  power?: string;         // Forza (solo creature, può essere "*")
  toughness?: string;     // Costituzione (solo creature, può essere "*")
  loyalty?: string;       // Fedeltà iniziale (solo planeswalker)
  image_uris?: {          // URL immagini in varie dimensioni
    small: string;        // ~146×204px
    normal: string;       // ~488×680px
    large: string;        // ~672×936px
    art_crop: string;     // Solo l'illustrazione (ritagliata)
  };
  // Carte double-faced (es. lupi mannari, trasformazioni):
  // non hanno image_uris al livello radice ma le hanno dentro card_faces
  card_faces?: {
    name: string;
    mana_cost?: string;
    type_line: string;
    oracle_text?: string;
    image_uris?: { small: string; normal: string; large: string; art_crop: string; };
    power?: string;
    toughness?: string;
  }[];
  prices: {
    eur?: string;       // Prezzo Cardmarket in € (stringa es. "12.50")
    eur_foil?: string;  // Prezzo foil Cardmarket in €
    usd?: string;       // Prezzo TCGPlayer in $
  };
  legalities: Record<string, string>; // { standard: "legal", modern: "banned", ... }
  scryfall_uri: string;               // Link alla pagina della carta su Scryfall
}

// ── buildScryfallQuery ────────────────────────────────────────────────────────
/**
 * buildScryfallQuery — converte i filtri dell'app nella sintassi query di Scryfall
 *
 * Scryfall usa una sintassi di ricerca testuale simile a Google:
 * - "c:U" → carte blu
 * - "r:mythic" → carte mitiche
 * - "t:creature" → creature
 * - "cmc<=3" → costo di mana ≤ 3
 * - "o:flying" → testo oracle contiene "flying"
 *
 * Questa funzione prende l'oggetto CardFilters e costruisce
 * la stringa query corrispondente.
 *
 * Ogni filtro attivo aggiunge una parte alla query; le parti vengono
 * unite con spazi (AND implicito in Scryfall).
 */
function buildScryfallQuery(search: string, filters: CardFilters): string {
  const parts: string[] = [];

  // Testo libero → cerca nel nome della carta
  if (search.trim()) parts.push(search.trim());

  // Colori con modalità diverse:
  // c=WU → esattamente bianco e blu (niente altro)
  // c>=WU → deve contenere almeno bianco e blu (può averne altri)
  // c<=WU → solo bianco e/o blu (non può averne altri)
  // id<=WU → color identity (per Commander)
  if (filters.colors?.length) {
    const c = filters.colors.join('');
    const modeMap: Record<string, string> = {
      exactly: `c=${c}`,
      including: `c>=${c}`,
      atmost: `c<=${c}`,
      commander: `id<=${c}`,
    };
    parts.push(modeMap[filters.colorMode ?? 'exactly'] ?? `c=${c}`);
  }

  // Formato: Scryfall supporta un solo formato alla volta (prendiamo il primo)
  if (filters.formats?.length) parts.push(`legal:${filters.formats[0]}`);

  // Rarità: se multiple, le uniamo con OR tra parentesi
  // es. "(r:rare or r:mythic)"
  if (filters.rarities?.length) {
    parts.push(
      filters.rarities.length > 1
        ? `(${filters.rarities.map(r => `r:${r}`).join(' or ')})`
        : `r:${filters.rarities[0]}`
    );
  }

  // Tipi di carta: stesso pattern delle rarità con OR
  if (filters.types?.length) {
    parts.push(
      filters.types.length > 1
        ? `(${filters.types.map(t => `t:${t.toLowerCase()}`).join(' or ')})`
        : `t:${filters.types[0].toLowerCase()}`
    );
  }

  // CMC (Converted Mana Cost) con range min/max
  if (filters.cmcMin !== undefined) parts.push(`cmc>=${filters.cmcMin}`);
  if (filters.cmcMax !== undefined) parts.push(`cmc<=${filters.cmcMax}`);

  // Forza e costituzione (solo creature)
  if (filters.powerMin !== undefined) parts.push(`pow>=${filters.powerMin}`);
  if (filters.powerMax !== undefined) parts.push(`pow<=${filters.powerMax}`);
  if (filters.toughnessMin !== undefined) parts.push(`tou>=${filters.toughnessMin}`);
  if (filters.toughnessMax !== undefined) parts.push(`tou<=${filters.toughnessMax}`);

  // Testo oracle: le virgolette cercano la frase esatta
  if (filters.oracleText) parts.push(`o:"${filters.oracleText}"`);

  // Nome e sottotipo
  if (filters.name) parts.push(`name:"${filters.name}"`);
  if (filters.subtype) parts.push(`t:${filters.subtype}`);

  // Artista: le virgolette gestiscono nomi con spazi (es. "John Avon")
  if (filters.artist) parts.push(`a:"${filters.artist}"`);

  // Se non ci sono filtri, mostra le carte più recenti (anno >= 2020)
  // per non sovraccaricare l'API con tutte le 30.000+ carte
  return parts.length > 0 ? parts.join(' ') : 'year>=2020';
}

// ── Componente principale ─────────────────────────────────────────────────────

export default function CardsPage() {
  /**
   * useSearchParams — legge i parametri dell'URL corrente
   *
   * Se l'utente arriva su /cards?q=lightning+bolt,
   * searchParams.get('q') restituisce "lightning bolt".
   * Questo valore viene usato come valore iniziale della searchbar,
   * avviando automaticamente la ricerca al caricamento della pagina.
   */
  const searchParams = useSearchParams();

  // Stato della ricerca: inizializzato con il parametro ?q= dell'URL (se presente)
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<CardFilters>({});
  const [cards, setCards] = useState<ScryfallCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCards, setTotalCards] = useState(0);
  const [nextPage, setNextPage] = useState<string | null>(null); // URL pagina successiva Scryfall
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);

  // Ref fittizio passato alla Navbar: su questa pagina non c'è la hero searchbar,
  // quindi la mini-searchbar della navbar è sempre visibile
  const dummyRef = useRef<HTMLDivElement>(null);

  useReveal(); // Attiva le animazioni scroll-reveal

  // Conta i filtri attivi per il badge nel bottone filtri
  const activeFilterCount = [
    ...(filters.colors ?? []), ...(filters.formats ?? []),
    ...(filters.rarities ?? []), ...(filters.types ?? []),
  ].length;

  /**
   * fetchCards — chiama l'API Scryfall e aggiorna la lista carte
   *
   * useCallback memorizza la funzione tra i render: viene ricreata
   * solo quando cambiano searchValue o filters. Questo è necessario
   * perché fetchCards è usata come dipendenza nell'useEffect del debounce:
   * senza useCallback, verrebbe ricreata ad ogni render causando
   * chiamate API infinite.
   */
  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNextPage(null);

    try {
      const query = buildScryfallQuery(searchValue, filters);
      // unique=cards → mostra ogni stampa della carta (non solo la più recente)
      // order=name → ordina alfabeticamente per nome
      const res = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=name&unique=cards`
      );
      const json = await res.json();

      if (json.object === 'error') {
        // Scryfall restituisce object: 'error' quando non trova nessuna carta
        setCards([]);
        setTotalCards(0);
        setError(json.details ?? 'Nessuna carta trovata.');
        return;
      }

      setCards(json.data ?? []);
      setTotalCards(json.total_cards ?? 0);
      // next_page è l'URL della pagina successiva (null se è l'ultima pagina)
      setNextPage(json.next_page ?? null);
    } catch {
      setError('Errore di connessione. Controlla la tua rete e riprova.');
    } finally {
      setLoading(false);
    }
  }, [searchValue, filters]);

  /**
   * loadMore — carica la pagina successiva e la aggiunge alla lista esistente
   *
   * Scryfall pagina i risultati: ogni risposta contiene max 175 carte
   * e un campo next_page con l'URL per la pagina successiva.
   * Le nuove carte vengono aggiunte in fondo con [...prev, ...json.data].
   */
  const loadMore = async () => {
    if (!nextPage || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(nextPage);
      const json = await res.json();
      if (json.data) {
        setCards(prev => [...prev, ...json.data]); // Aggiunge in coda
        setNextPage(json.next_page ?? null);
      }
    } catch { /* Ignora errori sul caricamento aggiuntivo */ }
    finally { setLoadingMore(false); }
  };

  /**
   * Debounce della ricerca: aspetta 400ms dopo l'ultima modifica
   * prima di chiamare l'API. Questo evita una chiamata API per ogni
   * singolo tasto premuto mentre l'utente sta ancora scrivendo.
   *
   * Funziona così:
   * 1. L'utente preme un tasto → il timer viene azzerato e riavviato
   * 2. Se l'utente non preme altri tasti per 400ms → fetchCards() viene chiamata
   * 3. Il cleanup (return) cancella il timer se il componente si aggiorna
   *    prima che i 400ms siano trascorsi
   */
  useEffect(() => {
    const timer = setTimeout(fetchCards, 400);
    return () => clearTimeout(timer);
  }, [fetchCards]);

  return (
    <>
      <Background />

      {/*
        Navbar con dummyRef: poiché questa pagina non ha una sezione hero
        con la searchbar, passiamo un ref vuoto. La mini-searchbar della
        navbar sarà sempre visibile (showNavSearch rimarrà false, ma
        la navbar è comunque sempre presente e funzionante).
      */}
      <Navbar
        onFilterOpen={() => setFilterOpen(true)}
        heroSearchbarRef={dummyRef}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        activeFilterCount={activeFilterCount}
      />

      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Modale dettagli carta: renderizzato solo se selectedCard è non-null */}
      {selectedCard && (
        <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}

      {/* Contenuto principale della pagina */}
      <div style={{
        position: 'relative', zIndex: 1,
        paddingTop: 'calc(var(--navbar-h) + 32px)', // Spazio sotto la navbar fissa
        paddingBottom: 80, paddingLeft: 24, paddingRight: 24,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* ── Intestazione pagina ── */}
          <div className="reveal" style={{ marginBottom: 32 }}>
            <div style={{ fontSize: '.7rem', fontWeight: 600, letterSpacing: '.14em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>
              📖 Database carte
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <h1 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700 }}>
                Cerca le tue <em style={{ fontStyle: 'normal', color: 'var(--gold-light)' }}>carte</em>
              </h1>
              {/* Contatore risultati: appare solo quando la ricerca ha prodotto risultati */}
              {!loading && totalCards > 0 && (
                <span style={{ fontSize: '.82rem', color: 'var(--text-dim)' }}>
                  {/* toLocaleString('it-IT') → formato italiano: 12.345 (punto come separatore migliaia) */}
                  {totalCards.toLocaleString('it-IT')} carte trovate
                </span>
              )}
            </div>
          </div>

          {/*
            ── Barra di ricerca inline ──
            Questa searchbar è specifica della pagina /cards.
            Permette di modificare la ricerca senza tornare alla homepage.
            È separata dalla mini-searchbar della Navbar (anche se condividono
            lo stesso stato searchValue tramite la prop onSearchChange).
          */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: 'flex', gap: 10, alignItems: 'center',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: 14, padding: '10px 16px',
            }}>
              <span style={{ color: 'var(--text-dim)' }}>🔍</span>
              <input
                type="text"
                placeholder="Cerca una carta…"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '.92rem', fontFamily: 'var(--font-outfit)' }}
              />
              {/* Bottone ✕ per svuotare la ricerca: appare solo se c'è testo */}
              {searchValue && (
                <button
                  onClick={() => setSearchValue('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '.85rem' }}
                >
                  ✕
                </button>
              )}
              {/* Bottone filtri: cambia stile se ci sono filtri attivi */}
              <button
                onClick={() => setFilterOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 10, fontSize: '.78rem', fontWeight: 600,
                  fontFamily: 'var(--font-outfit)', cursor: 'pointer',
                  // Stile condizionale: dorato se filtri attivi, neutro altrimenti
                  background: activeFilterCount > 0 ? 'var(--gold-dim)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${activeFilterCount > 0 ? 'rgba(201,168,76,0.35)' : 'var(--glass-border)'}`,
                  color: activeFilterCount > 0 ? 'var(--gold)' : 'var(--text-dim)',
                }}
              >
                Filtri {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            </div>
          </div>

          {/* Griglia carte con stati loading/error/empty/loaded */}
          <CardGrid
            cards={cards}
            loading={loading}
            error={error}
            onCardClick={setSelectedCard}
            onLoadMore={loadMore}
            hasMore={!!nextPage}
            loadingMore={loadingMore}
          />

        </div>
      </div>
    </>
  );
}
