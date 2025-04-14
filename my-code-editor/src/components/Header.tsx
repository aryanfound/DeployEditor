import React, { useEffect, useState } from "react";
import {
  GitPullRequest,
  Key,
  Users,
  Terminal as Terminal2,
  Plus,
  FilePlus,
  GitCommit,
} from "lucide-react";
import { ConnectionsModal } from "./modals/ConnectionsModal";
import { ActiveUsersModal } from "./modals/ActiveUsersModal";
import { NewCodespaceModal } from "./modals/NewCodespaceModal";
import { PullRequestModal } from "./modals/PullRequestModal";
import { CommitModal } from "./modals/commitModal";
import type { User } from "../types";
import { useChange } from "./customhook/spaceinfo";
import { CodeSpaceInfo } from "../../globaltool";
//import { ydoc } from "./Editor";
import * as Y from 'yjs';

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

  const { currCodeSpaceName } = useChange();

  const handleToggleTerminal = () => {
    setShowTerminal(!showTerminal);
    onToggleTerminal();
<<<<<<< HEAD
=======
  };

  const handleUserClick = (user: User) => {
    console.log("User clicked:", user);
  };

  const handleQuickCommit = () => {
    const update = Y.encodeStateAsUpdate(ydoc);
    console.log("Quick committing update:", update);
    setShowCommitSuccess(true);
    setTimeout(() => setShowCommitSuccess(false), 2000);
>>>>>>> e88757e (folder structre with real time changes)
  };

  useEffect(() => {
    console.log("Current CodeSpace Name:", currCodeSpaceName);
  }, [currCodeSpaceName]);

  return (
    <div className="h-14 bg-[#2b2d31] border-b border-[#1e1f22] flex items-center justify-between px-4">
      {/* Left - Project Info */}
      <div className="flex items-center gap-4">
        <h2 className="text-white font-semibold text-lg tracking-tight">
          {CodeSpaceInfo.currCodeSpaceName || "Untitled"}
        </h2>
      </div>

      {/* Right - Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowNewCodespace(true)}
          className="px-3 py-1.5 text-sm text-white bg-[#5865f2] rounded hover:bg-[#4752c4] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Codespace
        </button>

        <button
          onClick={() => setShowCommit(true)}
          className="px-3 py-1.5 text-sm text-white bg-[#5865f2] rounded hover:bg-[#4752c4] flex items-center gap-2"
        >
          <GitCommit className="w-4 h-4" />
          Commit
        </button>

        <button
          onClick={() => setShowPullRequest(true)}
          className="px-3 py-1.5 text-sm text-white bg-[#5865f2] rounded hover:bg-[#4752c4] flex items-center gap-2"
        >
          <GitPullRequest className="w-4 h-4" />
          Pull Request
        </button>

        <button
          onClick={() => setShowConnections(true)}
          className="p-2 text-gray-400 hover:text-white hover:bg-[#404249] rounded"
        >
          <Key className="w-5 h-5" />
        </button>

        <button
          onClick={handleToggleTerminal}
          className={`p-2 rounded ${
            showTerminal ? "text-white bg-[#404249]" : "text-gray-400 hover:text-white hover:bg-[#404249]"
          }`}
        >
          <Terminal2 className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShowActiveUsers(true)}
          className="flex -space-x-2 hover:opacity-90"
        >
          {mockUsers.map((user) => (
            <img
              key={user.id}
              className="w-8 h-8 rounded-full border-2 border-[#2b2d31]"
              src={user.avatar}
              alt={user.name}
            />
          ))}
        </button>
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

      {/* Commit confirmation notification */}
      {showCommitSuccess && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded shadow-lg text-sm">
          Commit Saved!
        </div>
      )}
    </div>
  );
}