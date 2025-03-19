'use client'

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
}

// Fetch tasks from your backend
export async function fetchTasks() {
  try {
    const response = await fetch('/api/tasks');

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status}`);
    }

    const data = await response.json();

    // Transform tasks to match the Task interface
    return data.map((task: any) => ({
      id: task.id,
      title: task.title || task.summary,
      dueDate: task.due || task.dueDate,
      status: task.status || 'open',
      priority: task.priority || 'medium'
    })).filter((task: Task) => task.title); // Remove tasks without a title
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

// Generate a unique task ID
let taskGuid = 0
export function createTaskId() {
  return String(taskGuid++)
}

// Default tasks (can be removed or kept as placeholder)
export const INITIAL_TASKS = async () => {
  // Fetch tasks instead of using static events
  return await fetchTasks();
}