
define(["dicom/annLine", "dicom/dicomViewer", "dicomUtil"], function (annLine, dicomViewer, dicom) {
describe("annLine", function () {
	var dv, dcmFile, theCanvas, aLine;
    var dicomTag = dicom.dicomTag;
    var overlayPos = dicom.overlayPos;
	var countDistance = dicom.countDistance,
		imageToScreen = dicom.imageToScreen,
		screenToImage = dicom.screenToImage;
		
	beforeAll(function(done){
		theCanvas = document.createElement('canvas');
		theCanvas.id     = "testCanvas";
		theCanvas.width  = 400;
		theCanvas.height = 400;
		theCanvas.style.visibility = "hidden";
		document.body.appendChild(theCanvas);
		
	    dcmFile = {};
	    dcmFile.dicomTags = JSON.parse('[{"group":16,"element":16,"value":"asdf^asdf^"},{"group":16,"element":32,"value":"PAT000001"},{"group":16,"element":64,"value":""},{"group":16,"element":48,"value":""},{"group":40,"element":4177,"value":"2696"},{"group":40,"element":4176,"value":"2048"},{"group":8,"element":48,"value":"123237"},{"group":8,"element":32,"value":"20170525"},{"group":24,"element":20737,"value":"AP"},{"group":24,"element":21,"value":"ELBOW"}]');
	    dcmFile.imgWidth =  2868;
	    dcmFile.imgHeight =  3460;
	    dcmFile.windowWidth = 2696;
	    dcmFile.windowCenter = 2048;
	    dcmFile.id = 1;
	    var imgUrl = './img/img1.jpg';
		dcmFile.imgUrl = imgUrl;
		
		dv = new dicomViewer('testCanvas');
		dv.load(dcmFile, function(){
			 var tagList = dcmFile.dicomTags;
	        //v1.setDicomTags(tagList);
	        dv.addOverlay(dicomTag.patientName, overlayPos.topLeft1);
	        dv.addOverlay(dicomTag.patientBirthDate, overlayPos.topLeft2, 'Birth');
	        dv.addOverlay(dicomTag.patientSex, overlayPos.topLeft3, 'Sex');
	        dv.addOverlay(dicomTag.patientID, overlayPos.topLeft4, 'ID');
	        dv.addOverlay(dicomTag.studyDate, overlayPos.topRight1, 'Date');
	        dv.addOverlay(dicomTag.studyTime, overlayPos.topRight2, 'Time');
	        dv.addOverlay(dicomTag.bodyPart, overlayPos.bottomLeft1);
	        dv.addOverlay(dicomTag.viewPosition, overlayPos.bottomLeft2);
	        dv.addOverlay(dicomTag.windowWidth, overlayPos.bottomLeft3, "W");
	        dv.addOverlay(dicomTag.windowCenter, overlayPos.bottomLeft4, "L");
	        dv.addOverlay(dicomTag.customScale, overlayPos.bottomRight3, "Scale");
			
			done();
		});
		
	}, 3000);
	
	afterAll(function(){
		theCanvas.parentElement.removeChild(theCanvas);
		delete dv;
	});
		
    it("can correctly be created", function() {
		aLine = new annLine();
		expect(aLine.type).toEqual(2);
		expect(aLine.isCreated).toBe(false);
		expect(aLine.isInEdit).toBe(false);
		
		dv.createAnnObject(aLine);
		expect(dv.curSelectObj).toEqual(aLine);
		expect(dv.curContext).toEqual(4);
		expect(dv.eventHandlers[dicom.eventType.click].length).toEqual(1);
		expect(dv.eventHandlers[dicom.eventType.click][0]).toEqual(aLine);
		
		var ptStart = {x:10,y:10}, ptEnd = {x:40, y:10};
		var trans = dv.imgLayer.transform();
		
		dv.onClick(imageToScreen(ptStart, trans));
		dv.onClick(imageToScreen(ptEnd, trans));
		
		expect(aLine.isCreated).toBe(true);
		expect(aLine.ptStart.x).toBeCloseTo(ptStart.x);
		expect(aLine.ptEnd.x).toBeCloseTo(ptEnd.x);
		expect(aLine.ptStart.y).toBeCloseTo(ptStart.y);
		expect(aLine.ptEnd.y).toBeCloseTo(ptEnd.y);
		
		expect(dv.annotationList.length).toEqual(1);
		expect(aLine.isInEdit).toBe(true);
    });

	it("unselect the line", function(){
		var arg = {event:{cancelBubble: false}};
		dv.onMouseDown(arg);
		
		expect(aLine.isInEdit).toBe(false);
		expect(dv.curSelectObj).toBe(undefined);
	});
	
});});