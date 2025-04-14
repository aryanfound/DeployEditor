import React, { useEffect, useState } from "react";
import { 
  FolderGit2, 
  Layout, 
  Key, 
  Users, 
  Bell,
  Code,
  CodepenIcon,
  Codesandbox,
  Container,
  Cpu,
  Database,
  FileCode,
  Github,
  Globe,
  Server
} from "lucide-react";
import { NotificationsModal } from "./modals/NotificationsModal";
import { ConnectionsModal } from "./modals/ConnectionsModal";
import { JoinCodespaceModal } from "./modals/JoinCodespaceModal";
import { useChange } from "./customhook/spaceinfo";
import { CodeSpaceInfo, setCodeSpace } from "../../globaltool";
import axios from "axios";
import type { Project, User } from "../types";

interface CodeSpace {
  id: string;
  name: string;
  folder: string[];
  _id: string;
  avatar?: string;
}

const SPACE_ICONS = [
  Code,
  CodepenIcon,
  Codesandbox,
  Container,
  Cpu,
  Database,
  FileCode,
  Github,
  Globe,
  Layout,
  Server
];

const getRandomIcon = () => {
  const randomIndex = Math.floor(Math.random() * SPACE_ICONS.length);
  return SPACE_ICONS[randomIndex];
};

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

const getAvatarColor = (name: string = "Server") => {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
  ];
  const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return colors[hash % colors.length];
};

async function fetchCodeSpaces(
  setSpaces: React.Dispatch<React.SetStateAction<CodeSpace[]>>,
  setChange: React.Dispatch<React.SetStateAction<boolean>>,
  setCurrCodeSpaceName: React.Dispatch<React.SetStateAction<string>>
) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage.");
      return;
    }

    const response = await axios.post(
      " http://localhost:5001/space/getCodeSpace",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const spaces = Array.isArray(response.data) 
      ? response.data.map((space: any) => ({
          _id: space._id || "",
          name: space.name || "Unnamed Space",
          folder: Array.isArray(space.folder) ? space.folder : [],
          id: space.id || "",
          avatar: space.avatar || null,
        }))
      : [];

    CodeSpaceInfo.spaces = spaces;
    CodeSpaceInfo.currCodeSpaceId = spaces[0]?._id || "";
    
    setSpaces(spaces);
    setCurrCodeSpaceName(spaces[0]?.name || "");
  } catch (error) {
    console.error("Error fetching code spaces:", error);
  } finally {
    setChange(false);
  }
}

interface SidebarProps {
  projects: Project[];
  activeProject?: string;
  onProjectSelect: (id: string) => void;
}

export function Sidebar({ projects, activeProject, onProjectSelect }: SidebarProps) {
  const [spaces, setSpaces] = useState<CodeSpace[]>([]);
  const [currCodeSpaceName, setCurrCodeSpaceName] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showJoinCodespace, setShowJoinCodespace] = useState(false);
  const [activeIcon, setActiveIcon] = useState<string | null>(null);
  const [activeSpace, setActiveSpace] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [spaceIcons, setSpaceIcons] = useState<{ [key: string]: React.ElementType }>({});
  const {currspacefolder,setCurrspacefolder}=useChange()//passing prop to change folders as per the current codespace
  const { change, setChange, setCurrCodeSpaceId } = useChange();

  useEffect(() => {
    if (change) {
      setIsLoading(true);
      fetchCodeSpaces(setSpaces, setChange, setCurrCodeSpaceName)
        .finally(() => setIsLoading(false));
    }
  }, [ setChange]);

  useEffect(() => {
    // Generate and store random icons for spaces that don't have avatars
    const newSpaceIcons = { ...spaceIcons };
    spaces.forEach(space => {
      if (!space.avatar && !newSpaceIcons[space._id]) {
        newSpaceIcons[space._id] = getRandomIcon();
      }
    });
    setSpaceIcons(newSpaceIcons);
  }, [spaces]);

  const handleCodeSpaceSelect = (spaceId: string) => {
    const selectedSpace = spaces.find((space) => space._id === spaceId);
    if (selectedSpace) {
      setCurrCodeSpaceId(spaceId);
      setActiveSpace(spaceId);
      CodeSpaceInfo.currCodeSpaceId = spaceId;
      setCodeSpace(setChange, setCurrCodeSpaceName);
      setChange(true)
    }
  };

  const handleIconClick = (iconName: string) => {
    setActiveIcon(activeIcon === iconName ? null : iconName);
  };

  return (
    <div className="w-[72px] bg-[#1e1f22] h-screen flex flex-col items-center py-4 gap-2 overflow-y-auto">
      <style jsx>{`
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
      `}</style>

      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-2">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : spaces.length > 0 ? (
          spaces.map((space) => {
            const spaceName = space.name || "Unnamed Space";
            const SpaceIcon = spaceIcons[space._id];
            return (
              <button
                key={space._id}
                title={spaceName}
                onClick={() => handleCodeSpaceSelect(space._id)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  activeSpace === space._id
                    ? "bg-blue-600 text-white rounded-2xl"
                    : "bg-[#313338] text-gray-300 hover:bg-[#404249] hover:text-white"
                }`}
              >
                {space.avatar ? (
                  <img
                    src={space.avatar}
                    alt={spaceName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : SpaceIcon ? (
                  <SpaceIcon className="w-6 h-6" />
                ) : (
                  <div className={`w-8 h-8 rounded-full ${getAvatarColor(spaceName)} flex items-center justify-center text-white font-medium text-xs`}>
                    {spaceName.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            );
          })
        ) : (
          <p className="text-gray-400 text-xs text-center px-1">No codespaces</p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <button
          onClick={() => {
            setShowJoinCodespace(true);
            handleIconClick("key");
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            activeIcon === "key"
              ? "bg-blue-600 text-white rounded-2xl"
              : "bg-[#313338] text-gray-300 hover:bg-[#404249] hover:text-white"
          }`}
        >
          <Key className="w-6 h-6" />
        </button>
        <button
          onClick={() => {
            setShowConnections(true);
            handleIconClick("users");
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            activeIcon === "users"
              ? "bg-blue-600 text-white rounded-2xl"
              : "bg-[#313338] text-gray-300 hover:bg-[#404249] hover:text-white"
          }`}
        >
          <Users className="w-6 h-6" />
        </button>
        <button
          onClick={() => {
            setShowNotifications(true);
            handleIconClick("bell");
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            activeIcon === "bell"
              ? "bg-blue-600 text-white rounded-2xl"
              : "bg-[#313338] text-gray-300 hover:bg-[#404249] hover:text-white"
          }`}
        >
          <Bell className="w-6 h-6" />
        </button>
      </div>

      <NotificationsModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      <ConnectionsModal
        isOpen={showConnections}
        onClose={() => setShowConnections(false)}
        connections={mockUsers}
      />
      <JoinCodespaceModal isOpen={showJoinCodespace} onClose={() => setShowJoinCodespace(false)} />
    </div>
  );
}