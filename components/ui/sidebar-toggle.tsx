import React from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface SidebarToggleProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export function SidebarToggle({ isOpen, onClick, className }: SidebarToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "fixed top-4 z-50 rounded-full shadow-md bg-card hover:bg-primary/10",
        "right-4 md:right-5 lg:right-6", // Responsive positioning
        "w-10 h-10 md:w-11 md:h-11", // Larger touch target on mobile
        className
      )}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      {isOpen ? (
        <X className="h-5 w-5 md:h-6 md:w-6" />
      ) : (
        <Menu className="h-5 w-5 md:h-6 md:w-6" />
      )}
    </Button>
  );
}
