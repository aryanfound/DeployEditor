import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import CodeEditor from "./components/Editor";
import { Terminal } from './components/teminal';
import type { Project } from "./types";
import AuthPage from "./auth";

const mockProjects: Project[] = [
  {
    id: "1",
    name: "CodeCanvas",
    lastModified: "2024-03-10",
    collaborators: [
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
    ],
    files: [
      {
        id: "f1",
        name: "src",
        type: "folder",
        children: [
          {
            id: "f2",
            name: "components",
            type: "folder",
            children: [
              {
                id: "f3",
                name: "App.tsx",
                type: "file",
                activeUsers: [
                  {
                    id: "1",
                    name: "John Doe",
                    avatar:
                      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces",
                    status: "online",
                  },
                ],
              },
              { id: "f4", name: "Header.tsx", type: "file" },
            ],
          },
          { id: "f5", name: "main.tsx", type: "file" },
        ],
      },
      {
        id: "f6",
        name: "package.json",
        type: "file",
        activeUsers: [
          {
            id: "2",
            name: "Jane Smith",
            avatar:
              "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=faces",
            status: "offline",
          },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Dashboard UI",
    lastModified: "2024-03-09",
    collaborators: [
      {
        id: "1",
        name: "John Doe",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces",
        status: "online",
      },
    ],
    files: [
      { id: "f7", name: "README.md", type: "file" },
      { id: "f8", name: "index.html", type: "file" },
    ],
  },
];

function App() {
  const [activeProject, setActiveProject] = useState<string>(mockProjects[0].id);
  const [showTerminal, setShowTerminal] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [auth, setAuth] = useState(false);
  const [errors, setErrors] = useState([]);
  const [sidebarWidth, setSidebarWidth] = useState(70);
  const [resizing, setResizing] = useState(false);

  const currentProject = mockProjects.find((p) => p.id === activeProject);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing) {
        const newWidth = Math.min(Math.max(e.clientX, 180), 500);
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing]);

  if (!auth) {
    return <AuthPage setAuth={setAuth} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#313338]">
      <div className="flex flex-1 overflow-hidden">
        <div className="relative" style={{ width: `${sidebarWidth}px` }}>
          <div className="h-full w-full border-r border-gray-700">
            <Sidebar
              projects={mockProjects}
              activeProject={activeProject}
              onProjectSelect={setActiveProject}
            />
          </div>
          <div
            className="absolute top-0 right-0 w-1 hover:w-2 transition-all cursor-ew-resize bg-gray-600"
            onMouseDown={() => setResizing(true)}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            projectName={currentProject?.name || ""}
            onToggleTerminal={() => setShowTerminal(!showTerminal)}
          />

          <div className="flex-1 overflow-hidden">
            <CodeEditor
              project={currentProject}
              activeFile={activeFile}
              onFileSelect={setActiveFile}
            />
          </div>

          {showTerminal && (
            <div className="h-[250px] bg-black text-white border-t border-gray-700 overflow-hidden">
              <Terminal
                isVisible={showTerminal}
                onClose={() => setShowTerminal(false)}
                errors={errors}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
