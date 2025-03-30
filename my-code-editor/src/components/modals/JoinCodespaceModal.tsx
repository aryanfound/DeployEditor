import React, { useState } from "react";
import { Modal } from "./Modal";
import { Key } from "lucide-react";
import axios from "axios";
import { useChange } from "../customhook/spaceinfo";
interface JoinCodespaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

async function joinspace({accessKey,setchange}): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found in localStorage.");
    return;
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
    alert("Successfully joined the codespace!");
    console.log(response.data);

  } catch (error) {
    console.error("Error joining codespace:", error);
    alert("Failed to join the codespace. Please check the access key.");
  }
}

export function JoinCodespaceModal({ isOpen, onClose }: JoinCodespaceModalProps) {
  
  const {setChange}=useChange()
  const [accessKey, setAccessKey] = useState("");

  const handleJoin = async () => {
    if (!accessKey.trim()) {
      alert("Access key cannot be empty.");
      return;
    }

    console.log("Joining with key:", accessKey);
    await joinspace({accessKey,setChange}); // Call the joinspace function
    onClose(); // Close the modal after attempting to join
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Codespace">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Access Key</label>
          <input
            type="text"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            placeholder="Enter access key"
            className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
          />
        </div>
        <button
          onClick={handleJoin}
          className="w-full bg-[#5865f2] text-white py-2 rounded hover:bg-[#4752c4] transition-colors flex items-center justify-center gap-2"
        >
          <Key className="w-4 h-4" />
          Join Codespace
        </button>
      </div>
    </Modal>
  );
}
