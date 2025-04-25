'use client';

import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';

import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';

import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useBlockSelector } from '@/hooks/use-block';
import useGroqChat, { Message as GroqMessage, Attachment } from '@/hooks/use-groq-chat';
import type { Message as UIMessage } from '@ai-sdk/ui-utils';

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

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isBlockVisible = useBlockSelector((state) => state.isVisible);

  const handleSearchModeChange = (mode: 'search' | 'deep-research') => {
    setSearchMode(mode);
  };

  // Use the adapter to ensure type compatibility
  const compatibleMessages = adaptMessages(messages);

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
          setMessages={(newMessages) => setMessages(newMessages as GroqMessage[])}
          reload={reload}
          isReadonly={isReadonly}
          isBlockVisible={isBlockVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={compatibleMessages}
              setMessages={(newMessages) => setMessages(newMessages as GroqMessage[])}
              append={append}
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
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={compatibleMessages}
        setMessages={(newMessages) => setMessages(newMessages as GroqMessage[])}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
      />
    </>
  );
}
