'use client';

import { UserButton, SignInButton, useUser } from '@clerk/nextjs';
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { History, useSidebar } from "./history";
import { SlashIcon, MoreHorizontalIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const Navbar = () => {
  const { user, isSignedIn } = useUser();
  const { isOpen } = useSidebar();
  const params = useParams();
  const router = useRouter();

  // Delete conversation handler
  const handleDelete = () => {
    // You may want to call your API here to delete the conversation
    // For now, just redirect to home
    router.push("/");
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-full py-2 px-6 flex flex-row items-center z-50 bg-[#232323] m-0 border-none shadow-none">
        <div className="flex flex-row gap-3 items-center min-w-[72px]">
          <History />
        </div>
        <div className="flex flex-row items-center ml-0 mr-4">
          <div className={`text-[1.125rem] font-light text-white tracking-tight select-none transition-all duration-300`} style={{fontWeight: 300}}>ChatGPT</div>
          <svg className="ml-1" width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 8L10 12L14 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="text-zinc-300 text-base font-semibold select-none flex items-center gap-1" style={{fontWeight: 600}}>
            Saved memory full
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="inline-block ml-1 text-zinc-400"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">i</text></svg>
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          {/* Three dots menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full p-2 hover:bg-zinc-800 transition-colors" aria-label="More options">
                <MoreHorizontalIcon />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem disabled>
                <span className="flex items-center gap-2">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2"/></svg>
                  Archive
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-500 focus:text-red-600">
                <span className="flex items-center gap-2">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="5" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M10 11v4" stroke="currentColor" strokeWidth="2"/><path d="M14 11v4" stroke="currentColor" strokeWidth="2"/><path d="M9 6V4h6v2" stroke="currentColor" strokeWidth="2"/></svg>
                  Delete
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal">
              <Button className="py-1.5 px-2 h-fit font-normal text-white">Login</Button>
            </SignInButton>
          )}
        </div>
      </div>
    </>
  );
};
