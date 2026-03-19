import { useState, useEffect } from "react";

const Sidebar = ({ onNewChat, onSelectChat, currentChatId }) => {
  const [chats, setChats] = useState([]);
  const [isOpen, setIsOpen] = useState(true);

  // Load chat history from localStorage
  useEffect(() => {
    const loadChats = () => {
      const savedChats = localStorage.getItem("chatHistory");
      if (savedChats) {
        try {
          setChats(JSON.parse(savedChats));
        } catch (error) {
          console.error("Error loading chats:", error);
        }
      }
    };
    loadChats();
  }, []);

  // Save chats to localStorage
  const saveChats = (updatedChats) => {
    localStorage.setItem("chatHistory", JSON.stringify(updatedChats));
    setChats(updatedChats);
  };

  const handleNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: "New Conversation",
      timestamp: new Date().toISOString(),
      messages: [],
    };
    const updatedChats = [newChat, ...chats];
    saveChats(updatedChats);
    onNewChat(newChat);
  };

  const handleDeleteChat = (chatId, e) => {
    e.stopPropagation();
    const updatedChats = chats.filter((chat) => chat.id !== chatId);
    saveChats(updatedChats);
    if (currentChatId === chatId) {
      onNewChat(null);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg text-white"
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <button
            onClick={handleNewChat}
            className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            New Chat
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chats.length === 0 ? (
            <div className="text-center text-slate-500 mt-8">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Start a new chat to begin</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`p-3 rounded-lg cursor-pointer transition group ${
                  currentChatId === chat.id
                    ? "bg-slate-800 border border-cyan-500"
                    : "bg-slate-800/50 hover:bg-slate-800 border border-transparent"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm truncate">
                      {chat.title}
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">
                      {formatDate(chat.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="ml-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="text-slate-500 text-xs text-center">
            <p>© 2026 OpsMind AI</p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}
    </>
  );
};

export default Sidebar;
