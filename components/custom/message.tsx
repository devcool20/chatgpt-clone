"use client";

import { Attachment, ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import { BotIcon, UserIcon } from "./icons";
import { Markdown } from "./markdown";
import { PreviewAttachment } from "./preview-attachment";

export const Message = ({
  chatId,
  role,
  content,
  toolInvocations,
  attachments,
}: {
  chatId: string;
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
  attachments?: Array<Attachment>;
}) => {
  console.log('Message component - role:', role, 'content:', content, 'type:', typeof content);

  return (
    <motion.div
      className={`flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0 first-of-type:pt-20`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
        {role === "assistant" ? <BotIcon /> : <UserIcon />}
      </div>

      <div className="flex flex-col gap-2 w-full">
        {attachments && attachments.length > 0 && (
          <div className="flex flex-col items-center justify-center w-full mb-2">
            {attachments.map((attachment) => (
              <PreviewAttachment 
                key={attachment.url} 
                attachment={attachment}
                onExplain={() => {
                  console.log('Explain image:', attachment.url);
                }}
              />
            ))}
          </div>
        )}
        
        {/* Always show something - debug what we're getting */}
        <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4">
          {content && typeof content === "string" ? (
            <Markdown>{content}</Markdown>
          ) : content && typeof content !== "string" ? (
            <pre className="whitespace-pre-wrap bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(content, null, 2)}
            </pre>
          ) : (
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              DEBUG: Content is {content === null ? 'null' : content === undefined ? 'undefined' : typeof content}: {String(content)}
            </div>
          )}
        </div>

        {toolInvocations && (
          <div className="flex flex-col gap-4">
            {toolInvocations.map((toolInvocation) => {
              const { toolName, toolCallId, state } = toolInvocation;

              if (state === "result") {
                const { result } = toolInvocation;

                return (
                  <div key={toolCallId}>
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold mb-2">Tool: {toolName}</h4>
                      <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={toolCallId} className="skeleton">
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                      <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
