"use client";

import { Attachment, ChatRequestOptions, CreateMessage, Message } from "ai";
import { motion } from "framer-motion";
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
  ChangeEvent,
} from "react";
import { toast } from "sonner";

import { ArrowUpIcon, PaperclipIcon, StopIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import useWindowSize from "./use-window-size";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

const suggestedActions = [
  {
    title: "Explain quantum computing",
    label: "in simple terms",
    action: "Explain quantum computing in simple terms",
  },
  {
    title: "Write a poem",
    label: "about the ocean",
    action: "Write a poem about the ocean",
  },
];

export function MultimodalInput({
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  append,
  handleSubmit,
  isSignedIn = true,
}: {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
  isSignedIn?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 0}px`;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [attachments, handleSubmit, setAttachments, width]);

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
          toast.error(error);
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload file, please try again!");
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
          toast.error(error);
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload file, please try again!");
      }
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

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
    <div className="relative w-full flex flex-col gap-4">
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <div className="grid sm:grid-cols-2 gap-4 w-full md:px-0 mx-auto md:max-w-[500px]">
            {suggestedActions.map((suggestedAction, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.05 * index }}
                key={index}
                className={index > 1 ? "hidden sm:block" : "block"}
              >
                <button
                  onClick={async () => {
                    if (!isSignedIn) return;
                    append({
                      role: "user",
                      content: suggestedAction.action,
                    });
                  }}
                  className="border-none bg-muted/50 w-full text-left border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg p-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col disabled:opacity-50"
                  disabled={!isSignedIn}
                  title={!isSignedIn ? 'Sign in to use this' : ''}
                >
                  <span className="font-medium">{suggestedAction.title}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {suggestedAction.label}
                  </span>
                </button>
              </motion.div>
            ))}
          </div>
        )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
        disabled={!isSignedIn}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-2 overflow-x-scroll pb-2">
          {attachments.map((attachment, index) => (
            <PreviewAttachment 
              key={attachment.url} 
              attachment={attachment} 
              onRemove={() => {
                setAttachments(prev => prev.filter((_, i) => i !== index));
              }}
            />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: "",
                name: filename,
                contentType: "",
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        value={input}
        onChange={handleInput}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!isSignedIn) return;
            submitForm();
          }
        }}
        placeholder={isSignedIn ? "Type your message..." : "Sign in to chat..."}
        className="w-full resize-none rounded border p-2"
        disabled={!isSignedIn}
      />
      {!isSignedIn && (
        <div className="text-center text-zinc-400 text-xs mt-2">Sign in to chat and use all features.</div>
      )}
      <div className="flex flex-row gap-2 items-end">
        <Button
          type="button"
          onClick={() => {
            if (!isSignedIn) return;
            submitForm();
          }}
          disabled={isLoading || !input.trim() || !isSignedIn}
        >
          <ArrowUpIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={stop}
          disabled={!isLoading || !isSignedIn}
        >
          <StopIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={!isSignedIn}
        >
          <PaperclipIcon />
        </Button>
      </div>
    </div>
  );
}
