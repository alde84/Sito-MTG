/**
 * page.tsx — Homepage principale di AetherDeck
 *
 * In Next.js con App Router, ogni file chiamato `page.tsx` dentro la cartella
 * `app/` diventa automaticamente una rotta. Questo file è la rotta radice "/".
 *
 * La direttiva 'use client' indica a Next.js che questo componente deve girare
 * nel browser (client-side), non sul server. È necessaria perché usiamo hook
 * React come useState e useRef, che richiedono l'ambiente browser.
 */
'use client';

// useRef: crea un riferimento diretto a un elemento DOM (qui la searchbar hero)
// useState: gestisce lo stato locale del componente (testo ricerca, filtri, ecc.)
import { useRef, useState } from 'react';

// CardFilters è l'interfaccia TypeScript definita in packages/types/ che descrive
// tutti i possibili criteri di ricerca (colori, formato, rarità, prezzo, ecc.)
import type { CardFilters } from '@aether-deck/types';

// Ogni componente è isolato nel proprio file per mantenere il codice leggibile
import { Background } from './components/Background';     // Sfondo animato (orb + griglia)
import { Navbar } from './components/Navbar';         // Barra navigazione fissa in alto
import { HeroSection } from './components/HeroSection';    // Hero con titolo e searchbar
import { FilterPanel } from './components/FilterPanel';    // Pannello filtri avanzati
import { TrendingDecks } from './components/TrendingDecks';  // Sezione mazzi trending
import { PriceMovements } from './components/PriceMovements'; // Sezione oscillazioni prezzi
import { useReveal } from './lib/useReveal';             // Hook animazioni scroll

/**
 * HomePage — componente radice della pagina
 *
 * Questo componente "orchestra" tutti gli altri: tutta la logica di stato
 * condivisa tra più figli vive qui, e viene distribuita tramite props.
 * Questo pattern si chiama "lifting state up" (stato sollevato al genitore).
 */
export default function HomePage() {

  // Testo nella searchbar. Viene condiviso tra HeroSection (searchbar grande)
  // e Navbar (searchbar piccola che appare allo scroll), tenendole sincronizzate.
  const [searchValue, setSearchValue] = useState('');

  // Controlla se il pannello filtri è aperto o chiuso.
  const [filterOpen, setFilterOpen] = useState(false);

  // Oggetto con tutti i filtri attivi selezionati dall'utente.
  // Inizia vuoto {} = nessun filtro attivo.
  const [filters, setFilters] = useState<CardFilters>({});

  // Riferimento DOM alla searchbar nella sezione hero.
  // Viene passato a HeroSection (che lo "attacca" al div con ref={...})
  // e a Navbar (che lo legge per capire quando la searchbar esce dallo schermo).
  const heroSearchbarRef = useRef<HTMLDivElement>(null);

  // Attiva le animazioni scroll-reveal: aggiunge la classe 'visible'
  // agli elementi con classe 'reveal' quando entrano nel viewport.
  useReveal();

  // Conta i filtri attivi sommando gli elementi in ogni array di filtri.
  // ?? [] gestisce il caso in cui la proprietà sia undefined (non ancora impostata).
  // Questo numero viene mostrato come badge numerico sul bottone filtri.
  const activeFilterCount = [
    ...(filters.colors ?? []),  // es. ['U', 'R'] → 2
    ...(filters.formats ?? []),  // es. ['modern']  → 1
    ...(filters.rarities ?? []),  // es. ['mythic']  → 1
    ...(filters.types ?? []),  // es. ['Creature'] → 1
  ].length;

  return (
    <>
      {/* Sfondo fisso decorativo: orb sfumati e griglia dorata semitrasparente */}
      <Background />

      {/*
        Navbar fissa in cima. Riceve:
        - onFilterOpen: apre il pannello filtri
        - heroSearchbarRef: ref per tracciare la posizione della searchbar hero
        - searchValue / onSearchChange: testo di ricerca condiviso
        - activeFilterCount: numero filtri attivi (badge)
      */}
      <Navbar
        onFilterOpen={() => setFilterOpen(true)}
        heroSearchbarRef={heroSearchbarRef}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        activeFilterCount={activeFilterCount}
      />

      {/*
        Pannello modale dei filtri avanzati.
        - open: true = visibile, false = nascosto (ma sempre nel DOM per l'animazione)
        - onClose: chiude il pannello (es. click sull'overlay o su "Applica")
        - filters / onFiltersChange: stato filtri e il suo setter
      */}
      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/*
        Sezione hero: titolo, sottotitolo, searchbar principale.
        searchbarRef viene attaccato all'elemento DOM della searchbar,
        così la Navbar può tracciarne la posizione durante lo scroll.
      */}
      <HeroSection
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onFilterOpen={() => setFilterOpen(true)}
        activeFilterCount={activeFilterCount}
        searchbarRef={heroSearchbarRef}
      />

      {/*
        Contenuto principale sotto l'hero.
        position: relative + z-index: 1 → sta sopra il Background fisso.
        Il div interno centra il contenuto con larghezza massima di 1100px.
      */}
      <div style={{ position: 'relative', zIndex: 1, padding: '0 24px 120px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <TrendingDecks />   {/* Griglia mazzi più interagiti */}
          <PriceMovements />  {/* Pannelli rialzi/ribassi prezzi Cardmarket */}
        </div>
      </div>

      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid var(--glass-border)', padding: '30px 24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '.76rem' }}>
        <span style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--gold)', fontSize: '.88rem' }}>AetherDeck</span>
        &nbsp;·&nbsp; Non affiliato con Wizards of the Coast &nbsp;·&nbsp; Magic: The Gathering è un marchio di WotC
      </footer>
    </>
  );
}
