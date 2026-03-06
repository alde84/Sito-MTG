/**
 * packages/types/src/index.ts — Tipi TypeScript condivisi
 *
 * Questo file è il cuore del package @aether-deck/types.
 * Definisce tutte le strutture dati del dominio MTG usate sia dal frontend
 * (Next.js) che dal backend (NestJS) e dal mobile (Expo).
 *
 * Centralizzare i tipi in un package condiviso garantisce:
 * - Consistenza: frontend e backend parlano lo stesso "linguaggio"
 * - Type safety: TypeScript segnala errori se i dati non corrispondono
 * - Un unico posto da aggiornare quando la struttura dati cambia
 *
 * CONVENZIONI TYPESCRIPT USATE:
 * - interface: per oggetti (Card, Deck, User)
 * - type: per union types semplici (ManaColor, CardRarity)
 * - Record<K, V>: per oggetti con chiavi di tipo K e valori di tipo V
 * - Partial<T>: T con tutti i campi opzionali
 * - Omit<T, K>: T senza i campi K
 * - Pick<T, K>: T con SOLO i campi K
 */


// ════════════════════════════════════════════════════════════
// TIPI PRIMITIVI DI DOMINIO
// ════════════════════════════════════════════════════════════

/**
 * ManaColor — i 5 colori di mana di Magic + Incolore
 *
 * Union type: una variabile di tipo ManaColor può contenere SOLO
 * uno di questi 6 valori letterali. TypeScript dà errore per qualsiasi altro valore.
 * Le lettere corrispondono alle iniziali inglesi ufficiali di Wizards of the Coast.
 */
export type ManaColor =
  | 'W'  // White (Bianco)
  | 'U'  // blUe (Blu — la B era presa da Black)
  | 'B'  // Black (Nero)
  | 'R'  // Red (Rosso)
  | 'G'  // Green (Verde)
  | 'C'; // Colorless (Incolore)

/**
 * CardRarity — le rarità delle carte MTG
 * Ordinate dalla più comune alla più rara.
 */
export type CardRarity =
  | 'common'    // Comune — simbolo nero
  | 'uncommon'  // Non comune — simbolo argento
  | 'rare'      // Rara — simbolo oro
  | 'mythic'    // Mitica rara — simbolo arancio/rosso
  | 'special';  // Speciale — per carte promozionali o edizioni speciali

/**
 * CardType — i tipi principali di carta MTG
 * Non include i supertipi (Legendary, Snow, Basic) né i sottotipi (Elf, Wizard, ecc.)
 * che sono stringhe libere.
 */
export type CardType =
  | 'Creature'
  | 'Instant'
  | 'Sorcery'
  | 'Enchantment'
  | 'Artifact'
  | 'Planeswalker'
  | 'Land'
  | 'Battle'    // Nuovo tipo introdotto in March of the Machine (2023)
  | 'Tribal';   // Tipo obsoleto, usato in alcune carte vecchie

/**
 * Format — i formati di gioco MTG supportati dalla piattaforma
 * Ogni formato ha regole diverse su quali carte sono legali.
 */
export type Format =
  | 'standard'    // Ultime 2 anni di set
  | 'pioneer'     // Dal 2012 in poi
  | 'modern'      // Dal 2003 in poi
  | 'legacy'      // Tutte le carte, alcune con ban
  | 'vintage'     // Tutte le carte, alcune con restriction
  | 'commander'   // Multiplayer 100 carte, comandante, singleton
  | 'pauper'      // Solo carte common
  | 'explorer'    // Versione digital di Pioneer (MTG Arena)
  | 'historic'    // Formato MTG Arena con set aggiuntivi
  | 'alchemy'     // Formato digitale con carte modificate
  | 'brawl'       // Commander semplificato, solo carte Standard
  | 'oathbreaker'; // Formato con Planeswalker come comandante


// ════════════════════════════════════════════════════════════
// INTERFACCIA CARD
// ════════════════════════════════════════════════════════════

/**
 * CardPrice — prezzi di una carta su diverse piattaforme
 * I campi numerici sono opzionali (?): non tutte le piattaforme
 * hanno un prezzo per ogni carta (es. alcune non sono disponibili su TCGPlayer).
 */
export interface CardPrice {
  cardmarket?: number;  // Prezzo in € su Cardmarket (Europa)
  tcgplayer?: number;   // Prezzo in $ su TCGPlayer (USA)
  cardkingdom?: number; // Prezzo in $ su Card Kingdom (USA)
  updatedAt: string;    // ISO 8601 timestamp dell'ultimo aggiornamento prezzi
}

/**
 * CardLegality — legalità di una carta in un formato specifico
 */
export interface CardLegality {
  format: Format;
  status:
    | 'legal'       // La carta è legale nel formato
    | 'banned'      // La carta è stata bannata
    | 'restricted'  // Massimo 1 copia consentita (solo Vintage)
    | 'not_legal';  // La carta non è mai stata legale in questo formato
}

/**
 * Card — rappresentazione completa di una carta MTG
 *
 * Basata sull'API Scryfall (https://scryfall.com/docs/api/cards)
 * che è il principale database di carte MTG usato dagli sviluppatori.
 *
 * I campi con ? sono opzionali perché non tutte le carte li hanno:
 * - manaCost: le terre non hanno costo di mana
 * - power/toughness: solo le creature
 * - loyalty: solo i Planeswalker
 * - flavorText: non tutte le carte hanno testo di sapore
 */
export interface Card {
  id: string;             // ID interno della piattaforma
  scryfallId?: string;    // ID su Scryfall (per collegamento all'API esterna)
  name: string;           // Nome della carta (es. "Lightning Bolt")
  manaCost?: string;      // Costo di mana in notazione MTG (es. "{1}{U}{U}")
  cmc: number;            // Converted Mana Cost: valore numerico totale del costo (es. 3)
  colors: ManaColor[];            // Colori della carta
  colorIdentity: ManaColor[];     // Identità di colore (per Commander — include i mana nelle abilità)
  type: string;           // Tipo completo come stringa (es. "Legendary Creature — Elf Warrior")
  supertypes: string[];   // Supertipi (es. ["Legendary", "Snow"])
  types: CardType[];      // Tipi principali (es. ["Creature"])
  subtypes: string[];     // Sottotipi (es. ["Elf", "Warrior"])
  rarity: CardRarity;
  set: string;            // Codice set (es. "MH2", "LTR")
  setName: string;        // Nome completo del set (es. "Modern Horizons 2")
  oracleText?: string;    // Testo ufficiale della carta (regole)
  flavorText?: string;    // Testo di sapore/narrativo (in corsivo sulle carte)
  power?: string;         // Forza (stringa perché può essere "*" o "1+*")
  toughness?: string;     // Costituzione
  loyalty?: string;       // Lealtà iniziale (Planeswalker)
  artist?: string;        // Nome dell'illustratore
  imageUri?: string;      // URL dell'immagine ad alta risoluzione
  price?: CardPrice;      // Prezzi correnti (opzionale: non sempre disponibili)
  legalities: CardLegality[]; // Lista di legalità per tutti i formati
}


// ════════════════════════════════════════════════════════════
// INTERFACCIA DECK
// ════════════════════════════════════════════════════════════

/**
 * DeckEntry — una singola "riga" del mazzo (carta + quantità)
 */
export interface DeckEntry {
  card: Card;         // La carta
  quantity: number;   // Quante copie (1-4 in formati standard, 1 in Commander)
  isSideboard: boolean; // true = è nel sideboard, false = è nel main deck
}

/**
 * Alias per chiarire che DeckFormat e Format sono lo stesso tipo.
 * In futuro potremmo voler differenziarli (es. formati solo per mazzo vs solo per carte).
 */
export type DeckFormat = Format;

/**
 * Deck — un mazzo MTG completo
 */
export interface Deck {
  id: string;
  name: string;
  format: DeckFormat;
  colors: ManaColor[];      // Colori usati nel mazzo (calcolati dalle carte)
  description?: string;     // Descrizione testuale opzionale dell'autore
  authorId: string;         // ID dell'utente che ha creato il mazzo
  authorUsername: string;   // Username (per mostrarlo senza join nel DB)
  entries: DeckEntry[];     // Lista di tutte le carte del mazzo
  commander?: Card;         // Comandante (solo per formato Commander)
  isPublic: boolean;        // Visibile a tutti o solo all'autore
  likes: number;            // Contatore like
  comments: number;         // Contatore commenti
  copies: number;           // Numero di volte che altri utenti hanno copiato il mazzo
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
}


// ════════════════════════════════════════════════════════════
// INTERFACCIA USER
// ════════════════════════════════════════════════════════════

/**
 * User — profilo di un utente della piattaforma
 */
export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;    // URL immagine profilo (opzionale)
  bio?: string;          // Descrizione del profilo (opzionale)
  createdAt: string;
  decksCount: number;    // Cache del numero di mazzi (per evitare query costose)
  followersCount: number;
  followingCount: number;
}


// ════════════════════════════════════════════════════════════
// OSCILLAZIONI DI PREZZO
// ════════════════════════════════════════════════════════════

/**
 * PriceMovement — dati di variazione prezzo per la dashboard
 *
 * Pick<Card, 'id' | 'name' | 'set' | ...> crea un tipo con SOLO
 * i campi specificati di Card. Molto più leggero di includere Card intera,
 * perché per la lista prezzi non servono oracleText, legalities, ecc.
 */
export interface PriceMovement {
  card: Pick<Card, 'id' | 'name' | 'set' | 'setName' | 'rarity' | 'colors'>;
  previousPrice: number;   // Prezzo di 7 giorni fa (€)
  currentPrice: number;    // Prezzo attuale (€)
  changePercent: number;   // Variazione percentuale (positiva = rialzo, negativa = ribasso)
  direction: 'up' | 'down'; // Direzione esplicita (ridondante ma comoda per i componenti)
  sparkline: number[];     // 7 valori Y per il mini-grafico (uno per giorno)
}


// ════════════════════════════════════════════════════════════
// FILTRI DI RICERCA
// ════════════════════════════════════════════════════════════

/**
 * CardFilters — tutti i criteri di ricerca/filtraggio delle carte
 *
 * Tutti i campi sono opzionali (?): un filtro non impostato = nessun filtro
 * per quella proprietà. Questo oggetto viene inviato come query params all'API.
 */
export interface CardFilters {
  query?: string;          // Testo libero (cerca nel nome e testo oracle)
  colors?: ManaColor[];    // Colori selezionati
  colorMode?: 'exactly' | 'including' | 'atmost' | 'commander'; // Modalità colore
  formats?: Format[];      // Formati in cui la carta deve essere legale
  rarities?: CardRarity[]; // Rarità selezionate
  types?: CardType[];      // Tipi di carta
  cmcMin?: number;         // CMC minimo
  cmcMax?: number;         // CMC massimo
  powerMin?: number;       // Forza minima
  powerMax?: number;       // Forza massima
  toughnessMin?: number;   // Costituzione minima
  toughnessMax?: number;   // Costituzione massima
  oracleText?: string;     // Parola chiave nel testo oracle
  name?: string;           // Nome esatto o parziale
  subtype?: string;        // Sottotipo (es. "Elf", "Wizard")
  priceMin?: number;       // Prezzo minimo (€)
  priceMax?: number;       // Prezzo massimo (€)
  set?: string;            // Codice set (es. "MH2")
  artist?: string;         // Nome artista
  includeIllegal?: boolean; // Se true, include carte non legali in nessun formato
}

/**
 * PaginatedResponse<T> — risposta paginata generica per le liste
 *
 * Il tipo generico <T> permette di riusare questa interfaccia per qualsiasi
 * tipo di risorsa: PaginatedResponse<Card>, PaginatedResponse<Deck>, ecc.
 * TypeScript sostituirà T con il tipo concreto quando viene usata.
 */
export interface PaginatedResponse<T> {
  data: T[];       // Array degli elementi di questa pagina
  total: number;   // Totale degli elementi in tutto il dataset
  page: number;    // Numero della pagina corrente (1-based)
  pageSize: number;// Quanti elementi per pagina
  hasMore: boolean;// true se esistono altre pagine dopo questa
}
