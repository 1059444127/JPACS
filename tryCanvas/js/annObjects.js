
/*
 * Depends:
 * 1. jCanvasScript
 * 2. jQuery
 * 
 */
(function(window, undefined){
	
	function screenToImage(x, y, imgTrans){
	
		var imgPt = [0,0,1];
		var scrennPt = [x, y, 1];
		
		var a = x, b = y, n1 = imgTrans[0][0], n2 = imgTrans[0][1], n3 = imgTrans[0][2];
		var n4 = imgTrans[1][0], n5 = imgTrans[1][1], n6 = imgTrans[1][2];
		
		var t = a*n4 - n3*n4 -b*n1 + n1*n6;
		var t2 = n2*n4 - n1*n5;
		
		imgPt[1] = t/t2;
		
		t = b*n2 - n2*n6 -a*n5+n3*n5;	
		imgPt[0] = t/t2;
			
		return {x: imgPt[0], y:imgPt[1]};
	}
	
	function imageToScreen(x, y, trans){
		
		var imgPt = [x, y, 1];
		var screenPt = [0, 0, 1];
	
		screenPt[0] = trans[0][0]*imgPt[0] + trans[0][1]*imgPt[1]+trans[0][2]*imgPt[2];
		screenPt[1] = trans[1][0]*imgPt[0] + trans[1][1]*imgPt[1]+trans[1][2]*imgPt[2];
	
		return {x: screenPt[0], y: screenPt[1]};
	}

	var dCanvas;		//the dom canvas object
	var dImg;			//the dom image object
	var jcImgLayer;		//the jc image layer object
	var jcWorkLayer;	//the jc temp working layer
	
	var imgLayerId = 'imgLayer';
	var imgId = 'idImg';
	
	function imageViewer(){
		
	}
	
	window.imageViewer = imageViewer;
	
	imageViewer.prototype.draggable = function(draggable){

		jcImgLayer.draggable({
			disabled: !draggable,
			drag: this.onDragImage ? this.onDragImage : function(arg){},
			start: function(arg){
				dCanvas.style.cursor = "move";
			},
			stop: function(arg){
				dCanvas.style.cursor = "default";
			}
		});
	}
	
	imageViewer.prototype.initialize = function(canvasId, imgSrc){
		dCanvas = document.getElementById(canvasId);
		
		var imgViewer = this;
		
		dImg = new Image();
		dImg.onload = function(){
			jc.start(canvasId, true);
			
			jcImgLayer = jc.layer(imgLayerId).down('bottom');
			jc.image(dImg).id(imgId).layer(imgLayerId);
			
			imgViewer.draggable(true);
		}
		
		dImg.src = imgSrc;
	}
	
	
	imageViewer.prototype.addRect = function(){
		
	}
	
	
	//the base class
	function annObject(){
		
	}
	
	//the annRect class
	function annRect(x, y, rect, width){
		annObject.call(this);
		
	}
	
	annRect.prototype = new annObject();
	
	annRect.create = function(){
		
		
		
		this.jcStartCircle = undefined;
		this.jcRect = undefined;
		this.jcLable = undefined;
		
		
	}
	
	
	//the annLine class
	function annLine(startX, startY, endX, endY){
		annObject.call(this);
	}
	
	annLine.prototype = new annObject();
	
})(window, undefined);