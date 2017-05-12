
/*
 * Depends:
 * 1. jCanvasScript
 * 2. jQuery
 * 
 */
(function(window, undefined){
	
	var workContext = {};
	workContext.Pan = 1;
	workContext.SelectAnnObj= 2;
	//workContext.Edit = 3;

	var dCanvas;		//the dom canvas object
	var dImg;			//the dom image object
	var jcImgLayer;		//the jc image layer object
	var jcWorkLayer;	//the jc temp working layer
	
	var imgLayerId = 'imgLayer';
	var imgId = 'idImg';
	
	//colors
	var colorWhite = '#ffffff';
	var colorRed = '#ff0000';
	
	//current image viewer working model
	var curContext = workContext.Pan;
	
	var annObjects = new Array();		//the container include all annotation objects
	var isReady = false;				//indicate whether image is loaded, and ready to draw annotation objects.
	var curSelectObj = undefined;
	
	function selectAnnObject(obj){
		
		if(obj && obj instanceof annObject){
			
			curSelectObj = obj;
			
			//set all other obj not in edit status
			annObjects.forEach(function(otherObj){
				if(otherObj !== obj){
					otherObj.setEdit(false);
				}
				else{
					otherObj.setEdit(true);
				}
			});
		}
		else{
			curSelectObj = undefined;
			
			annObjects.forEach(function(otherObj){
				otherObj.setEdit(false);
			});
		}
	}
	
	function onImgLayerMousedown(arg){
		//if in select context, and not click any object, will unselect all objects.
		if(!arg.event.cancelBubble && curContext == workContext.SelectAnnObj){
			//selectAnnObject(undefined);
			if(curSelectObj && curSelectObj.setEdit){
				curSelectObj.setEdit(false);
			}
		}
	}
	
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
	
	/*********************************
	 * the annRect class
	 */
	
	function imageViewer(){
		this.annObjectList = annObjects;
		this.isReady = isReady;
	}
	
	imageViewer.prototype.initialize = function(canvasId, imgSrc){
		dCanvas = document.getElementById(canvasId);
		
		var imgViewer = this;
		
		dImg = new Image();
		dImg.onload = function(){
			jc.start(canvasId, true);
			
			jcImgLayer = jc.layer(imgLayerId).down('bottom');
			jcImgLayer.mousedown(onImgLayerMousedown);
			
			jc.image(dImg).id(imgId).layer(imgLayerId);
			
			imgViewer.draggable(true);
			imgViewer.isReady = true;
			
			//create objects added before image be loaded
			if(imgViewer.annObjectList.length > 0){			
				imgViewer.annObjectList[0].create();
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
		curContext = workContext.SelectAnnObj;
		
		this.draggable(false);
		//dCanvas.style.cursor = 'pointer';
	}
	
	imageViewer.prototype.setPanModel = function(){
		curContext = workContext.Pan;
		
		this.draggable(true);
		//dCanvas.style.cursor = 'default';
		
		selectAnnObject(undefined);
	}
	
	imageViewer.prototype.addRect = function(x, y, width, height){
		var aRect = new annRect(x, y, width, height);
		this.annObjectList.push(aRect);
		
		if(this.isReady){
			aRect.create();
		}
		
		return aRect;
	}
	
	/*********************************
	 * the annRect class
	 */

	function annObject(){
		this.isInEdit = false;
		this.id = "";
	}
	
	
	/*********************************
	 * the annRect class
	 */
	
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
		this.id = rectId;
		
		jc.rect(this.x, this.y, this.width, this.height).layer(imgLayerId).id(rectId).color(colorWhite);
		this.jcRect = jc('#'+ rectId);
		
		var aRect = this;
		
		this.jcRect.mouseover(function(){
			if(curContext == workContext.SelectAnnObj)
				dCanvas.style.cursor = 'pointer';
		});
		
		this.jcRect.mouseout(function(){
			if(curContext == workContext.SelectAnnObj)
				dCanvas.style.cursor = 'default';
		});
		
		this.jcRect.mousedown(function(arg){
			if(curContext == workContext.SelectAnnObj){
				selectAnnObject(aRect);
				
				arg.event.cancelBubble = true;
			}
		});
	}
	
	annRect.prototype.setEdit = function(edit){
		this.isInEdit = edit;
		
		if(edit){
			this.jcRect.color(colorRed);
			this.setDraggable(true);
			
			//draw edit assit objects
			//this.jcStartCircle = undefined;
			//this.jcRect = undefined;
			//this.jcLable = undefined;
		}
		else{
			this.jcRect.color(colorWhite);
			this.setDraggable(false)
		}
	}
	
	annRect.prototype.setDraggable = function(draggable){
		this.jcRect.draggable({disabled: !draggable});
	}
	
	
	/*********************************
	 * the annLine class
	 */
	
	function annLine(startX, startY, endX, endY){
		annObject.call(this);
	}
	
	annLine.prototype = new annObject();
	
	//export imageViewer
	window.imageViewer = imageViewer;
	
})(window, undefined);