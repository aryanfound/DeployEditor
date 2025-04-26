// ChangeContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
} from "react";
import socket from "../../socket"; // Adjust path based on your structure

// Define the shape of the context
interface ChangeContextType {
  change: boolean;
  setChange: (value: boolean) => void;
  currCodeSpaceName: string;
  setCurrCodeSpaceName: (name: string) => void;
  currCodeSpaceId: string;
  setCurrCodeSpaceId: (id: string) => void;
  currspacefolder: string[];
  setCurrspacefolder: (folders: string[]) => void;
  codeChange: boolean;
  setCodeChange: (value: boolean) => void;
  socketRef: React.RefObject<WebSocket | null>;
  readyYjs:boolean;
  setreadyYjs:(value:boolean)=>void;
}

// Create the context
const ChangeContext = createContext<ChangeContextType | undefined>(undefined);

// Provider component
export function ChangeProvider({ children }: { children: ReactNode }) {
  const [change, setChange] = useState(true);
  const [currCodeSpaceName, setCurrCodeSpaceName] = useState<string>("");
  const [currCodeSpaceId, setCurrCodeSpaceId] = useState<string>("");
  const [currspacefolder, setCurrspacefolder] = useState<string[]>([]);
  const [codeChange, setCodeChange] = useState<boolean>(false);
  const [readyYjs,setreadyYjs]=useState<boolean>(false)

  // Initialize socketRef
  const socketRef = useRef<WebSocket | null>(socket);

  return (
    <ChangeContext.Provider
      value={{
        change,
        setChange,
        currCodeSpaceName,
        setCurrCodeSpaceName,
        currCodeSpaceId,
        setCurrCodeSpaceId,
        currspacefolder,
        setCurrspacefolder,
        codeChange,
        setCodeChange,
        socketRef,
        readyYjs,setreadyYjs
      }}
    >
      {children}
    </ChangeContext.Provider>
  );
}

// Custom hook to use the context
export function useChange() {
  const context = useContext(ChangeContext);
  if (!context) {
    throw new Error("useChange must be used within a ChangeProvider");
  }
  return context;
}
