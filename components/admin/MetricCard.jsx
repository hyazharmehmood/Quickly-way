import React from 'react';
import { ArrowUp } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

export const    MetricCard = ({ title, value, trend, icon }) => (
    <Card className=" border shadow-none">
        <CardContent className="p-4">
            <div className="flex justify-between items-start ">
                <div className="space-y-1">
                    <p className="text-muted-foreground whitespace-nowrap text-[14px] font-normal tracking-tight">{title}</p>
                    <h3 className="text-xl font-normal text-foreground tracking-tight leading-tight">{value}</h3>
                </div>
                <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-primary flex-shrink-0 transition-transform group-hover:scale-105">
                    {React.cloneElement(icon, { className: 'w-4 h-4', strokeWidth: 1.5 })}
                </div>
            </div>

            <div className="flex items-center gap-1 text-primary font-normal text-[12px] mt-0">
                <ArrowUp className="w-3 h-3" strokeWidth={3} />
                <span className="tracking-tight">{trend}</span>
            </div>
        </CardContent>
    </Card>
);

export default MetricCard;
