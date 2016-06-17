var baselineDir = "baseline";
var tmpDir = "tmp";
var outputDir = "output";
var testDir = "test";

var PDFImage = require("pdf-image").PDFImage;
var BlinkDiff = require('blink-diff');
var _ = require('underscore');

var fs = require("fs");
var path = require("path");
var rmdir = require('rmdir');
var sizeOf = require('image-size');
var gm = require('gm').subClass({imageMagick: true});

var OUTCOME_DIFFERENT = "DIFFERENT";
var OUTCOME_SAME = "SAME";

var prepare = function() {
    return deleteDirectory(outputDir)
        .then(function() { return deleteDirectory(tmpDir); })
        .then(function() { return createDirectory(outputDir); })
        .then(function() { return createDirectory(tmpDir); })
        .then(function() { return createDirectory(tmpDir+"/"+baselineDir); })
        .then(function() { return createDirectory(tmpDir+"/"+testDir); });
};

var convertPDFsToImages = function() {
    var promises = [];
    fs.readdirSync(baselineDir).forEach(function(name) {
        promises.push(convertPDFToPageImages(baselineDir+"/"+name, tmpDir));
        promises.push(convertPDFToPageImages(testDir+"/"+name, tmpDir));
    });
    return Promise.all(promises);
};

var backFillMissingPages = function() {
    var baselineFiles = fs.readdirSync(tmpDir+"/"+baselineDir);
    var testFiles = fs.readdirSync(tmpDir+"/"+testDir);
    var missingFiles = _.difference(baselineFiles, testFiles);
    var promises = [];
    missingFiles.forEach(function(missingFile) {
        var fileToCreate = tmpDir+"/"+(_.contains(testFiles, missingFile) ? baselineDir : testDir)+"/"+missingFile;
        var dimensions = sizeOf(tmpDir+"/"+(_.contains(testFiles, missingFile) ? testDir : baselineDir)+"/"+missingFile);
        promises.push(createBlankImage(fileToCreate, dimensions));
    });
    return Promise.all(promises);
}

var comparePDFPageImages = function() {
    var promises = [];
    fs.readdirSync(tmpDir+"/"+baselineDir).forEach(function(file) {
        promises.push(compareImage(tmpDir+"/"+baselineDir+"/"+file, tmpDir+"/"+testDir+"/"+file, outputDir+"/"+file));
    });
    return Promise.all(promises);
};

var formatResults = function(results) {
    var unique = function(array) {
        return array.filter(function(item, pos) {
            return array.indexOf(item) == pos;
        });
    };
    var files = unique(results.map(function(result) {
        return result.file.substring(0, result.file.indexOf(".")).split("-")[0];
    }));
    var errorPages = function(file) {
        return results.filter(function(result) {
            return result.file.substring(0, result.file.indexOf(".")).split("-")[0] == file && result.outcome != OUTCOME_SAME;
        }).map(function(result) {
            return result.file.substring(0, result.file.indexOf(".")).split("-")[1];
        });
    };
    var result = {};
    for (var i = 0; i < files.length; i++) {
        var errors = errorPages(files[i]);
        result[files[i]] = {};
        result[files[i]].success = errors.length == 0;
        if (errors.length > 0) {
            result[files[i]].errorPages = errors;
        }
    }
    return result;
};

var cleanup = function() {
    return deleteDirectory(tmpDir);
};

var error = function(error) {
    console.log("ERROR: "+error);
};

return prepare()
    .then(convertPDFsToImages)
    .then(backFillMissingPages)
    .then(comparePDFPageImages)
    .then(formatResults)
    .then(console.log)
    .then(cleanup)
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
                    outcome: isDifferent ? OUTCOME_DIFFERENT : OUTCOME_SAME
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
        if (!fileExists(directory)) {
            fs.mkdirSync(directory);
        }
        resolve();
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

function createBlankImage(filename, dimensions) {
    return new Promise(function(resolve, reject) {
        gm(dimensions.height, dimensions.width, "#FFFFFF")
            .drawText(30, 20, "PAGE MISSING")
            .bitdepth(8)
            .write(filename, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
    });
}