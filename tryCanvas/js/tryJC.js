
function log(txt){
	jc('#txtLabel').string(txt);
}

function log2(txt){
	jc('#txtLabel2').string(txt);
}

function log3(txt){
	jc('#txtLabel3').string(txt);
}

function log4(txt){
	jc('#txtLabel4').string(txt);
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

window.onload = function(){
	var c1 = document.getElementById('c1');
	c1.onmousewheel = onCanvasScale;
	//var ogc = c1.getContext('2d');
	
	var img = new Image();
	
	img.onload = function(){
		jc.start('c1', true);
		jc.image(img).id('idImg').layer('imgLayer');
		
		jc.text("", 10, 10).id('txtLabel');
		jc.text('', 500, 10).id('txtLabel2');
		jc.text('', 10, 30).id('txtLabel3');
		jc.text('', 500, 30).id('txtLabel4');
		
		//draw test rect
		jc.rect(50, 50, 100, 30).id('idRect').layer('imgLayer').dblclick(onDblClickTestRect);
		
		jc.layer('imgLayer').draggable({drag:onlayerDrag, 
			start:function(arg){
				c1.style.cursor = "move";
				log2('start drag');
			},
			stop:function(arg){
				c1.style.cursor = "default";
				log2('stop drag');
			}
		}).down('bottom');
		
		$("#btnRect").on('click', drawRect);	
		$("#btnRotate").on("click", onRotate);
		$("#btnScale").on("click", onScale);
		$("#btnReset").on("click", onReset);
	}

	img.src="img/img1.jpg";
}


function onCanvasScale(evt){
	var scaleValue = 1;
	if(evt.wheelDelta /120 > 0){
		//up
		scaleValue = 0.9;
	}
	else{//down
		scaleValue = 1.1;
	}
	
	jc.layer('imgLayer').scale(scaleValue);
}

function onDblClickTestRect(){
	this.visible(false);
	
	jc.start('c1', true);
	
	var tmpLayer = jc.layer('tmpLayer');
	tmpLayer.draggable({disabled:true});
	jc.layer('imgLayer').draggable({disabled: true});
	
	//note the transform sequence, transform return {[1,3,5],[2,4,6]}, but the parameter needs(1, 2, 3, 4, 5, 6)
	var transImg = jc.layer('imgLayer').transform();
	var n1 = transImg[0][0], n3 = transImg[0][1], n5 = transImg[0][2], n2 = transImg[1][0], n4 = transImg[1][1], n6=transImg[1][2];	

	tmpLayer.transform(n1,n2,n3,n4,n5,n6);
	var transTmp = tmpLayer.transform();
	
	//var rect = this.getRect(); //screen point
	var startPos = {x:this._x, y:this._y};//imageToScreen(this._x, this._y, transImg);
	//this._width += 20;
	//this._height += 20;
	jc.rect(startPos.x, startPos.y, this._width, this._height).layer('tmpLayer').id('idRectMock').color('rgba(255,0,0,1)').dblclick(onDblClickMockRect).draggable();
	jc.circle(startPos.x,startPos.y, 5).layer('tmpLayer').id('circleStart').color('rgba(255,0,0,1)').draggable();

}

function onDblClickMockRect(){
	
	jc.start('c1', true);
	
	var originalRect = jc('#idRect');
	var mockRect = jc('#idRectMock');
	
	//var rect = this.getRect();
	
	var startPos = {x:this._transformdx +originalRect._x, y:this._transformdy+originalRect._y};//screenToImage(this._x, this._y, jc.layer('imgLayer').transform());
	jc.rect(startPos.x, startPos.y, this._width, this._height).layer('imgLayer').dblclick(onDblClickTestRect).id('idRect');
	
	originalRect.del();
	jc.layer('tmpLayer').del();
	jc.layer('imgLayer').draggable({disabled: false});
}

function onlayerDrag(arg){
	var rect = jc('#idRect');
	var pt = rect.position();
	
	var layer = jc.layer('imgLayer');
	var trans = layer.transform();
	var relativePt = screenToImage(pt.x, pt.y, trans);
	
	log("x:" +pt.x+", y:"+pt.y);
	log3("img x:" +relativePt.x+", y:"+relativePt.y);
}

function onRotate(){
	jc.layer("imgLayer").rotate(45, 'center');
	
}

function onScale(evt){
	jc.layer('imgLayer').scale(1.1);
}

function drawRect(){
	jc.start('c1', true);
	jc.rect(100, 100, 100, 30).layer('imgLayer');
}

function onReset(){
	var imgLayer = jc.layer('imgLayer');
	imgLayer.transform(1,0,0,1,0,0, true);
}
