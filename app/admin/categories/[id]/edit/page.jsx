"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, X, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import api from '@/utils/api';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoryData, setCategoryData] = useState(null);
  const [openAccordionItem, setOpenAccordionItem] = useState('');
  
  // Form states
  const [mainCategoryName, setMainCategoryName] = useState('');
  const [mainCategoryIsActive, setMainCategoryIsActive] = useState(true);
  const [subcategories, setSubcategories] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [changedSubcategoryIndex, setChangedSubcategoryIndex] = useState(null);
  const [isAddSubcategoryDialogOpen, setIsAddSubcategoryDialogOpen] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  // Fetch category with full hierarchy
  const fetchCategory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/categories/${categoryId}?includeSkills=true`);
      
      if (response.data.success) {
        const category = response.data.category;
        setCategoryData(category);
        setMainCategoryName(category.name);
        setMainCategoryIsActive(category.isActive !== undefined ? category.isActive : true);
        
        // Set subcategories with skills
        const subcats = category.children || [];
        setSubcategories(subcats.map(subcat => ({
          id: subcat.id,
          name: subcat.name,
          isActive: subcat.isActive !== undefined ? subcat.isActive : true,
          skills: (subcat.skills || []).map(skill => ({
            id: skill.id,
            name: skill.name,
            isActive: skill.isActive !== undefined ? skill.isActive : true,
          })),
        })));
        
        // Set first subcategory as open if exists
        if (subcats.length > 0) {
          setOpenAccordionItem(`subcat-${subcats[0].id}`);
        }
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch category');
      router.push('/admin/categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  // Track which subcategory has changes
  const checkSubcategoryChanges = (subcatIndex) => {
    if (!categoryData) return false;
    const subcat = subcategories[subcatIndex];
    const original = categoryData.children?.find(c => c.id === subcat.id);
    if (!original) return false;
    
    // Check if name changed
    if (subcat.name !== original.name) return true;
    
    // Check if isActive changed
    if (subcat.isActive !== original.isActive) return true;
    
    // Check if skills changed
    const originalSkillNames = (original.skills || []).map(s => s.name).sort();
    const currentSkillNames = (subcat.skills || []).map(s => s.name.trim()).filter(Boolean).sort();
    if (JSON.stringify(originalSkillNames) !== JSON.stringify(currentSkillNames)) return true;
    
    // Check if any skill name or isActive changed
    for (const skill of subcat.skills) {
      if (skill.id) {
        const originalSkill = original.skills?.find(s => s.id === skill.id);
        if (originalSkill) {
          if (originalSkill.name !== skill.name.trim()) return true;
          if (originalSkill.isActive !== skill.isActive) return true;
        }
      }
    }
    
    return false;
  };

  // Handle main category update
  const handleSaveMainCategory = async () => {
    if (!mainCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    if (mainCategoryName === categoryData.name) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);
    try {
      const response = await api.patch(`/admin/categories/${categoryId}`, {
        name: mainCategoryName.trim(),
      });

      if (response.data.success) {
        toast.success('Category updated successfully');
        await fetchCategory(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(error.response?.data?.error || 'Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  // Handle subcategory update
  const handleSaveSubcategory = async (subcategoryIndex) => {
    const subcat = subcategories[subcategoryIndex];
    
    if (!subcat.name.trim()) {
      toast.error('Subcategory name is required');
      return;
    }

    // Check if there are actual changes
    if (!checkSubcategoryChanges(subcategoryIndex)) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);
    try {
      const originalSubcat = categoryData.children?.find(c => c.id === subcat.id);
      
      // Update subcategory name and isActive if changed
      const subcatNameChanged = originalSubcat && subcat.name !== originalSubcat.name;
      const subcatActiveChanged = originalSubcat && subcat.isActive !== originalSubcat.isActive;
      
      if (subcatNameChanged || subcatActiveChanged) {
        await api.patch(`/admin/categories/${subcat.id}`, {
          name: subcat.name.trim(),
          isActive: subcat.isActive,
        });
      }

      // Get current skills from database - fetch the subcategory with skills
      const currentResponse = await api.get(`/admin/categories/${subcat.id}`);
      const currentCategory = currentResponse.data.category;
      // Skills are directly on the category (subcategory) object
      const currentSkills = currentCategory.skills || [];
      const currentSkillNames = currentSkills.map(s => s.name);
      const newSkillNames = subcat.skills
        .map(s => s.name.trim())
        .filter(Boolean);

      // Find skills to add (new ones that don't exist)
      const skillsToAdd = newSkillNames.filter(name => !currentSkillNames.includes(name));
      
      // Find skills to remove (deleted ones)
      const skillsToRemove = currentSkills.filter(skill => 
        !newSkillNames.includes(skill.name)
      );

      // Add new skills
      if (skillsToAdd.length > 0) {
        await api.post(`/admin/categories/${subcat.id}/skills`, {
          skills: skillsToAdd.map(name => ({ name })),
        });
      }

      // Remove deleted skills (soft delete - set isActive to false)
      for (const skill of skillsToRemove) {
        await api.patch(`/admin/skills/${skill.id}`, {
          isActive: false,
        });
      }

      // Update existing skills if names or isActive changed
      for (const skill of subcat.skills) {
        if (skill.id && skill.name.trim()) {
          const originalSkill = currentSkills.find(s => s.id === skill.id);
          if (originalSkill) {
            const nameChanged = originalSkill.name !== skill.name.trim();
            const activeChanged = originalSkill.isActive !== skill.isActive;
            
            if (nameChanged || activeChanged) {
              await api.patch(`/admin/skills/${skill.id}`, {
                name: skill.name.trim(),
                isActive: skill.isActive,
              });
            }
          }
        }
      }

      toast.success('Subcategory updated successfully');
      await fetchCategory(); // Refresh data
      setChangedSubcategoryIndex(null);
    } catch (error) {
      console.error('Error updating subcategory:', error);
      toast.error(error.response?.data?.error || 'Failed to update subcategory');
    } finally {
      setSaving(false);
    }
  };

  // Update subcategory name
  const updateSubcategoryName = (index, name) => {
    const updated = [...subcategories];
    updated[index].name = name;
    setSubcategories(updated);
    setChangedSubcategoryIndex(index);
  };

  // Update subcategory isActive
  const updateSubcategoryIsActive = (index, isActive) => {
    const updated = [...subcategories];
    updated[index].isActive = isActive;
    setSubcategories(updated);
    setChangedSubcategoryIndex(index);
  };

  // Add skill to subcategory with validation
  const addSkill = (subcategoryIndex) => {
    const subcat = subcategories[subcategoryIndex];
    const skills = subcat.skills || [];
    
    // Check if previous skill is empty
    if (skills.length > 0) {
      const lastSkill = skills[skills.length - 1];
      if (!lastSkill.name || !lastSkill.name.trim()) {
        toast.error('Please fill the previous skill name before adding a new one');
        return;
      }
    }
    
    const updated = [...subcategories];
    updated[subcategoryIndex].skills = [
      ...skills,
      { id: null, name: '', isActive: true, isNew: true },
    ];
    setSubcategories(updated);
    setChangedSubcategoryIndex(subcategoryIndex);
    
    // Auto-open accordion if closed
    const accordionValue = `subcat-${subcat.id}`;
    if (openAccordionItem !== accordionValue) {
      setOpenAccordionItem(accordionValue);
    }
  };

  // Remove skill from subcategory
  const removeSkill = (subcategoryIndex, skillIndex) => {
    const updated = [...subcategories];
    updated[subcategoryIndex].skills = updated[subcategoryIndex].skills.filter(
      (_, i) => i !== skillIndex
    );
    setSubcategories(updated);
    setChangedSubcategoryIndex(subcategoryIndex);
  };

  // Update skill name
  const updateSkillName = (subcategoryIndex, skillIndex, name) => {
    const updated = [...subcategories];
    updated[subcategoryIndex].skills[skillIndex].name = name;
    setSubcategories(updated);
    setChangedSubcategoryIndex(subcategoryIndex);
  };

  // Update skill isActive
  const updateSkillIsActive = (subcategoryIndex, skillIndex, isActive) => {
    const updated = [...subcategories];
    updated[subcategoryIndex].skills[skillIndex].isActive = isActive;
    setSubcategories(updated);
    setChangedSubcategoryIndex(subcategoryIndex);
  };


  // Add new subcategory
  const handleAddSubcategory = async () => {
    if (!categoryId || !newSubcategoryName.trim()) {
      toast.error('Subcategory name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await api.post(`/admin/categories/${categoryId}/subcategories`, {
        subcategories: [{ name: newSubcategoryName.trim() }],
      });

      if (response.data.success) {
        toast.success('Subcategory added successfully');
        setIsAddSubcategoryDialogOpen(false);
        setNewSubcategoryName('');
        await fetchCategory();
      }
    } catch (error) {
      console.error('Error adding subcategory:', error);
      toast.error(error.response?.data?.error || 'Failed to add subcategory');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-in fade-in duration-500 space-y-2">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        {/* Main Category Card Skeleton */}
        <Card className="border-none rounded-[2rem]">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="flex items-center justify-between py-2 border-t">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Subcategories Card Skeleton */}
        <Card className="border-none rounded-[2rem]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-9 w-36" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-b pb-4">
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-2 flex-1">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full ml-auto" />
                    </div>
                  </div>
                  <div className="px-4 space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <div className="flex items-center gap-2 py-2 border-t">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-9 w-24" />
                      </div>
                      {[1, 2].map((j) => (
                        <div key={j} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                          <Skeleton className="h-10 flex-1" />
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-10 w-10 rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                      <Skeleton className="h-10 w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!categoryData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Category not found</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/categories')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Edit Category</h3>
            <p className="text-muted-foreground text-sm ">
              Manage category, subcategories, and skills
            </p>
          </div>
        </div>
      </div>

      {/* Main Category Section */}
      <Card className="border-none rounded-[2rem]">
        <CardHeader>
          <CardTitle>Main Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 ">
          <div className='flex items-center gap-2'><div className='flex-1 space-y-1'>
            <Label>Category Name *</Label>
            <Input
              value={mainCategoryName}
              onChange={(e) => setMainCategoryName(e.target.value)}
              placeholder="e.g., Programming & Tech"
     
            />
            <p className="text-xs text-muted-foreground ">
              Slug will be auto-generated from the name
            </p>
          </div>
          <div className="flex items-center gap-2">
              <Label htmlFor="category-active">Active</Label>
              <Switch
                id="category-active"
                checked={mainCategoryIsActive}
                onCheckedChange={setMainCategoryIsActive}
                disabled={saving}
              />
            </div></div>
          <div className="flex items-center justify-end py-2 border-t">
           
            <Button
              onClick={handleSaveMainCategory}
              disabled={
                saving ||
                (mainCategoryName === categoryData.name && mainCategoryIsActive === categoryData.isActive) ||
                !mainCategoryName.trim()
              }
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Category
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subcategories Tabs */}
      <Card className="border-none rounded-[2rem]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subcategories & Skills</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddSubcategoryDialogOpen(true)}
              disabled={saving}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Subcategory
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subcategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No subcategories yet</p>
              <Button
                variant="outline"
                onClick={() => setIsAddSubcategoryDialogOpen(true)}
                disabled={saving}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Subcategory
              </Button>
            </div>
          ) : (
            <Accordion
              type="single"
              value={openAccordionItem}
              onValueChange={setOpenAccordionItem}
              collapsible
              className="w-full"
            >
              {subcategories.map((subcat, subcatIndex) => {
                const hasChanges = checkSubcategoryChanges(subcatIndex);
                const isOpen = openAccordionItem === `subcat-${subcat.id}`;
                
                return (
                  <AccordionItem
                    key={subcat.id}
                    value={`subcat-${subcat.id}`}
                    className="border-b"
                  >
                    <AccordionTrigger className="hover:no-underline px-2 py-4">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-medium text-left">{subcat.name}</span>
                        {hasChanges && (
                          <Badge variant="secondary" className="ml-2 text-xs bg-orange-500">
                            Modified
                          </Badge>
                        )}
                        <Badge variant="outline" className="ml-auto text-xs mr-2">
                          {subcat.skills?.length || 0} skills
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4 pt-2">
                        {/* Subcategory Name */}
                      <div className='flex items-center gap-2'>  
                        <div className='flex-1 space-y-1'>
                          <Label>Subcategory Name *</Label>
                          <Input
                            value={subcat.name}
                            onChange={(e) => updateSubcategoryName(subcatIndex, e.target.value)}
                            placeholder="e.g., Website Development"
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Slug will be auto-generated from the name
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`subcat-active-${subcat.id}`}>Active</Label>
                          <Switch
                            id={`subcat-active-${subcat.id}`}
                            checked={subcat.isActive}
                            onCheckedChange={(checked) => updateSubcategoryIsActive(subcatIndex, checked)}
                            disabled={saving}
                          />
                        </div></div>

                        {/* Skills Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Skills</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addSkill(subcatIndex)}
                              disabled={saving}
                            >
                              <Plus className="w-4 h-4 " />
                              Add Skill
                            </Button>
                          </div>

                          {subcat.skills.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed rounded-lg">
                              <p className="text-muted-foreground mb-2">No skills yet</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addSkill(subcatIndex)}
                                disabled={saving}
                              >
                                <Plus className="w-4 h-4" />
                                Add First Skill
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {subcat.skills.map((skill, skillIndex) => (
                                <div
                                  key={skillIndex}
                                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border"
                                >
                                  <div className="flex-1">
                                    <Input
                                      value={skill.name}
                                      onChange={(e) =>
                                        updateSkillName(subcatIndex, skillIndex, e.target.value)
                                      }
                                      placeholder="e.g., React"
                                      disabled={saving}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Slug will be auto-generated
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor={`skill-active-${skillIndex}`} className="text-xs">
                                      Active
                                    </Label>
                                    <Switch
                                      id={`skill-active-${skillIndex}`}
                                      checked={skill.isActive !== undefined ? skill.isActive : true}
                                      onCheckedChange={(checked) =>
                                        updateSkillIsActive(subcatIndex, skillIndex, checked)
                                      }
                                      disabled={saving}
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeSkill(subcatIndex, skillIndex)}
                                    disabled={saving}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Save Button for this Subcategory - Only show if accordion is open */}
                        {isOpen && (
                          <div className="flex justify-end pt-4 border-t">
                            <Button
                              onClick={() => handleSaveSubcategory(subcatIndex)}
                              disabled={
                                saving ||
                                !checkSubcategoryChanges(subcatIndex) ||
                                !subcat.name.trim()
                              }
                              className="min-w-[140px]"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-2" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Add Subcategory Dialog */}
      <Dialog open={isAddSubcategoryDialogOpen} onOpenChange={setIsAddSubcategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subcategory</DialogTitle>
            <DialogDescription>
              Add a new subcategory to this category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Subcategory Name *</Label>
              <Input
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder="e.g., Website Development"
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSubcategoryName.trim()) {
                    handleAddSubcategory();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Slug will be auto-generated from the name
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddSubcategoryDialogOpen(false);
                setNewSubcategoryName('');
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSubcategory}
              disabled={saving || !newSubcategoryName.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subcategory
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

