/*********************************
* the annRect class
*/

define(['dicomUtil', './annArrow', './annLabel','./annObject', 'jCanvaScript'], 
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
	
    function annRect() {
        annObject.call(this);
        this.type = annType.rect;
    }

    annRect.prototype = new annObject();
    
    annRect.prototype.startCreate = function (viewer) {
        this.curStep = stepEnum.step1;
        var dv = this.viewer = viewer;
		this.id = dv._newObjectId();
		
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
        var dv = this.viewer;
        if (this.curStep == stepEnum.step2) {
			this.width = arg.x - this.ptStart.x;
            this.height = arg.y - this.ptStart.y;
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
                //var idLbl = this.id + "_lbl";
                var lblPos = {
                    x: this.ptStart.x + 5,
                    y: this.ptStart.y - 30
                };
                this.label = new annLabel(this.viewer, lblPos);
                this.label.parent = this;
            }

            if (!this.arrow) {
                this.arrow = new annArrow(dv);
            }

            this.reDraw();
        }
    }

    annRect.prototype.onMouseUp = function (arg) {
        var dv = this.viewer;
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
    
    annRect.prototype.reDraw = function () {
        var size = 2 * (this.width + this.height);
        size = Math.round(size * 100) / 100;
        var msg = "size=" + size;
        this.label.string(msg);
        
        this.arrow.reDraw(this.label.getNearestPoint(this.ptStart), this.ptStart);
        this.onScale();
    }
    
    annRect.prototype.setDraggable = function (draggable) {
        var aRect = this;

        this._setChildDraggable(this.rect, draggable, function (deltaX, deltaY) {
            aRect._translateChild(aRect.circleA, deltaX, deltaY);
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

            aRect.reDraw();
        });
		
		this.label.setDraggable(draggable, function(deltaX, deltaY){
			aRect.arrow.reDraw(aRect.label.getNearestPoint(aRect.ptStart), aRect.ptStart);
		});
    }

    annRect.prototype.del = function () {
        var dv = this.viewer;
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

    annRect.prototype.select = function (select) {
		if(this.isInEdit === select){
			return;
		}
		console.log('select ' + this.id);
        this.isInEdit = select;
        this.setDraggable(select);
        this.circleA.visible(select);

        if (select) {
            this.rect.color(colors.red);
            this.circleA.color(colors.red);
            this.circleA.level(this.selectLevel);
        } else {
            this.rect.color(colors.white);
            this.circleA.color(colors.white);
            this.circleA.level(this.defaultLevel);
        }
		
		this.label.select(select);
        this.arrow.select(select);
    }

    annRect.prototype.onScale = function (totalScale) {
        var scale = totalScale || this.viewer.getScale();

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
		
		this.label.onScale(scale);
        this.arrow.onScale(scale);
        this.arrow.reDraw(this.label.getNearestPoint(this.ptStart), this.ptStart);
    }

	annRect.prototype.onRotate = function(curAngle, totalAngle){
		this.label.onRotate(curAngle, totalAngle);
		this.arrow.reDraw(this.label.getNearestPoint(this.ptStart), this.ptStart);
	}
	
	annRect.prototype.onTranslate = function(){
		this.label.onTranslate();	
		this.arrow.reDraw(this.label.getNearestPoint(this.ptStart), this.ptStart);
	}
	
    annRect.prototype.serialize = function () {
        var result = '{type:"{4}",ptStart:{x:{0},y:{1}},width:{2},height:{3},labelPos:{x:{5},y:{6}}}';
        result = result.format(Math.round(this.ptStart.x), Math.round(this.ptStart.y), 
        	Math.round(this.width), Math.round(this.height), "annRect", this.label.position().x, this.label.position().y);

        return result;
    }

    annRect.prototype.deSerialize = function (jsonObj) {
        if (jsonObj) {
            var ptStart = jsonObj.ptStart;
            var width = jsonObj.width;
            var height = jsonObj.height;

            this.startCreate(this.viewer);
            this.onMouseDown(ptStart);
            this.onMouseMove({
                x: ptStart.x + width,
                y: ptStart.y + height
            });
            this.onMouseUp();
            
            this.label.position(jsonObj.labelPos);
            this.reDraw();
        }
    }

    return annRect;
});