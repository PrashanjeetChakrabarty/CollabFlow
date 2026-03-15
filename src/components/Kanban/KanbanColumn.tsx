import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import KanbanTaskCard from './KanbanTaskCard';
import type { KanbanTask, TaskStatus } from '../../types';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
    status: TaskStatus;
    tasks: KanbanTask[];
    onAddTask: (status: TaskStatus) => void;
}

export default function KanbanColumn({ status, tasks, onAddTask }: Props) {
    const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: status,
        data: {
            type: 'Column',
            status,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`glass-panel bg-black/20 border-white/5 flex flex-col w-80 shrink-0 h-full rounded-xl overflow-hidden ${isDragging ? 'opacity-40' : ''
                }`}
        >
            <div
                {...attributes}
                {...listeners}
                className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5 cursor-grab active:cursor-grabbing text-glow"
            >
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-200">{status}</h3>
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-slate-400">
                        {tasks.length}
                    </span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddTask(status);
                    }}
                    className="p-1 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <KanbanTaskCard key={task.id} task={task} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
