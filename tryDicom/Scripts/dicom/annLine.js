
/*********************************
 * the annLine class
 */

define(['dicomUtil', './annArrow', './annObject', 'jCanvaScript'], 
function (dicom, annArrow, annObject, jc) {

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
        var dv = this.parent = viewer;
        this.curStep = stepEnum.step1;
        dv.registerEvent(this, eventType.click);
    }

    annLine.prototype.onClick = function (arg) {
        var dv = this.parent;

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
            jc.circle(this.ptStart.x, this.ptStart.y, radius).id(idCircleStart).layer(dv.imgLayerId).color(colors.white);
            this.circleStart = jc('#' + idCircleStart);

            this.curStep = stepEnum.step2;
        } else if (this.curStep == stepEnum.step2) {
            this.ptEnd = {
                x: arg.x,
                y: arg.y
            };

            var idCircleEnd = this.id + '_c2';
            jc.circle(this.ptEnd.x, this.ptEnd.y, 5).id(idCircleEnd).layer(dv.imgLayerId).color(colors.white);
            this.circleEnd = jc('#' + idCircleEnd);

            var lineId = this.id + '_line';
            jc.line([
				[this.ptStart.x, this.ptStart.y],
				[this.ptEnd.x, this.ptEnd.y]
            ]).id(lineId).layer(dv.imgLayerId).color(colors.white);
            this.line = jc('#' + lineId);

            var idCircleM = this.id + '_cm';
            var ptMiddle = {};
            ptMiddle.x = (this.ptStart.x + this.ptEnd.x) / 2;
            ptMiddle.y = (this.ptStart.y + this.ptEnd.y) / 2;
            jc.circle(ptMiddle.x, ptMiddle.y, 5).id(idCircleM).layer(dv.imgLayerId).color(colors.white).opacity(0);
            this.circleMiddle = jc('#' + idCircleM);

            var idLbl = this.id + '_lbl';
            var lblPos = {
                x: ptMiddle.x,
                y: ptMiddle.y - 30
            };
            jc.text('', lblPos.x, lblPos.y).id(idLbl).layer(dv.imgLayerId).color(colors.white).font('15px Times New Roman');
            this.label = jc('#' + idLbl);

            this.arrow = new annArrow(this.parent);

            this.reDraw();

            this.circleStart.mouseStyle = this.circleEnd.mouseStyle = this.circleMiddle.mouseStyle = 'crosshair';
            this._setChildMouseEvent(this.circleStart);
            this._setChildMouseEvent(this.circleEnd);
            this._setChildMouseEvent(this.circleMiddle);
            this._setChildMouseEvent(this.label);

            this.isCreated = true;
            dv._onObjectCreated(this);

            //unregister events
            dv.unRegisterEvent(this, eventType.click);
        }

        return;
    }

    annLine.prototype.del = function () {
        var dv = this.parent;
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

    annLine.prototype.setEdit = function (edit) {
        this.isInEdit = edit;
        this.setDraggable(edit);

        if (edit) {
            this.line.color(colors.red);
            this.label.color(colors.red);
            this.circleStart.color(colors.red).opacity(1);
            this.circleEnd.color(colors.red).opacity(1);
            this.circleMiddle.color(colors.red).opacity(0);

        } else {
            this.line.color(colors.white);
            this.label.color(colors.white);
            this.circleStart.color(colors.white).opacity(0);
            this.circleEnd.color(colors.white).opacity(0);
            this.circleMiddle.color(colors.white).opacity(0);
        }

        this.arrow.setEdit(edit);
    }

    annLine.prototype.setDraggable = function (draggable) {
        var aLine = this;

        var cs = aLine.circleStart;
        var ce = aLine.circleEnd;
        var cm = aLine.circleMiddle;
        var lbl = aLine.label;

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

        this._setChildDraggable(lbl, draggable, function (deltaX, deltaY) {
            aLine.reDraw();
        });
    }

    annLine.prototype.reDraw = function () {
        var dv = this.parent;
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

        this.arrow.reDraw({ x: this.label._x, y: this.label._y }, ptMiddle);

        this.onScale();
    }

    annLine.prototype.onScale = function () {
        var dv = this.parent;
        var scale = dv.getScale();

        //change label font size
        var fontSize = Math.round(15 / scale);
        if (fontSize < 10) {
            fontSize = 10;
        }

        var font = "{0}px Times New Roman".format(fontSize);
        this.label.font(font);

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

        this.arrow.onScale();
    }

    annLine.prototype.serialize = function () {
        var result = "{type: {4},ptStart:{x:{0},y:{1}},ptEnd:{x:{2},y:{3}}}";
        result = result.format(Math.round(this.ptStart.x), Math.round(this.ptStart.y), Math.round(this.ptEnd.x), Math.round(this.ptEnd.y), this.type);

        return result;
    }

    annLine.prototype.deSerialize = function (jsonObj) {
        if (jsonObj) {
            this.startCreate();
            var ptStart = jsonObj.ptStart;
            this.onClick(ptStart);
            var ptEnd = jsonObj.ptEnd;
            this.onClick(ptEnd);
        }
    }

    return annLine;
});