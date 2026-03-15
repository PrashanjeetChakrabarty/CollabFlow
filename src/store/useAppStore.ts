import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { Project } from '../types';

export type ViewType = 'dashboard' | 'projects' | 'settings';

interface AppState {
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;

    // Auth State
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    isAuthLoading: boolean;
    setIsAuthLoading: (isLoading: boolean) => void;

    // Project State
    activeProject: Project | null;
    setActiveProject: (project: Project | null) => void;
    onlineUsers: number;
    setOnlineUsers: (count: number) => void;
    userName: string;
    setUserName: (name: string) => void;
    userAvatar: string | null;
    setUserAvatar: (url: string | null) => void;
    pingLatency: number | null;
    setPingLatency: (ms: number | null) => void;
    isChatOpen: boolean;
    setIsChatOpen: (isOpen: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    currentView: 'dashboard',
    setCurrentView: (view) => set({ currentView: view }),

    currentUser: null,
    setCurrentUser: (user) => set((state) => ({
        currentUser: user,
        userName: user?.displayName || state.userName,
        userAvatar: user?.photoURL || state.userAvatar
    })),
    isAuthLoading: true,
    setIsAuthLoading: (isLoading) => set({ isAuthLoading: isLoading }),

    activeProject: null,
    setActiveProject: (project) => set({ activeProject: project }),

    onlineUsers: 1,
    setOnlineUsers: (count) => set({ onlineUsers: count }),
    userName: 'Guest User',
    setUserName: (name) => set({ userName: name }),
    userAvatar: null,
    setUserAvatar: (url) => set({ userAvatar: url }),
    pingLatency: null,
    setPingLatency: (ms) => set({ pingLatency: ms }),
    isChatOpen: false,
    setIsChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
}));
