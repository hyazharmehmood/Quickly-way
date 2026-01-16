import React from 'react';

// Simple static page - no client-side code to prevent build issues
export default function BecomeSellerPage() {
    return (
        <div className="container mx-auto py-12 px-4 min-h-[70vh] flex flex-col justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-normal mb-4">Become a Seller</h1>
                <p className="text-muted-foreground mb-8">
                    This page requires JavaScript to be enabled. Please enable JavaScript to continue.
                </p>
            </div>
        </div>
    );
}
