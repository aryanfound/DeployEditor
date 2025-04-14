import { serializeYjsStructure,deserializeToYjs } from "./yjsSerialize";
import { CodeSpaceInfo } from "globaltool";
import axios from "axios";
import * as Y from "yjs";

export async function exportYjsStructure(ydoc: Y.Doc) {
  const serializedData = Y.encodeStateAsUpdate(ydoc)
  
 

  const token = localStorage.getItem("token"); // Get auth token from local storage

}