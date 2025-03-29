import React, { useState } from 'react';
import { FolderGit2, Users, Layout, Bell, Key } from 'lucide-react';
import { NotificationsModal } from './modals/NotificationsModal';
import { ConnectionsModal } from './modals/ConnectionsModal';
import { JoinCodespaceModal } from './modals/JoinCodespaceModal';
import type { Project, User } from '../types';

interface SidebarProps {
  projects: Project[];
  activeProject?: string;
  onProjectSelect: (id: string) => void;
}

const mockUsers: User[] = [
  { id: '1', name: 'John Doe', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces', status: 'online' },
  { id: '2', name: 'Jane Smith', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=faces', status: 'offline' },
];

export function Sidebar({ projects, activeProject, onProjectSelect }: SidebarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showJoinCodespace, setShowJoinCodespace] = useState(false);

  return (
    <div className="w-[72px] bg-[#1e1f22] h-screen flex flex-col items-center py-4 gap-2">
      <button className="w-12 h-12 rounded-full bg-[#313338] flex items-center justify-center text-white hover:bg-blue-600 transition-colors">
        <Layout className="w-6 h-6" />
      </button>
      
      <div className="w-8 h-px bg-[#2b2d31] my-2" />
      
      {projects.map((project) => (
        <button
          key={project.id}
          onClick={() => onProjectSelect(project.id)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            activeProject === project.id
              ? 'bg-blue-600 text-white'
              : 'bg-[#313338] text-gray-300 hover:bg-blue-600 hover:text-white hover:rounded-2xl'
          }`}
        >
          <FolderGit2 className="w-6 h-6" />
        </button>
      ))}
      
      <div className="mt-auto flex flex-col gap-2">
        <button
          onClick={() => setShowJoinCodespace(true)}
          className="w-12 h-12 rounded-full bg-[#313338] flex items-center justify-center text-gray-300 hover:bg-[#404249] hover:text-white transition-colors"
        >
          <Key className="w-6 h-6" />
        </button>
        <button
          onClick={() => setShowConnections(true)}
          className="w-12 h-12 rounded-full bg-[#313338] flex items-center justify-center text-gray-300 hover:bg-[#404249] hover:text-white transition-colors"
        >
          <Users className="w-6 h-6" />
        </button>
        <button
          onClick={() => setShowNotifications(true)}
          className="w-12 h-12 rounded-full bg-[#313338] flex items-center justify-center text-gray-300 hover:bg-[#404249] hover:text-white transition-colors"
        >
          <Bell className="w-6 h-6" />
        </button>
      </div>

      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <ConnectionsModal
        isOpen={showConnections}
        onClose={() => setShowConnections(false)}
        connections={mockUsers}
      />

      <JoinCodespaceModal
        isOpen={showJoinCodespace}
        onClose={() => setShowJoinCodespace(false)}
      />
    </div>
  );
}