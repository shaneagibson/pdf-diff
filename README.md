# pdf-diff

A simple tool in Node JS for comparing two PDF files and reporting whether any differences were detected.


## Usage

The baseline PDF documents should be in `/img-diff/baseline/`. The PDF documents to test should be in `/img-diff/test/`. Baseline and test PDFs must have the same filename.

The comparison images for any pages with differences will be saved to `/img-diff/output/`, each in the format `[pdfFilename]-[pageIndex].png`, i.e. `pdf1-0.png`.

```
> node pdf-diff/index.js
```

An example of the output is:

```
[ { pdf: 'pdf1.pdf', page: '0', outcome: 'SAME' },
  { pdf: 'pdf1.pdf', page: '1', outcome: 'SAME' },
  { pdf: 'pdf2.pdf', page: '0', outcome: 'DIFFERENT' },
  { pdf: 'pdf2.pdf', page: '1', outcome: 'DIFFERENT' } ]
```

### Note

You will need to have `convert`, `gs`, and `pdfinfo` commands.

For OSX:

    brew install imagemagick ghostscript poppler
    
For Ubuntu:
    
    sudo apt-get install imagemagick ghostscript poppler-utils
    
