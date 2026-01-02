import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { History, Search, Loader2 } from 'lucide-react';

interface LogEntry {
  id: string;
  admin_email: string;
  action: string;
  details: string;
  created_at: string;
}

const AdminLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    // Fetch logs and sort by newest first
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Limit to last 50 actions to keep it fast

    if (!error && data) {
      setLogs(data);
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
                <th className="p-4 text-sm font-semibold text-slate-600">Admin</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Action</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Details</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm text-slate-900 font-medium">{log.admin_email}</td>
                  <td className="p-4 text-sm text-blue-700 font-semibold bg-blue-50/50">
                    <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-md text-xs">
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