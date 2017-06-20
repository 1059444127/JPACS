
define(['dicomUtil', './annObject', 'jCanvaScript'], 
function (dicom, annObject, jc) {
	
	var colors = dicom.colors,
		imageToScreen = dicom.imageToScreen,
		screenToImage = dicom.screenToImage;
	
    function annLabel(viewer, lblPos, txt) {
        annObject.call(this);
        var dv = this.viewer = viewer;
        this.id = viewer._newObjectId();
        this.text = txt;
        this.lblPos = lblPos;//image 
        
        this.reDraw();
        
        this._setChildMouseEvent(this.label);
        this.isCreated = true;
    }

	annLabel.prototype = new annObject();
	
	annLabel.prototype.string = function(txt){
		this.label.string(txt);
	}
	
	annLabel.prototype.position = function(pos){
		if(!pos){
			return this.lblPos;
		}else{
			this.lblPos = pos;
			this.reDraw();
		}
	}
	
	annLabel.prototype.reDraw = function(){
		var dv = this.viewer;
		var pos = imageToScreen(this.lblPos,dv.imgLayer.transform());

		if(!this.label){
			jc.text(this.text ||'hello world', pos.x, pos.y).id(this.id).layer(dv.olLayerId).color(colors.white).font('15px Times New Roman');
    		this.label = jc('#' + this.id);
		}else{
			this.label.transform(1,0,0,1,0,0,true);
			this.label._x = pos.x;
			this.label._y = pos.y;
		}
	}
	
	annLabel.prototype.setDraggable = function(draggable, callback){
		var aLabel = this;
		var dv = this.viewer;
		this.label.draggable({
            disabled: !draggable,
            start: function (arg) {
            	this._lastPos = {x:arg.x, y:arg.y};
                if (this.mouseStyle) {
                    dv.canvas.style.cursor = this.mouseStyle;
                }
            },
            stop: function (arg) {
                if (this.mouseStyle) {
                    dv.canvas.style.cursor = 'auto';
                }
                this._lastPos = {};
            },
            drag: function (arg) {
                if (typeof (this._lastPos.x) != 'undefined') {
                    var deltaX = arg.x - this._lastPos.x;
                    var deltaY = arg.y - this._lastPos.y;
                    
                    this._x += deltaX;
                    this._y += deltaY;
                    
                    var pos = this.position();
                    pos.y += this.getRect().height;
                    
                    aLabel.lblPos = screenToImage(pos, dv.imgLayer.transform());
	                if (callback) {
	                    callback.call(aLabel, deltaX, deltaY);
	                }
                }
                this._lastPos = {
                    x: arg.x,
                    y: arg.y
                };
                
                return true;
            }
		});
	}
	
	annLabel.prototype.onTranslate = function(){
		this.reDraw();	
	}
	
	annLabel.prototype.onScale = function(totalScale){
		this.reDraw();
	}
	
	annLabel.prototype.onRotate = function(angle, totalAngle){
		this.reDraw();
	}
	
    annLabel.prototype.del = function () {
        if (this.label) {
            this.label.del();
            this.label = undefined;
        }
    }

    annLabel.prototype.select = function (select) {
		if(this.isInEdit === select){
			return;
		}
        this.isInEdit = select;

 		if (select) {
            this.label.color(colors.red);
        } else {
            this.label.color(colors.white);
        }
    }
    
    annLabel.prototype.getNearestPoint = function(ptTarget){
    	if(!ptTarget){
    		return this.position(); //note, in image point
    	}
    	
    	var trans = this.viewer.imgLayer.transform();
    	var ptTScreen = dicom.imageToScreen(ptTarget, trans);
    	
    	var rect = this.label.getRect();
    	var pt1 = {x:this.label._x, y: this.label._y};
    		pt2 = {x:pt1.x + rect.width, y: pt1.y},
    		pt3 = {x:pt1.x, y:pt1.y - rect.height},
    		pt4 = {x:pt1.x+rect.width, y: pt1.y-rect.height};
    		
    	var dist1 = dicom.countDistance(pt1, ptTScreen),
    		dist2 = dicom.countDistance(pt2, ptTScreen),
    		dist3 = dicom.countDistance(pt3, ptTScreen),
    		dist4 = dicom.countDistance(pt4, ptTScreen);
    	
    	var min = dist1, ptResult = pt1;
    	if(dist2 < min){
    		min = dist2;
    		ptResult = pt2;
    	}
    	if(dist3 < min){
    		min = dist3;
    		ptResult = pt3;
    	}
    	if(dist4 < min){
    		min = dist4;
    		ptResult = pt4;
    	}
    	
    	return dicom.screenToImage(ptResult, trans);
    }
    
    return annLabel;
});
