'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';

export function ReviewModal({ 
  open, 
  onOpenChange, 
  orderId, 
  revieweeId, 
  revieweeName,
  isClientReview,
  existingReview,
  onReviewSubmitted,
  allowEdit = false // Default to false - clients cannot edit reviews
}) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
  }, [existingReview, open]);

  const handleSubmit = async (skip = false) => {
    if (!skip && rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    // Prevent editing if not allowed
    if (existingReview && !allowEdit) {
      toast.error('Reviews cannot be edited');
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    setIsSkipping(skip);

    try {
      if (existingReview && allowEdit) {
        // Update existing review - for now, we'll create a new one
        // TODO: Add update endpoint if needed
        await api.post('/reviews', {
          orderId,
          revieweeId,
          rating,
          comment: comment.trim() || null,
          isOrderReview: true,
          isClientReview,
        });
        toast.success('Review updated successfully!');
      } else {
        // Create new review
        if (!skip) {
          await api.post('/reviews', {
            orderId,
            revieweeId,
            rating,
            comment: comment.trim() || null,
            isOrderReview: true,
            isClientReview,
          });
          toast.success('Review submitted successfully!');
        } else {
          // Skip review - just close modal
          toast.info('Review skipped. You can review later from the order page.');
        }
      }

      if (!skip) {
        onReviewSubmitted?.();
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
      setIsSkipping(false);
    }
  };

  const handleSkip = () => {
    handleSubmit(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-normal">
            {existingReview && allowEdit ? 'Edit Review' : existingReview ? 'View Review' : `Review ${revieweeName}`}
          </DialogTitle>
          <DialogDescription>
            {existingReview && !allowEdit
              ? 'Your review has been submitted and cannot be edited'
              : existingReview && allowEdit
              ? 'Update your review for this order'
              : isClientReview
              ? 'Share your experience with the seller'
              : 'Share your experience with the client'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Rating {!existingReview && '*'}
            </Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => existingReview && !allowEdit ? null : setRating(star)}
                  onMouseEnter={() => existingReview && !allowEdit ? null : setHoveredRating(star)}
                  onMouseLeave={() => existingReview && !allowEdit ? null : setHoveredRating(0)}
                  className={`focus:outline-none transition-transform ${existingReview && !allowEdit ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'}`}
                  disabled={isSubmitting || (existingReview && !allowEdit)}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating} {rating === 1 ? 'star' : 'stars'}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment" className="">
              Comment (Optional)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => existingReview && !allowEdit ? null : setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
              disabled={isSubmitting || (existingReview && !allowEdit)}
              className="w-full resize-none"
              readOnly={existingReview && !allowEdit}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {!existingReview && (
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="flex-1 w-full"
              >
                Skip for Now
              </Button>
            )}
            {existingReview && !allowEdit ? (
              <Button
                onClick={() => onOpenChange(false)}
                className="flex-1 w-full"
              >
                Close
              </Button>
            ) : (
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || rating === 0}
                className="flex-1 w-full"
              >
                {isSubmitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

