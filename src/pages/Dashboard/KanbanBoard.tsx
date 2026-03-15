import { useState, useEffect, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, query, where } from 'firebase/firestore';
import type { KanbanTask, TaskStatus } from '../../types';
import KanbanColumn from '../../components/Kanban/KanbanColumn';
import KanbanTaskCard from '../../components/Kanban/KanbanTaskCard';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const defaultCols: TaskStatus[] = ['Backlog', 'To-Do', 'In-Progress', 'Review', 'Done'];

export default function KanbanBoard() {
    const { activeProject, currentUser } = useAppStore();
    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('To-Do');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');

    // Sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, { // Require a 5px drag to initiate to avoid accidental grabs
            activationConstraint: { opacity: 1, distance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (!activeProject || !currentUser) return;

        // Listen to Firebase Tasks scoped locally and to the current user
        const q = query(
            collection(db, 'tasks'),
            where('projectId', '==', activeProject.id),
            where('userId', '==', currentUser.uid)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fbTasks: KanbanTask[] = [];
            snapshot.forEach((docSnap) => {
                fbTasks.push({ id: docSnap.id, ...docSnap.data() } as KanbanTask);
            });
            // Sort client-side to avoid needing a composite index
            fbTasks.sort((a, b) => b.createdAt - a.createdAt);
            setTasks(fbTasks);
        }, (error) => {
            console.error("🔥 Firebase Tasks Query Error:", error);
            console.error("If this is an index error, click the link above in the error object!");
        });

        return () => unsubscribe();
    }, [activeProject, currentUser]);

    const columns = useMemo(() => defaultCols, []);

    // Handlers for Firestore Actions
    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        try {
            await addDoc(collection(db, 'tasks'), {
                title: newTaskTitle,
                description: newTaskDesc,
                status: newTaskStatus,
                priority: 'Medium',
                projectId: activeProject?.id,
                userId: currentUser?.uid,
                createdAt: Date.now(), // Fallback
            });

            setIsModalOpen(false);
            setNewTaskTitle('');
            setNewTaskDesc('');
        } catch (err) {
            console.error('Failed to create task', err);
        }
    };

    const openAddTaskModal = (status: TaskStatus) => {
        setNewTaskStatus(status);
        setIsModalOpen(true);
    };

    // Drag and Drop Logic
    const onDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === 'Task') {
            setActiveTask(event.active.data.current.task);
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === 'Task';
        const isOverTask = over.data.current?.type === 'Task';
        const isOverColumn = over.data.current?.type === 'Column';

        if (!isActiveTask) return;

        // Moving tasks within same list or returning early for simple UI array changes
        // (Actual logic is mostly in DragEnd for Firebase, but DragOver makes UI snappy)
        if (isActiveTask && isOverTask) {
            const activeIndex = tasks.findIndex((t) => t.id === activeId);
            const overIndex = tasks.findIndex((t) => t.id === overId);

            if (tasks[activeIndex].status !== tasks[overIndex].status) {
                setTasks((tasks) => {
                    const newTasks = [...tasks];
                    newTasks[activeIndex] = { ...newTasks[activeIndex], status: tasks[overIndex].status };
                    return arrayMove(newTasks, activeIndex, overIndex);
                });
            }
        }

        if (isActiveTask && isOverColumn) {
            const activeIndex = tasks.findIndex((t) => t.id === activeId);
            setTasks((tasks) => {
                const newTasks = [...tasks];
                newTasks[activeIndex] = { ...newTasks[activeIndex], status: overId as TaskStatus };
                return arrayMove(newTasks, activeIndex, activeIndex);
            });
        }
    };

    const onDragEnd = async (event: DragEndEvent) => {
        setActiveTask(null);
        const { active, over } = event;
        if (!over) return;

        const activeTask = active.data.current?.task as KanbanTask;
        const overStatus = over.data.current?.type === 'Column'
            ? over.id
            : over.data.current?.task?.status;

        if (activeTask && overStatus && activeTask.status !== overStatus) {
            // Optimitistic update was handled in dragOver, now persist to Firebase
            try {
                const taskRef = doc(db, 'tasks', activeTask.id);
                await updateDoc(taskRef, {
                    status: overStatus,
                });
            } catch (err) {
                console.error("Failed to update status", err);
            }
        }
    };

    return (
        <div className="flex-1 w-full h-full p-4 md:p-8 flex flex-col">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white text-glow mb-2">{activeProject?.title || 'Project Sprint'}</h1>
                    <p className="text-slate-400">Manage your tasks in real-time across the team.</p>
                </div>
                <button
                    onClick={() => openAddTaskModal('To-Do')}
                    className="px-4 py-2 bg-electric-violet hover:bg-purple-500 transition-colors text-white font-medium rounded-xl neon-pulse shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                >
                    + Add Task
                </button>
            </div>

            <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                >
                    <div className="flex gap-6 h-full items-start">
                        {columns.map((col) => (
                            <KanbanColumn
                                key={col}
                                status={col}
                                tasks={tasks.filter((t) => t.status === col)}
                                onAddTask={openAddTaskModal}
                            />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeTask ? <KanbanTaskCard task={activeTask} /> : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Glassmorphic Add Task Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-md p-6 relative border-electric-violet/30 shadow-[0_0_40px_rgba(139,92,246,0.15)] animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-white mb-6">Create New Task</h2>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Status Column</label>
                                <select
                                    value={newTaskStatus}
                                    onChange={(e) => setNewTaskStatus(e.target.value as TaskStatus)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/50"
                                >
                                    {defaultCols.map(col => <option key={col} value={col} className="bg-charcoal">{col}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="e.g. Design Glassmorphism UI"
                                    autoFocus
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                                <textarea
                                    value={newTaskDesc}
                                    onChange={(e) => setNewTaskDesc(e.target.value)}
                                    placeholder="Brief context about this task..."
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-electric-violet/50 focus:ring-1 focus:ring-electric-violet/50 resize-none"
                                />
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-electric-violet hover:bg-purple-500 text-white font-medium rounded-lg transition-colors neon-pulse"
                                >
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
