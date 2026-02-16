'use client';

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/utils';
import api from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

export function KeywordSelector({ 
  selectedKeywords = [], 
  onKeywordsChange,
  maxKeywords = 5,
  initialKeywordNames = [] // For editing: keyword names that were already selected
}) {
  const [open, setOpen] = useState(false);
  const [allKeywords, setAllKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestingKeyword, setRequestingKeyword] = useState(false);

  useEffect(() => {
    fetchKeywords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKeywordNames]);

  const fetchKeywords = async () => {
    try {

      const response = await api.get('/keywords');
      if (response.data.success) {
        setAllKeywords(response.data.keywords || []);
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter keywords based on search query
  const filteredKeywords = allKeywords
    .filter(keyword => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return keyword.keyword.toLowerCase().includes(query);
    })
    .sort((a, b) => a.keyword.localeCompare(b.keyword)); // Sort alphabetically

  const toggleKeyword = (keywordName) => {
    if (selectedKeywords.includes(keywordName)) {
      onKeywordsChange(selectedKeywords.filter(k => k !== keywordName));
    } else {
      if (selectedKeywords.length < maxKeywords) {
        onKeywordsChange([...selectedKeywords, keywordName]);
      }
    }
  };

  const removeKeyword = (keywordName) => {
    onKeywordsChange(selectedKeywords.filter(k => k !== keywordName));
  };

  const isSelected = (keywordName) => selectedKeywords.includes(keywordName);

  const hasExactMatch = (q) =>
    allKeywords.some((k) => k.keyword.toLowerCase() === (q || '').trim().toLowerCase());

  const handleRequestNewKeyword = async () => {
    const name = searchQuery.trim();
    if (!name || name.length < 2) return;
    if (hasExactMatch(name)) return;
    setRequestingKeyword(true);
    try {
      const res = await api.post('/keywords/request', { keyword: name });
      if (res.data.success && res.data.keyword) {
        const kw = res.data.keyword;
        setAllKeywords((prev) => {
          const next = [...prev, { ...kw, approvalStatus: kw.approvalStatus || 'PENDING' }];
          next.sort((a, b) => (a.keyword || '').localeCompare(b.keyword || ''));
          return next;
        });
        if (selectedKeywords.length < maxKeywords) {
          onKeywordsChange([...selectedKeywords, kw.keyword]);
        }
        setSearchQuery('');
        setOpen(false);
      }
    } catch (err) {
      console.error('Request keyword error:', err);
    } finally {
      setRequestingKeyword(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="keywords" className="">
        Positive keywords
      </Label>

      {/* Keywords Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-start h-11 min-h-[42px] py-2 px-3 rounded-lg",
              "flex flex-wrap gap-2 items-center border-input"
            )}
          >
            {selectedKeywords.length > 0 ? (
              <>
                {selectedKeywords.map((keywordName) => {
                  const keyword = allKeywords.find(k => k.keyword === keywordName);
                  const isPending = keyword && keyword.approvalStatus === 'PENDING';
                  const isRejected = keyword && keyword.approvalStatus === 'REJECTED';
                  return (
                    <Badge
                      key={keywordName}
                      variant="secondary"
                      className={cn(
                        "px-2 py-1 text-xs font-medium flex items-center gap-1 h-8 rounded-md",
                        isRejected && "bg-red-100 text-red-700 border-red-200",
                        isPending && !isRejected && "bg-amber-100 text-amber-700 border-amber-200",
                        !isPending && !isRejected && "bg-primary/10 text-primary border-primary/20"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeKeyword(keywordName);
                      }}
                    >
                      {keywordName}
                      {isRejected && <span className="text-[10px] opacity-70">(Rejected)</span>}
                      {isPending && !isRejected && <span className="text-[10px] opacity-70">(Pending)</span>}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeKeyword(keywordName);
                        }}
                        className="ml-1 hover:opacity-70 focus:outline-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
                {selectedKeywords.length < maxKeywords && (
                  <span className="text-muted-foreground text-sm">+ Add more</span>
                )}
                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </>
            ) : (
              <>
                <span className="text-muted-foreground">Select keywords...</span>
                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 rounded-xl overflow-hidden" align="start">
          <Command className="rounded-xl">
            <CommandInput 
              placeholder="Search keywords..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-[300px]">
              {loading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : filteredKeywords.length === 0 ? (
                <CommandEmpty>
                  {searchQuery.trim().length >= 2 ? (
                    <div className="flex flex-col px-2 gap-2 py-2">
                      <span>No keyword &quot;{searchQuery.trim()}&quot;. Request it for approval.</span>
                      <Button type="button" size="sm" variant="outline" onClick={handleRequestNewKeyword} disabled={requestingKeyword} className="w-fit">
                        {requestingKeyword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        <span className="">Request keyword &quot;{searchQuery.trim()}&quot;</span>
                      </Button>
                    </div>
                  ) : (
                    'No keywords found.'
                  )}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredKeywords.map((keyword) => {
                    const selected = isSelected(keyword.keyword);
                    const isMaxReached = selectedKeywords.length >= maxKeywords && !selected;
                    const pending = keyword.approvalStatus === 'PENDING';
                    const rejected = keyword.approvalStatus === 'REJECTED';
                    return (
                      <CommandItem
                        key={keyword.id}
                        value={keyword.keyword}
                        onSelect={() => { if (!isMaxReached) toggleKeyword(keyword.keyword); }}
                        className={cn("cursor-pointer", isMaxReached && "opacity-50 cursor-not-allowed")}
                        disabled={isMaxReached}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                        <div className="flex items-center justify-between w-full gap-2">
                          <span>{keyword.keyword}</span>
                          <span className="flex items-center gap-1.5 shrink-0">
                            {rejected && <Badge variant="destructive" className="text-xs">Rejected</Badge>}
                            {pending && !rejected && <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">Pending</Badge>}
                            {keyword.volume && !rejected && !pending && (
                              <Badge variant="outline" className="text-xs">{keyword.volume}</Badge>
                            )}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <p className="text-xs text-muted-foreground ">
        Only approved keywords appear for everyone. Your requested keywords show as Pending until admin approves.
        {selectedKeywords.length > 0 && ` (${selectedKeywords.length}/${maxKeywords} selected)`}
      </p>
    </div>
  );
}


