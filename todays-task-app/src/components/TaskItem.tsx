import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { DecryptedTask } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TaskItemProps {
  task: DecryptedTask;
  onTaskStatusChange: (taskId: string, newStatus: 'pending' | 'completed', completedAt: string | null) => void;
  onChecklistItemChange: (taskId: string, itemId: string, completed: boolean) => void;
  onDeleted: () => void;
}

export function TaskItem({ task, onTaskStatusChange, onChecklistItemChange, onDeleted }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const toggleTaskStatus = async () => {
    if (!user?.email) return;

    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    // Optimistic update — reflect immediately in the UI
    onTaskStatusChange(task.id, newStatus, completedAt);

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, completed_at: completedAt })
        .eq('id', task.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert on failure
      onTaskStatusChange(task.id, task.status, task.completed_at);
    }
  };

  const toggleChecklistItem = async (itemId: string, currentCompleted: boolean) => {
    if (!user?.email) return;

    const newCompleted = !currentCompleted;

    // Optimistic update — reflect immediately in the UI
    onChecklistItemChange(task.id, itemId, newCompleted);

    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({ completed: newCompleted })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating checklist item:', error);
      // Revert on failure
      onChecklistItemChange(task.id, itemId, currentCompleted);
    }
  };

  const deleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;
      onDeleted();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = task.checklist.filter(item => item.completed).length;
  const totalCount = task.checklist.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={toggleTaskStatus}
          disabled={loading}
          className="mt-1 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3
                className={`text-lg font-semibold ${
                  task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'
                }`}
              >
                {task.title}
              </h3>
              {task.jira_ticket_link && (
                <a
                  href={task.jira_ticket_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 mt-1"
                >
                  🔗 View Jira Ticket
                </a>
              )}
              <p className="text-sm text-gray-600 mt-2">{task.description}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-gray-400 hover:text-gray-600"
                title={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? '▼' : '▶'}
              </button>
              <button
                onClick={deleteTask}
                disabled={loading}
                className="text-red-400 hover:text-red-600"
                title="Delete task"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {totalCount > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{completedCount} / {totalCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Checklist */}
          {expanded && task.checklist.length > 0 && (
            <div className="mt-4 space-y-2 pl-2 border-l-2 border-gray-200">
              {task.checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklistItem(item.id, item.completed)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span
                    className={`text-sm ${
                      item.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="mt-3 flex gap-4 text-xs text-gray-500">
            <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
            {task.status === 'completed' && task.completed_at && (
              <span>Completed: {new Date(task.completed_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
