import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UserState {
  isOnboarded: boolean;
  isLoggedIn: boolean;
  blockId: string;
  shareId: string;
  username: string;
  walletAddress: string;
  avatarUrl: string | null;
  notificationsEnabled: boolean;
  biometricsEnabled: boolean;
  pinEnabled: boolean;
  setOnboarded: (value: boolean) => void;
  setLoggedIn: (value: boolean) => void;
  setBlockId: (blockId: string) => void;
  setShareId: (shareId: string) => void;
  setUsername: (username: string) => void;
  setWalletAddress: (address: string) => void;
  setAvatarUrl: (url: string | null) => void;
  toggleNotifications: () => void;
  toggleBiometrics: () => void;
  togglePin: () => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isOnboarded: false,
      isLoggedIn: false,
      blockId: "",
      shareId: "", // Share ID to be set during onboarding
      username: "SolBox User",
      walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      avatarUrl: null,
      notificationsEnabled: true,
      biometricsEnabled: false,
      pinEnabled: false,

      setOnboarded: (value) => set({ isOnboarded: value }),
      setLoggedIn: (value) => set({ isLoggedIn: value }),
      setBlockId: (blockId) => set({ blockId }),
      setShareId: (shareId) => set({ shareId }),
      setUsername: (username) => set({ username }),
      setWalletAddress: (walletAddress) => set({ walletAddress }),
      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
      toggleNotifications: () =>
        set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
      toggleBiometrics: () =>
        set((state) => ({ biometricsEnabled: !state.biometricsEnabled })),
      togglePin: () => set((state) => ({ pinEnabled: !state.pinEnabled })),
      logout: () => set({ 
        isOnboarded: false,
        isLoggedIn: false, 
        blockId: "",
        shareId: "",
        username: "SolBox User",
        walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        avatarUrl: null 
      }),
    }),
    {
      name: "solbox-user",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);