import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Copy, UserPlus, Check, Search } from 'lucide-react';
import type { User } from '../../types';
import { CodeSpaceInfo } from '../../../globaltool';
import { useChange } from '../customhook/spaceinfo';
import axios from 'axios';
import {clientSocket} from '../../socket'
interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: User[];
}

function handleAddConnection(receiverId: string) {
  console.log('Adding connection to:', receiverId);
  clientSocket.emit('addConnection',{recipent:receiverId,codeSpaceId:CodeSpaceInfo.currCodeSpaceId,sender:localStorage.getItem('username')});
}


export function InterConnectionsModal({ isOpen, onClose, connections }: ConnectionsModalProps) {
  console.log('codeId: ',CodeSpaceInfo.currCodeSpaceId)
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredConnections, setFilteredConnections] = useState<User[]>(connections);
  const {change}=useChange();
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!search.trim()) {
        setFilteredConnections(connections);
        return;
      }
      try {
        const {data}=await axios.post('http://localhost:5001/getConnections',{
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`,
                'Content-Type':'application/json'
            }
            ,
            part:search,
        })
        console.log('data found: ',data)
        setFilteredConnections(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, connections]);

  const copyAccessKey = async () => {
    try {
      await navigator.clipboard.writeText(CodeSpaceInfo.currCodeSpaceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Function to get a realistic avatar
  const getAvatar = (id: string, avatar?: string) => {
    return avatar || `https://i.pravatar.cc/150?img=${parseInt(id, 16) % 70 + 1}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ask to Join CodeSpace">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-[#1e1f22] text-white rounded pl-10"
          />
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
        </div>

        {/* Display User Connections */}
        <div className="space-y-2">
          {filteredConnections.map(({ _id, username, avatar }) => (
            <div
              key={_id}
              className="flex items-center justify-between p-2 rounded hover:bg-[#404249]"
            >
              <div className="flex items-center gap-3">
                <img 
                  src={getAvatar(_id, avatar)} 
                  alt={username} 
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-white">{username}</span>
              </div>
              <button className="text-gray-400 hover:text-white" onClick={()=>{
                handleAddConnection(_id);
              }}>
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        
        {/* Access Key Section */}
        <div className="mt-4 pt-4 border-t border-[#1e1f22]">
          <label className="block text-sm text-gray-400 mb-2">Access Key</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={CodeSpaceInfo.currCodeSpaceId}
              readOnly
              className="flex-1 bg-[#1e1f22] text-white px-3 py-2 rounded"
            />
            <button
              onClick={copyAccessKey}
              className={`p-2 rounded transition-colors ${copied ? 'text-green-400' : 'text-gray-400 hover:text-white hover:bg-[#404249]'}`}
              disabled={copied}
              aria-label={copied ? "Copied!" : "Copy to clipboard"}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}