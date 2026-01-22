import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Download, Printer, ShieldAlert } from 'lucide-react';
import logo from '../../assets/logo.png';
import { generateInvoiceBase64 } from '../../utils/invoiceGenerator';

const OrderInvoiceAdmin: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // 1. Fetch Order
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();
        setOrder(orderData || null);

        // 2. Fetch Items WITH Product Name (The Fix)
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*, products(name)') // <--- JOIN performed here
          .eq('order_id', id);

        // 3. Map the result to flatten "products.name" into "product_name"
        const formattedItems = itemsData?.map((item: any) => ({
          ...item,
          product_name: item.products?.name || 'Product Item' // Fallback if product deleted
        })) || [];

        setItems(formattedItems);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!order || !items) return;
    const base64 = await generateInvoiceBase64(order, items);
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = `Admin-Invoice-${order.id}.pdf`;
    link.click();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading invoice...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center text-red-500">Order not found.</div>;

  const totalAmount = Number(order.total_amount || 0);
  const totalNet = totalAmount / 1.2;
  const totalTax = totalAmount - totalNet;

  return (
    <div className="bg-gray-100 min-h-screen pb-12 print:bg-white print:pb-0 print:absolute print:top-0 print:left-0 print:w-full print:h-full print:z-[9999]">
      
      {/* --- TOOLBAR --- */}
      <div className="no-print bg-white border-b border-gray-200 py-4 mb-8 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/admin/orders" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black transition-colors">
            <ArrowLeft size={16} /> Back to Orders
          </Link>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
              <Printer size={16} /> Print
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors">
              <Download size={16} /> Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* --- INVOICE DOCUMENT --- */}
      <div className="max-w-[210mm] mx-auto bg-white p-12 md:p-16 shadow-lg print:shadow-none print:p-0 print:max-w-none">
        
        {/* HEADER */}
        <div className="flex justify-between items-start border-b border-black/80 pb-8 mb-10">
          <div className="flex flex-col justify-start">
            <img src={logo} alt="Aidezel" className="h-24 w-auto object-contain mb-2 -ml-2" /> 
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide">Tax Invoice</h1>
            <div className="flex items-center justify-end gap-1 text-red-600 mt-1">
                <ShieldAlert size={14} />
                <p className="text-xs font-bold uppercase tracking-wider">Admin Copy</p>
            </div>
          </div>
        </div>

        {/* ADDRESSES */}
        <div className="grid grid-cols-2 gap-16 mb-12 text-sm text-gray-800">
          <div>
            <h3 className="font-bold text-black mb-2">Sold By:</h3>
            <p className="font-semibold">Aidezel Ltd.</p>
            <p className="text-gray-600 leading-relaxed">
              Unit 42, Innovation Tech Park<br/>
              123 Commerce Way, London<br/>
              United Kingdom, EC1A 1BB
            </p>
          </div>
          <div className="text-right space-y-8">
            <div>
              <h3 className="font-bold text-black mb-1">Billing & Shipping Address:</h3>
              <p className="font-semibold uppercase">{order.customer_name}</p>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {order.address}<br/>
                {order.city}<br/>
                {order.postcode}
              </p>
            </div>
          </div>
        </div>

        {/* INFO BAR */}
        <div className="border-t border-b border-black/80 py-4 mb-12 flex justify-between text-sm">
          <div>
            <span className="text-gray-500">Order Number:</span>
            <span className="ml-2 font-bold text-black">{order.id}</span>
          </div>
          <div>
            <span className="text-gray-500">Date:</span>
            <span className="ml-2 font-bold text-black">{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* TABLE */}
        <table className="w-full text-sm mb-12 border-collapse border border-gray-300">
          <thead className="bg-[#232f3e] text-white">
            <tr className="text-xs uppercase tracking-wide">
              <th className="py-3 px-4 text-left w-[45%] border-r border-gray-600">Description</th>
              <th className="py-3 px-4 text-right border-r border-gray-600">Unit Price (Net)</th>
              <th className="py-3 px-4 text-center border-r border-gray-600">Qty</th>
              <th className="py-3 px-4 text-right border-r border-gray-600">Net Amount</th>
              <th className="py-3 px-4 text-right border-r border-gray-600">Tax Rate</th>
              <th className="py-3 px-4 text-right border-r border-gray-600">Tax Amt</th>
              <th className="py-3 px-4 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, idx) => {
              const qty = item.quantity || 1;
              const unitPriceGross = Number(item.price_at_purchase || item.price || 0);

              const totalLineGross = unitPriceGross * qty;
              const totalLineNet = totalLineGross / 1.2;
              const totalLineTax = totalLineGross - totalLineNet;
              const unitPriceNet = unitPriceGross / 1.2;

              return (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-3 px-4 font-medium text-gray-800 border-r border-gray-200">
                    {/* FIXED: Uses fetched product name */}
                    {item.product_name}
                    <div className="text-[10px] text-gray-500 mt-0.5">HSN: 851762</div>
                  </td>
                  <td className="py-3 px-4 text-right border-r border-gray-200">£{unitPriceNet.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center border-r border-gray-200">{qty}</td>
                  <td className="py-3 px-4 text-right border-r border-gray-200">£{totalLineNet.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right border-r border-gray-200">20%</td>
                  <td className="py-3 px-4 text-right border-r border-gray-200">£{totalLineTax.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-bold text-black">£{totalLineGross.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* TOTALS */}
        <div className="flex justify-end">
          <div className="w-72 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Net Amount:</span>
              <span>£{totalNet.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tax (20%):</span>
              <span>£{totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-black pt-3 mt-3 text-base">
              <span className="font-bold text-black">Grand Total:</span>
              <span className="font-bold text-black">£{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-20 pt-8 border-t border-gray-300">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">INTERNAL DOCUMENT</p>
              <p className="text-sm font-bold text-black mb-20">For Aidezel Ltd.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderInvoiceAdmin;