import React from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign, ArrowUpRight } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { title: 'Total Revenue', value: '£54,239', icon: DollarSign, change: '+12%', color: 'bg-green-50 text-green-600' },
    { title: 'Total Orders', value: '1,253', icon: ShoppingBag, change: '+8%', color: 'bg-blue-50 text-blue-600' },
    { title: 'Active Users', value: '892', icon: Users, change: '+24%', color: 'bg-purple-50 text-purple-600' },
    { title: 'Growth', value: '18.2%', icon: TrendingUp, change: '+4%', color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium">Download Report</button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                {stat.change} <ArrowUpRight size={12} />
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[1,2,3,4,5].map(i => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-4 font-bold text-gray-900">#ORD-00{i}</td>
                    <td className="py-4 text-gray-600">Alex Johnson</td>
                    <td className="py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold">Paid</span></td>
                    <td className="py-4 font-medium">£129.00</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Top Selling</h3>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg"></div>
                <div>
                  <p className="font-bold text-sm">iPhone 15 Pro</p>
                  <p className="text-xs text-gray-500">240 sales</p>
                </div>
                <div className="ml-auto font-bold text-sm">£1.2k</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;