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
  const client = await clientPromise;
  const db = client.db();
  const chats = db.collection("chats");

  await chats.updateOne(
    { id },
    { $set: { id, messages, userId, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
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
  
  console.log('Querying database for user:', id);
  const result = await chats.find({ userId: id }).toArray();
  console.log('Database query result:', result);
  
  return result;
}

export async function deleteChatById({ id }: DeleteChatParams) {
  const client = await clientPromise;
  const db = client.db();
  return db.collection("chats").deleteOne({ id });
} 