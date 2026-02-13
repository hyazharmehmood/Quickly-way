'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, History, Sparkles } from 'lucide-react';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/utils';
import { getSearchHistory, addSearchHistory } from '@/lib/searchHistory';

const DEBOUNCE_MS = 80;

function HighlightedText({ text, parts }) {
  if (!parts?.length) return <span>{text}</span>;
  let seenMatch = false;
  return (
    <span>
      {parts.map((p, i) => {
        if (p.matched) {
          seenMatch = true;
          return (
            <strong key={i} className="font-semibold text-foreground">
              {p.text}
            </strong>
          );
        }
        return (
          <span
            key={i}
            className={seenMatch ? 'text-muted-foreground' : 'text-foreground'}
          >
            {p.text}
          </span>
        );
      })}
    </span>
  );
}

export function GlobalSearch({ className }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setValue(q);
  }, [searchParams]);
  const [suggestions, setSuggestions] = useState([]);
  const [recent, setRecent] = useState([]);
  const [trending, setTrending] = useState([]);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Load recent and trending on mount
  useEffect(() => {
    setRecent(getSearchHistory());
    fetch('/api/trending-searches')
      .then((r) => r.json())
      .then((d) => setTrending(d.keywords || []))
      .catch(() => {});
  }, []);

  const performSearch = useCallback(
    (term) => {
      const q = (term || value || '').trim();
      if (!q) return;
      setOpen(false);
      addSearchHistory(q);
      setRecent(getSearchHistory());
      // Record for trending
      fetch('/api/search-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: q }),
      }).catch(() => {});
      router.push(`/?q=${encodeURIComponent(q)}`);
    },
    [value, router]
  );

  const suggestionCacheRef = useRef(new Map());
  const latestQueryRef = useRef('');

  const fetchSuggestions = useCallback(async (q) => {
    const key = q.trim().toLowerCase();
    if (!key) {
      setSuggestions([]);
      return;
    }
    latestQueryRef.current = key;
    const cache = suggestionCacheRef.current;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < 60000) {
      setSuggestions(hit.data);
      return;
    }
    try {
      const res = await fetch(`/api/search-suggestions?q=${encodeURIComponent(key)}`);
      if (latestQueryRef.current !== key) return;
      const data = await res.json();
      const list = data.suggestions || [];
      cache.set(key, { data: list, ts: Date.now() });
      if (cache.size > 50) {
        const first = cache.keys().next().value;
        cache.delete(first);
      }
      setSuggestions(list);
    } catch {
      if (latestQueryRef.current === key) setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  const showRecentOrTrending = open && !value.trim();
  const showSuggestions = open && value.trim() && suggestions.length > 0;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch(value);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div ref={containerRef}  className={cn('relative w-full max-w-xl', className)}>
          <div
            className={cn(
              'relative flex items-center w-full rounded-full overflow-hidden transition-all duration-200',
              'border bg-background shadow-sm',
              open && 'ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-md'
            )}
          >
            <Input
              type="text"
              placeholder="Search for any service..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-11 sm:h-12 pl-4 sm:pl-5 pr-14 sm:pr-16 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/70 text-sm sm:text-base"
            />
            <Button
              type="button"
              variant="default"
              size="icon"
              className="absolute right-1 top-1/2 h-9 w-9 sm:h-10 sm:w-10 -translate-y-1/2 rounded-full shrink-0"
              onClick={() => performSearch(value)}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="p-0 rounded-2xl border shadow-xl bg-popover/95 backdrop-blur-sm overflow-hidden !w-[var(--radix-popover-anchor-width)] !max-w-[var(--radix-popover-anchor-width)]"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (containerRef.current?.contains(e.target)) {
            e.preventDefault();
          }
        }}
      >
        <Command shouldFilter={false} className="rounded-2xl border-0 bg-transparent w-full min-w-0">
          <CommandList className="max-h-[400px] w-full min-w-0 py-2 overflow-y-auto overflow-x-hidden">
            {/* Empty: show "POPULAR WITH BUSINESSES" pills (Fiverr-style) */}
            {showRecentOrTrending && recent.length === 0 && trending.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 px-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Start searching</span>
                <span className="text-xs text-muted-foreground text-center max-w-[200px]">
                  Find services by title, category, or skill
                </span>
              </div>
            )}
            {/* POPULAR WITH BUSINESSES - pills grid (Fiverr-style) */}
            {(showRecentOrTrending || (value.trim() && suggestions.length === 0)) &&
              trending.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Popular with businesses
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trending.slice(0, 8).map(({ keyword }) => (
                      <button
                        key={keyword}
                        type="button"
                        onClick={() => {
                          setValue(keyword);
                          performSearch(keyword);
                        }}
                        className="px-3 py-1.5 rounded-full text-sm font-medium bg-muted/80 hover:bg-muted text-foreground transition-colors border border-border/50"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            {showRecentOrTrending && recent.length > 0 && (
              <CommandGroup
                heading="Recent searches"
                className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {recent.slice(0, 5).map((term) => (
                  <CommandItem
                    key={term}
                    value={term}
                    onSelect={() => {
                      setValue(term);
                      performSearch(term);
                    }}
                    className="cursor-pointer gap-3 px-4 py-3 mx-2 rounded-xl hover:bg-accent/80 transition-colors [&[data-selected=true]]:bg-accent min-w-0"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <History className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm truncate block min-w-0">{term}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showSuggestions &&
              suggestions.map((s, i) => (
                <CommandItem
                  key={`${s.text}-${i}`}
                  value={s.text}
                  onSelect={() => {
                    setValue(s.text);
                    performSearch(s.text);
                  }}
                  className="cursor-pointer px-4 py-3 mx-2 rounded-lg hover:bg-accent/80 transition-colors [&[data-selected=true]]:bg-accent min-w-0"
                >
                  <div className="flex-1 min-w-0 text-sm truncate overflow-hidden">
                    <HighlightedText text={s.text} parts={s.parts} />
                  </div>
                </CommandItem>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
