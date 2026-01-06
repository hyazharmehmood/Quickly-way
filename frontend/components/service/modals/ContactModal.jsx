import React from 'react';
import { Phone, Mail, MessageSquare } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const ContactModal = ({ isOpen, onClose, providerName, onChatStart }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md rounded-[2.5rem] p-6 border-none shadow-2xl bg-white">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-xl font-bold text-gray-900 mt-4">Contact {providerName}</DialogTitle>
                    <DialogDescription className="text-gray-500 text-sm mb-4">
                        Choose how you'd like to get in touch
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 px-2">
                    <Button
                        variant="outline"
                        className="w-full flex items-center justify-start gap-4 p-4 h-auto rounded-2xl border-gray-100 hover:border-green-500 hover:bg-green-50 transition-all group bg-white"
                        onClick={() => alert(`Calling ${providerName} at +966 5X XXX XXXX...`)}
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-green-100 flex items-center justify-center text-gray-600 group-hover:text-green-600 transition-colors shrink-0">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-900">Call Mobile</div>
                            <div className="text-xs text-gray-500 font-normal">+966 5X XXX XXXX</div>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full flex items-center justify-start gap-4 p-4 h-auto rounded-2xl border-gray-100 hover:border-green-500 hover:bg-green-50 transition-all group bg-white"
                        onClick={() => alert(`Email interface for ${providerName} would open here.`)}
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-green-100 flex items-center justify-center text-gray-600 group-hover:text-green-600 transition-colors shrink-0">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-900">Send Email</div>
                            <div className="text-xs text-gray-500 font-normal">Response in ~2 hours</div>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full flex items-center justify-start gap-4 p-4 h-auto rounded-2xl border-gray-100 hover:border-green-500 hover:bg-green-50 transition-all group bg-white"
                        onClick={() => {
                            onClose();
                            onChatStart();
                        }}
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-green-100 flex items-center justify-center text-gray-600 group-hover:text-green-600 transition-colors shrink-0">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-900">Start Chat</div>
                            <div className="text-xs text-gray-500 font-normal">Instant messaging</div>
                        </div>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ContactModal;
