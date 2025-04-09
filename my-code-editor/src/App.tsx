import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import CodeEditor from "./components/Editor";
import { Terminal } from './components/teminal';
// import { ErrorConsole } from "./components/output";
import type { Project } from "./types";
import AuthPage from "./auth";

// Mock data
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

  const currentProject = mockProjects.find((p) => p.id === activeProject);

  if (!auth) {
    return <AuthPage setAuth={setAuth} />;
  }

  return (
    <div className="flex h-screen bg-[#313338] flex-col">
      <div className="flex flex-1">
        <Sidebar
          projects={mockProjects}
          activeProject={activeProject}
          onProjectSelect={setActiveProject}
        />
        <div className="flex-1 flex flex-col">
          <Header
            projectName={currentProject?.name || ""}
            onToggleTerminal={() => setShowTerminal(!showTerminal)}
          />
          <div className="flex-1 flex">
            <CodeEditor
              project={currentProject}
              activeFile={activeFile}
              onFileSelect={setActiveFile}
            />
          </div>
        </div>
      </div>
      <Terminal 
        isVisible={showTerminal}
        onClose={() => setShowTerminal(false)}
      />
      <Terminal errors={errors} />
    </div>
  );
}

export default App;