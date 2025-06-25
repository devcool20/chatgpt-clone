import { getAuth } from '@clerk/nextjs/server';
import { convertToCoreMessages, Message, streamText, CoreMessage } from "ai";
import { NextRequest } from "next/server";

import { geminiProModel } from "@/ai";
import { deleteChatById, getChatById, saveChat } from "@/lib/mongo-chat";


// Set your model's context window size (tokens)
const CONTEXT_WINDOW_TOKENS = 4096; // Adjust for your model (e.g., 8192 for Gemini Pro)

// Simple word count as a proxy for tokens
function countTokens(str: string) {
  if (!str) return 0;
  return str.split(/\s+/).length;
}

function trimMessagesToContext(messages: CoreMessage[], maxTokens: number) {
  let total = 0;
  // Start from the end (most recent), work backwards
  const trimmed = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    // Count tokens for this message
    let msgTokens = 0;
    if (typeof msg.content === 'string') {
      msgTokens = countTokens(msg.content);
    } else if (Array.isArray(msg.content)) {
      msgTokens = msg.content.map((part: any) => typeof part.text === 'string' ? countTokens(part.text) : 0).reduce((a: number, b: number) => a + b, 0);
    }
    if (total + msgTokens > maxTokens) break;
    trimmed.unshift(msg);
    total += msgTokens;
  }
  return trimmed;
}

export async function POST(request: NextRequest) {
  const { id, messages, userId: clientUserId }: { id: string; messages: Array<Message>; userId?: string } = await request.json();
  const { userId: clerkUserId } = getAuth(request);
  const userId = clientUserId || clerkUserId;
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );

  // Context window handling: trim messages to fit within context window
  const trimmedMessages = trimMessagesToContext(coreMessages, CONTEXT_WINDOW_TOKENS);

  let safeCoreMessages = trimmedMessages.map((msg) => {
    if (typeof msg.content === 'string') {
      return msg;
    }
    if (Array.isArray(msg.content) && msg.content.every(part => part && typeof part === 'object' && 'type' in part)) {
      return msg;
    }
    return { ...msg, content: String(msg.content) };
  });

  console.log('DEBUG: safeCoreMessages', JSON.stringify(safeCoreMessages, null, 2));

  const result = await streamText({
    model: geminiProModel,
    messages: trimmedMessages,
    onFinish: async ({ responseMessages }) => {
      if (userId) {
        try {
          await saveChat({
            id,
            messages: [...trimmedMessages, ...responseMessages],
            userId,
          });
        } catch (error) {
          console.error("Failed to save chat");
        }
      }
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const { userId } = getAuth(request);

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (!chat) {
      return new Response("Chat not found", { status: 404 });
    }

    if (chat.userId !== userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return new Response("Not Found", { status: 404 });
  }
  const { userId } = getAuth(request);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const { messages } = await request.json();
    console.log('PUT /api/chat saving messages:', JSON.stringify(messages, null, 2));
    await saveChat({ id, messages, userId });
    return new Response("Chat updated", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while updating the chat", {
      status: 500,
    });
  }
}
