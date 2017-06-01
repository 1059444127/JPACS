
/*
request image graydata from server.
input: url to do ajax request for the gary binary data; width/height, the start point of image, window width/center.
output: Uint8ClampedArray, gray data array, each pixel with 4 bytes: R,G,B,A
*/

addEventListener('message', function (msg) {
    var data = msg.data;
    var imgDataUrl = data.imgDataUrl;
    var params = JSON.stringify(msg.data);

    var status = 'unknown';
    var grayData = new Uint8ClampedArray(width * height * 4);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', imgDataUrl, true);
    xhr.responseType = 'arraybuffer';

    xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhr.setRequestHeader("Content-length", params.length);
    xhr.setRequestHeader("Connection", "close");

    xhr.onload = function (e) {
        if (this.status == 200) {
            // get binary data as a response
            var dBytesArray = new Uint16Array(this.response);
            var len = dBytesArray.length;

            status = 'success';

        } else {
            status = 'failed with code: ' + this.status;
        }

        postMessage({ 'status': pixelData.buffer, 'grayData': grayData.buffer }, [grayData.buffer]);
    };

    xhr.send(params);
    
});