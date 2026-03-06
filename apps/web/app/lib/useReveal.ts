/**
 * useReveal.ts — Hook personalizzato per le animazioni scroll-reveal
 *
 * Un "custom hook" in React è una funzione che inizia con "use" e può
 * usare altri hook React al suo interno. Questo hook incapsula la logica
 * per animare elementi quando entrano nel campo visivo dell'utente.
 *
 * Come funziona:
 * - Tutti gli elementi con classe CSS "reveal" partono invisibili (opacity: 0)
 * - Quando l'utente scrolla e un elemento entra nel viewport, gli viene
 *   aggiunta la classe "visible", che triggera la transizione CSS
 *   che lo rende visibile con un effetto fade-up (definito in globals.css)
 */
'use client';

import { useEffect } from 'react';

export function useReveal() {
  // useEffect esegue il codice dopo che il componente è stato montato nel DOM.
  // Il secondo argomento [] (array vuoto) significa: eseguilo solo una volta,
  // al primo render. Senza [], girerebbe ad ogni re-render del componente.
  useEffect(() => {

    /**
     * IntersectionObserver è una API nativa del browser che osserva
     * in modo efficiente se un elemento è visibile nel viewport.
     * È molto più performante di ascoltare l'evento 'scroll' manualmente,
     * perché non blocca il thread principale.
     *
     * Il callback viene chiamato ogni volta che un elemento osservato
     * cambia stato (entra o esce dal viewport).
     */
    const observer = new IntersectionObserver(
      entries => {
        // "entries" è la lista degli elementi che hanno cambiato stato
        entries.forEach(entry => {
          // isIntersecting è true quando l'elemento è nel viewport
          if (entry.isIntersecting) {
            // Aggiunge 'visible' → triggera la transizione CSS
            entry.target.classList.add('visible');
            // Nota: non rimuoviamo mai 'visible', quindi l'animazione
            // avviene solo la prima volta che l'elemento entra nel viewport.
          }
        });
      },
      {
        // threshold: 0.08 significa che il callback viene chiamato quando
        // almeno l'8% dell'elemento è visibile nel viewport.
        // Con 0 scatterebbe appena un pixel è visibile,
        // con 1 aspetterebbe che sia completamente visibile.
        threshold: 0.08
      }
    );

    // Seleziona tutti gli elementi con classe 'reveal' nel DOM
    // e li mette sotto osservazione
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Funzione di cleanup: viene chiamata da React quando il componente
    // viene smontato (es. navigazione verso un'altra pagina).
    // disconnect() smette di osservare tutti gli elementi,
    // evitando memory leak.
    return () => observer.disconnect();

  }, []); // [] = esegui solo al mount, non ad ogni re-render
}
