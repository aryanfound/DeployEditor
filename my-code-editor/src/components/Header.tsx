import React, { useEffect, useState } from "react";
import {
  GitPullRequest,
  Key,
  Terminal as Terminal2,
  Plus,
  GitCommit,
  RotateCcw,
  Users
} from "lucide-react";
import { ConnectionsModal } from "./modals/ConnectionsModal";
import { ActiveUsersModal } from "./modals/ActiveUsersModal";
import { NewCodespaceModal } from "./modals/NewCodespaceModal";
import { PullRequestModal } from "./modals/PullRequestModal";
import { CommitModal } from "./modals/commitModal";
import type { User } from "../types";
import { useChange } from "./customhook/spaceinfo";
import { CodeSpaceInfo } from "../../globaltool";
import * as Y from 'yjs';
import { ydoc } from './Editor'



interface HeaderProps {
  projectName: string;
  onToggleTerminal: () => void;
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces",
    status: "online",
  },
  {
    id: "2",
    name: "Jane Smith",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=faces",
    status: "offline",
  },
];

export function Header({ projectName, onToggleTerminal }: HeaderProps) {
  const [showConnections, setShowConnections] = useState(false);
  const [showActiveUsers, setShowActiveUsers] = useState(false);
  const [showNewCodespace, setShowNewCodespace] = useState(false);
  const [showPullRequest, setShowPullRequest] = useState(false);
  const [showCommit, setShowCommit] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showCommitSuccess, setShowCommitSuccess] = useState(false);
  const [showRevertSuccess, setShowRevertSuccess] = useState(false);
  const {change,setChange,setCodeChange}=useChange();
  const { currCodeSpaceName } = useChange();

  const handleToggleTerminal = () => {
    setShowTerminal(!showTerminal);
    onToggleTerminal();
  };

  const handleUserClick = (user: User) => {
    console.log("User clicked:", user);
  };

  const handleQuickCommit = async () => {
    const update = Y.encodeStateAsUpdate(ydoc);
    console.log("Quick committing update:", update);
    
    console.log(CodeSpaceInfo.folder_bufferdata);
    setShowCommitSuccess(true);
    setTimeout(() => setShowCommitSuccess(false), 2000);
  }

  const handleRevert = () => {
    // Handle revert logic here
    console.log("Reverting to previous state");
    setCodeChange(true)
    setShowRevertSuccess(true);
    console.log(CodeSpaceInfo)
    
    setTimeout(() => setShowRevertSuccess(false), 2000);
  };

  useEffect(() => {
    console.log("Current CodeSpace Name:", currCodeSpaceName);
  }, [currCodeSpaceName]);

  return (
    <div className="h-16 bg-[#2b2d31] border-b border-[#1e1f22] flex items-center justify-between px-6 shadow-md">
      {/* Left - Project Info */}
      <div className="flex items-center">
        <div className="flex items-center bg-[#383a40] px-4 py-2 rounded-md">
          <h2 className="text-white font-semibold text-lg tracking-tight">
            {CodeSpaceInfo.currCodeSpaceName || "Untitled"}
          </h2>
        </div>
      </div>

      {/* Right - Buttons */}
      <div className="flex items-center gap-3">
        {/* Main Action Buttons Group */}
        <div className="flex items-center bg-[#383a40] rounded-md mr-2">
          <button
            onClick={() => setShowNewCodespace(true)}
            className="px-3 py-2 text-sm text-white hover:bg-[#4752c4] transition-colors duration-200 rounded-l-md flex items-center gap-2 border-r border-[#2b2d31]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">New</span>
          </button>

          <button
            onClick={() => setShowCommit(true)}
            className="px-3 py-2 text-sm text-white hover:bg-[#4752c4] transition-colors duration-200 flex items-center gap-2 border-r border-[#2b2d31]"
          >
            <GitCommit className="w-4 h-4" />
            <span className="hidden md:inline">Commit</span>
          </button>

          <button
            onClick={handleRevert}
            className="px-3 py-2 text-sm text-white hover:bg-[#4752c4] transition-colors duration-200 flex items-center gap-2 border-r border-[#2b2d31]"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden md:inline">Revert</span>
          </button>

          <button
            onClick={() => setShowPullRequest(true)}
            className="px-3 py-2 text-sm text-white hover:bg-[#4752c4] transition-colors duration-200 rounded-r-md flex items-center gap-2"
          >
            <GitPullRequest className="w-4 h-4" />
            <span className="hidden md:inline">Pull</span>
          </button>
        </div>

        {/* Utility Buttons Group */}
        <div className="flex items-center bg-[#383a40] rounded-md">
          <button
            onClick={() => setShowConnections(true)}
            className="p-2 text-gray-300 hover:text-white hover:bg-[#404249] transition-colors duration-200 rounded-l-md border-r border-[#2b2d31]"
            title="Connections"
          >
            <Key className="w-5 h-5" />
          </button>

          <button
            onClick={handleToggleTerminal}
            className={`p-2 border-r border-[#2b2d31] transition-colors duration-200 ${
              showTerminal ? "text-white bg-[#404249]" : "text-gray-300 hover:text-white hover:bg-[#404249]"
            }`}
            title="Terminal"
          >
            <Terminal2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowActiveUsers(true)}
            className="px-3 py-2 text-gray-300 hover:text-white hover:bg-[#404249] transition-colors duration-200 rounded-r-md flex items-center gap-2"
            title="Active Users"
          >
            <Users className="w-5 h-5" />
            <span className="hidden lg:inline text-sm">{mockUsers.length}</span>
          </button>
        </div>

        {/* User Avatars */}
        <div className="flex ml-1">
          {mockUsers.map((user) => (
            <img
              key={user.id}
              className="w-8 h-8 rounded-full border-2 border-[#2b2d31] hover:border-[#5865f2] transition-all duration-200 cursor-pointer -ml-2 first:ml-0"
              src={user.avatar}
              alt={user.name}
              title={user.name}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      <ConnectionsModal
        isOpen={showConnections}
        onClose={() => setShowConnections(false)}
        connections={mockUsers}
      />

      <ActiveUsersModal
        isOpen={showActiveUsers}
        onClose={() => setShowActiveUsers(false)}
        users={mockUsers}
        onUserClick={handleUserClick}
      />

      <NewCodespaceModal
        isOpen={showNewCodespace}
        onClose={() => setShowNewCodespace(false)}
      />

      <PullRequestModal
        isOpen={showPullRequest}
        onClose={() => setShowPullRequest(false)}
      />

      <CommitModal 
        isOpen={showCommit}
        onClose={() => setShowCommit(false)}
        onCommit={handleQuickCommit}
      />

      {/* Notifications */}
      {showCommitSuccess && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg text-sm flex items-center">
          <GitCommit className="w-4 h-4 mr-2" />
          Commit Saved!
        </div>
      )}

      {showRevertSuccess && (
        <div className="absolute top-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-md shadow-lg text-sm flex items-center">
          <RotateCcw className="w-4 h-4 mr-2" />
          Changes Reverted!
        </div>
      )}
    </div>
  );
}