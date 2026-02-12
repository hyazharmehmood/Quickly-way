'use client';

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X, Search } from 'lucide-react';
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

export function SkillsSelector({ 
  selectedSkills = [], 
  onSkillsChange,
  initialSkillIds = [] // For editing: skill IDs that were already selected (may include inactive)
}) {
  const [open, setOpen] = useState(false);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSkillIds]);

  const fetchSkills = async () => {
    try {
      // If editing and we have initial skill IDs, fetch them (including inactive)
      if (initialSkillIds.length > 0) {
        // Fetch skills by IDs
        const idsParam = initialSkillIds.join(',');
        const response = await api.get(`/skills?ids=${encodeURIComponent(idsParam)}`);
        if (response.data.success) {
          let skills = response.data.skills || [];
          
          // Also fetch all active skills to populate the dropdown
          const activeResponse = await api.get('/skills');
          if (activeResponse.data.success) {
            const activeSkills = activeResponse.data.skills || [];
            // Merge: active skills + initial skills (including inactive), avoiding duplicates
            const skillMap = new Map();
            activeSkills.forEach(skill => skillMap.set(skill.id, skill));
            skills.forEach(skill => {
              if (!skillMap.has(skill.id)) {
                skillMap.set(skill.id, skill);
              }
            });
            skills = Array.from(skillMap.values());
          }
          
          setAllSkills(skills);
        }
      } else {
        // Just fetch active skills for new service
        const response = await api.get('/skills');
        if (response.data.success) {
          setAllSkills(response.data.skills || []);
        }
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter skills based on search query (only search by skill name)
  const filteredSkills = allSkills
    .filter(skill => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return skill.name.toLowerCase().includes(query) || skill.slug.toLowerCase().includes(query);
    })
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

  const toggleSkill = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      onSkillsChange(selectedSkills.filter(s => s !== skillId));
    } else {
      onSkillsChange([...selectedSkills, skillId]);
    }
  };

  const removeSkill = (skillId) => {
    onSkillsChange(selectedSkills.filter(s => s !== skillId));
  };

  const isSelected = (skillId) => selectedSkills.includes(skillId);

  return (
    <div className="space-y-2">
      <Label htmlFor="skills" className="">
        Skills <span className="text-red-500">*</span>
      </Label>
      
      {/* Skills Dropdown */}
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
            {selectedSkills.length > 0 ? (
              <>
                {selectedSkills.map((skillId) => {
                  const skill = allSkills.find(s => s.id === skillId);
                  const isInactive = skill && !skill.isActive;
                  
                  return (
                    <Badge
                      key={skillId}
                      variant="secondary"
                      className={cn(
                        "px-2 py-1 text-xs font-medium flex items-center gap-1 h-8 rounded-md",
                        isInactive 
                          ? "bg-orange-100 text-orange-700 border-orange-200" 
                          : "bg-primary/10 text-primary border-primary/20"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSkill(skillId);
                      }}
                    >
                      {skill ? skill.name : skillId}
                      {isInactive && (
                        <span className="text-[10px] opacity-70">(inactive)</span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSkill(skillId);
                        }}
                        className="ml-1 hover:opacity-70 focus:outline-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </>
            ) : (
              <>
                <span className="text-muted-foreground">Select skills...</span>
                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 rounded-xl overflow-hidden" align="start">
          <Command className="rounded-xl">
            <CommandInput 
              placeholder="Search skills..." 
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
              ) : filteredSkills.length === 0 ? (
                <CommandEmpty>No skills found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredSkills.map((skill) => {
                    const selected = isSelected(skill.id);
                    const inactive = !skill.isActive;
                    
                    return (
                      <CommandItem
                        key={skill.id}
                        value={skill.name}
                        onSelect={() => {
                          toggleSkill(skill.id);
                        }}
                        className={cn(
                          "cursor-pointer",
                          inactive && !selected && "opacity-50"
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex items-center justify-between w-full">
                          <span>{skill.name}</span>
                          {inactive && (
                            <Badge variant="outline" className="text-xs ml-2">
                              Inactive
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
        Search and select skills from the list. Only active skills are shown, except for skills you've already selected.
      </p>
    </div>
  );
}

