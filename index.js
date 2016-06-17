var baselineDir = "baseline";
var tmpDir = "tmp";
var outputDir = "output";
var testDir = "test";

var PDFImage = require("pdf-image").PDFImage;
var BlinkDiff = require('blink-diff');

var fs = require("fs");
var path = require("path");
var rmdir = require('rmdir');


var prepare = function() {
    return deleteDirectory(outputDir)
        .then(function() { return createDirectory(outputDir); } )
        .then(function() { return createDirectory(tmpDir); } )
        .then(function() { return createDirectory(tmpDir+"/"+baselineDir); } )
        .then(function() { return createDirectory(tmpDir+"/"+testDir); } );
};

var convertPDFsToImages = function() {
    var promises = [];
    fs.readdirSync(baselineDir).forEach(function(name) {
        promises.push(convertPDFToPageImages(baselineDir+"/"+name, tmpDir));
        promises.push(convertPDFToPageImages(testDir+"/"+name, tmpDir));
    });
    return Promise.all(promises);
};

var comparePDFPageImages = function() {
    var promises = [];
    fs.readdirSync(tmpDir+"/"+baselineDir).forEach(function(file) {
        promises.push(compareImage(tmpDir+"/"+baselineDir+"/"+file, tmpDir+"/"+testDir+"/"+file, outputDir+"/"+file));
    });
    return Promise.all(promises);
};

var presentResults = function(results) {
    console.log(results); // TODO - enhance reporting
};

var cleanup = function() {
    return deleteDirectory(tmpDir);
};

var complete = function() {
    console.log("COMPLETE");
};

var error = function(error) {
    console.log("ERROR: "+error);
};

prepare()
    .then(convertPDFsToImages)
    .then(comparePDFPageImages)
    .then(presentResults)
    .then(cleanup)
    .then(complete)
    .catch(error);

function compareImage(image1, image2, outputImage) {
    var diff = new BlinkDiff({
        imageAPath: image1,
        imageBPath: image2,
        thresholdType: BlinkDiff.THRESHOLD_PERCENT,
        threshold: 0.00000001,
        imageOutputPath: outputImage
    });
    return new Promise(function(resolve, reject) {
        diff.run(function (error, result) {
            if (error) {
                reject(error);
            } else {
                var isDifferent = result.code === BlinkDiff.RESULT_DIFFERENT;
                if (!isDifferent) {
                    fs.unlink(outputImage);
                }
                resolve({
                    file: path.basename(image1),
                    isDifferent: isDifferent
                });
            }
        });
    });
}

function convertPDFToPageImages(pdfFile, outputDir) {
    var outputDirectory = outputDir+"/"+path.dirname(pdfFile)+"/";
    var pdf = new PDFImage(pdfFile, { outputDirectory : outputDirectory });
    return pdf.numberOfPages().then(function(numberOfPages) {
        var promises = [];
        for (var i = 0; i < numberOfPages; i++) {
            promises.push(pdf.convertPage(i));
        }
        return Promise.all(promises);
    });
}

function deleteDirectory(directory) {
    return new Promise(function (resolve, reject) {
        rmdir(directory, function (error, dirs, files) {
            resolve();
        });
    });
}

function createDirectory(directory) {
    return new Promise(function (resolve, reject) {
        try {
            fs.statSync(directory);
        } catch(e) {
            fs.mkdirSync(directory);
        }
        resolve();
    });
}