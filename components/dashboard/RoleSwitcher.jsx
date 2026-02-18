"use client";

import React from 'react';
import { ArrowLeftRight } from 'lucide-react';

export const RoleSwitcher = ({ currentRole, onSwitch, isOpen, className = "px-4 mb-6" }) => {
    const isSellerView = currentRole === 'freelancer' || currentRole === 'seller';

    if (!isOpen) return (
        <div className="px-3 mb-4">
            <button
                onClick={onSwitch}
                className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center hover:bg-primary/20 transition-all shadow-sm"
                title={`Switch to ${isSellerView ? 'Client' : 'Seller'}`}
            >
                <ArrowLeftRight className="w-5 h-5" />
            </button>
        </div>
    );

    return (
        <div className={`${className} animate-in slide-in-from-left-2 duration-300`}>
            <div className="relative bg-primary p-[0.2rem]  rounded-full flex items-center  w-full select-none shadow-md overflow-hidden">
       
                <div
                    className=" flex justify-between items-center"
                    
                />

                {/* Client Option */}
                <button
                    onClick={() => isSellerView && onSwitch()}
                    className={` w-full px-2 py-1.5 rounded-full text-[13px]  transition-colors duration-300 z-10 ${!isSellerView ? 'text-primary  bg-white' : 'text-white '}`}
                >
                    Client
                </button>

                {/* Seller Option */}
                <button
                    onClick={() => !isSellerView && onSwitch()}
                    className={` w-full px-2 py-1.5 rounded-full text-[13px]   transition-colors duration-300 z-10 ${isSellerView ? 'text-primary  bg-white' : 'text-white '}`}
                >
                    Seller
                </button>
            </div>
        </div>
    );
};

export default RoleSwitcher;
