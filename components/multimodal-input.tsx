'use client';

import type { Attachment, CreateMessage, Message } from 'ai';
import type { ChatRequestOptions } from '@/lib/types';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { useDropzone } from 'react-dropzone';
import { Paperclip, Send, X, Search, Brain } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useBlockSelector } from '@/hooks/use-block';

import { sanitizeUIMessages } from '@/lib/utils';

import { ArrowUpIcon, StopIcon, GlobeIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { SuggestedActions } from './suggested-actions';
import equal from 'fast-deep-equal';
import { useDeepResearch } from '@/lib/deep-research-context';
import { DeepResearch } from './deep-research';
import { Telescope } from 'lucide-react';

type SearchMode = 'search' | 'deep-research';

interface Vote {
  id: string;
  messageId: string;
  value: number;
}

interface ExtendedAttachment extends Attachment {
  type: string;
  url: string;
  name: string;
  contentType: string;
}

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  handleSubmit,
  isLoading,
  stop,
  attachments,
  setAttachments,
  append,
  messages,
  setMessages,
  reload,
  votes,
  isReadonly,
  searchMode,
  setSearchMode,
}: {
  chatId: string;
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>, options?: ChatRequestOptions) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: ExtendedAttachment[];
  setAttachments: (attachments: ExtendedAttachment[]) => void;
  append: (message: Message, options?: ChatRequestOptions) => Promise<string | null | undefined>;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  reload: () => void;
  votes: Vote[];
  isReadonly: boolean;
  searchMode: 'search' | 'deep-research';
  setSearchMode: (mode: 'search' | 'deep-research') => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { width } = useWindowSize();
  const { state: deepResearchState } = useDeepResearch();
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (input.trim()) {
        handleSubmit(e as any);
      }
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment): attachment is ExtendedAttachment => attachment !== undefined,
        );

        setAttachments([
          ...attachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, attachments],
  );

  const handleAttachmentsClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full">
      <Tabs
        value={searchMode}
        onValueChange={(value) => setSearchMode(value as 'search' | 'deep-research')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </TabsTrigger>
          <TabsTrigger value="deep-research" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Deep Research</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative flex w-full items-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
          accept="image/*,.pdf,.doc,.docx,.txt"
          multiple
        />

        <Textarea
          ref={textareaRef}
          tabIndex={0}
          rows={1}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={searchMode === 'search' ? 'Ask anything...' : 'Ask for deep research...'}
          spellCheck={false}
          className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {attachments.length > 0 && (
            <div className="flex items-center gap-1 mr-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {attachments.length} file{attachments.length !== 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setAttachments([])}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            size="icon"
            variant="outline"
            type="button"
            className="h-12 w-12 rounded-lg"
            disabled={isLoading}
            onClick={handleAttachmentsClick}
          >
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach files</span>
          </Button>

          <Button
            className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
            onClick={(event) => {
              event.preventDefault();
              handleSubmit(event as any, {
                experimental_attachments: attachments,
                experimental_deepResearch: searchMode === 'deep-research',
              });
            }}
            disabled={isLoading || input.trim() === '' || uploadQueue.length > 0}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border"
            >
              {attachment.type.startsWith('image/') ? (
                <img
                  src={attachment.url}
                  alt={`Attachment ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-xs text-muted-foreground">
                    {attachment.type.split('/')[1]}
                  </span>
                </div>
              )}
              <button
                onClick={() => handleRemoveAttachment(index)}
                className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const MultimodalInput = memo(PureMultimodalInput, equal);
