'use client';
import { useUser } from '@clerk/nextjs';

import { Chat } from '@/components/custom/chat';
import { generateUUID } from '@/lib/utils';

export default function ChatPage() {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null;
  const id = generateUUID();
  return <Chat id={id} isSignedIn={isSignedIn} initialMessages={[]} />;
}
