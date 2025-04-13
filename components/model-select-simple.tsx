'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, CheckCircle } from 'lucide-react';
import { models, Model } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

export function ModelSelectSimple({
  selectedModelId,
  onModelChange,
  className,
}: {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedModel = models.find(model => model.id === selectedModelId) || models[0];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("flex justify-between items-center w-full h-9 px-3 gap-2", className)}
        >
          <div className="truncate max-w-[150px]">
            {selectedModel?.label.split('/').pop()}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <div className="p-2 text-sm text-muted-foreground">
          Select AI Model
        </div>
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            className="flex items-center justify-between p-2 cursor-pointer"
            onClick={() => {
              onModelChange(model.id);
              setOpen(false);
            }}
          >
            <div className="flex flex-col">
              <div className="font-medium">{model.label.split('/').pop()}</div>
              <div className="text-xs text-muted-foreground">{model.description}</div>
            </div>
            {model.id === selectedModelId && (
              <CheckCircle className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
