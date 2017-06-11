/*********************************
* the annRect class
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
	
    function annRect() {
        annObject.call(this);
        this.type = annType.rect;
    }

    annRect.prototype = new annObject();
    
    annRect.prototype.startCreate = function (viewer) {
        this.curStep = stepEnum.step1;
        var dv = this.parent = viewer;

        dv.registerEvent(this, eventType.mouseDown);
        dv.registerEvent(this, eventType.mouseMove);
        dv.registerEvent(this, eventType.mouseUp);
    }
    
    annRect.prototype.onMouseDown = function (arg) {
        if (this.curStep == stepEnum.step1) {
            this.ptStart = {
                x: arg.x,
                y: arg.y
            };
            this.curStep = stepEnum.step2;
        }
    }

    annRect.prototype.onMouseMove = function (arg) {
        var dv = this.parent;
        if (this.curStep == stepEnum.step2) {
            this.width = Math.abs(arg.x - this.ptStart.x);
            this.height = Math.abs(arg.y - this.ptStart.y);

            //create rect if not created
            if (!this.rect) {
                var rectId = dv._newObjectId();
                jc.rect(this.ptStart.x, this.ptStart.y, this.width, this.height).layer(dv.imgLayerId).id(rectId).color(colors.white);
                this.rect = jc('#' + rectId);

                this._setChildMouseEvent(this.rect);
            }

            this.rect._width = this.width;
            this.rect._height = this.height;

            if (!this.circleA) {
                var idCircleA = this.id + "_aCircle";
                jc.circle(this.ptStart.x, this.ptStart.y, 5).id(idCircleA).layer(dv.imgLayerId).color(colors.white);
                this.circleA = jc("#" + idCircleA);

                this.circleA.mouseStyle = 'crosshair';
                this._setChildMouseEvent(this.circleA);
            }

            if (!this.label) {
                var idLbl = this.id + "_lbl";
                var lblPos = {
                    x: this.ptStart.x + 5,
                    y: this.ptStart.y - 30
                };
                jc.text('', lblPos.x, lblPos.y).id(idLbl).layer(dv.imgLayerId).color(colors.white).font('15px Times New Roman');
                this.label = jc('#' + idLbl);

                this._setChildMouseEvent(this.label);
            }

            if (!this.arrow) {
                this.arrow = new annArrow(dv);
            }

            this.reDraw();
        }
    }

    annRect.prototype.onMouseUp = function (arg) {
        var dv = this.parent;
        if (this.curStep == stepEnum.step2) {

            this.isCreated = true;
            dv._onObjectCreated(this);

            dv.unRegisterEvent(this, eventType.mouseDown);
            dv.unRegisterEvent(this, eventType.mouseMove);
            dv.unRegisterEvent(this, eventType.mouseUp);
        } else {
            this.curStep = stepEnum.step1;
        }
    }

    annRect.prototype.del = function () {
        var dv = this.parent;
        if (!this.isCreated) {
            dv.unRegisterEvent(this, eventType.mouseDown);
            dv.unRegisterEvent(this, eventType.mouseMove);
            dv.unRegisterEvent(this, eventType.mouseUp);
        }

        if (this.rect) {
            this.rect.del();
            this.rect = undefined;
        }

        if (this.circleA) {
            this.circleA.del();
            this.circleA = undefined;
        }

        if (this.label) {
            this.label.del();
            this.label = undefined;
        }
        if (this.arrow) {
            this.arrow.del();
            this.arrow = undefined;
        }
    }

    annRect.prototype.setEdit = function (edit) {
        this.isInEdit = edit;
        this.setDraggable(edit);
        this.circleA.visible(edit);

        if (edit) {
            this.rect.color(colors.red);
            this.label.color(colors.red);
            this.circleA.color(colors.red);
        } else {
            this.rect.color(colors.white);
            this.label.color(colors.white);
            this.circleA.color(colors.white);
        }

        this.arrow.setEdit(edit);
    }

    annRect.prototype.reDraw = function () {
        var size = 2 * (this.width + this.height);
        size = Math.round(size * 100) / 100;
        var msg = "size=" + size;

        this.label.string(msg);

        this.arrow.reDraw({ x: this.label._x, y: this.label._y }, this.ptStart);

        this.onScale();
    }

    annRect.prototype.onScale = function () {
        var scale = this.parent.getScale();

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

        this.circleA._radius = radius;

        //change line size
        var lineWidth = Math.round(1 / scale);
        if (lineWidth < 0.2) {
            lineWidth = 0.2;
        }
        this.circleA._lineWidth = lineWidth;
        this.rect._lineWidth = lineWidth;

        this.arrow.onScale();
    }

    annRect.prototype.setDraggable = function (draggable) {
        var aRect = this;

        this._setChildDraggable(this.rect, draggable, function (deltaX, deltaY) {
            aRect._translateChild(aRect.circleA, deltaX, deltaY);
            aRect._translateChild(aRect.label, deltaX, deltaY);
            aRect.ptStart = {
                x: aRect.rect._x,
                y: aRect.rect._y
            };

            aRect.reDraw();
        });

        this._setChildDraggable(this.circleA, draggable, function (deltaX, deltaY) {
            aRect._translateChild(aRect.rect, deltaX, deltaY);
            aRect.rect._width -= deltaX;
            aRect.rect._height -= deltaY;

            aRect.ptStart = {
                x: aRect.rect._x,
                y: aRect.rect._y
            };

            aRect.width = aRect.rect._width;
            aRect.height = aRect.rect._height;

            aRect._translateChild(aRect.label, deltaX, deltaY);
            aRect.reDraw();
        });

        this._setChildDraggable(this.label, draggable, function (deltaX, deltaY) {
            aRect.reDraw();
        });
    }

    annRect.prototype.serialize = function () {
        var result = '{type:"{4}",ptStart:{x:{0},y:{1}},width:{2},height:{3}}';
        result = result.format(Math.round(this.ptStart.x), Math.round(this.ptStart.y), Math.round(this.width), Math.round(this.height), "annRect");

        return result;
    }

    annRect.prototype.deSerialize = function (jsonObj) {
        if (jsonObj) {
            var ptStart = jsonObj.ptStart;
            var width = jsonObj.width;
            var height = jsonObj.height;

            this.startCreate(this.parent);
            this.onMouseDown(ptStart);
            this.onMouseMove({
                x: ptStart.x + width,
                y: ptStart.y + height
            });
            this.onMouseUp();
        }
    }

    return annRect;
});