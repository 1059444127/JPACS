
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

	//colors
	var colorWhite = '#ffffff';
	var colorRed = '#ff0000';
	
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
	
	var globalViewerId = 1;
	function newViewerId(){
		globalViewerId++;
		return "viewer_" + globalViewerId;
	}
	
	/*********************************
	 * the imageViewer class
	 */
	
	function imageViewer(){
		this.id = newViewerId();
		this.objectList = new Array();
		this.isReady = false;
		this.curContext = workContext.Pan;
		this.curSelectObj = undefined;
		
		this.imgLayerId = this.id +'_imgLayer';
		this.imgId = this.id +'_imgId';
		
		this.curObjectId = 0;
	}
	
	imageViewer.prototype.newObjectId = function(){
		this.curObjectId++;
		return this.id + "_obj_" + this.curObjectId;	
	}
	
	imageViewer.prototype.initialize = function(canvasId, imgSrc){
		this.canvas = document.getElementById(canvasId);
		
		var iv = this;
		
		var dImg = new Image();
		dImg.onload = function(){
			jc.start(canvasId, true);
			
			iv.imgLayer = jc.layer(iv.imgLayerId).down('bottom');
			iv.imgLayer.mousedown(function(arg){iv.onMouseDown.call(iv, arg)});
			
			jc.image(iv.dImg).id(iv.imgId).layer(iv.imgLayerId);
			
			iv.draggable(true);
			iv.isReady = true;
			
			//create objects added before image be loaded
			iv.objectList.forEach(function(obj){
				obj.create();
			});
		}
		
		dImg.src = imgSrc;
		this.dImg = dImg;
	}
	
	imageViewer.prototype.selectObject = function(obj){
		if(obj && obj instanceof annObject){
			
			this.curSelectObj = obj;
			
			//set all other obj not in edit status
			this.objectList.forEach(function(otherObj){
				if(otherObj !== obj){
					otherObj.setEdit(false);
				}
				else{
					otherObj.setEdit(true);
				}
			});
		}
		else{
			this.curSelectObj = undefined;
			
			this.objectList.forEach(function(otherObj){
				otherObj.setEdit(false);
			});
		}
	}
	
	imageViewer.prototype.onMouseDown = function(arg){
		//if in select context, and not click any object, will unselect all objects.
		if(!arg.event.cancelBubble && this.curContext == workContext.SelectAnnObj){
			//selectAnnObject(undefined);
			if(this.curSelectObj && this.curSelectObj.setEdit){
				this.curSelectObj.setEdit(false);
			}
		}
	}
	
	imageViewer.prototype.draggable = function(draggable){
		
		var iv = this;
		var canvas = this.canvas;
		
		this.imgLayer.draggable({
			disabled: !draggable,
			drag: iv.onDragImage ? iv.onDragImage : function(arg){},
			start: function(arg){
				canvas.style.cursor = "move";
			},
			stop: function(arg){
				canvas.style.cursor = "default";
			}
		});
	}
	
	imageViewer.prototype.setSelectModel = function(){
		this.curContext = workContext.SelectAnnObj;
		
		this.draggable(false);
		//canvas.style.cursor = 'pointer';
	}
	
	imageViewer.prototype.setPanModel = function(){
		this.curContext = workContext.Pan;
		
		this.draggable(true);
		//canvas.style.cursor = 'default';
		
		this.selectObject(undefined);
	}
	
	imageViewer.prototype.addRect = function(x, y, width, height){
		var aRect = new annRect(x, y, width, height);
		aRect.parent = this;
		this.objectList.push(aRect);
		
		if(this.isReady){
			aRect.create();
		}
		
		return aRect;
	}
	
	/*********************************
	 * the annObject class
	 */

	function annObject(){
		this.parent = undefined;
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
		
		//for asisit
		this._lastRectPos = {};
		this._lastCirclePos = {};
	}
	
	annRect.prototype = new annObject();
	
	annRect.prototype.create = function(){
		var iv = this.parent;
		
		//draw rect
		var rectId = iv.newObjectId();
		this.id = rectId;
		
		jc.rect(this.x, this.y, this.width, this.height).layer(iv.imgLayerId).id(rectId).color(colorWhite);
		this.rect = jc('#'+ rectId);
		//this.rect.lineStyle({lineWidth:1});
		
		//handle rect events
		var aRect = this;
		
		this.rect.mouseover(function(){
			if(iv.curContext == workContext.SelectAnnObj)
				iv.canvas.style.cursor = 'pointer';
		});
		
		this.rect.mouseout(function(){
			if(iv.curContext == workContext.SelectAnnObj)
				iv.canvas.style.cursor = 'default';
		});
		
		this.rect.mousedown(function(arg){
			if(iv.curContext == workContext.SelectAnnObj){
				iv.selectObject(aRect);
				
				arg.event.cancelBubble = true;
			}
		});
		
		//draw label text
		var idLbl = this.id+"_lbl";
		var lblPos = {x:this.x+5, y:this.y-5};
		jc.text('办证' +idLbl, lblPos.x, lblPos.y).id(idLbl).layer(iv.imgLayerId).color(colorWhite).font('15px Times New Roman');
		this.label = jc('#'+idLbl);
		
		this.label.mouseover(function(){
			if(iv.curContext == workContext.SelectAnnObj)
				iv.canvas.style.cursor = 'pointer';
		});
		
		this.label.mouseout(function(){
			if(iv.curContext == workContext.SelectAnnObj)
				iv.canvas.style.cursor = 'default';
		});
		
		this.label.mousedown(function(arg){
			if(iv.curContext == workContext.SelectAnnObj){
				iv.selectObject(aRect);
				
				arg.event.cancelBubble = true;
			}
		});
		
		//draw assit objects
		var idCircleA = this.id+"_aCircle";
		jc.circle(this.x, this.y, 5).id(idCircleA).layer(iv.imgLayerId).color(colorRed);
		this.circleA = jc("#"+idCircleA);
		this.circleA.visible(false);
		
		this.circleA.mouseover(function(){
			if(iv.curContext == workContext.SelectAnnObj)
				iv.canvas.style.cursor = 'nw-resize';
		});
		
		this.circleA.mouseout(function(){
			if(iv.curContext == workContext.SelectAnnObj)
				iv.canvas.style.cursor = 'default';
		});
		
		this.circleA.mousedown(function(arg){
			if(iv.curContext == workContext.SelectAnnObj){
				iv.selectObject(aRect);
				
				arg.event.cancelBubble = true;
			}
		});
	}
	
	annRect.prototype.setEdit = function(edit){
		this.isInEdit = edit;
		this.setDraggable(edit);
		this.circleA.visible(edit);
		
		if(edit){
			this.rect.color(colorRed);
			this.label.color(colorRed);
		}
		else{
			this.rect.color(colorWhite);
			this.label.color(colorWhite);
		}
	}
	
	annRect.prototype.setDraggable = function(draggable){
		var aRect = this;
		var transTmp = this.parent.imgLayer.transform();
		
		this.rect.draggable({
			disabled: !draggable,
			start: function(arg){
				this._lastPos = {};
			},
			stop: function(arg){
				this._lastPos = {};
			},
			drag: function(arg){
				var ptImg = screenToImage(arg.x, arg.y, transTmp);
				
				if (typeof(this._lastPos.x) != 'undefined') {
	
					var deltaX = ptImg.x - this._lastPos.x;
					var deltaY = ptImg.y - this._lastPos.y;
					
					this.translate(deltaX, deltaY);
					aRect.circleA.translate(deltaX, deltaY);
					aRect.label.translate(deltaX, deltaY);
				}
				
				this._lastPos = {
					x: ptImg.x,
					y: ptImg.y
				};
				
				return true;
			}
		});
		
		this.circleA.draggable({
			disabled: !draggable,
			start: function(arg){
				this._lastPos = {};
			},
			stop: function(arg){
				this._lastPos = {};
			},
			drag:function(arg){
				var ptImg = screenToImage(arg.x, arg.y, transTmp);
				
				if (typeof(this._lastPos.x) != 'undefined') {
	
					var deltaX = ptImg.x - this._lastPos.x;
					var deltaY = ptImg.y - this._lastPos.y;
					
					this.translate(deltaX, deltaY);
					
					aRect.rect.translate(deltaX, deltaY);
					aRect.rect._width -= deltaX;
					aRect.rect._height -= deltaY;
					
					aRect.label.translate(deltaX, deltaY);
				}
				
				this._lastPos = {
					x: ptImg.x,
					y: ptImg.y
				};
				
				return true;
			}
		});
		
		this.label.draggable({
			disabled: !draggable,
			start: function(arg){
				this._lastPos = {};
			},
			stop: function(arg){
				this._lastPos = {};
			},
			drag:function(arg){
				var ptImg = screenToImage(arg.x, arg.y, transTmp);
				
				if (typeof(this._lastPos.x) != 'undefined') {
	
					var deltaX = ptImg.x - this._lastPos.x;
					var deltaY = ptImg.y - this._lastPos.y;
					
					this.translate(deltaX, deltaY);
				}
				
				this._lastPos = {
					x: ptImg.x,
					y: ptImg.y
				};
				
				return true;
			}
		});
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