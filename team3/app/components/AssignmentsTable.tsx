import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { GoogleCalendarResponse } from '@/types/google-calendar';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate: {
    dateTime: string;
    timeZone: string;
  };
  status: 'pending' | 'completed' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  subject?: string;
}

const ITEMS_PER_PAGE = 10;

const AssignmentsTable = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Assignment | '';
    direction: 'asc' | 'desc';
  }>({ key: '', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch('/api/calendar');
        if (!response.ok) throw new Error('Failed to fetch assignments');
        const data: GoogleCalendarResponse = await response.json();
        
        const transformedAssignments = data.events.map((event: GoogleCalendarEvent) => ({
          id: event.id,
          title: event.summary,
          description: event.description,
          dueDate: {
            dateTime: event.end.dateTime || event.end.date || new Date().toISOString(),
            timeZone: event.end.timeZone || 'UTC'
          },
          status: getDueStatus(new Date(event.end.dateTime || event.end.date || '')),
          priority: getPriority(new Date(event.end.dateTime || event.end.date || '')),
          subject: event.description?.split('\n')[0] || 'General'
        }));
  
        setAssignments(transformedAssignments);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const getDueStatus = (dueDate: Date): 'pending' | 'completed' | 'overdue' => {
    const now = new Date();
    return dueDate < now ? 'overdue' : 'pending';
  };

  const getPriority = (dueDate: Date): 'high' | 'medium' | 'low' => {
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 2) return 'high';
    if (daysUntilDue <= 5) return 'medium';
    return 'low';
  };

  const handleSort = (key: keyof Assignment) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === 'asc'
          ? 'desc'
          : 'asc',
    });
  };

  const sortedAssignments = [...assignments].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue: any = a[sortConfig.key];
    let bValue: any = b[sortConfig.key];

    // Handle undefined values
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;

    if (sortConfig.key === 'dueDate') {
      aValue = new Date(a.dueDate.dateTime).getTime();
      bValue = new Date(b.dueDate.dateTime).getTime();
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
});

  const filteredAssignments = sortedAssignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading assignments...</div>;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center space-x-1">
                  <span>Assignment</span>
                  {sortConfig.key === 'title' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('subject')}
              >
                <div className="flex items-center space-x-1">
                  <span>Subject</span>
                  {sortConfig.key === 'subject' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('dueDate')}
              >
                <div className="flex items-center space-x-1">
                  <span>Due Date</span>
                  {sortConfig.key === 'dueDate' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedAssignments.map((assignment) => (
              <tr key={assignment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                  {assignment.description && (
                    <div className="text-sm text-gray-500">{assignment.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {assignment.subject}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(assignment.dueDate.dateTime).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(assignment.status)}`}>
                    {assignment.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(assignment.priority)}`}>
                    {assignment.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex items-center">
          <p className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredAssignments.length)} of{' '}
            {filteredAssignments.length} results
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 py-1 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsTable;