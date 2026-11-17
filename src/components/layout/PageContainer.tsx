import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export interface PageContainerProps {
  children: ReactNode;
  bare?: boolean;
}

export function PageContainer({ children, bare = false }: PageContainerProps) {
  if (bare) {
    return <div className="min-h-full bg-ivory">{children}</div>;
  }

  return (
    <div className="flex min-h-full flex-col bg-ivory text-charcoal">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
}
