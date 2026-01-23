import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatCurrency = (amount: any) => {
  return `£${Number(amount || 0).toFixed(2)}`;
};

export const generateInvoiceBase64 = async (order: any, items: any[], options: { skipLogo?: boolean } = {}) => {
  try {
    const doc = new jsPDF({ compress: true });

    // --- 1. HEADER (TEXT LOGO) ---
    doc.setFontSize(28);
    // CHANGED: Matched color to Table Headers (Dark Blue/Grey) instead of Green
    doc.setTextColor(35, 47, 62); 
    doc.setFont("helvetica", "bold");
    doc.text("AIDEZEL", 14, 25);

    const safeItems = Array.isArray(items) ? items : []; 
    const safeOrder = order || {};
    const safeId = safeOrder.id || "PENDING";
    const displayId = String(safeId).toUpperCase();
    const safeDate = new Date().toLocaleDateString('en-GB');

    // "TAX INVOICE" Label
    doc.setTextColor(0); 
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 196, 22, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("(Original for Recipient)", 196, 27, { align: "right" });

    // --- 2. ADDRESSES (Fixed Placement) ---
    const startY = 50;

    // Left: Sold By
    doc.setFontSize(10);
    doc.text("Sold By:", 14, startY);
    doc.setFont("helvetica", "bold");
    doc.text("Aidezel Ltd.", 14, startY + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Unit 42, Innovation Tech Park", 14, startY + 10);
    doc.text("123 Commerce Way, London", 14, startY + 15);
    doc.text("United Kingdom, EC1A 1BB", 14, startY + 20);

    // Right: Billing Address
    const rightColX = 130;
    doc.setFont("helvetica", "bold");
    doc.text("Billing/Shipping Address:", rightColX, startY);

    // Name
    const custName = safeOrder.customer_name || "Valued Customer";
    doc.text(String(custName).toUpperCase(), rightColX, startY + 5);

    doc.setFont("helvetica", "normal");

    // Address Lines
    const addrText = safeOrder.address || "Address Details Unavailable";
    const addressLines = doc.splitTextToSize(addrText, 65);
    doc.text(addressLines, rightColX, startY + 10);

    // City/Postcode position depends on address length
    const cityY = startY + 10 + (addressLines.length * 4);
    doc.text(`${safeOrder.city || ""} ${safeOrder.postcode || ""}`, rightColX, cityY);

    // --- 3. ORDER BAR ---
    const barY = startY + 40;
    doc.setFillColor(245, 245, 245);
    doc.rect(14, barY - 4, 182, 14, 'F');

    doc.setFontSize(9);
    doc.setTextColor(50);
    doc.text(`Order Number:`, 18, barY + 4);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(`${displayId}`, 45, barY + 4);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    doc.text(`Order Date:`, 110, barY + 4);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(`${safeDate}`, 130, barY + 4);

    // --- 4. CALCULATE TOTALS ---
    let calculatedTotal = 0;
    const tableData = safeItems.map((item: any) => {
      const name = item.product_name || item.name || "Item";
      const quantity = Number(item.quantity || 1);

      let unitPriceGross = 0;
      if (item.price_at_purchase !== undefined) unitPriceGross = Number(item.price_at_purchase);
      else if (item.price !== undefined) unitPriceGross = Number(item.price);

      const totalLineGross = unitPriceGross * quantity;
      calculatedTotal += totalLineGross;

      const totalLineNet = totalLineGross / 1.2;
      const totalLineTax = totalLineGross - totalLineNet;
      const unitPriceNet = unitPriceGross / 1.2;

      return [
        name,
        formatCurrency(unitPriceNet),
        quantity,
        formatCurrency(totalLineNet),
        "20%",
        formatCurrency(totalLineTax),
        formatCurrency(totalLineGross)
      ];
    });

    let grandTotal = Number(safeOrder.total_amount || 0);
    if (grandTotal === 0 && calculatedTotal > 0) {
      grandTotal = calculatedTotal;
    }
    const totalNet = grandTotal / 1.2;
    const totalTax = grandTotal - totalNet;

    // --- 5. TABLE ---
    autoTable(doc, {
      startY: barY + 15,
      theme: 'plain',
      headStyles: {
        fillColor: [35, 47, 62], // Dark Blue/Grey (Matched by Header)
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 3
      },
      bodyStyles: { textColor: 50, fontSize: 9, cellPadding: 4, valign: 'middle', lineColor: [230, 230, 230], lineWidth: { bottom: 0.1 } },
      head: [["Description", "Unit Price (Net)", "Qty", "Net Amount", "Tax Rate", "Tax Amount", "Total"]],
      body: tableData,
      columnStyles: {
        0: { cellWidth: 70 },
        6: { fontStyle: 'bold', halign: 'right' } 
      }
    });

    // --- 6. SUMMARY ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const summaryXLabel = 140;
    const summaryXValue = 196;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);

    doc.text("Total Net Amount:", summaryXLabel, finalY);
    doc.text(formatCurrency(totalNet), summaryXValue, finalY, { align: "right" });

    doc.text("Total Tax (20%):", summaryXLabel, finalY + 5);
    doc.text(formatCurrency(totalTax), summaryXValue, finalY + 5, { align: "right" });

    doc.setDrawColor(200);
    doc.line(summaryXLabel, finalY + 8, summaryXValue, finalY + 8);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", summaryXLabel, finalY + 15);
    doc.text(formatCurrency(grandTotal), summaryXValue, finalY + 15, { align: "right" });

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    doc.text("This is a computer generated invoice.", 14, pageHeight - 15);
    doc.text("Aidezel Ltd. Registered in UK.", 196, pageHeight - 15, { align: "right" });

    const pdfOutput = doc.output("datauristring");
    return pdfOutput.split(",")[1];

  } catch (error) {
    console.error("PDF GENERATION FAILED:", error);
    return "";
  }
};