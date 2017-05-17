
/*
 * Depends:
 * 1. jCanvasScript
 * 2. jQuery
 * 
 */
(function(window, undefined){
	
	var viewContext = {};
	viewContext.pan = 1;
	viewContext.select = 2;
	viewContext.create = 3;
	//viewContext.Edit = 3;

	var stepEnum = {};
	stepEnum.step1 = 1;
	stepEnum.step2 = 2;
	stepEnum.step3 = 3;
	stepEnum.step4 = 4;
	stepEnum.step5 = 5;

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
	
	function countDistance(x1, y1, x2, y2){
		var t = (x1-x2);
	}
	
	var globalViewerId = 1;
	function newViewerId(){
		globalViewerId++;
		return "viewer_" + globalViewerId;
	}
	
	/*********************************
	 * the dicomViewer class
	 */
	
	function dicomViewer(){
		this.id = newViewerId();
		this.annotationList = new Array();
		this.overlayList = new Array();
		this.dicomTagList = new Array();
		
		this.isReady = false;
		this.curContext = viewContext.pan;
		this.curSelectObj = undefined;
		
		this.imgLayerId = this.id +'_imgLayer';
		this.imgId = this.id +'_imgId';
		
		this._objectId = 0;
	}
	
	dicomViewer.prototype.newObjectId = function(){
		this._objectId++;
		return this.id + "_obj_" + this._objectId;	
	}
	
	dicomViewer.prototype.initialize = function(canvasId, imgSrc, callBack){
		var dv = this;
		
		dv.canvas = document.getElementById(canvasId);
		dv.canvas.oncontextmenu = function(evt){dv.onContextMenu.call(dv, evt);};

		var dImg = new Image();
		dImg.onload = function(){
			jc.start(canvasId, true);
			
			dv.imgLayer = jc.layer(dv.imgLayerId).down('bottom');
			dv.imgLayer.mousedown(function(arg){dv.onMouseDown.call(dv, arg)});
			dv.imgLayer.click(function(arg){dv.onClick.call(dv, arg)});
			
			jc.image(dv.dImg).id(dv.imgId).layer(dv.imgLayerId);
			
			dv.draggable(true);
			dv.isReady = true;
			
			if(callBack){
				callBack();
			}
		}
		
		dImg.src = imgSrc;
		this.dImg = dImg;
	}
	
	dicomViewer.prototype.setDicomTags = function(tagList){
		this.dicomTagList = tagList;	
	}
	
	dicomViewer.prototype.onMouseDown = function(arg){
		//if in select context, and not click any object, will unselect all objects.
		if(!arg.event.cancelBubble && this.curContext == viewContext.select){
			
			if(this.curSelectObj && this.curSelectObj.setEdit){
				this.curSelectObj.setEdit(false);
			}
		}
	}
	
	dicomViewer.prototype.onClick = function(arg){
		if(this.curContext != viewContext.create){
			return;
		}
		
		if(!curSelectObj || curSelectObj.isCreated){
			return;
		}
		
		curSelectObj.onClick(arg);
	}
	
	dicomViewer.prototype.onContextMenu = function(evt){
		evt.stopImmediatePropagation();
		evt.stopPropagation();
		evt.preventDefault();
	}
	
	dicomViewer.prototype.draggable = function(draggable){
		
		var dv = this;
		var canvas = this.canvas;
		
		this.imgLayer.draggable({
			disabled: !draggable,
			drag: dv.onDragImage ? dv.onDragImage : function(arg){},
			start: function(arg){
				canvas.style.cursor = "move";
			},
			stop: function(arg){
				canvas.style.cursor = "default";
			}
		});
	}
	
	dicomViewer.prototype.setSelectModel = function(){
		this.curContext = viewContext.select;
		
		this.draggable(false);
		//canvas.style.cursor = 'pointer';
	}
	
	dicomViewer.prototype.setPanModel = function(){
		this.curContext = viewContext.pan;
		
		this.draggable(true);
		//canvas.style.cursor = 'default';
		
		this.selectObject(undefined);
	}
	
	dicomViewer.prototype.addOverlay = function(tag, pos){
		
	}
	
	dicomViewer.prototype.selectObject = function(obj){
		if(obj && obj instanceof annObject){
			
			this.curSelectObj = obj;
			
			//set all other obj not in edit status
			this.annotationList.forEach(function(otherObj){
				if(otherObj !== obj){
					otherObj.setEdit(false);
				}
				else{
					otherObj.setEdit(true);
				}
			});
		}
		else{
			if(curSelectObj){
				curSelectObj.setEdit(false);
			}
			
			this.curSelectObj = undefined;
		}
	}
	
	dicomViewer.prototype.addRect = function(x, y, width, height){
		var aRect = new annRect(x, y, width, height);
		aRect.parent = this;
		this.annotationList.push(aRect);
		
		if(this.isReady){
			aRect.create();
		}
		
		return aRect;
	}
	
	dicomViewer.prototype.createLine = function(){
		var aLine = new annLine(this);
		this.curSelectObj = aLine;
		this.curContext = viewContext.create;
		
		//this.annotationList.push(aLine);
		
		if(this.isReady){
			aLine.create();
		}
		
		return aLine;
	}
	
	/*********************************
	 * the dicomTag definition
	 */
	
	function dicomTag(group, element, value){
		this.group = group;
		this.element = element;
		this.value = value;
	}
	
		
	/*********************************
	 * the overlay definition
	 */
	function overlay(tag, pos){
		this.tag = tag;
		this.position = pos;
	}
	
	
	/*********************************
	 * the annObject class
	 */

	function annObject(viewer){
		this.parent = viewer;
		this.isInEdit = false;
		this.isCreated = false;
		this.id = "";
	}
	
	//set child jcObject's common mouse event hander, etc.
	annObject.prototype._setMouseEvent = function(jcObj, overStyle){
		var dv = this.parent;
		var annObj = this;
		
		if(!overStyle){
			overStyle='pointer';
		}
		
		jcObj.mouseover(function(arg){
			if(dv.curContext == viewContext.select)
				dv.canvas.style.cursor = overStyle;
		});
		
		jcObj.mouseout(function(){
			if(dv.curContext == viewContext.select)
				dv.canvas.style.cursor = 'default';
		});
		
		jcObj.mousedown(function(arg){
			if(dv.curContext == viewContext.select){
				dv.selectObject(annObj);
				
				arg.event.cancelBubble = true;
			}
		});		
	}
	
	annObject.prototype._setDraggable = function(jcObj, draggable, onDrag){
		var dv = this.parent;
		var annObj = this;
		var transTmp = dv.imgLayer.transform();
		
		jcObj.draggable({
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
					
					if(onDrag){
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
		var dv = this.parent;
		
		//draw rect
		var rectId = dv.newObjectId();
		this.id = rectId;
		
		jc.rect(this.x, this.y, this.width, this.height).layer(dv.imgLayerId).id(rectId).color(colorWhite);
		this.rect = jc('#'+ rectId);
		//this.rect.lineStyle({lineWidth:1});
		
		//handle rect events
		var aRect = this;
		this._setMouseEvent(this.rect);

		//draw label text
		var idLbl = this.id+"_lbl";
		var lblPos = {x:this.x+5, y:this.y-5};
		jc.text('办证' +idLbl, lblPos.x, lblPos.y).id(idLbl).layer(dv.imgLayerId).color(colorWhite).font('15px Times New Roman');
		this.label = jc('#'+idLbl);
		
		this._setMouseEvent(this.label);
		
		//draw assit objects
		var idCircleA = this.id+"_aCircle";
		jc.circle(this.x, this.y, 5).id(idCircleA).layer(dv.imgLayerId).color(colorRed);
		this.circleA = jc("#"+idCircleA);
		this.circleA.visible(false);
		
		this._setMouseEvent(this.circleA, 'nw-resize');
		this.isCreated = true;
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
		
		this._setDraggable(this.rect, draggable, function(deltaX, deltaY){
			aRect.circleA.translate(deltaX, deltaY);
			aRect.label.translate(deltaX, deltaY);
		});
		
		this._setDraggable(this.circleA, draggable, function(deltaX, deltaY){
			aRect.rect.translate(deltaX, deltaY);
			aRect.rect._width -= deltaX;
			aRect.rect._height -= deltaY;
			
			aRect.label.translate(deltaX, deltaY);			
		});
		
		this._setDraggable(this.label, draggable);
	}
	
	/*********************************
	 * the annLine class
	 */
	
	function annLine(viewer){
		annObject.call(this, viewer);
		this.curStep = stepEnum.step1;
		
		var obj = this;
		viewer.imgLayer.click(function(arg){
			obj.onMouseClick(arg);
		});
		
		//this.ptStart = {x:startX, y:startY};
		//this.ptEnd = {x:endX, y:endY};
		
		
	}
	
	annLine.prototype = new annObject();
	
	annLine.prototype.create = function(){
		var dv = this.parent;
		
		var lineId = dv.newObjectId();
		this.id = lineId;

		jc.line([[this.ptStart.x, this.ptStart.y],[this.ptEnd.x, this.ptEnd.y]]).id(lineId).layer(dv.imgLayerId).color(colorWhite);
		this.line = jc('#'+lineId);
		
		var idCircleStart = this.id +'_c1'; 
		jc.circle(this.ptStart.x, this.ptStart.y, 5).id(idCircleStart).layer(dv.imgLayerId).color(colorWhite).opacity(0);
		this.circleStart = jc('#'+idCircleStart);
		
		var idCircleEnd = this.id +'_c2'; 
		jc.circle(this.ptEnd.x, this.ptEnd.y, 5).id(idCircleEnd).layer(dv.imgLayerId).color(colorWhite).opacity(0);
		this.circleEnd = jc('#'+idCircleEnd);
		
		var idCircleM = this.id+'_cm';
		var ptMiddle = {};
		ptMiddle.x = (this.ptStart.x + this.ptEnd.x) / 2;
		ptMiddle.y = (this.ptStart.y + this.ptEnd.y) / 2;	
		jc.circle(ptMiddle.x, ptMiddle.y, 5).id(idCircleM).layer(dv.imgLayerId).color(colorWhite).opacity(0);
		this.circleMiddle = jc('#'+idCircleM);
		
		var idLbl = this.id+'_lbl';
		var lblPos = {x:this.ptStart.x +5, y:this.ptStart.y-5};
		jc.text('办证' +idLbl, lblPos.x, lblPos.y).id(idLbl).layer(dv.imgLayerId).color(colorWhite).font('15px Times New Roman');
		this.label = jc('#'+idLbl);
		
		var idLblLine = this.id+'_lblLine';
		var ptLblCenter = this.label.getCenter();
		ptLblCenter = screenToImage(ptLblCenter.x, ptLblCenter.y, dv.imgLayer.transform());
		ptLblCenter.y+= 15;
		jc.line([[ptLblCenter.x, ptLblCenter.y],[ptMiddle.x, ptMiddle.y-5]]).id(idLblLine).layer(dv.imgLayerId).color(colorWhite);
		this.lableLine = jc('#'+idLblLine);
		
		this._setMouseEvent(this.circleStart, 'crosshair');
		this._setMouseEvent(this.circleEnd, 'crosshair');
		this._setMouseEvent(this.circleMiddle, 'crosshair');
		this._setMouseEvent(this.label);
	}
	
	annLine.prototype.setEdit = function(edit){
		this.isInEdit = edit;
		this.setDraggable(edit);
		
		if(edit){
			this.line.color(colorRed);
			this.label.color(colorRed);
			this.lableLine.color(colorRed);
			this.circleStart.color(colorRed).opacity(1);
			this.circleEnd.color(colorRed).opacity(1);
			this.circleMiddle.color(colorRed).opacity(1);	
		}
		else{
			this.line.color(colorWhite);
			this.label.color(colorWhite);
			this.lableLine.color(colorWhite);
			this.circleStart.color(colorWhite).opacity(0);
			this.circleEnd.color(colorWhite).opacity(0);
			this.circleMiddle.color(colorWhite).opacity(0);
		}
	}
	
	annLine.prototype.setDraggable = function(draggable){
		var aLine = this;
		var transTmp = this.parent.imgLayer.transform();
		
		var cs = aLine.circleStart;
		var ce = aLine.circleEnd;
		var cm = aLine.circleMiddle;
		var lbl = aLine.label;
		
		this._setDraggable(cs, draggable, function(deltaX, deltaY){
			aLine.ptStart = {x: cs._x+cs._transformdx, y:cs._y+cs._transformdy};
					
			aLine._reDraw();		
		});
		
		this._setDraggable(ce, draggable, function(deltaX, deltaY){
			aLine.ptEnd = {x: ce._x+ce._transformdx, y:ce._y+ce._transformdy};
					
			aLine._reDraw();
		});
		
		this._setDraggable(cm, draggable, function(deltaX, deltaY){
			cm.translate(-deltaX, -deltaY);
			
			cs.translate(deltaX, deltaY);
			ce.translate(deltaX, deltaY);
			
			aLine.ptStart = {x: cs._x+cs._transformdx, y:cs._y+cs._transformdy};
			aLine.ptEnd = {x: ce._x+ce._transformdx, y:ce._y+ce._transformdy};
			
			aLine._reDraw();
		});
		
		this._setDraggable(lbl, draggable, function(deltaX, deltaY){
			aLine._reDraw();
		});
	}
	
	annLine.prototype._reDraw = function(){
		var dv = this.parent;
		this.line.points([[this.ptStart.x, this.ptStart.y],[this.ptEnd.x, this.ptEnd.y]]);
		
		var ptMiddle = {};
		ptMiddle.x = (this.ptStart.x + this.ptEnd.x) / 2;
		ptMiddle.y = (this.ptStart.y + this.ptEnd.y) / 2;	
		this.circleMiddle._x = ptMiddle.x;
		this.circleMiddle._y = ptMiddle.y;
		this.circleMiddle._transformdx = 0;
		this.circleMiddle._transformdy = 0;
		
		var ptLblCenter = this.label.getCenter();
		ptLblCenter = screenToImage(ptLblCenter.x, ptLblCenter.y, dv.imgLayer.transform());
		ptLblCenter.y+= 15;
		this.lableLine.points([[ptLblCenter.x, ptLblCenter.y],[ptMiddle.x, ptMiddle.y - 5]]);
	}
	
	//export definitiens
	window.dicomViewer = dicomViewer;
	window.dicomTag = dicomTag;
	window.overlay = overlay;
	
})(window, undefined);