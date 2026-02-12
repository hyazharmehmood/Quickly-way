"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import api from '@/utils/api';

export default function CreateCategoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for hierarchical creation
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
    subcategories: [],
  });

  // Add subcategory to form
  const addSubcategory = () => {
    setFormData({
      ...formData,
      subcategories: [
        ...formData.subcategories,
        {
          name: '',
          isActive: true,
          skills: [],
        },
      ],
    });
  };

  // Remove subcategory
  const removeSubcategory = (index) => {
    setFormData({
      ...formData,
      subcategories: formData.subcategories.filter((_, i) => i !== index),
    });
  };

  // Update subcategory
  const updateSubcategory = (index, field, value) => {
    const updated = [...formData.subcategories];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, subcategories: updated });
  };

  // Add skill to subcategory
  const addSkill = (subcategoryIndex) => {
    const updated = [...formData.subcategories];
    updated[subcategoryIndex].skills = [
      ...(updated[subcategoryIndex].skills || []),
      { name: '', isActive: true },
    ];
    setFormData({ ...formData, subcategories: updated });
  };

  // Remove skill from subcategory
  const removeSkill = (subcategoryIndex, skillIndex) => {
    const updated = [...formData.subcategories];
    updated[subcategoryIndex].skills = updated[subcategoryIndex].skills.filter(
      (_, i) => i !== skillIndex
    );
    setFormData({ ...formData, subcategories: updated });
  };

  // Update skill
  const updateSkill = (subcategoryIndex, skillIndex, field, value) => {
    const updated = [...formData.subcategories];
    updated[subcategoryIndex].skills[skillIndex] = {
      ...updated[subcategoryIndex].skills[skillIndex],
      [field]: value,
    };
    setFormData({ ...formData, subcategories: updated });
  };

  // Handle create full hierarchy
  const handleCreateHierarchy = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    // Validate subcategories
    for (let i = 0; i < formData.subcategories.length; i++) {
      const subcat = formData.subcategories[i];
      if (!subcat.name || !subcat.name.trim()) {
        toast.error(`Subcategory ${i + 1} name is required`);
        return;
      }

      // Validate skills
      for (let j = 0; j < subcat.skills.length; j++) {
        const skill = subcat.skills[j];
        if (!skill.name || !skill.name.trim()) {
          toast.error(`Skill ${j + 1} in subcategory "${subcat.name}" name is required`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/admin/category-full-create', {
        name: formData.name.trim(),
        isActive: formData.isActive,
        subcategories: formData.subcategories.map(subcat => ({
          name: subcat.name.trim(),
          isActive: subcat.isActive,
          skills: subcat.skills.map(skill => ({
            name: skill.name.trim(),
            isActive: skill.isActive,
          })),
        })),
      });

      if (response.data.success) {
        toast.success('Category hierarchy created successfully');
        router.push('/admin/categories');
      }
    } catch (error) {
      console.error('Error creating category hierarchy:', error);
      toast.error(error.response?.data?.error || 'Failed to create category hierarchy');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1 className="text-lg font-bold tracking-tight">Create Category Hierarchy</h1>
            <p className="text-muted-foreground text-sm">
              Create a complete category structure with subcategories and skills in one go
            </p>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-none">
        <CardContent className="p-4 space-y-4">
          {/* Main Category */}
          <div className="space-y-2">
            <div>
              <Label>Main Category Name *</Label>
              <Input
                placeholder="e.g., Programming & Tech"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
                className="h-11 mt-2 bg-secondary/50  border-none focus-visible:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Slug will be auto-generated from the name
              </p>
            </div>
          </div>

          {/* Subcategories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Subcategories</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubcategory}
                disabled={isSubmitting}
              >
                <Plus className="w-4 h-4" />
                Add Subcategory
              </Button>
            </div>

            {formData.subcategories.map((subcat, subcatIndex) => (
              <Card key={subcatIndex} className="p-3 border-none shadow-none">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Subcategory {subcatIndex + 1}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubcategory(subcatIndex)}
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <Label>Name *</Label>
                    <Input
                      placeholder="e.g., Website Development"
                      value={subcat.name}
                      onChange={(e) =>
                        updateSubcategory(subcatIndex, 'name', e.target.value)
                      }
                      disabled={isSubmitting}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Slug will be auto-generated from the name
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Skills</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSkill(subcatIndex)}
                        disabled={isSubmitting}
                      >
                        <Plus className="w-3 h-3" />
                        Add Skill
                      </Button>
                    </div>
                    {subcat.skills.map((skill, skillIndex) => (
                      <div
                        key={skillIndex}
                        className="flex gap-2 items-center p-2 bg-secondary/50 rounded-lg"
                      >
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs ">Skill Name *</Label>
                          <Input
                            placeholder="e.g., React"
                            value={skill.name}
                            onChange={(e) =>
                              updateSkill(subcatIndex, skillIndex, 'name', e.target.value)
                            }
                            disabled={isSubmitting}
                            className="h-9 "
                          />
                          <p className="text-xs text-muted-foreground">
                            Slug will be auto-generated
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSkill(subcatIndex, skillIndex)}
                          disabled={isSubmitting}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/categories')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateHierarchy} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create category'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

