
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
        this.position = lblPos;//image 
        
        this.reDraw();
        
        this._setChildMouseEvent(this.label);
        this.isCreated = true;
    }

	annLabel.prototype = new annObject();
	
	annLabel.prototype.string = function(txt){
		this.label.string(txt);
	}
	
	annLabel.prototype.reDraw = function(){
		var dv = this.viewer;
		var pos = imageToScreen(this.position,dv.imgLayer.transform());

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
                    
                    var pos = this.position();
                    pos.y += this.getRect().height;
                    
                    aLabel.position = screenToImage(pos, dv.imgLayer.transform());
	                if (callback) {
	                    callback.call(aLabel, deltaX, deltaY);
	                }
                }
                this._lastPos = {
                    x: arg.x,
                    y: arg.y
                };
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
    
    return annLabel;
});
