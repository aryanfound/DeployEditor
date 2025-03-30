import React, { useState } from 'react';
import { Modal } from './Modal';
import { Code, Upload, Key } from 'lucide-react';
import axios from 'axios'
import { useChange } from '../customhook/spaceinfo';
interface NewCodespaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewCodespaceModal({ isOpen, onClose }: NewCodespaceModalProps) {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const {change,setChange}=useChange();
  const handleCreate = async () => {
    try {
        const token = localStorage.getItem('token'); // Get auth token from local storage

        const data = JSON.stringify({ name, logo, accessKey });

        const result = await axios.post('http://localhost:5001/space/newCodeSpace', data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Include auth token
            }
        });

        console.log('Codespace created:', result.data);
        setChange(true);
        onClose();
    } catch (error) {
        console.error('Error creating codespace:', error.response?.data || error.message);
    }
};


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Codespace">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Codespace Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter codespace name"
            className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Logo URL</label>
          <input
            type="text"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            placeholder="Enter logo URL"
            className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
          />
        </div>

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

        <div
          className="border-2 border-dashed border-[#404249] rounded-lg p-8 text-center hover:bg-[#404249] transition-colors cursor-pointer"
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">
            Drag and drop files here or click to browse
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="w-full bg-[#5865f2] text-white py-2 rounded hover:bg-[#4752c4] transition-colors flex items-center justify-center gap-2"
        >
          <Code className="w-4 h-4" />
          Create Codespace
        </button>
      </div>
    </Modal>
  );
}