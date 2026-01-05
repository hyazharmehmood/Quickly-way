'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';

const CATEGORIES = [
  'All',
  'Plumber',
  'AI',
  'Electrician',
  'Taxi',
  'Cloths',
  'Tuition',
  'SEO',
  'Yoga',
  'Logo Design',
  'Cleaning',
  'Web Dev',
  'Painter',
  'Carpenter',
  'Photographer',
  'Gardener',
  'Makeup Artist',
  'Dog Walker',
  'Handyman',
  'Translator',
  'Music Lessons',
  'Personal Trainer',
  'Landscaping',
  'Event Planner',
  'Catering',
  'Moving',
  'Babysitter',
  'Copywriting',
  'Marketing',
];

export function CategoryFilter({ selectedCategory: externalSelectedCategory, onSelectCategory: externalOnSelectCategory }) {
  const [internalSelectedCategory, setInternalSelectedCategory] = useState('All');
  const scrollContainerRef = useRef(null);

  // Use external state if provided, otherwise use internal state
  const selectedCategory = externalSelectedCategory !== undefined ? externalSelectedCategory : internalSelectedCategory;
  const handleSelectCategory = externalOnSelectCategory || setInternalSelectedCategory;

  // Separate 'All' from the rest of the categories
  const otherCategories = CATEGORIES.filter(c => c !== 'All');

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
        
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full bg-background py-4 md:py-6">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-hidden">
          {/* Fixed "All" Category */}
          <Button
            onClick={() => handleSelectCategory('All')}
            variant={selectedCategory === 'All' ? 'default' : 'outline'}
            className={cn(
              'whitespace-nowrap px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 flex-shrink-0 h-auto',
              selectedCategory === 'All'
                ? 'bg-[var(--category-selected)] text-[var(--category-selected-foreground)] shadow-md hover:bg-[var(--category-selected-hover)]'
                : 'bg-[var(--category-unselected)] text-[var(--category-unselected-foreground)] hover:bg-[var(--category-unselected-hover)] border-0'
            )}
          >
            All
          </Button>

          {/* Vertical Separator */}
          <div className="h-6 w-px bg-[var(--gray-300)] mx-2 hidden sm:block flex-shrink-0"></div>

          {/* Left Arrow */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleScroll('left')}
            className="hidden sm:flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={3} />
          </Button>

          {/* Scrollable List (Excluding 'All') */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 flex gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1 min-w-0"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {otherCategories.map((category) => (
              <Button
                key={category}
                onClick={() => handleSelectCategory(category)}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className={cn(
                  'whitespace-nowrap px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 flex-shrink-0 h-auto',
                  selectedCategory === category
                    ? 'bg-[var(--category-selected)] text-[var(--category-selected-foreground)] shadow-md hover:bg-[var(--category-selected-hover)]'
                    : 'bg-[var(--category-unselected)] text-[var(--category-unselected-foreground)] hover:bg-[var(--category-unselected-hover)] border-0'
                )}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Right Arrow */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleScroll('right')}
            className="hidden sm:flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" strokeWidth={3} />
          </Button>
        </div>
      </div>
    </div>
  );
}
