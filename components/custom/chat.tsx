"use client";

import { Attachment, Message, generateId } from "ai";
import { useChat } from "ai/react";
import { useState, useEffect, useRef, useCallback } from "react";

import { Message as PreviewMessage } from "@/components/custom/message";
import { StreamingMessage } from "@/components/custom/streaming-message";
import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";
import { useSidebar } from "@/components/custom/history";

import { MultimodalInput } from "./multimodal-input";
import { Overview } from "./overview";
import { PencilEditIcon } from "./icons";
import { Button } from "../ui/button";
import { ClipboardIcon } from "lucide-react";
import { Input } from "../ui/input";
import { SendHorizonal, Mic } from "lucide-react";
import { ArrowDown } from "lucide-react";
import { PaperclipIcon } from "./icons";

export function Chat({
  id,
  initialMessages,
  isSignedIn = true,
}: {
  id: string;
  initialMessages: Array<Message>;
  isSignedIn?: boolean;
}) {
  const { isOpen: sidebarOpen } = useSidebar();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [lastContentLength, setLastContentLength] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>(initialMessages);
  const [forceStop, setForceStop] = useState(false);
  const [stoppedMessageId, setStoppedMessageId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  
  const {
    messages,
    input,
    setInput,
    handleSubmit,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    body: { id },
    initialMessages,
    maxSteps: 10,
    onFinish: () => {
      window.history.replaceState({}, "", `/chat/${id}`);
    },
  });

  // Track streaming state by monitoring content changes
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && typeof lastMessage.content === 'string') {
        const currentLength = lastMessage.content.length;
        
        if (isLoading && currentLength > lastContentLength) {
          // Content is being streamed
          setStreamingMessageId(lastMessage.id);
          setLastContentLength(currentLength);
        } else if (!isLoading && streamingMessageId === lastMessage.id) {
          // Streaming finished
          setStreamingMessageId(null);
          setLastContentLength(0);
        }
      }
    }
  }, [messages, isLoading, streamingMessageId, lastContentLength]);

  // Better streaming detection - any assistant message while isLoading
  const isCurrentlyStreaming = isLoading;

  // Alternative simpler streaming detection
  const isMessageStreaming = (messageId: string) => {
    if (!isLoading) return false;
    const lastMessage = messages[messages.length - 1];
    return lastMessage && lastMessage.id === messageId && lastMessage.role === 'assistant';
  };

  // Scroll to bottom on new message or user send
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, []);

  // On user send, scroll to bottom immediately
  const handleSubmitAndScroll = (e?: any) => {
    if (e) e.preventDefault();
    if (!input.trim() || !isSignedIn) return;
    
    append(
      {
        id: generateId(),
        role: "user",
        content: input,
      },
      {
        experimental_attachments: attachments,
      }
    );
    
    setInput("");
    setAttachments([]); // Clear attachments after sending
    setTimeout(scrollToBottom, 0); // Scroll after DOM update
  };

  // Auto-scroll during streaming - more aggressive for first message
  const handleContentChange = useCallback(() => {
    if (scrollRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      
      // For the first AI response or if user is near bottom, auto-scroll
      const isFirstAIResponse = messages.length <= 2 && messages[messages.length - 1]?.role === 'assistant';
      
      if (isNearBottom || isFirstAIResponse) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: isFirstAIResponse ? "auto" : "smooth"
          });
        });
      }
    }
  }, [messages]);

  // Typing animation (simulate for now)
  useEffect(() => {
    if (isLoading) setIsTyping(true);
    else setIsTyping(false);
  }, [isLoading]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleEdit = (messageId: string, currentContent: string) => {
    setEditingId(messageId);
    setEditingValue(currentContent);
  };

  const handleEditSave = async (messageId: string) => {
    // Find the index of the message to edit
    const idx = localMessages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;

    const editedContent = editingValue.trim();
    if (!editedContent) return;

    setEditingId(null);
    setEditingValue("");

    // Update the user message in-place
    const updatedUserMsg = { ...localMessages[idx], content: editedContent };

    // Remove the next AI message (if any)
    let newMessages = [...localMessages.slice(0, idx), updatedUserMsg];
    if (localMessages[idx + 1] && localMessages[idx + 1].role === "assistant") {
      // Remove the next AI message
      newMessages = [...newMessages, ...localMessages.slice(idx + 2)];
    } else {
      newMessages = [...newMessages, ...localMessages.slice(idx + 1)];
    }

    // Update the backend with the edited messages before reloading
    try {
      await fetch(`/api/chat?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
    } catch (err) {
      // Optionally show a toast or error
    }

    // Update local state immediately
    setLocalMessages(newMessages);

    // Log the messages being sent to reload
    console.log('Calling reload with messages:', newMessages);

    // Ensure reload uses the latest messages (microtask to guarantee state update)
    Promise.resolve().then(() => reload({ messages: newMessages }));
  };

  // Sync localMessages with messages from useChat
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  const [showScrollDown, setShowScrollDown] = useState(false);

  // Show scroll-to-bottom arrow if not at bottom and chat is scrollable
  useEffect(() => {
    const checkScrollState = () => {
      const el = scrollRef.current;
      if (!el) {
        console.log('No scroll element found');
        setShowScrollDown(false);
        return;
      }
      
      const scrollHeight = el.scrollHeight;
      const scrollTop = el.scrollTop;
      const clientHeight = el.clientHeight;
      
      const isScrollable = scrollHeight > clientHeight + 5;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const isNearBottom = distanceFromBottom < 50; // Reduced threshold
      
      const shouldShow = isScrollable && !isNearBottom;
      
      console.log('Scroll state:', {
        scrollHeight,
        scrollTop,
        clientHeight,
        isScrollable,
        distanceFromBottom,
        isNearBottom,
        shouldShow,
        messagesLength: messages.length
      });
      
             setShowScrollDown(shouldShow);
    };

    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollState);
      window.addEventListener('resize', checkScrollState);
    }
    
    // Check multiple times to ensure it works
    checkScrollState();
    setTimeout(checkScrollState, 100);
    setTimeout(checkScrollState, 500);
    setTimeout(checkScrollState, 1000);
    
    return () => {
      if (el) {
        el.removeEventListener('scroll', checkScrollState);
      }
      window.removeEventListener('resize', checkScrollState);
    };
  }, [messages, localMessages, isLoading]);

  // Suggestions for new chat
  const suggestions = [
    "What can you do?",
    "Give me some creative ideas"
  ];

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    handleSubmit({ preventDefault: () => {} } as any);
  };

  // File upload functionality
  const uploadFile = async (file: File) => {
    const isImage = file.type.startsWith("image");
    const formData = new FormData();
    formData.append("file", file);

    if (isImage) {
      formData.append("upload_preset", "unsigned-chatgpt");
      try {
        const response = await fetch("https://api.cloudinary.com/v1_1/dgrp3htif/auto/upload", {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          return {
            url: data.secure_url,
            name: data.original_filename || file.name,
            contentType: file.type,
            publicId: data.public_id,
            size: file.size,
            width: data.width,
            height: data.height,
            format: data.format,
          };
        } else {
          const { error } = await response.json();
          console.error("Upload error:", error);
        }
      } catch (error) {
        console.error("Upload error:", error);
      }
    } else {
      // Non-image: use signed upload via API route
      try {
        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          return {
            url: data.url,
            name: data.originalFilename || file.name,
            contentType: data.contentType || file.type,
            publicId: data.publicId,
            size: data.size,
            width: data.width,
            height: data.height,
            format: data.format,
          };
        } else {
          const { error } = await response.json();
          console.error("Upload error:", error);
        }
      } catch (error) {
        console.error("Upload error:", error);
      }
    }
  };

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error("Error uploading files!", error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#232325] to-[#18181a] flex flex-col font-sans w-full overflow-x-hidden">
      {/* Hidden file input */}
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
        disabled={!isSignedIn}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center min-h-screen w-full">
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            <div className="flex flex-row justify-center gap-3 mb-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="px-4 py-2 rounded-full bg-[#232325] text-white border border-zinc-700 shadow hover:bg-zinc-800 transition-all text-base font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
            
            {/* File previews */}
            {(attachments.length > 0 || uploadQueue.length > 0) && (
              <div className="flex flex-row flex-wrap gap-3 pb-2 mb-4">
                {attachments.map((attachment, index) => (
                  <div key={attachment.url || attachment.name} className="flex flex-col items-center max-w-24 relative group">
                    {attachment.contentType && attachment.contentType.startsWith("image") ? (
                      <img
                        src={attachment.url}
                        alt={attachment.name ?? "Image attachment"}
                        className="rounded-md object-cover border border-gray-300 dark:border-gray-700"
                        style={{ width: 64, height: 64 }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center w-16 h-16 bg-muted rounded-md border border-gray-300 dark:border-gray-700">
                        <span className="text-2xl">📄</span>
                      </div>
                    )}
                    <div className="text-xs text-zinc-500 max-w-20 truncate mt-1 text-center" title={attachment.name}>
                      {attachment.name}
                    </div>
                    <button
                      onClick={() => {
                        setAttachments(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      title="Remove attachment"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {uploadQueue.map((filename, index) => (
                  <div key={`upload-${filename}-${index}`} className="flex flex-col items-center max-w-24">
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-muted rounded-md border border-gray-300 dark:border-gray-700">
                      <div className="animate-spin text-zinc-500">⏳</div>
                    </div>
                    <div className="text-xs text-zinc-500 max-w-20 truncate mt-1 text-center">{filename}</div>
                  </div>
                ))}
              </div>
            )}

                          <form
              className="w-full flex items-center gap-2 bg-[#2f2f2f] rounded-3xl px-6 py-4 shadow-xl pointer-events-auto"
              onSubmit={handleSubmitAndScroll}
              style={{ boxShadow: "0 4px 32px 0 rgba(0,0,0,0.25), 0 1.5px 6px 0 rgba(0,0,0,0.10)" }}
            >
              <Input
                className="flex-1 bg-[#2f2f2f] border-none outline-none ring-0 focus:ring-0 focus-visible:ring-0 text-zinc-100 placeholder:text-gray-400 text-base px-0"
                style={{ boxShadow: 'none', border: 'none', outline: 'none' }}
                placeholder="Ask anything"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitAndScroll();
                  }
                }}
                disabled={!isSignedIn}
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="text-gray-400 hover:text-zinc-100"
                disabled={!input.trim() || !isSignedIn || isCurrentlyStreaming}
                aria-label="Send"
                style={{ display: isCurrentlyStreaming ? 'none' : undefined }}
              >
                <SendHorizonal className="w-5 h-5" />
              </Button>
              {isCurrentlyStreaming && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-zinc-400 hover:text-zinc-100"
                  onClick={() => { 
                    console.log('Stop button clicked! (suggestions area)', { isCurrentlyStreaming, isLoading });
                    setForceStop(true); 
                    setStoppedMessageId(messages[messages.length - 1]?.id || null); 
                    stop(); 
                  }}
                  aria-label="Stop"
                >
                  <span className="w-5 h-5 inline-flex items-center justify-center">&#9632;</span>
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-gray-400 hover:text-zinc-100"
                aria-label="Upload File"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isSignedIn}
              >
                <PaperclipIcon />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-gray-400 hover:text-zinc-100"
                aria-label="Mic"
                tabIndex={-1}
              >
                <Mic className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Chat area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden px-0 pt-24 pb-32 w-full max-w-full relative"
            style={{ scrollBehavior: "smooth" }}
          >
            <div className="mx-auto w-full max-w-3xl flex flex-col gap-8 overflow-x-hidden px-4 pr-12">
              {localMessages.map((msg, i) => (
                <div
                  key={msg.id || `msg-${i}`}
                  className={`flex w-full overflow-x-hidden ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "user" ? (
                    <div className="flex flex-col items-end max-w-[85%] group">
                      {/* Show image/file preview if attachments exist */}
                      {msg.experimental_attachments && msg.experimental_attachments.length > 0 && (
                        <div className="flex flex-row flex-wrap gap-2 mb-1">
                          {msg.experimental_attachments.map((attachment, i) => (
                            attachment.contentType && attachment.contentType.startsWith("image") ? (
                              <img
                                key={attachment.url || `attachment-${i}`}
                                src={attachment.url}
                                alt={attachment.name ?? "Image attachment"}
                                className="rounded object-cover border border-gray-300 dark:border-gray-700"
                                style={{ width: 48, height: 48 }}
                              />
                            ) : (
                              <div key={attachment.url || attachment.name || `attachment-${i}`} className="flex flex-col items-center max-w-16">
                                <div className="flex flex-col items-center justify-center w-10 h-10 bg-muted rounded-md border border-gray-300 dark:border-gray-700">
                                  <span className="text-lg">📄</span>
                                </div>
                                <div className="text-xs text-zinc-500 max-w-12 truncate mt-1 text-center" title={attachment.name}>
                                  {attachment.name}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                      <div className="relative rounded-full bg-[#2b2b2d] shadow-sm py-3 px-5 break-words font-sans text-base text-zinc-100 leading-relaxed overflow-x-hidden text-right">
                        {editingId === msg.id ? (
                          <input
                            className="w-full bg-transparent border-b border-zinc-600 text-zinc-100 outline-none"
                            value={editingValue}
                            onChange={e => setEditingValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleEditSave(msg.id); }}
                            autoFocus
                          />
                        ) : (
                          <span className="break-words w-full overflow-x-hidden">
                            {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-row gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content))}
                          className="p-1 rounded hover:bg-zinc-800 transition text-xs"
                          title="Copy"
                          style={{ minWidth: 24, minHeight: 24 }}
                        >
                          <span className="w-4 h-4 inline-flex items-center justify-center"><ClipboardIcon /></span>
                        </button>
                        <button
                          onClick={() => editingId === msg.id ? handleEditSave(msg.id) : handleEdit(msg.id, typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content))}
                          className="p-1 rounded hover:bg-zinc-800 transition text-xs"
                          title="Edit"
                          style={{ minWidth: 24, minHeight: 24 }}
                        >
                          <span className="w-4 h-4 inline-flex items-center justify-center"><PencilEditIcon /></span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start w-full group">
                      <div className="py-3 px-0 break-words font-sans text-base text-white leading-relaxed overflow-x-hidden text-left" style={{background: 'none', boxShadow: 'none'}}>
                        {typeof msg.content === 'string' && msg.content.trim() ? (
                          <StreamingMessage
                            content={msg.content}
                            isStreaming={isMessageStreaming(msg.id) && !forceStop && stoppedMessageId !== msg.id}
                            onContentChange={handleContentChange}
                            stopAnimation={forceStop || stoppedMessageId === msg.id}
                            instantStop={forceStop || stoppedMessageId === msg.id}
                          />
                        ) : typeof msg.content === 'object' ? (
                          <div className="text-white">
                            <div className="text-sm text-zinc-400 mb-2">Object content detected:</div>
                            <pre className="whitespace-pre-wrap bg-zinc-800 p-4 rounded-lg overflow-x-auto text-sm">
                              {JSON.stringify(msg.content, null, 2)}
                            </pre>
                          </div>
                        ) : msg.content ? (
                          <div className="text-white">
                            <div className="text-sm text-zinc-400 mb-2">Unexpected content type: {typeof msg.content}</div>
                            <pre className="whitespace-pre-wrap bg-zinc-800 p-4 rounded-lg overflow-x-auto text-sm">
                              {String(msg.content)}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-row gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content))}
                          className="p-1 rounded hover:bg-zinc-800 transition text-xs"
                          title="Copy"
                          style={{ minWidth: 24, minHeight: 24 }}
                        >
                          <span className="w-4 h-4 inline-flex items-center justify-center"><ClipboardIcon /></span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Scroll to bottom arrow - fixed position outside scroll container */}
          <button
            onClick={() => {
              console.log('Arrow clicked, scrolling to bottom');
              if (scrollRef.current) {
                scrollRef.current.scrollTo({
                  top: scrollRef.current.scrollHeight,
                  behavior: "smooth"
                });
              }
            }}
            className={`fixed bottom-36 left-1/2 transform -translate-x-1/2 z-50 bg-[#2f2f2f] text-white rounded-full shadow-lg w-8 h-8 flex items-center justify-center border border-zinc-600 hover:bg-zinc-700 transition-all ${
              showScrollDown ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4" />
                      </button>
            
          {/* File previews - main chat area */}
          {(attachments.length > 0 || uploadQueue.length > 0) && (
            <div className="w-full fixed left-0 right-0 bottom-24 z-10 flex justify-center pointer-events-none">
              <div className="w-full max-w-3xl mx-auto mb-4 pointer-events-auto">
                <div className="flex flex-row flex-wrap gap-3 pb-2 px-6">
                  {attachments.map((attachment, index) => (
                    <div key={attachment.url || attachment.name} className="flex flex-col items-center max-w-24 relative group">
                      {attachment.contentType && attachment.contentType.startsWith("image") ? (
                        <img
                          src={attachment.url}
                          alt={attachment.name ?? "Image attachment"}
                          className="rounded-md object-cover border border-gray-300 dark:border-gray-700"
                          style={{ width: 64, height: 64 }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-muted rounded-md border border-gray-300 dark:border-gray-700">
                          <span className="text-2xl">📄</span>
                        </div>
                      )}
                      <div className="text-xs text-zinc-500 max-w-20 truncate mt-1 text-center" title={attachment.name}>
                        {attachment.name}
                      </div>
                      <button
                        onClick={() => {
                          setAttachments(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="Remove attachment"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {uploadQueue.map((filename, index) => (
                    <div key={`upload-${filename}-${index}`} className="flex flex-col items-center max-w-24">
                      <div className="flex flex-col items-center justify-center w-16 h-16 bg-muted rounded-md border border-gray-300 dark:border-gray-700">
                        <div className="animate-spin text-zinc-500">⏳</div>
                      </div>
                      <div className="text-xs text-zinc-500 max-w-20 truncate mt-1 text-center">{filename}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
            
          {/* Input bar */}
          <form
            className="w-full fixed left-0 right-0 bottom-0 z-10 flex justify-center pointer-events-none"
            onSubmit={handleSubmitAndScroll}
            style={{ background: "transparent" }}
          >
            <div className="w-full max-w-3xl mx-auto flex items-center gap-2 bg-[#2f2f2f] rounded-3xl px-6 py-4 shadow-xl mb-8 pointer-events-auto" style={{ boxShadow: "0 4px 32px 0 rgba(0,0,0,0.25), 0 1.5px 6px 0 rgba(0,0,0,0.10)" }}>
              <Input
                className="flex-1 bg-[#2f2f2f] border-none outline-none ring-0 focus:ring-0 focus-visible:ring-0 text-zinc-100 placeholder:text-gray-400 text-base px-0"
                style={{ boxShadow: 'none', border: 'none', outline: 'none' }}
                placeholder="Ask anything"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitAndScroll();
                  }
                }}
                disabled={!isSignedIn}
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="text-gray-400 hover:text-zinc-100"
                disabled={!input.trim() || !isSignedIn || isCurrentlyStreaming}
                aria-label="Send"
                style={{ display: isCurrentlyStreaming ? 'none' : undefined }}
              >
                <SendHorizonal className="w-5 h-5" />
              </Button>
              {isCurrentlyStreaming && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-zinc-400 hover:text-zinc-100"
                  onClick={() => { 
                    console.log('Stop button clicked! (main area)', { isCurrentlyStreaming, isLoading });
                    setForceStop(true); 
                    setStoppedMessageId(messages[messages.length - 1]?.id || null); 
                    stop(); 
                  }}
                  aria-label="Stop"
                >
                  <span className="w-5 h-5 inline-flex items-center justify-center">&#9632;</span>
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-gray-400 hover:text-zinc-100"
                aria-label="Upload File"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isSignedIn}
              >
                <PaperclipIcon />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-gray-400 hover:text-zinc-100"
                aria-label="Mic"
                tabIndex={-1}
              >
                <Mic className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </>
      )}
      
      {/* Footer text - fixed position */}
      <div 
        className={`fixed bottom-0 right-0 bg-[#18181a] pt-2 pb-2 text-center text-xs text-gray-400 z-50 transition-all duration-300 ${
          sidebarOpen ? 'left-72' : 'left-16'
        }`}
      >
        ChatGPT can make mistakes. Check important info. See{" "}
        <span className="underline cursor-pointer hover:text-gray-300">Cookie Preferences</span>.
      </div>
    </div>
  );
}
