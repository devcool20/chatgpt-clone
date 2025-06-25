# MongoDB Usage and Testing Guide

## What is MongoDB used for in this project?

MongoDB serves as the **persistent storage layer** for this Gemini chatbot application. Here's what it stores:

### 📊 Data Structure
The application uses a `chats` collection with the following structure:
```javascript
{
  id: string,           // Unique chat identifier
  messages: [           // Array of conversation messages
    {
      role: 'user' | 'assistant',
      content: string | any[]
    }
  ],
  userId: string,       // User identifier (from Clerk auth)
  createdAt: Date,      // When the chat was first created
  updatedAt: Date       // When the chat was last modified
}
```

### 🔄 Core Functions
MongoDB handles these operations:

1. **`saveChat()`** - Saves or updates chat conversations
2. **`getChatById()`** - Retrieves a specific chat by ID
3. **`getChatsByUserId()`** - Gets all chats for a specific user
4. **`deleteChatById()`** - Removes a chat from the database

### 🌐 API Endpoints Using MongoDB
- **`POST /api/chat`** - Creates new chats and saves messages
- **`PUT /api/chat`** - Updates existing chats
- **`DELETE /api/chat`** - Deletes chats
- **`GET /api/history`** - Retrieves user's chat history

## How to Test MongoDB

### Prerequisites
1. **MongoDB Atlas Account** (or local MongoDB instance)
2. **MONGODB_URI** environment variable set
3. **Node.js** and **npm** installed

### Step 1: Set up Environment Variables
Create a `.env.local` file in your project root:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

### Step 2: Test Database Connection
Run the MongoDB test script:
```bash
node test-mongodb.js
```

This script will:
- ✅ Test database connectivity
- ✅ Verify collection access
- ✅ Test CRUD operations (Create, Read, Update, Delete)
- ✅ Test user-specific queries
- ✅ Clean up test data

### Step 3: Test API Endpoints
First, start your development server:
```bash
npm run dev
```

Then run the API test script:
```bash
node test-api.js
```

This will test:
- ✅ Authentication requirements
- ✅ API endpoint accessibility
- ✅ Proper error handling

### Step 4: Manual Testing
1. **Start the application**: `npm run dev`
2. **Sign up/Login** using Clerk authentication
3. **Create a chat** by sending a message
4. **Check chat history** in the sidebar
5. **Delete a chat** to test removal functionality

## Troubleshooting

### Common Issues

#### ❌ "MONGODB_URI environment variable is not set"
**Solution**: Add your MongoDB connection string to `.env.local`

#### ❌ "Authentication failed"
**Solution**: 
- Check your MongoDB username/password
- Ensure your IP is whitelisted in MongoDB Atlas
- Verify database user permissions

#### ❌ "Connection timeout"
**Solution**:
- Check your internet connection
- Verify the MongoDB cluster is running
- Ensure the connection string is correct

#### ❌ "Collection not found"
**Solution**: This is normal - collections are created automatically when first used

### MongoDB Atlas Setup
1. Create a free MongoDB Atlas account
2. Create a new cluster
3. Add your IP address to the whitelist
4. Create a database user with read/write permissions
5. Get your connection string from the "Connect" button

### Local MongoDB Setup
If using local MongoDB:
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod

# Connection string format:
MONGODB_URI=mongodb://localhost:27017/gemini-chatbot
```

## Performance Considerations

### Indexes
Consider adding these indexes for better performance:
```javascript
// On the chats collection
db.chats.createIndex({ "userId": 1, "createdAt": -1 })
db.chats.createIndex({ "id": 1 })
```

### Connection Pooling
The application uses connection pooling automatically through the MongoDB driver.

### Data Size
Monitor chat message sizes, especially for conversations with file attachments.

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files to version control
2. **Network Access**: Use IP whitelisting in MongoDB Atlas
3. **User Permissions**: Use least-privilege database users
4. **Data Validation**: Validate data before saving to MongoDB
5. **Authentication**: Always verify user authentication before database operations

## Monitoring

### MongoDB Atlas Dashboard
- Monitor connection count
- Check query performance
- Review storage usage
- Set up alerts for errors

### Application Logs
Watch for these log messages:
- "Failed to save chat" - Database write errors
- "Failed to fetch chat history" - Database read errors
- Connection timeout errors

## Backup Strategy

### MongoDB Atlas
- Automatic backups are enabled by default
- Point-in-time recovery available
- Export data using MongoDB Compass or Atlas UI

### Manual Backups
```bash
# Export chats collection
mongodump --uri="your-connection-string" --collection=chats

# Import data
mongorestore --uri="your-connection-string" dump/
``` 