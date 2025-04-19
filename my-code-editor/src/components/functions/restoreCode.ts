import * as Y from "yjs";
import { getDoc } from "./yjsExport";
import { clearYDoc } from "./clearYdoc";

const performDocumentReset = async ({
  ydoc,
  yfileMap,
  yrootItems,
  yprovider,
  modelsRef,
  setActiveFileId,
}: {
  ydoc: Y.Doc | null;
  yfileMap: Y.Map<any> | null;
  yrootItems: Y.Array<string> | null;
  yprovider: Y.WebsocketProvider | null;
  modelsRef: React.MutableRefObject<Map<string, monaco.editor.ITextModel>>;
  setActiveFileId: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const YbufferData = getDoc();
   console.log(ydoc,yrootItems,yfileMap,modelsRef,setActiveFileId,yprovider) 
  if (!YbufferData) {
    console.error("No data available for reset");
    return;
  }

  const tempDoc = new Y.Doc();
    
  try {
    Y.applyUpdate(tempDoc, YbufferData);
      
    const tempFileMap = tempDoc.getMap("fileMap");
    const tempRootItems = tempDoc.getArray("rootItems");
      
    if (tempFileMap.size === 0) {
      throw new Error("No content found in temporary document");
    }

    if (yprovider) {
      yprovider.disconnect();
    }

    if (ydoc) {
      clearYDoc(ydoc, yfileMap, yrootItems, modelsRef, setActiveFileId);
        
      yfileMap = ydoc.getMap("fileMap");
      yrootItems = ydoc.getArray("rootItems");
        
      const copyItem = (itemId: string) => {
        const sourceItem = tempFileMap.get(itemId);
        if (!sourceItem) return;

        const newItem = new Y.Map();
          
        sourceItem.forEach((value, key) => {
          if (value instanceof Y.Text) {
            const newText = new Y.Text();
            newText.insert(0, value.toString());
            newItem.set(key, newText);
          } else if (value instanceof Y.Array) {
            const newArray = new Y.Array();
            const items = value.toArray();
            if (items.length > 0) {
              newArray.insert(0, items);
            }
            newItem.set(key, newArray);
          } else {
            newItem.set(key, value);
          }
        });

        yfileMap?.set(itemId, newItem);

        if (sourceItem.get("type") === "folder" && sourceItem.get("children")) {
          sourceItem.get("children").forEach((childId: string) => {
            copyItem(childId);
          });
        }
      };

      const rootItems = tempRootItems.toArray().filter(id => id !== null && tempFileMap.has(id));
      if (rootItems.length > 0) {
        rootItems.forEach(itemId => {
          copyItem(itemId);
          yrootItems?.push([itemId]);
        });
      }
    }
  } catch (error) {
    console.error("Error during document reset:", error);
  } finally {
    if (yprovider) {
      yprovider.connect();
    }
    tempDoc.destroy();
  }
};

export default performDocumentReset;