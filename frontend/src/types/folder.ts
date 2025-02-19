export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  name: string;
  file_url: string;
  folder_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface FolderContents {
  folders: Folder[];
  documents: Document[];
}

export type ItemType = 'folder' | 'document';

export interface SelectedItem {
  type: ItemType;
  id: number;
  name: string;
  parentId: number | null;
}
