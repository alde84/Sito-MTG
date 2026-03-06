import { Suspense } from 'react';
import CardsPageInner from './CardsPageInner';

export default function CardsPage() {
  return (
    <Suspense fallback={null}>
      <CardsPageInner />
    </Suspense>
  );
}