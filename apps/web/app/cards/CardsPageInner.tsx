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

export interface ScryfallCard {
    id: string;
    name: string;
    mana_cost?: string;
    cmc: number;
    type_line: string;
    oracle_text?: string;
    colors?: string[];
    color_identity: string[];
    rarity: string;
    set: string;
    set_name: string;
    artist?: string;
    flavor_text?: string;
    power?: string;
    toughness?: string;
    loyalty?: string;
    image_uris?: {
        small: string;
        normal: string;
        large: string;
        art_crop: string;
    };
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
        eur?: string;
        eur_foil?: string;
        usd?: string;
    };
    legalities: Record<string, string>;
    scryfall_uri: string;
}

function buildScryfallQuery(search: string, filters: CardFilters): string {
    const parts: string[] = [];

    if (search.trim()) parts.push(search.trim());

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

    if (filters.formats?.length) parts.push(`legal:${filters.formats[0]}`);

    if (filters.rarities?.length) {
        parts.push(
            filters.rarities.length > 1
                ? `(${filters.rarities.map(r => `r:${r}`).join(' or ')})`
                : `r:${filters.rarities[0]}`
        );
    }

    if (filters.types?.length) {
        parts.push(
            filters.types.length > 1
                ? `(${filters.types.map(t => `t:${t.toLowerCase()}`).join(' or ')})`
                : `t:${filters.types[0].toLowerCase()}`
        );
    }

    if (filters.cmcMin !== undefined) parts.push(`cmc>=${filters.cmcMin}`);
    if (filters.cmcMax !== undefined) parts.push(`cmc<=${filters.cmcMax}`);
    if (filters.powerMin !== undefined) parts.push(`pow>=${filters.powerMin}`);
    if (filters.powerMax !== undefined) parts.push(`pow<=${filters.powerMax}`);
    if (filters.toughnessMin !== undefined) parts.push(`tou>=${filters.toughnessMin}`);
    if (filters.toughnessMax !== undefined) parts.push(`tou<=${filters.toughnessMax}`);

    if (filters.oracleText) parts.push(`o:"${filters.oracleText}"`);
    if (filters.name) parts.push(`name:"${filters.name}"`);
    if (filters.subtype) parts.push(`t:${filters.subtype}`);
    if (filters.artist) parts.push(`a:"${filters.artist}"`);

    return parts.length > 0 ? parts.join(' ') : 'year>=2020';
}

// ── PRIMA era "CardsPage", ora è "CardsPageInner" ──────────────────────────
export default function CardsPageInner() {
    const searchParams = useSearchParams();

    const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '');
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState<CardFilters>({});
    const [cards, setCards] = useState<ScryfallCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCards, setTotalCards] = useState(0);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);

    const dummyRef = useRef<HTMLDivElement>(null);

    useReveal();

    const activeFilterCount = [
        ...(filters.colors ?? []), ...(filters.formats ?? []),
        ...(filters.rarities ?? []), ...(filters.types ?? []),
    ].length;

    const fetchCards = useCallback(async () => {
        setLoading(true);
        setError(null);
        setNextPage(null);

        try {
            const query = buildScryfallQuery(searchValue, filters);
            const res = await fetch(
                `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=name&unique=cards`
            );
            const json = await res.json();

            if (json.object === 'error') {
                setCards([]);
                setTotalCards(0);
                setError(json.details ?? 'Nessuna carta trovata.');
                return;
            }

            setCards(json.data ?? []);
            setTotalCards(json.total_cards ?? 0);
            setNextPage(json.next_page ?? null);
        } catch {
            setError('Errore di connessione. Controlla la tua rete e riprova.');
        } finally {
            setLoading(false);
        }
    }, [searchValue, filters]);

    const loadMore = async () => {
        if (!nextPage || loadingMore) return;
        setLoadingMore(true);
        try {
            const res = await fetch(nextPage);
            const json = await res.json();
            if (json.data) {
                setCards(prev => [...prev, ...json.data]);
                setNextPage(json.next_page ?? null);
            }
        } catch { }
        finally { setLoadingMore(false); }
    };

    useEffect(() => {
        const timer = setTimeout(fetchCards, 400);
        return () => clearTimeout(timer);
    }, [fetchCards]);

    return (
        <>
            <Background />
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
            {selectedCard && (
                <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
            )}
            <div style={{
                position: 'relative', zIndex: 1,
                paddingTop: 'calc(var(--navbar-h) + 32px)',
                paddingBottom: 80, paddingLeft: 24, paddingRight: 24,
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div className="reveal" style={{ marginBottom: 32 }}>
                        <div style={{ fontSize: '.7rem', fontWeight: 600, letterSpacing: '.14em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>
                            📖 Database carte
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <h1 style={{ fontFamily: 'var(--font-cinzel)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700 }}>
                                Cerca le tue <em style={{ fontStyle: 'normal', color: 'var(--gold-light)' }}>carte</em>
                            </h1>
                            {!loading && totalCards > 0 && (
                                <span style={{ fontSize: '.82rem', color: 'var(--text-dim)' }}>
                                    {totalCards.toLocaleString('it-IT')} carte trovate
                                </span>
                            )}
                        </div>
                    </div>
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
                            {searchValue && (
                                <button
                                    onClick={() => setSearchValue('')}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '.85rem' }}
                                >
                                    ✕
                                </button>
                            )}
                            <button
                                onClick={() => setFilterOpen(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '6px 14px', borderRadius: 10, fontSize: '.78rem', fontWeight: 600,
                                    fontFamily: 'var(--font-outfit)', cursor: 'pointer',
                                    background: activeFilterCount > 0 ? 'var(--gold-dim)' : 'rgba(255,255,255,0.06)',
                                    border: `1px solid ${activeFilterCount > 0 ? 'rgba(201,168,76,0.35)' : 'var(--glass-border)'}`,
                                    color: activeFilterCount > 0 ? 'var(--gold)' : 'var(--text-dim)',
                                }}
                            >
                                Filtri {activeFilterCount > 0 && `(${activeFilterCount})`}
                            </button>
                        </div>
                    </div>
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