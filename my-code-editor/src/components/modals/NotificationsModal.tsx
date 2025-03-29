import React from 'react';
import { Modal } from './Modal';
import { UserPlus, GitPullRequest } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notifications">
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Connection Requests</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded hover:bg-[#404249]">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=faces"
                  alt="User"
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-white">Alex Johnson</p>
                  <p className="text-sm text-gray-400">Wants to connect</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-[#5865f2] text-white rounded hover:bg-[#4752c4]">
                  Accept
                </button>
                <button className="px-3 py-1 bg-[#ed4245] text-white rounded hover:bg-[#c53337]">
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Codespace Requests</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded hover:bg-[#404249]">
              <div className="flex items-center gap-3">
                <GitPullRequest className="w-6 h-6 text-[#5865f2]" />
                <div>
                  <p className="text-white">Feature: Add Authentication</p>
                  <p className="text-sm text-gray-400">by Sarah Miller</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-[#5865f2] text-white rounded hover:bg-[#4752c4]">
                Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}