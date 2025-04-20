import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { UserPlus, GitPullRequest, Code, FileText, Users, MessageSquare } from 'lucide-react';
import { clientSocket } from '../../socket';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConnectionRequest {
  id: string;
  username: string;
  message: string;
  sender: string;
  receiver: string; // Added receiver field
  type: 'connection' | 'codespace' | 'document' | 'chat' | string;
  timestamp: number;
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  
  useEffect(() => {
    const handleRequestConnection = (data: ConnectionRequest) => {
      const requestSender = data.sender;
      
      const existingRequest = connectionRequests.find(
        req => req.sender === requestSender && req.type === data.type
      );
      
      if (!existingRequest) {
        setConnectionRequests(prev => [...prev, {
          ...data,
          timestamp: data.timestamp || Date.now()
        }]);
      } else {
        console.log('Duplicate request from sender:', requestSender);
      }
    };
    
    clientSocket.on('requestConnection', handleRequestConnection);
    
    return () => {
      clientSocket.off('requestConnection', handleRequestConnection);
    };
  }, [connectionRequests]); 
  
  const handleAccept = (requestId: string, sender: string) => {
    clientSocket.emit('acceptConnection', { requestId, sender });
    setConnectionRequests(prev => prev.filter(req => req.id !== requestId));
  };
  
  const handleDecline = (requestId: string, sender: string) => {
    clientSocket.emit('declineConnection', { requestId, sender });
    setConnectionRequests(prev => prev.filter(req => req.id !== requestId));
  };

  const getRequestIcon = (type: string) => {
    switch(type) {
      case 'connection':
        return <UserPlus className="w-6 h-6 text-blue-500" />;
      case 'codespace':
        return <Code className="w-6 h-6 text-green-500" />;
      case 'document':
        return <FileText className="w-6 h-6 text-purple-500" />;
      case 'chat':
        return <MessageSquare className="w-6 h-6 text-yellow-500" />;
      default:
        return <Users className="w-6 h-6 text-blue-500" />;
    }
  };

  const getTimeElapsed = (timestamp: number) => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notifications">
      <div className="space-y-6">
        {/* Header with counter */}
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg text-white">Active Requests</h3>
          {connectionRequests.length > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {connectionRequests.length}
            </span>
          )}
        </div>

        {/* Requests list */}
        <div className="space-y-4">
          {connectionRequests.length > 0 ? (
            connectionRequests.map(request => (
              <div 
                key={request.id} 
                className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-700 rounded-full">
                      {getRequestIcon(request.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{request.username}</p>
                        <span className="text-xs text-gray-400">{getTimeElapsed(request.timestamp)}</span>
                      </div>
                      <p className="text-sm text-blue-400 capitalize mb-1">
                        {request.type} Request for {request.receiver} {/* Added receiver display */}
                      </p>
                      <p className="text-sm text-gray-300">{request.message}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAccept(request.id, request.sender)} 
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleDecline(request.id, request.sender)} 
                      className="px-3 py-1 bg-gray-700 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No pending requests</p>
              <p className="text-gray-500 text-xs mt-1">New requests will appear here</p>
            </div>
          )}
        </div>
        
        {/* Sample codespace request section */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Recent Activity</h4>
          <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-700 rounded-full">
                  <GitPullRequest className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">Sarah Miller</p>
                    <span className="text-xs text-gray-400">2h ago</span>
                  </div>
                  <p className="text-sm text-green-400 mb-1">
                    Codespace Invitation for Alex Johnson {/* Added receiver example */}
                  </p>
                  <p className="text-sm text-gray-300">Feature: Add Authentication Flow</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200">
                Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}