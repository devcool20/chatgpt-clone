'use client';

import { useUser, SignInButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function LoginModal() {
  const { isSignedIn, isLoaded } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

  useEffect(() => {
    // Only show modal once per session when user is not signed in
    if (isLoaded && !isSignedIn && !hasShownModal) {
      setShowModal(true);
      setHasShownModal(true);
    }
  }, [isLoaded, isSignedIn, hasShownModal]);

  useEffect(() => {
    // Hide modal when user signs in
    if (isSignedIn) {
      setShowModal(false);
    }
  }, [isSignedIn]);

  // Don't render anything if still loading
  if (!isLoaded) {
    return null;
  }

  return (
    <AlertDialog open={showModal} onOpenChange={setShowModal}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">Welcome to ChatGPT</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Please sign in to start chatting and access all features including chat history, file uploads, and personalized responses.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-col gap-2">
          <SignInButton mode="modal">
            <Button className="w-full">
              Sign In
            </Button>
          </SignInButton>
          <Button 
            variant="outline" 
            onClick={() => setShowModal(false)}
            className="w-full"
          >
            Continue as Guest
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 