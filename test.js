var PDFDiff = require('./index.js');

var options = {
    imageDensity: 200,
    overlays: [{
        x0: 1580,
        x1: 1600,
        y0: 1400,
        y1: 1560
    }],
    tempDir: "tmp"
};

var pdfDiff = new PDFDiff("output", options);

pdfDiff.diff("baseline/pdf1.pdf", "test/pdf1.pdf");
pdfDiff.diff("baseline/pdf2.pdf", "test/pdf2.pdf");
pdfDiff.diff("baseline/pdf3.pdf", "test/pdf3.pdf");