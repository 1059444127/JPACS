
window.onload = function () {
    var serializedString = undefined;

    //var tag = new dicomTag(1001, 2101, 'Jack Hock');
    var tagList = imgInfo.dicomTags;
    //tagList.push(tag);

    var v1 = new dicomViewer();
    v1.initialize('c1', imgInfo.ImageUrl, function () {
        v1.setDicomTags(tagList);

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

    function adjustWL(width, center) {
        var baseUrl = window.location.origin;
        if (!window.location.pathname.startsWith('/Image')) {
            baseUrl += '/' + location.pathname.split('/')[1];
        }
        var adjustWLUrl = baseUrl + "/Image/AdjustWL";
        //alert(adjustWLUrl);

        var value = {};
        value.windowCenter = center;
        value.windowWidth = width;

        $.ajax({
            type: "POST",
            url: adjustWLUrl,
            data: JSON.stringify(value),
            dataType: "json",
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                //alert(data.imgSrc);
                v1.reloadImage(data.imgSrc, function () {
                    imgInfo.windowCenter = value.windowCenter;
                    imgInfo.windowWidth = value.windowWidth;

                    v1.updateTag(dicomTag.windowCenter, imgInfo.windowCenter);
                    v1.updateTag(dicomTag.windowWidth, imgInfo.windowWidth);
                });
            },
            error: function (data) {
                alert("Error occured!!" + data.imgSrc);
            }
        });
    }

    $('#btnWA').on('click', function () {
        var center = imgInfo.windowCenter,
            width = imgInfo.windowWidth;

        width += 50;
        adjustWL(width, center);
    });
    $('#btnWM').on('click', function () {
        var center = imgInfo.windowCenter,
            width = imgInfo.windowWidth;

        width -= 50;
        adjustWL(width, center);
    });
    $('#btnLM').on('click', function () {
        var center = imgInfo.windowCenter,
            width = imgInfo.windowWidth;

        center -= 50;
        adjustWL(width, center);
    });
    $('#btnLA').on('click', function () {
        var center = imgInfo.windowCenter,
            width = imgInfo.windowWidth;

        center += 50;
        adjustWL(width, center);
    });
}