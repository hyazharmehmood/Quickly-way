'use client';

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
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

  useEffect(() => {
    fetchKeywords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKeywordNames]);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      
      // Fetch all active keywords
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

  return (
    <div className="space-y-2">
      <label className="block text-base font-medium text-foreground">
        Positive keywords
      </label>
      
      {/* Keywords Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-start h-auto min-h-[42px] py-2 px-3",
              "flex flex-wrap gap-2 items-center"
            )}
          >
            {selectedKeywords.length > 0 ? (
              <>
                {selectedKeywords.map((keywordName) => {
                  const keyword = allKeywords.find(k => k.keyword === keywordName);
                  
                  return (
                    <Badge
                      key={keywordName}
                      variant="secondary"
                      className="px-2 py-1 text-xs font-medium flex items-center gap-1 h-6 bg-primary/10 text-primary border-primary/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeKeyword(keywordName);
                      }}
                    >
                      {keywordName}
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
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
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
                <CommandEmpty>No keywords found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredKeywords.map((keyword) => {
                    const selected = isSelected(keyword.keyword);
                    const isMaxReached = selectedKeywords.length >= maxKeywords && !selected;
                    
                    return (
                      <CommandItem
                        key={keyword.id}
                        value={keyword.keyword}
                        onSelect={() => {
                          if (!isMaxReached) {
                            toggleKeyword(keyword.keyword);
                          }
                        }}
                        className={cn(
                          "cursor-pointer",
                          isMaxReached && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={isMaxReached}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex items-center justify-between w-full">
                          <span>{keyword.keyword}</span>
                          {keyword.volume && (
                            <Badge variant="outline" className="text-xs ml-2">
                              {keyword.volume}
                            </Badge>
                          )}
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

      <p className="text-xs text-muted-foreground mt-1">
        {maxKeywords} keywords maximum. Select from admin-managed keywords to get found.
        {selectedKeywords.length > 0 && ` (${selectedKeywords.length}/${maxKeywords} selected)`}
      </p>
    </div>
  );
}


