"use client";

import { useUser } from '@clerk/nextjs';
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import cx from "classnames";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useContext, createContext } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { generateUUID } from "@/lib/utils";

// Remove db schema import as it's no longer needed
// Remove unused utility imports

import {
  InfoIcon,
  MenuIcon,
  MoreHorizontalIcon,
  PencilEditIcon,
  TrashIcon,
} from "./icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

// Sidebar context
const SidebarContext = createContext({ isOpen: true, setIsOpen: (_: boolean) => {} });
export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

// SidebarItem component for menu buttons
function SidebarItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition w-full text-left text-sm"
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center justify-center size-4">
        {icon}
      </div>
      <span className="text-zinc-200">{label}</span>
    </button>
  );
}

export const History = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { id } = useParams();
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebar();
  const router = useRouter();
  

  const { data: history, isLoading, mutate } = useSWR(isSignedIn ? "/api/history" : null, async (url) => {
    console.log('=== FRONTEND HISTORY DEBUG ===');
    console.log('Fetching chat history from:', url);
    const res = await fetch(url);
    if (!res.ok) {
      console.error('Failed to fetch history:', res.status, res.statusText);
      throw new Error("Failed to fetch");
    }
    const data = await res.json();
    console.log('Chat history response:', JSON.stringify(data, null, 2));
    console.log('History array length:', Array.isArray(data) ? data.length : 'Not an array');
    console.log('=== END FRONTEND HISTORY DEBUG ===');
    return data;
  }, { 
    fallbackData: [],
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 1000,
    errorRetryCount: 3,
    errorRetryInterval: 1000
  });

  // Listen for chat-history-updated event to refresh chat history
  useEffect(() => {
    const handler = () => {
      console.log('Chat history update event triggered');
      mutate();
    };
    window.addEventListener('chat-history-updated', handler);
    return () => window.removeEventListener('chat-history-updated', handler);
  }, [mutate]);

  // Handler for new chat
  const handleNewChat = async () => {
    const newId = generateUUID();
    
    // Save current chat to database before navigating (only if it has messages)
    if (id && typeof id === 'string') {
      try {
        // Check if current chat has any messages by fetching it
        const response = await fetch(`/api/chat?id=${encodeURIComponent(id)}`);
        if (response.ok) {
          const currentChat = await response.json();
          // Only save if the chat has actual messages
          if (currentChat.messages && currentChat.messages.length > 0) {
            console.log('Current chat has messages, preserving it');
          } else {
            console.log('Current chat has no messages, not saving empty chat');
          }
        }
      } catch (err) {
        console.log('Current chat does not exist yet or failed to fetch:', err);
      }
    }
    
    // Navigate to the new chat page
    router.push(`/chat/${newId}`);
    // No mutate here; chat will be saved after first message is sent
  };

  // Sidebar icons for collapsed state
  const sidebarIcons = [
    {
      label: "New chat",
      icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
      href: "/"
    },
    {
      label: "Search chats",
      icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
      href: "#"
    },
    {
      label: "Library",
      icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/></svg>,
      href: "#"
    }
  ];

  return (
    <>
      {/* Collapsed sidebar (icons only) */}
      {!isOpen && (
        <div className="fixed left-0 top-0 h-full w-16 flex flex-col items-center py-4 z-40 bg-transparent" style={{position: 'fixed'}}>
          <div className="sidebar-blink-line"></div>
          <Button variant="ghost" className="mb-4 hover:bg-transparent" onClick={() => setIsOpen(true)} aria-label="Open sidebar">
            <Image src="/favicon.ico" alt="ChatGPT Icon" width={28} height={28} className="mx-auto" style={{ transform: 'translateY(-10px)' }} />
          </Button>
          <div className="flex flex-col gap-4 items-center mt-2 -translate-y-3">
            {sidebarIcons.map((item, index) => (
              <Link
                href={item.href}
                key={`sidebar-${item.label}-${index}`}
                className="text-zinc-400 hover:text-white flex flex-col items-center"
                title={item.label}
              >
                {item.icon}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Open sidebar (full) */}
      {isOpen && (
        <div className="fixed left-0 top-0 h-full w-72 bg-zinc-900 flex flex-col py-4 z-40 border-r border-zinc-800 transition-all">
          <div className="flex flex-row items-center justify-between px-4 mb-4">
            <span className="text-lg font-bold text-white">Chat History</span>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Collapse sidebar">
              <MenuIcon />
            </Button>
          </div>
          <div className="px-3 mb-4 flex flex-col gap-1">
            <SidebarItem icon={
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4z" fill="none"/><path d="M12 5v14M5 12h14"/></svg>
            } label="New chat" onClick={handleNewChat} />
            <SidebarItem icon={
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            } label="Search chats" onClick={() => {}} />
            <SidebarItem icon={
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/></svg>
            } label="Library" onClick={() => {}} />
          </div>
          
          {/* Chats section */}
          <div className="px-2">
            <div className="text-xs text-zinc-400 px-2 pt-2 pb-1">Chats</div>
            {!user && <div className="text-zinc-500 text-sm">Login to see your chats.</div>}
            {user && isLoading && <div className="text-zinc-500 text-sm">Loading...</div>}
            {user && !isLoading && (!history || !Array.isArray(history) || history.length === 0) && (
              <div className="text-zinc-500 text-sm">
                No chats found.
                <br />
                <span className="text-xs">Debug: {history ? `Got ${Array.isArray(history) ? history.length : 'non-array'} items` : 'null/undefined'}</span>
                <br />
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/test-db');
                      const data = await res.json();
                      console.log('DB Debug:', data);
                      alert(`DB Debug: User=${data.userId}, UserChats=${data.userChatCount}, Total=${data.totalChatsInDB}`);
                    } catch (err) {
                      console.error('Debug error:', err);
                    }
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 underline mt-2"
                >
                  Debug DB
                </button>
              </div>
            )}
            {user && !isLoading && history && Array.isArray(history) && history.length > 0 && (
              <ul className="flex flex-col gap-1">
                {history.map((chat: any, index: number) => {
                  console.log(`Rendering chat ${index}:`, chat);
                  
                  // Ultra-defensive ID handling
                  let safeId = '';
                  try {
                    if (chat && chat.id) {
                      safeId = String(chat.id);
                    } else {
                      console.warn(`Chat ${index} has no valid ID:`, chat);
                      return null;
                    }
                  } catch (error) {
                    console.error(`Error processing chat ${index} ID:`, error);
                    return null;
                  }
                  
                  // Skip if ID is empty or invalid
                  if (!safeId || safeId === 'null' || safeId === 'undefined' || safeId === '""') {
                    console.warn(`Skipping chat ${index} with invalid ID:`, safeId);
                    return null;
                  }
                  
                  // Ultra-defensive preview handling - always show SOMETHING
                  let safePreview = 'No preview available';
                  try {
                    if (chat.preview) {
                      if (typeof chat.preview === 'string') {
                        safePreview = chat.preview;
                      } else if (Array.isArray(chat.preview)) {
                        safePreview = chat.preview.map((part: any) => String(part)).join(' ');
                      } else {
                        safePreview = String(chat.preview);
                      }
                    } else if (chat.raw) {
                      // Fallback to raw data if preview is missing
                      safePreview = `[Debug] ${String(chat.raw).substring(0, 50)}...`;
                    }
                  } catch (error) {
                    console.error(`Error processing chat ${index} preview:`, error);
                    safePreview = `[Error] Chat ID: ${safeId}`;
                  }
                  
                  // Ensure preview is never empty
                  if (!safePreview || safePreview.trim() === '') {
                    safePreview = `Chat ${safeId}`;
                  }

                  // Delete handler
                  const handleDelete = async (e: React.MouseEvent) => {
                    e.preventDefault();
                    try {
                      await fetch(`/api/chat?id=${encodeURIComponent(safeId)}`, { method: 'DELETE' });
                      mutate(); // Refresh chat history
                    } catch (err) {
                      toast.error('Failed to delete chat');
                    }
                  };

                  return (
                    <li key={safeId || `chat-${index}`}
                        className="group flex items-center justify-between hover:bg-zinc-800 rounded transition px-3 py-2">
                      <Link href={`/chat/${safeId}`} className={`flex-1 min-w-0 ${safeId === id ? 'text-white' : 'text-zinc-300'}`}>
                        <span className="truncate block text-sm" title={`ID: ${safeId}`}>
                          {safePreview || `Chat ${safeId}` || 'Untitled Chat'}
                        </span>
                        <span className="text-xs text-zinc-500 block">ID: {safeId}</span>
                      </Link>
                      <button
                        onClick={handleDelete}
                        title="Delete chat"
                        className="ml-2 p-1 rounded hover:bg-red-600 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                        style={{ lineHeight: 0 }}
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 8V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M10 8V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M14 8V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M3 6H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M5 6V16C5 17.1046 5.89543 18 7 18H13C14.1046 18 15 17.1046 15 16V6" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M8 6V4C8 2.89543 8.89543 2 10 2H10C11.1046 2 12 2.89543 12 4V6" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          
          {/* Upgrade plan */}
          <div className="p-4 border-t border-zinc-800 flex flex-col gap-2">
            <button className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="7" y1="17" x2="17" y2="7"/>
                <polyline points="7,7 17,7 17,17"/>
              </svg>
              Upgrade plan
            </button>
            <span className="text-xs text-zinc-500">More access to the best models</span>
          </div>
        </div>
      )}
    </>
  );
};
