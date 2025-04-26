import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';

interface ChatIconProps {
  onClick: () => void;
  isOpen: boolean;
  unreadCount: number;
}




export const ChatIcon: React.FC<ChatIconProps> = ({ onClick, isOpen, unreadCount }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
        isOpen ? 'bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'
      }`}
      aria-label="Chat"
    >
      <MessageSquare className="text-white w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  );
};