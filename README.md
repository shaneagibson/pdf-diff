# pdf-diff

A simple tool in Node JS for comparing two PDF files and reporting whether any differences were detected.


## Usage

```
new PDFDiff("output").diff("baseline/pdf1.pdf", "test/pdf1.pdf");
```

Examples of the output are:

```
{"pdf1":"baseline/pdf2.pdf","pdf2":"test/pdf2.pdf","success":false,"errors":[{"page":1,"snapshot":"output/3832071895/pdf-0.png"},{"page":2,"snapshot":"output/3832071895/pdf-1.png"}]}
```
```
{"pdf1":"baseline/pdf1.pdf","pdf2":"test/pdf1.pdf","success":true}
```


### Note

You will need to have `convert`, `gs`, and `pdfinfo` commands.

For OSX:

    brew install imagemagick ghostscript poppler
    
For Ubuntu:
    
    sudo apt-get install imagemagick ghostscript poppler-utils
    