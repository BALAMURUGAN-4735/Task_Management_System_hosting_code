export interface Project {
  id?: string;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  status: 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  managerId?: string;
  managerName?: string;
}