import React from 'react';
import { Modal } from './Modal';
import { Copy, UserPlus } from 'lucide-react';
import type { User } from '../../types';

interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: User[];
}

export function ConnectionsModal({ isOpen, onClose, connections }: ConnectionsModalProps) {
  const accessKey = "abc123xyz789"; // This would come from your auth system

  const copyAccessKey = () => {
    navigator.clipboard.writeText(accessKey);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connections">
      <div className="space-y-4">
        <div className="space-y-2">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="flex items-center justify-between p-2 rounded hover:bg-[#404249]"
            >
              <div className="flex items-center gap-3">
                <img
                  src={connection.avatar}
                  alt={connection.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-white">{connection.name}</span>
              </div>
              <button className="text-gray-400 hover:text-white">
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-[#1e1f22]">
          <label className="block text-sm text-gray-400 mb-2">Access Key</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={accessKey}
              readOnly
              className="flex-1 bg-[#1e1f22] text-white px-3 py-2 rounded"
            />
            <button
              onClick={copyAccessKey}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#404249] rounded"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}