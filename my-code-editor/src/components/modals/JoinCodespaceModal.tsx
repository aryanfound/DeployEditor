import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Key } from "lucide-react";
import axios from "axios";
import { useChange } from "../customhook/spaceinfo";

interface JoinCodespaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface JoinSpaceParams {
  accessKey: string;
  setChange: React.Dispatch<React.SetStateAction<boolean>>;
}

async function joinspace({ accessKey, setChange }: JoinSpaceParams): Promise<{ success: boolean; error?: string; status?: number }> {
  const token = localStorage.getItem("token");
  if (!token) {
    return { success: false, error: "No token found in localStorage.", status: 401 };
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const data = {
    accessKey: accessKey,
  };

  try {
    const response = await axios.post(
      "http://localhost:5001/space/joinCodeSpace",
      data,
      { headers }
    );
    console.log("Response:", response.data);
    console.log("Successfully joined the codespace!");
    setChange(prev => !prev); // Toggle the change state to trigger updates
    return { success: true };
  } catch (error) {
    console.error("Error joining codespace:", error);
    const status = error.response?.status || 500;
    let errorMessage = "Failed to join the codespace. Please check the access key.";
    
    if (status === 401) {
      errorMessage = "Unauthorized access - invalid token or access key.";
    } else if (status === 404) {
      errorMessage = "Codespace not found. Please check your access key.";
    } else if (status === 403) {
      errorMessage = "You don't have permission to join this codespace.";
    } else if (status === 400) {
      errorMessage = "You are already a member of this codespace.";
    }
    
    return { success: false, error: errorMessage, status };
  }
}

export function JoinCodespaceModal({ isOpen, onClose }: JoinCodespaceModalProps) {
  const { setChange } = useChange();
  const [accessKey, setAccessKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Effect to clear error message after 4 seconds
  useEffect(() => {
    let errorTimer: NodeJS.Timeout;
    
    if (errorMessage) {
      errorTimer = setTimeout(() => {
        setErrorMessage("");
      }, 4000); // 4 seconds
    }
    
    // Cleanup timer on component unmount or when error message changes
    return () => {
      if (errorTimer) {
        clearTimeout(errorTimer);
      }
    };
  }, [errorMessage]);

  const handleJoin = async () => {
    if (!accessKey.trim()) {
      setErrorMessage("Access key cannot be empty.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      console.log("Joining with key:", accessKey);
      const result = await joinspace({ accessKey, setChange });
      
      if (result.success) {
        onClose(); // Close the modal only if joining was successful
      } else {
        setErrorMessage(result.error || "An unknown error occurred.");
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  // Reset error message when modal opens/closes
  useEffect(() => {
    setErrorMessage("");
    setAccessKey("");
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Codespace">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Access Key</label>
          <input
            type="text"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter access key"
            className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
            autoFocus
          />
        </div>
        
        <button
          onClick={handleJoin}
          disabled={isLoading}
          className="w-full bg-[#5865f2] text-white py-2 rounded hover:bg-[#4752c4] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            "Joining..."
          ) : (
            <>
              <Key className="w-4 h-4" />
              Join Codespace
            </>
          )}
        </button>
        
        {errorMessage && (
          <div className="text-red-500 text-sm mt-2 p-2 rounded bg-red-100 bg-opacity-10 transition-opacity">
            {errorMessage}
          </div>
        )}
      </div>
    </Modal>
  );
}