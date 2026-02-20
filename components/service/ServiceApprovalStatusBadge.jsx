'use client';

import { Badge } from '@/components/ui/badge';

/**
 * Global badge for service approval status.
 * Accepts API values (APPROVED, PENDING_APPROVAL, REJECTED) or display values (Approved, Requested, Rejected).
 */
export function ServiceApprovalStatusBadge({ status, className }) {
  const normalized = (status || '').toUpperCase().replace(/\s+/g, '_');
  switch (normalized) {
    case 'APPROVED':
      return (
        <Badge variant="secondary" className={`bg-green-500/10 text-green-700 border-green-500/20 ${className ?? ''}`.trim()}>
          Approved
        </Badge>
      );
    case 'PENDING_APPROVAL':
    case 'REQUESTED':
      return (
        <Badge variant="secondary" className={`bg-amber-500/10 text-amber-700 border-amber-500/20 ${className ?? ''}`.trim()}>
          Requested
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="destructive" className={`bg-destructive/10 text-destructive border-destructive/20 ${className ?? ''}`.trim()}>
          Rejected
        </Badge>
      );
    default:
      return <Badge className={className}>{status || '—'}</Badge>;
  }
}
