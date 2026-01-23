import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatCurrency = (amount: any) => {
  return `£${Number(amount || 0).toFixed(2)}`;
};

export const generateInvoiceBase64 = async (order: any, items: any[], options: { skipLogo?: boolean } = {}) => {
  try {
    const doc = new jsPDF({ compress: true });

    // --- 1. HEADER ---
    // COLOR MATCH: Using Dark Blue (RGB: 35, 47, 62) to match the Table Header
    doc.setFontSize(28);
    doc.setTextColor(35, 47, 62); 
    doc.setFont("helvetica", "bold");
    doc.text("AIDEZEL", 14, 25);

    const safeItems = Array.isArray(items) ? items : []; 
    const safeOrder = order || {};
    const safeId = safeOrder.id || "PENDING";
    const displayId = String(safeId).toUpperCase();
    const safeDate = new Date(safeOrder.created_at || new Date()).toLocaleDateString('en-GB');

    // "TAX INVOICE" Label
    doc.setTextColor(0); 
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 196, 22, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("(Original for Recipient)", 196, 27, { align: "right" });

    // --- 2. ADDRESSES ---
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
    doc.text("VAT Reg No: GB 987 654 321", 14, startY + 30);

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

    // City/Postcode
    const cityY = startY + 10 + (addressLines.length * 4);
    doc.text(`${safeOrder.city || ""} ${safeOrder.postcode || ""}`, rightColX, cityY);

    // --- 3. ORDER BAR ---
    const barY = startY + 45;
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
    let calculatedSubtotal = 0;
    
    const tableData = safeItems.map((item: any) => {
      const name = item.product_name || item.name || "Item";
      const quantity = Number(item.quantity || 1);

      // Price logic
      let unitPriceGross = 0;
      if (item.price_at_purchase !== undefined) unitPriceGross = Number(item.price_at_purchase);
      else if (item.price !== undefined) unitPriceGross = Number(item.price);

      const totalLineGross = unitPriceGross * quantity;
      calculatedSubtotal += totalLineGross;

      // Tax breakdown (20% VAT assumed included)
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

    // Handle Discount Logic
    const dbGrandTotal = Number(safeOrder.total_amount || 0);
    let discountAmount = 0;
    
    // If the DB total is less than item sum, implies a discount
    if (dbGrandTotal < calculatedSubtotal - 0.05) { // 0.05 buffer for float errors
        discountAmount = calculatedSubtotal - dbGrandTotal;
    }

    // --- 5. TABLE ---
    autoTable(doc, {
      startY: barY + 15,
      theme: 'plain',
      headStyles: { 
          fillColor: [35, 47, 62], // Matches Logo Color
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
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 10;
    const summaryXLabel = 140;
    const summaryXValue = 196;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);

    // Subtotal
    doc.text("Subtotal:", summaryXLabel, finalY);
    doc.text(formatCurrency(calculatedSubtotal), summaryXValue, finalY, { align: "right" });

    let currentY = finalY + 5;

    // Discount (Only show if exists)
    if (discountAmount > 0.01) {
        doc.setTextColor(22, 163, 74); // Green for discount
        doc.text("Discount:", summaryXLabel, currentY);
        doc.text(`-${formatCurrency(discountAmount)}`, summaryXValue, currentY, { align: "right" });
        currentY += 5;
        doc.setTextColor(80); // Reset to grey
    }

    // Tax Note (Informational)
    const finalTax = dbGrandTotal - (dbGrandTotal / 1.2);
    doc.text("Included VAT (20%):", summaryXLabel, currentY);
    doc.text(formatCurrency(finalTax), summaryXValue, currentY, { align: "right" });
    
    currentY += 3;
    doc.setDrawColor(200);
    doc.line(summaryXLabel, currentY, summaryXValue, currentY);
    currentY += 7;

    // Grand Total
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", summaryXLabel, currentY);
    doc.text(formatCurrency(dbGrandTotal), summaryXValue, currentY, { align: "right" });

    // --- 7. FOOTER ---
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