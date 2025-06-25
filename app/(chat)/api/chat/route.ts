import { convertToCoreMessages, Message, streamText } from "ai";
import { geminiProModel } from "@/ai";
import { getAuth } from '@clerk/nextjs/server';
import { deleteChatById, getChatById, saveChat } from "@/lib/mongo-chat";
import { retrieveMemories, addMemories } from "@mem0/vercel-ai-provider";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { id, messages }: { id: string; messages: Array<Message> } = await request.json();
  const { userId } = getAuth(request);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );

  let safeCoreMessages = coreMessages.map((msg) => {
    if (typeof msg.content === 'string') {
      return msg;
    }
    if (Array.isArray(msg.content) && msg.content.every(part => part && typeof part === 'object' && 'type' in part)) {
      return msg;
    }
    return { ...msg, content: String(msg.content) };
  });

  console.log('DEBUG: safeCoreMessages', JSON.stringify(safeCoreMessages, null, 2));
  // const memories = await retrieveMemories(safeCoreMessages, { user_id: userId, model: 'gemini-flash' });

  const result = await streamText({
    model: geminiProModel,
    messages: coreMessages,
    onFinish: async ({ responseMessages }) => {
      if (userId) {
        try {
          await saveChat({
            id,
            messages: [...coreMessages, ...responseMessages],
            userId,
          });
          // await addMemories([...coreMessages, ...responseMessages], { user_id: userId, model: 'gemini-flash' });
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
