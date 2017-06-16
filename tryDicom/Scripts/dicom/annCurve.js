define(['dicomUtil', './annArrow', './annLabel', './annObject', 'jCanvaScript'], 
function(dicom, annArrow, annLabel, annObject, jc) {
	var stepEnum = dicom.stepEnum,
		annType = annObject.annType,
		colors = dicom.colors,
		eventType = dicom.eventType,
		_dDelta = dicom._dDelta;

	var countDistance = dicom.countDistance,
		imageToScreen = dicom.imageToScreen,
		screenToImage = dicom.screenToImage,
		getSineTheta = dicom.getSineTheta,
		getCosineTheta = dicom.getCosineTheta;

	function annCurve() {
		annObject.call(this);
		this.type = annType.line;

		this.ptStart = this.ptEnd = this.ptMiddle = {};
		this.ptDefaultDir = {
			x: 1,
			y: 1
		};
		this.defaultRadius = 170;

		this.isArcReady = false;
	}

	annCurve.prototype = new annObject();

	annCurve.prototype.startCreate = function(viewer) {
		var dv = this.viewer = viewer;
		this.id = dv._newObjectId();
		this.curStep = stepEnum.step1;

		dv.registerEvent(this, eventType.click);
	}

	annCurve.prototype.onClick = function(evt) {
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
			this.ptEnd = {
				x: arg.x,
				y: arg.y
			};

			var idCircleEnd = this.id + '_c2';
			jc.circle(this.ptEnd.x, this.ptEnd.y, radius).id(idCircleEnd).layer(dv.imgLayerId).color(colors.red);
			this.circleEnd = jc('#' + idCircleEnd);

			var lineId = this.id + '_line';
			jc.line([
				[this.ptStart.x, this.ptStart.y],
				[this.ptEnd.x, this.ptEnd.y]
			]).id(lineId).layer(dv.imgLayerId).color(colors.red);
			this.line = jc('#' + lineId);

			var idCircleM = this.id + '_cm';
			var ptMiddle = {};
			ptMiddle.x = (this.ptStart.x + this.ptEnd.x) / 2;
			ptMiddle.y = (this.ptStart.y + this.ptEnd.y) / 2;
			jc.circle(ptMiddle.x, ptMiddle.y, 5).id(idCircleM).layer(dv.imgLayerId).color(colors.red).opacity(0);
			this.circleMiddle = jc('#' + idCircleM);

			var lblPos = {
				x: ptMiddle.x,
				y: ptMiddle.y - 50
			};

			this.label = new annLabel(this.viewer, lblPos);
			this.label.parent = this;

			this.arrow = new annArrow(this.viewer);
			this.arrow.parent = this;

			this.reDraw();

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
			
	}
	
	//input:ptA, ptB, ptC, will check whether the 3 points can compose a valid arc.
	//output: radius, center point, the rect, and the final middle point.
	annCurve.prototype._calcArcBy3Points = function(ptA, ptB, ptC, bNeedCheckArc) {

		var result = this._calcMiddlePointBy3PointsPoints(ptA, ptB, ptC);
		var bIsInvalid = result.bIsInvalid,
			bNeedRevert = result.bNeedRevert,
			ptCenter = result.ptMiddle;

		if(bNeedCheckArc && bIsInvalid)
			return false; //user may drag the point out of range

		this.ptCenter = ptCenter; //the center of circle(yuan xin)
		this.radius = countDistance(ptCenter, ptA);

		var dSinAB = getSineTheta(ptA, ptB);
		var dCosAB = getCosineTheta(ptA, ptB);

		var ptCImage;

		if(bNeedRevert) {
			this.ptStart.x = ptB.m_x + 0.5;
			this.ptStart.y = ptB.m_y + 0.5;

			this.ptEnd.x = ptA.m_x + 0.5;
			this.ptEnd.y = ptA.m_y + 0.5;

			this.ptMiddle.m_x = ptCenter.m_x + radius * dSinAB;
			this.ptMiddle.m_y = ptCenter.m_y - radius * dCosAB;
		} else {
			this.ptStart.x = ptA.m_x + 0.5;
			this.ptStart.y = ptA.m_y + 0.5;

			this.ptEnd.x = ptB.m_x + 0.5;
			this.ptEnd.y = ptB.m_y + 0.5;

			this.ptMiddle.m_x = ptCenter.m_x - radius * dSinAB;
			this.ptMiddle.m_y = ptCenter.m_y + radius * dCosAB;
		}

		return true;
	}

	//
	annCurve.prototype._calcMiddlePointByRadius = function(radius, ptDir) {
		var ptA = this.ptStart,
			ptB = this.ptEnd;

		// D is center point of Line AB
		//
		var ptD, ptMiddle, ptO1, ptO2;
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
		var ptCenter, ptD, ptE;
		ptD.x = (ptStart.x + ptEnd.x) / 2.0;
		ptD.y = (ptStart.y + ptEnd.y) / 2.0;

		ptE.x = (ptEnd.x + ptMiddle.x) / 2.0;
		ptE.y = (ptEnd.y + ptMiddle.y) / 2.0;

		// k of Line OD and Line OE
		// O is center point of arc
		//
		var dkOD = -(ptEnd.x - ptStart.x) / (ptEnd.y - ptStart.y),
			dkOE = -(ptMiddle.x - ptEnd.x) / (ptMiddle.y - ptEnd.y);

		if(Math.fabs(ptMiddle.y - ptEnd.y) < _dDelta) {
			ptCenter.x = ptE.x;
			ptCenter.y = (ptE.x - ptD.x) * dkOD + ptD.y;
		} else if(Math.fabs(ptEnd.y - ptStart.y) < _dDelta) {
			ptCenter.x = ptD.x;
			ptCenter.y = (ptD.x - ptE.x) * dkOE + ptE.y;
		} else if(Math.fabs(ptMiddle.x - ptEnd.x) < _dDelta) {
			ptCenter.y = ptE.y;
			ptCenter.x = (ptE.y - ptD.y) / dkOD + ptD.x;
		} else if(Math.fabs(ptEnd.x - ptStart.x) < _dDelta) {
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

	//the start and end distance should <= defaultRadius
	annCurve.prototype._isInitDistanceTooFar = function(ptStart, ptEnd) {
		var value = countDistance(ptStart, ptEnd);

		return value > 2 * this.defaultRadius;
	}
	
	annCurve.prototype._calcAngle = function(ptTarget) {
		var ptCenter = this.ptCenter;

		var dwSin = getSineTheta(ptCenter, ptTarget);
		var dwCos = getCosineTheta(ptCenter, ptTarget);
		
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
}