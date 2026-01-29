'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/utils';
import api from '@/utils/api';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { useRouter, usePathname } from 'next/navigation';

export function CategoryFilter({ 
  selectedCategory: externalSelectedCategory, 
  onSelectCategory: externalOnSelectCategory 
}) {
  const [internalSelectedCategory, setInternalSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const scrollContainerRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  // Use external state if provided, otherwise use internal state
  const selectedCategory = externalSelectedCategory !== undefined ? externalSelectedCategory : internalSelectedCategory;
  const handleSelectCategory = externalOnSelectCategory || setInternalSelectedCategory;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories?includeChildren=true&includeSkills=true');
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSkillClick = (skillSlug, categorySlug, subcategorySlug) => {
    handleSelectCategory(skillSlug);
    // Update URL with skill parameter
    router.push(`${pathname}?skill=${skillSlug}`);
  };


  if (loading) {
    return (
      <div className="w-full bg-background border-b border-border py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">

            <Skeleton className="h-10 w-16 rounded-md" />
            <div className="h-6 w-px bg-border mx-2" />
            <div className="flex-1 flex gap-3 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-md flex-shrink-0" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className=" bg-background border-b border-border py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                handleSelectCategory('All');
                router.push('/');
              }}
              variant="default"
              className="whitespace-nowrap px-6 py-2 rounded-md text-sm font-medium"
            >
              All
            </Button>
            <p className="text-sm text-muted-foreground ml-4">No categories available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background border-b border-border py-3 sm:py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
          {/* Fixed "All" Category */}
          <Button
            onClick={() => {
              handleSelectCategory('All');
              router.push('/');
            }}
            variant={selectedCategory === 'All' ? 'default' : 'outline'}
            className={cn(
              'whitespace-nowrap px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex-shrink-0 h-auto',
              selectedCategory === 'All'
                ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-0'
            )}
          >
            All
          </Button>

          {/* Vertical Separator */}
          <div className="h-6 w-px bg-border mx-2 hidden sm:block flex-shrink-0"></div>

          {/* Left Arrow */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleScroll('left')}
            className="hidden md:flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
          </Button>

          {/* Scrollable Categories with Mega Menu */}
          <div
            ref={scrollContainerRef}
            className="flex-1 flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1 min-w-0"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {categories.map((category) => {
              const hasSubcategories = category.children && category.children.length > 0;
              const isSelected = selectedCategory === category.slug;

              return (
                <HoverCard
                  key={category.id}
                  openDelay={200}
                  closeDelay={100}
                  onOpenChange={(open) => setHoveredCategory(open ? category.id : null)}
                >
                  <HoverCardTrigger asChild>
              <Button
                      variant="outline"
                className={cn(
                        'whitespace-nowrap px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex-shrink-0 h-auto relative group cursor-pointer',
                        'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-0',
                        hoveredCategory === category.id && 'bg-primary text-primary-foreground'
                      )}
                    >
                      <span className="truncate max-w-[120px] sm:max-w-none">{category.name}</span>
                      {hasSubcategories && (
                        <ChevronDown className="w-3 h-3 ml-1 inline-block opacity-70 flex-shrink-0" />
                      )}
                     
              </Button>
                  </HoverCardTrigger>

                  {hasSubcategories && (
                    <HoverCardContent
                      sideOffset={0}
                      align="start"
                      side="bottom"
                      className="p-0 mt-2  shadow-none border-none bg-popover"
                      style={{ 
                        width: 'min(calc(100vw - 2rem), 1200px)',
                        maxWidth: 'calc(100vw - 2rem)'
                      }}
                      collisionPadding={16}
                      avoidCollisions={true}
                    >
                      <div className="bg-popover">
                       

                        {/* Content Grid - Responsive */}
                        <div className="p-6 shadow-sm rounded-md sm:p-8 overflow-y-auto max-h-[70vh] sm:max-h-[80vh] bg-gradient-to-b from-background to-secondary/20">
                          {(() => {
                            const subcategories = category.children;
                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10">
                                {subcategories.map((subcategory) => (
                                  <div key={subcategory.id} className="space-y-4 group">
                                    {/* Subcategory Title with hover effect */}
                                    <div className="text-left w-full pb-2 border-b border-border/30 group-hover:border-primary/30 transition-colors">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors">
                                          {subcategory.name}
                                        </h4>
                                        
                                      </div>
                                    </div>

                                    {/* Skills */}
                                    {subcategory.skills && subcategory.skills.length > 0 && (
                                      <ul className="space-y-0.5">
                                        {subcategory.skills.slice(0, 6).map((skill) => (
                                          <li key={skill.id}>
                                            <button
                                              onClick={() => handleSkillClick(skill.slug, category.slug, subcategory.slug)}
                                              className="text-xs sm:text-sm cursor-pointer text-muted-foreground hover:text-primary hover:font-medium transition-all duration-200 text-left w-full py-1 px-2 -mx-2 rounded-md hover:bg-primary/5 group/item"
                                            >
                                              <span className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 group-hover/item:bg-primary group-hover/item:scale-150 transition-all"></span>
                                                {skill.name}
                                              </span>
                                            </button>
                                          </li>
                                        ))}
                                        
                                      </ul>
                                    )}

                                    {/* Show message if no skills */}
                                    {(!subcategory.skills || subcategory.skills.length === 0) && (
                                      <p className="text-xs text-muted-foreground/60 italic py-2">
                                        No skills available
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </HoverCardContent>
                  )}

                  {/* If no subcategories, show skills directly */}
                  {!hasSubcategories && category.skills && category.skills.length > 0 && (
                    <HoverCardContent
                      sideOffset={0}
                      align="start"
                      side="bottom"
                      className="p-0 m-0 border-t-2 border-primary rounded-t-none shadow-2xl bg-popover"
                      style={{ 
                        width: 'min(calc(100vw - 2rem), 20rem)',
                        maxWidth: 'calc(100vw - 2rem)'
                      }}
                      collisionPadding={16}
                    >
                      <div className="bg-popover">
                        {/* Header with gradient */}
                        <div className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
                          <h3 className="text-lg font-bold text-foreground">{category.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {category.skills.length} skills available
                          </p>
                        </div>

                        {/* Skills List */}
                        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] bg-gradient-to-b from-background to-secondary/20">
                          <ul className="space-y-1.5 sm:space-y-2">
                            {category.skills.map((skill) => (
                              <li key={skill.id}>
                                <button
                                  onClick={() => handleSkillClick(skill.slug, category.slug, null)}
                                  className="text-xs sm:text-sm cursor-pointer text-muted-foreground hover:text-primary hover:font-medium transition-all duration-200 text-left w-full py-2 px-3 -mx-3 rounded-md hover:bg-primary/5 group/item"
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 group-hover/item:bg-primary group-hover/item:scale-150 transition-all"></span>
                                    {skill.name}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </HoverCardContent>
                  )}
                </HoverCard>
              );
            })}
          </div>

          {/* Right Arrow */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleScroll('right')}
            className="hidden md:flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
          </Button>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
