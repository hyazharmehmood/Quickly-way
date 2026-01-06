"use client";

import React from 'react';
import { Star, MessageSquare, CornerDownRight, ThumbsUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function FreelancerReviewsPage() {
    const reviews = [
        { id: 'rev-1', user: 'Laura White', rating: 5, date: '2 days ago', comment: 'Amazing attention to detail and very fast delivery. Highly recommended!', reply: 'Thank you Laura! It was a pleasure working on your project.' },
        { id: 'rev-2', user: 'Mark Stevens', rating: 4, date: '1 week ago', comment: 'Great quality work, just a small delay in communication.', reply: null },
    ];

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div>
                <h2 className="text-2xl font-normal text-foreground tracking-tight">Client Feedback</h2>
                <p className="text-muted-foreground font-normal mt-1 text-sm">Review your performance and interact with clients.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="rounded-[2.5rem] border-border p-10 bg-card shadow-sm">
                    <div className="text-center mb-10">
                        <p className="text-sm font-normal text-muted-foreground uppercase tracking-widest mb-2">Overall Rating</p>
                        <h3 className="text-6xl font-normal text-foreground">4.9</h3>
                        <div className="flex justify-center gap-1 mt-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-4 font-normal">142 total reviews</p>
                    </div>

                    <div className="space-y-4">
                        {[5, 4, 3, 2, 1].map((stars) => (
                            <div key={stars} className="flex items-center gap-4">
                                <span className="text-sm font-normal text-muted-foreground w-4">{stars}</span>
                                <Progress value={stars === 5 ? 85 : stars === 4 ? 10 : 2} className="h-2 bg-secondary flex-1" />
                                <span className="text-xs font-normal text-muted-foreground w-8">{(stars === 5 ? 120 : stars === 4 ? 14 : 4)}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    {reviews.map((rev) => (
                        <Card key={rev.id} className="rounded-[2.5rem] border-border p-8 bg-card shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center font-normal text-foreground text-lg">
                                        {rev.user.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-normal text-foreground leading-tight">{rev.user}</h4>
                                        <div className="flex items-center gap-1 mt-1">
                                            {[...Array(rev.rating)].map((_, i) => (
                                                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            ))}
                                            <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-widest font-normal">{rev.date}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary h-8 px-3 rounded-lg text-xs font-normal">
                                    <ThumbsUp className="w-3.5 h-3.5 mr-1.5" /> Helpful
                                </Button>
                            </div>
                            <p className="text-lg text-foreground/80 leading-relaxed italic mb-8 font-normal">"{rev.comment}"</p>

                            {rev.reply ? (
                                <div className="bg-secondary/30 rounded-2xl p-6 border border-border/50 ml-8 relative">
                                    <div className="flex items-start gap-3">
                                        <CornerDownRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-normal">Your Reply</p>
                                            <p className="text-base text-foreground/80 font-normal">"{rev.reply}"</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Button className="ml-8 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl h-10 px-6 text-sm font-normal border border-primary/20">
                                    <MessageSquare className="w-4 h-4 mr-2" /> Write a Reply
                                </Button>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
