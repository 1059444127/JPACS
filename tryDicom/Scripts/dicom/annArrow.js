/*********************************
* the annArrow class
*/

define(['dicomUtil', './annObject', 'jCanvaScript'], 
function (dicom, annObject, jc) {
	
	var colors = dicom.colors;
	
	var countDistance = dicom.countDistance;
	var imageToScreen = dicom.imageToScreen;
	var screenToImage = dicom.screenToImage;
	var getSineTheta = dicom.getSineTheta;
	var getCosineTheta = dicom.getCosineTheta;
	
    function annArrow(viewer, ptStart, ptEnd) {
        annObject.call(this);
        this.viewer = viewer;
        this.id = viewer._newObjectId();
        
        this.ptStart = ptStart;
        this.ptEnd = ptEnd;
    }

    annArrow.prototype = new annObject();

    //ptEnd points to the target, will with arrow
    annArrow.prototype.reDraw = function (ptStart, ptEnd, totalScale) {
        this.ptStart = ptStart;
        this.ptEnd = ptEnd;
        var dv = this.viewer;
        var scale = totalScale || dv.getScale();

        if (!this.line) {
            var idLine = this.id + '_line';
            jc.line([
					[ptStart.x, ptStart.y],
					[ptEnd.x, ptEnd.y]
            ]).id(idLine).layer(dv.imgLayerId).color(colors.white);
            this.line = jc('#' + idLine);
        } else {
            this.line.points([
				[ptStart.x, ptStart.y],
				[ptEnd.x, ptEnd.y]
            ]);
        }

        var sineTheta = getSineTheta(ptEnd, ptStart);
        var cosineTheta = getCosineTheta(ptEnd, ptStart);

        var dArrowLength = 10 / scale;

        var ptNodeA = {}, ptNodeB = {};
        ptNodeA.x = ptEnd.x + dArrowLength * cosineTheta - dArrowLength / 2.0 * sineTheta;
        ptNodeA.y = ptEnd.y + dArrowLength * sineTheta + dArrowLength / 2.0 * cosineTheta;

        ptNodeB.x = ptEnd.x + dArrowLength * cosineTheta + dArrowLength / 2.0 * sineTheta;
        ptNodeB.y = ptEnd.y + dArrowLength * sineTheta - dArrowLength / 2.0 * cosineTheta;

        if (!this.arrowLineA) {
            jc.line([
				[ptEnd.x, ptEnd.y],
				[ptNodeA.x, ptNodeA.y]
            ]).id(this.id + "_arrowA").layer(dv.imgLayerId).color(colors.white);
            this.arrowLineA = jc('#' + this.id + "_arrowA");
        } else {
            this.arrowLineA.points([
				[ptEnd.x, ptEnd.y],
				[ptNodeA.x, ptNodeA.y]
            ]);
        }

        if (!this.arrowLineB) {
            jc.line([
				[ptEnd.x, ptEnd.y],
				[ptNodeB.x, ptNodeB.y]
            ]).id(this.id + "_arrowB").layer(dv.imgLayerId).color(colors.white);
            this.arrowLineB = jc('#' + this.id + "_arrowB");
        } else {
            this.arrowLineB.points([
				[ptEnd.x, ptEnd.y],
				[ptNodeB.x, ptNodeB.y]
            ]);
        }

        var lineWidth = Math.round(1 / scale);
        if (lineWidth < 0.2) {
            lineWidth = 0.2;
        }

        this.line._lineWidth = lineWidth;
        this.arrowLineA._lineWidth = lineWidth;
        this.arrowLineB._lineWidth = lineWidth;
    }

    annArrow.prototype.onScale = function (totalScale) {
        this.reDraw(this.ptStart, this.ptEnd, totalScale);
    }

    annArrow.prototype.del = function () {
       	this._deleteChild();
        this.isCreated = false;
    }

    annArrow.prototype.select = function (select) {
		if(this.isInEdit === select){
			return;
		}
        this.isInEdit = select;
		this._selectChild(select);
    }

    return annArrow;
});