
/*
request image graydata from server.
input: url to do ajax request for the gary binary data; width/height, the start point of image, window width/center.
output: Uint8ClampedArray, gray data array, each pixel with 4 bytes: R,G,B,A
*/

addEventListener('message', function (msg) {
    var data = msg.data;
    var imgDataUrl = data.imgDataUrl;
    imgDataUrl += "?windowWidth=" + msg.data.windowWidth + "&windowCenter=" + msg.data.windowCenter;
    //var params = JSON.stringify({ 'windowWidth': msg.data.windowWidth, 'windowCenter': msg.data.windowCenter });

    var success = true;
    var grayData = new Uint8ClampedArray(data.grayData);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', imgDataUrl, true);
    xhr.responseType = 'arraybuffer';

    //xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
    //xhr.setRequestHeader("Content-length", params.length);
    //xhr.setRequestHeader("Connection", "close");

    xhr.onload = function (e) {
        if (this.status == 200) {
            // get binary data as a response
            grayData = new Uint8Array(this.response);
            var len = grayData.length;

            success = true;
            postMessage({ 'success': success, 'grayData': grayData.buffer }, [grayData.buffer]);

        } else {
            success = false;
            postMessage({ 'success': success, 'grayData': grayData.buffer }, [grayData.buffer]);

        }
    };

    xhr.send();
});