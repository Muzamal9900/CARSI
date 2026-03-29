import { getBackendOrigin } from '@/lib/env/public-url';

export interface TaskQueueSummary {
  total_tasks: number;
  pending: number;
  in_progress: number;
  completed: number;
  failed: number;
}

const empty: TaskQueueSummary = {
  total_tasks: 0,
  pending: 0,
  in_progress: 0,
  completed: 0,
  failed: 0,
};

export async function fetchTaskQueueStats(): Promise<TaskQueueSummary> {
  try {
    const backendUrl = getBackendOrigin();
    const res = await fetch(`${backendUrl}/api/tasks/stats/summary`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    if (!res.ok) return empty;
    return (await res.json()) as TaskQueueSummary;
  } catch {
    return empty;
  }
}
