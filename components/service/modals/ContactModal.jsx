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
import { toast } from 'sonner';

const ContactModal = ({ isOpen, onClose, providerName, providerEmail, providerPhone, onChatStart }) => {
    const handlePhoneClick = () => {
        const phone = (providerPhone || '').trim();
        if (phone) {
            window.location.href = `tel:${encodeURIComponent(phone)}`;
            onClose();
        } else {
            toast.error('Phone number not available');
        }
    };

    const handleEmailClick = () => {
        const email = (providerEmail || '').trim();
        if (email) {
            window.location.href = `mailto:${email}`;
            onClose();
        } else {
            toast.error('Email not available');
        }
    };

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
                        onClick={handlePhoneClick}
                        disabled={!providerPhone?.trim()}
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-green-100 flex items-center justify-center text-gray-600 group-hover:text-green-600 transition-colors shrink-0">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div className="text-left min-w-0">
                            <h4 className="heading-4 ">Call Mobile</h4>
                            <div className="text-xs text-gray-500 font-normal truncate">
                                {providerPhone?.trim() || 'Not available'}
                            </div>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full flex items-center justify-start gap-4 p-4 h-auto rounded-2xl border-gray-100 hover:border-green-500 hover:bg-green-50 transition-all group bg-white"
                        onClick={handleEmailClick}
                        disabled={!providerEmail?.trim()}
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-green-100 flex items-center justify-center text-gray-600 group-hover:text-green-600 transition-colors shrink-0">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div className="text-left min-w-0">
                            <h4 className="heading-4">Send Email</h4>
                            <div className="text-xs text-gray-500 font-normal truncate">
                                {providerEmail?.trim() || 'Not available'}
                            </div>
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
                            <h4 className="heading-4 ">Start Chat</h4>
                            <div className="text-xs text-gray-500 font-normal">Instant messaging</div>
                        </div>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ContactModal;
