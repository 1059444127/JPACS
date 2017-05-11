
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

	var curId = 1;
	function newId(){
		curId++;
		return "annObj_"+curId;
	}

	var viewModel = {};
	viewModel.Pan = 1;
	viewModel.Select = 2;
	viewModel.Edit = 3;

	var dCanvas;		//the dom canvas object
	var dImg;			//the dom image object
	var jcImgLayer;		//the jc image layer object
	var jcWorkLayer;	//the jc temp working layer
	
	var annObjects = new Array();		//the container include all annotation objects
	var isReady = false;				//indicate whether image is loaded, and ready to draw annotation objects.
	
	var imgLayerId = 'imgLayer';
	var imgId = 'idImg';
	
	//current image viewer working model
	var curModel = viewModel.Pan;
	
	//defined the imageViewer class
	function imageViewer(){

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
			isReady = true;
			
			//create objects added before image be loaded
			if(annObjects.length > 0){			
				annObjects[0].create();
			}
		}
		
		dImg.src = imgSrc;
	}
	
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
	
	imageViewer.prototype.setSelectModel = function(){
		curModel = viewModel.Select;
		
		this.draggable(false);
		//dCanvas.style.cursor = 'pointer';
	}
	
	imageViewer.prototype.setPanModel = function(){
		curModel = viewModel.Pan;
		
		this.draggable(true);
		//dCanvas.style.cursor = 'default';
	}
	
	imageViewer.prototype.addRect = function(x, y, width, height){
		var aRect = new annRect(x, y, width, height);
		annObjects.push(aRect);
		
		if(isReady){
			aRect.create();
		}
		
		return aRect;
	}
	
	//the base class
	function annObject(){
		
	}
	
	//the annRect class
	function annRect(x, y, width, height){
		annObject.call(this);
		
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	
	annRect.prototype = new annObject();
	
	annRect.prototype.create = function(){
		var rectId = newId();
		jc.rect(this.x, this.y, this.width, this.height).layer(imgLayerId).id(rectId);
		this.jcRect = jc('#'+ rectId);
		
		this.jcRect.mouseover(function(){
			if(curModel == viewModel.Select)
				dCanvas.style.cursor = 'pointer';
		});
		
		this.jcRect.mouseout(function(){
			if(curModel == viewModel.Select)
				dCanvas.style.cursor = 'default';
		});
		
		this.jcRect.click(function(){
			if(curModel == viewModel.Select){
				curModel = viewModel.Edit;
				this.draggable({disabled:false});
				
				this.color('#ff0000');
			}
		});
	}
	
	annRect.prototype.edit = function(){

		this.jcStartCircle = undefined;
		this.jcRect = undefined;
		this.jcLable = undefined;
	}
	
	//the annLine class
	function annLine(startX, startY, endX, endY){
		annObject.call(this);
	}
	
	annLine.prototype = new annObject();
	
	//export imageViewer
	window.imageViewer = imageViewer;
	
})(window, undefined);