

window.onload = function(){
	
	var img = new Image();
	
	img.onload = function(){
		jc.start('c1', true);
		jc.image(img).id('idImg').draggable(onImgDrag);
		jc.rect(50, 50, 100, 30).id('idRect');
	}

	img.src="img/img1.jpg";
	
	$("#btnRect").on('click', function(){
		jc.start('c1', true);
		jc.rect(100, 100, 100, 30);
	});
	
	$("#btnRotate").on("click", onRotate);
	
	$("#btnScale").on("click", onScale);
}

function onRotate(){

	var centerPos = jc("#idImg").getCenter();
	
	jc("#idImg").rotate(45, centerPos.x, centerPos.y);
	jc("#idRect").rotate(45, centerPos.x, centerPos.y);
}

function onScale(evt){
	
}

var lastImgPos = {};

function onImgDrag(){
	
	var curPos = jc("#idImg").position();
	
    if (typeof(lastImgPos.x) != 'undefined') {

	    var deltaX = curPos.x - lastImgPos.x,
	        deltaY = curPos.y - lastImgPos.y;
		
		jc("#idRect").translate(deltaX, deltaY);
	}
	
	lastImgPos = curPos;
}


