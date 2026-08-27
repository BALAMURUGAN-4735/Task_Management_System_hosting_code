export interface Task {
  id?: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  assignedUserId?: string;
  assignedUserName?: string;
  assignedUserEmail?: string;
  projectId: string;
  projectName?: string;
  loggedHours?: number;
  estimatedHours?: number;
}

export interface Comment {
  id?: string;
  message: string;
  createdByUserId?: string;
  createdByName?: string;
  createdTime?: string;
  taskId?: string;
}