"use client";

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INITIAL_DATA = { type: 'MESSAGE', message: '', fileUrl: '' };

export function DeliverDialog({ open, onOpenChange, order, onSuccess }) {
    const [data, setData] = useState(INITIAL_DATA);
    const [submitting, setSubmitting] = useState(false);

    const handleClose = (isOpen) => {
        if (!isOpen) setData(INITIAL_DATA);
        onOpenChange(isOpen);
    };

    const handleSubmit = async () => {
        if (!order) return;
        if (data.type === 'MESSAGE' && !data.message.trim()) return;
        if ((data.type === 'FILE' || data.type === 'LINK') && !data.fileUrl.trim()) return;

        setSubmitting(true);
        try {
            const result = await onSuccess({
                type: data.type,
                message: data.message,
                fileUrl: data.fileUrl,
                isRevision: order.status === 'REVISION_REQUESTED',
            });
            if (result?.success) {
                setData(INITIAL_DATA);
                onOpenChange(false);
            }
        } catch (_) {
            // Error handled by parent
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Submit Delivery</DialogTitle>
                    <DialogDescription>
                        Submit your work for order {order?.orderNumber}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Delivery Type</Label>
                        <Select value={data.type} onValueChange={(v) => setData({ ...data, type: v })} disabled={submitting}>
                            <SelectTrigger className="mt-2 rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MESSAGE">Message</SelectItem>
                                <SelectItem value="FILE">File URL</SelectItem>
                                <SelectItem value="LINK">Link</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {data.type === 'MESSAGE' && (
                        <div>
                            <Label>Delivery Message</Label>
                            <Textarea
                                value={data.message}
                                onChange={(e) => setData({ ...data, message: e.target.value })}
                                placeholder="Describe what you've delivered..."
                                rows={4}
                                className="mt-2 rounded-xl"
                                disabled={submitting}
                            />
                        </div>
                    )}
                    {(data.type === 'FILE' || data.type === 'LINK') && (
                        <div>
                            <Label>{data.type === 'FILE' ? 'File URL' : 'Link'}</Label>
                            <Input
                                value={data.fileUrl}
                                onChange={(e) => setData({ ...data, fileUrl: e.target.value })}
                                placeholder="https://..."
                                className="mt-2 rounded-xl"
                                disabled={submitting}
                            />
                        </div>
                    )}
                    <div className="flex gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => handleClose(false)}
                            className="flex-1 rounded-xl"
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="flex-1 rounded-xl"
                            disabled={submitting || (data.type === 'MESSAGE' && !data.message.trim()) || ((data.type === 'FILE' || data.type === 'LINK') && !data.fileUrl.trim())}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className=" h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Delivery'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
