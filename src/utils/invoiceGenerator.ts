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
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Canvas context is null"));
      }
    };
    img.onerror = (error) => reject(error);
  });
};

export const generateInvoiceBase64 = async (order: any, items: any[]) => {
  try {
    const doc = new jsPDF();

    // --- LOGO ---
    try {
      const logoBase64 = await getBase64ImageFromURL(logo);
      const imgProps = doc.getImageProperties(logoBase64);
      const pdfWidth = 40;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      doc.addImage(logoBase64, "PNG", 14, 10, pdfWidth, pdfHeight);
    } catch (err) {
      console.error("Could not load logo image", err);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("AIDEZEL", 14, 25);
    }

    const safeItems = Array.isArray(items) ? items : []; 
    const safeOrder = order || {};
    const safeId = safeOrder.id || "PENDING";
    const safeDate = new Date(safeOrder.created_at || new Date()).toLocaleDateString('en-GB');

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
    // Seller
    doc.text("Sold By:", 14, startY);
    doc.setFont("helvetica", "bold");
    doc.text("Aidezel Ltd.", 14, startY + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Unit 42, Innovation Tech Park", 14, startY + 10);
    doc.text("123 Commerce Way, London", 14, startY + 15);
    doc.text("United Kingdom, EC1A 1BB", 14, startY + 20);
    doc.setFontSize(8);
    doc.text("VAT Reg No: GB 987 654 321", 14, startY + 30);

    // Customer
    const rightColX = 130;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Billing/Shipping Address:", rightColX, startY);
    doc.setFont("helvetica", "bold");
    doc.text(String(safeOrder.customer_name || "Valued Customer").toUpperCase(), rightColX, startY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(safeOrder.address || "", rightColX, startY + 10);
    doc.text(`${safeOrder.city || ""} ${safeOrder.postcode || ""}`, rightColX, startY + 15);

    // --- ORDER BAR ---
    const barY = startY + 40;
    doc.setLineWidth(0.5);
    doc.line(14, barY, 196, barY);
    doc.setFontSize(9);
    doc.text(`Order Number:`, 14, barY + 6);
    doc.setFont("helvetica", "bold");
    doc.text(`${safeId}`, 40, barY + 6);
    doc.setFont("helvetica", "normal");
    doc.text(`Order Date:`, 110, barY + 6);
    doc.setFont("helvetica", "bold");
    doc.text(`${safeDate}`, 130, barY + 6);
    doc.line(14, barY + 10, 196, barY + 10);

    // --- TABLE (AMAZON STYLE) ---
    const tableData = safeItems.map((item: any) => {
      // 1. Explicitly use the product name
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
      theme: 'grid', // 'grid' gives nice professional borders
      headStyles: { 
        fillColor: [35, 47, 62], // Amazon-ish Dark Blue/Grey Header
        textColor: [255, 255, 255],
        fontStyle: 'bold', 
        fontSize: 8,
        halign: 'center',
        cellPadding: 3
      },
      bodyStyles: {
        textColor: [50, 50, 50],
        fontSize: 9,
        cellPadding: 5,
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // Very subtle alternation
      },
      head: [["Description", "Unit Price (Net)", "Qty", "Net Amount", "Tax Rate", "Tax Amount", "Total"]],
      body: tableData,
      columnStyles: {
        0: { cellWidth: 70, halign: 'left' }, // Description
        1: { halign: 'right' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' } // Bold Total
      }
    });

    // --- TOTALS ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalAmount = Number(safeOrder.total_amount || 0);
    const totalNet = totalAmount / 1.2;
    const totalTax = totalAmount - totalNet;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Aligned breakdown
    doc.text("Total Net Amount:", 130, finalY);
    doc.text(formatCurrency(totalNet), 196, finalY, { align: "right" });

    doc.text("Total Tax (20%):", 130, finalY + 6);
    doc.text(formatCurrency(totalTax), 196, finalY + 6, { align: "right" });

    doc.text("Shipping:", 130, finalY + 12);
    doc.setTextColor(22, 163, 74);
    doc.text("FREE", 196, finalY + 12, { align: "right" });

    doc.setTextColor(0);
    doc.setLineWidth(0.5);
    doc.line(130, finalY + 16, 196, finalY + 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Grand Total:", 130, finalY + 24);
    doc.text(formatCurrency(totalAmount), 196, finalY + 24, { align: "right" });

    // --- FOOTER ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("For Aidezel Ltd.", 150, finalY + 50);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("This is a computer generated invoice.", 14, finalY + 60);

    const pdfOutput = doc.output("datauristring");
    return pdfOutput.split(",")[1];

  } catch (error) {
    console.error("PDF GENERATION FAILED:", error);
    return "";
  }
};