
window.onload = function () {
    var serializedString = undefined;

    //var tag = new dicomTag(1001, 2101, 'Jack Hock');
    var tagList = imgInfo.dicomTags;
    //tagList.push(tag);

    var v1 = new dicomViewer();
    v1.initialize('c1', imgInfo.ImageUrl, function () {
        v1.setDicomTags(tagList);

        v1.addOverlay(0x10, 0x10, overlayPos.topLeft1);
        v1.addOverlay(0x10, 0x30, overlayPos.topLeft2, 'birth:');
        v1.addOverlay(1001, 2101, overlayPos.topLeft3, 'topLeft3');
        v1.addOverlay(1001, 2101, overlayPos.topRight1, 'topRight1');
        v1.addOverlay(1001, 2101, overlayPos.topRight2, 'topRight2');
        v1.addOverlay(1001, 2101, overlayPos.topRight3, 'topRight3');
        v1.addOverlay(1001, 2101, overlayPos.bottomLeft1, 'bottomLeft1');
        v1.addOverlay(1001, 2101, overlayPos.bottomLeft2, 'bottomLeft2');
        v1.addOverlay(1001, 2101, overlayPos.bottomLeft3, 'bottomLeft3');
        v1.addOverlay(1001, 2101, overlayPos.bottomRight1, 'bottomRight1');
        v1.addOverlay(1001, 2101, overlayPos.bottomRight2, 'bottomRight2');
        v1.addOverlay(1001, 2101, overlayPos.bottomRight3, 'bottomRight3');
    });

    //var v2 = new dicomViewer();
    //v2.initialize('c2', 'img/img2.jpg', function () {
    //    v2.addOverlay(1001, 2101, overlayPos.topLeft1, 'topLeft');
    //    v2.addOverlay(1001, 2101, overlayPos.topLeft2, 'topLeft2');
    //    v2.addOverlay(1001, 2101, overlayPos.topLeft3, 'topLeft3');
    //    v2.addOverlay(1001, 2101, overlayPos.topRight1, 'topRight1');
    //    v2.addOverlay(1001, 2101, overlayPos.topRight2, 'topRight2');
    //    v2.addOverlay(1001, 2101, overlayPos.topRight3, 'topRight3');
    //});

    var curViewer = v1;
    $('#c1').on('click', function () {
        $('#c1').addClass('selected');
       // $('#c2').removeClass('selected');

        curViewer = v1;
    });

    //$('#c2').on('click', function () {
    //    $('#c2').addClass('selected');
    //    $('#c1').removeClass('selected');

    //    curViewer = v2;
    //})

    $('#btnAddLine').on('click', function () {
        var aLine = curViewer.createLine();
    });

    $('#btnAddRect').on('click', function () {
        var aRect = curViewer.createRect();
    });

    $('#btnSelect').on('click', function () {
        curViewer.setContext(viewContext.select);
    });

    $('#btnPan').on('click', function () {
        curViewer.setContext(viewContext.pan);
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

    $('#btnWL').on('click', function () {
        imgInfo.windowCenter -= 50;
        imgInfo.windowWidth -= 50;
        
        var baseUrl = window.location.origin;
        if (!window.location.pathname.startsWith('/Image')) {
            baseUrl += '/' + location.pathname.split('/')[1];
        }
        var adjustWLUrl = baseUrl + "/Image/AdjustWL";
        //alert(adjustWLUrl);

        var value = {};
        value.windowCenter = imgInfo.windowCenter;
        value.windowWidth = imgInfo.windowWidth;

        $.ajax({
            type: "POST",
            url: adjustWLUrl,
            data: JSON.stringify(value),
            dataType: "json",
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                //alert(data.imgSrc);
                v1.reloadImage(data.imgSrc);
            },
            error: function (data) {
                alert("Error occured!!" + data.imgSrc);
            }
        });
    });
}