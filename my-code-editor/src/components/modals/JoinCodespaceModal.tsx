import React, { useState } from 'react';
import { Modal } from './Modal';
import { Key } from 'lucide-react';

interface JoinCodespaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinCodespaceModal({ isOpen, onClose }: JoinCodespaceModalProps) {
  const [accessKey, setAccessKey] = useState('');

  const handleJoin = () => {
    // Handle joining codespace with access key
    console.log('Joining with key:', accessKey);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Codespace">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Access Key</label>
          <input
            type="text"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            placeholder="Enter access key"
            className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
          />
        </div>
        <button
          onClick={handleJoin}
          className="w-full bg-[#5865f2] text-white py-2 rounded hover:bg-[#4752c4] transition-colors flex items-center justify-center gap-2"
        >
          <Key className="w-4 h-4" />
          Join Codespace
        </button>
      </div>
    </Modal>
  );
}