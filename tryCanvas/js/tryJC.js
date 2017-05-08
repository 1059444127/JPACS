
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
	//var c1 = document.getElementById('c1');
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
		
		jc.layer('imgLayer').draggable({drag:onlayerDrag}).down('bottom');
		
		$("#btnRect").on('click', drawRect);	
		$("#btnRotate").on("click", onRotate);
		$("#btnScale").on("click", onScale);
		$("#btnReset").on("click", onReset);
	}

	img.src="img/img1.jpg";
}

function onDblClickTestRect(){
	this.visible(false);
	
	jc.start('c1', true);
	
	var tmpLayer = jc.layer('tmpLayer');
	tmpLayer.draggable();
	jc.layer('imgLayer').draggable({disabled: true});
	
	var transImg = jc.layer('imgLayer').transform();
	//var n1 = transImg[0][0], n2 = transImg[0][1], n3 = transImg[0][2], n4 = transImg[1][0], n5 = transImg[1][1], n6=transImg[1][2];	
	//tmpLayer.transform(n1, n2, n3, n4, n5, n6);
	
	
	//var rect = this.getRect(); //screen point
	//var startPos = imageToScreen(this._x, this._y, transImg);
	
	jc.rect(startPos.x, startPos.y, this._width, this._height).layer('tmpLayer').id('idRectMock').color('rgba(255,0,0,1)').dblclick(onDblClickMockRect);
	jc.circle(startPos.x,startPos.y, 5).layer('tmpLayer').id('circleStart').color('rgba(255,0,0,1)');
	
	tmpLayer.rotate(45, 'center');
	
}

function onDblClickMockRect(){
	
	//jc.start('c1', true);
	
	jc('#idRect').del();

	//var rect = this.getRect();
	
	var startPos = screenToImage(this._x, this._y, jc.layer('imgLayer').transform());
	jc.rect(startPos.x, startPos.y, this._width, this._height).layer('imgLayer').dblclick(onDblClickTestRect).id('idRect');
	
	
	jc.layer('tmpLayer').del();
	jc.layer('imgLayer').draggable({disabled: false});
}

//var focusCurrent = false;
//function onDblClickTestRect(rect){
//	
//	focusCurrent = !focusCurrent;
//	
//	if(focusCurrent){//working 
//		//this.layer('tmpLayer');
//		//this.color('rgba(255,0,0,1)');
//		this.visible(false);
//		var rect = this.getRect();
//		jc.rect(rect.x, rect.y, rect.width, rect.height).layer('tmpLayer').id('idRectMock').color('rgba(255,0,0,1)');
//		
//		var tmpLayer = jc.layer('tmpLayer');
//		tmpLayer.draggable();
//		
//		jc.circle(rect.x,rect.y, 5).layer('tmpLayer').id('circleStart').color('rgba(255,0,0,1)');
//	}
//	else{//stop working
//		this.layer('imgLayer');
//		this.color('rgba(0,0,0,1)');
//		
//	}
//	
//	var layer = jc.layer('imgLayer');
//
//	layer.draggable({disabled:focusCurrent, drag:onlayerDrag});
//	
//
//	this.draggable({disabled: !focusCurrent, 
//		start:function(arg){
//			
//			var imgTrans = jc("#idImg").transform();
//			var layerTrans = layer.transform();
//		
//			//jc.canvas('c1').save();
//			//jc.canvas('c1').transform(jc("#idImg").transform());
//		}, 
//		stop: function(arg){
//			//jc.canvas('c1').restore();
//			var imgTrans = jc("#idImg").transform();
//		},
//		drag: function(arg, arg2){
//			log2("drag x:"+arg.x +"y:"+ arg.y);
//			
//			var imgPt = screenToImage(arg.x, arg.y, layer.transform());
//			
//			log4("img x:" +imgPt.x+"y:"+imgPt.y);
//		}
//	});
//	
//}


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
