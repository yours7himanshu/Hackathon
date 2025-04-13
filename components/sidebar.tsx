import React from 'react';
import { cn } from '@/lib/utils';
import { SidebarCard } from './ui/sidebar-card';
import { Search, FileText, BarChart, Settings, BookOpen, Code, X } from 'lucide-react';
import { Button } from './ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function Sidebar({ isOpen, onClose, className }: SidebarProps) {
  return (
    <>
      {/* Backdrop for mobile and tablet */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed top-0 right-0 z-50 h-full border-l border-sidebar-border",
          "w-full sm:max-w-[350px] md:max-w-[380px] lg:w-[320px]", // Responsive width
          "bg-sidebar-background",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        <div className="flex flex-col h-full p-4 sm:p-5 md:p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-sidebar-foreground">Quick Access</h2>
            {/* Close button for mobile */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="md:hidden" 
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <SidebarCard 
              title="New Research" 
              description="Start a new deep research session"
              icon={<Search className="h-5 w-5" />}
              href="/research/new"
            />
            
            <SidebarCard 
              title="Recent Documents" 
              description="Access your recently created documents"
              icon={<FileText className="h-5 w-5" />}
              href="/documents"
            />
            
            <SidebarCard 
              title="Analytics" 
              description="View insights from your research"
              icon={<BarChart className="h-5 w-5" />}
              href="/analytics"
            />
            
            <SidebarCard 
              title="Learning Resources" 
              description="Tutorials and guides for deep research"
              icon={<BookOpen className="h-5 w-5" />}
              href="/resources"
            />
            
            <SidebarCard 
              title="API Integration" 
              description="Connect with external tools and services"
              icon={<Code className="h-5 w-5" />}
              href="/api-docs"
            />
            
            <SidebarCard 
              title="Settings" 
              description="Configure your preferences"
              icon={<Settings className="h-5 w-5" />}
              href="/settings"
            />
          </div>
          
          {/* Extra padding at bottom for mobile to ensure all content is visible */}
          <div className="h-16 md:h-8"></div>
        </div>
      </div>
    </>
  );
}
