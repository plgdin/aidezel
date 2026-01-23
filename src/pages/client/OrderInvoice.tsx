import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import logo from '../../assets/logo.png';
import { generateInvoiceBase64 } from '../../utils/invoiceGenerator';

const OrderInvoice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // 1. Fetch Order Details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (orderError) throw orderError;

        // 2. Fetch Items WITH Product Name
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*, products(name)') 
          .eq('order_id', id);

        if (itemsError) throw itemsError;

        setOrder(orderData);

        // 3. Format Items
        const formattedItems = itemsData?.map((item: any) => ({
            ...item,
            product_name: item.products?.name || item.product_name || 'Product Item' 
        })) || [];

        setItems(formattedItems);

      } catch (err: any) {
        console.error(err);
        setError(err.message);
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
    link.download = `Invoice-${order.id}.pdf`;
    link.click();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading invoice...</div>;
  if (error || !order) return <div className="min-h-screen flex items-center justify-center text-red-500">Invoice not found.</div>;

  const totalAmount = Number(order.total_amount || 0);
  const totalNet = totalAmount / 1.2;
  const totalTax = totalAmount - totalNet;

  return (
    <div className="bg-gray-100 min-h-screen pb-12 print:bg-white print:pb-0">
      
      {/* --- TOOLBAR --- */}
      <div className="no-print bg-white border-b border-gray-200 py-4 mb-8 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/orders" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black transition-colors">
            <ArrowLeft size={16} /> Back to Orders
          </Link>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 md:px-4 bg-white border border-gray-300 rounded-lg text-xs md:text-sm font-bold hover:bg-gray-50 transition-colors">
              <Printer size={16} /> <span className="hidden md:inline">Print</span>
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-3 py-2 md:px-4 bg-black text-white rounded-lg text-xs md:text-sm font-bold hover:bg-gray-800 transition-colors">
              <Download size={16} /> <span className="hidden md:inline">Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- INVOICE DOCUMENT --- */}
      {/* FIX: Changed padding from p-12 to p-4 md:p-16 for better mobile spacing */}
      <div className="max-w-[210mm] mx-auto bg-white p-4 md:p-16 shadow-lg print:shadow-none print:p-0 print:max-w-none">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b border-black/80 pb-8 mb-8">
          <div className="mb-4 md:mb-0">
            <img src={logo} alt="Aidezel" className="h-16 md:h-24 w-auto object-contain mb-2 -ml-2" /> 
          </div>
          <div className="text-left md:text-right w-full md:w-auto">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide">Tax Invoice</h1>
            <p className="text-sm text-gray-600 font-medium">(Original for Recipient)</p>
          </div>
        </div>

        {/* ADDRESSES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mb-12 text-sm text-gray-800">
          <div>
            <h3 className="font-bold text-black mb-2">Sold By:</h3>
            <p className="font-semibold">Aidezel Ltd.</p>
            <p className="text-gray-600 leading-relaxed">
              Unit 42, Innovation Tech Park<br/>
              123 Commerce Way, London<br/>
              United Kingdom, EC1A 1BB
            </p>
            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <p><strong>VAT Reg No:</strong> GB 987 654 321</p>
            </div>
          </div>

          <div className="md:text-right space-y-4">
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
        <div className="border-t border-b border-black/80 py-4 mb-12 flex flex-wrap gap-4 justify-between text-sm">
          <div>
            <span className="text-gray-500 block text-xs uppercase">Order Number</span>
            <span className="font-bold text-black">{order.id}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs uppercase">Order Date</span>
            <span className="font-bold text-black">{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
          <div className="md:text-right">
            <span className="text-gray-500 block text-xs uppercase">Invoice Date</span>
            <span className="font-bold text-black">{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* TABLE (FIXED SCROLLING) */}
        <div className="overflow-x-auto mb-12">
            <table className="w-full text-sm border-collapse border border-gray-300 min-w-[700px]">
            <thead className="bg-[#232f3e] text-white">
                <tr className="text-xs uppercase tracking-wide">
                <th className="py-3 px-4 text-left w-[40%] border-r border-gray-600">Description</th>
                <th className="py-3 px-4 text-right border-r border-gray-600">Unit Price</th>
                <th className="py-3 px-4 text-center border-r border-gray-600">Qty</th>
                <th className="py-3 px-4 text-right border-r border-gray-600">Net</th>
                <th className="py-3 px-4 text-right border-r border-gray-600">Tax %</th>
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
        </div>

        {/* TOTALS */}
        <div className="flex justify-end">
          <div className="w-full md:w-72 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Net Amount:</span>
              <span>£{totalNet.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tax (20%):</span>
              <span>£{totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping:</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="flex justify-between border-t border-black pt-3 mt-3 text-base">
              <span className="font-bold text-black">Grand Total:</span>
              <span className="font-bold text-black">£{totalAmount.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-right text-gray-500 mt-1 font-medium">(Amount in Words: Pounds Sterling Only)</p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-20 pt-8 border-t border-gray-300">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="text-[10px] text-gray-500 max-w-sm space-y-1 w-full">
              <p className="font-bold text-black text-xs mb-2">Terms & Conditions:</p>
              <p>1. Goods once sold will not be taken back.</p>
              <p>2. Interest @18% p.a. will be charged if bill is not paid on due date.</p>
            </div>
            <div className="text-center w-full md:w-auto">
              <p className="text-sm font-bold text-black mb-12">For Aidezel Ltd.</p>
              <p className="text-xs text-gray-400">Authorized Signatory</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderInvoice;
