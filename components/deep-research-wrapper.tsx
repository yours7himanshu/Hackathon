'use client';

import { DeepResearchProvider } from '@/lib/deep-research-context';
import { ReactNode } from 'react';

interface DeepResearchWrapperProps {
  children: ReactNode;
}

export function DeepResearchWrapper({ children }: DeepResearchWrapperProps) {
  return <DeepResearchProvider>{children}</DeepResearchProvider>;
}
