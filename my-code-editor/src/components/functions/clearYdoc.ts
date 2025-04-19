import * as Y from "yjs";
export const clearYDoc = (
  doc: Y.Doc,
  yfileMap: Y.Map<any> | null,
  yrootItems: Y.Array<string> | null,
  modelsRef: React.MutableRefObject<Map<string, monaco.editor.ITextModel>>,
  setActiveFileId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  doc.transact(() => {}, true); // Clear undo history

  if (yfileMap) yfileMap.clear();
  if (yrootItems) yrootItems.delete(0, yrootItems.length);

  modelsRef.current.forEach((model) => model.dispose());
  modelsRef.current.clear();

  setActiveFileId(null);
};

export default clearYDoc;