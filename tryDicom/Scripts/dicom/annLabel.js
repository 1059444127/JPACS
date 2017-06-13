
define(['dicomUtil', './annObject', 'jCanvaScript'], 
function (dicom, annObject, jc) {
	
	var colors = dicom.colors,
		imageToScreen = dicom.imageToScreen,
		screenToImage = dicom.screenToImage;
	
    function annLabel(viewer, lblPos, txt) {
        annObject.call(this);
        this.parent = viewer;
        this.id = viewer._newObjectId();
        
        jc.text(txt ||'', lblPos.x, lblPos.y).id(idLbl).color(colors.white).font('15px Times New Roman');
        this.label = jc('#' + idLbl);
    }

	annLabel.prototype = new annObject();
	
	annLabel.prototype.reDraw = function (ptStart, ptEnd, curScale) {
		
	}
	
    annLabel.prototype.onScale = function (curScale) {
        this.reDraw(this.ptStart, this.ptEnd, curScale);
    }

    annLabel.prototype.del = function () {
        if (this.line) {
            this.line.del();
            this.line = undefined;
        }
        if (this.arrowLineA) {
            this.arrowLineA.del();
            this.arrowLineA = undefined;
        }
        if (this.arrowLineB) {
            this.arrowLineB.del();
            this.arrowLineB = undefined;
        }
    }

    annLabel.prototype.setEdit = function (edit) {
        this.isInEdit = edit;

        if (edit) {
            this.line.color(colors.red);
            this.arrowLineA.color(colors.red);
            this.arrowLineB.color(colors.red);
        } else {
            this.line.color(colors.white);
            this.arrowLineA.color(colors.white);
            this.arrowLineB.color(colors.white);
        }
    }
    
    return annLabel;
});
