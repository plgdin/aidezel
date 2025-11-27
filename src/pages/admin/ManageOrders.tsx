import React, { useState } from 'react';
import { Eye, Search, Filter, MoreHorizontal, CheckCircle, Clock, Truck } from 'lucide-react';

const ManageOrders = () => {
  // Mock Data
  const [orders, setOrders] = useState([
    { id: 'ORD-7782', customer: 'Sarah Connor', date: '2024-03-10', total: '£1,199', items: 2, status: 'Pending' },
    { id: 'ORD-7783', customer: 'James Bond', date: '2024-03-09', total: '£299', items: 1, status: 'Shipped' },
    { id: 'ORD-7784', customer: 'Tony Stark', date: '2024-03-09', total: '£3,450', items: 4, status: 'Delivered' },
    { id: 'ORD-7785', customer: 'Bruce Wayne', date: '2024-03-08', total: '£129', items: 1, status: 'Pending' },
  ]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const cycleStatus = (id: string) => {
    setOrders(orders.map(o => {
      if (o.id === id) {
        const next = o.status === 'Pending' ? 'Shipped' : o.status === 'Shipped' ? 'Delivered' : 'Pending';
        return { ...o, status: next };
      }
      return o;
    }));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Orders Management</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Controls */}
        <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Customer..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>
          <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 bg-white text-gray-600 hover:bg-gray-50">
            <Filter size={18} /> Filter Status
          </button>
        </div>

        {/* Table */}
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Order ID</th>
              <th className="px-6 py-4 font-semibold">Customer</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">{order.id}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-medium">{order.customer}</span>
                    <span className="text-xs text-gray-500">{order.items} items</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm flex items-center gap-2">
                   <Clock size={14} /> {order.date}
                </td>
                <td className="px-6 py-4 font-bold text-gray-900">{order.total}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => cycleStatus(order.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 w-fit cursor-pointer select-none ${getStatusColor(order.status)}`}
                  >
                    {order.status === 'Shipped' && <Truck size={12} />}
                    {order.status === 'Delivered' && <CheckCircle size={12} />}
                    {order.status}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageOrders;