"use client";

import React from 'react';
import DashboardSidebar from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';

export const DashboardLayout = ({ children, menuItems, roleName }) => {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <DashboardSidebar menuItems={menuItems} roleName={roleName} />
            <div className="flex-1 flex flex-col min-w-0">
                <DashboardHeader />
                <main className="flex-1 p-8 overflow-y-auto no-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
