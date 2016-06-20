# pdf-diff

A simple tool in Node JS for visually comparing two PDF files and reporting whether any differences were detected.


## Usage

#### PDFDiff(outputDir, options)

| Name                     | Description
| ------------------------ | --------------------------------------------------------------------------------------------------
| outputDir                | The directory where snapshot images of differences will be written. Default is "output".
| options.imageDensity     | The pixel density of the images used for comparison. Default is 200.
| options.tempDir          | The temporary directory where page images used for comparison will be stored. Default is "tmp".
| options.overlays         | An array of overlays (each consisting of x0, y0, x1, y1 page coordinates). These will be rendered as black rectangles on each page, suppressing unintended diffs (i.e. for documents that render the template version number, etc).

#### Method: diff(file1, file2)

Compares two files and returns a Promise with the output of the comparison. 

#### Example
```
new PDFDiff(outputDir, options).diff("baseline/pdf1.pdf", "test/pdf1.pdf").then(function(output) {
  ...
});
```

#### Example Output

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
    
