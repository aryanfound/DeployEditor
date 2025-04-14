import * as Y from 'yjs';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  children?: string[];
  isOpen?: boolean;
}

export interface ProjectStructure {
  files: Record<string, FileItem>;
  rootItems: string[];
}

/**
 * Serializes YJS document structure to a plain JavaScript object
 * @param yfileMap - Y.Map containing all file/folder items
 * @param yrootItems - Y.Array containing root item IDs
 * @returns Serialized project structure
 */
export function serializeYjsStructure(
  yfileMap: Y.Map<Y.Map<unknown>>,
  yrootItems: Y.Array<string>
): ProjectStructure {
  const files: Record<string, FileItem> = {};
  
  yfileMap.forEach((yitem, id) => {
    try {
      if (!(yitem instanceof Y.Map)) {
        console.warn(`Skipping invalid item ${id} - not a Y.Map`);
        return;
      }

      const item: FileItem = {
        id,
        name: String(yitem.get('name') || ''),
        type: yitem.get('type') === 'folder' ? 'folder' : 'file',
        parentId: yitem.get('parentId') ? String(yitem.get('parentId')) : null
      };

      if (item.type === 'file') {
        const ytext = yitem.get('content');
        item.content = ytext instanceof Y.Text ? ytext.toString() : '';
      } else {
        const children = yitem.get('children');
        item.children = children instanceof Y.Array ? children.toArray() : [];
        item.isOpen = Boolean(yitem.get('isOpen'));
      }

      files[id] = item;
    } catch (error) {
      console.error(`Error serializing item ${id}:`, error);
    }
  });

  return {
    files,
    rootItems: yrootItems.toArray().filter(id => id in files)
  };
}

/**
 * Deserializes plain JavaScript object back to YJS structure
 * @param data - Serialized project structure
 * @param yfileMap - Target Y.Map to populate
 * @param yrootItems - Target Y.Array to populate
 */
export function deserializeToYjs(
  data: ProjectStructure,
  yfileMap: Y.Map<Y.Map<unknown>>,
  yrootItems: Y.Array<string>
): void {
  try {
    // Clear existing data safely within a transaction
    yfileMap.doc?.transact(() => {
      yfileMap.clear();
      yrootItems.delete(0, yrootItems.length);
    });

    // First pass: create all items
    Object.entries(data.files).forEach(([id, item]) => {
      try {
        const yitem = new Y.Map();
        yitem.set('id', id);
        yitem.set('name', item.name);
        yitem.set('type', item.type);
        yitem.set('parentId', item.parentId);

        if (item.type === 'file') {
          const ytext = new Y.Text();
          if (item.content) ytext.insert(0, item.content);
          yitem.set('content', ytext);
        } else {
          yitem.set('children', new Y.Array());
          yitem.set('isOpen', Boolean(item.isOpen));
        }

        yfileMap.set(id, yitem);
      } catch (error) {
        console.error(`Error creating item ${id}:`, error);
      }
    });

    // Second pass: establish relationships
    Object.entries(data.files).forEach(([id, item]) => {
      try {
        if (item.type === 'folder' && item.children) {
          const yitem = yfileMap.get(id);
          if (yitem instanceof Y.Map) {
            const children = yitem.get('children');
            if (children instanceof Y.Array) {
              children.push(item.children.filter(childId => yfileMap.has(childId)));
            }
          }
        }
      } catch (error) {
        console.error(`Error setting children for ${id}:`, error);
      }
    });

    // Set root items
    yrootItems.push(data.rootItems.filter(id => yfileMap.has(id)));
  } catch (error) {
    console.error('Error during deserialization:', error);
    throw new Error('Failed to deserialize project structure');
  }
}

/**
 * Utility to create a new empty YJS document structure
 */
export function createNewYjsStructure(): {
  yfileMap: Y.Map<Y.Map<unknown>>;
  yrootItems: Y.Array<string>;
} {
  const ydoc = new Y.Doc();
  return {
    yfileMap: ydoc.getMap('fileMap'),
    yrootItems: ydoc.getArray('rootItems')
  };
}