import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanTask } from '../../types';
import { GripVertical, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

interface Props {
    task: KanbanTask;
}

export default function KanbanTaskCard({ task }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                await deleteDoc(doc(db, 'tasks', task.id));
            } catch (err) {
                console.error("Failed to delete task", err);
            }
        }
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="glass-panel opacity-50 border-2 border-electric-violet h-24 mb-3 rounded-lg"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`glass-panel p-4 mb-3 flex flex-col gap-2 rounded-lg cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-transform bg-black/40 border border-white/5 hover:border-electric-violet/50 hover:shadow-[0_4px_20px_rgba(139,92,246,0.3)] group`}
        >
            <div className="flex items-start justify-between">
                <h4 className="font-medium text-slate-200 text-sm">{task.title}</h4>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleDelete}
                        className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title="Delete Task"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="text-slate-500 hover:text-white p-1" {...attributes} {...listeners}>
                        <GripVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {task.description && (
                <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center justify-between mt-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${task.priority === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    task.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                    {task.priority || 'Low'}
                </span>
                <div className="w-6 h-6 rounded-full bg-electric-violet/30 border border-electric-violet/60 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">JD</span>
                </div>
            </div>
        </div>
    );
}
