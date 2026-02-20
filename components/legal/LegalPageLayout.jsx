'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/utils';

/** Distance from top of viewport (px) below which a section is considered "active" */
const SCROLL_OFFSET = 100;

export function LegalPageLayout({ title, lastUpdated, headings, children }) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? null);
  const scrollContainerRef = useRef(null);

  const updateActiveOnScroll = useCallback(() => {
    if (typeof document === 'undefined' || !headings?.length) return;
    let current = headings[0].id;
    for (let i = 0; i < headings.length; i++) {
      const el = document.getElementById(headings[i].id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      // Section is "active" when its top has passed this offset (i.e. we've scrolled it into view near the top)
      if (rect.top <= SCROLL_OFFSET) current = headings[i].id;
    }
    setActiveId(current);
  }, [headings]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    updateActiveOnScroll();
    container.addEventListener('scroll', updateActiveOnScroll, { passive: true });
    return () => container.removeEventListener('scroll', updateActiveOnScroll);
  }, [updateActiveOnScroll]);

  useEffect(() => {
    const t = setTimeout(updateActiveOnScroll, 100);
    return () => clearTimeout(t);
  }, [updateActiveOnScroll]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    const container = scrollContainerRef.current;
    if (el && container) {
      const rect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const targetScrollTop = container.scrollTop + (rect.top - containerRect.top) - 16;
      container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
    } else if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div ref={scrollContainerRef} className="h-[calc(100vh-10rem)] overflow-y-auto py-6 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* <Button variant="ghost" size="sm" className="mb-4 -ml-1 text-muted-foreground hover:text-foreground" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button> */}

        <div className="flex gap-4 lg:gap-4">
          {/* Left sidebar - sticky table of contents */}
          <aside className="hidden md:block w-52 lg:w-56 shrink-0">
            <nav className="sticky top-0 rounded-xl  border bg-card p-4 shadow-none">
              <p className="heading-6 text-muted-foreground mb-3 uppercase tracking-wider">On this page</p>
              <ul className="space-y-1">
                {headings.map(({ id, label }) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(id)}
                      className={cn(
                        'w-full text-left text-sm py-2 px-3 rounded-lg transition-colors truncate block',
                        activeId === id
                          ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Right content */}
          <main className="min-w-0 flex-1">
            <Card className="shadow-none border overflow-hidden">
              <CardHeader className=" bg-primary/10 text-primary font-medium  border-primary/20">
                <h2 className="heading-2 text-primary">{title}</h2>
                <CardDescription className="body text-muted-foreground mt-1">
                  Last updated: {lastUpdated}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-8 px-4 sm:px-6 space-y-8">
                {children}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
