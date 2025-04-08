import React, { useEffect, useState } from "react";
import { GitPullRequest, Key, Users, Terminal as Terminal2, Plus } from "lucide-react";
import { ConnectionsModal } from "./modals/ConnectionsModal";
import { ActiveUsersModal } from "./modals/ActiveUsersModal";
import { NewCodespaceModal } from "./modals/NewCodespaceModal";
import { PullRequestModal } from "./modals/PullRequestModal";
import type { User } from "../types";
import { useChange } from "./customhook/spaceinfo";
import { CodeSpaceInfo } from "../../globaltool";

interface HeaderProps {
  projectName: string;

  onToggleTerminal: () => void;
}


const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces",
    status: "online",
  },
  {
    id: "2",
    name: "Jane Smith",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=faces",
    status: "offline",
  },
];

export function Header({ projectName, onToggleTerminal }: HeaderProps) {
  const [showConnections, setShowConnections] = useState(false);
  const [showActiveUsers, setShowActiveUsers] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showNewCodespace, setShowNewCodespace] = useState(false);
  const [showPullRequest, setShowPullRequest] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  // Access global state using the custom hook
  const { currCodeSpaceName } = useChange();

  const handleUserClick = (user: User) => {
    console.log("User clicked:", user);
    // Handle user interaction
  };

  const handleToggleCanvas = () => {
    setShowCanvas(!showCanvas);
    onToggleCanvas();
  };



  const handleToggleTerminal = () => {
    setShowTerminal(!showTerminal);
    onToggleTerminal();
   
  };

  useEffect(() => {
    console.log("Current CodeSpace Name:", currCodeSpaceName);
  }, [currCodeSpaceName]); // React to changes in currCodeSpaceName

  return (
    <div className="h-14 bg-[#2b2d31] border-b border-[#1e1f22] flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        {/* Display the current codespace name */}
        <h2 className="text-white font-medium">
          {CodeSpaceInfo.currCodeSpaceName || "Untitled"}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowNewCodespace(true)}
          className="px-3 py-1.5 text-sm text-white bg-[#5865f2] rounded hover:bg-[#4752c4] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Codespace
        </button>

        <button
          onClick={() => setShowPullRequest(true)}
          className="px-3 py-1.5 text-sm text-white bg-[#5865f2] rounded hover:bg-[#4752c4] transition-colors flex items-center gap-2"
        >
          <GitPullRequest className="w-4 h-4" />
          Pull Request
        </button>

        <button
          onClick={() => setShowConnections(true)}
          className="p-2 text-gray-400 hover:text-white hover:bg-[#404249] rounded transition-colors"
        >
          <Key className="w-5 h-5" />
        </button>

        <button
          onClick={handleToggleTerminal}
          className={`p-2 transition-colors rounded ${
            showTerminal
              ? "text-white bg-[#404249]"
              : "text-gray-400 hover:text-white hover:bg-[#404249]"
          }`}
        >
          <Terminal2 className="w-5 h-5" />
        </button>

       

        <button
          onClick={() => setShowActiveUsers(true)}
          className="flex -space-x-2 hover:opacity-90 transition-opacity"
        >
          <img
            className="w-8 h-8 rounded-full border-2 border-[#2b2d31]"
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces"
            alt="User 1"
          />
          <img
            className="w-8 h-8 rounded-full border-2 border-[#2b2d31]"
            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=faces"
            alt="User 2"
          />
        </button>
      </div>

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
    </div>
  );
}