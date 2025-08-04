import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAllPublicFiles, getPublicFileDetailsByTransactionSignature } from "@/lib/api";

export interface PublicBlockchainFile {
  id: number;
  file_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  transaction_signature: string;
  block_time: number;
  slot: number;
  confirmation_status: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  cid?: string;
  owner_share_id?: string;
  views: number;
  likes: number;
}

export type SortOption = "recent" | "popular" | "likes" | "size";
export type FilterOption = "all" | "images" | "videos" | "docs";

interface PublicFileState {
  files: PublicBlockchainFile[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: SortOption;
  filterBy: FilterOption;
  likedFiles: Set<string>;
  downloadingFiles: Set<string>;
  
  // Actions
  setFiles: (files: PublicBlockchainFile[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortOption) => void;
  setFilterBy: (filter: FilterOption) => void;
  incrementViews: (fileId: string) => Promise<void>;
  incrementLikes: (fileId: string) => Promise<void>;
  downloadFile: (file: PublicBlockchainFile) => Promise<void>;
  fetchPublicFiles: () => Promise<void>;
  fetchFileDetails: (transactionSignature: string) => Promise<PublicBlockchainFile | null>;
  isFileLiked: (fileId: string) => boolean;
  isFileDownloading: (fileId: string) => boolean;
}



export const usePublicFileStore = create<PublicFileState>()((set, get) => ({
  files: [],
  loading: false,
  error: null,
  searchQuery: "",
  sortBy: "recent",
  filterBy: "all",
  likedFiles: new Set<string>(),
  downloadingFiles: new Set<string>(),

  setFiles: (files) => set({ files }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),
  setFilterBy: (filterBy) => set({ filterBy }),

  incrementViews: async (fileId) => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured - views increment skipped');
      return;
    }

    // Update local state immediately for optimistic UI
    set((state) => ({
      files: state.files.map((file) =>
        file.file_id === fileId ? { ...file, views: file.views + 1 } : file
      ),
    }));

    try {
      console.log('Incrementing views for file:', fileId);
      
      const { error } = await supabase.rpc('increment_views', {
        file_id_param: fileId
      });

      if (error) {
        console.error('Error incrementing views:', error);
        // Revert optimistic update on error
        set((state) => ({
          files: state.files.map((file) =>
            file.file_id === fileId ? { ...file, views: file.views - 1 } : file
          ),
        }));
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  },

  incrementLikes: async (fileId) => {
    const { likedFiles } = get();
    
    // Check if user has already liked this file
    if (likedFiles.has(fileId)) {
      console.log('File already liked by user:', fileId);
      return;
    }

    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured - likes increment skipped');
      return;
    }

    // Add to liked files set and update local state immediately for optimistic UI
    set((state) => ({
      likedFiles: new Set([...state.likedFiles, fileId]),
      files: state.files.map((file) =>
        file.file_id === fileId ? { ...file, likes: file.likes + 1 } : file
      ),
    }));

    try {
      console.log('Incrementing likes for file:', fileId);
      
      const { error } = await supabase.rpc('increment_likes', {
        file_id_param: fileId
      });

      if (error) {
        console.error('Error incrementing likes:', error);
        // Revert optimistic update on error
        set((state) => {
          const newLikedFiles = new Set(state.likedFiles);
          newLikedFiles.delete(fileId);
          return {
            likedFiles: newLikedFiles,
            files: state.files.map((file) =>
              file.file_id === fileId ? { ...file, likes: file.likes - 1 } : file
            ),
          };
        });
      }
    } catch (error) {
      console.error('Error incrementing likes:', error);
      // Revert optimistic update on error
      set((state) => {
        const newLikedFiles = new Set(state.likedFiles);
        newLikedFiles.delete(fileId);
        return {
          likedFiles: newLikedFiles,
          files: state.files.map((file) =>
            file.file_id === fileId ? { ...file, likes: file.likes - 1 } : file
          ),
        };
      });
    }
  },

  fetchPublicFiles: async () => {
    set({ loading: true, error: null });
    
    try {
      console.log('Fetching public files from API...');
      
      // Try API first with timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const result = await getAllPublicFiles();
        clearTimeout(timeoutId);
        console.log('API response:', result);
        
        if (result?.success && result?.data && Array.isArray(result.data)) {
          console.log('✅ Fetched public files from API:', result.data.length);
          // Ensure all required fields are present and properly formatted
          const formattedFiles = result.data.map((file: any) => ({
            id: file.id || 0,
            file_id: file.file_id || '',
            file_name: file.file_name || 'Unknown File',
            file_type: file.file_type || 'unknown',
            file_size: file.file_size || 0,
            file_url: file.file_url || '',
            transaction_signature: file.transaction_signature || '',
            block_time: file.block_time || Date.now(),
            slot: file.slot || 0,
            confirmation_status: file.confirmation_status || 'finalized',
            is_public: file.is_public !== false,
            created_at: file.created_at || new Date().toISOString(),
            updated_at: file.updated_at || new Date().toISOString(),
            cid: file.cid || undefined,
            owner_share_id: file.owner_share_id || undefined,
            views: file.views || 0,
            likes: file.likes || 0,
          }));
          
          set({ files: formattedFiles, loading: false });
          return;
        } else {
          console.warn('⚠️ API response format unexpected:', result);
        }
      } catch (apiError) {
        console.error('❌ API fetch failed:', apiError);
        
        // Check for specific network errors
        if (apiError instanceof Error) {
          if (apiError.message.includes('Load failed') || 
              apiError.message.includes('Network request failed') ||
              apiError.message.includes('Failed to get public files') ||
              apiError.name === 'AbortError') {
            console.log('🔄 API endpoint not available or network error, falling back to Supabase...');
          } else {
            console.warn('API error, falling back to Supabase:', apiError.message);
          }
        } else {
          console.warn('Unknown API error, falling back to Supabase:', apiError);
        }
      }
      
      // Fallback to Supabase if API fails
      if (!isSupabaseConfigured) {
        console.warn('Supabase not configured, using mock data for demo');
        // Provide some mock data for demo purposes
        const mockFiles: PublicBlockchainFile[] = [
          {
            id: 1,
            file_id: 'demo_file_1',
            file_name: 'Demo Document.pdf',
            file_type: 'application/pdf',
            file_size: 1024000,
            file_url: 'https://via.placeholder.com/400x300/1a1a1a/ffffff?text=Demo+PDF',
            transaction_signature: 'demo_signature_1234567890abcdef',
            block_time: Date.now() - 86400000, // 1 day ago
            slot: 123456789,
            confirmation_status: 'finalized',
            is_public: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString(),
            owner_share_id: 'demo_user_123',
            views: 42,
            likes: 7,
          },
          {
            id: 2,
            file_id: 'demo_file_2',
            file_name: 'Sample Image.jpg',
            file_type: 'image/jpeg',
            file_size: 2048000,
            file_url: 'https://via.placeholder.com/800x600/5b4dff/ffffff?text=Sample+Image',
            transaction_signature: 'demo_signature_abcdef1234567890',
            block_time: Date.now() - 172800000, // 2 days ago
            slot: 123456788,
            confirmation_status: 'finalized',
            is_public: true,
            created_at: new Date(Date.now() - 172800000).toISOString(),
            updated_at: new Date(Date.now() - 172800000).toISOString(),
            owner_share_id: 'demo_user_456',
            views: 128,
            likes: 23,
          },
        ];
        
        set({ files: mockFiles, loading: false, error: null });
        return;
      }

      console.log('Fetching public files from Supabase...');
      
      const { data, error } = await supabase
        .from('public_blockchain_files')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || "Failed to fetch public files");
      }

      console.log('Fetched public files from Supabase:', data?.length || 0);
      set({ files: data || [], loading: false });
    } catch (error) {
      console.error("Error fetching public files:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch public files", 
        loading: false 
      });
    }
  },

  fetchFileDetails: async (transactionSignature: string) => {
    try {
      console.log('Fetching file details for signature:', transactionSignature);
      
      // Try API first
      try {
        const result = await getPublicFileDetailsByTransactionSignature(transactionSignature);
        console.log('API file details response:', result);
        
        if (result?.success && result?.data) {
          console.log('✅ Fetched file details from API');
          // Ensure proper formatting
          const file = result.data;
          return {
            id: file.id || 0,
            file_id: file.file_id || '',
            file_name: file.file_name || 'Unknown File',
            file_type: file.file_type || 'unknown',
            file_size: file.file_size || 0,
            file_url: file.file_url || '',
            transaction_signature: file.transaction_signature || transactionSignature,
            block_time: file.block_time || Date.now(),
            slot: file.slot || 0,
            confirmation_status: file.confirmation_status || 'finalized',
            is_public: file.is_public !== false,
            created_at: file.created_at || new Date().toISOString(),
            updated_at: file.updated_at || new Date().toISOString(),
            cid: file.cid || undefined,
            owner_share_id: file.owner_share_id || undefined,
            views: file.views || 0,
            likes: file.likes || 0,
          };
        } else if (result === null || (result?.success === false && result?.error?.includes('not found'))) {
          console.log('File not found via API');
          return null;
        }
      } catch (apiError) {
        console.error('❌ API file details fetch failed:', apiError);
        
        // Log more details about the error for debugging
        if (apiError instanceof Error && apiError.message.includes('Network request failed')) {
          console.log('Network error when fetching file details, falling back to Supabase...');
        }
      }
      
      // Fallback to Supabase if API fails
      if (!isSupabaseConfigured) {
        console.error("API endpoint not available and Supabase not configured");
        return null;
      }
      
      const { data, error } = await supabase
        .from('public_blockchain_files')
        .select('*')
        .eq('transaction_signature', transactionSignature)
        .eq('is_public', true)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(error.message || "Failed to fetch file details");
      }

      return data;
    } catch (error) {
      console.error("Error fetching file details:", error);
      return null;
    }
  },

  downloadFile: async (file: PublicBlockchainFile) => {
    const { downloadingFiles } = get();
    
    if (downloadingFiles.has(file.file_id)) {
      console.log('File already downloading:', file.file_id);
      return;
    }

    // Add to downloading files set
    set((state) => ({
      downloadingFiles: new Set([...state.downloadingFiles, file.file_id])
    }));

    try {
      console.log('Starting download for file:', file.file_name);
      
      const downloadUrl = getFilePreviewUrl(file);
      if (!downloadUrl) {
        throw new Error('No download URL available');
      }

      // For web, create a download link
      if (typeof window !== 'undefined') {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For mobile, use Linking to open the URL
        const { Linking } = require('react-native');
        await Linking.openURL(downloadUrl);
      }

      console.log('Download initiated for:', file.file_name);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      // Remove from downloading files set after a delay
      setTimeout(() => {
        set((state) => {
          const newDownloadingFiles = new Set(state.downloadingFiles);
          newDownloadingFiles.delete(file.file_id);
          return { downloadingFiles: newDownloadingFiles };
        });
      }, 2000); // Show downloading state for 2 seconds
    }
  },

  isFileLiked: (fileId: string) => {
    return get().likedFiles.has(fileId);
  },

  isFileDownloading: (fileId: string) => {
    return get().downloadingFiles.has(fileId);
  },
}));

// Helper functions for filtering and sorting
export const getFilteredAndSortedFiles = (
  files: PublicBlockchainFile[],
  searchQuery: string,
  filterBy: FilterOption,
  sortBy: SortOption
): PublicBlockchainFile[] => {
  let filtered = files;

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = files.filter(
      (file) =>
        file.file_name.toLowerCase().includes(query) ||
        file.transaction_signature.toLowerCase().includes(query) ||
        file.owner_share_id?.toLowerCase().includes(query)
    );
  }

  // Apply type filter
  if (filterBy !== "all") {
    filtered = filtered.filter((file) => {
      const fileType = file.file_type.toLowerCase();
      switch (filterBy) {
        case "images":
          return fileType.startsWith("image/");
        case "videos":
          return fileType.startsWith("video/");
        case "docs":
          return (
            fileType.includes("pdf") ||
            fileType.includes("doc") ||
            fileType.includes("text") ||
            fileType.includes("application/")
          );
        default:
          return true;
      }
    });
  }

  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "popular":
        return b.views - a.views;
      case "likes":
        return b.likes - a.likes;
      case "size":
        return b.file_size - a.file_size;
      default:
        return 0;
    }
  });

  return sorted;
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
  
  return date.toLocaleDateString();
};

// Helper function to get file preview URL
export const getFilePreviewUrl = (file: PublicBlockchainFile): string => {
  console.log('Getting preview URL for file:', {
    file_name: file.file_name,
    file_url: file.file_url,
    cid: file.cid,
    file_type: file.file_type,
    file_id: file.file_id
  });
  
  // Priority: file_url > cid > fallback
  if (file.file_url && file.file_url.trim() && file.file_url !== 'undefined' && file.file_url !== 'null' && file.file_url !== '') {
    console.log('✅ Using file_url:', file.file_url);
    return file.file_url;
  }
  
  if (file.cid && file.cid.trim() && file.cid !== 'undefined' && file.cid !== 'null' && file.cid !== '') {
    const ipfsUrl = `https://solbox.cloud/ipfs/${file.cid}`;
    console.log('✅ Using CID with IPFS URL:', ipfsUrl);
    return ipfsUrl;
  }
  
  // Check if file_url contains IPFS hash pattern
  if (file.file_url && file.file_url.includes('Qm') && file.file_url.length > 40) {
    // Extract IPFS hash from URL if it's malformed
    const ipfsMatch = file.file_url.match(/Qm[a-zA-Z0-9]{44}/);
    if (ipfsMatch) {
      const ipfsUrl = `https://solbox.cloud/ipfs/${ipfsMatch[0]}`;
      console.log('✅ Extracted IPFS hash from file_url:', ipfsUrl);
      return ipfsUrl;
    }
  }
  
  // For images, try to construct a better fallback
  if (file.file_type && file.file_type.startsWith('image/')) {
    // Use a generic image placeholder for images
    const imageUrl = `https://solbox.cloud/400x300/5b4dff/ffffff?text=${encodeURIComponent(file.file_name?.split('.')[0] || 'Image')}`;
    console.log('⚠️ Using image fallback URL:', imageUrl);
    return imageUrl;
  }
  
  // Fallback for other file types
  const fallbackUrl = `https:/solbox.cloud/400x300/1a1a1a/ffffff?text=${encodeURIComponent(file.file_name?.split('.')[0] || 'File')}`;
  console.log('⚠️ Using generic fallback URL:', fallbackUrl);
  return fallbackUrl;
};

// Helper function to check if file is previewable
export const isPreviewableFile = (fileType: string): boolean => {
  const type = fileType.toLowerCase();
  return type.startsWith("image/") || type.startsWith("video/");
};