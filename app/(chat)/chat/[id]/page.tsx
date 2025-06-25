'use client';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import { Chat } from '@/components/custom/chat';

export default function ChatDetailPage() {
  const { isSignedIn, isLoaded } = useUser();
  const params = useParams();

  if (!isLoaded) return null;

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
      <Chat id={params.id as string} isSignedIn={isSignedIn} initialMessages={[]} />
    </div>
  );
}
