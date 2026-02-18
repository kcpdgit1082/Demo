import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, ChecklistItem, DecryptedTask } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { decryptData } from '../lib/encryption';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';

export function TaskList() {
  const [tasks, setTasks] = useState<DecryptedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'today' | 'pending'>('today');
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, filter]);

  const fetchTasks = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      let query = supabase
        .from('tasks')
        .select('*, checklist_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter === 'today') {
        query = query.eq('is_today', true);
      } else if (filter === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Decrypt tasks synchronously — decryptData is not async, no need for Promise.all
      const decryptedTasks: DecryptedTask[] = (data || []).map(
        (task: Task & { checklist_items: ChecklistItem[] }) => {
          try {
            const description = decryptData(task.encrypted_data, user.email!);

            const checklist = (task.checklist_items || [])
              .sort((a, b) => a.position - b.position)
              .map((item) => {
                const text = decryptData(item.encrypted_data, user.email!);
                return { ...item, text };
              });

            return { ...task, description, checklist };
          } catch (err) {
            console.error('Error decrypting task:', err);
            return { ...task, description: '[Decryption failed]', checklist: [] };
          }
        }
      );

      setTasks(decryptedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Optimistic local update for task status toggle (no full re-fetch)
  const handleTaskStatusChange = useCallback(
    (taskId: string, newStatus: 'pending' | 'completed', completedAt: string | null) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus, completed_at: completedAt } : t
        )
      );
    },
    []
  );

  // Optimistic local update for checklist item toggle (no full re-fetch)
  const handleChecklistItemChange = useCallback(
    (taskId: string, itemId: string, completed: boolean) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                checklist: t.checklist.map((ci) =>
                  ci.id === itemId ? { ...ci, completed } : ci
                ),
              }
            : t
        )
      );
    },
    []
  );

  // Full re-fetch only when tasks are created or deleted
  const handleTaskMutated = () => {
    fetchTasks();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Today's Tasks</h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Logged in as: <span className="font-medium">{user?.email}</span>
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'today'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today's Tasks
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'pending'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Tasks
            </button>
          </div>
        </div>

        {/* Add Task Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full mb-6 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md"
        >
          {showForm ? 'Cancel' : '+ Add New Task'}
        </button>

        {/* Task Form */}
        {showForm && (
          <div className="mb-6">
            <TaskForm onSuccess={() => { setShowForm(false); handleTaskMutated(); }} />
          </div>
        )}

        {/* Task List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No tasks found</p>
            <p className="text-gray-400 text-sm mt-2">Create your first task to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onTaskStatusChange={handleTaskStatusChange}
                onChecklistItemChange={handleChecklistItemChange}
                onDeleted={handleTaskMutated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
