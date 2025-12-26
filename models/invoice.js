// models/Invoice.js

import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
    description: String,
    quantity: Number,
    rate: String,



    sgst: String,
    cgst: String
});

const invoiceSchema = new mongoose.Schema({
    companyName: { type: String, required: false }, // Keeping type as String
    address: { type: String, required: false }, // Keeping type as String
    phone: { type: String, required: false },
    invoicedate: { type: String, required: false },
    gstin: { type: String, required: false },
    items: [{
        type: itemSchema,
        required: false
    }],
    customerName: { type: String, required: false }, // Changed type to Number
    customerAddress: { type: String, required: false }, // Keeping type as String
    duedate: { type: String, required: false }, // Changed type to Number
    invoiceno: { type: String, required: false }, // Changed type to Number
    totalAmountFinal: { type: Number, required: false }, // Keeping type as Number
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;