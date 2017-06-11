
require.config({
    baseUrl: "./Scripts",
    paths: {
        "jquery": "lib/jquery",
        "jCanvaScript": "lib/jCanvaScript",
        "dicomViewer": "dicom/dicomViewer",
        "dicomUtil": "dicom/dicomUtil"
    }
});

require(['jquery','dicomViewer', 'dicomUtil'], function($, dicomViewer, dicom){
    
    var dicomTag = dicom.dicomTag;
    var overlayPos = dicom.overlayPos;
    
    var dcmFile = {};
    dcmFile.dicomTags = JSON.parse('[{"group":16,"element":16,"value":"asdf^asdf^"},{"group":16,"element":32,"value":"PAT000001"},{"group":16,"element":64,"value":""},{"group":16,"element":48,"value":""},{"group":40,"element":4177,"value":"2696"},{"group":40,"element":4176,"value":"2048"},{"group":8,"element":48,"value":"123237"},{"group":8,"element":32,"value":"20170525"},{"group":24,"element":20737,"value":"AP"},{"group":24,"element":21,"value":"ELBOW"}]');
    dcmFile.imgWidth =  2868;
    dcmFile.imgHeight =  3460;
    dcmFile.windowWidth = 2696;
    dcmFile.windowCenter = 2048;
    dcmFile.id = 1;
	
	var imgDataUrl = 'http://localhost/jpacs' + "/Image/GetJPGImageData/{0}".format(dcmFile.id);
	dcmFile.imgDataUrl = imgDataUrl;
	
    if (!window.location.origin) {
        window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
    }
    var baseUrl = window.location.origin;
    if (!window.location.pathname.startsWith('/Image')) {
        baseUrl += '/' + location.pathname.split('/')[1];
    }

    var v1 = new dicomViewer('c1');
    v1.cursorUrl = baseUrl + "/img";

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
    
    var v2 = new dicomViewer('c2');
    v2.cursorUrl = baseUrl + "/img";
	v2.load(dcmFile, function () {
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
    
	$('#c1').on('click', function(){
		$('#c1').addClass('selected');
		$('#c2').removeClass('selected');
		
		curViewer = v1;
	});
	
	$('#c2').on('click', function(){
		$('#c2').addClass('selected');
		$('#c1').removeClass('selected');
		
		curViewer = v2;
	})
				
    var curViewer = v1;
    var curWindowCenter = v1.windowCenter;
    var curWindowWidth = v1.windowWidth;

    $('#c1').on('click', function () {
        $('#c1').addClass('selected');
        curViewer = v1;
    });

    $('#btnAddLine').on('click', function () {
    	require(['dicom/annLine'], function(annLine){
    		var aLine = new annLine();
    		curViewer.createAnnObject(aLine);
    	});
        //var aLine = curViewer.createLine();
    });

    $('#btnAddRect').on('click', function () {
    	require(['dicom/annRect'], function(annRect){
    		var aRect = new annRect();
    		curViewer.createAnnObject(aRect);
    	});
        //var aRect = curViewer.createRect();
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

    $('#btnWL').on('click', function () {
        curViewer.setWLModel();
    });

    $('#btnReset').on('click', function () {
        curViewer.reset();
    });

    $('#btnDelete').on('click', function () {
        curViewer.deleteCurObject();
    });

    $('#btnSave').on('click', function () {
        //serializedString = curViewer.serialize();
        //alert(serializedString);
        var dicomFile = curViewer.save();

        var saveImgUrl = baseUrl + "/Image/SaveDicomImage/{0}".format(dicomFile.id);

        $.ajax({
            type: "POST",
            url: saveImgUrl,
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(dicomFile),
            dataType: "json",
            success: function (message) {
                if (message && message.result) {
                    alert('success save data!');
                    return;
                }
                alert('failed to save data due to' + message.reason);
            },
            error: function (message) {
                alert('failed to save data!!');
            }
        });
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
});

