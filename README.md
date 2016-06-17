# pdf-diff

A simple tool in Node JS for comparing two PDF files and reporting whether any differences were detected.


## Usage

The baseline PDF documents should be in `/img-diff/baseline/`. The PDF documents to test should be in `/img-diff/test/`. Baseline and test PDFs must have the same filename.

The comparison images for any pages with differences will be saved to `/img-diff/output/`, each in the format `[pdfFilename]-[pageIndex].png`, i.e. `pdf1-0.png`.

```
> node pdf-diff/index.js
```

### Note

You will need to have `convert`, `gs`, and `pdfinfo` commands.

For OSX:

    brew install imagemagick ghostscript poppler
    
For Ubuntu:
    
    sudo apt-get install imagemagick ghostscript poppler-utils
    
