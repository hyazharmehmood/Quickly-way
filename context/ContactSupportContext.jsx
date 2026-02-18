'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ContactSupportDialog } from '@/components/support/ContactSupportDialog';

const ContactSupportContext = createContext({ openContactSupport: () => {} });

export function ContactSupportProvider({ children }) {
  const [open, setOpen] = useState(false);

  const openContactSupport = useCallback(() => setOpen(true), []);
  const closeContactSupport = useCallback(() => setOpen(false), []);

  return (
    <ContactSupportContext.Provider value={{ openContactSupport, closeContactSupport }}>
      {children}
      <ContactSupportDialog open={open} onOpenChange={setOpen} />
    </ContactSupportContext.Provider>
  );
}

export function useContactSupport() {
  const ctx = useContext(ContactSupportContext);
  if (!ctx) return { openContactSupport: () => {}, closeContactSupport: () => {} };
  return ctx;
}
