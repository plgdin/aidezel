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
      // Keep logo small (max 300px width)
      const scale = Math.min(1, 300 / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        reject(new Error("Canvas context is null"));
      }
    };
    img.onerror = (error) => reject(error);
  });
};

// NEW: 'options' parameter controls if we include the logo
export const generateInvoiceBase64 = async (order: any, items: any[], options: { skipLogo?: boolean } = {}) => {
  try {
    const doc = new jsPDF({ compress: true });

    // --- LOGO LOGIC ---
    if (!options.skipLogo) {
      // Standard Mode: Try to add the logo
      try {
        const logoBase64 = await getBase64ImageFromURL(logo);
        const imgProps = doc.getImageProperties(logoBase64);
        const pdfWidth = 40;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        doc.addImage(logoBase64, "JPEG", 14, 10, pdfWidth, pdfHeight);
      } catch (err) {
        // Fallback if image fails
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("AIDEZEL", 14, 25);
      }
    } else {
      // Email Mode: TEXT ONLY (Result: Tiny file size, ~5KB)
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("AIDEZEL", 14, 25);
    }

    const safeItems = Array.isArray(items) ? items : []; 
    const safeOrder = order || {};
    const safeId = safeOrder.id || "PENDING";
    const displayId = String(safeId).toUpperCase();
    const safeDate = new Date().toLocaleDateString('en-GB');

    // --- HEADER ---
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 196, 20, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("(Original for Recipient)", 196, 25, { align: "right" });

    // --- ADDRESSES ---
    const startY = 50;

    doc.setFontSize(10);
    doc.text("Sold By:", 14, startY);
    doc.setFont("helvetica", "bold");
    doc.text("Aidezel Ltd.", 14, startY + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Unit 42, Innovation Tech Park", 14, startY + 10);
    doc.text("123 Commerce Way, London", 14, startY + 15);
    doc.text("United Kingdom, EC1A 1BB", 14, startY + 20);

    // Customer
    const rightColX = 130;
    doc.setFont("helvetica", "bold");
    doc.text("Billing/Shipping Address:", rightColX, startY);
    doc.text(String(safeOrder.customer_name || "Valued Customer").toUpperCase(), rightColX, startY + 5);
    doc.setFont("helvetica", "normal");

    const addressLines = doc.splitTextToSize(safeOrder.address || "", 60);
    doc.text(addressLines, rightColX, startY + 10);
    const cityY = startY + 10 + (addressLines.length * 4);
    doc.text(`${safeOrder.city || ""} ${safeOrder.postcode || ""}`, rightColX, cityY);

    // --- ORDER BAR ---
    const barY = startY + 40;
    doc.setLineWidth(0.5);
    doc.line(14, barY, 196, barY);
    doc.setFontSize(9);
    doc.text(`Order Number:`, 14, barY + 6);
    doc.setFont("helvetica", "bold");
    doc.text(`${displayId}`, 40, barY + 6);
    doc.setFont("helvetica", "normal");
    doc.text(`Order Date:`, 110, barY + 6);
    doc.setFont("helvetica", "bold");
    doc.text(`${safeDate}`, 130, barY + 6);
    doc.line(14, barY + 10, 196, barY + 10);

    // --- TABLE ---
    const tableData = safeItems.map((item: any) => {
      const name = item.product_name || item.name || "Item";
      const quantity = Number(item.quantity || 1);
      const rawPrice = item.price !== undefined ? item.price : item.price_at_purchase;
      const unitPriceGross = Number(rawPrice || 0);

      const totalLineGross = unitPriceGross * quantity;
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

    autoTable(doc, {
      startY: barY + 15,
      theme: 'grid',
      headStyles: { fillColor: [35, 47, 62], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { textColor: 50, fontSize: 9 },
      head: [["Description", "Unit Price (Net)", "Qty", "Net Amount", "Tax Rate", "Tax Amount", "Total"]],
      body: tableData,
      columnStyles: {
        0: { cellWidth: 70 },
        6: { fontStyle: 'bold', halign: 'right' }
      }
    });

    // --- TOTALS ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    let totalAmount = 0;
    if (typeof safeOrder.total_amount === 'string') {
      totalAmount = parseFloat(safeOrder.total_amount.replace(/[^0-9.-]+/g, ""));
    } else {
      totalAmount = Number(safeOrder.total_amount || 0);
    }

    const totalNet = totalAmount / 1.2;
    const totalTax = totalAmount - totalNet;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text("Total Net Amount:", 130, finalY);
    doc.text(formatCurrency(totalNet), 196, finalY, { align: "right" });

    doc.text("Total Tax (20%):", 130, finalY + 6);
    doc.text(formatCurrency(totalTax), 196, finalY + 6, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Grand Total:", 130, finalY + 18);
    doc.text(formatCurrency(totalAmount), 196, finalY + 18, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("This is a computer generated invoice.", 14, finalY + 30);

    const pdfOutput = doc.output("datauristring");
    return pdfOutput.split(",")[1];

  } catch (error) {
    console.error("PDF GENERATION FAILED:", error);
    return "";
  }
};