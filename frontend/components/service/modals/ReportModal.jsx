import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const ReportModal = ({ isOpen, onClose }) => {
    const [reason, setReason] = useState("");
    const [comment, setComment] = useState("");
    const [blockUser, setBlockUser] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setReason("");
            setComment("");
            setBlockUser(false);
        }
    }, [isOpen]);

    const reasons = [
        "Fraud",
        "Inexperienced",
        "Prohibited service",
        "Extremely poor service",
        "Inappropriate profile picture or images",
        "Unacceptable behavior",
        "Other"
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] p-8 bg-white shadow-2xl border-none max-h-[90vh] overflow-y-auto custom-scrollbar">
                <DialogHeader className="flex flex-row items-center justify-between mb-6 space-y-0">
                    <DialogTitle className="text-2xl font-bold text-[#002f34]">User Report</DialogTitle>
                </DialogHeader>

                {/* Radio Group */}
                <div className="mb-6">
                    <RadioGroup value={reason} onValueChange={setReason} className="space-y-4">
                        {reasons.map((r) => (
                            <div key={r} className="flex items-center space-x-3">
                                <RadioGroupItem value={r} id={r} className="border-gray-400 text-[#527d7f]" />
                                <Label htmlFor={r} className="text-[#002f34] text-base cursor-pointer font-normal">{r}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                {/* Comment */}
                <div className="mb-1">
                    <Textarea
                        placeholder="Comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value.slice(0, 500))}
                        className="w-full px-4 py-3 border-gray-300 rounded-lg focus-visible:ring-1 focus-visible:ring-[#10b981] focus-visible:ring-offset-0 text-base resize-none h-24 placeholder:text-gray-500 shadow-none"
                    />
                </div>
                <div className="text-xs text-gray-500 mb-6 text-left">
                    {comment.length}/500
                </div>

                {/* Block User */}
                <div className="flex items-center gap-3 mb-8">
                    <Checkbox
                        id="blockUser"
                        checked={blockUser}
                        onCheckedChange={setBlockUser}
                        className="w-6 h-6 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor="blockUser" className="text-gray-500 text-base font-normal cursor-pointer">I also want to block this user</Label>
                </div>

                {/* Submit */}
                <Button
                    onClick={() => {
                        alert("Complaint Sent Successfully!");
                        onClose();
                    }}
                >
                    Send Complaint
                </Button>
            </DialogContent>
        </Dialog>
    );
};

export default ReportModal;
