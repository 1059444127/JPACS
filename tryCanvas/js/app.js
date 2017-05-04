
var bCanStartMove = false;
var c1, ogc, oimg;
var scale = 1;
var translate = {x:0, y:0};
var rotate = 0;

//temp
var bCircle = false;
//endtemp


window.onload=function(){

	c1 = document.getElementById("canvasImage");
	ogc = c1.getContext('2d');
	
	c1.onmousedown = function(evt){
		c1.style.cursor = "move";
		bCanStartMove = true;
	}
	
	c1.onmouseup = function(evt){
		c1.style.cursor = "auto";
		bCanStartMove = false;
		last_mousePos = {};
	}
	
	c1.onmouseout = function(evt){
		c1.style.cursor = "auto";
		bCanStartMove = false;
		last_mousePos = {};
	}
	
	c1.onmousemove = onCanvasPan;
	c1.onmousewheel = onCanvasScale;
	
	$("#btnRotate").on("click", onCanvasRotate);
	$("#btnReset").on("click", onCanvasReset);
	$("#btnCircle").on("click", onDrawCircle);
	
	//load image
	oimg = new Image();
	oimg.onload = function(){
		
		ogc.drawImage(oimg, 0, 0);
	}
	
	oimg.src= imageUrl;
}


function reDrawImage(){
	ogc.save();
	ogc.setTransform(1, 0, 0, 1, 0, 0);
	
	//var tWidth = oimg.width * scale;
	//var tHeight = oimg.height *scale;
	ogc.clearRect(0, 0, c1.width, c1.height);
	
	ogc.translate(translate.x + oimg.width/2, translate.y + oimg.height/2);
	ogc.rotate(rotate * Math.PI/180);	
	ogc.scale(scale, scale);

	ogc.drawImage(oimg, 0, 0, oimg.width, oimg.height, -oimg.width/2, -oimg.height/2, oimg.width, oimg.height);
	

	
	ogc.restore();
}


var last_mousePos = {};

function onCanvasPan(event) {

	if(!bCanStartMove)
		return;
		
    if (typeof(last_mousePos.x) != 'undefined') {

        var deltaX = last_mousePos.x - event.clientX,
            deltaY = last_mousePos.y - event.clientY;

        translate.x -= deltaX;
        translate.y -= deltaY;

        reDrawImage();
    }
	
    last_mousePos = {
        x : event.clientX,
        y : event.clientY
    };
}

function onCanvasRotate(evt){
	rotate += 90;
	
	if(rotate >= 360)
		rotate = 0;
		
	reDrawImage();
}

function onCanvasScale(evt){
	
	if(evt.wheelDelta /120 > 0){
		//up
		scale -= 0.1;
		if(scale <= 0.1){
			scale = 0.1;
		}
	}
	else{//down
		scale += 0.1;
		if(scale >= 2){
			scale = 2;
		}
	}
	
	reDrawImage();
}

function onCanvasReset(evt){
	scale = 1;
    translate = { x: 0, y: 0 };
    rotate = 0;
    
    reDrawImage();
}

function onDrawCircle(evt){
	bCircle = true;
	
	if(bCircle){
		jc.start("#canvasImage");
		jc.circle(100, 100, 200).id('circle1').draggable();
		jc.start("#canvasImage");
	}
}
