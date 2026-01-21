// src/pages/staff/StaffDashboard.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Download, Package, AlertTriangle, CalendarDays } from 'lucide-react';

const StaffDashboard = () => {
  const [loading, setLoading] = useState(true);

  // Stats State
  const [ordersThisMonth, setOrdersThisMonth] = useState(0);

  // Data Lists State
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [allOrdersForReport, setAllOrdersForReport] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        // 2. Fetch Order Items (for Top Selling)
        const { data: itemsData } = await supabase
          .from('order_items')
          .select(`
            quantity, 
            product_id,
            price_at_purchase,
            products ( name, image_url )
          `);

        // 3. Fetch Low Stock Items
        const { data: lowStockData } = await supabase
          .from('products')
          .select('id, name, stock_quantity, image_url')
          .lt('stock_quantity', 5)
          .order('stock_quantity', { ascending: true })
          .limit(5);

        if (ordersData) {
          setAllOrdersForReport(ordersData);
          setRecentOrders(ordersData.slice(0, 5));

          // --- CALCULATE ORDERS THIS MONTH ---
          const now = new Date();
          const currentMonth = now.getMonth(); // 0-11
          const currentYear = now.getFullYear();

          const count = ordersData.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate.getMonth() === currentMonth && 
                   orderDate.getFullYear() === currentYear;
          }).length;

          setOrdersThisMonth(count);
        }

        // --- CALCULATE TOP SELLING ---
        if (itemsData) {
          const productMap: Record<string, any> = {};

          itemsData.forEach((item: any) => {
            const name = item.products?.name || 'Unknown Product';
            
            if (!productMap[name]) {
              productMap[name] = {
                name: name,
                sales: 0,
                revenue: 0,
                image: item.products?.image_url
              };
            }
            productMap[name].sales += item.quantity;
            productMap[name].revenue += (item.quantity * item.price_at_purchase);
          });

          const sortedProducts = Object.values(productMap)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 3);
            
          setTopProducts(sortedProducts);
        }

        if (lowStockData) {
          setLowStockItems(lowStockData);
        }

      } catch (error) {
        console.error("Error loading staff dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- DOWNLOAD CSV REPORT ---
  const handleDownloadReport = () => {
    if (allOrdersForReport.length === 0) return alert("No data to download.");

    const headers = ["Order ID", "Date", "Customer Name", "Email", "Total Amount", "Status"];
    
    const rows = allOrdersForReport.map(order => {
      const customerName = order.shipping_address?.fullName || order.shipping_address?.full_name || 'Guest';
      const email = order.shipping_address?.email || 'N/A';
      
      return [
        order.id,
        new Date(order.created_at).toLocaleDateString(),
        `"${customerName}"`,
        email,
        order.total_amount,
        order.status
      ];
    });

    const csvContent = [
      headers.join(","), 
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `staff_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-800">Staff Overview</h1>
           <p className="text-gray-500 text-sm mt-1">Manage orders and check inventory levels</p>
        </div>
        <button 
          onClick={handleDownloadReport}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
        >
          <Download size={18} /> Download Work Report
        </button>
      </div>

      {/* --- NEW: Monthly Orders Card --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <CalendarDays size={28} />
            </div>
            <div>
                <p className="text-gray-500 text-sm font-bold">Orders This Month</p>
                <h3 className="text-3xl font-black text-gray-900">{ordersThisMonth}</h3>
            </div>
        </div>
      </div>
      {/* ------------------------------- */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
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
                {recentOrders.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400">No orders found yet.</td>
                    </tr>
                ) : (
                    recentOrders.map(order => {
                      const customerName = order.shipping_address?.fullName || order.shipping_address?.full_name || 'Guest';
                      return (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 font-bold text-gray-900">#{order.id.slice(0, 8)}</td>
                            <td className="py-4 text-gray-600">{customerName}</td>
                            <td className="py-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                                order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                {order.status}
                            </span>
                            </td>
                            <td className="py-4 font-medium">£{Number(order.total_amount).toFixed(2)}</td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Top Selling & Low Stock */}
        <div className="space-y-8">
            
            {/* Top Selling Products */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg mb-6">Top Selling</h3>
            <div className="space-y-6">
                {topProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        No sales data available yet.
                    </div>
                ) : (
                    topProducts.map((product, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                            {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={20}/></div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.sales} sales</p>
                        </div>
                        <div className="font-bold text-sm text-gray-900">£{product.revenue.toLocaleString()}</div>
                    </div>
                    ))
                )}
            </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-orange-400">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900">
                    <AlertTriangle size={20} className="text-orange-500" />
                    Low Stock Alerts
                </h3>
                <div className="space-y-4">
                    {lowStockItems.length === 0 ? (
                        <p className="text-sm text-gray-500">All stock levels are healthy.</p>
                    ) : (
                        lowStockItems.map(item => (
                            <div key={item.id} className="flex justify-between items-center pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-lg overflow-hidden">
                                        <img src={item.image_url} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 truncate w-32">{item.name}</span>
                                </div>
                                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                    Only {item.stock_quantity} left
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;