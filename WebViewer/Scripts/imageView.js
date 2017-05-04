

var bCanStartMove = false;
var c1, ogc, oimg;
var scale = 1;
var last_startPos = { x: 0, y: 0 };

window.onload = function () {

    c1 = document.getElementById("canvasImage");
    ogc = c1.getContext('2d');

    c1.onmousedown = function (evt) {
        c1.style.cursor = "move";
        bCanStartMove = true;
    }

    c1.onmouseup = function (evt) {
        c1.style.cursor = "auto";
        bCanStartMove = false;
        last_position = {};
    }

    c1.onmouseout = function (evt) {
        c1.style.cursor = "auto";
        bCanStartMove = false;
        last_position = {};
    }

    c1.onmousemove = onCanvasSpan;
    c1.onmousewheel = onCanvasScale;
    $("#btnRotate").on("click", onCanvasRotate);
    $("#btnReset").on("click", onCanvasReset);

    //load image
    oimg = new Image();
    oimg.onload = function () {

        ogc.drawImage(oimg, 0, 0);
    }

    oimg.src = imageUrl;
}

function reDrawImage() {
    var tWidth = oimg.width * scale;
    var tHeight = oimg.height * scale;

    ogc.clearRect(0, 0, c1.width, c1.height);
    ogc.drawImage(oimg, 0, 0, oimg.width, oimg.height, last_startPos.x, last_startPos.y, tWidth, tHeight);
}


//setup a variable to store our last position
var last_position = {};

//note that `.on()` is new in jQuery 1.7 and is the same as `.bind()` in this case
function onCanvasSpan(event) {

    if (!bCanStartMove)
        return;

    //check to make sure there is data to compare against
    if (typeof (last_position.x) != 'undefined') {

        //get the change from last position to this position
        var deltaX = last_position.x - event.clientX,
            deltaY = last_position.y - event.clientY;

        //check which direction had the highest amplitude and then figure out direction by checking if the value is greater or less than zero
        if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
            //left
        } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
            //right
        } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
            //up
        } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0) {
            //down
        }

        //redraw image
        //ogc.save(); 
        last_startPos.x -= deltaX;
        last_startPos.y -= deltaY;

        reDrawImage();

        //ogc.restore();
        //ogc.translate();
    }

    //set the new last position to the current for next time
    last_position = {
        x: event.clientX,
        y: event.clientY
    };
}

function onCanvasRotate(evt) {
    //ogc.save();

    //	ogc.translate(-c1.width/2, -c1.height/2);
    //	ogc.rotate(45*Math.PI/180);
    //	
    //	ogc.clearRect(0, 0, c1.width, c1.height);
    //	ogc.drawImage(oimg, last_startPos.x, last_startPos.y);

    ///ogc.restore();
}

function onCanvasScale(evt) {

    if (evt.wheelDelta / 120 > 0) {
        //up
        scale -= 0.1;
        if (scale <= 0.3) {
            scale = 0.3;
        }
    }
    else {
        scale += 0.1;
        if (scale >= 1.3) {
            scale = 1.3;
        }
    }

    reDrawImage();
}

function onCanvasReset(evt) {
    scale = 1;
    last_startPos = { x: 0, y: 0 };

    reDrawImage();
}