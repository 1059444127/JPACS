
/*
request image graydata from server.
input: url to do ajax request for the gary binary data; width/height, the start point of image, window width/center.
output: Uint8ClampedArray, gray data array, each pixel with 4 bytes: R,G,B,A
*/

addEventListener('message', function (msg) {
    var data = msg.data, windowWidth = msg.data.windowWidth, windowCenter = msg.data.windowCenter;
    var imgDataUrl = data.imgDataUrl;
    imgDataUrl += "?windowWidth=" + windowWidth + "&windowCenter=" + windowCenter;

    var success = true;
    var grayData = new Uint8Array(data.grayData);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', imgDataUrl, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function (e) {
        if (this.status == 200) {
            // get binary data as a response
            var bytes = new Uint8Array(this.response);
            var len = bytes.length;
            //grayData = bytes;
            var curValue, index;
            for (var i = 0; i < len; i++) {
                curValue = bytes[i];
                index = 4 * i;
                grayData[index] = curValue;
                grayData[index + 1] = curValue;
                grayData[index + 2] = curValue;
                grayData[index + 3] = 255;
            }

            success = true;
            postMessage({ 'success': success, 'grayData': grayData.buffer, 'windowWidth': windowWidth, 'windowCenter': windowCenter }, [grayData.buffer]);

        } else {
            success = false;
            postMessage({ 'success': success, 'grayData': grayData.buffer, 'windowWidth': windowWidth, 'windowCenter': windowCenter }, [grayData.buffer]);

        }
    };

    xhr.send();
});