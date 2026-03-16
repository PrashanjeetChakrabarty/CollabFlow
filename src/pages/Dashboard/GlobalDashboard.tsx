import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, where, orderBy, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { FirestoreError, QueryDocumentSnapshot } from 'firebase/firestore';
import type { KanbanTask, Project } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { LayoutDashboard, Clock, CheckCircle2, AlertCircle, Plus, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalDashboard() {
    const { currentUser } = useAppStore();
    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Quick Add Task State
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<KanbanTask['status']>('To-Do');

    const mapTask = (docSnap: QueryDocumentSnapshot) => ({ id: docSnap.id, ...docSnap.data() } as KanbanTask);
    const mapProject = (docSnap: QueryDocumentSnapshot) => ({ id: docSnap.id, ...docSnap.data() } as Project);

    useEffect(() => {
        if (!currentUser?.uid) return;

        // Fetch all tasks where userId == currentUser.uid, across all projects
        const qTasks = query(
            collection(db, 'tasks'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
            const fbTasks = snapshot.docs.map(mapTask);
            setTasks(fbTasks);
            setIsLoading(false);
        }, (error: FirestoreError) => {
            console.error("Error fetching global tasks:", error);
            if (error.message.includes('requires an index')) {
                console.error("FIRESTORE INDEX REQUIRED FOR GLOBAL DASHBOARD");
            }
            setIsLoading(false);
        });

        // Fetch User's Projects for the Dropdown
        const qProjects = query(
            collection(db, 'projects'),
            where('members', 'array-contains', currentUser.email),
            orderBy('createdAt', 'desc')
        );

        const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
            const fbProjects = snapshot.docs.map(mapProject);
            setProjects(fbProjects);
            if (fbProjects.length > 0 && !selectedProjectId) {
                setSelectedProjectId(fbProjects[0].id); // Default select first project
            }
        });

        return () => {
            unsubscribeTasks();
            unsubscribeProjects();
        };
    }, [currentUser, selectedProjectId]);

    const handleQuickAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !selectedProjectId || !currentUser) return;

        try {
            await addDoc(collection(db, 'tasks'), {
                title: newTaskTitle,
                description: '',
                status: selectedStatus,
                projectId: selectedProjectId,
                userId: currentUser.uid,
                createdAt: Date.now(),
            });
            setNewTaskTitle('');
            setIsAddingTask(false);
        } catch (error) {
            console.error("Error creating quick task:", error);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (confirm("Are you sure you want to delete this task?")) {
            try {
                await deleteDoc(doc(db, 'tasks', taskId));
            } catch (err) {
                console.error("Error deleting task:", err);
            }
        }
    };

    const handleCompleteTask = async (taskId: string) => {
        try {
            await updateDoc(doc(db, 'tasks', taskId), {
                status: 'Done'
            });
        } catch (err) {
            console.error("Error completing task:", err);
        }
    };

    const getStatusIcon = (status: KanbanTask['status']) => {
        switch (status) {
            case 'Backlog': return <AlertCircle className="w-5 h-5 text-slate-400" />;
            case 'To-Do': return <AlertCircle className="w-5 h-5 text-purple-400" />;
            case 'In-Progress': return <Clock className="w-5 h-5 text-blue-400" />;
            case 'Review': return <AlertCircle className="w-5 h-5 text-amber-400" />;
            case 'Done': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
            default: return <AlertCircle className="w-5 h-5 text-slate-400" />;
        }
    };

    const getStatusColor = (status: KanbanTask['status']) => {
        switch (status) {
            case 'Backlog': return 'border-slate-500/30 bg-slate-500/10 text-slate-300';
            case 'To-Do': return 'border-purple-500/30 bg-purple-500/10 text-purple-300';
            case 'In-Progress': return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
            case 'Review': return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
            case 'Done': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
            default: return 'border-slate-500/30 bg-slate-500/10 text-slate-300';
        }
    };

    // Summary Calculations
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In-Progress').length;

    return (
        <div className="flex-1 w-full h-full p-4 md:p-8 flex flex-col relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-electric-violet/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header & Quick Add */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-white mb-2 tracking-tight">
                        <LayoutDashboard className="w-8 h-8 text-electric-violet" />
                        My Overview
                    </h1>
                    <p className="text-slate-400">All your assigned tasks across every workspace.</p>
                </div>
                <button
                    onClick={() => setIsAddingTask(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-electric-violet hover:bg-purple-500 transition-colors text-white font-medium rounded-xl neon-pulse shadow-[0_0_20px_rgba(139,92,246,0.5)] whitespace-nowrap"
                >
                    <Plus className="w-5 h-5" />
                    <span>Quick Add Task</span>
                </button>
            </div>

            {/* Summary Widgets */}
            <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
                <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white mb-1">{totalTasks}</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Assigned</span>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-blue-400 mb-1">{inProgressTasks}</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">In Progress</span>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-emerald-400 mb-1">{completedTasks}</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Completed</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-8 h-8 border-4 border-electric-violet border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl glass-panel">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">You're all caught up!</h3>
                        <p className="text-slate-400">You don't have any assigned tasks in any workspaces.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tasks.map((task, idx) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="glass-panel p-5 rounded-xl border border-white/5 hover:border-electric-violet/30 transition-colors group flex flex-col"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-white text-lg group-hover:text-electric-violet transition-colors line-clamp-1">{task.title}</h3>
                                    <div className="shrink-0 ml-3 flex items-center gap-1">
                                        {getStatusIcon(task.status)}
                                        {task.status !== 'Done' && (
                                            <button
                                                onClick={() => handleCompleteTask(task.id)}
                                                className="p-1.5 ml-1 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                                title="Mark as Complete"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                            title="Delete Task"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">
                                    {task.description || "No description provided."}
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(task.status)} capitalize`}>
                                        {task.status.replace('-', ' ')}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Add Task Modal */}
            <AnimatePresence>
                {isAddingTask && (
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
                                    onClick={() => setIsAddingTask(false)}
                                    className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <h2 className="text-2xl font-bold text-white mb-1">Quick Add Task</h2>
                                <p className="text-slate-400 text-sm mb-6">Dispatch a task directly to a specific project.</p>

                                <form onSubmit={handleQuickAddTask} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Task Title</label>
                                        <input
                                            type="text"
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            placeholder="e.g. Update user analytics schema"
                                            autoFocus
                                            required
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-electric-violet/50 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Destination Project</label>
                                        <select
                                            value={selectedProjectId}
                                            onChange={(e) => setSelectedProjectId(e.target.value)}
                                            required
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-electric-violet/50 transition-all appearance-none"
                                        >
                                            {projects.length === 0 && <option value="" disabled>No projects available</option>}
                                            {projects.map(proj => (
                                                <option key={proj.id} value={proj.id} className="bg-charcoal text-white">
                                                    {proj.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Destination Column</label>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value as KanbanTask['status'])}
                                            required
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-electric-violet/50 transition-all appearance-none"
                                        >
                                            <option value="Backlog" className="bg-charcoal text-white">Backlog</option>
                                            <option value="To-Do" className="bg-charcoal text-white">To-Do</option>
                                            <option value="In-Progress" className="bg-charcoal text-white">In-Progress</option>
                                            <option value="Review" className="bg-charcoal text-white">Review</option>
                                            <option value="Done" className="bg-charcoal text-white">Done</option>
                                        </select>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={projects.length === 0}
                                            className="w-full py-3 bg-electric-violet hover:bg-purple-500 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.4)] disabled:opacity-50 transition-all"
                                        >
                                            Dispatch Task
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
