var PDFImage = require("pdf-image").PDFImage;
var BlinkDiff = require('blink-diff');
var _ = require('underscore');
var fs = require("fs");
var path = require("path");
var sizeOf = require('image-size');
var gm = require('gm').subClass({imageMagick: true});

function PDFDiff(outputDir, options) {
    if (!outputDir) outputDir = "output";
    if (!options) options = {};
    this._imageDensity = options.imageDensity || 200;
    this._overlays = options.overlays || [];
    this._tempDir = (options.tempDir || "tmp");
    this._outputDir = outputDir;
}

PDFDiff.prototype = {

    diff: function(pdf1, pdf2) {

        if (pdf1 == pdf2) throw new Error("PDFs must be different");

        var self = this;

        var imageFolder = function(pdf) { return self._tempDir+"/"+path.dirname(pdf)+"/"+path.basename(pdf, path.extname(pdf)) };

        var prepare = function(pdf) {
            return new Promise(function(resolve) {
                var tmpPDF = imageFolder(pdf)+"/pdf.pdf";
                createDirectory(imageFolder(pdf));
                copyFile(pdf, tmpPDF);
                resolve(tmpPDF);
            });
        };

        var convertPDFToImages = function(pdf) {
            return self._convertPDFToPageImages(pdf, self._imageDensity);
        };

        var processImageOverlays = function(images) {
            return Promise.all(images.map(function(image) {
                return Promise.all(self._overlays.map(function(overlay) {
                    return self._drawRectangleOnImage(image, overlay);
                }));
            }));
        };

        var fillMissingPages = function() {
            var pdf1Images = readFiles(imageFolder(pdf1));
            var pdf2Images = readFiles(imageFolder(pdf2));
            return Promise.all(_.difference(pdf1Images, pdf2Images).map(function(missingImage) {
                var imageToCreate = imageFolder(_.contains(pdf1Images, missingImage) ? pdf2 : pdf1)+"/"+missingImage;
                var dimensions = sizeOf(imageFolder(_.contains(pdf1Images, missingImage) ? pdf1 : pdf2)+"/"+missingImage);
                return self._createBlankImage(imageToCreate, dimensions);
            }));
        };

        var comparePDFPageImages = function() {
            var onlyPNGFiles = function(file) { return path.extname(file) == ".png"; };
            var random = Math.floor(Math.random() * (9999999999-1000000000)) + 1000000000 + 1;
            createDirectory(self._outputDir+"/"+random);
            return Promise.all(readFiles(imageFolder(pdf1)).filter(onlyPNGFiles).map(function(image) {
                return self._compareImage(imageFolder(pdf1)+"/"+image, imageFolder(pdf2)+"/"+image, self._outputDir+"/"+random+"/"+image);
            }));
        };

        var processPDFs = function() {
            var promises = [];
            [ pdf1, pdf2 ].forEach(function(pdf) {
                promises.push(prepare(pdf).then(convertPDFToImages).then(processImageOverlays));
            });
            return Promise.all(promises);
        };

        var prepareResults = function(results) {
            var errors = results.filter(function(result) { return !result.match; });
            var toError = function(error) {
                return {
                    page: parseInt(error.image.substring(0, error.image.indexOf(".")).split("-")[1])+1,
                    snapshot: error.image
                };
            };
            var result = {
                match: errors.length == 0
            };
            if (errors.length > 0) {
                result.errors = results.map(toError);
            }
            console.log(JSON.stringify(result));
            return result;
        };

        return this._clean()
            .then(processPDFs)
            .then(fillMissingPages)
            .then(comparePDFPageImages)
            .then(prepareResults)
            .catch(console.log);
    },

    _clean: function() {
        var self = this;
        return deleteDirectory(this._outputDir)
            .then(function() { return deleteDirectory(self._tempDir); })
            .then(function() { return createDirectory(self._outputDir); })
            .then(function() { return createDirectory(self._tempDir); });
    },

    _createBlankImage: function(image, dimensions) {
        return new Promise(function(resolve, reject) {
            console.log("Creating blank page for "+image);
            gm(dimensions.height, dimensions.width, "#FFFFFF")
                .drawText(30, 20, "PAGE MISSING")
                .bitdepth(8)
                .write(image, function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
        });
    },

    _drawRectangleOnImage: function(image, rectangle) {
        return new Promise(function(resolve, reject) {
            gm(image).fill("#000000").drawRectangle(rectangle.x0, rectangle.y0, rectangle.x1, rectangle.y1).write(image, function (error) {
                console.log("Adding overlay to "+image);
                error ? reject(error) : resolve();
            });
        });
    },

    _convertPDFToPageImages: function(pdf, imageDensity) {
        var pdfImage = new PDFImage(pdf, { outputDirectory: path.dirname(pdf), convertOptions: { "-quality": "100", "-density": imageDensity } } );
        return pdfImage.numberOfPages().then(function(numberOfPages) {
            var promises = [];
            for (var i = 0; i < numberOfPages; i++) {
                console.log("Converting "+pdf+" Page "+(i+1)+" to "+path.dirname(pdf)+"/"+path.basename(pdf, path.extname(pdf))+"-"+i+".png");
                promises.push(pdfImage.convertPage(i));
            }
            return Promise.all(promises);
        });
    },

    _compareImage: function(image1, image2, outputImage) {
        var diff = new BlinkDiff({
            imageAPath: image1,
            imageBPath: image2,
            thresholdType: BlinkDiff.THRESHOLD_PERCENT,
            threshold: 0.00000001,
            imageOutputPath: outputImage
        });
        return new Promise(function (resolve, reject) {
            console.log("Comparing "+image1+" with "+image2);
            diff.run(function (error, result) {
                if (error) {
                    reject(error);
                } else {
                    var isDifferent = result.code === BlinkDiff.RESULT_DIFFERENT;
                    if (!isDifferent) {
                        fs.unlink(outputImage);
                    }
                    resolve({
                        image: outputImage,
                        match: !isDifferent
                    });
                }
            });
        });
    }

};

function createDirectory(directory) {
    console.log("Creating "+directory);
    var endsWith = function(string, suffix) { return string.match(suffix+"$") == suffix; };
    if (!endsWith(directory, "/")) directory = directory + "/";
    var dirs = directory.split('/');
    var prevDir = dirs.splice(0,1)+"/";
    while (dirs.length > 0) {
        var curDir = prevDir + dirs.splice(0,1);
        if (!fileExists(curDir)) {
            fs.mkdirSync(curDir);
        }
        prevDir = curDir + '/';
    }
}

function readFiles(directory) {
    return fs.readdirSync(directory);
}

function copyFile(file, newFile) {
    console.log("Copying "+file+" to "+newFile);
    fs.writeFileSync(newFile, fs.readFileSync(file));
}

function deleteDirectory(directory) {
    return new Promise(function(resolve) {
        console.log("Deleting "+directory);
        fs.unlink(directory, resolve);
    });
}

function fileExists(file) {
    try {
        fs.statSync(file);
        return true;
    } catch(e) {
        return false;
    }
}

module.exports = PDFDiff;