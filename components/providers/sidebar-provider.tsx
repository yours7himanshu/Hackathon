"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sidebar } from '../sidebar';
import { SidebarToggle } from '../ui/sidebar-toggle';

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggle = () => setIsOpen(prev => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  
  // Handle body scroll locking when sidebar is open (on mobile)
  useEffect(() => {
    if (isOpen) {
      // Add class to prevent scrolling on mobile when sidebar is open
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [isOpen]);
  
  return (
    <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
      <SidebarToggle isOpen={isOpen} onClick={toggle} />
      <Sidebar isOpen={isOpen} onClose={close} />
    </SidebarContext.Provider>
  );
}
