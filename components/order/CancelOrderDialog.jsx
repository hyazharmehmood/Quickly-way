"use client";

import React, { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from "@/components/ui/textarea";

export function CancelOrderDialog({ open, onOpenChange, order, onConfirm }) {
    const [reason, setReason] = useState('');

    const handleClose = (isOpen) => {
        if (!isOpen) setReason('');
        onOpenChange(isOpen);
    };

    const handleConfirm = async (e) => {
        e?.preventDefault?.();
        if (!reason.trim()) return;
        const result = await onConfirm(reason.trim());
        if (result?.success) {
            setReason('');
            onOpenChange(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={handleClose}>
            <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please provide a reason for cancelling order {order?.orderNumber}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Reason for cancellation..."
                        rows={4}
                        className="rounded-xl"
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={!reason.trim()}
                        className="rounded-xl"
                    >
                        Confirm Cancellation
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
