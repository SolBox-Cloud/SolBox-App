import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type FileType = "pdf" | "image" | "video" | "zip" | "default";

export interface File {
  id: string;
  name: string;
  type: FileType;
  size: string;
  sizeInBytes: number;
  modifiedDate: string;
  folderId: string | null;
  url?: string;
  isFolder: boolean;
  cid?: string;
  ipfsHash?: string;
  mimeType?: string;
}

export interface Folder {
  id: string;
  name: string;
  itemCount: number;
  parentId: string | null;
  isFolder: boolean;
}

export interface Share {
  id: string;
  fileId: string;
  link: string;
  isReadOnly: boolean;
  expirationDate: string | null;
}

interface FileState {
  files: File[];
  folders: Folder[];
  shares: Share[];
  usedStorage: number;
  totalStorage: number;
  addFile: (file: Omit<File, "id" | "modifiedDate">) => string;
  removeFile: (id: string) => void;
  addFolder: (name: string, parentId: string | null) => string;
  removeFolder: (id: string) => void;
  shareFile: (fileId: string, isReadOnly: boolean) => string;
  removeShare: (id: string) => void;
  loadUserFiles: (files: File[]) => void;
  clearFiles: () => void;
  refreshSharedFiles: () => Promise<void>;
}

// Dummy file for empty state
const dummyFile: File = {
  id: "dummy-1",
  name: "Upload_to_see_your_files",
  type: "image",
  size: "0 KB",
  sizeInBytes: 0,
  modifiedDate: "2025-01-01",
  folderId: null,
  isFolder: false,
  url: undefined,
  cid: "QmDummyHash123456789",
  ipfsHash: "QmDummyHash123456789",
  mimeType: "image/png",
};

// Mock data generator - returns empty state by default
const generateMockData = () => {
  return {
    files: [], // Start with empty files array
    folders: [],
    shares: [],
  };
};

const mockData = generateMockData();

export const useFileStore = create<FileState>()(
  persist(
    (set, get) => ({
      files: [], // Start with empty files
      folders: mockData.folders,
      shares: mockData.shares,
      usedStorage: 0,
      totalStorage: 5368709120, // 5 GB

      addFile: (file) => {
        const id = Date.now().toString();
        const newFile: File = {
          ...file,
          id,
          modifiedDate: new Date().toISOString().split("T")[0],
          isFolder: false,
        };

        set((state) => ({
          files: [...state.files, newFile],
          usedStorage: state.usedStorage + newFile.sizeInBytes,
        }));

        if (newFile.folderId) {
          set((state) => ({
            folders: state.folders.map((folder) =>
              folder.id === newFile.folderId
                ? { ...folder, itemCount: folder.itemCount + 1 }
                : folder
            ),
          }));
        }

        return id;
      },

      removeFile: (id) => {
        const file = get().files.find((f) => f.id === id);
        if (!file) return;

        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
          usedStorage: state.usedStorage - file.sizeInBytes,
          shares: state.shares.filter((s) => s.fileId !== id),
        }));

        if (file.folderId) {
          set((state) => ({
            folders: state.folders.map((folder) =>
              folder.id === file.folderId
                ? { ...folder, itemCount: folder.itemCount - 1 }
                : folder
            ),
          }));
        }
      },

      addFolder: (name, parentId) => {
        const id = Date.now().toString();
        const newFolder: Folder = {
          id,
          name,
          itemCount: 0,
          parentId,
          isFolder: true,
        };

        set((state) => ({
          folders: [...state.folders, newFolder],
        }));

        return id;
      },

      removeFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          files: state.files.map((file) =>
            file.folderId === id ? { ...file, folderId: null } : file
          ),
        }));
      },

      shareFile: (fileId, isReadOnly) => {
        const id = Date.now().toString();
        const newShare: Share = {
          id,
          fileId,
          link: `https://solbox.io/share/${id.substring(0, 6)}`,
          isReadOnly,
          expirationDate: null,
        };

        set((state) => ({
          shares: [...state.shares, newShare],
        }));

        return id;
      },

      removeShare: (id) => {
        set((state) => ({
          shares: state.shares.filter((s) => s.id !== id),
        }));
      },

      loadUserFiles: (files) => {
        const totalUsed = files.reduce((sum, file) => sum + file.sizeInBytes, 0);
        set({
          files,
          usedStorage: totalUsed,
        });
      },

      clearFiles: () => {
        set({
          files: [],
          usedStorage: 0,
        });
      },

      refreshSharedFiles: async () => {
        // This would normally fetch shared files from the API
        // For now, we'll just log that the refresh was called
        console.log('Refreshing shared files data...');
        // In a real implementation, you would:
        // 1. Call getSharedFilesForUser API
        // 2. Update the shares state with the response
        // 3. Possibly update files state if new shared files are available
      },
    }),
    {
      name: "solbox-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Export dummy file for use in components
export { dummyFile };