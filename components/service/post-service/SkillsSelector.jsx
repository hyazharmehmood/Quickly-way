'use client';

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X, Search, Plus, Loader2 } from 'lucide-react';
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
  const [requestingSkill, setRequestingSkill] = useState(false);

  useEffect(() => {
    fetchSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSkillIds]);

  const fetchSkills = async () => {
    try {
      if (initialSkillIds.length > 0) {
        const idsParam = initialSkillIds.join(',');
        const response = await api.get(`/skills?ids=${encodeURIComponent(idsParam)}`);
        if (response.data.success) {
          let skills = response.data.skills || [];
          const activeResponse = await api.get('/skills');
          if (activeResponse.data.success) {
            const skillMap = new Map();
            (activeResponse.data.skills || []).forEach(skill => skillMap.set(skill.id, skill));
            skills.forEach(skill => { if (!skillMap.has(skill.id)) skillMap.set(skill.id, skill); });
            skills = Array.from(skillMap.values());
          }
          setAllSkills(skills);
        }
      } else {
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

  const hasExactMatch = (query) =>
    allSkills.some(
      (s) => s.name.toLowerCase() === (query || '').trim().toLowerCase()
    );

  const handleRequestNewSkill = async () => {
    const name = searchQuery.trim();
    if (!name || name.length < 2) return;
    if (hasExactMatch(name)) {
      setSearchQuery('');
      return;
    }
    setRequestingSkill(true);
    try {
      const res = await api.post('/skills/request', { name });
      if (res.data.success && res.data.skill) {
        setAllSkills((prev) => {
          const next = [...prev, res.data.skill];
          next.sort((a, b) => a.name.localeCompare(b.name));
          return next;
        });
        onSkillsChange([...selectedSkills, res.data.skill.id]);
        setSearchQuery('');
        setOpen(false);
      }
    } catch (err) {
      console.error('Request skill error:', err);
    } finally {
      setRequestingSkill(false);
    }
  };

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
                  const isPending = skill && skill.approvalStatus === 'PENDING';
                  const isRejected = skill && skill.approvalStatus === 'REJECTED';
                  return (
                    <Badge
                      key={skillId}
                      variant="secondary"
                      className={cn(
                        "px-2 py-1 text-xs font-medium flex items-center gap-1 h-8 rounded-md",
                        isRejected && "bg-red-100 text-red-700 border-red-200",
                        isPending && !isRejected && "bg-amber-100 text-amber-700 border-amber-200",
                        !isPending && !isRejected && (isInactive ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-primary/10 text-primary border-primary/20")
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSkill(skillId);
                      }}
                    >
                      {skill ? skill.name : skillId}
                      {isRejected && <span className="text-[10px] opacity-70">(Rejected)</span>}
                      {isPending && !isRejected && <span className="text-[10px] opacity-70">(Pending)</span>}
                      {isInactive && !isPending && !isRejected && <span className="text-[10px] opacity-70">(inactive)</span>}
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
                <CommandEmpty>
                  {searchQuery.trim().length >= 2 ? (
                    <div className="flex flex-col gap-2 py-2 px-4">
                      <span>No skill &quot;{searchQuery.trim()}&quot;. Request it for approval.</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleRequestNewSkill}
                        disabled={requestingSkill}
                        className="w-fit"
                      >
                        {requestingSkill ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        <span className="">Request skill &quot;{searchQuery.trim()}&quot;</span>
                      </Button>
                    </div>
                  ) : (
                    'No skills found.'
                  )}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredSkills.map((skill) => {
                    const selected = isSelected(skill.id);
                    const inactive = !skill.isActive;
                    const pending = skill.approvalStatus === 'PENDING';
                    const rejected = skill.approvalStatus === 'REJECTED';
                    return (
                      <CommandItem
                        key={skill.id}
                        value={skill.name}
                        onSelect={() => toggleSkill(skill.id)}
                        className={cn("cursor-pointer", inactive && !selected && "opacity-70")}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                        <div className="flex items-center justify-between w-full gap-2">
                          <span>{skill.name}</span>
                          <span className="flex items-center gap-1.5 shrink-0">
                            {rejected && (
                              <Badge variant="destructive" className="text-xs">Rejected</Badge>
                            )}
                            {pending && !rejected && (
                              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">Pending</Badge>
                            )}
                            {inactive && !pending && !rejected && (
                              <Badge variant="outline" className="text-xs">Inactive</Badge>
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

      <p className="text-xs text-muted-foreground">
        Only approved skills appear for everyone. Your requested skills show as Pending until admin approves; Rejected skills stay visible only to you.
      </p>
    </div>
  );
}

