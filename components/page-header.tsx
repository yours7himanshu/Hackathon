'use client';

import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { ModelSelectSimple } from '@/components/model-select-simple';
import { UserAvatarSimple } from '@/components/user-avatar-simple';
import { DEFAULT_MODEL_NAME } from '@/lib/ai/models';

interface PageHeaderProps {
  title?: string;
}

export function PageHeader({ title = 'Analysis' }: PageHeaderProps) {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_NAME);
  
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex justify-between md:w-auto">
            <h2 className="text-xl font-bold tracking-tight md:hidden">
              {title}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <ModelSelectSimple 
                selectedModelId={selectedModel}
                onModelChange={setSelectedModel}
              />
            </div>
            <UserAvatarSimple />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
