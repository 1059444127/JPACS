
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
        this.position = lblPos;
        
		jc.text(this.text ||'hello world', lblPos.x, lblPos.y).id(this.id).layer(dv.imgLayerId).color(colors.white).font('15px Times New Roman');
    	this.label = jc('#' + this.id);
        
        this._setChildMouseEvent(this.label);
        this.isCreated = true;
    }

	annLabel.prototype = new annObject();
	
	annLabel.prototype.string = function(txt){
		this.label.string(txt);
	}
	
	annLabel.prototype.setDraggable = function(draggable, callback){
		this._setChildDraggable(this.label, draggable, function(deltaX, deltaY){
			this.position.x += deltaX;
			this.position.y += deltaY;
			
			if(callback){
				callback(deltaX, deltaY);
			}
		});
	}
	
	annLabel.prototype.onScale = function(totalScale){
        var fontSize = Math.round(15 / totalScale);
        if (fontSize < 10) {
            fontSize = 10;
        }

        var font = "{0}px Times New Roman".format(fontSize);
        this.label.font(font);	
	}
	
	annLabel.prototype.onRotate = function(angle, totalAngle){
		var dv = this.viewer;
		//var pos = imageToScreen(this.position, dv.imgLayer.transform());
		var pos = this.position;
		this.label.rotate(-angle, 'center');
		
		var center = this.label.getCenter();
		console.log('center:', JSON.stringify(center));
		
		var rect = this.label.getRect();
		console.log('rect:', JSON.stringify(rect));
		
		if(this.testRect){
			this.testRect.del();
		}
		
		jc.rect(rect.x, rect.y, rect.width, rect.height).id('testRect').layer(dv.imgLayerId).color(colors.red);
		this.testRect = jc('#testRect');
		
		this.parent.reDraw();
	}
	
    annLabel.prototype.del = function () {
        if (this.label) {
            this.label.del();
            this.label = undefined;
        }
    }

    annLabel.prototype.select = function (select) {
        this.isInEdit = select;

 		if (select) {
            this.label.color(colors.red);
        } else {
            this.label.color(colors.white);
        }
    }
    
    return annLabel;
});
