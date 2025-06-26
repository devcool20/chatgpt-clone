import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

import { getChatsByUserId } from '@/lib/mongo-chat';

export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);
  
  console.log('=== DATABASE DEBUG ROUTE ===');
  console.log('User ID:', userId);
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    // Get all chats for this user
    const allChats = await getChatsByUserId({ id: userId });
    console.log('All chats for user:', JSON.stringify(allChats, null, 2));
    
    // Also try to get ALL chats (for debugging)
    const allChatsInDB = await getChatsByUserId({ id: '' }); // This should get all chats
    console.log('All chats in database:', JSON.stringify(allChatsInDB, null, 2));
    
    return Response.json({
      userId,
      userChats: allChats,
      userChatCount: allChats.length,
      allChatsInDB: allChatsInDB,
      totalChatsInDB: allChatsInDB.length
    });
  } catch (error) {
    console.error('Database debug error:', error);
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 