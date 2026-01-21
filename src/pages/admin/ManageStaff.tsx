// src/pages/admin/ManageStaff.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, UserCheck, UserX, Clock, ShieldAlert, CheckCircle, Ban } from 'lucide-react';

const ManageStaff = () => {
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'banned'>('pending');

  const fetchStaff = async () => {
    setLoading(true);
    // Fetch profiles where role is staff-related
    // We also join with staff_sessions to sum up work duration
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        staff_sessions ( duration_minutes )
      `)
      .in('role', ['staff', 'pending_staff', 'banned'])
      .order('created_at', { ascending: false });

    if (data) {
      // Calculate total hours worked for each staff
      const processedData = data.map(staff => {
        const totalMinutes = staff.staff_sessions?.reduce((acc: number, session: any) => acc + (session.duration_minutes || 0), 0) || 0;
        return {
           ...staff,
           totalHours: (totalMinutes / 60).toFixed(1)
        };
      });
      setStaffList(processedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleUpdateStatus = async (userId: string, newRole: string) => {
    if(!window.confirm(`Are you sure you want to set this user to ${newRole}?`)) return;

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      alert("Error updating status");
    } else {
      fetchStaff(); // Refresh list
    }
  };

  // Filter list based on tab
  const filteredStaff = staffList.filter(s => {
    if (activeTab === 'pending') return s.role === 'pending_staff';
    if (activeTab === 'active') return s.role === 'staff';
    if (activeTab === 'banned') return s.role === 'banned';
    return false;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-500 mt-1">Approve new registrations and monitor activity</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 pb-1">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 font-medium text-sm transition-colors ${activeTab === 'pending' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Pending Requests
          {staffList.filter(s => s.role === 'pending_staff').length > 0 && (
            <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
              {staffList.filter(s => s.role === 'pending_staff').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-4 font-medium text-sm transition-colors ${activeTab === 'active' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Active Staff
        </button>
        <button 
          onClick={() => setActiveTab('banned')}
          className={`pb-3 px-4 font-medium text-sm transition-colors ${activeTab === 'banned' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Banned / Suspended
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400"/></div>
        ) : filteredStaff.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No staff found in this category.</div>
        ) : (
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase">
                    <tr>
                        <th className="px-6 py-4 font-bold">Employee Details</th>
                        <th className="px-6 py-4 font-bold">Role</th>
                        <th className="px-6 py-4 font-bold">Total Worked</th>
                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredStaff.map((staff) => (
                        <tr key={staff.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                                <div className="font-bold text-gray-900">{staff.full_name || 'No Name'}</div>
                                <div className="text-gray-500 text-xs">{staff.employee_id}</div>
                                <div className="text-gray-400 text-xs">{staff.id}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                                    staff.role === 'pending_staff' ? 'bg-yellow-100 text-yellow-700' :
                                    staff.role === 'staff' ? 'bg-green-100 text-green-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {staff.role.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock size={16} />
                                    <span>{staff.totalHours} hrs</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                                {/* PENDING ACTIONS */}
                                {staff.role === 'pending_staff' && (
                                    <>
                                        <button 
                                            onClick={() => handleUpdateStatus(staff.id, 'staff')}
                                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 inline-flex items-center gap-1"
                                        >
                                            <CheckCircle size={14} /> Approve
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(staff.id, 'banned')}
                                            className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 inline-flex items-center gap-1"
                                        >
                                            <Ban size={14} /> Reject
                                        </button>
                                    </>
                                )}

                                {/* ACTIVE ACTIONS */}
                                {staff.role === 'staff' && (
                                    <button 
                                        onClick={() => handleUpdateStatus(staff.id, 'banned')}
                                        className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                                    >
                                        <UserX size={14} /> Ban / Timeout
                                    </button>
                                )}

                                {/* BANNED ACTIONS */}
                                {staff.role === 'banned' && (
                                    <button 
                                        onClick={() => handleUpdateStatus(staff.id, 'staff')}
                                        className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                                    >
                                        <UserCheck size={14} /> Restore Access
                                    </button>
                                )}
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

export default ManageStaff;