"use client";

import React, { useState } from 'react';
import { AlertTriangle, Paperclip, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DESCRIPTION_MIN = 20;
const ATTACHMENTS_MAX = 5;

export function DisputeDialog({ open, onOpenChange, order, onSubmit }) {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const reset = () => {
        setReason('');
        setDescription('');
        setAttachments([]);
    };

    const handleClose = (isOpen) => {
        if (!isOpen) reset();
        onOpenChange(isOpen);
    };

    const removeAttachment = (index) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setAttachments((prev) => {
            const next = [...prev, ...files].slice(0, ATTACHMENTS_MAX);
            if (prev.length + files.length > ATTACHMENTS_MAX) toast.error(`Maximum ${ATTACHMENTS_MAX} files allowed`);
            return next;
        });
        e.target.value = '';
    };

    const handleSubmit = async () => {
        if (!reason.trim() || description.trim().length < DESCRIPTION_MIN) return;
        setSubmitting(true);
        try {
            const result = await onSubmit?.({ reason: reason.trim(), description: description.trim(), attachments });
            if (result?.success) {
                reset();
                onOpenChange(false);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit = reason.trim() && description.trim().length >= DESCRIPTION_MIN && !submitting;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl rounded-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-normal">Open a dispute</DialogTitle>
                            <DialogDescription className="mt-0.5">
                                Order {order?.orderNumber} · An admin will review and help resolve the issue.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="space-y-5 pt-2">
                    <p className="text-sm text-muted-foreground">
                        Normal chat will be locked. You’ll use the dispute thread to communicate with the seller and our team until the dispute is resolved.
                    </p>

                    <div className="space-y-2">
                        <Label className="">Quick select reason (optional)</Label>
                        <Select value="" onValueChange={(v) => v && setReason(v)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose a reason to fill in below..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Delivery not as described">Delivery not as described</SelectItem>
                                <SelectItem value="Late delivery">Late delivery</SelectItem>
                                <SelectItem value="Quality not as expected">Quality not as expected</SelectItem>
                                <SelectItem value="Communication or scope issue">Communication or scope issue</SelectItem>
                                <SelectItem value="Refund or payment concern">Refund or payment concern</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="">Reason *</Label>
                        <Input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Deliverables don’t match what was agreed"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="">Description *</Label>
                            <span className="text-xs text-muted-foreground">
                                {description.length} / {DESCRIPTION_MIN} min
                            </span>
                        </div>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what went wrong and what you expect..."
                            rows={4}
                            className="w-full resize-none"
                        />
                        {description.length > 0 && description.length < DESCRIPTION_MIN && (
                            <p className="text-xs text-amber-600">Add at least {DESCRIPTION_MIN - description.length} more characters.</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Evidence (optional)</Label>
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
                                <Paperclip className="h-4 w-4" />
                                <span>Add files</span>
                                <Input
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                    onChange={handleFileChange}
                                    className="sr-only"
                                />
                            </label>
                            <span className="text-xs text-muted-foreground">Up to {ATTACHMENTS_MAX} files</span>
                        </div>
                        {attachments.length > 0 && (
                            <ul className="mt-2 space-y-1.5 rounded-xl border border-border bg-secondary/20 p-2">
                                {attachments.map((file, idx) => (
                                    <li key={idx} className="flex items-center justify-between gap-2 text-sm">
                                        <span className="truncate text-foreground">{file.name}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
                                            onClick={() => removeAttachment(idx)}
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1 " onClick={() => handleClose(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="flex-1 w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={!canSubmit}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className=" h-4 w-4 animate-spin" />
                                    Opening dispute...
                                </>
                            ) : (
                                'Open dispute'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
