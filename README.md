# pdf-diff

A simple tool in Node JS for visually comparing two PDF files and reporting whether any differences were detected.


## Usage

```
new PDFDiff().diff("baseline/pdf1.pdf", "test/pdf1.pdf").then(function(output) {
  ...
});
```

Examples of the output are:

```
{ 
  "match": false, 
  "errors": [ 
    { 
      "page": 1, 
      "snapshot": "output/3832071895/pdf-0.png" 
    }, 
    { 
      "page": 2, 
      "snapshot": "output/3832071895/pdf-1.png" 
    } 
  ] 
}
```
```
{ 
  "match": true 
}
```


### Note

You will need to have `convert`, `gs`, and `pdfinfo` commands.

For OSX:

    brew install imagemagick ghostscript poppler
    
For Ubuntu:
    
    sudo apt-get install imagemagick ghostscript poppler-utils
    
