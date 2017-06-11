
define([], function () {

    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (searchString, position) {
            position = position || 0;
            return this.indexOf(searchString, position) === position;
        };
    }

    if (!String.prototype.format) {
        String.prototype.format = function (args) {
            var result = this;
            if (arguments.length > 0) {
                if (arguments.length == 1 && typeof (args) == "object") {
                    for (var key in args) {
                        if (args[key] != undefined) {
                            var reg = new RegExp("({" + key + "})", "g");
                            result = result.replace(reg, args[key]);
                        }
                    }
                } else {
                    for (var i = 0; i < arguments.length; i++) {
                        if (arguments[i] != undefined) {
                            var reg = new RegExp("({)" + i + "(})", "g");
                            result = result.replace(reg, arguments[i]);
                        }
                    }
                }
            }
            return result;
        }
    }

    var dicom = {};
    
    function screenToImage(pt, imgTrans) {
        var x = pt.x,
			y = pt.y,
			imgPt = [0, 0, 1],
			scrennPt = [x, y, 1];

        var a = x,
			b = y,
			n1 = imgTrans[0][0],
			n2 = imgTrans[0][1],
			n3 = imgTrans[0][2],
			n4 = imgTrans[1][0],
			n5 = imgTrans[1][1],
			n6 = imgTrans[1][2];

        var t = a * n4 - n3 * n4 - b * n1 + n1 * n6;
        var t2 = n2 * n4 - n1 * n5;

        imgPt[1] = t / t2;

        t = b * n2 - n2 * n6 - a * n5 + n3 * n5;
        imgPt[0] = t / t2;

        return {
            x: imgPt[0],
            y: imgPt[1]
        };
    }
   
    function imageToScreen(pt, trans) {
        var x = pt.x,
			y = pt.y,
			imgPt = [x, y, 1],
			screenPt = [0, 0, 1];

        screenPt[0] = trans[0][0] * imgPt[0] + trans[0][1] * imgPt[1] + trans[0][2] * imgPt[2];
        screenPt[1] = trans[1][0] * imgPt[0] + trans[1][1] * imgPt[1] + trans[1][2] * imgPt[2];

        return {
            x: screenPt[0],
            y: screenPt[1]
        };
    }
    
    function countDistance(pt1, pt2) {
        var value = Math.pow((pt1.x - pt2.x), 2) + Math.pow((pt1.y - pt2.y), 2);
        value = Math.sqrt(value);

        return value;
    }

    var _dDelta = 0.0000000001;

    function getSineTheta(pt1, pt2) {
        var dDistance = countDistance(pt1, pt2);
        if (Math.abs(dDistance) < _dDelta) {
            return 0.0;
        } else {
            var dSineTheta = -(Math.abs(pt1.y - pt2.y)) / dDistance;
            if (pt1.y > pt2.y) {
                return dSineTheta;
            } else {
                return -dSineTheta;
            }
        }
    }
	
    // get the line cosine theta
    function getCosineTheta(pt1, pt2) {
        var dDistance = countDistance(pt1, pt2);
        if (Math.abs(dDistance) < _dDelta) {
            return 0.0;
        } else {
            var dCosineTheta = (Math.abs(pt1.x - pt2.x)) / dDistance;
            if (pt1.x < pt2.x) {
                return dCosineTheta;
            } else {
                return -dCosineTheta;
            }
        }
    }
    
    dicom.viewContext = {
        select: 1,
        pan: 2,
        wl: 3,
        create: 4
    };
    
    dicom.stepEnum = {
        step1: 1,
        step2: 2,
        step3: 3,
        step4: 4,
        step5: 5
    };

    //define colors
    dicom.colors = {
        white: '#ffffff',
        red: '#ff0000',
        yellow: '#ffff00'
    };

    /*********************************
     * the overlay definition
     */
    dicom.overlayPos = {
        topLeft1: 0,
        topLeft2: 1,
        topLeft3: 2,
        topLeft4: 3,
        topRight1: 4,
        topRight2: 5,
        topRight3: 6,
        topRight4: 7,
        bottomLeft1: 8,
        bottomLeft2: 9,
        bottomLeft3: 10,
        bottomLeft4: 11,
        bottomRight1: 12,
        bottomRight2: 13,
        bottomRight3: 14,
        bottomRight4: 15
    };

    function dicomTag(group, element, value) {
        this.group = group;
        this.element = element;
        this.value = value;
    }

    dicomTag.studyTime = { group: 0x0008, element: 0x0030 };
    dicomTag.studyDate = { group: 0x0008, element: 0x0020 };
    dicomTag.patientName = { group: 0x0010, element: 0x0010 };
    dicomTag.patientBirthDate = { group: 0x0010, element: 0x0030 };
    dicomTag.patientID = { group: 0x0010, element: 0x0020 };
    dicomTag.patientSex = { group: 0x0010, element: 0x0040 };
    dicomTag.viewPosition = { group: 0x0018, element: 0x5101 };
    dicomTag.bodyPart = { group: 0x0018, element: 0x0015 };
    dicomTag.windowWidth = { group: 0x0028, element: 0x1051 };
    dicomTag.windowCenter = { group: 0x0028, element: 0x1050 };
    dicomTag.customScale = { group: 0x1111, element: 0x0001 };

    //define event type
    dicom.eventType = {
        click: 1,
        mouseDown: 2,
        mouseMove: 3,
        mouseUp: 4,
        mouseOver: 5,
        mouseOut: 6,
        rightClick: 7,
        dblClick: 8,
        mouseWheel: 9
    };

	dicom.screenToImage = screenToImage;
	dicom.imageToScreen = imageToScreen;
	dicom.countDistance = countDistance;
	dicom.getSineTheta = getSineTheta;
	dicom.getCosineTheta = getCosineTheta;
	dicom.dicomTag = dicomTag;
	
    return dicom;
});