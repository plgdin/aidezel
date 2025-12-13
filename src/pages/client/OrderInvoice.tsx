import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import logo from '../../assets/logo.png';

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
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (orderError) throw orderError;

        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', id);

        if (itemsError) throw itemsError;

        setOrder(orderData);
        setItems(itemsData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading invoice...</div>;
  if (error || !order) return <div className="min-h-screen flex items-center justify-center text-red-500">Invoice not found.</div>;

  return (
    <div className="bg-gray-100 min-h-screen pb-12 print:bg-white print:pb-0">
      
      {/* --- TOOLBAR (Hidden when printing) --- */}
      <div className="no-print bg-white border-b border-gray-200 py-4 mb-8 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/orders" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black transition-colors">
            <ArrowLeft size={16} /> Back to Orders
          </Link>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
              <Printer size={16} /> Print
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors">
              <Download size={16} /> Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* --- INVOICE DOCUMENT (A4 Scaled) --- */}
      {/* Increased padding to p-12 md:p-16 for more outer space */}
      <div className="max-w-[210mm] mx-auto bg-white p-12 md:p-16 shadow-lg print:shadow-none print:p-0 print:max-w-none">
        
        {/* HEADER */}
        {/* Increased margin-bottom to mb-10 */}
        <div className="flex justify-between items-start border-b border-black/80 pb-8 mb-10">
          <div className="flex flex-col justify-start">
            {/* Logo */}
            <img src={logo} alt="Aidezel" className="h-24 w-auto object-contain mb-2 -ml-2" /> 
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide">Tax Invoice/Bill of Supply</h1>
            <p className="text-sm text-gray-600 font-medium">(Original for Recipient)</p>
          </div>
        </div>

        {/* ADDRESS GRID */}
        {/* Increased gap and margin-bottom to mb-12 */}
        <div className="grid grid-cols-2 gap-16 mb-12 text-sm text-gray-800">
          {/* Sold By */}
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
              <p><strong>PAN No:</strong> ABCDE1234F</p>
            </div>
          </div>

          {/* Right Column: Billing & Shipping Address */}
          <div className="text-right space-y-8">
            
            {/* Billing Address */}
            <div>
              <h3 className="font-bold text-black mb-1">Billing Address:</h3>
              <p className="font-semibold uppercase">{order.customer_name}</p>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {order.address}<br/>
                {order.city}<br/>
                {order.postcode}
              </p>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="font-bold text-black mb-1">Shipping Address:</h3>
              <p className="font-semibold uppercase">{order.customer_name}</p>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {order.address}<br/>
                {order.city}<br/>
                {order.postcode}
              </p>
            </div>

          </div>
        </div>

        {/* ORDER DETAILS BAR */}
        {/* Increased vertical padding py-4 and margin mb-12 */}
        <div className="border-t border-b border-black/80 py-4 mb-12 flex justify-between text-sm">
          <div>
            <span className="text-gray-500">Order Number:</span>
            <span className="ml-2 font-bold text-black">{order.id}</span>
          </div>
          <div>
            <span className="text-gray-500">Order Date:</span>
            <span className="ml-2 font-bold text-black">{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
          <div className="text-right">
            <span className="text-gray-500">Invoice Date:</span>
            <span className="ml-2 font-bold text-black">{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* DETAILED TABLE */}
        {/* Increased margin mb-12 */}
        <table className="w-full text-sm mb-12 border-collapse">
          <thead>
            <tr className="border-b-2 border-black text-xs uppercase tracking-wide text-gray-600">
              <th className="py-3 text-left w-[40%]">Description</th>
              <th className="py-3 text-right">Unit Price</th>
              <th className="py-3 text-center">Qty</th>
              <th className="py-3 text-right">Net Amount</th>
              <th className="py-3 text-right">Tax Rate</th>
              <th className="py-3 text-right">Tax Amount</th>
              <th className="py-3 text-right text-black font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, idx) => {
              const unitPrice = Number(item.price);
              const qty = item.quantity;
              const netAmount = unitPrice * qty;
              const taxRate = 0.20; 
              const taxAmount = netAmount * taxRate;
              const totalLine = netAmount + taxAmount;

              return (
                <tr key={idx}>
                  <td className="py-4 font-medium text-gray-800"> {/* Increased padding py-4 */}
                    {item.product_name}
                    <div className="text-[10px] text-gray-500 mt-0.5">HSN: 851762</div>
                  </td>
                  <td className="py-4 text-right">£{unitPrice.toFixed(2)}</td>
                  <td className="py-4 text-center">{qty}</td>
                  <td className="py-4 text-right">£{netAmount.toFixed(2)}</td>
                  <td className="py-4 text-right">20%</td>
                  <td className="py-4 text-right">£{taxAmount.toFixed(2)}</td>
                  <td className="py-4 text-right font-bold text-black">£{totalLine.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* TOTALS SECTION */}
        <div className="flex justify-end">
          <div className="w-72 space-y-3 text-sm"> {/* Increased width and spacing */}
            <div className="flex justify-between">
              <span className="text-gray-600">Total Net Amount:</span>
              <span>£{(Number(order.total_amount) / 1.2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tax (20%):</span>
              <span>£{(Number(order.total_amount) - (Number(order.total_amount) / 1.2)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping:</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="flex justify-between border-t border-black pt-3 mt-3 text-base">
              <span className="font-bold text-black">Grand Total:</span>
              <span className="font-bold text-black">£{Number(order.total_amount).toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-right text-gray-500 mt-1 font-medium">(Amount in Words: Pounds Sterling Only)</p>
          </div>
        </div>

        {/* FOOTER / SIGNATURE */}
        {/* Increased top margin mt-20 */}
        <div className="mt-20 pt-8 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <div className="text-[10px] text-gray-500 max-w-sm space-y-1">
              <p className="font-bold text-black text-xs mb-2">Terms & Conditions:</p>
              {/* Terms list */}
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-black mb-20">For Aidezel Ltd.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderInvoice;