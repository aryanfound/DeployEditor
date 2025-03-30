import React, { useState } from "react";
import axios from "axios";

export const CodeSpaceInfo: {
  name: string;
  currCodeSpaceName: string;
  currCodeSpaceId: string;
  currspacefolder: string[];
  spaces: { id: string, name: string, owners: string[] }[];
} = {
  name: "",
  currCodeSpaceName: "",
  currCodeSpaceId: "",
  currspacefolder: [],
  spaces: []
};


// Refined version of setCodeSpace
const setCodeSpace = async (
    
  setChange: (value: boolean) => void,
  setCurrCodeSpaceName: (name: string) => void
): Promise<any> => {
  try {
    // Validate arguments
    if (!selectedSpace || typeof selectedSpace !== "object") {
      throw new Error("Invalid argument: selectedSpace must be a non-null object.");
    }

    if (
      !selectedSpace.currCodeSpaceId ||
      !selectedSpace.currCodeSpaceName ||
      !Array.isArray(selectedSpace.currspacefolder)
    ) {
      throw new Error(
        "Invalid argument: selectedSpace must contain currCodeSpaceId, currCodeSpaceName, and currspacefolder."
      );
    }

    console.log("Running setCodeSpace with:", selectedSpace);

    const token = localStorage.getItem("token"); // Get auth token from local storage
    if (!token) {
      throw new Error("Authentication token is missing.");
    }

    // Make an API call to fetch additional space information
    const result = await axios.post(
      "http://localhost:5001/space/getSpaceInfo",
      { spaceid: selectedSpace.currCodeSpaceId }, // Use currCodeSpaceId for selecting the correct space
      {
        headers: {
          Authorization: `Bearer ${token}`, // Set the auth token in headers
        },
      }
    );

    console.log("Space Info Response:", result.data);

    // Update CodeSpaceInfo with the response data
    CodeSpaceInfo.currCodeSpaceName = result.data.Name;
    CodeSpaceInfo.currCodeSpaceId = result.data._id;
    CodeSpaceInfo.currspacefolder = result.data.folder;

    // Update the parent state for current code space name
    setCurrCodeSpaceName(result.data.Name);

    // Set the change flag to false
    setChange(false);

    return result.data; // Return result data to be used as needed
  } catch (err) {
    console.error("Error in setCodeSpace:", err);
    // Handle the error accordingly (e.g., throw the error or set error state)
    throw err; // Re-throw the error for further handling if needed
  }
};
