"use client";

import React from 'react';
import { ArrowLeftRight } from 'lucide-react';

export const RoleSwitcher = ({ currentRole, onSwitch, isOpen, className = "px-4 mb-6" }) => {
    const isFreelancer = currentRole === 'freelancer';

    if (!isOpen) return (
        <div className="px-3 mb-4">
            <button
                onClick={onSwitch}
                className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center hover:bg-primary/20 transition-all shadow-sm"
                title={`Switch to ${isFreelancer ? 'Client' : 'Seller'}`}
            >
                <ArrowLeftRight className="w-5 h-5" />
            </button>
        </div>
    );

    return (
        <div className={`${className} animate-in slide-in-from-left-2 duration-300`}>
            <div className="relative bg-primary p-1 rounded-full flex items-center h-10 w-full select-none shadow-md overflow-hidden">
                {/* Sliding background */}
                <div
                    className="absolute h-8 bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                    style={{
                        width: 'calc(45% - 0px)',
                        transform: `translateX(${isFreelancer ? 'calc(100% + 8px)' : '0px'})`,
                        left: '3px'
                    }}
                />

                {/* Client Option */}
                <button
                    onClick={() => isFreelancer && onSwitch()}
                    className={`relative flex-1 text-sm font-semibold tracking-wide transition-colors duration-300 z-10 ${!isFreelancer ? 'text-primary' : 'text-white'}`}
                >
                    Buyer
                </button>

                {/* Seller Option */}
                <button
                    onClick={() => !isFreelancer && onSwitch()}
                    className={`relative flex-1 text-sm font-semibold tracking-wide transition-colors duration-300 z-10 ${isFreelancer ? 'text-primary' : 'text-white'}`}
                >
                    Seller
                </button>
            </div>
        </div>
    );
};

export default RoleSwitcher;
