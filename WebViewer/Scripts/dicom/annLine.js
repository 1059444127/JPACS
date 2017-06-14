
/*********************************
 * the annLine class
 */

define(['dicomUtil', './annArrow', './annLabel', './annObject', 'jCanvaScript'], 
function (dicom, annArrow, annLabel, annObject, jc) {

	var stepEnum = dicom.stepEnum;
	var annType = annObject.annType;
	var colors = dicom.colors;
	var eventType = dicom.eventType;
	
	var countDistance = dicom.countDistance;
	var imageToScreen = dicom.imageToScreen;
	var screenToImage = dicom.screenToImage;
	var getSineTheta = dicom.getSineTheta;
	var getCosineTheta = dicom.getCosineTheta;
	
    function annLine() {
        annObject.call(this);
        this.type = annType.line;
    }

    annLine.prototype = new annObject();

    annLine.prototype.startCreate = function (viewer) {
        var dv = this.viewer = viewer;
        this.curStep = stepEnum.step1;
        dv.registerEvent(this, eventType.click);
    }

    annLine.prototype.onClick = function (arg) {
        var dv = this.viewer;

        if (this.isCreated) {
            return;
        }

        if (this.curStep == stepEnum.step1) {
            this.ptStart = {
                x: arg.x,
                y: arg.y
            };

            var radius = Math.round(5 / dv.getScale());
            if (radius < 1) {
                radius = 1;
            }

            var idCircleStart = this.id + '_c1';
            jc.circle(this.ptStart.x, this.ptStart.y, radius).id(idCircleStart).layer(dv.imgLayerId).color(colors.red);
            this.circleStart = jc('#' + idCircleStart);

            this.curStep = stepEnum.step2;
        } else if (this.curStep == stepEnum.step2) {
            this.ptEnd = {
                x: arg.x,
                y: arg.y
            };

            var idCircleEnd = this.id + '_c2';
            jc.circle(this.ptEnd.x, this.ptEnd.y, 5).id(idCircleEnd).layer(dv.imgLayerId).color(colors.red);
            this.circleEnd = jc('#' + idCircleEnd);

            var lineId = this.id + '_line';
            jc.line([
				[this.ptStart.x, this.ptStart.y],
				[this.ptEnd.x, this.ptEnd.y]
            ]).id(lineId).layer(dv.imgLayerId).color(colors.red);
            this.line = jc('#' + lineId);

            var idCircleM = this.id + '_cm';
            var ptMiddle = {};
            ptMiddle.x = (this.ptStart.x + this.ptEnd.x) / 2;
            ptMiddle.y = (this.ptStart.y + this.ptEnd.y) / 2;
            jc.circle(ptMiddle.x, ptMiddle.y, 5).id(idCircleM).layer(dv.imgLayerId).color(colors.red).opacity(0);
            this.circleMiddle = jc('#' + idCircleM);

            var lblPos = {
                x: ptMiddle.x,
                y: ptMiddle.y - 50
            };
            
            this.label = new annLabel(this.viewer, lblPos);
            this.label.parent = this;
            
            this.arrow = new annArrow(this.viewer);
            this.arrow.parent = this;

            this.reDraw();

            this.circleStart.mouseStyle = this.circleEnd.mouseStyle = this.circleMiddle.mouseStyle = 'crosshair';
            this._setChildMouseEvent(this.circleStart);
            this._setChildMouseEvent(this.circleEnd);
            this._setChildMouseEvent(this.circleMiddle);

            this.isCreated = true;
            dv._onObjectCreated(this);

            //unregister events
            dv.unRegisterEvent(this, eventType.click);
        }

        return;
    }

    annLine.prototype.del = function () {
        var dv = this.viewer;
        if (!this.isCreated) {
            //unregister events
            dv.unRegisterEvent(this, eventType.click);
        }

        if (this.circleStart) {
            this.circleStart.del();
            this.circleStart = undefined;
        }
        if (this.circleEnd) {
            this.circleEnd.del();
            this.circleEnd = undefined;
        }
        if (this.circleMiddle) {
            this.circleMiddle.del();
            this.circleMiddle = undefined;
        }
        if (this.label) {
            this.label.del();
            this.label = undefined;
        }
        if (this.arrow) {
            this.arrow.del();
            this.arrow = undefined;
        }
        if (this.line) {
            this.line.del();
            this.line = undefined;
        }

        this.isCreated = false;
    }

    annLine.prototype.select = function (select) {
        this.isInEdit = select;
        this.setDraggable(select);

        if (select) {
            this.line.color(colors.red);
            this.circleStart.color(colors.red).opacity(1);
            this.circleEnd.color(colors.red).opacity(1);
            this.circleMiddle.color(colors.red).opacity(0);

        } else {
            this.line.color(colors.white);
            this.circleStart.color(colors.white).opacity(0);
            this.circleEnd.color(colors.white).opacity(0);
            this.circleMiddle.color(colors.white).opacity(0);
        }
		
		if(this.arrow){
			this.arrow.select(select);
		}
        
        if(this.label){
        	this.label.select(select);
        }
    }

    annLine.prototype.setDraggable = function (draggable) {
        var aLine = this;

        var cs = aLine.circleStart;
        var ce = aLine.circleEnd;
        var cm = aLine.circleMiddle;

        this._setChildDraggable(cs, draggable, function (deltaX, deltaY) {
            aLine.ptStart = {
                x: cs._x,
                y: cs._y
            };
            aLine.reDraw();
        });

        this._setChildDraggable(ce, draggable, function (deltaX, deltaY) {
            aLine.ptEnd = {
                x: ce._x,
                y: ce._y
            };
            aLine.reDraw();
        });

        this._setChildDraggable(cm, draggable, function (deltaX, deltaY) {
            aLine._translateChild(cs, deltaX, deltaY);
            aLine._translateChild(ce, deltaX, deltaY);

            aLine.ptStart = {
                x: cs._x,
                y: cs._y
            };
            aLine.ptEnd = {
                x: ce._x,
                y: ce._y
            };

            aLine.reDraw();
            
        });
		
		this.label.setDraggable(draggable, function(deltaX, deltaY){
    		var scale = aLine.viewer.getScale();
        	aLine.arrow.reDraw(aLine.label.position, {x:aLine.circleMiddle._x, y:aLine.circleMiddle._y}, scale);
		});  
    }

    annLine.prototype.reDraw = function () {
        var dv = this.viewer;
        this.line.points([
			[this.ptStart.x, this.ptStart.y],
			[this.ptEnd.x, this.ptEnd.y]
        ]);

        var ptMiddle = {};
        ptMiddle.x = (this.ptStart.x + this.ptEnd.x) / 2;
        ptMiddle.y = (this.ptStart.y + this.ptEnd.y) / 2;
        this.circleMiddle._x = ptMiddle.x;
        this.circleMiddle._y = ptMiddle.y;

        var msg = "length: " + Math.round(countDistance(this.ptStart, this.ptEnd) * 100) / 100;
        this.label.string(msg);
		
		var scale = dv.getScale();	
        this.arrow.reDraw(this.label.position, ptMiddle, scale);
        this.onScale(scale);
    }

    annLine.prototype.onScale = function (totalScale) {
        var dv = this.viewer;
        var scale = totalScale || dv.getScale();

        //change circle radius
        var radius = Math.round(5 / scale);
        if (radius < 1) {
            radius = 1;
        }

        this.circleStart._radius = radius;
        this.circleMiddle._radius = radius;
        this.circleEnd._radius = radius;

        //change line size
        var lineWidth = Math.round(1 / scale);
        if (lineWidth < 0.2) {
            lineWidth = 0.2;
        }
        this.circleStart._lineWidth = lineWidth;
        this.circleMiddle._lineWidth = lineWidth;
        this.circleEnd._lineWidth = lineWidth;
        this.line._lineWidth = lineWidth;

        this.arrow.onScale(scale);
        this.label.onScale(scale);
    }
	
	annLine.prototype.onRotate = function(curAngle, totalAngle){
		this.label.onRotate(curAngle, totalAngle);
	}
	
	annLine.prototype.onTranslate = function(){
		this.label.onTranslate();
	}
	
    annLine.prototype.serialize = function () {
        var result = '{type:"{4}",ptStart:{x:{0},y:{1}},ptEnd:{x:{2},y:{3}}}';
        result = result.format(Math.round(this.ptStart.x), Math.round(this.ptStart.y), Math.round(this.ptEnd.x), Math.round(this.ptEnd.y),"annLine");

        return result;
    }

    annLine.prototype.deSerialize = function (jsonObj) {
        if (jsonObj) {
            this.startCreate(this.viewer);
            var ptStart = jsonObj.ptStart;
            this.onClick(ptStart);
            var ptEnd = jsonObj.ptEnd;
            this.onClick(ptEnd);
        }
    }

    return annLine;
});