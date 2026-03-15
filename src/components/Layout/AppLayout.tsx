import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Settings, Menu, X, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import LiveChatBubble from '../Chat/LiveChatBubble';
import { usePresence } from '../../hooks/usePresence';

// Utility for merging tailwind classes with clsx
function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export default function AppLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { onlineUsers, userName, userAvatar } = useAppStore();

    // Initialize presence
    usePresence();

    const navLinks = [
        { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { name: 'Projects', to: '/projects', icon: FolderKanban },
        { name: 'Settings', to: '/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-obsidian overflow-hidden selection:bg-electric-violet/30">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-64 glass-panel m-4 overflow-hidden z-20">
                <div className="p-6 pb-2">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-electric-violet to-purple-400">
                        CollabFlow
                    </h1>
                    <div className="h-px bg-white/10 w-full mt-4"></div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.name}
                            to={link.to}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium',
                                    isActive
                                        ? 'bg-electric-violet/20 text-white border border-electric-violet/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                )
                            }
                        >
                            <link.icon className="w-5 h-5" />
                            {link.name}
                        </NavLink>
                    ))}
                </nav>

                {/* User Card */}
                <div className="p-4 mx-4 mb-4 rounded-xl bg-black/20 border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-electric-violet/30 flex items-center justify-center border border-electric-violet/50 overflow-hidden shrink-0">
                        {userAvatar ? (
                            <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-bold text-white">{userName.charAt(0)}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{userName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></span>
                            <span className="text-xs text-slate-400">Online</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                {/* Topbar */}
                <header className="h-20 shrink-0 border-b border-white/5 flex flex-col justify-center px-4 md:px-8 z-10 glass-panel md:m-4 md:mb-0 md:border-0 rounded-none md:rounded-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                className="md:hidden text-slate-300 hover:text-white transition-colors"
                                onClick={() => setMobileMenuOpen(true)}
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <h2 className="text-xl font-semibold text-white/90 hidden sm:block">Welcome back 👋</h2>
                        </div>

                        <div className="flex items-center gap-4 lg:gap-6">
                            {/* Live Presence Indicator */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-green-500/30">
                                <Activity className="w-4 h-4 text-green-400" />
                                <span className="text-sm font-medium text-green-400">
                                    <span className="hidden sm:inline">LIVE: </span>
                                    {onlineUsers} <span className="opacity-70 text-xs">connected</span>
                                </span>
                            </div>

                            <button className="relative p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 neon-pulse">
                                <div className="w-5 h-5 i-lucide-bell text-slate-300"></div>
                                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-electric-violet shadow-[0_0_8px_rgba(139,92,246,0.8)]"></span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Flow */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto w-full relative z-0">
                    <AnimatePresence mode="wait">
                        <Outlet />
                    </AnimatePresence>
                </main>

                {/* Persistent Footer */}
                <footer className="shrink-0 p-4 text-center z-10">
                    <p className="text-sm text-slate-500 font-medium tracking-wide">
                        Developed by <span className="text-electric-violet text-glow">PrashanjeetChakrabarty</span>
                    </p>
                </footer>
            </div>

            {/* Mobile Menu Outline */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex md:hidden bg-obsidian/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-3/4 max-w-xs h-full glass-panel border-l-0 rounded-l-none flex flex-col"
                        >
                            <div className="p-6 flex items-center justify-between border-b border-white/10">
                                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-electric-violet to-purple-400">
                                    CollabFlow
                                </h1>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 text-slate-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <nav className="flex-1 px-4 py-6 space-y-2">
                                {navLinks.map((link) => (
                                    <NavLink
                                        key={link.name}
                                        to={link.to}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            cn(
                                                'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 font-medium',
                                                isActive
                                                    ? 'bg-electric-violet/20 text-white border border-electric-violet/50'
                                                    : 'text-slate-400'
                                            )
                                        }
                                    >
                                        <link.icon className="w-5 h-5" />
                                        {link.name}
                                    </NavLink>
                                ))}
                            </nav>
                        </motion.div>
                        <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
                    </motion.div>
                )}
            </AnimatePresence>

            <LiveChatBubble />
        </div>
    );
}
