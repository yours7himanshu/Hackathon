'use client';

import { useState, useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';

// Define our own message types since we're no longer using 'ai'
export interface Message {
  id?: string;
  content: string;
  role: 'system' | 'user' | 'assistant' | 'function' | 'data' | 'tool';
  createdAt?: Date;
  name?: string;
}

export interface Attachment {
  url?: string;
  name?: string;
  type: 'image' | 'file' | 'pdf';
  data?: File;
}

// Options for the useGroqChat hook
interface UseGroqChatOptions {
  id?: string;
  initialMessages?: Array<Message>;
  body?: Record<string, any>;
  headers?: HeadersInit;
  onResponse?: (response: Response) => void | Promise<void>;
  onFinish?: (message: Message) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
  experimental_throttle?: number;
}

// Function to parse SSE responses
const parseEventSourceMessage = (data: string) => {
  const result = data
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return { name: line, value: '' };
      const name = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      return { name, value };
    });

  let event = {};
  for (const { name, value } of result) {
    if (name === 'data') {
      if (value === '[DONE]') {
        return { type: 'done' };
      }
      try {
        const parsedValue = JSON.parse(value);
        event = { ...event, ...parsedValue };
      } catch (error) {
        console.error('Error parsing event data:', error);
      }
    }
  }

  return event;
};

// Helper function to add new messages to the existing messages array
function addMessage(messages: Message[], message: Message): Message[] {
  // If message has no id, create one
  if (!message.id) {
    message.id = nanoid();
  }
  return [...messages, message];
}

// Helper function to update message content in the messages array
function updateMessageContent(messages: Message[], id: string, content: string): Message[] {
  return messages.map(message => 
    message.id === id ? { ...message, content } : message
  );
}

// Main hook for chat functionality with Groq
export default function useGroqChat({
  id,
  initialMessages = [],
  body,
  headers,
  onResponse,
  onFinish,
  onError,
  experimental_throttle
}: UseGroqChatOptions) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [streamedMessage, setStreamedMessage] = useState<Message | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Function to append a new message to the chat
  const append = useCallback(async (message: Message | { content: string }) => {
    // If the message doesn't have a role, assume it's a user message
    const messageWithRole: Message = 'role' in message 
      ? message as Message 
      : { ...message, role: 'user' };
      
    // Add the message to our state
    setMessages(messages => addMessage(messages, messageWithRole));

    // Create a unique ID for this request
    const requestId = id || nanoid();

    try {
      setIsLoading(true);
      setError(null);
      
      // Create a new abort controller for this request
      const controller = new AbortController();
      setAbortController(controller);

      // Prepare the full messages array to send to the API
      const allMessages = [...messages, messageWithRole];
      
      // Make the fetch request to our custom API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          id: requestId,
          messages: allMessages,
          ...body
        }),
        signal: controller.signal,
      });

      // Handle any errors from the API
      if (!response.ok) {
        const error = new Error(`API error: ${response.status} ${response.statusText}`);
        setError(error);
        if (onError) await onError(error);
        setIsLoading(false);
        setAbortController(null);
        return null;
      }

      if (onResponse) await onResponse(response);

      // Prepare to handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      // Create a placeholder for the assistant's response
      const assistantMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        content: ''
      };
      
      setStreamedMessage(assistantMessage);
      setMessages(messages => addMessage(messages, assistantMessage));

      // Process the stream chunks
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Decode the chunk and add it to our buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete event stream messages
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
              const event = parseEventSourceMessage(line);
              
              if ('type' in event) {
                if (event.type === 'done') {
                  // Stream is finished
                  continue;
                }
                
                if (event.type === 'text') {
                  // Append new content to the message
                  assistantContent += event.content || '';
                  
                  // Update the message in state
                  setMessages(messages => 
                    updateMessageContent(messages, assistantMessage.id!, assistantContent)
                  );
                }
              }
            } catch (e) {
              console.error('Error parsing SSE message:', e);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      // Update the final message
      const finalMessage = {
        ...assistantMessage,
        content: assistantContent
      };
      
      setMessages(messages => 
        messages.map(msg => 
          msg.id === assistantMessage.id ? finalMessage : msg
        )
      );
      
      if (onFinish) await onFinish(finalMessage);
      
      return finalMessage;
    } catch (err) {
      // Handle any errors during the fetch or processing
      if (err.name === 'AbortError') {
        // Request was aborted, not an error to report
        return null;
      }
      
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (onError) await onError(error);
      return null;
    } finally {
      setIsLoading(false);
      setAbortController(null);
      setStreamedMessage(null);
    }
  }, [messages, id, headers, body, onResponse, onFinish, onError]);

  // Function to handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      if (!input.trim()) return;
      
      const currentInput = input;
      setInput('');
      await append({ content: currentInput });
    },
    [input, append]
  );

  // Function to stop an ongoing streaming response
  const stop = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  }, [abortController]);

  // Function to reload the last user message
  const reload = useCallback(async () => {
    // Find the last user message
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (!lastUserMessage) return;
    
    // Remove all messages after the last user message
    const messagesWithoutResponse = messages.slice(
      0,
      messages.findIndex(m => m.id === lastUserMessage.id) + 1
    );
    
    setMessages(messagesWithoutResponse);
    await append(lastUserMessage);
  }, [messages, append]);

  // Effect for throttling updates to avoid excessive re-renders
  useEffect(() => {
    // Implementation of throttle logic would go here if needed
  }, [experimental_throttle]);

  return {
    messages,
    append,
    error,
    input,
    setInput,
    handleSubmit,
    isLoading,
    stop,
    setMessages,
    reload,
  };
}