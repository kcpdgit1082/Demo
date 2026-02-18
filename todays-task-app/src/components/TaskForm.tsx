import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { encryptData } from '../lib/encryption';

interface TaskFormProps {
  onSuccess: () => void;
}

export function TaskForm({ onSuccess }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jiraLink, setJiraLink] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>(['']);
  const [isToday, setIsToday] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleAddChecklistItem = () => {
    setChecklistItems([...checklistItems, '']);
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const handleChecklistItemChange = (index: number, value: string) => {
    const newItems = [...checklistItems];
    newItems[index] = value;
    setChecklistItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.email) {
      setError('User not authenticated');
      return;
    }

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Store email for type safety
      const userEmail = user.email;
      
      // Encrypt the description
      const encryptedDescription = encryptData(description, userEmail);

      // Create the task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: title.trim(),
          jira_ticket_link: jiraLink.trim() || null,
          encrypted_data: encryptedDescription,
          status: 'pending',
          is_today: isToday,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Create checklist items
      const validItems = checklistItems.filter(item => item.trim() !== '');
      if (validItems.length > 0) {
        const checklistData = validItems.map((item, index) => ({
          task_id: taskData.id,
          encrypted_data: encryptData(item, userEmail),
          position: index,
          completed: false,
        }));

        const { error: checklistError } = await supabase
          .from('checklist_items')
          .insert(checklistData);

        if (checklistError) throw checklistError;
      }

      // Reset form
      setTitle('');
      setDescription('');
      setJiraLink('');
      setChecklistItems(['']);
      setIsToday(true);
      onSuccess();
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Task</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Task Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        {/* Jira Link */}
        <div>
          <label htmlFor="jiraLink" className="block text-sm font-medium text-gray-700">
            Jira Ticket Link
          </label>
          <input
            id="jiraLink"
            type="url"
            value={jiraLink}
            onChange={(e) => setJiraLink(e.target.value)}
            placeholder="https://your-company.atlassian.net/browse/TICKET-123"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task description (encrypted)"
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Is Today */}
        <div className="flex items-center">
          <input
            id="isToday"
            type="checkbox"
            checked={isToday}
            onChange={(e) => setIsToday(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isToday" className="ml-2 block text-sm text-gray-700">
            Mark as today's task
          </label>
        </div>

        {/* Checklist */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Checklist Items (Steps to complete)
          </label>
          <div className="space-y-2">
            {checklistItems.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleChecklistItemChange(index, e.target.value)}
                  placeholder={`Step ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {checklistItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddChecklistItem}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Add checklist item
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
