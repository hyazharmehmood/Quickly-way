"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Check, XCircle, Loader2, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function SkillsPage() {
  const { user } = useAuthStore();
  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [formData, setFormData] = useState({ name: '', categoryId: '', mainCategoryId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterActive, setFilterActive] = useState(null);
  const [filterApproval, setFilterApproval] = useState(null); // null | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [togglingSkills, setTogglingSkills] = useState(new Set());
  const [approvingSkillId, setApprovingSkillId] = useState(null);
  const [rejectingSkillId, setRejectingSkillId] = useState(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [approveSkill, setApproveSkill] = useState(null);
  const [approveForm, setApproveForm] = useState({ mainCategoryId: '', categoryId: '' });
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  // Fetch categories with subcategories
  const fetchCategories = async () => {
    try {
    
      const response = await api.get('/admin/categories?includeSkills=true');
      if (response.data.success) {
        // Filter to show only root categories (parentId is null)
        const rootCategories = response.data.categories.filter(cat => !cat.parentId);
        setCategories(rootCategories);
        
        // Extract all subcategories (children) from all categories
        const allSubcategories = rootCategories.flatMap(cat => 
          (cat.children || []).map(subcat => ({
            ...subcat,
            mainCategoryName: cat.name,
            mainCategoryId: cat.id,
          }))
        );
        setSubcategories(allSubcategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch all skills (optional filters: isActive, approvalStatus)
  const fetchSkills = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterActive !== null) params.append('isActive', filterActive.toString());
      if (filterApproval) params.append('approvalStatus', filterApproval);

      const response = await api.get(`/admin/skills?${params.toString()}`);
      if (response.data.success) {
        setSkills(response.data.skills || []);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [filterActive, filterApproval]);

  // Filter skills by search query
  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle main category selection - update subcategories
  const handleMainCategoryChange = (mainCategoryId) => {
    const selectedCategory = categories.find(cat => cat.id === mainCategoryId);
    const categorySubcategories = selectedCategory?.children || [];
    
    setFormData({ 
      name: '', 
      categoryId: '', 
      mainCategoryId: mainCategoryId || '' 
    });
  };

  // Get subcategories for selected main category
  const getSubcategoriesForMainCategory = () => {
    if (!formData.mainCategoryId) return [];
    const selectedCategory = categories.find(cat => cat.id === formData.mainCategoryId);
    return selectedCategory?.children || [];
  };

  // Handle create
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Skill name is required');
      return;
    }

    if (!formData.categoryId) {
      toast.error('Subcategory is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/admin/skills', {
        name: formData.name.trim(),
        categoryId: formData.categoryId,
      });

      if (response.data.success) {
        toast.success('Skill created successfully');
        setIsCreateDialogOpen(false);
        setFormData({ name: '', categoryId: '', mainCategoryId: '' });
        fetchSkills();
      }
    } catch (error) {
      console.error('Error creating skill:', error);
      toast.error(error.response?.data?.error || 'Failed to create skill');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (skill) => {
    setSelectedSkill(skill);
    // Find the main category for this subcategory
    const subcategory = subcategories.find(sub => sub.id === skill.categoryId);
    const mainCategoryId = subcategory?.mainCategoryId || '';
    
    setFormData({ 
      name: skill.name, 
      categoryId: skill.categoryId,
      mainCategoryId: mainCategoryId,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      toast.error('Skill name is required');
      return;
    }

    if (!formData.categoryId) {
      toast.error('Category is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.patch(`/admin/skills/${selectedSkill.id}`, {
        name: formData.name.trim(),
        categoryId: formData.categoryId,
      });

      if (response.data.success) {
        toast.success('Skill updated successfully');
        setIsEditDialogOpen(false);
        setSelectedSkill(null);
        setFormData({ name: '', categoryId: '' });
        fetchSkills();
      }
    } catch (error) {
      console.error('Error updating skill:', error);
      toast.error(error.response?.data?.error || 'Failed to update skill');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (skill) => {
    // Add skill ID to toggling set
    setTogglingSkills(prev => new Set(prev).add(skill.id));
    
    try {
      const response = await api.patch(`/admin/skills/${skill.id}`, {
        isActive: !skill.isActive,
      });

      if (response.data.success) {
        toast.success(`Skill ${skill.isActive ? 'disabled' : 'enabled'} successfully`);
        fetchSkills();
      }
    } catch (error) {
      console.error('Error toggling skill status:', error);
      toast.error(error.response?.data?.error || 'Failed to update skill status');
    } finally {
      // Remove skill ID from toggling set
      setTogglingSkills(prev => {
        const next = new Set(prev);
        next.delete(skill.id);
        return next;
      });
    }
  };

  // Handle delete (soft delete)
  const handleDeleteClick = (skill) => {
    setSelectedSkill(skill);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/admin/skills/${selectedSkill.id}`);

      if (response.data.success) {
        toast.success('Skill disabled successfully');
        setIsDeleteDialogOpen(false);
        setSelectedSkill(null);
        fetchSkills();
      }
    } catch (error) {
      console.error('Error disabling skill:', error);
      toast.error(error.response?.data?.error || 'Failed to disable skill');
    }
  };

  const handleOpenApproveDialog = (skill) => {
    setApproveSkill(skill);
    const subcat = subcategories.find(s => s.id === skill.categoryId);
    const mainId = subcat?.mainCategoryId || skill.category?.parent?.id || (skill.category?.parentId == null ? skill.categoryId : '') || '';
    setApproveForm({
      mainCategoryId: mainId || '',
      categoryId: skill.categoryId || '',
    });
    setNewSubcategoryName('');
    setIsApproveDialogOpen(true);
  };

  const handleApproveMainCategoryChange = (mainCategoryId) => {
    setApproveForm({ mainCategoryId: mainCategoryId || '', categoryId: '' });
  };

  const getSubcategoriesForApprove = () => {
    if (!approveForm.mainCategoryId) return [];
    const main = categories.find(c => c.id === approveForm.mainCategoryId);
    return main?.children || [];
  };

  const handleApproveWithAssign = async () => {
    if (!approveSkill || !approveForm.categoryId) {
      toast.error('Please select a subcategory to assign the skill to');
      return;
    }
    setApprovingSkillId(approveSkill.id);
    try {
      const response = await api.patch(`/admin/skills/${approveSkill.id}`, {
        approvalStatus: 'APPROVED',
        categoryId: approveForm.categoryId,
      });
      if (response.data.success) {
        toast.success(`"${approveSkill.name}" approved and assigned to subcategory`);
        setIsApproveDialogOpen(false);
        setApproveSkill(null);
        setApproveForm({ mainCategoryId: '', categoryId: '' });
        fetchSkills();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve');
    } finally {
      setApprovingSkillId(null);
    }
  };

  const handleCreateSubcategoryAndApprove = async () => {
    const name = newSubcategoryName.trim();
    if (!approveSkill || !approveForm.mainCategoryId || !name) {
      toast.error('Enter a subcategory name');
      return;
    }
    setApprovingSkillId(approveSkill.id);
    try {
      const createRes = await api.post(`/admin/categories/${approveForm.mainCategoryId}/subcategories`, {
        subcategories: [{ name }],
      });
      if (createRes.data.success && createRes.data.subcategories?.length > 0) {
        const newSub = createRes.data.subcategories[0];
        const newCategoryId = newSub.id;
        const patchRes = await api.patch(`/admin/skills/${approveSkill.id}`, {
          approvalStatus: 'APPROVED',
          categoryId: newCategoryId,
        });
        if (patchRes.data.success) {
          toast.success(`"${approveSkill.name}" approved and assigned to new subcategory "${name}"`);
          setIsApproveDialogOpen(false);
          setApproveSkill(null);
          setApproveForm({ mainCategoryId: '', categoryId: '' });
          setNewSubcategoryName('');
          fetchSkills();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create subcategory or approve');
    } finally {
      setApprovingSkillId(null);
    }
  };

  const handleRejectSkill = async (skill) => {
    setRejectingSkillId(skill.id);
    try {
      const response = await api.patch(`/admin/skills/${skill.id}`, { approvalStatus: 'REJECTED' });
      if (response.data.success) {
        toast.success(`"${skill.name}" rejected — only requester will see it as Rejected`);
        fetchSkills();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject');
    } finally {
      setRejectingSkillId(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="heading-3">Skills</h3>
          <p className="text-muted-foreground font-normal text-sm">
            {loading ? 'Loading...' : `Showing all skills (${filteredSkills.length}${searchQuery ? ' matching search' : ''})`}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          variant="default"
          className=""
        >
          <Plus className="w-4 h-4" />
          Create Skill
        </Button>
      </div>

      <Card className="border-none shadow-none">
        <CardHeader className="p-0 py-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 "
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
          
              <Button
                variant={filterApproval === null ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterActive(null)
                  setFilterApproval(null)
                }}
                
              > 
                All
              </Button>
              <Button
                variant={filterApproval === 'PENDING' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterApproval('PENDING')}
              >
                Pending
              </Button>
              <Button
                variant={filterApproval === 'APPROVED' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterApproval('APPROVED')}
              >
                Approved
              </Button>
              <Button
                variant={filterApproval === 'REJECTED' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterApproval('REJECTED')}
              >
                Rejected
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
            <div className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                    <TableHead className="pl-6">Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Category / Subcategory</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead>Requested by</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(8)].map((_, i) => (
                    <TableRow key={i} className="border-b border-border">
                      <TableCell className="pl-6"><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <p className="text-muted-foreground">No skills found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Category / Subcategory</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Requested by</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSkills.map((skill) => (
                  <TableRow key={skill.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                    <TableCell className="pl-6 font-medium text-foreground">{skill.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{skill.slug}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {skill.category?.parent
                        ? `${skill.category.parent.name} / ${skill.category.name}`
                        : skill.category?.name || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={skill.approvalStatus === 'APPROVED' ? 'default' : skill.approvalStatus === 'PENDING' ? 'secondary' : 'destructive'}
                        className="rounded-full"
                      >
                        {skill.approvalStatus === 'PENDING' ? 'Pending' : skill.approvalStatus === 'APPROVED' ? 'Approved' : 'Rejected'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {skill.createdBy ? `${skill.createdBy.name || skill.createdBy.email || '—'}` : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={skill.isActive ? "default" : "secondary"} className="rounded-full">
                        {skill.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(skill.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-0.5">
                        {skill.approvalStatus === 'PENDING' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={approvingSkillId === skill.id || rejectingSkillId === skill.id}
                                className="h-8 gap-1"
                              >
                                {approvingSkillId === skill.id || rejectingSkillId === skill.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    Actions
                                    <ChevronDown className="w-4 h-4" />
                                  </>
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[140px]">
                              <DropdownMenuItem
                                onClick={() => handleOpenApproveDialog(skill)}
                                className="text-green-600 focus:text-green-600 cursor-pointer"
                              >
                                <Check className="w-4 h-4 " />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRejectSkill(skill)}
                                className="text-destructive focus:text-destructive cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(skill)}
                          title={skill.isActive ? 'Disable' : 'Enable'}
                          disabled={togglingSkills.has(skill.id)}
                          className="h-8 w-8 rounded-lg"
                        >
                          {togglingSkills.has(skill.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : skill.isActive ? (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(skill)}
                          className="h-8 w-8 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Skill</DialogTitle>
            <DialogDescription>
              Add a new skill to a category. Skill names must be unique within each category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Main Category</label>
              <Select
                value={formData.mainCategoryId}
                onValueChange={handleMainCategoryChange}
                disabled={isSubmitting || categoriesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a main category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.isActive).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.mainCategoryId && (
              <div>
                <label className="text-sm font-medium mb-2 block">Subcategory *</label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  disabled={isSubmitting || categoriesLoading || !formData.mainCategoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSubcategoriesForMainCategory()
                      .filter(sub => sub.isActive)
                      .map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {getSubcategoriesForMainCategory().length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No active subcategories found for this category
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">Skill Name *</label>
              <Input
                placeholder="e.g., React, Node.js, Python"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
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
                setIsCreateDialogOpen(false);
                setFormData({ name: '', categoryId: '', mainCategoryId: '' });
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={isSubmitting || !formData.categoryId || !formData.name.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
            <DialogDescription>
              Update the skill name or category. The slug will be automatically regenerated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Main Category</label>
              <Select
                value={formData.mainCategoryId}
                onValueChange={handleMainCategoryChange}
                disabled={isSubmitting || categoriesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a main category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.isActive).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.mainCategoryId && (
              <div>
                <label className="text-sm font-medium mb-2 block">Subcategory *</label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  disabled={isSubmitting || categoriesLoading || !formData.mainCategoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSubcategoriesForMainCategory()
                      .filter(sub => sub.isActive)
                      .map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {getSubcategoriesForMainCategory().length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No active subcategories found for this category
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">Skill Name *</label>
              <Input
                placeholder="e.g., React, Node.js, Python"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
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
                setIsEditDialogOpen(false);
                setSelectedSkill(null);
                setFormData({ name: '', categoryId: '', mainCategoryId: '' });
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={isSubmitting || !formData.categoryId || !formData.name.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve & Assign Dialog - assign skill to category/subcategory when approving */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve & Assign Skill</DialogTitle>
            <DialogDescription>
              Assign &quot;{approveSkill?.name}&quot; to the correct subcategory. Approved skills are visible under their subcategory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Main Category</label>
              <Select
                value={approveForm.mainCategoryId}
                onValueChange={handleApproveMainCategoryChange}
                disabled={approvingSkillId || categoriesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select main category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.isActive).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {approveForm.mainCategoryId && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Subcategory *</label>
                  <Select
                    value={approveForm.categoryId}
                    onValueChange={(v) => setApproveForm(f => ({ ...f, categoryId: v }))}
                    disabled={approvingSkillId || categoriesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSubcategoriesForApprove()
                        .filter(sub => sub.isActive)
                        .map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {getSubcategoriesForApprove().length === 0 && (
                  <p className="text-xs text-muted-foreground">No subcategories. Create one below.</p>
                )}
                <div className="border-t pt-4 space-y-2">
                  <label className="text-sm font-medium">Create new subcategory</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="New subcategory name"
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                      disabled={approvingSkillId}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCreateSubcategoryAndApprove}
                      disabled={!newSubcategoryName.trim() || approvingSkillId}
                    >
                      {approvingSkillId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create & Approve'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} disabled={approvingSkillId}>
              Cancel
            </Button>
            <Button
              onClick={handleApproveWithAssign}
              disabled={!approveForm.categoryId || approvingSkillId}
            >
              {approvingSkillId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve & Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Skill</AlertDialogTitle>
            <DialogDescription>
              Are you sure you want to disable "{selectedSkill?.name}"? This will hide it from sellers, but existing data will be preserved.
            </DialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

