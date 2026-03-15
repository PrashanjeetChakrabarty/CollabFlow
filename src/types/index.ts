export type TaskStatus = 'Backlog' | 'To-Do' | 'In-Progress' | 'Review' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface KanbanTask {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority?: TaskPriority;
    projectId?: string;
    userId?: string;
    createdAt: number;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    tags?: string[];
    ownerId?: string;
    members?: string[];
    pendingInvites?: string[];
    inviteCode?: string;
    createdAt: number;
}
