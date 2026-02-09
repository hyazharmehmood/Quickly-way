"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { STATUS_CONFIG } from './orderConstants';

export function OrderStatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_ACCEPTANCE;
    return (
        <Badge variant="secondary" className={config.color}>
            {config.label}
        </Badge>
    );
}
