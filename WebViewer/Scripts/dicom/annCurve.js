
define(['dicomUtil','./annLabel', './annObject', 'jCanvaScript'],
function(dicom, annLabel, annObject, jc) {
	var stepEnum = dicom.stepEnum,
		annType = annObject.annType,
		colors = dicom.colors,
		eventType = dicom.eventType,
		_dDelta = dicom._dDelta,
		countAngle = dicom.countAngle;

	var countDistance = dicom.countDistance,
		imageToScreen = dicom.imageToScreen,
		screenToImage = dicom.screenToImage,
		getSineTheta = dicom.getSineTheta,
		getCosineTheta = dicom.getCosineTheta;
	
	var defaultCircleRadius = 5,
		minCircleRadius = 2,
		minLineWidth = 0.3;
		
	function annCurve() {
		annObject.call(this);
		this.type = annType.line;

		this.ptStart = this.ptEnd = this.ptMiddle = {};
		this.ptDefaultDir = {
			x: 1,
			y: 1
		};
		this.defaultRadius = 170;
	}

	annCurve.prototype = new annObject();

	annCurve.prototype.startCreate = function(viewer) {
		var dv = this.viewer = viewer;
		this.id = dv._newObjectId();
		this.curStep = stepEnum.step1;

		dv.registerEvent(this, eventType.click);
	}

	annCurve.prototype.onClick = function(arg) {
		if(this.isCreated) {
			return;
		}

		var dv = this.viewer;
		var radius = Math.round(5 / dv.getScale());
		if(radius < 1) {
			radius = 1;
		}

		if(this.curStep == stepEnum.step1) {
			this.ptStart = {
				x: arg.x,
				y: arg.y
			};
			
			var idCircleStart = this.id + '_c1';
			jc.circle(this.ptStart.x, this.ptStart.y, radius).id(idCircleStart).layer(dv.imgLayerId).color(colors.red);
			this.circleStart = jc('#' + idCircleStart);

			this.curStep = stepEnum.step2;
		} else if(this.curStep == stepEnum.step2) {		
			var distance = countDistance(this.ptStart, arg);
			if(distance < 5){//too near
				return;
			}else if(distance > 2 * this.defaultRadius){//too far
				return;
			}
			
			this.ptEnd = {
				x: arg.x,
				y: arg.y
			};
			
			var idCircleEnd = this.id + '_c2';
			jc.circle(this.ptEnd.x, this.ptEnd.y, radius).id(idCircleEnd).layer(dv.imgLayerId).color(colors.blue);
			this.circleEnd = jc('#' + idCircleEnd);

			this.ptMiddle = this._calcMiddlePointByRadius(this.defaultRadius, this.ptDefaultDir);
			this._calcArcBy3Points(this.ptStart, this.ptEnd, this.ptMiddle);
			
			this.label = new annLabel(this.viewer, this.ptCenter, this.ptMiddle,  ''+Math.round(this.radius * 100)/100);
			this.label.parent = this;

			this.reDraw();
			this.onScale();

			this.circleStart.mouseStyle = this.circleEnd.mouseStyle = this.circleMiddle.mouseStyle = 'crosshair';
			this._setChildMouseEvent(this.circleStart);
			this._setChildMouseEvent(this.circleEnd);
			this._setChildMouseEvent(this.circleMiddle);

			this.isCreated = true;
			dv._onObjectCreated(this);

			//unregister events
			dv.unRegisterEvent(this, eventType.click);
		}

		return;
	}

	annCurve.prototype.reDraw = function(){
		var dv = this.viewer;
		var scale = dv.getScale();
		var radius = Math.round(defaultCircleRadius / scale);
		if(radius < minCircleRadius) {
			radius = minCircleRadius;
		}
		
		if(!this.circleMiddle){
			var idCircleM = this.id + '_cm';
			jc.circle(this.ptMiddle.x, this.ptMiddle.y, radius).id(idCircleM).layer(dv.imgLayerId).color(colors.yellow);
			this.circleMiddle = jc('#' + idCircleM);			
		}else{
			this.circleMiddle._x = this.ptMiddle.x;
			this.circleMiddle._y = this.ptMiddle.y;
			this.circleMiddle.radius = radius;
		}
		
		var arcStart = this._calcPointAngle(this.ptStart),
			arcEnd = this._calcPointAngle(this.ptEnd),
			arcMiddle = this._calcPointAngle(this.ptMiddle);
		
		if(arcEnd < arcStart) {
			arcEnd = arcEnd + 360.0;
		}

		if(arcMiddle < arcStart) {
			arcMiddle = arcMiddle + 360.0;
		}

		var arcSweep = arcEnd - arcStart;

		if(arcMiddle > arcStart && arcMiddle < arcEnd) {
		} else {
			arcSweep = arcSweep - 360.0;
		}
		
		if(!this.arcle){
			var idArc = this.id +"_arc";
			var args = {
				x:this.ptCenter.x,
	            y:this.ptCenter.y,
	            radius:this.radius,
	            startAngle:arcStart,
	            endAngle:arcEnd,
	            anticlockwise: this.anticlockwise
			}
			
			jc.arc(args).id(idArc).layer(dv.imgLayerId).color(colors.red);
			this.arcle = jc("#"+idArc);
		}else{
			this.arcle._x = this.ptCenter.x;
			this.arcle._y = this.ptCenter.y;
			this.arcle._radius = this.radius;
			this.arcle._startAngle = arcStart;
			this.arcle._endAngle = arcEnd;
			this.arcle._anticlockwise = this.anticlockwise;
		}
    	
    	var angle1 = countAngle(this.ptStart, this.ptCenter);
    	var angle2 = countAngle(this.ptCenter, this.ptEnd);

	    var dAngleValue= Math.abs(180.0-Math.abs(angle1-angle2));
	    if (dAngleValue>180.0){
	        dAngleValue = 360.0-dAngleValue;
	    }
	    
		var lblStr = '{0}\r\n{1}'.format(Math.round(this.radius * 100)/100, Math.round(dAngleValue * 100)/100)
		this.label.string(lblStr);
		this.label.targetPosition(this.ptMiddle);
	}
	
	annCurve.prototype.select = function(select){
		if(this.isInEdit === select){
			return;
		}
		console.log('select ' + this.id);
        this.isInEdit = select;
        this.setDraggable(select);

      	this._selectChild(select);
	}
	
	annCurve.prototype.setDraggable = function(draggable){
        var aCurve = this;

        var cs = aCurve.circleStart;
        var ce = aCurve.circleEnd;
        var cm = aCurve.circleMiddle;

        this._setChildDraggable(cs, draggable, function (deltaX, deltaY) {
            if(aCurve._calcArcBy3Points({x:cs._x, y:cs._y}, aCurve.ptEnd, aCurve.ptMiddle, true)){
            	aCurve.reDraw();
            }
			aCurve._locateCirclePos();
        });

        this._setChildDraggable(ce, draggable, function (deltaX, deltaY) {
            if(aCurve._calcArcBy3Points(aCurve.ptStart, {x:ce._x, y:ce._y}, aCurve.ptMiddle, true)){
            	aCurve.reDraw();
            }
			aCurve._locateCirclePos();
        });
        
        this._setChildDraggable(cm, draggable, function (deltaX, deltaY) {
            if(aCurve._calcArcBy3Points(aCurve.ptStart, aCurve.ptEnd, {x:cm._x, y:cm._y}, true)){
            	aCurve.reDraw();
            }
			aCurve._locateCirclePos();
        });
        
		this.label.setDraggable(draggable, function(deltaX, deltaY){
		});  
	}
	
	annCurve.prototype._locateCirclePos = function(){
        var cs = this.circleStart;
        var ce = this.circleEnd;
        var cm = this.circleMiddle;
        
		cs._x = this.ptStart.x;
		cs._y = this.ptStart.y;
		ce._x = this.ptEnd.x;
		ce._y = this.ptEnd.y;
		cm._x = this.ptMiddle.x;
		cm._y = this.ptMiddle.y;
	}
	
	annCurve.prototype.del = function(){
		var dv = this.viewer;
        if (!this.isCreated) {
            //unregister events
            dv.unRegisterEvent(this, eventType.click);
        }
		this._deleteChild();
        this.isCreated = false;
	}
	
	annCurve.prototype.onScale = function(totalScale){
        var dv = this.viewer;
        var scale = totalScale || dv.getScale();
        //change circle radius
        var radius = Math.round(defaultCircleRadius / scale);
        if (radius < minCircleRadius) {
            radius = minCircleRadius;
        }

        this.circleStart._radius = radius;
        this.circleMiddle._radius = radius;
        this.circleEnd._radius = radius;

        //change line size
        var lineWidth = Math.round(1 / scale);
        if (lineWidth < minLineWidth) {
            lineWidth = minLineWidth;
        }
        this.circleStart._lineWidth = lineWidth;
        this.circleMiddle._lineWidth = lineWidth;
        this.circleEnd._lineWidth = lineWidth;
        this.arcle._lineWidth = lineWidth;
        
        this.label.onScale(scale);
	}
	
	annCurve.prototype.onRotate = function(curAngle, totalAngle){
		this.label.onRotate(curAngle, totalAngle);
	}
	
	annCurve.prototype.onTranslate = function(){
		this.label.onTranslate();
	}
	
   	annCurve.prototype.serialize = function () {
        var result = '{type:"{0}",ptStart:{x:{1},y:{2}},ptEnd:{x:{3},y:{4}},ptMiddle:{x:{5},y:{6}},radius:{7},labelPos:{x:{8},y:{9}}}';
	    result = result.format("annCurve", this.ptStart.x, this.ptStart.y, this.ptEnd.x, this.ptEnd.y, this.ptMiddle.x, this.ptMiddle.y, this.radius, this.label.position().x, this.label.position().y);
	
	    return result;
	}

	annCurve.prototype.deSerialize = function (jsonObj) {
	    if (jsonObj) {
	        this.startCreate(this.viewer);
	        var ptStart = jsonObj.ptStart;
	        this.onClick(ptStart);
	        var ptEnd = jsonObj.ptEnd;
	        this.onClick(ptEnd);
	        
	        var ptMiddle = jsonObj.ptMiddle;
	        var radius = jsonObj.radius;
	        
	        this._calcArcBy3Points(ptStart, ptEnd, ptMiddle);
	        if (jsonObj.labelPos) {
	            this.label.position(jsonObj.labelPos);
	        }
	        
	        this.reDraw();
	    }
	}
	
	//input:ptA, ptB, ptC, will check whether the 3 points can compose a valid arc.
	//output: radius, center point, the rect, and the final middle point.
	annCurve.prototype._calcArcBy3Points = function(ptStart, ptEnd, ptMiddel, bNeedCheckArc) {
		var ptA = {}; ptA.x = ptStart.x; ptA.y = ptStart.y;
		var ptB = {}; ptB.x = ptEnd.x; ptB.y = ptEnd.y;
		var ptC = {}; ptC.x = ptMiddel.x; ptC.y = ptMiddel.y;
		
		var result = this._calcCenterBy3Points(ptA, ptB, ptC);
		var bIsInvalid = result.bIsInvalid,
			bNeedRevert = result.bNeedRevert,
			ptCenter = result.ptCenter;

		if(bNeedCheckArc && bIsInvalid)
			return false; //user may drag the point out of range

		this.ptCenter = ptCenter; //the center of circle(yuan xin)
		this.radius = countDistance(ptCenter, ptA);

		var dSinAB = getSineTheta(ptA, ptB);
		var dCosAB = getCosineTheta(ptA, ptB);
		
		this.anticlockwise = bNeedRevert ? 0 : 1;
		this.ptStart.x = ptA.x;
		this.ptStart.y = ptA.y;

		this.ptEnd.x = ptB.x;
		this.ptEnd.y = ptB.y;
			
		if(bNeedRevert) {
			this.ptMiddle.x = ptCenter.x + this.radius * dSinAB;
			this.ptMiddle.y = ptCenter.y - this.radius * dCosAB;
		} else {
			this.ptMiddle.x = ptCenter.x - this.radius * dSinAB;
			this.ptMiddle.y = ptCenter.y + this.radius * dCosAB;
		}

		return true;
	}

	//
	annCurve.prototype._calcMiddlePointByRadius = function(radius, ptDir) {
		var ptA = this.ptStart,
			ptB = this.ptEnd;

		// D is center point of Line AB
		//
		var ptD = {},
			ptMiddle = {},
			ptO1 = {},
			ptO2 = {};
			
		ptD.x = (ptA.x + ptB.x) / 2.0;
		ptD.y = (ptA.y + ptB.y) / 2.0;

		var dSinAB = getSineTheta(ptA, ptB);
		var dCosAB = getCosineTheta(ptA, ptB);

		var dLineAD = countDistance(ptA, ptD);

		//get the two center ponints.
		//check if the arc is almost 180, if true, lineAd is the radius
		if(Math.abs(dLineAD - radius) < _dDelta || radius < dLineAD) {
			ptO1.x = ptO2.x = ptD.x;
			ptO1.y = ptO2.y = ptD.y;
		} else {
			var dLineOD = Math.sqrt(Math.abs(radius * radius - dLineAD * dLineAD));

			ptO1.x = ptD.x + dLineOD * dSinAB;
			ptO1.y = ptD.y - dLineOD * dCosAB;

			ptO2.x = ptD.x - dLineOD * dSinAB;
			ptO2.y = ptD.y + dLineOD * dCosAB;
		}

		var dSinBA = getSineTheta(ptB, ptA),
			dCosBA = getCosineTheta(ptB, ptA),
			dSinBC = getSineTheta(ptB, ptDir),
			dCosBC = getCosineTheta(ptB, ptDir);

		//determine the center point
		var dSinBC_BA = dSinBC * dCosBA - dCosBC * dSinBA;
		if(dSinBC_BA < 0.0) {
			ptMiddle.x = ptO1.x - radius * dSinAB;
			ptMiddle.y = ptO1.y + radius * dCosAB;
		} else {
			ptMiddle.x = ptO2.x + radius * dSinAB;
			ptMiddle.y = ptO2.y - radius * dCosAB;
		}

		return ptMiddle;
	}

	//check the 3 point is valid and can compose a circle, and if true return the center point of the circle.
	annCurve.prototype._calcCenterBy3Points = function(ptStart, ptEnd, ptMiddle) {
		var bIsInvalid = false,
			bNeedRevert = false;

		// D and E is center point of Line AB and Line BC
		//
		var ptCenter = {},
			ptD ={},
			ptE = {};
			
		ptD.x = (ptStart.x + ptEnd.x) / 2.0;
		ptD.y = (ptStart.y + ptEnd.y) / 2.0;

		ptE.x = (ptEnd.x + ptMiddle.x) / 2.0;
		ptE.y = (ptEnd.y + ptMiddle.y) / 2.0;

		// k of Line OD and Line OE
		// O is center point of arc
		//
		var dkOD = -(ptEnd.x - ptStart.x) / (ptEnd.y - ptStart.y),
			dkOE = -(ptMiddle.x - ptEnd.x) / (ptMiddle.y - ptEnd.y);

		if(Math.abs(ptMiddle.y - ptEnd.y) < _dDelta) {
			ptCenter.x = ptE.x;
			ptCenter.y = (ptE.x - ptD.x) * dkOD + ptD.y;
		} else if(Math.abs(ptEnd.y - ptStart.y) < _dDelta) {
			ptCenter.x = ptD.x;
			ptCenter.y = (ptD.x - ptE.x) * dkOE + ptE.y;
		} else if(Math.abs(ptMiddle.x - ptEnd.x) < _dDelta) {
			ptCenter.y = ptE.y;
			ptCenter.x = (ptE.y - ptD.y) / dkOD + ptD.x;
		} else if(Math.abs(ptEnd.x - ptStart.x) < _dDelta) {
			ptCenter.y = ptD.y;
			ptCenter.x = (ptD.y - ptE.y) / dkOE + ptE.x;
		} else {
			ptCenter.x = (ptE.y - ptD.y - (ptE.x * dkOE) + (ptD.x * dkOD)) / (dkOD - dkOE);
			ptCenter.y = ptD.y + dkOD * (ptCenter.x - ptD.x);
		}

		// Analysis Start Point and End point
		// Arc() always draw arc in a Clockwise
		//
		var dSinBA = getSineTheta(ptEnd, ptStart),
			dCosBA = getCosineTheta(ptEnd, ptStart),
			dSinBC = getSineTheta(ptEnd, ptMiddle),
			dCosBC = getCosineTheta(ptEnd, ptMiddle);

		var dSinBC_BA = dSinBC * dCosBA - dCosBC * dSinBA;

		// Check Arc angle
		//
		var dSinOA = getSineTheta(ptCenter, ptStart),
			dCosOA = getCosineTheta(ptCenter, ptStart),
			dSinOB = getSineTheta(ptCenter, ptEnd),
			dCosOB = getCosineTheta(ptCenter, ptEnd);

		var dSinArc = dSinOA * dCosOB - dCosOA * dSinOB;

		if(dSinBC_BA > 0.0) {
			dSinArc = (-1.0) * dSinArc;
		}

		if(dSinArc < 0.0) {
			bIsInvalid = true;
		}

		//need to revert start and end.
		if(dSinBC_BA > 0.0) {
			bNeedRevert = true;
		}

		return {ptCenter: ptCenter, bIsInvalid: bIsInvalid, bNeedRevert:bNeedRevert};
	}

	annCurve.prototype._calcPointAngle = function(ptTarget) {
		var ptCenter = this.ptCenter;

		var dwSin = getSineTheta(ptCenter, ptTarget);
		var dwCos = getCosineTheta(ptCenter, ptTarget);
		var PI = Math.PI;
		
		var dwTheta;
		if(dwSin >= 0 && dwCos >= 0) {
			dwTheta = Math.asin(Math.abs(dwSin));
		} else if(dwSin >= 0 && dwCos < 0) {
			dwTheta = Math.asin(Math.abs(dwSin));
			dwTheta = PI - dwTheta;
		} else if(dwSin < 0 && dwCos <= 0) {
			dwTheta = Math.asin(Math.abs(dwSin));
			dwTheta = PI + dwTheta;
		} else {
			dwTheta = Math.asin(Math.abs(dwSin));
			dwTheta = PI * 2 - dwTheta;
		}
		if(180.0 / PI * dwTheta > 360) {
			return 180.0 / PI * dwTheta - 360;
		}
		
		return 180.0 / PI * dwTheta;
	}
	
	return annCurve;
});