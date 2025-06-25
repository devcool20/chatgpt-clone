import { useState } from 'react';
import { Menu } from 'lucide-react';

export default function Sidebar({ chats = [], activeChatId, onChatSelect }: {
  chats: { id: string; title: string }[];
  activeChatId?: string;
  onChatSelect?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded bg-[#232325] text-white hover:bg-zinc-800 transition md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-[#18181a] text-white border-r border-zinc-800 flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:block`}
        style={{ minWidth: 256 }}
      >
        {/* Header with logo and collapse button */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.078 6.078 0 0 0 6.525 2.9 5.973 5.973 0 0 0 4.233 1.736c4.014 0 6.301-5.112 3.905-8.777Z" fill="currentColor"/>
                <path d="M9.09 13.28h5.82c.833 0 1.356-.665 1.356-1.399 0-.734-.523-1.399-1.356-1.399H9.09c-.833 0-1.356.665-1.356 1.399 0 .734.523 1.399 1.356 1.399Z" fill="#171717"/>
                <path d="M12 17.346c-.734 0-1.356-.665-1.356-1.399V9.481c0-.734.622-1.399 1.356-1.399s1.356.665 1.356 1.399v6.466c0 .734-.622 1.399-1.356 1.399Z" fill="#171717"/>
              </svg>
            </div>
          </div>
          <button 
            className="p-1 rounded hover:bg-zinc-800 transition"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
            </svg>
          </button>
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-1 px-3 pb-4">
          <SidebarItem icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          } label="New chat" />
          <SidebarItem icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          } label="Search chats" />
          <SidebarItem icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          } label="Library" />
          <div className="h-2"></div>
          <SidebarItem icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
            </svg>
          } label="Sora" />
          <SidebarItem icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
            </svg>
          } label="GPTs" />
          <SidebarItem icon={
            <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
              </svg>
            </div>
          } label="Code Copilot" />
          <div className="h-2"></div>
          <SidebarItem icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="12" cy="12" r="1"/>
              <path d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"/>
            </svg>
          } label="GPT Builder" />
          <SidebarItem icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              <path d="M12 11h4"/>
              <path d="M12 16h4"/>
              <path d="M8 11h.01"/>
              <path d="M8 16h.01"/>
            </svg>
          } label="My GPTs" />
          <SidebarItem icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          } label="Temporary chat" />
          <div className="h-2"></div>
          <SidebarItem icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
            </svg>
          } label="Settings" />
          <SidebarItem icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <path d="M12 17h.01"/>
            </svg>
          } label="Help & Support" />
          <SidebarItem icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          } label="Voice" />
          <SidebarItem icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="M15 5l4 4"/>
            </svg>
          } label="Customize ChatGPT" />
        </nav>

        {/* Chats */}
        <div className="flex-1 overflow-y-auto px-2">
          <div className="text-xs text-zinc-400 px-2 pt-2 pb-1">Chats</div>
          {chats.map(chat => (
            <SidebarChatItem
              key={chat.id}
              label={chat.title}
              active={chat.id === activeChatId}
              onClick={() => { onChatSelect?.(chat.id); setOpen(false); }}
            />
          ))}
        </div>

        {/* Upgrade plan */}
        <div className="px-4 py-4 border-t border-zinc-800 flex flex-col gap-2">
          <button className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="7" y1="17" x2="17" y2="7"/>
              <polyline points="7,7 17,7 17,17"/>
            </svg>
            Upgrade plan
          </button>
          <span className="text-xs text-zinc-500">More access to the best models</span>
        </div>
      </aside>
    </>
  );
}

function SidebarItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-800/50 transition w-full text-left text-sm">
      <div className="flex items-center justify-center w-4 h-4">
        {icon}
      </div>
      <span className="text-zinc-200">{label}</span>
    </button>
  );
}

function SidebarChatItem({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded mt-1 text-sm ${
        active ? 'bg-zinc-700 text-white' : 'hover:bg-zinc-800 text-zinc-300'
      } transition`}
    >
      {label}
    </button>
  );
} 