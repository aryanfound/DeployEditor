import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import * as Y from 'yjs';
import { ydoc } from '../Editor';
import { useChange } from '../customhook/spaceinfo';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatboxRef = useRef<Y.Array<Message> | null>(null);
  const { readyYjs, setreadyYjs } = useChange();

  useEffect(() => {
    if (!readyYjs || !ydoc) {
      console.warn('YDoc not initialized or readyYjs is false');
      return;
    }

    const chatbox = ydoc.getArray<Message>('messages');
    chatboxRef.current = chatbox;

    // Load initial messages
    const initialMessages = chatbox.toArray();
    setMessages(initialMessages);
    setIsInitialized(true);

    const observer = (event: Y.YArrayEvent<Message>) => {
      console.log('Observer triggered. New messages:');
      const updatedMessages = chatboxRef.current?.toArray()
      
      setMessages(updatedMessages);
    };

    chatbox.observeDeep(observer);
    console.log('Observer attached');

    // Reset ready flag
    setreadyYjs(false);

    return () => {
      chatbox.unobserve(observer);
      console.log('Observer cleaned up');
    };
  }, [readyYjs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    if (!inputMessage.trim() || !chatboxRef.current) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: currentUser,
      timestamp: Date.now(),
    };

    ydoc?.transact(() => {
      chatboxRef.current!.push([newMsg]);
    });

    setInputMessage('');
  }, [inputMessage, currentUser]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-gray-800 text-white shadow-xl z-[100]">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center">
          <MessageSquare className="mr-2" />
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X />
        </button>
      </div>

      <div className="overflow-y-auto p-4" style={{ height: 'calc(100% - 120px)' }}>
        {!isInitialized ? (
          <div className="text-center py-4 text-gray-400">Initializing chat...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4 text-gray-400">No messages yet</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 ${message.sender === currentUser ? 'text-right' : 'text-left'}`}
            >
              <div
                className={`inline-block px-4 py-2 rounded-lg ${
                  message.sender === currentUser
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-white'
                }`}
              >
                {message.text}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {message.sender} •{' '}
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-l-lg focus:outline-none"
            disabled={!isInitialized}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
            disabled={!inputMessage.trim() || !isInitialized}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
