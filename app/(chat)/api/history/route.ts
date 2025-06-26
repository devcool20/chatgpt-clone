import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

import { getChatsByUserId } from '@/lib/mongo-chat';

export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);
  console.log('=== HISTORY API DEBUG ===');
  console.log('History API called with userId:', userId);
  console.log('Auth status:', !!userId ? 'authenticated' : 'not authenticated');
  
  if (!userId) {
    console.log('No userId found, returning 401');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chats = await getChatsByUserId({ id: userId });
    console.log('Raw chats from DB:', JSON.stringify(chats, null, 2));
    console.log('Chat count from DB:', chats.length);
    
    // Process chats with aggressive string conversion
    const history = chats
      .filter(chat => {
        const hasValidId = chat && chat.id && chat.id !== null && chat.id !== undefined;
        const hasMessages = chat && chat.messages && Array.isArray(chat.messages) && chat.messages.length > 0;
        console.log(`Chat ${chat?.id}: hasValidId=${hasValidId}, hasMessages=${hasMessages}`);
        return hasValidId && hasMessages;
      })
      .map((chat, index) => {
        console.log(`Processing chat ${index}:`, JSON.stringify(chat, null, 2));
        
        // Extract preview with multiple fallback strategies
        let preview = 'No content available';
        
        if (chat.messages && chat.messages.length > 0) {
          const firstMessage = chat.messages[0];
          console.log(`First message:`, JSON.stringify(firstMessage, null, 2));
          
          try {
            if (typeof firstMessage.content === 'string') {
              preview = firstMessage.content;
            } else if (Array.isArray(firstMessage.content)) {
              // Handle array format
              const textParts = firstMessage.content
                .filter(item => item && (item.type === 'text' || typeof item === 'string'))
                .map(item => {
                  if (typeof item === 'string') return item;
                  if (item.text) return item.text;
                  if (item.value) return item.value;
                  return String(item);
                });
              preview = textParts.join(' ') || 'Array content (no text found)';
            } else if (firstMessage.content && typeof firstMessage.content === 'object') {
              // Handle object format
              if (firstMessage.content.text) {
                preview = firstMessage.content.text;
              } else if (firstMessage.content.value) {
                preview = firstMessage.content.value;
              } else {
                preview = JSON.stringify(firstMessage.content);
              }
            } else {
              preview = String(firstMessage.content || 'Empty message');
            }
          } catch (error) {
            console.error('Error processing message content:', error);
            preview = `Error processing content: ${String(firstMessage.content)}`;
          }
        }
        
        // Ensure preview is always a string and limit length
        preview = String(preview).substring(0, 100);
        console.log(`Final preview for chat ${chat.id}:`, preview);
        
        return {
          id: String(chat.id),
          preview: preview,
          updatedAt: chat.updatedAt || chat.createdAt || Date.now(),
          raw: JSON.stringify(chat) // Debug field
        };
      });
    
    // Sort by updatedAt descending
    history.sort((a, b) => {
      const timeA = typeof a.updatedAt === 'number' ? a.updatedAt : new Date(a.updatedAt).getTime();
      const timeB = typeof b.updatedAt === 'number' ? b.updatedAt : new Date(b.updatedAt).getTime();
      return timeB - timeA;
    });
    
    console.log('Final processed history:', JSON.stringify(history, null, 2));
    console.log('=== END HISTORY API DEBUG ===');
    
    return Response.json(history);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response('Failed to fetch chat history', { status: 500 });
  }
} 