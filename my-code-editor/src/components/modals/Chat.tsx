import React, { useState, useEffect, useRef } from "react";
import { X, Send, UserCircle, ChevronUp, ChevronDown } from "lucide-react";

// Chat message type definition
export type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: Date;
};

type ChatProps = {
  projectId: string;
  isVisible: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
};

// Mock initial messages - these would come from an API in a real app
const mockMessages: Record<string, ChatMessage[]> = {
  "1": [
    {
      id: "msg1",
      userId: "1",
      userName: "John Doe",
      userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces",
      text: "I've updated the header component with the new design",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: "msg2",
      userId: "2",
      userName: "Jane Smith",
      userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=faces",
      text: "Looks good! Can you also fix the alignment issue in the navigation?",
      timestamp: new Date(Date.now() - 1000 * 60 * 2),
    },
  ],
  "2": [
    {
      id: "msg3",
      userId: "1",
      userName: "John Doe",
      userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces",
      text: "Just pushed the initial dashboard layout",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
  ],
};

export const Chat: React.FC<ChatProps> = ({ projectId, isVisible, onClose, currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages when project changes
  useEffect(() => {
    // In a real app, this would fetch messages from an API
    setMessages(mockMessages[projectId] || []);
  }, [projectId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isVisible) return null;

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text: newMessage.trim(),
      timestamp: new Date(),
    };

    setMessages([...messages, newMsg]);
    setNewMessage("");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = "";

  messages.forEach((message) => {
    const messageDate = formatDate(message.timestamp);
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groupedMessages.push({ date: messageDate, messages: [message] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message);
    }
  });

  return (
    <div className="fixed bottom-0 right-6 w-80 bg-[#2B2D31] rounded-t-lg shadow-lg overflow-hidden border border-[#1E1F22] border-b-0">
      {/* Chat Header */}
      <div className="flex items-center justify-between bg-[#1E1F22] px-4 py-2 text-white cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center space-x-2">
          <span className="font-medium">Project Chat</span>
          <div className="flex -space-x-1">
            {messages.length > 0 && Array.from(new Set(messages.map(m => m.userId))).slice(0, 3).map((userId) => {
              const user = messages.find(m => m.userId === userId);
              return user?.userAvatar ? (
                <img 
                  key={userId}
                  src={user.userAvatar} 
                  alt={user.userName} 
                  className="w-5 h-5 rounded-full border border-[#2B2D31]" 
                />
              ) : (
                <div key={userId} className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-xs">
                  {user?.userName.charAt(0)}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center">
          {isCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="ml-2">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Chat Content */}
      {!isCollapsed && (
        <>
          <div className="h-80 overflow-y-auto p-3 bg-[#313338] text-[#DCDDDE]">
            {groupedMessages.length === 0 ? (
              <div className="text-center text-[#72767D] py-4">
                No messages yet. Start the conversation!
              </div>
            ) : (
              groupedMessages.map((group, groupIndex) => (
                <div key={groupIndex} className="mb-4">
                  <div className="flex items-center my-2">
                    <div className="flex-1 h-px bg-[#3F4147]"></div>
                    <span className="px-2 text-xs text-[#72767D]">{group.date}</span>
                    <div className="flex-1 h-px bg-[#3F4147]"></div>
                  </div>
                  
                  {group.messages.map((message, index) => (
                    <div key={message.id} className="mb-3">
                      <div className="flex items-start">
                        {message.userAvatar ? (
                          <img 
                            src={message.userAvatar} 
                            alt={message.userName} 
                            className="w-8 h-8 rounded-full mr-2" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-500 mr-2 flex items-center justify-center">
                            {message.userName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="font-medium text-white mr-2">{message.userName}</span>
                            <span className="text-xs text-[#72767D]">{formatTime(message.timestamp)}</span>
                          </div>
                          <p className="text-sm mt-1 break-words">{message.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          <div className="p-3 bg-[#383A40] border-t border-[#1E1F22]">
            <div className="flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-[#2B2D31] text-white rounded px-3 py-2 outline-none text-sm"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className={`ml-2 p-2 rounded-full ${newMessage.trim() ? 'bg-blue-600 text-white' : 'bg-[#4F545C] text-[#72767D]'}`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};