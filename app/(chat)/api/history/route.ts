import { getAuth } from '@clerk/nextjs/server';
import { getChatsByUserId } from '@/lib/mongo-chat';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const chats = await getChatsByUserId({ id: userId });
    // Return only id and preview (first message) for each chat
    const history = chats.map(chat => ({
      id: chat.id,
      preview: Array.isArray(chat.messages) && chat.messages.length > 0 ? chat.messages[0].content : '',
      updatedAt: chat.updatedAt || chat.createdAt || null,
    }));
    // Sort by updatedAt descending
    history.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return Response.json(history);
  } catch (error) {
    return new Response('Failed to fetch chat history', { status: 500 });
  }
} 