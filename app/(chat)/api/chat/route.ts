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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Chat ID is required", { status: 400 });
  }

  const { userId } = getAuth(request);

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    console.log('=== CHAT API GET DEBUG ===');
    console.log('Fetching chat with ID:', id, 'for user:', userId);
    
    const chat = await getChatById({ id });
    console.log('Raw chat from DB:', JSON.stringify(chat, null, 2));

    if (!chat) {
      console.log('Chat not found in database');
      return new Response("Chat not found", { status: 404 });
    }

    if (chat.userId !== userId) {
      console.log('User ID mismatch. Chat userId:', chat.userId, 'Request userId:', userId);
      return new Response("Unauthorized", { status: 401 });
    }

    const messages = chat.messages || [];
    console.log('Messages to return:', JSON.stringify(messages, null, 2));
    console.log('Message count:', messages.length);
    
    // Log each message content type
    messages.forEach((msg: any, index: number) => {
      console.log(`Message ${index} content type:`, typeof msg.content, 'content:', msg.content);
    });

    const response = { 
      id: chat.id,
      messages: messages,
      userId: chat.userId
    };
    
    console.log('Final API response:', JSON.stringify(response, null, 2));
    console.log('=== END CHAT API GET DEBUG ===');
    
    return Response.json(response);
  } catch (error) {
    console.error("Error fetching chat:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack');
    return new Response("An error occurred while fetching the chat", {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  const { id, messages }: { id: string; messages: Array<Message> } = await request.json();
  const { userId } = getAuth(request);
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
          // Use the original messages format instead of trimmed core messages
          // Append the new AI response messages to the original messages
          const newAIMessages = responseMessages.map((msg, idx) => ({
            id: 'id' in msg && msg.id ? msg.id : `msg-${Date.now()}-${idx}`,
            role: msg.role,
            content: msg.content,
          }));
          
          const allMessages = [...messages, ...newAIMessages];
          console.log('Saving chat with ID:', id, 'userId:', userId, 'messages count:', allMessages.length);
          await saveChat({
            id,
            messages: allMessages,
            userId,
          });
          console.log('Chat saved successfully');
        } catch (error) {
          console.error("Failed to save chat:", error);
        }
      } else {
        console.log('No userId available for saving chat');
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
