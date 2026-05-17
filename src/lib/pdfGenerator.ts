import { jsPDF } from "jspdf";

interface PDFOrderData {
  orderId: string;
  customerName: string;
  catererName: string;
  totalPrice: number;
  items: {
    name: string;
    quantity: number;
    basePrice: number;
    selectedOptions: {
      groupName: string;
      optionName: string;
      priceChange: number;
    }[];
  }[];
}

// 1. Programmatic Generation of Receipt PDF
export function generateReceiptPDF(data: PDFOrderData): Buffer {
  const doc = new jsPDF();

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 105, 180); // Hot Pink Brand Color!
  doc.text("PINK DESSERT CATERING", 105, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Sweetness Delivered to Your Doorstep", 105, 26, { align: "center" });

  // Border Line
  doc.setDrawColor(255, 182, 193); // Light Pink Border
  doc.setLineWidth(0.5);
  doc.line(15, 32, 195, 32);

  // Meta Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(`Order Receipt`, 15, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Order ID: ${data.orderId}`, 15, 48);
  doc.text(`Customer Name: ${data.customerName}`, 15, 54);
  doc.text(`Caterer Shop: ${data.catererName}`, 15, 60);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 66);

  // Divider
  doc.line(15, 72, 195, 72);

  // Items Header
  doc.setFont("helvetica", "bold");
  doc.text("Pastry Item", 15, 80);
  doc.text("Qty", 120, 80, { align: "center" });
  doc.text("Base Price", 150, 80, { align: "right" });
  doc.text("Subtotal", 190, 80, { align: "right" });

  doc.line(15, 84, 195, 84);

  let yPosition = 92;
  data.items.forEach((item) => {
    // Calculate final single unit price with customizations
    const customizationSum = item.selectedOptions.reduce((s, o) => s + o.priceChange, 0);
    const unitPrice = item.basePrice + customizationSum;
    const subtotal = unitPrice * item.quantity;

    doc.setFont("helvetica", "bold");
    doc.text(item.name, 15, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(item.quantity.toString(), 120, yPosition, { align: "center" });
    doc.text(`$${item.basePrice.toFixed(2)}`, 150, yPosition, { align: "right" });
    doc.text(`$${subtotal.toFixed(2)}`, 190, yPosition, { align: "right" });

    // Render option list under item
    if (item.selectedOptions.length > 0) {
      item.selectedOptions.forEach((opt) => {
        yPosition += 5;
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.text(
          `• ${opt.groupName}: ${opt.optionName} (+$${opt.priceChange.toFixed(2)})`,
          20,
          yPosition
        );
      });
    }

    yPosition += 10;
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
  });

  // Totals Section
  doc.line(15, yPosition, 195, yPosition);
  yPosition += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 20, 147); // Deep Pink
  doc.text(`GRAND TOTAL:`, 140, yPosition);
  doc.text(`$${data.totalPrice.toFixed(2)}`, 190, yPosition, { align: "right" });

  // Thank You Message
  yPosition += 25;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text("Thank you for ordering your treats from Pink Dessert Catering!", 105, yPosition, {
    align: "center",
  });

  return Buffer.from(doc.output("arraybuffer"));
}

// 2. Programmatic Generation of Agreement Document PDF
export function generateAgreementPDF(data: PDFOrderData): Buffer {
  const doc = new jsPDF();

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(139, 0, 139); // Purple Brand Tone
  doc.text("CATERING SERVICE AGREEMENT", 105, 20, { align: "center" });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(15, 28, 195, 28);

  // Introductory Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("1. PARTIES TO THE AGREEMENT", 15, 38);

  doc.setFont("helvetica", "normal");
  doc.text(
    `This agreement is made and entered into on this day ${new Date().toLocaleDateString()} between:\n` +
      `CATERER (Provider): ${data.catererName}\n` +
      `CUSTOMER (Client): ${data.customerName}`,
    15,
    44
  );

  // Term 2: Event Details
  doc.setFont("helvetica", "bold");
  doc.text("2. SCOPE OF SERVICES & DESSERT SUPPLY", 15, 62);
  
  doc.setFont("helvetica", "normal");
  doc.text(
    `The Caterer agrees to supply and deliver the customized pastries and cakes listed in Order ID: ${data.orderId}.\n` +
      `The Client agrees to pay the total sum of $${data.totalPrice.toFixed(2)} including chosen custom toppings.\n` +
      `All items are baked fresh and handled under certified sanitary standards.`,
    15,
    68
  );

  // Term 3: Terms and Conditions
  doc.setFont("helvetica", "bold");
  doc.text("3. CANCELLATION & QUALITY ASSURANCE POLICIES", 15, 88);

  doc.setFont("helvetica", "normal");
  doc.text(
    `• Cancellations made within 24 hours of delivery are subject to a 50% penalty fee.\n` +
      `• The Client must ensure a representative is present at coordinates for receipt.\n` +
      `• Freshness is guaranteed for up to 12 hours from initial delivery when refrigerated.`,
    15,
    94
  );

  // Signature lines
  let yPos = 130;
  doc.line(15, yPos, 195, yPos);
  yPos += 10;

  doc.setFont("helvetica", "bold");
  doc.text("For: PINK DESSERT SHOP", 15, yPos);
  doc.text("For: THE CLIENT (Signed Electronically)", 110, yPos);

  yPos += 20;
  doc.setFont("helvetica", "normal");
  doc.text("__________________________", 15, yPos);
  doc.text("__________________________", 110, yPos);
  
  doc.setFontSize(8);
  doc.text("Authorized Representative Signature", 15, yPos + 4);
  doc.text("Client E-Signature Confirmation", 110, yPos + 4);

  return Buffer.from(doc.output("arraybuffer"));
}
