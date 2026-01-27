"use client";

import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Globe2, Link, ArrowUp, BarChart3, FileSearch, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import api from '@/utils/api';

export default function SEOPage() {
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedKeyword, setSelectedKeyword] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        keyword: '',
        volume: '',
        difficulty: '',
        rank: '',
        trend: 'stable',
        isActive: true,
    });

    useEffect(() => {
        fetchKeywords();
    }, []);

    const fetchKeywords = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/keywords');
            if (response.data.success) {
                setKeywords(response.data.keywords || []);
            }
        } catch (error) {
            console.error('Error fetching keywords:', error);
            toast.error('Failed to fetch keywords');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.keyword.trim()) {
            toast.error('Keyword is required');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.post('/admin/keywords', {
                keyword: formData.keyword.trim(),
                volume: formData.volume || null,
                difficulty: formData.difficulty || null,
                rank: formData.rank ? parseInt(formData.rank) : null,
                trend: formData.trend || null,
                isActive: formData.isActive,
            });

            if (response.data.success) {
                toast.success('Keyword created successfully');
                setIsCreateDialogOpen(false);
                setFormData({
                    keyword: '',
                    volume: '',
                    difficulty: '',
                    rank: '',
                    trend: 'stable',
                    isActive: true,
                });
                fetchKeywords();
            }
        } catch (error) {
            console.error('Error creating keyword:', error);
            toast.error(error.response?.data?.error || 'Failed to create keyword');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (keyword) => {
        setSelectedKeyword(keyword);
        setFormData({
            keyword: keyword.keyword,
            volume: keyword.volume || '',
            difficulty: keyword.difficulty || '',
            rank: keyword.rank?.toString() || '',
            trend: keyword.trend || 'stable',
            isActive: keyword.isActive,
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        if (!formData.keyword.trim()) {
            toast.error('Keyword is required');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.patch(`/admin/keywords/${selectedKeyword.id}`, {
                keyword: formData.keyword.trim(),
                volume: formData.volume || null,
                difficulty: formData.difficulty || null,
                rank: formData.rank ? parseInt(formData.rank) : null,
                trend: formData.trend || null,
                isActive: formData.isActive,
            });

            if (response.data.success) {
                toast.success('Keyword updated successfully');
                setIsEditDialogOpen(false);
                setSelectedKeyword(null);
                setFormData({
                    keyword: '',
                    volume: '',
                    difficulty: '',
                    rank: '',
                    trend: 'stable',
                    isActive: true,
                });
                fetchKeywords();
            }
        } catch (error) {
            console.error('Error updating keyword:', error);
            toast.error(error.response?.data?.error || 'Failed to update keyword');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            const response = await api.delete(`/admin/keywords/${selectedKeyword.id}`);
            if (response.data.success) {
                toast.success('Keyword deleted successfully');
                setIsDeleteDialogOpen(false);
                setSelectedKeyword(null);
                fetchKeywords();
            }
        } catch (error) {
            console.error('Error deleting keyword:', error);
            toast.error(error.response?.data?.error || 'Failed to delete keyword');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Organic Traffic" value="84.2k" trend="+12% this month" icon={<TrendingUp />} />
                <MetricCard title="Avg. Position" value="4.2" trend="Improved by 0.5" icon={<BarChart3 />} />
                <MetricCard title="Indexed Pages" value="1,240" trend="All pages indexed" icon={<Globe2 />} />
                <MetricCard title="Total Backlinks" value="3,450" trend="+156 new links" icon={<Link />} />
            </div>

            <Card className="border-none rounded-[2rem]">
                <CardHeader className="p-8 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <CardTitle className="text-xl font-normal text-foreground">Keyword Tracking</CardTitle>
                        <p className="text-muted-foreground font-normal mt-0.5 text-sm">Monitor search engine visibility for core terms</p>
                    </div>
                    <Button 
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="h-11 px-6 bg-primary text-primary-foreground rounded-[1rem] shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Keyword
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                                    <TableHead className="px-4 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Target Keyword</TableHead>
                                    <TableHead className="px-4 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Monthly Vol.</TableHead>
                                    <TableHead className="px-4 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Difficulty</TableHead>
                                    <TableHead className="px-4 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Current Rank</TableHead>
                                    <TableHead className="px-4 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Status</TableHead>
                                    <TableHead className="px-4 py-6 text-right text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {keywords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                            No keywords found. Click "Add Keyword" to create one.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    keywords.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-secondary/20 transition-colors group border-b border-border">
                                            <TableCell className="px-4 py-6">
                                                <div className="flex items-center gap-3">
                                                   
                                                    <span className="font-normal text-foreground text-base">{item.keyword}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-6 text-sm text-muted-foreground font-normal">{item.volume || '-'}</TableCell>
                                            <TableCell className="px-4 py-6">
                                                {item.difficulty ? (
                                                    <Badge variant="secondary" className={`px-3 py-1 rounded-full text-[9px] font-normal uppercase tracking-widest border ${item.difficulty === 'High' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                            item.difficulty === 'Medium' ? 'bg-orange-50/50 text-orange-600 border-orange-100' :
                                                                'bg-primary/10 text-primary border-primary/20'
                                                        }`}>
                                                        {item.difficulty}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-4 py-6 font-normal text-foreground text-sm">
                                                {item.rank ? `#${item.rank}` : '-'}
                                            </TableCell>
                                            <TableCell className="px-4 py-6">
                                                <Badge variant={item.isActive ? "default" : "secondary"}>
                                                    {item.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-4 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(item)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedKeyword(item);
                                                            setIsDeleteDialogOpen(true);
                                                        }}
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-border p-8 shadow-sm bg-card">
                <CardHeader className="p-0 mb-8 border-none bg-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                            <FileSearch className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-lg font-normal text-foreground">On-Page Optimization</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6 bg-secondary/30 rounded-[1.5rem] border-transparent hover:bg-card hover:border-border transition-all cursor-pointer group shadow-none">
                            <p className="font-normal text-foreground text-base mb-1">Missing Meta Tags</p>
                            <p className="text-sm text-muted-foreground font-normal">24 pages found with incomplete meta descriptions</p>
                            <div className="mt-4 flex items-center text-primary text-xs font-normal gap-1 group-hover:underline">
                                Run Audit <ArrowUp className="w-3 h-3 rotate-90" />
                            </div>
                        </Card>
                        <Card className="p-6 bg-secondary/30 rounded-[1.5rem] border-transparent hover:bg-card hover:border-border transition-all cursor-pointer group shadow-none">
                            <p className="font-normal text-foreground text-base mb-1">Sitemap Status</p>
                            <p className="text-sm text-muted-foreground font-normal">Sitemap.xml last crawled 12 hours ago</p>
                            <div className="mt-4 flex items-center text-primary text-xs font-normal gap-1 group-hover:underline">
                                Resubmit Sitemap <ArrowUp className="w-3 h-3 rotate-90" />
                            </div>
                        </Card>
                    </div>
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Keyword</DialogTitle>
                        <DialogDescription>
                            Add a new keyword for freelancers to use when creating gigs.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Keyword *</Label>
                            <Input
                                value={formData.keyword}
                                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                                placeholder="e.g., logo design"
                                className="mt-2"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Monthly Volume</Label>
                                <Input
                                    value={formData.volume}
                                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                                    placeholder="e.g., 12k"
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label>Difficulty</Label>
                                <Select
                                    value={formData.difficulty}
                                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                                >
                                    <SelectTrigger className="mt-2">
                                        <SelectValue placeholder="Select difficulty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Current Rank</Label>
                                <Input
                                    type="number"
                                    value={formData.rank}
                                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                                    placeholder="e.g., 1"
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label>Trend</Label>
                                <Select
                                    value={formData.trend}
                                    onValueChange={(value) => setFormData({ ...formData, trend: value })}
                                >
                                    <SelectTrigger className="mt-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="up">Up</SelectItem>
                                        <SelectItem value="down">Down</SelectItem>
                                        <SelectItem value="stable">Stable</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsCreateDialogOpen(false);
                                setFormData({
                                    keyword: '',
                                    volume: '',
                                    difficulty: '',
                                    rank: '',
                                    trend: 'stable',
                                    isActive: true,
                                });
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isSubmitting || !formData.keyword.trim()}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                        <DialogTitle>Edit Keyword</DialogTitle>
                        <DialogDescription>
                            Update the keyword information.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Keyword *</Label>
                            <Input
                                value={formData.keyword}
                                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                                placeholder="e.g., logo design"
                                className="mt-2"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Monthly Volume</Label>
                                <Input
                                    value={formData.volume}
                                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                                    placeholder="e.g., 12k"
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label>Difficulty</Label>
                                <Select
                                    value={formData.difficulty}
                                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                                >
                                    <SelectTrigger className="mt-2">
                                        <SelectValue placeholder="Select difficulty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Current Rank</Label>
                                <Input
                                    type="number"
                                    value={formData.rank}
                                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                                    placeholder="e.g., 1"
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label>Trend</Label>
                                <Select
                                    value={formData.trend}
                                    onValueChange={(value) => setFormData({ ...formData, trend: value })}
                                >
                                    <SelectTrigger className="mt-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="up">Up</SelectItem>
                                        <SelectItem value="down">Down</SelectItem>
                                        <SelectItem value="stable">Stable</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditDialogOpen(false);
                                setSelectedKeyword(null);
                                setFormData({
                                    keyword: '',
                                    volume: '',
                                    difficulty: '',
                                    rank: '',
                                    trend: 'stable',
                                    isActive: true,
                                });
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isSubmitting || !formData.keyword.trim()}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Keyword</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{selectedKeyword?.keyword}"? This will remove it from the list and freelancers won't be able to use it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
