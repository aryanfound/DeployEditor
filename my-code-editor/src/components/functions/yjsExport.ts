// functions/yjsExport.js
import { serializeYjsStructure, deserializeToYjs } from "./yjsSerialize";
import { CodeSpaceInfo } from "../../../globaltool";
import axios from "axios";
import * as Y from "yjs";
import lz4 from "lz4js";
import { getYDoc } from "../Editor";

export async function exportYjsStructure(commitMessage, commitDescription) {
  try {
    const ydoc = getYDoc();
    if (!ydoc) {
      throw new Error("No Y.Doc available for export");
    }
    
    const serializedData = Y.encodeStateAsUpdate(ydoc);
    const compressedData = Array.from(lz4.compress(serializedData));
    const token = localStorage.getItem("token");
    
    if (!token) {
      throw new Error("Authentication token not found");
    }
    
    if (!CodeSpaceInfo.currCodeSpaceId) {
      throw new Error("No codeSpaceId available");
    }
    
    const response = await axios.post('http://localhost:5001/space/commit', {
      commitMessage,
      commitDescription,
      codeSpaceId: CodeSpaceInfo.currCodeSpaceId, 
      data: compressedData
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("Export successful:", response.data);
    return compressedData; // Return compressed data for further use
  } catch (error) {
    console.error("Failed to export Yjs structure:", error);
    throw error;
  }
}

export function getDoc() {
  if (!CodeSpaceInfo.folder_bufferdata?.data?.length) {
    console.log("No data found. Returning null.");
    return null;
  }

  try {
    const buffer = Uint8Array.from(CodeSpaceInfo.folder_bufferdata.data || []);
    const decodedData = lz4.decompress(buffer);

    if (!decodedData || decodedData.length === 0) {
      throw new Error("Decompressed data is empty or invalid");
    }

    return decodedData;
  } catch (error) {
    console.error("Failed to decompress data:", error);
    return null;
  }
}