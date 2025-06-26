A modern, full-stack AI chatbot platform built with Next.js, Vercel AI SDK, Mem0 for memory retention, MongoDB, Clerk authentication, and a beautiful, responsive UI powered by Tailwind CSS and Shadcn.

![image](https://github.com/user-attachments/assets/854653ee-d3b8-4dec-8ce2-4d2d49573b83)


---

## 🚀 Features

- **Conversational AI**: Chat with advanced AI models (Google Gemini, OpenAI, etc.) using the Vercel AI SDK.
- **Persistent Memory**: Mem0 integration allows the bot to remember context and chat history.
- **Authentication**: Secure user management with Clerk.
- **File Uploads**: Upload and preview files in chat.
- **Chat History**: View and revisit previous conversations.
- **Responsive UI**: Beautiful, accessible design with Tailwind CSS, ShadCN, and custom components.
- **MongoDB Storage**: Scalable, cloud-ready database for chats and user data.
- **Modern Dev Experience**: TypeScript, ESLint, Prettier, and more.

---

## 🛠️ Technology Stack

| Layer         | Technology / Library                | Purpose / Role                                                                 |
|---------------|-------------------------------------|-------------------------------------------------------------------------------|
| **Frontend**  | Next.js, React, TypeScript          | Main app framework, UI, routing, SSR/SSG                                      |
| **Styling**   | Tailwind CSS, Radix UI, Geist Fonts | Utility-first CSS, accessible UI primitives, modern fonts                     |
| **AI/LLM**    | Vercel AI SDK, @ai-sdk/google, Mem0 | Connects to AI models, enables memory retention                               |
| **Auth**      | Clerk                              | User authentication and session management                                    |
| **Database**  | MongoDB, mongoose/mongodb           | Stores chat history, user data, persistent memory                             |
| **File Upload**| Vercel Blob                       | Handles file uploads and storage                                              |
| **Markdown**  | react-markdown, remark-gfm          | Renders markdown in chat messages                                             |
| **State/Data**| SWR, usehooks-ts                    | Data fetching, hooks for state management                                     |
| **Testing**   | ESLint, Prettier, TypeScript        | Code quality, formatting, and type safety                                     |

---

## 🗂️ Project Structure

```
chatgpt-clone/
│
├── ai/                # AI logic, custom middleware, and provider setup
├── app/               # Next.js app directory (routes, pages, API)
│   ├── (chat)/        # Chat-related routes, API endpoints, and pages
│   └── favicon.ico    # Browser tab icon
├── components/        # Reusable UI and custom components
│   ├── custom/        # Chat, sidebar, history, markdown, etc.
│   └── ui/            # Radix UI-based primitives (button, input, etc.)
├── db/                # (Optional) Database models or scripts
├── lib/               # Utility functions, MongoDB connection logic
├── public/            # Static assets (fonts, images)
├── styles/            # Global styles (Tailwind, CSS)
├── README.md          # This file
└── ...                # Config, scripts, etc.
```

---

## 🔗 How Everything Connects

- **User** interacts with the **Next.js** frontend, built with **React** and styled using **Tailwind CSS** and **Radix UI**.
- **Authentication** is handled by **Clerk**; only authenticated users can chat.
- **Chat UI** (in `components/custom/`) sends messages to the **API routes** (`app/(chat)/api/chat/route.ts`).
- **AI logic** (in `ai/`) uses the **Vercel AI SDK** and **Mem0** to process messages, generate responses, and retain memory/context.
- **MongoDB** (via `lib/mongodb.ts` and `lib/mongo-chat.ts`) stores chat history and user data.
- **File uploads** are managed by **Cloudinary** via dedicated API endpoints.
- **Chat history** and **memory** are fetched from the database and displayed in the UI.
- **Markdown** support is provided for rich message formatting.
- **Theming** and responsive design ensure a great experience on all devices.

---

## 🏁 Getting Started

1. **Clone the repo:**
   ```sh
   git clone https://github.com/devcool20/chatgpt-clone.git
   cd chatgpt-clone
   ```

2. **Install dependencies:**
   ```sh
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your API keys (MongoDB, Clerk, Vercel, etc.).

4. **Run the development server:**
   ```sh
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser:**
   - Visit [http://localhost:3000](http://localhost:3000)

---

## 🧩 Key Files & Directories

- `ai/` — AI provider and middleware logic
- `app/(chat)/api/` — API endpoints for chat, file upload, history, etc.
- `components/custom/` — Chat UI, sidebar, history, markdown renderer, etc.
- `lib/mongodb.ts` — MongoDB connection utility
- `lib/mongo-chat.ts` — Chat data model and helpers
- `public/fonts/` — Custom fonts
- `tailwind.config.ts` — Tailwind CSS configuration

By Divyanshu
