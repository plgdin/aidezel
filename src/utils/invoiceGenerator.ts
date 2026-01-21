import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.png";

const formatCurrency = (amount: any) => {
  return `£${Number(amount || 0).toFixed(2)}`;
};

const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Limit resolution for file size
      const scale = Math.min(1, 300 / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // High compression JPEG
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        reject(new Error("Canvas context is null"));
      }
    };
    img.onerror = (error) => reject(error);
  });
};

export const generateInvoiceBase64 = async (order: any, items: any[], options: { skipLogo?: boolean } = {}) => {
  try {
    const doc = new jsPDF({ compress: true });

    // --- 1. HEADER SECTION ---
    const amazonBlue = [35, 47, 62]; // Professional Dark Blue

    if (!options.skipLogo) {
      // IMAGE MODE (For Downloads)
      try {
        const logoBase64 = await getBase64ImageFromURL(logo);
        const imgProps = doc.getImageProperties(logoBase64);
        const pdfWidth = 40; 
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        doc.addImage(logoBase64, "JPEG", 14, 10, pdfWidth, pdfHeight);
      } catch (err) {
        // Fallback if image fails
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(35, 47, 62);
        doc.text("Aidezel", 14, 25);
      }
    } else {
      // EMAIL MODE (Text Only - Professional Look)
      // Instead of big blocky text, we use the brand color and a cleaner font weight
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(35, 47, 62); // Amazon Dark Blue
      doc.text("Aidezel", 14, 25);

      // Optional: Add a small slogan or tagline if you want
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      // doc.text("Premium Electronics", 14, 30); // Uncomment if you want a tagline
    }

    const safeItems = Array.isArray(items) ? items : []; 
    const safeOrder = order || {};
    const safeId = safeOrder.id || "PENDING";
    const displayId = String(safeId).toUpperCase();
    const safeDate = new Date().toLocaleDateString('en-GB');

    // "TAX INVOICE" Label
    doc.setTextColor(0); // Reset to black
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 196, 22, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("(Original for Recipient)", 196, 27, { align: "right" });

    // --- 2. ADDRESS & DETAILS ---
    const startY = 50;

    // Left: Sold By
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Sold By:", 14, startY);
    doc.setFont("helvetica", "bold");
    doc.text("Aidezel Ltd.", 14, startY + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Unit 42, Innovation Tech Park", 14, startY + 10);
    doc.text("123 Commerce Way, London", 14, startY + 15);
    doc.text("United Kingdom, EC1A 1BB", 14, startY + 20);

    // Right: Bill To
    const rightColX = 130;
    doc.setFont("helvetica", "bold");
    doc.text("Billing/Shipping Address:", rightColX, startY);
    doc.setFont("helvetica", "bold");
    doc.text(String(safeOrder.customer_name || "Valued Customer").toUpperCase(), rightColX, startY + 5);
    doc.setFont("helvetica", "normal");

    const addressLines = doc.splitTextToSize(safeOrder.address || "", 65);
    doc.text(addressLines, rightColX, startY + 10);
    const cityY = startY + 10 + (addressLines.length * 4);
    doc.text(`${safeOrder.city || ""} ${safeOrder.postcode || ""}`, rightColX, cityY);

    // --- 3. ORDER BAR (Grey Strip) ---
    const barY = startY + 40;
    doc.setFillColor(245, 245, 245); // Light Grey Background
    doc.rect(14, barY - 4, 182, 14, 'F'); // Background rectangle

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

    // --- 4. DATA PREPARATION ---
    // Recalculate totals from items if order total is 0 (Fixes the 0.00 issue)
    let calculatedTotal = 0;

    const tableData = safeItems.map((item: any) => {
      const name = item.product_name || item.name || "Item";
      const quantity = Number(item.quantity || 1);

      // Handle various price formats
      let unitPriceGross = 0;
      if (item.price_at_purchase !== undefined) unitPriceGross = Number(item.price_at_purchase);
      else if (item.price !== undefined) unitPriceGross = Number(item.price);

      const totalLineGross = unitPriceGross * quantity;
      const totalLineNet = totalLineGross / 1.2;
      const totalLineTax = totalLineGross - totalLineNet;
      const unitPriceNet = unitPriceGross / 1.2;

      calculatedTotal += totalLineGross;

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

    // Determine Final Total (Use DB total if valid, else use calculated)
    let grandTotal = Number(safeOrder.total_amount || 0);
    if (grandTotal === 0 && calculatedTotal > 0) {
      grandTotal = calculatedTotal;
    }
    const totalNet = grandTotal / 1.2;
    const totalTax = grandTotal - totalNet;

    // --- 5. TABLE ---
    autoTable(doc, {
      startY: barY + 15,
      theme: 'plain', // Cleaner look
      headStyles: {
        fillColor: [35, 47, 62],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 3
      },
      bodyStyles: {
        textColor: 50,
        fontSize: 9,
        cellPadding: 4,
        valign: 'middle',
        lineColor: [230, 230, 230],
        lineWidth: { bottom: 0.1 }
      },
      head: [["Description", "Unit Price (Net)", "Qty", "Net Amount", "Tax Rate", "Tax Amount", "Total"]],
      body: tableData,
      columnStyles: {
        0: { cellWidth: 70 }, // Description
        1: { halign: 'right' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { fontStyle: 'bold', halign: 'right' } // Total
      }
    });

    // --- 6. SUMMARY BLOCK ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Right Align Summary
    const summaryXLabel = 140;
    const summaryXValue = 196;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);

    doc.text("Total Net Amount:", summaryXLabel, finalY);
    doc.text(formatCurrency(totalNet), summaryXValue, finalY, { align: "right" });

    doc.text("Total Tax (20%):", summaryXLabel, finalY + 5);
    doc.text(formatCurrency(totalTax), summaryXValue, finalY + 5, { align: "right" });

    // Divider Line
    doc.setDrawColor(200);
    doc.line(summaryXLabel, finalY + 8, summaryXValue, finalY + 8);

    // Grand Total
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", summaryXLabel, finalY + 15);
    doc.text(formatCurrency(grandTotal), summaryXValue, finalY + 15, { align: "right" });

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