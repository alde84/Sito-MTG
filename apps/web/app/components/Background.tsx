/**
 * Background.tsx — Sfondo animato decorativo
 *
 * Questo componente crea il fondal visivo della pagina: tre "orb" (sfere sfocate
 * colorate) che fluttuano lentamente, e una griglia semitrasparente dorata.
 * È marcato 'use client' perché usa stili inline con valori dinamici,
 * anche se in realtà potrebbe essere un Server Component — è una buona pratica
 * tenerlo client-side per coerenza con il resto dell'app.
 *
 * Entrambi gli elementi (canvas + griglia) hanno position: fixed, cioè rimangono
 * fissi sullo schermo mentre l'utente scrolla, e z-index: 0 → sotto tutto il resto.
 * pointer-events: none → non catturano click/hover, passano tutto agli elementi sopra.
 */
'use client';

export function Background() {
  return (
    <>
      {/*
        bg-canvas: div fisso che copre l'intero schermo.
        Il background è composto da 3 gradienti radiali sovrapposti + colore base scuro:
        - In alto a sinistra: viola scuro (tema arcano/magico)
        - In basso a destra: blu navy (tema acqua/blu MTG)
        - Al centro: marrone/arancio caldo (tema terra/fuoco)
        Questi colori richiamano le 5 sfere di mana di Magic the Gathering.
      */}
      <div
        className="bg-canvas"
        style={{
          position: 'fixed',
          inset: 0,         // equivale a top:0, right:0, bottom:0, left:0
          zIndex: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 80% 60% at 18% 8%, rgba(60,28,90,0.52) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 82% 82%, rgba(28,58,110,0.44) 0%, transparent 70%),
            radial-gradient(ellipse 45% 38% at 52% 52%, rgba(90,48,18,0.20) 0%, transparent 70%),
            #0a0c10
          `,
        }}
      >
        {/*
          I tre Orb sono sfere sfocate che si animano con un effetto fluttuante.
          Ogni orb ha dimensioni, posizione, colore e timing di animazione diversi
          per creare un effetto organico e non meccanico.
          Il delay negativo (es. -4s) fa partire l'animazione "a metà ciclo",
          così i tre orb si muovono in modo asincrono tra loro.
        */}
        <Orb size={560} top="-140px"  left="-120px" color="#4a1a7a" duration="16s" />
        <Orb size={420} bottom="40px" right="-80px" color="#1a3a7a" duration="12s" delay="-4s" />
        <Orb size={280} top="45%"     left="56%"    color="#7a4010" duration="18s" delay="-8s" />
      </div>

      {/*
        Griglia dorata semitrasparente sovrapposta a tutto lo schermo.
        Crea l'effetto "dashboard tech / fantasy arcana" tipico di siti di gioco.
        background-size: 60px 60px → ogni cella della griglia è 60x60 pixel.
        L'opacità del colore (0.022) è molto bassa: la griglia è quasi invisibile,
        si percepisce solo come texture sottile.
      */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(201,168,76,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.022) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </>
  );
}

/**
 * OrbProps — le proprietà accettate dal componente Orb
 *
 * Le prop di posizione (top, bottom, left, right) sono opzionali (?)
 * perché ogni orb usa una combinazione diversa: il primo usa top+left,
 * il secondo usa bottom+right, ecc.
 */
interface OrbProps {
  size: number;      // Dimensione in pixel (larghezza e altezza, è un cerchio)
  top?: string;      // Distanza dal bordo superiore (es. "-140px", "45%")
  bottom?: string;   // Distanza dal bordo inferiore
  left?: string;     // Distanza dal bordo sinistro
  right?: string;    // Distanza dal bordo destro
  color: string;     // Colore centrale del gradiente radiale (es. "#4a1a7a")
  duration: string;  // Durata del ciclo di animazione (es. "16s")
  delay?: string;    // Ritardo di partenza dell'animazione (es. "-4s")
}

/**
 * Orb — sfera sfocata animata
 *
 * Componente privato (non esportato): usato solo all'interno di Background.
 * Crea un div circolare con filter: blur(90px) che lo rende "nebuloso".
 * L'animazione floatOrb (definita in globals.css) lo fa oscillare lentamente
 * tra la posizione originale e una posizione leggermente spostata (+28px, +38px).
 * alternate → va e torna, infinite → non si ferma mai.
 */
function Orb({ size, top, bottom, left, right, color, duration, delay }: OrbProps) {
  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        top,
        bottom,
        left,
        right,
        borderRadius: '50%',              // Rende il div un cerchio perfetto
        filter: 'blur(90px)',             // Sfoca tantissimo → effetto nebula
        opacity: 0.3,                     // Semitrasparente per non essere troppo invadente
        background: `radial-gradient(circle, ${color}, transparent)`, // Dal colore al trasparente
        animation: `floatOrb ${duration} ease-in-out infinite alternate`,
        animationDelay: delay,
      }}
    />
  );
}
