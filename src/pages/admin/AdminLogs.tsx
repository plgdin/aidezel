import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { History, Loader2, User } from 'lucide-react';

interface LogEntry {
  id: string;
  admin_email: string; // Kept for historical reference or fallback
  action: string;
  details: string;
  created_at: string;
  // These are now expected to be direct columns in the 'admin_logs' table
  full_name?: string; 
  employee_id?: string;
}

const AdminLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    
    // 1. Fetch logs directly. 
    // We assume 'full_name' and 'employee_id' are now columns in this table.
    // This avoids the issue where deleting a user deletes their history details.
    const { data: logsData, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
        console.error("Error fetching logs", error);
    } else {
        setLogs(logsData || []);
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <History className="text-blue-900" /> Activity Logs
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
             <Loader2 className="animate-spin inline mr-2" /> Loading records...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No activity recorded yet.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">Name</th>
                <th className="p-4 text-sm font-semibold text-slate-600">EMP ID</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Action</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Details</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  {/* Name Column: Uses the snapshot value from the log */}
                  <td className="p-4 text-sm text-slate-900 font-medium">
                    <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-400"/>
                        {log.full_name || log.admin_email || 'Unknown User'}
                    </div>
                  </td>

                  {/* EMP ID Column: Uses the snapshot value from the log */}
                  <td className="p-4 text-sm text-slate-600 font-mono">
                      {log.employee_id ? (
                          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                             {log.employee_id}
                          </span>
                      ) : (
                          <span className="text-gray-300">-</span>
                      )}
                  </td>

                  <td className="p-4 text-sm text-blue-700 font-semibold bg-blue-50/50">
                    <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-md text-xs whitespace-nowrap">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{log.details}</td>
                  <td className="p-4 text-sm text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;