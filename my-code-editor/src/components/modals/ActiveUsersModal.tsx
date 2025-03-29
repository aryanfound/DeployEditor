import React from 'react';
import { Modal } from './Modal';
import { UserPlus } from 'lucide-react';
import type { User } from '../../types';

interface ActiveUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onUserClick: (user: User) => void;
}

export function ActiveUsersModal({ isOpen, onClose, users, onUserClick }: ActiveUsersModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Active Users">
      <div className="space-y-2">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onUserClick(user)}
            className="w-full flex items-center justify-between p-2 rounded hover:bg-[#404249] text-left"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#313338] ${
                  user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                }`} />
              </div>
              <span className="text-white">{user.name}</span>
            </div>
            <UserPlus className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        ))}
      </div>
    </Modal>
  );
}