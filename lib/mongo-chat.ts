import clientPromise from "@/lib/mongodb";

interface ChatMessage {
  role: string;
  content: string | any[];
  [key: string]: any;
}

interface SaveChatParams {
  id: string;
  messages: ChatMessage[];
  userId: string;
}

interface GetChatParams {
  id: string;
}

interface GetChatsByUserIdParams {
  id: string;
}

interface DeleteChatParams {
  id: string;
}

export async function saveChat({ id, messages, userId }: SaveChatParams) {
  console.log('saveChat called:', { id, userId, messagesCount: messages.length });
  
  const client = await clientPromise;
  const db = client.db();
  const chats = db.collection("chats");

  const result = await chats.updateOne(
    { id },
    { $set: { id, messages, userId, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  
  console.log('saveChat completed:', result.modifiedCount > 0 ? 'modified' : result.upsertedCount > 0 ? 'inserted' : 'no change');
}

export async function getChatById({ id }: GetChatParams) {
  const client = await clientPromise;
  const db = client.db();
  const chat = await db.collection("chats").findOne({ id });
  console.log('getChatById returning:', JSON.stringify(chat, null, 2)); // Debug log
  return chat;
}

export async function getChatsByUserId({ id }: GetChatsByUserIdParams) {
  const client = await clientPromise;
  const db = client.db();
  const chats = db.collection("chats");
  
  // If no id provided, return all chats (for debugging)
  const query = id ? { userId: id } : {};
  
  const result = await chats.find(query).toArray();
  return result;
}

export async function deleteChatById({ id }: DeleteChatParams) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection("chats").deleteOne({ id });
} 