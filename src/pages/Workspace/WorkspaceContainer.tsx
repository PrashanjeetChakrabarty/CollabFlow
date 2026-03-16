import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAppStore } from '../../store/useAppStore';
import type { Project } from '../../types';
import KanbanBoard from '../Dashboard/KanbanBoard';
import { Loader2, Users, X, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkspaceContainer() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { activeProject, setActiveProject, currentUser } = useAppStore();
    const [isLoading, setIsLoading] = useState(true);

    // Teammate Invite Modal State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteSuccess, setInviteSuccess] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [copied, setCopied] = useState(false);

    const normalizedUserEmail = currentUser?.email?.toLowerCase() ?? '';

    useEffect(() => {
        if (!projectId || !normalizedUserEmail || !currentUser) {
            navigate('/projects');
            return;
        }

        const fetchProject = async () => {
            setIsLoading(true);
            try {
                const docRef = doc(db, 'projects', projectId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const projectData = { id: docSnap.id, ...docSnap.data() } as Project;
                    const memberEmails = projectData.members?.map((email) => email.toLowerCase()) ?? [];

                    if (projectData.ownerId !== currentUser?.uid && !memberEmails.includes(normalizedUserEmail)) {
                        setActiveProject(null);
                        navigate('/projects');
                        return;
                    }

                    setActiveProject(projectData);
                } else {
                    console.error("No such project!");
                    setActiveProject(null);
                    navigate('/projects');
                }
            } catch (error) {
                console.error("Error fetching project:", error);
                setActiveProject(null);
                navigate('/projects');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProject();

        return () => {
            setActiveProject(null);
        };
    }, [currentUser, currentUser?.uid, navigate, normalizedUserEmail, projectId, setActiveProject]);

    const handleInviteTeammate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !projectId || !activeProject) return;

        const normalizedInviteEmail = inviteEmail.toLowerCase().trim();
        const memberEmails = activeProject.members?.map((email) => email.toLowerCase()) ?? [];
        const pendingInviteEmails = activeProject.pendingInvites?.map((email) => email.toLowerCase()) ?? [];

        setInviteError('');

        if (normalizedInviteEmail === normalizedUserEmail) {
            setInviteError('You are already part of this workspace.');
            return;
        }

        if (memberEmails.includes(normalizedInviteEmail)) {
            setInviteError('That teammate is already an active member.');
            return;
        }

        if (pendingInviteEmails.includes(normalizedInviteEmail)) {
            setInviteError('That teammate already has a pending invite.');
            return;
        }

        try {
            const projectRef = doc(db, 'projects', projectId);
            await updateDoc(projectRef, {
                pendingInvites: arrayUnion(normalizedInviteEmail)
            });

            setInviteSuccess(true);
            setInviteEmail('');
            setTimeout(() => {
                setInviteSuccess(false);
                setIsInviteModalOpen(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to invite teammate:', error);
            setInviteError('Unable to create the invite right now.');
        }
    };

    const handleCopyCode = () => {
        if (activeProject?.inviteCode) {
            navigator.clipboard.writeText(activeProject.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-electric-violet animate-spin mb-4" />
                <p className="text-slate-400 font-medium">Entering Workspace...</p>
            </div>
        );
    }

    if (!activeProject) {
        return (
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center text-center px-6">
                <AlertTriangle className="w-10 h-10 text-amber-400 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Workspace access required</h2>
                <p className="text-slate-400 max-w-md">
                    You need to be a confirmed member before opening this workspace.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 relative w-full h-full flex flex-col">
            {/* Contextual Workspace Header Controls */}
            <div className="w-full flex justify-center pt-4 pb-2 z-10 hidden sm:flex border-b border-white/5 bg-obsidian/50 backdrop-blur-md">
                {activeProject?.ownerId === currentUser?.uid && (
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-charcoal hover:bg-white/10 border border-white/10 transition-colors text-slate-300 hover:text-white font-medium rounded-xl shadow-lg"
                    >
                        <Users className="w-4 h-4" />
                        <span>Invite Teammate</span>
                    </button>
                )}
            </div>

            {/* Main Application Area */}
            <KanbanBoard />

            {/* Invite Teammate Modal */}
            <AnimatePresence>
                {isInviteModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-obsidian/80 backdrop-blur-md p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-panel w-full max-w-md relative border-electric-violet/30 shadow-[0_0_40px_rgba(139,92,246,0.15)] overflow-hidden"
                        >
                            <div className="absolute -inset-20 bg-gradient-to-br from-electric-violet/20 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none"></div>

                            <div className="p-6 relative z-10">
                                <button
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <h2 className="text-2xl font-bold text-white mb-2">Workspace Settings</h2>
                                <p className="text-slate-400 text-sm mb-6">
                                    Manage access for <b>{activeProject?.title}</b>.
                                </p>

                                {/* Shareable Invite Code Section */}
                                {activeProject?.inviteCode && (
                                    <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                        <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">
                                            Shareable Join Code
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white font-mono tracking-widest text-lg text-center font-bold">
                                                {activeProject.inviteCode}
                                            </code>
                                            <button
                                                onClick={handleCopyCode}
                                                className={`p-3 rounded-lg flex items-center justify-center transition-all ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                                                    }`}
                                                title="Copy to clipboard"
                                            >
                                                {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="relative flex items-center py-4">
                                    <div className="flex-grow border-t border-slate-700"></div>
                                    <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase tracking-wider">Or Invite Directly</span>
                                    <div className="flex-grow border-t border-slate-700"></div>
                                </div>

                                <form onSubmit={handleInviteTeammate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Teammate's Email</label>
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="colleague@example.com"
                                            autoFocus
                                            required
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/50 transition-all"
                                        />
                                    </div>
                                    {inviteError && (
                                        <p className="text-sm text-rose-400">{inviteError}</p>
                                    )}
                                    <p className="text-xs text-slate-500">
                                        Direct invites stay pending until that teammate accepts them from the Projects screen.
                                    </p>
                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={inviteSuccess}
                                            className={`w-full py-3 font-semibold rounded-lg transition-all ${inviteSuccess
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                                : 'bg-electric-violet hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                                                }`}
                                        >
                                            {inviteSuccess ? 'Invite Sent!' : 'Send Invite'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
