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

export function RevisionDialog({ open, onOpenChange, order, onConfirm }) {
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleClose = (isOpen) => {
        if (!isOpen) setReason('');
        onOpenChange(isOpen);
    };

    const handleSubmit = async () => {
        if (!reason.trim()) return;
        setSubmitting(true);
        try {
            const result = await onConfirm(reason.trim());
            if (result?.success) {
                setReason('');
                onOpenChange(false);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Request Revision</DialogTitle>
                    <DialogDescription>
                        Request a revision for order {order?.orderNumber}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Revision Reason</Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="What needs to be revised?"
                            rows={4}
                            className="mt-2 rounded-xl"
                            disabled={submitting}
                        />
                    </div>
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
                            disabled={submitting || !reason.trim()}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className=" h-4 w-4 animate-spin" />
                                    Requesting...
                                </>
                            ) : (
                                'Request Revision'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
