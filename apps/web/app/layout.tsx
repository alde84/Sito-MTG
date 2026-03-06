import type { Metadata } from 'next';
import './styles/globals.css';

export const metadata: Metadata = {
  title: 'AetherDeck — MTG Platform',
  description: 'Cerca carte, costruisci mazzi, monitora i prezzi e connettiti con la community italiana di Magic: The Gathering.',
  keywords: ['MTG', 'Magic The Gathering', 'mazzi', 'carte', 'prezzi', 'Cardmarket'],
  openGraph: {
    title: 'AetherDeck',
    description: 'La piattaforma MTG italiana',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
