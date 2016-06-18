var PDFDiff = require('./index.js');

var pdfDiff = new PDFDiff("output");

pdfDiff.diff("baseline/pdf1.pdf", "test/pdf1.pdf");
pdfDiff.diff("baseline/pdf2.pdf", "test/pdf2.pdf");
pdfDiff.diff("baseline/pdf3.pdf", "test/pdf3.pdf");