import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatCurrency = (amount: any) => {
  return `£${Number(amount || 0).toFixed(2)}`;
};

export const generateInvoiceBase64 = (order: any, items: any[]) => {
  try {
    const doc = new jsPDF();
    
    // --- SAFETY FIRST: Ensure data exists or use defaults ---
    const safeItems = Array.isArray(items) ? items : []; 
    const safeOrder = order || {};
    const safeId = safeOrder.id ? safeOrder.id.split('-')[0].toUpperCase() : "PENDING";
    const safeDate = new Date().toLocaleDateString();

    // --- 1. HEADER ---
    doc.setFontSize(20);
    doc.text("TAX INVOICE", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("ADMIN COPY", 14, 26);

    // --- 2. SELLER INFO ---
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Sold By:", 14, 35);
    doc.setFont("helvetica", "normal");
    doc.text("Aidezel Ltd.", 14, 40);
    doc.text("Unit 42, Innovation Tech Park", 14, 45);
    doc.text("123 Commerce Way, London", 14, 50);
    doc.text("United Kingdom, EC1A 1BB", 14, 55);
    doc.text("VAT Reg No: GB 987 654 321", 14, 65);

    // --- 3. CUSTOMER INFO ---
    const rightColX = 110;
    doc.setFont("helvetica", "bold");
    doc.text("Billing Address:", rightColX, 35);
    doc.setFont("helvetica", "normal");
    doc.text(safeOrder.customer_name || "Valued Customer", rightColX, 40);
    doc.text("Flat no 1A Deepam Vfive homes", rightColX, 45);
    doc.text("Trivandrum, 695013", rightColX, 50);

    // --- 4. ORDER DETAILS ---
    doc.line(14, 85, 196, 85);
    doc.text(`Order Number: ${safeId}`, 14, 91);
    doc.text(`Order Date: ${safeDate}`, 80, 91);
    doc.line(14, 95, 196, 95);

    // --- 5. TABLE (CRASH PROOF LOGIC) ---
    // We filter out any bad items before mapping
    const tableData = safeItems
      .filter((item: any) => item) 
      .map((item: any) => {
        const price = Number(item.price || 0);
        const qty = Number(item.quantity || 1);
        const net = price * qty;
        const tax = net * 0.20;
        return [
          item.name || "Item",
          formatCurrency(price),
          qty,
          formatCurrency(net),
          "20%",
          formatCurrency(tax),
          formatCurrency(net + tax)
        ];
      });

    // If no items, add a placeholder row so PDF doesn't look broken
    if (tableData.length === 0) {
      tableData.push(["No Items Found", "£0.00", "0", "£0.00", "0%", "£0.00", "£0.00"]);
    }

    autoTable(doc, {
      startY: 100,
      head: [["DESCRIPTION", "PRICE", "QTY", "NET", "TAX %", "TAX AMT", "TOTAL"]],
      body: tableData,
    });

    // --- OUTPUT ---
    const pdfOutput = doc.output("datauristring");
    // Return ONLY the Base64 string (remove the "data:..." prefix)
    return pdfOutput.split(",")[1];

  } catch (error) {
    console.error("CRITICAL PDF ERROR:", error);
    return ""; // Return empty string so the app doesn't crash
  }
};