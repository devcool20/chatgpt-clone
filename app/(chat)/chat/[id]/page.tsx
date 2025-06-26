'use client';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Chat } from '@/components/custom/chat';

export default function ChatDetailPage() {
  const { isSignedIn, isLoaded } = useUser();
  const params = useParams();
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [isMessagesLoaded, setIsMessagesLoaded] = useState(false);
  const chatId = params.id as string;

  useEffect(() => {
    async function fetchMessages() {
      if (!chatId) {
        setIsMessagesLoaded(true);
        return;
      }
      try {
        console.log('Fetching messages for chat ID:', chatId);
        const res = await fetch(`/api/chat?id=${encodeURIComponent(chatId)}`);
        if (res.ok) {
          const data = await res.json();
          console.log('Fetched chat data:', data);
          console.log('Raw messages from API:', data.messages);
          
          // Bulletproof message transformation - always flatten to string
          const transformedMessages = (data.messages || []).map((msg: any, index: number) => {
            let content = msg.content;

            // Always flatten to string
            if (typeof content === 'string') {
              // ok
            } else if (Array.isArray(content)) {
              content = content
                .map((item: any) => {
                  if (typeof item === 'string') return item;
                  if (item && typeof item === 'object') {
                    if (typeof item.text === 'string') return item.text;
                    if (typeof item.value === 'string') return item.value;
                  }
                  return '';
                })
                .join('');
            } else if (content && typeof content === 'object') {
              if (typeof content.text === 'string') content = content.text;
              else if (typeof content.value === 'string') content = content.value;
              else content = JSON.stringify(content);
            } else {
              content = String(content ?? '');
            }

            return {
              ...msg,
              content: content || 'Empty message'
            };
          });
          
          console.log('All transformed messages:', transformedMessages);
          setInitialMessages(transformedMessages);
        } else {
          console.log('Chat not found, starting with empty messages. Response status:', res.status);
          setInitialMessages([]);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        console.log('Error fetching messages, starting with empty messages');
        setInitialMessages([]);
      } finally {
        console.log('Setting isMessagesLoaded to true');
        setIsMessagesLoaded(true);
      }
    }
    fetchMessages();
  }, [chatId]);

  if (!isLoaded || !isMessagesLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#232325] to-[#18181a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {!isSignedIn && (
        <div className="flex flex-col items-center justify-center h-screen">
          <p>Please sign in to view this chat.</p>
          <SignInButton mode="modal">
            <button className="btn">Sign In</button>
          </SignInButton>
        </div>
      )}
      {isSignedIn && (
        <Chat 
          key={`${chatId}-${initialMessages.length}`} 
          id={chatId} 
          isSignedIn={isSignedIn} 
          initialMessages={initialMessages} 
        />
      )}
    </div>
  );
}
