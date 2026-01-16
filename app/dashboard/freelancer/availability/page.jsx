import React from 'react';

// Simple static page - no client-side code to prevent build issues
export default function FreelancerAvailabilityPage() {
    const workingHours = [
        { day: 'Monday', hours: '09:00 AM - 06:00 PM', active: true },
        { day: 'Tuesday', hours: '09:00 AM - 06:00 PM', active: true },
        { day: 'Wednesday', hours: '09:00 AM - 06:00 PM', active: true },
        { day: 'Thursday', hours: '09:00 AM - 06:00 PM', active: true },
        { day: 'Friday', hours: '09:00 AM - 01:00 PM', active: true },
        { day: 'Saturday', hours: 'Closed', active: false },
        { day: 'Sunday', hours: 'Closed', active: false },
    ];

    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div>
                <h2 className="text-2xl font-normal text-foreground tracking-tight">Availability & Scheduling</h2>
                <p className="text-muted-foreground font-normal mt-1 text-sm">Control when you are visible to potential clients.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border-none rounded-[2rem] bg-card p-4">
                    <h3 className="text-xl font-normal mb-4">Working Hours</h3>
                    <div className="divide-y divide-border">
                        {workingHours.map((item) => (
                            <div key={item.day} className="px-4 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-base font-normal text-foreground">{item.day}</p>
                                    <p className={`text-sm font-normal mt-1 ${item.active ? 'text-muted-foreground' : 'text-destructive opacity-60'}`}>
                                        {item.hours}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-[2rem] border-none bg-primary text-primary-foreground p-10">
                        <h3 className="text-xl font-normal mb-2">Automated Payouts</h3>
                        <p className="text-sm opacity-80 font-normal mb-8 leading-relaxed max-w-[280px]">
                            Your earnings are automatically cleared and sent to your wallet every Friday at midnight.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
