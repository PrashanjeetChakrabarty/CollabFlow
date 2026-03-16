import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, updateDoc, where, addDoc } from 'firebase/firestore';
import type { Project } from '../../types';
import { Plus, X, FolderKanban, Trash2, MailCheck, MailX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

export default function ProjectGallery() {
    const { currentUser } = useAppStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);

    // Join Project State
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const normalizedUserEmail = currentUser?.email?.toLowerCase() ?? '';

    useEffect(() => {
        if (!normalizedUserEmail) return;

        const memberProjectsQuery = query(
            collection(db, 'projects'),
            where('members', 'array-contains', normalizedUserEmail),
            orderBy('createdAt', 'desc')
        );
        const pendingProjectsQuery = query(
            collection(db, 'projects'),
            where('pendingInvites', 'array-contains', normalizedUserEmail),
            orderBy('createdAt', 'desc')
        );

        const unsubscribeMembers = onSnapshot(memberProjectsQuery, (snapshot) => {
            const fbProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            setProjects(fbProjects);
        }, (error) => {
            console.error("FIREBASE INDEX REQUIRED FOR PROJECTS:", error.message);
        });
        const unsubscribePending = onSnapshot(pendingProjectsQuery, (snapshot) => {
            const fbProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            setPendingProjects(fbProjects);
        }, (error) => {
            console.error("FIREBASE INDEX REQUIRED FOR PENDING INVITES:", error.message);
        });

        return () => {
            unsubscribeMembers();
            unsubscribePending();
        };
    }, [normalizedUserEmail]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) {
            setCreateError('Project Name is required.');
            return;
        }
        if (!currentUser) {
            setCreateError('You must be logged in to create a project.');
            return;
        }
        if (!normalizedUserEmail) {
            console.error("Missing email for user:", currentUser);
            setCreateError('Your account is missing an email address, which is required for collaboration.');
            return;
        }


        try {
            // Generate a random 6-character alphanumeric code
            const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
            const newInviteCode = generateCode();

            await addDoc(collection(db, 'projects'), {
                title: newTitle,
                description: newDesc,
                createdAt: Date.now(),
                ownerId: currentUser.uid,
                members: [normalizedUserEmail],
                pendingInvites: [],
                inviteCode: newInviteCode,
                // Assign a random placeholder gradient image if needed
                imageUrl: `https://picsum.photos/seed/${Math.random()}/400/200`,
            });
            setIsModalOpen(false);
            setNewTitle('');
            setNewDesc('');
        } catch (err: any) {
            console.error('Failed to create project', err);
            setCreateError(err.message || 'Failed to initialize workspace. Please check your Firestore rules or connection.');
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation(); // Prevent opening the workspace
        if (confirm("Are you sure you want to delete this project permanently?")) {
            try {
                await deleteDoc(doc(db, 'projects', projectId));
            } catch (err) {
                console.error("Error deleting project:", err);
            }
        }
    };

    const handleJoinProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) {
            setJoinError('Please enter an invite code.');
            return;
        }
        if (!normalizedUserEmail) {
            setJoinError('Your account is missing an email address, which is required to join workspaces.');
            return;
        }
        setJoinError('');

        try {
            const q = query(collection(db, 'projects'), where('inviteCode', '==', joinCode.trim().toUpperCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setJoinError('Invalid invite code. Project not found.');
                return;
            }

            const projectDoc = querySnapshot.docs[0];
            const projectData = projectDoc.data() as Project;
            const memberEmails = projectData.members?.map((email) => email.toLowerCase()) ?? [];

            if (memberEmails.includes(normalizedUserEmail)) {
                setJoinError('You are already a member of this project.');
                return;
            }

            await updateDoc(doc(db, 'projects', projectDoc.id), {
                members: arrayUnion(normalizedUserEmail),
                pendingInvites: arrayRemove(normalizedUserEmail)
            });

            setIsJoinModalOpen(false);
            setJoinCode('');
        } catch (err) {
            console.error('Failed to join project:', err);
            setJoinError('An error occurred while joining. Please try again.');
        }
    };

    const handleRespondToInvite = async (projectId: string, accept: boolean) => {
        if (!normalizedUserEmail) return;

        try {
            const projectRef = doc(db, 'projects', projectId);
            await updateDoc(projectRef, {
                pendingInvites: arrayRemove(normalizedUserEmail),
                ...(accept ? { members: arrayUnion(normalizedUserEmail) } : {}),
            });
        } catch (error) {
            console.error('Failed to update invitation:', error);
        }
    };

    return (
        <div className="flex-1 w-full h-full p-4 md:p-8 flex flex-col">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white text-glow mb-2">Projects</h1>
                    <p className="text-slate-400">View and manage all active workspaces.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsJoinModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-charcoal hover:bg-white/10 border border-white/10 transition-colors text-slate-300 hover:text-white font-medium rounded-xl"
                    >
                        <span className="hidden sm:inline">Join via Code</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-electric-violet hover:bg-purple-500 transition-colors text-white font-medium rounded-xl neon-pulse shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">New Project</span>
                    </button>
                </div>
            </div>

            {pendingProjects.length > 0 && (
                <div className="mb-8 glass-panel p-5 border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Pending Invitations</h2>
                            <p className="text-sm text-slate-400">You have workspace invites waiting for a response.</p>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                            {pendingProjects.length} pending
                        </span>
                    </div>
                    <div className="space-y-3">
                        {pendingProjects.map((project) => (
                            <div
                                key={project.id}
                                className="rounded-xl border border-white/10 bg-black/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                            >
                                <div>
                                    <h3 className="font-semibold text-white">{project.title}</h3>
                                    <p className="text-sm text-slate-400">
                                        {project.description || 'This workspace owner sent you a direct invite.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleRespondToInvite(project.id, true)}
                                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30"
                                    >
                                        <MailCheck className="w-4 h-4" />
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleRespondToInvite(project.id, false)}
                                        className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10"
                                    >
                                        <MailX className="w-4 h-4" />
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
                {projects.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
                        <FolderKanban className="w-12 h-12 text-slate-500 mb-4" />
                        <p className="text-slate-400">No projects yet. Create one to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {projects.map((project, idx) => (
                            <motion.div
                                key={project.id}
                                onClick={() => navigate(`/workspace/${project.id}`)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="glass-panel group cursor-pointer hover:-translate-y-2 transition-all hover:border-electric-violet/50 hover:shadow-[0_8px_30px_rgba(139,92,246,0.2)] overflow-hidden flex flex-col h-72 relative"
                            >
                                {/* Ownership Controls */}
                                {project.ownerId === currentUser?.uid && (
                                    <button
                                        onClick={(e) => handleDeleteProject(e, project.id)}
                                        className="absolute top-2 right-2 z-20 p-2 bg-black/60 hover:bg-red-500/80 rounded-full text-slate-300 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}

                                {/* Decorative neon streak */}
                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-electric-violet/0 via-electric-violet to-electric-violet/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="h-32 bg-charcoal relative overflow-hidden shrink-0">
                                    {project.imageUrl && (
                                        <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                        <h3 className="font-bold text-lg text-white truncate">{project.title}</h3>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between bg-black/40">
                                    <p className="text-sm text-slate-400 line-clamp-3 mb-4">
                                        {project.description || 'No description provided for this project space.'}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-xs text-slate-500 font-medium">Updated just now</span>
                                        <div className="flex -space-x-2">
                                            <div className="w-6 h-6 rounded-full bg-electric-violet/80 border border-obsidian z-10"></div>
                                            <div className="w-6 h-6 rounded-full bg-purple-400 border border-obsidian z-0"></div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Glassmorphic Add Project Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-md p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-panel w-full max-w-md relative border-electric-violet/30 shadow-[0_0_40px_rgba(139,92,246,0.15)] overflow-hidden"
                        >
                            {/* Animated background gradient */}
                            <div className="absolute -inset-20 bg-gradient-to-br from-electric-violet/20 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none"></div>

                            <div className="p-6 relative z-10">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-1">New Project</h2>
                                <p className="text-slate-400 text-sm mb-6">Initialize a new collaborative workspace.</p>

                                <form onSubmit={handleCreateProject} className="space-y-4">
                                    {createError && (
                                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                                            {createError}
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Project Name</label>
                                        <input
                                            type="text"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder="e.g. Apollo Roadmap"
                                            autoFocus
                                            required
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label>
                                        <textarea
                                            value={newDesc}
                                            onChange={(e) => setNewDesc(e.target.value)}
                                            placeholder="High-level goals or scope..."
                                            rows={3}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/50 resize-none transition-all"
                                        />
                                    </div>
                                    <div className="pt-6">
                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-gradient-to-r from-electric-violet to-purple-500 hover:from-purple-500 hover:to-electric-violet text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] transition-all"
                                        >
                                            Initialize Workspace
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Join Project via Code Modal */}
            <AnimatePresence>
                {
                    isJoinModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-md p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-panel w-full max-w-md relative border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)] overflow-hidden"
                            >
                                <div className="absolute -inset-20 bg-gradient-to-br from-emerald-500/20 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none"></div>

                                <div className="p-6 relative z-10">
                                    <button
                                        onClick={() => {
                                            setIsJoinModalOpen(false);
                                            setJoinError('');
                                        }}
                                        className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200 mb-1">Join Workspace</h2>
                                    <p className="text-slate-400 text-sm mb-6">Enter a 6-character invite code to join.</p>

                                    {joinError && (
                                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                                            {joinError}
                                        </div>
                                    )}

                                    <form onSubmit={handleJoinProject} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1">Invite Code</label>
                                            <input
                                                type="text"
                                                value={joinCode}
                                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                                placeholder="e.g. X7F2M9"
                                                maxLength={6}
                                                autoFocus
                                                required
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-center tracking-widest font-mono text-lg uppercase"
                                            />
                                        </div>
                                        <div className="pt-6">
                                            <button
                                                type="submit"
                                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all"
                                            >
                                                Join Project
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}
