"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Loader2, Trash2, Edit2, FolderTree, AlertTriangle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import api from '@/utils/api';
import useAuthStore from '@/store/useAuthStore';

export default function CategoriesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [filterActive, setFilterActive] = useState(null);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterActive !== null) {
        params.append('isActive', filterActive.toString());
      }
      params.append('includeSkills', 'true');
      
      const response = await api.get(`/admin/categories?${params.toString()}`);
      if (response.data.success) {
        // Filter to show only root categories (parentId is null)
        const rootCategories = response.data.categories.filter(cat => !cat.parentId);
        setCategories(rootCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [filterActive]);

  // Filter categories by search query
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle clear all
  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      const response = await api.delete('/admin/categories/clear');

      if (response.data.success) {
        toast.success(
          `Cleared ${response.data.deleted.categories} categories and ${response.data.deleted.skills} skills`
        );
        setIsClearDialogOpen(false);
        fetchCategories();
      }
    } catch (error) {
      console.error('Error clearing categories:', error);
      toast.error(error.response?.data?.error || 'Failed to clear categories');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="heading-3 ">Categories</h3>
          <p className="text-muted-foreground font-normal mt-1 text-sm">
            Manage hierarchical categories with subcategories and skills
          </p>
        </div>
        <div className="flex gap-2">
     
          <Button
          
            variant="default"
            onClick={() => router.push('/admin/categories/create')}
         
          >
            <Plus className="w-4 h-4 " />
            Create Hierarchy
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-none ">
        <CardHeader className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative w-full md:w-80 ">
              <Input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 "
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterActive === null ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterActive(null)}
              >
                All
              </Button>
              <Button
                variant={filterActive === true ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterActive(true)}
              >
                Active
              </Button>
              <Button
                variant={filterActive === false ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterActive(false)}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2].map((j) => (
                        <div key={j} className="pl-4 border-l-2 border-primary/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-6 w-6 rounded" />
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                          <div className="flex flex-wrap gap-2 ml-6">
                            {[1, 2, 3].map((k) => (
                              <Skeleton key={k} className="h-6 w-20 rounded-full" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <FolderTree className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No categories found</p>
              <p className="text-sm text-muted-foreground">
                Create your first category hierarchy to get started
              </p>
            </div>
          ) : (
            <div className="py-2 space-y-4">
              {filteredCategories.map((category) => (
                <Card key={category.id} className="border  shadow-none ">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              router.push(`/admin/categories/${category.id}/edit`);
                            }}
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={category.isActive ? "default" : "secondary"}
                          className={category.isActive ? "" : ""}
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {category.children && category.children.length > 0 ? (
                      <div className="space-y-4">
                        {category.children.map((subcat) => (
                          <div key={subcat.id} className="pl-4 border-l-2 border-primary/20">
                            <div className="flex items-center gap-2 mb-2">
                              <FolderTree className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{subcat.name}</span>
                              <Badge variant="" className="text-xs">
                                {subcat.skills?.length || 0} skills
                              </Badge>
                            </div>
                            {subcat.skills && subcat.skills.length > 0 && (
                              <div className="flex flex-wrap gap-2 ml-6">
                                {subcat.skills.map((skill) => (
                                  <Badge 
                                    key={skill.id} 
                                    variant="secondary" 
                                    className="text-xs"
                                  >
                                    {skill.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No subcategories</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear All Dialog */}
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Clear All Categories & Skills
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete ALL categories, subcategories, and skills from the database.
              This action cannot be undone. Are you absolutely sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isClearing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Yes, Clear All'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
