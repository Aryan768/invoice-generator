import express from 'express';
import PDFDocument from 'pdfkit';
import multer from 'multer';
import path from 'path';

import { fileURLToPath } from 'url';
// Set up __dirname in ES6
const __filename = fileURLToPath(import.meta.url);
console.log(__filename);
const __dirname = path.dirname(__filename);
console.log(__dirname);
const app = express();
const PORT = process.env.PORT || 6001;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the upload directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
    }
});

const upload = multer({ storage });

//Middleware to parse JSON bodies
console.log("HI");
app.get("/", (req, res) => {
   console.log("Entered get");
   const items =0;
    res.render('index1',{items}, (err, html) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error rendering template");
        }
        res.send(html);
    });
});

app.post('/download-invoice', upload.single('logo'), (req, res) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');

    const doc = new PDFDocument();
    doc.pipe(res);

    const { companyName, address, phone, invoicedate, gstin, customerName, customerAddress, duedate, items, invoiceno, sgst, cgst } = req.body;

    // Company Header
    doc.fontSize(18).font('Helvetica-Bold').text(companyName || 'Your Company Name', 49, 25, { width: 400 });

    doc.fontSize(12)
        .text(`Address: ${address || '123 Main Street'}`, 51, 55, { width: 168 })
        .text(`Phone: ${phone || '123-456-7890'}`, 51, 108)
        .text(`Invoice date: ${invoicedate || 'info@yourcompany.com'}`, 51, 137)
        .text(`GSTIN: ${gstin || '1234567890ABCDEF'}`, 51, 172);

    // Invoice To Section
    doc.fontSize(14).font('Helvetica-Bold').text('Invoice To:', 310, 55);
    doc.fontSize(12)
        .text(customerName || 'Customer Name', 310, 70)
        .text(customerAddress || 'Customer Address', 310, 90)
        .text(`Due date: ${duedate}`, 310, 125)
        .text(`Invoice No: ${invoiceno}`, 310, 155);

    // Invoice Details Section
    doc.fontSize(14).font('Helvetica-Bold').text('Invoice Details', 50, 196);

    const tableTop = 231;
    const itemHeight = 20; // Default height of each row

    // Column headers with SGST and CGST
    const columnWidths = [50, 55, 65, 50, 65, 65, 65, 70]; // Adjusted to accommodate SGST/CGST
    const columnXPositions = columnWidths.reduce((accumulatedPositions, width) => {
        const lastPosition = accumulatedPositions.length ? accumulatedPositions[accumulatedPositions.length - 1] : 0;
        accumulatedPositions.push(lastPosition + width);
        return accumulatedPositions;
    }, []);

    doc.fontSize(12);

    // Draw table headers
    doc.font('Helvetica-Bold')
        .text('Sr. No.', columnXPositions[0], tableTop)
        .text('Description', columnXPositions[1] - 5, tableTop)
        .text('Quantity', columnXPositions[2] + 5, tableTop)
        .text('Rate', columnXPositions[3] + 7, tableTop)
        .text('Amount', columnXPositions[4], tableTop)
        .text('SGST', columnXPositions[5], tableTop)
        .text('CGST', columnXPositions[6], tableTop)
        .text('Total', columnXPositions[7], tableTop);

    doc.moveTo(50, tableTop + itemHeight).lineTo(550, tableTop + itemHeight).stroke();

    let y = tableTop + itemHeight + 5;

    // Tax rate for SGST and CGST
    const sgstRate = sgst / 100; // e.g., for SGST of 9%
    const cgstRate = cgst / 100; // e.g., for CGST of 9%

    // Dynamically render items
    items.forEach((item, index) => {
        const descriptionHeight = doc.heightOfString(item.description || '', {
            width: columnWidths[1], // Constrain to column width
            align: 'left',
        });

        const maxHeight = Math.max(itemHeight, descriptionHeight);

        const amount = item.quantity * item.rate;
        const sgstAmount = amount * sgstRate;
        const cgstAmount = amount * cgstRate;
        const totalAmount = amount + sgstAmount + cgstAmount;

        // Reset font to normal for item details
        doc.font('Helvetica'); 
        doc.fontSize(8);

        // Print item details
        doc.text((index + 1).toString(), columnXPositions[0], y)
            .text(item.description || '', columnXPositions[1], y, { width: columnWidths[1], align: 'left' })
            .text(item.quantity.toString(), columnXPositions[2] + 5, y)
            .text(Number(item.rate).toFixed(2), columnXPositions[3] + 7, y)
            .text(amount.toFixed(2), columnXPositions[4], y)
            .text(sgstAmount.toFixed(2), columnXPositions[5], y)
            .text(cgstAmount.toFixed(2), columnXPositions[6], y)
            .text(totalAmount.toFixed(2), columnXPositions[7], y);

        // Light grey percentage below SGST/CGST
        doc.fontSize(8).fillColor('grey')
            .text(`${(sgstRate * 100).toFixed(0)}%`, columnXPositions[5], y + maxHeight * 0.4 +4)
            .text(`${(cgstRate * 100).toFixed(0)}%`, columnXPositions[6], y + maxHeight * 0.4 +4);

        doc.fillColor('black'); // Reset to black for next row

        doc.moveTo(50, y + maxHeight).lineTo(550, y + maxHeight).stroke();

        y += maxHeight + 5;
    });

    // Calculate Subtotal and Total amounts
    let subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const sgstTotal = subtotal * sgstRate;
    const cgstTotal = subtotal * cgstRate;
    const totalAmountFinal = subtotal + sgstTotal + cgstTotal;

    let totalYPosition = y + itemHeight;

    doc.fontSize(12).font('Helvetica-Bold')
        .text('Subtotal:', columnXPositions[5], totalYPosition)
        .text(subtotal.toFixed(2), columnXPositions[7], totalYPosition);

    totalYPosition += itemHeight * 1.5;

    doc.text('SGST (9%):', columnXPositions[5], totalYPosition)
       .text(sgstTotal.toFixed(2), columnXPositions[7], totalYPosition);

    totalYPosition += itemHeight * 1.5;

    doc.text('CGST (9%):', columnXPositions[5], totalYPosition)
       .text(cgstTotal.toFixed(2), columnXPositions[7], totalYPosition);

    totalYPosition += itemHeight * 1.5;

    doc.text('Total:', columnXPositions[5], totalYPosition)
       .font('Helvetica-Bold') // Ensure this is bold for the final total
       .text(totalAmountFinal.toFixed(2), columnXPositions[7], totalYPosition);

   // Finalize the PDF document
   doc.end();
});

app.listen(PORT, () => {
   console.log(`App is listening on port ${PORT}`);
});
