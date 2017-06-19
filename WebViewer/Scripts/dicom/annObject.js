/*********************************
* the annObject class
*/

define(['dicomUtil'], function(dicom){
	
	var viewContext = dicom.viewContext;
	var imageToScreen = dicom.imageToScreen;
	var screenToImage = dicom.screenToImage;
	
    function annObject() {
        this.viewer = undefined;
        this.type = annObject.annType.unknown;
        this.isInEdit = false;
        this.isCreated = false;
    }

    annObject.annType = {
        unknown: 0,
        overlay: 1,
        line: 2,
        rect: 3
    }

    //set child jcObject's common mouse event hander, etc.
    annObject.prototype._setChildMouseEvent = function (jcObj) {
        var dv = this.viewer;
        var annObj = this;

        jcObj.mouseover(function (arg) {
            if (dv.curContext == viewContext.select) {
                if (!this.mouseStyle) {
                    this.mouseStyle = 'pointer';
                }
                dv.canvas.style.cursor = this.mouseStyle;
            }
        });

        jcObj.mouseout(function () {
            if (dv.curContext == viewContext.select)
                dv.canvas.style.cursor = 'auto';
        });

        jcObj.mousedown(function (arg) {
   			//console.log('jcObj mousedown');
 			if (dv.curContext == viewContext.select) {
            	var curObj = annObj.parent || annObj;
            	if(dv.curSelectObj !== curObj){
	                dv.selectObject(curObj);	
            	}
            	arg.event.cancelBubble = true;
        	}
        });
        
        jcObj.mouseup(function (arg) {
   			//console.log('jcObj mouseup');
        });
        
        jcObj.click(function(arg){
        	//console.log('jcObj onClick');
// 			if (dv.curContext == viewContext.select) {
//          	var curObj = annObj.parent || annObj;
//          	if(dv.curSelectObj !== curObj){
//	                dv.selectObject(curObj);	
//          	}
//          	arg.event.cancelBubble = true;
//      	}
        });
    }

    annObject.prototype._setChildDraggable = function (jcObj, draggable, onDrag) {
        if (!jcObj) {
            return;
        }

        var dv = this.viewer;
        var canvas = dv.canvas;
        var annObj = this;

        jcObj.draggable({
            disabled: !draggable,
            start: function (arg) {
                this._lastPos = {};
                if (this.mouseStyle) {
                    dv.canvas.style.cursor = this.mouseStyle;
                }
            },
            stop: function (arg) {
                this._lastPos = {};
                if (this.mouseStyle) {
                    dv.canvas.style.cursor = 'auto';
                }
            },
            drag: function (arg) {
                //ptImg is mouse position, not the object's start position
                //don't translate any annObject, always keep annObject's transform is clear.
                var transTmp = dv.imgLayer.transform();
                var ptImg = screenToImage(arg, transTmp);

                if (typeof (this._lastPos.x) != 'undefined') {
                    var deltaX = ptImg.x - this._lastPos.x;
                    var deltaY = ptImg.y - this._lastPos.y;

                    this._x += deltaX;
                    this._y += deltaY;

                    if (onDrag) {
                        onDrag.call(annObj, deltaX, deltaY);
                    }
                }

                this._lastPos = {
                    x: ptImg.x,
                    y: ptImg.y
                };
                return true;
            }
        });
    }

    annObject.prototype._translateChild = function (child, deltaX, deltaY) {
        if (child) {
            child._x += deltaX;
            child._y += deltaY;
        }
    }

	annObject.prototype.selectLevel = 100;
	annObject.prototype.defaultLevel = 1;
	
    return annObject;
});