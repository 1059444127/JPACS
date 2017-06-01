
/*
web worker working at JS side, used to count gray data set from dicom pixel data.
Input: dicom pixel data (with dicom image width and height), windowWidth, windowHeight, result graydata's width and heigth.
Output: gray data array, each pixel with 4 bytes: R,G,B,A

*/

addEventListener('message', function (msg) {
    var data = msg.data;
    var pixelData = new Uint16Array(data.pixelData), windowWidth = data.windowWidth, windowCenter = data.windowCenter,
        width = data.width, height = data.height, imgWidth = data.imgWidth;

    var grayData = new Uint8ClampedArray(width*height*4);

    var max = (2 * windowCenter + windowWidth) / 2.0 + 0.5;
    var min = (2 * windowCenter - windowWidth) / 2.0 + 0.5;
    var dFactor = 255.0 / (max - min);
    dFactor = Math.round(dFactor * 100) / 100;

    var pixelVal, disp_pixel_val, nPixelVal, index;

    for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {

            pixelVal = pixelData[i * imgWidth + j];

            index = i * width + j;
            if (pixelVal < min) {
                disp_pixel_val = 0;
            } else if (pixelVal > max) {
                disp_pixel_val = 255;
            } else {
                nPixelVal = (pixelVal - min) * dFactor;

                if (nPixelVal < 0) disp_pixel_val = 0;
                else if (nPixelVal > 255) disp_pixel_val = 255;
                else disp_pixel_val = nPixelVal;
            }

            disp_pixel_val = Math.round(disp_pixel_val);

            var k = 4 * index;
            for (var x = k; x < k + 3; x++) {
                grayData[x] = disp_pixel_val;
            }
            grayData[k + 3] = 255;
        }
    }

    postMessage({'width':width, 'height':height, 'windowWidth': windowWidth, 'windowCenter':windowCenter, 'pixelData':pixelData.buffer, 'grayData':grayData.buffer},[pixelData.buffer, grayData.buffer]);

}, false);


