
window.onload = function () {
    var serializedString = undefined;

    var baseUrl = window.location.origin;
    if (!window.location.pathname.startsWith('/Image')) {
        baseUrl += '/' + location.pathname.split('/')[1];
    }
    //var imgDataUrl = baseUrl + "/Image/GetDicomPixel/1";
    var imgDataUrl = baseUrl + "/Image/GetJPGImageData/1";
    dcmFile.imgDataUrl = imgDataUrl;

    //var v1 = new dicomViewer('c1', true);
    var v1 = new dicomViewer('c1');
    v1.load(dcmFile, function () {
        console.log('success load image!');

        var tagList = dcmFile.dicomTags;
        //v1.setDicomTags(tagList);
        v1.addOverlay(dicomTag.patientName, overlayPos.topLeft1);
        v1.addOverlay(dicomTag.patientBirthDate, overlayPos.topLeft2, 'Birth');
        v1.addOverlay(dicomTag.patientSex, overlayPos.topLeft3, 'Sex');
        v1.addOverlay(dicomTag.patientID, overlayPos.topLeft4, 'ID');
        v1.addOverlay(dicomTag.studyDate, overlayPos.topRight1, 'Date');
        v1.addOverlay(dicomTag.studyTime, overlayPos.topRight2, 'Time');
        v1.addOverlay(dicomTag.bodyPart, overlayPos.bottomLeft1);
        v1.addOverlay(dicomTag.viewPosition, overlayPos.bottomLeft2);
        v1.addOverlay(dicomTag.windowWidth, overlayPos.bottomLeft3, "W");
        v1.addOverlay(dicomTag.windowCenter, overlayPos.bottomLeft4, "L");
        v1.addOverlay(dicomTag.customScale, overlayPos.bottomRight1, "Scale");
    });

    var curViewer = v1;
    var curWindowCenter = v1.windowCenter;
    var curWindowWidth = v1.windowWidth;

    $('#c1').on('click', function () {
        $('#c1').addClass('selected');
        curViewer = v1;
    });

    $('#btnAddLine').on('click', function () {
        var aLine = curViewer.createLine();
    });

    $('#btnAddRect').on('click', function () {
        var aRect = curViewer.createRect();
    });

    $('#btnSelect').on('click', function () {
        curViewer.setSelectModel();
    });

    $('#btnPan').on('click', function () {
        curViewer.setPanModel();
    });

    $('#btnRotate').on('click', function () {
        curViewer.rotate(30);
    });

    $('#btnReset').on('click', function () {
        curViewer.reset();
    });

    $('#btnDelete').on('click', function () {
        var curObj = curViewer.curSelectObj;
        if (curObj) {
            curViewer.deleteObject(curObj);
        }
    });

    $('#btnSave').on('click', function () {
        serializedString = curViewer.serialize();
        alert(serializedString);
    });

    $('#btnLoad').on('click', function () {
        if (serializedString) {
            curViewer.deSerialize(serializedString);
        }
    });

    $('#btnBestFit').on('click', function () {
        curViewer.bestFit();
    });

    function adjustWL(width, center, callback) {
        v1.adjustWL(width, center, function () {
            if (callback) {
                callback();
            }
        });
    }

    $('#btnWA').on('click', function () {
        curWindowWidth += 100;
        adjustWL(curWindowWidth, curWindowCenter, function () {
            //alert('btnW add callback');
        });
    });
    $('#btnWM').on('click', function () {
        curWindowWidth -= 100;
        adjustWL(curWindowWidth, curWindowCenter);
    });
    $('#btnLM').on('click', function () {
        curWindowCenter -= 100;
        adjustWL(curWindowWidth, curWindowCenter);
    });
    $('#btnLA').on('click', function () {
        curWindowCenter += 100;
        adjustWL(curWindowWidth, curWindowCenter);
    });
}