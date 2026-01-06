"use client";

import React, { useState } from 'react';
import { Star, ThumbsUp, Flag, Trash2, TrendingUp, MessageSquare, CheckCircle2 } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ReviewsPage() {
    const [reviews, setReviews] = useState([
        { id: 'r1', reviewer: 'John Miller', rating: 5, date: '1 hour ago', comment: 'Absolutely brilliant work on the landscape design. Exceeded expectations!', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
        { id: 'r2', reviewer: 'Samantha Reed', rating: 2, date: '3 hours ago', comment: 'Response time was a bit slow, and the fix didnt hold up.', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
        { id: 'r3', reviewer: 'Kevin Spacey', rating: 4, date: 'Yesterday', comment: 'Good quality service, happy with the outcome overall.', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
    ]);

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Avg Rating" value="4.8" trend="+0.2 higher" icon={<TrendingUp />} />
                <MetricCard title="Moderated" value="1.2k" trend="Last 30 days" icon={<CheckCircle2 />} />
                <MetricCard title="Flagged" value="12" trend="Review queue" icon={<Flag className="text-destructive" />} />
                <MetricCard title="New Feed" value="4" trend="Just now" icon={<MessageSquare />} />
            </div>

            <Card className="rounded-[2.5rem] border-border overflow-hidden shadow-sm bg-card">
                <CardHeader className="p-10 border-b border-border flex flex-col md:flex-row justify-between items-center gap-6">
                    <CardTitle className="text-xl font-normal text-foreground">Feedback Hub</CardTitle>
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" className="px-5 py-1.5 bg-secondary/50 text-muted-foreground rounded-full text-[10px] font-normal uppercase tracking-widest border-border hover:bg-secondary">
                            All
                        </Button>
                        <Button variant="outline" size="sm" className="px-5 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-normal uppercase tracking-widest border-primary/20 hover:bg-primary/20">
                            Positive
                        </Button>
                        <Button variant="outline" size="sm" className="px-5 py-1.5 bg-destructive/10 text-destructive rounded-full text-[10px] font-normal uppercase tracking-widest border-destructive/20 hover:bg-destructive/20">
                            Negative
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border">
                    {reviews.map((review) => (
                        <div key={review.id} className="p-10 hover:bg-secondary/20 transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-5">
                                    <img src={review.avatar} alt="" className="w-14 h-14 rounded-[1.2rem] object-cover shadow-md border-2 border-background" />
                                    <div>
                                        <h4 className="text-lg font-normal text-foreground">{review.reviewer}</h4>
                                        <p className="text-xs text-muted-foreground font-normal uppercase tracking-widest mt-0.5">{review.date}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <div className="flex items-center gap-1 bg-secondary/50 px-3 py-1.5 rounded-xl shadow-inner">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-border'}`} strokeWidth={1} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-normal text-muted-foreground/60 uppercase tracking-widest">Verified Buyer</span>
                                </div>
                            </div>
                            <p className="text-lg text-foreground/80 leading-relaxed italic mb-8 font-normal px-1">"{review.comment}"</p>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-3">
                                    <Button variant="secondary" className="h-10 px-6 bg-primary/10 text-primary rounded-xl text-[10px] font-normal uppercase border border-primary/20 flex items-center gap-2 hover:bg-primary/20 transition-all">
                                        <ThumbsUp className="w-4 h-4" /> Feature Review
                                    </Button>
                                    <Button variant="outline" className="h-10 px-6 bg-secondary/50 text-muted-foreground rounded-xl text-[10px] font-normal uppercase border border-border flex items-center gap-2 transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20">
                                        <Flag className="w-4 h-4" /> Flag
                                    </Button>
                                </div>
                                <Button variant="ghost" size="icon" className="h-11 w-11 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
