'use client';

import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import type { Message as UIMessage, Attachment as UIAttachment, CreateMessage, ChatRequestOptions } from 'ai';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';

import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useBlockSelector } from '@/hooks/use-block';
import useGroqChat, { Message as GroqMessage, Attachment as GroqAttachment } from '@/hooks/use-groq-chat';

// Type adapter function to ensure compatibility between message types
function adaptMessages(messages: GroqMessage[]): UIMessage[] {
  return messages.map(msg => ({
    id: msg.id || '',
    content: msg.content,
    role: msg.role,
    createdAt: msg.createdAt,
    name: msg.name
  })) as UIMessage[];
}

// Adapter for attachments
function adaptAttachments(attachments: GroqAttachment[]): UIAttachment[] {
  return attachments.map(att => ({
    url: att.url || '',
    name: att.name || '',
    type: att.type
  })) as UIAttachment[];
}

// Adapter for the append function to match expected return type
async function adaptAppend(
  append: (message: GroqMessage | { content: string }) => Promise<GroqMessage | null>,
  message: UIMessage | CreateMessage,
  options?: ChatRequestOptions
): Promise<string | null | undefined> {
  const result = await append(message as GroqMessage);
  return result?.id || null;
}

// Adapter for the handleSubmit function
function adaptHandleSubmit(
  handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => Promise<void>
): (
  event?: { preventDefault?: () => void },
  options?: ChatRequestOptions
) => void {
  return (event, options) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    handleSubmit(event as any);
  };
}

// Adapter for the reload function
function adaptReload(
  reload: () => Promise<void>
): (options?: ChatRequestOptions) => Promise<string | null | undefined> {
  return async (options) => {
    await reload();
    return null;
  };
}

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  selectedReasoningModelId,
  selectedVisibilityType,
  isReadonly,

}: {
  id: string;
  initialMessages: Array<GroqMessage>;
  selectedModelId: string;
  selectedReasoningModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [searchMode, setSearchMode] = useState<'search' | 'deep-research'>('search');

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useGroqChat({
    id,
    body: { 
      id, 
      modelId: selectedModelId, 
      reasoningModelId: selectedReasoningModelId, 
      experimental_deepResearch: searchMode === 'deep-research' 
    },
    initialMessages,
    experimental_throttle: 100,
    onFinish: () => {
      mutate('/api/history');
    },
    onError: async (error: Error) => {
      if (error.message.includes('Too many requests')) {
        toast.error(
          'Too many requests. Please wait a few seconds before sending another message.',
        );
      } else {
        toast.error(`Error: ${error.message || 'An unknown error occurred'}`);

        if (error instanceof Response || 'status' in error) {
          try {
            const errorData = await (error as Response).json();
            console.error('Response error details:', errorData);
          } catch (e) {
            console.error('Could not parse error response:', e);
          }
        }
      }
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<GroqAttachment>>([]);
  const isBlockVisible = useBlockSelector((state) => state.isVisible);

  const handleSearchModeChange = (mode: 'search' | 'deep-research') => {
    setSearchMode(mode);
  };

  // Use the adapter to ensure type compatibility
  const compatibleMessages = adaptMessages(messages);
  const adaptedReload = adaptReload(reload);
  const adaptedHandleSubmit = adaptHandleSubmit(handleSubmit);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedModelId}
          selectedReasoningModelId={selectedReasoningModelId}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={compatibleMessages}
          setMessages={(newMessages) => setMessages(newMessages as any)}
          reload={adaptedReload}
          isReadonly={isReadonly}
          isBlockVisible={isBlockVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={adaptedHandleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={adaptAttachments(attachments)}
              setAttachments={setAttachments as any}
              messages={compatibleMessages}
              setMessages={setMessages as any}
              append={(message, options) => adaptAppend(append, message, options)}
              searchMode={searchMode}
              setSearchMode={handleSearchModeChange}
            />
          )}
        </form>
      </div>

      <Block
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={adaptedHandleSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={adaptAttachments(attachments)}
        setAttachments={setAttachments as any}
        append={(message, options) => adaptAppend(append, message, options)}
        messages={compatibleMessages}
        setMessages={setMessages as any}
        reload={adaptedReload}
        votes={votes}
        isReadonly={isReadonly}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
      />
    </>
  );
}
