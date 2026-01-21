import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatCurrency = (amount: any) => {
  return `£${Number(amount || 0).toFixed(2)}`;
};

export const generateInvoiceBase64 = (order: any, items: any[]) => {
  try {
    const doc = new jsPDF();

    const safeItems = Array.isArray(items) ? items : []; 
    const safeOrder = order || {};
    // Ensure we use the full ID for the professional look
    const safeId = safeOrder.id || "PENDING";
    const safeDate = new Date(safeOrder.created_at || new Date()).toLocaleDateString('en-GB');

    // --- 1. HEADER ---
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE/BILL OF SUPPLY", 196, 20, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("(Original for Recipient)", 196, 25, { align: "right" });

    // Brand Name (Aidezel)
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("AIDEZEL", 14, 25);

    // --- 2. SELLER & ADDRESS GRID ---
    doc.setFontSize(10);
    // Sold By (Left)
    doc.text("Sold By:", 14, 45);
    doc.setFont("helvetica", "bold");
    doc.text("Aidezel Ltd.", 14, 50);
    doc.setFont("helvetica", "normal");
    doc.text("Unit 42, Innovation Tech Park", 14, 55);
    doc.text("123 Commerce Way, London", 14, 60);
    doc.text("United Kingdom, EC1A 1BB", 14, 65);
    doc.setFontSize(8);
    doc.text("VAT Reg No: GB 987 654 321", 14, 75);

    // Billing/Shipping (Right)
    const rightColX = 130;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Billing/Shipping Address:", rightColX, 45);
    doc.setFont("helvetica", "bold");
    doc.text(String(safeOrder.customer_name || "Valued Customer").toUpperCase(), rightColX, 50);
    doc.setFont("helvetica", "normal");
    // Ensure your order object has these specific address fields
    doc.text(safeOrder.address || "Flat no 1A Deepam Vfive homes", rightColX, 55);
    doc.text(`${safeOrder.city || "Trivandrum"}, ${safeOrder.postcode || "695013"}`, rightColX, 60);

    // --- 3. ORDER DETAILS BAR ---
    doc.setLineWidth(0.5);
    doc.line(14, 85, 196, 85);
    doc.setFontSize(9);
    doc.text(`Order Number:`, 14, 91);
    doc.setFont("helvetica", "bold");
    doc.text(`${safeId}`, 40, 91);

    doc.setFont("helvetica", "normal");
    doc.text(`Order Date:`, 110, 91);
    doc.setFont("helvetica", "bold");
    doc.text(`${safeDate}`, 130, 91);
    doc.line(14, 95, 196, 95);

    // --- 4. TABLE DATA (MATCHING UK VAT LOGIC) ---
    const tableData = safeItems.map((item: any) => {
      // FIX: Database uses 'product_name' and 'price'
      const name = item.product_name || item.name || "Product";
      const totalLine = Number(item.price || 0) * Number(item.quantity || 1);

      // UK Calculation: Net = Total / 1.2 (for 20% VAT)
      const netAmount = totalLine / 1.2;
      const taxAmount = totalLine - netAmount;

      return [
        name,
        formatCurrency(Number(item.price || 0) / 1.2), // Unit Price (Net)
        item.quantity || 1,
        formatCurrency(netAmount),
        "20%",
        formatCurrency(taxAmount),
        formatCurrency(totalLine)
      ];
    });

    autoTable(doc, {
      startY: 100,
      theme: 'plain',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8
      },
      head: [["DESCRIPTION", "UNIT PRICE", "QTY", "NET AMOUNT", "TAX RATE", "TAX AMT", "TOTAL"]],
      body: tableData,
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { halign: 'right' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' }
      }
    });

    // --- 5. TOTALS SECTION ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalAmount = Number(safeOrder.total_amount || 0);
    const totalNet = totalAmount / 1.2;
    const totalTax = totalAmount - totalNet;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Total Net Amount:", 130, finalY);
    doc.text(formatCurrency(totalNet), 196, finalY, { align: "right" });

    doc.text("Total Tax (20%):", 130, finalY + 7);
    doc.text(formatCurrency(totalTax), 196, finalY + 7, { align: "right" });

    doc.text("Shipping:", 130, finalY + 14);
    doc.setTextColor(22, 163, 74); // Green for FREE
    doc.text("FREE", 196, finalY + 14, { align: "right" });

    doc.setTextColor(0);
    doc.setLineWidth(0.5);
    doc.line(130, finalY + 18, 196, finalY + 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Grand Total:", 130, finalY + 25);
    doc.text(formatCurrency(totalAmount), 196, finalY + 25, { align: "right" });

    // --- 6. FOOTER ---
    doc.setFontSize(10);
    doc.text("For Aidezel Ltd.", 150, finalY + 50);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("This is a computer generated invoice.", 14, finalY + 60);

    const pdfOutput = doc.output("datauristring");
    return pdfOutput.split(",")[1];

  } catch (error) {
    console.error("PDF GENERATION FAILED:", error);
    return "";
  }
};