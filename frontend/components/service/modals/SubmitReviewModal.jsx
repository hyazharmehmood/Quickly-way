import React, { useState } from 'react';
import { Star, Send, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const SubmitReviewModal = ({ isOpen, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");

    const handleRating = (value) => {
        setRating(value);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] p-8 bg-white shadow-2xl border-none">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 mb-2 text-center">Share Your Experience</DialogTitle>
                    <DialogDescription className="text-gray-500 text-center text-sm mb-8 px-4">
                        Help the community by providing honest feedback about this service.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center mb-8">
                    <div className="flex gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => handleRating(star)}
                                className="transition-transform active:scale-90 focus:outline-none"
                            >
                                <Star
                                    className={`w-10 h-10 transition-colors ${(hoverRating || rating) >= star
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-200'
                                        }`}
                                    strokeWidth={1.5}
                                />
                            </button>
                        ))}
                    </div>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest min-h-[20px]">
                        {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : rating === 1 ? 'Poor' : 'Select Rating'}
                    </span>
                </div>

                <div className="space-y-6 mb-8">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Your Review</label>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell others about your experience..."
                            className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-0 text-base text-gray-700 resize-none h-32 leading-relaxed shadow-none placeholder:text-gray-400"
                        />
                    </div>
                </div>

                <Button
                    onClick={() => {
                        if (rating === 0) return alert("Please select a rating.");
                        if (!comment.trim()) return alert("Please write a short comment.");
                        onSubmit({ rating, comment });
                        setRating(0);
                        setComment("");
                    }}
            
                >
                    <Send className="w-5 h-5" /> Submit Review
                </Button>
            </DialogContent>
        </Dialog>
    );
}

export default SubmitReviewModal;
