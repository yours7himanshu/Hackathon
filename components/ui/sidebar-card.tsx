import React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SidebarCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function SidebarCard({
  title,
  description,
  icon,
  href,
  onClick,
  className
}: SidebarCardProps) {
  const sharedClasses = cn(
    "flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg", 
    "bg-sidebar-accent hover:bg-primary/10 transition-colors",
    "border border-sidebar-border cursor-pointer",
    "active:scale-[0.98] touch-manipulation",
    className
  );

  const content = (
    <>
      {icon && (
        <div className="flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-md bg-primary/20 text-primary shrink-0">
          {icon}
        </div>
      )}
      <div className="space-y-0.5 md:space-y-1 min-w-0">
        <h3 className="font-medium text-sidebar-foreground text-sm md:text-base line-clamp-1">{title}</h3>
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{description}</p>
      </div>
    </>
  );

  return href ? (
    <Link href={href} className={sharedClasses}>
      {content}
    </Link>
  ) : (
    <div onClick={onClick} className={sharedClasses}>
      {content}
    </div>
  );
}
