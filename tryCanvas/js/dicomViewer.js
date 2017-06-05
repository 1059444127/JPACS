/*
 * Depends:
 * 1. jCanvasScript
 * 2. jQuery
 * 
 */
(function (window, undefined) {

    //define enums
    var viewContext = {
        pan: 1,
        select: 2,
        create: 3
    };
    var stepEnum = {
        step1: 1,
        step2: 2,
        step3: 3,
        step4: 4,
        step5: 5
    };

    //define colors
    var colors = {
        white: '#ffffff',
        red: '#ff0000',
        yellow: '#ffff00'
    };

    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (searchString, position) {
            position = position || 0;
            return this.indexOf(searchString, position) === position;
        };
    }

    if (!String.prototype.format) {
        String.prototype.format = function (args) {
            var result = this;
            if (arguments.length > 0) {
                if (arguments.length == 1 && typeof (args) == "object") {
                    for (var key in args) {
                        if (args[key] != undefined) {
                            var reg = new RegExp("({" + key + "})", "g");
                            result = result.replace(reg, args[key]);
                        }
                    }
                } else {
                    for (var i = 0; i < arguments.length; i++) {
                        if (arguments[i] != undefined) {
                            var reg = new RegExp("({)" + i + "(})", "g");
                            result = result.replace(reg, arguments[i]);
                        }
                    }
                }
            }
            return result;
        }
    }

    var overlayPos = {
        topLeft1: 0,
        topLeft2: 1,
        topLeft3: 2,
        topLeft4: 3,
        topRight1: 4,
        topRight2: 5,
        topRight3: 6,
        topRight4: 7,
        bottomLeft1: 8,
        bottomLeft2: 9,
        bottomLeft3: 10,
        bottomLeft4: 11,
        bottomRight1: 12,
        bottomRight2: 13,
        bottomRight3: 14,
        bottomRight4: 15
    };

    function dicomTag(group, element, value) {
        this.group = group;
        this.element = element;
        this.value = value;
    }

    dicomTag.studyTime =        { group: 0x0008, element: 0x0030 };
    dicomTag.studyDate =        { group: 0x0008, element: 0x0020 };
    dicomTag.patientName =      { group: 0x0010, element: 0x0010 };
    dicomTag.patientBirthDate = { group: 0x0010, element: 0x0030 };
    dicomTag.patientID =        { group: 0x0010, element: 0x0020 };
    dicomTag.patientSex =       { group: 0x0010, element: 0x0040 };
    dicomTag.viewPosition =     { group: 0x0018, element: 0x5101 };
    dicomTag.bodyPart =         { group: 0x0018, element: 0x0015 };
    dicomTag.windowWidth =      { group: 0x0028, element: 0x1051 };
    dicomTag.windowCenter =     { group: 0x0028, element: 0x1050 };
    dicomTag.customScale =      { group: 0x1111, element: 0x0001 };

    //define event type
    var eventType = {
        click: 1,
        mouseDown: 2,
        mouseMove: 3,
        mouseUp: 4,
        mouseOver: 5,
        mouseOut: 6,
        rightClick: 7,
        dblClick: 8,
        mouseWheel: 9
    };

    function screenToImage(pt, imgTrans) {
        var x = pt.x,
			y = pt.y,
			imgPt = [0, 0, 1],
			scrennPt = [x, y, 1];

        var a = x,
			b = y,
			n1 = imgTrans[0][0],
			n2 = imgTrans[0][1],
			n3 = imgTrans[0][2],
			n4 = imgTrans[1][0],
			n5 = imgTrans[1][1],
			n6 = imgTrans[1][2];

        var t = a * n4 - n3 * n4 - b * n1 + n1 * n6;
        var t2 = n2 * n4 - n1 * n5;

        imgPt[1] = t / t2;

        t = b * n2 - n2 * n6 - a * n5 + n3 * n5;
        imgPt[0] = t / t2;

        return {
            x: imgPt[0],
            y: imgPt[1]
        };
    }

    function imageToScreen(pt, trans) {
        var x = pt.x,
			y = pt.y,
			imgPt = [x, y, 1],
			screenPt = [0, 0, 1];

        screenPt[0] = trans[0][0] * imgPt[0] + trans[0][1] * imgPt[1] + trans[0][2] * imgPt[2];
        screenPt[1] = trans[1][0] * imgPt[0] + trans[1][1] * imgPt[1] + trans[1][2] * imgPt[2];

        return {
            x: screenPt[0],
            y: screenPt[1]
        };
    }

    function countDistance(pt1, pt2) {
        var value = Math.pow((pt1.x - pt2.x), 2) + Math.pow((pt1.y - pt2.y), 2);
        value = Math.sqrt(value);

        return value;
    }

    var _dDelta = 0.0000000001;

    function getSineTheta(pt1, pt2) {
        var dDistance = countDistance(pt1, pt2);
        if (Math.abs(dDistance) < _dDelta) {
            return 0.0;
        } else {
            var dSineTheta = -(Math.abs(pt1.y - pt2.y)) / dDistance;
            if (pt1.y > pt2.y) {
                return dSineTheta;
            } else {
                return -dSineTheta;
            }
        }
    }

    // get the line cosine theta
    function getCosineTheta(pt1, pt2) {
        var dDistance = countDistance(pt1, pt2);
        if (Math.abs(dDistance) < _dDelta) {
            return 0.0;
        } else {
            var dCosineTheta = (Math.abs(pt1.x - pt2.x)) / dDistance;
            if (pt1.x < pt2.x) {
                return dCosineTheta;
            } else {
                return -dCosineTheta;
            }
        }
    }

    var globalViewerId = 1;

    function newViewerId() {
        globalViewerId++;
        return "viewer_" + globalViewerId;
    }

    /*********************************
	 * the overlay definition
	 */

    var overlaySetting = {
        color: colors.white,
        font: 'Times New Roman',
        fontSize: 17
    };

    function overlay(tag, pos, prefix) {
        this.group = tag.group;
        this.element = tag.element;
        this.position = pos;
        this.prefix = prefix;
        this.ptStart = { x: 0, y: 0 };
        this.isCreated = false;
        this.type = annType.overlay;
    }

    overlay.prototype.create = function (viewer) {
        if (this.isCreated) {
            return;
        }

        this.parent = viewer;
        this.id = viewer._newObjectId();

        var fontSize = overlaySetting.fontSize;
        var v1 = Math.floor(this.position / 4);//0,1,2,3
        var v2 = this.position % 4;//0,1,2,3

        if (v1 % 2 == 0) {//left
            this.ptStart.x = 5;
        } else {
            this.ptStart.x = viewer.canvas.width - 150;
        }

        if (v1 < 2) {//top
            this.ptStart.y = (v2 + 1) * fontSize;
        } else {
            this.ptStart.y = viewer.canvas.height - (fontSize + (3 - v2) * fontSize);
        }

        var idLbl = this.id + "_ol";
        var font = "{0}px {1}".format(overlaySetting.fontSize, overlaySetting.font);
        jc.text(this.prefix, this.ptStart.x, this.ptStart.y).id(idLbl).layer(viewer.olLayerId).color(colors.white).font(font);
        this.label = jc('#' + idLbl);

        this.isCreated = true;
    }

    overlay.prototype.updateString = function (value) {
        if (this.label) {
            if (this.prefix) {
                value = this.prefix + ': ' + value;
            }

            this.label.string(value);
        }
    }

    /**********************************
    * the dicomFile clas
    */

    function dicomFile() {
        this.id = undefined;
        this.imgDataUrl = undefined;
        this.imgWidth = 0;
        this.imgHeight = 0;
        this.windowWidth = 0;
        this.windowCenter = 0;
        this.dicomTags = [];
        this.overlayString = '';
        this.annotationString = '';
        this.transformString = '';
    }

    /*********************************
	 * the dicomViewer class
     localWL means whether to calculate WL at the client side, default is undefined (false)
	 */
    function dicomViewer(canvasId, localWL) {
        this.version = 1; //for serialize
        this.id = newViewerId();
        this.canvasId = canvasId;
        this.localWL = !!localWL;

        this.annotationList = [];
        this.overlayList = [];
        this.dicomTagList = [];

        this.isReady = false;
        this.curContext = viewContext.pan;
        this.curSelectObj = undefined;

        this.eventHandlers = {};
        this._objectIndex = 0;
        
        var dv = this;
        this.canvas = document.getElementById(canvasId);
        this.canvas.oncontextmenu = function (evt) {
            dv.onContextMenu.call(dv, evt);
        };
        this.canvas.onmousewheel = function (evt) {
            dv.onMouseWheel.call(dv, evt);
        };

        jc.start(dv.canvasId, true);

        this.imgLayerId = this.id + '_imgLayer';
        this.olLayerId = this.id + '_overlayLayer';

        dv.imgLayer = jc.layer(dv.imgLayerId).down('bottom');
        dv.olLayer = jc.layer(dv.olLayerId).up('top');

        //register imglayer events
        dv.imgLayer.mousedown(function (arg) {
            dv.onMouseDown.call(dv, arg)
        });
        dv.imgLayer.mousemove(function (arg) {
            dv.onMouseMove.call(dv, arg)
        });
        dv.imgLayer.mouseup(function (arg) {
            dv.onMouseUp.call(dv, arg)
        });
        dv.imgLayer.click(function (arg) {
            dv.onClick.call(dv, arg)
        });
    }

    dicomViewer.prototype._newObjectId = function () {
        this._objectIndex++;
        return this.id + "_obj_" + this._objectIndex;
    }

    dicomViewer.prototype.load = function (dicomFile, callBack) {
        this.dicomFile = dicomFile;
        this.imgWidth = dicomFile.imgWidth;
        this.imgHeight = dicomFile.imgHeight;
        this.windowCenter = dicomFile.windowCenter;
        this.windowWidth = dicomFile.windowWidth;
        this.imgDataUrl = dicomFile.imgDataUrl;
        this.dicomTagList = dicomFile.dicomTags;

        //TODO: annotation list, transform form dicomFile, etc. (overlay is viewer-releated, not image-releated)

        var dv = this;
        this.adjustWL(this.windowWidth, this.windowCenter, function () {
            if (callBack) {
                callBack.call(dv);
            }
            
            dv.draggable(true);
            dv.isReady = true;

            dv.bestFit();//TODO:should read last time's transform and apply them
        });
    }

    dicomViewer.prototype.save = function () {
        dicomFile.version = this.version;
        dicomFile.windowWidth = this.windowWidth;
        dicomFile.windowCenter = this.windowCenter;
        
        dicomFile.serializeJSON = this.serialize();
        
        return dicomFile;
    }

    dicomViewer.prototype.adjustWL = function (windowWidth, windowCenter, callback) {
        var dv = this;
        if (!this._imgData) {//used to accept the image data
            this._imgData = new Uint8ClampedArray(this.imgWidth * this.imgHeight * 4);
        }

        dv._adjustWLCallback = callback;

        if (this.localWL) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', dv.imgDataUrl, true);
            xhr.responseType = 'arraybuffer';

            xhr.onload = function (e) {
                if (this.status == 200) {
                    //get binary data as a response
                    dv.pixelData = new Uint16Array(this.response);
                    dv._adjustWLLocal(windowWidth, windowCenter);
                } else {
                    alert('failed to get image data');
                }
            };

            xhr.send();
        } else {
            this._getImgPixelData(windowWidth, windowCenter);
        }
    }

    dicomViewer.prototype._requestJpgImg = function (request) {
        var dv = this;

        console.log(new Date().toLocaleTimeString() + ': start request image file,' + request.windowWidth + ',' + request.windowCenter);

        var imgDataUrl = dv.imgDataUrl;
        imgDataUrl += "?windowWidth=" + request.windowWidth + "&windowCenter=" + request.windowCenter;

        var img = new Image();
        img.onload = function () {
            dv._reloadImgWithWL(img, request.windowWidth, request.windowCenter, dv._adjustWLCallback);

            console.log(new Date().toLocaleTimeString() + ':finish load imgData: ' + request.windowWidth + "," + request.windowCenter);
            dv._imgDataWorker.isBusy = false;

            if (dv._imgDataRequest.length > 0) {
                var req = dv._imgDataRequest.pop();

                console.log('pop request and do it: ' + req.windowWidth + ',' + req.windowCenter);
                dv._requestJpgImg(req);
                dv._imgDataRequest = [];
            }
        }

        img.src = imgDataUrl;
    }

    dicomViewer.prototype._getImgPixelData = function (windowWidth, windowCenter) {
        var dv = this;

        //directly get image data
        if (!dv._helpCanvas) {
            dv._helpCanvas = document.createElement('canvas');
        }

        if (!this._imgDataWorker) {
            this._imgDataWorker = {};
            this._imgDataRequest = [];
            this._imgDataWorker.isBusy = false;
        }

        var request = { 'windowWidth': windowWidth, 'windowCenter': windowCenter, 'imgDataUrl': dv.imgDataUrl };
        if (dv._imgDataWorker.isBusy) {
            console.info('push request: ' + windowWidth + ',' + windowCenter);
            this._imgDataRequest.push(request);
        } else {
            this._requestJpgImg(request);
            dv._imgDataWorker.isBusy = true;
        }
    }

    //with worker
    dicomViewer.prototype._adjustWLFromServer = function (windowWidth, windowCenter) {
        var dv = this;
        var worker = this._imgDataWorker;
        if (!this._imgDataWorker) {
            var workerJs;
            var sc = document.getElementsByTagName("script");
            for (idx = 0; idx < sc.length; idx++) {
                s = sc.item(idx);
                if (s.src && s.src.match(/imgDataWorker\.js$/)) {
                    workerJs = s.src;
                    break;
                }
            }

            this._imgDataRequest = [];
            this._imgDataWorker = new Worker(workerJs);
            this._imgDataWorker.isBusy = false;

            this._imgDataWorker.addEventListener('message', function (msg) {
                var grayData = new Uint8ClampedArray(msg.data.grayData);
                var windowWidth = msg.data.windowWidth, windowCenter = msg.data.windowCenter,
                    width = dv.imgWidth, height = dv.imgHeight,
                    success = msg.data.success;
                dv._imgData = grayData;

                if (!success) {
                    console.log('failed to request imgdata.')
                    return;
                }

                if (!window.createImageBitmap) {//IE
                    if (!dv._helpCanvas) {
                        dv._helpCanvas = document.createElement('canvas');
                    }
                    var canvas = dv._helpCanvas;
                    canvas.width = width;
                    canvas.height = height,
                    ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, width, height);

                    var imageData = ctx.createImageData(width, height);
                    imageData.data.set(grayData);
                    ctx.putImageData(imageData, 0, 0);

                    dv._reloadImgWithWL(canvas, windowWidth, windowCenter, dv._adjustWLCallback);
                } else {
                    var imageData = new ImageData(grayData, width, height);
                    var a = createImageBitmap(imageData, 0, 0, width, height);

                    Promise.all([createImageBitmap(imageData, 0, 0, width, height)]).then(function (sprites) {
                        var imgBitmap = sprites[0];
                        dv._reloadImgWithWL(imgBitmap, windowWidth, windowCenter, dv._adjustWLCallback);
                    });
                }

                console.log('finish imgData: ' + windowWidth + "," + windowCenter);
                dv._imgDataWorker.isBusy = false;

                if (dv._imgDataRequest.length > 0) {
                    var req = dv._imgDataRequest.pop();
                    req['grayData'] = dv._imgData.buffer;
                    console.log('pop request and do it: ' + req.windowWidth + ',' + req.windowCenter);
                    dv._imgDataWorker.postMessage(req, [dv._imgData.buffer]);
                    dv._imgDataWorker.isBusy = true;

                    dv._imgDataRequest = [];
                }
            }, false);
        }

        var request = { 'windowWidth': windowWidth, 'windowCenter': windowCenter, 'imgDataUrl': dv.imgDataUrl };
        request['grayData'] = dv._imgData.buffer;
        if (this._imgDataWorker.isBusy) {
            console.info('push request: ' + request.windowWidth + ',' + request.windowCenter);
            this._imgDataRequest.push(request);
        } else {
            this._imgDataWorker.postMessage(request, [dv._imgData.buffer]);
            dv._imgDataWorker.isBusy = true;
        }
    }

    //not with worker
    dicomViewer.prototype._adjustWLFromServer2 = function (request) {
        var dv = this;

        console.log(new Date().toLocaleTimeString() + ': start request pixel data,' + request.windowWidth + ',' + request.windowCenter);

        var imgDataUrl = dv.imgDataUrl;
        imgDataUrl += "?windowWidth=" + request.windowWidth + "&windowCenter=" + request.windowCenter;

        var xhr = new XMLHttpRequest();
        xhr.open('GET', imgDataUrl, true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = function (e) {
            if (this.status == 200) {

                console.log(new Date().toLocaleTimeString() + ': end request pixel data');
                dv._imgData = new Uint8ClampedArray(this.response);
                // get binary data as a response
                //var bytes = new Uint8Array(this.response);
                //var len = bytes.length;
                ////grayData = bytes;
                //var curValue, index;
                //for (var i = 0; i < len; i++) {
                //    curValue = bytes[i];
                //    index = 4 * i;
                //    dv._imgData[index] = curValue;
                //    dv._imgData[index + 1] = curValue;
                //    dv._imgData[index + 2] = curValue;
                //    dv._imgData[index + 3] = 255;
                //}

                console.log(new Date().toLocaleTimeString() + ': start load image');

                var canvas = dv._helpCanvas, width = dv.imgWidth, height = dv.imgHeight;
                canvas.width = width;
                canvas.height = height,
                ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, width, height);

                var imageData = ctx.createImageData(width, height);
                imageData.data.set(dv._imgData);
                ctx.putImageData(imageData, 0, 0);

                dv._reloadImgWithWL(canvas, request.windowWidth, request.windowCenter, dv._adjustWLCallback);

                delete dv._imgData;
                dv._imgData = undefined;//release the buff

                console.log(new Date().toLocaleTimeString() + ':finish load imgData: ' + request.windowWidth + "," + request.windowCenter);
                dv._imgDataWorker.isBusy = false;

                if (dv._imgDataRequest.length > 0) {
                    var req = dv._imgDataRequest.pop();

                    console.log('pop request and do it: ' + req.windowWidth + ',' + req.windowCenter);
                    dv._requestPixelData(req);
                    dv._imgDataWorker.isBusy = true;

                    dv._imgDataRequest = [];
                }
            } else {

            }
        };

        xhr.send();
    }

    dicomViewer.prototype._adjustWLLocal = function (windowWidth, windowCenter) {
        var dv = this;

        if (!this._wlWorker) {
            var workerJs;
            var sc = document.getElementsByTagName("script");
            for (idx = 0; idx < sc.length; idx++) {
                s = sc.item(idx);
                if (s.src && s.src.match(/wlWorker\.js$/)) {
                    workerJs = s.src;
                    break;
                }
            }

            this._wlReqeust = [];
            this._wlWorker = new Worker(workerJs);
            this._wlWorker.isBusy = false;

            this._wlWorker.addEventListener('message', function (msg) {
                dv.pixelData = new Uint16Array(msg.data.pixelData);
                var grayData = new Uint8ClampedArray(msg.data.grayData);
                var width = msg.data.width, height = msg.data.height, windowWidth = msg.data.windowWidth, windowCenter = msg.data.windowCenter;
                dv._imgData = grayData;

                if (!window.createImageBitmap) {//IE
                    if (!dv._helpCanvas) {
                        dv._helpCanvas = document.createElement('canvas');
                    }
                    var canvas = dv._helpCanvas;
                    canvas.width = width;
                    canvas.height = height,
                    ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, width, height);

                    var imageData = ctx.createImageData(width, height);
                    imageData.data.set(grayData);
                    ctx.putImageData(imageData, 0, 0);

                    dv._reloadImgWithWL(canvas, windowWidth, windowCenter, dv._adjustWLCallback);
                } else {
                    var imageData = new ImageData(grayData, width, height);
                    var a = createImageBitmap(imageData, 0, 0, width, height);

                    Promise.all([createImageBitmap(imageData, 0, 0, width, height)]).then(function (sprites) {
                        var imgBitmap = sprites[0];
                        dv._reloadImgWithWL(imgBitmap, windowWidth, windowCenter, dv._adjustWLCallback);
                    });
                }

                console.log('finish adjustWL: ' + windowWidth + "," + windowCenter);
                dv._wlWorker.isBusy = false;

                if (dv._wlReqeust.length > 0) {
                    var req = dv._wlReqeust.pop();
                    req['pixelData'] = dv.pixelData.buffer;
                    req['grayData'] = dv._imgData.buffer;
                    console.log('pop request and do it: ' + req.windowWidth + ',' + req.windowCenter);
                    dv._wlWorker.postMessage(req, [dv.pixelData.buffer, dv._imgData.buffer]);
                    dv._wlWorker.isBusy = true;

                    dv._wlReqeust = [];
                }

            }, false);
        }

        var request = {'windowWidth': windowWidth, 'windowCenter': windowCenter, 'width': this.imgWidth, 'height': this.imgHeight };
        request['pixelData'] = dv.pixelData.buffer;
        request['grayData'] = dv._imgData.buffer;
        if (this._wlWorker.isBusy) {
            console.info('push request: ' + request.windowWidth + ',' + request.windowCenter);
            this._wlReqeust.push(request);
        } else {
            this._wlWorker.postMessage(request, [dv.pixelData.buffer, dv._imgData.buffer]);
            dv._wlWorker.isBusy = true;
        }        
    }

    dicomViewer.prototype._reloadImgWithWL = function (imgData, windowWidth, windowCenter, callback) {
        var dv = this;
        if (dv.jcImage) {
            dv.jcImage.del();
        }

        if (!imgData.src) {
            imgData.src = 'mock';//in order to make JC work
        }
        
        var imgId = dv.id + "_img_" + dv._newObjectId();
        jc.image(imgData).id(imgId).layer(dv.imgLayerId).down('bottom');
        dv.jcImage = jc('#' + imgId);

        dv.windowWidth = windowWidth;
        dv.windowCenter = windowCenter;
        dv.updateTag(dicomTag.windowWidth, dv.windowWidth);
        dv.updateTag(dicomTag.windowCenter, dv.windowCenter);

        if (!!callback) {
            callback.call(dv);
        }
    }

    dicomViewer.prototype.registerEvent = function (obj, type) {
        if (!this.eventHandlers[type]) {
            this.eventHandlers[type] = [];
        }

        var handlers = this.eventHandlers[type];
        var len = handlers.length,
			i;

        for (i = 0; i < len; i++) {
            if (handlers[i] === obj) {
                return; //exists already
            }
        }

        handlers.push(obj);
    }

    dicomViewer.prototype.unRegisterEvent = function (obj, type) {
        if (!this.eventHandlers[type]) {
            return;
        }

        var handlers = this.eventHandlers[type];
        var len = handlers.length,
			i, found = false;

        for (i = 0; i < len; i++) {
            if (handlers[i] === obj) {
                found = true;
                break;
            }
        }

        if (found) {
            handlers.splice(i, 1);
        }
    }

    dicomViewer.prototype._handleEvent = function (arg, type, handler) {
        if (!this.isReady) {
            return;
        }
        var handlers = this.eventHandlers[type]
        if (!handlers || handlers.length == 0) {
            return;
        }

        if (arg.x) {
            arg = screenToImage(arg, this.imgLayer.transform());
        }

        handlers.forEach(function (obj) {
            if (obj[handler]) {
                obj[handler](arg);
            }
        });
    }

    dicomViewer.prototype.onKeyPress = function (key) {
        if (!this.isReady) {
            return;
        }
        alert(key.code);
    }

    dicomViewer.prototype.onClick = function (evt) {
        if (!this.isReady) {
            return;
        }
        this._handleEvent(evt, eventType.click, 'onClick');
    }

    dicomViewer.prototype.onMouseDown = function (evt) {
        if (!this.isReady) {
            return;
        }
        //if in select context, and not click any object, will unselect all objects.
        if (this.curContext == viewContext.select) {
            if (!evt.event.cancelBubble) {
                if (this.curSelectObj && this.curSelectObj.setEdit) {
                    this.curSelectObj.setEdit(false);
                    this.curSelectObj = undefined;
                }

                this.draggable(true);
            } else {
                this.draggable(false);
            }
        }

        if (!evt.event.cancelBubble && this.curContext == viewContext.select) {

            if (this.curSelectObj && this.curSelectObj.setEdit) {
                this.curSelectObj.setEdit(false);
            }
        }

        this._handleEvent(evt, eventType.mouseDown, 'onMouseDown');
    }

    dicomViewer.prototype.onMouseMove = function (evt) {
        if (!this.isReady) {
            return;
        }
        this._handleEvent(evt, eventType.mouseMove, 'onMouseMove');
    }

    dicomViewer.prototype.onMouseUp = function (evt) {
        if (!this.isReady) {
            return;
        }
        this._handleEvent(evt, eventType.mouseUp, 'onMouseUp');
    }

    dicomViewer.prototype.onMouseWheel = function (evt) {
        if (!this.isReady) {
            return;
        }
        var scaleValue = 1;
        if (evt.wheelDelta / 120 > 0) {
            //up
            scaleValue = 0.9;
        } else { //down
            scaleValue = 1.1;
        }

        var ptPrevious = this.imgLayer.getCenter();
        this.imgLayer.scale(scaleValue);
        var ptNow = this.imgLayer.getCenter();

        this.imgLayer.translate(ptPrevious.x - ptNow.x, ptPrevious.y - ptNow.y);
        this.updateTag(dicomTag.customScale, Math.round(this.getScale() * 100) / 100);

        //adjust objects' size
        this.annotationList.forEach(function (obj) {
            if (obj.onScale) {
                obj.onScale();
            }
        });

        this._handleEvent(scaleValue, eventType.mouseWheel, 'onMouseWheel');

        evt.stopImmediatePropagation();
        evt.stopPropagation();
        evt.preventDefault();
    }

    dicomViewer.prototype.onContextMenu = function (evt) {
        if (!this.isReady) {
            return;
        }
        if (this.curContext == viewContext.create) {
            this.setContext(viewContext.select);
        }
        //todo: add context menus

        evt.stopImmediatePropagation();
        evt.stopPropagation();
        evt.preventDefault();
    }

    dicomViewer.prototype.draggable = function (draggable) {

        var dv = this;
        var canvas = this.canvas;

        this.imgLayer.draggable({
            disabled: !draggable,
            drag: dv.onDragImage ? dv.onDragImage : function (arg) { },
            start: function (arg) {
                canvas.style.cursor = "move";
            },
            stop: function (arg) {
                canvas.style.cursor = "default";
            }
        });
    }

    dicomViewer.prototype.setPanModel = function () {
        this.setContext(viewContext.pan);
    }

    dicomViewer.prototype.setSelectModel = function () {
        this.setContext(viewContext.select);
    }

    dicomViewer.prototype.setContext = function (ctx) {
        var lastContext = this.curContext;

        if (lastContext !== ctx) {
            var draggable = (ctx == viewContext.pan) || (ctx == viewContext.sele && this.curSelectObj == null);
            this.draggable(draggable);

            this.curContext = ctx;
            this.selectObject(undefined);
        }
    }

    dicomViewer.prototype.setDicomTags = function (tagList) {
        this.dicomTagList = tagList;

        //tags value maybe changed, redraw overlay
        this.refreshOverlay();
    }

    dicomViewer.prototype.updateTag = function (tag, value) {
        var i = 0, len = this.dicomTagList.length, found = false;
        for (i = 0; i < len; i++) {
            var tagE = this.dicomTagList[i];
            if (tagE.group == tag.group && tagE.element == tag.element) {
                tagE.value = value;
                found = true;
                break;
            }
        }

        if (!found) {
            this.dicomTagList.push(new dicomTag(tag.group, tag.element, value));
        }

        this.refreshOverlay();
    }

    dicomViewer.prototype.addOverlay = function (tag, pos, prefix) {
        var ol = new overlay(tag, pos, prefix);
        this.overlayList.push(ol);

        this.refreshOverlay();
    }

    dicomViewer.prototype.refreshOverlay = function () {
        var i = 0, len = this.overlayList.length;
        for (i = 0; i < len; i++) {
            var ol = this.overlayList[i];

            if (!ol.isCreated) {
                ol.create(this);
            }

            //find the tag
            var theTag = undefined;
            var j = 0, len2 = this.dicomTagList.length;
            for (j = 0; j < len2; j++) {
                var tag = this.dicomTagList[j];
                if (tag.group == ol.group && tag.element == ol.element) {
                    theTag = tag;
                    break;
                }
            }

            var value = '';
            if (theTag) {
                value = theTag.value;
            }

            ol.updateString(value);
        }
    }

    dicomViewer.prototype.selectObject = function (obj) {
        if (obj && obj instanceof annObject) {

            this.curSelectObj = obj;

            //set all other obj not in edit status
            this.annotationList.forEach(function (otherObj) {
                if (otherObj !== obj) {
                    otherObj.setEdit(false);
                } else {
                    otherObj.setEdit(true);
                }
            });
        } else {
            if (this.curSelectObj) {
                if (this.curSelectObj.isCreated) {
                    this.curSelectObj.setEdit(false);
                } else {
                    this.curSelectObj.del();
                }
            }

            this.curSelectObj = undefined;
        }
    }

    dicomViewer.prototype.deleteObject = function (obj) {
        if (obj && obj instanceof annObject) {
            obj.del();

            var i = 0,
				len = this.annotationList.length;
            for (i = 0; i < len; i++) {
                if (this.annotationList[i] === obj) {
                    found = true;
                    break;
                }
            }

            if (found) {
                this.annotationList.splice(i, 1);
                if (this.curSelectObj === obj) {
                    this.curSelectObj = undefined;
                }
            }
        }
    }

    dicomViewer.prototype.createRect = function () {
        var aRect = new annRect(this);
        this.setContext(viewContext.create);

        this.curSelectObj = aRect;
        aRect.startCreate();

        return aRect;
    }

    dicomViewer.prototype.createLine = function () {
        var aLine = new annLine(this);
        this.setContext(viewContext.create);

        this.curSelectObj = aLine;
        aLine.startCreate();

        return aLine;
    }

    dicomViewer.prototype._onObjectCreated = function (obj) {
        if (obj && obj.isCreated) {
            //finish create
            this.annotationList.push(obj);
            this.curContext = viewContext.select;
            this.selectObject(obj);
        }
    }

    dicomViewer.prototype.rotate = function (angle) {
        if (angle > 0) {
            this.imgLayer.rotate(angle, 'center');
        }
    }

    dicomViewer.prototype.scale = function (value) {
        if (value > 0) {
            this.imgLayer.scale(value);
            this.updateTag(dicomTag.customScale, Math.round(this.getScale() * 100) / 100);
        }
    }

    dicomViewer.prototype.getScale = function () {
        var scale = this.imgLayer.optns.scaleMatrix[0][0];
        if (scale < 0.1) {
            scale = 0.1
        };

        return scale;
    }

    dicomViewer.prototype.reset = function (value) {
        this.imgLayer.transform(1, 0, 0, 1, 0, 0, true);
        this.updateTag(dicomTag.customScale, Math.round(this.getScale()*100)/100);

        //adjust objects' size
        this.annotationList.forEach(function (obj) {
            if (obj.onScale) {
                obj.onScale();
            }
        });
    }

    dicomViewer.prototype.bestFit = function () {
        var imgWidth = this.imgWidth,
			imgHeight = this.imgHeight,
			canvasWidth = this.canvas.width,
			canvasHeight = this.canvas.height;
        var widthScale = canvasWidth / imgWidth,
			heightScale = canvasHeight / imgHeight;

        this.reset();
        if (widthScale < heightScale) {
            this.imgLayer.scale(widthScale);
            //this.imgLayer._y = (canvasHeight - imgHeight * widthScale) / 2;
            this.imgLayer.translate(0, (canvasHeight - imgHeight * widthScale) / 2);
        } else {
            this.imgLayer.scale(heightScale);
            //this.imgLayer._x = (canvasWidth - imgWidth * heightScale) / 2;
            this.imgLayer.translate((canvasWidth - imgWidth * heightScale) / 2, 0);
        }

        this.updateTag(dicomTag.customScale, Math.round(this.getScale() * 100) / 100);
        this.annotationList.forEach(function (obj) {
            if (obj.onScale) {
                obj.onScale();
            }
        });
    }

    //serialize to json string
    dicomViewer.prototype.serialize = function () {
        //1.annotation list
        //2.transform
        //3.window width/center => to tags
        var str = "{'version':{0},'annObjects':{1},'transForm':{2}, 'scaleMatrix':{3}, 'rotateMatrix':{4}, 'translateMatrix':{5}}";

        var strAnnObjs = "[";
        if (this.annotationList) {
            var i = 0,
				len = this.annotationList.length;
            for (i = 0; i < len; i++) {
                strAnnObjs += this.annotationList[i].serialize();
                if (i < len - 1) {
                    strAnnObjs += ",";
                }
            }
        }
        strAnnObjs += "]";

        var transImg = this.imgLayer.transform();
		var strTrans = JSON.stringify(transImg);
		this._logTransformInfo();
		
		var strScaleMatrix = JSON.stringify(this.imgLayer.optns.scaleMatrix);
		var strRotateMatrix = JSON.stringify(this.imgLayer.optns.rotateMatrix);
		var strTranslateMatrix = JSON.stringify(this.imgLayer.optns.translateMatrix);

        str = str.format(this.version, strAnnObjs, strTrans, strScaleMatrix, strRotateMatrix, strTranslateMatrix);
        return str;
    }

	dicomViewer.prototype._logTransformInfo = function(){
        var transImg = this.imgLayer.transform();
		var strTrans = JSON.stringify(transImg);

		console.info('transform:' + strTrans);
		console.info('scaleMatrix:' + JSON.stringify(this.imgLayer.optns.scaleMatrix) );
		console.info('rotateMatrix:' + JSON.stringify(this.imgLayer.optns.rotateMatrix) );
		console.info('translateMatrix:' + JSON.stringify(this.imgLayer.optns.translateMatrix) );
	}
	
    dicomViewer.prototype.deSerialize = function (strJSON) {
        var jsonObj = (new Function("return " + strJSON))();
        if (jsonObj) {
            var dv = this;
            var version = jsonObj.version;
            var annObjs = jsonObj.annObjects;
            var trans = jsonObj.transForm;
			var scaleMatrix = jsonObj.scaleMatrix;
			var rotateMatrix = jsonObj.rotateMatrix;
			var translateMatrix = jsonObj.translateMatrix;
			
			var trans11 = trans[0][0],//x scale
				trans21 = trans[0][1],//x rotate
				transdx = trans[0][2],
				trans12 = trans[1][0],//y rotate
				trans22 = trans[1][1],//y scale
				transdy = trans[1][2];
			
            //this.imgLayer.transform(trans11, trans12, trans21, trans22, transdx, transdy, true);

			this.imgLayer.transform(1,0,0,1,0,0, true);

			this.imgLayer.optns.scaleMatrix = scaleMatrix;
			this.imgLayer.optns.rotateMatrix = rotateMatrix;
			this.imgLayer.optns.translateMatrix = translateMatrix;
			//this.imgLayer.optns.redraw = 1;
			this.scale(1);
			
			this._logTransformInfo();
			
            annObjs.forEach(function (obj) {
                var type = obj.type;
                switch (type) {
                    case annType.rect:
                        new annRect(dv).deSerialize(obj);
                        break;
                    case annType.line:
                        new annLine(dv).deSerialize(obj);
                        break;
                    default:
                        break;
                }
            });

            dv.selectObject();//select no-object
        }
    }

    /*********************************
	 * the annObject class
	 */
    annType = {
        unknown: 0,
        overlay: 1,
        line: 2,
        rect: 3
    }

    function annObject() {
        this.parent = undefined;
        this.type = annType.unknown;
        this.isInEdit = false;
        this.isCreated = false;
    }
    
    //set child jcObject's common mouse event hander, etc.
    annObject.prototype._setChildMouseEvent = function (jcObj, overStyle) {
        var dv = this.parent;
        var annObj = this;

        if (!overStyle) {
            overStyle = 'pointer';
        }

        jcObj.mouseover(function (arg) {
            if (dv.curContext == viewContext.select)
                dv.canvas.style.cursor = overStyle;
        });

        jcObj.mouseout(function () {
            if (dv.curContext == viewContext.select)
                dv.canvas.style.cursor = 'default';
        });

        jcObj.mousedown(function (arg) {
            if (dv.curContext == viewContext.select) {
                dv.selectObject(annObj);

                arg.event.cancelBubble = true;
            }
        });
    }

    annObject.prototype._setChildDraggable = function (jcObj, draggable, onDrag) {
        if(!jcObj){
        	return;
        }
        
        var dv = this.parent;
        var annObj = this;
        //var transTmp = dv.imgLayer.transform();
		
        jcObj.draggable({
            disabled: !draggable,
            start: function (arg) {
                this._lastPos = {};
            },
            stop: function (arg) {
                this._lastPos = {};
            },
            drag: function (arg) {
                //ptImg is mouse position, not the object's start position
                //don't translate any annObject, always keep annObject's transform is clear.
				var transTmp = dv.imgLayer.transform();
                var ptImg = screenToImage(arg, transTmp);

                if (typeof (this._lastPos.x) != 'undefined') {
                    var deltaX = ptImg.x - this._lastPos.x;
                    var deltaY = ptImg.y - this._lastPos.y;

                    this._x += deltaX;
                    this._y += deltaY;

                    if (onDrag) {
                        onDrag.call(annObj, deltaX, deltaY);
                    }
                }

                this._lastPos = {
                    x: ptImg.x,
                    y: ptImg.y
                };
                return true;
            }
        });
    }

    annObject.prototype._translateChild = function (child, deltaX, deltaY) {
        if (child) {
            child._x += deltaX;
            child._y += deltaY;
        }
    }

    /*********************************
	 * the annArrow class
	 */

    function annArrow(viewer) {
        annObject.call(this);
        this.parent = viewer;
        this.id = viewer._newObjectId();
    }

    annArrow.prototype = new annObject();

    //ptEnd points to the target, will with arrow
    annArrow.prototype.reDraw = function (ptStart, ptEnd) {
        this.ptStart = ptStart;
        this.ptEnd = ptEnd;
        var dv = this.parent;
        var scale = dv.getScale();

        if (!this.line) {
            var idLine = this.id + '_line';
            jc.line([
					[ptStart.x, ptStart.y],
					[ptEnd.x, ptEnd.y]
            ]).id(idLine).layer(dv.imgLayerId).color(colors.white);
            this.line = jc('#' + idLine);
        } else {
            this.line.points([
				[ptStart.x, ptStart.y],
				[ptEnd.x, ptEnd.y]
            ]);
        }

        var sineTheta = getSineTheta(ptEnd, ptStart);
        var cosineTheta = getCosineTheta(ptEnd, ptStart);

        var dArrowLength = 10 / scale;

        var ptNodeA = {}, ptNodeB = {};
        ptNodeA.x = ptEnd.x + dArrowLength * cosineTheta - dArrowLength / 2.0 * sineTheta;
        ptNodeA.y = ptEnd.y + dArrowLength * sineTheta + dArrowLength / 2.0 * cosineTheta;

        ptNodeB.x = ptEnd.x + dArrowLength * cosineTheta + dArrowLength / 2.0 * sineTheta;
        ptNodeB.y = ptEnd.y + dArrowLength * sineTheta - dArrowLength / 2.0 * cosineTheta;

        if (!this.arrowLineA) {
            jc.line([
				[ptEnd.x, ptEnd.y],
				[ptNodeA.x, ptNodeA.y]
            ]).id(this.id + "_arrowA").layer(dv.imgLayerId).color(colors.white);
            this.arrowLineA = jc('#' + this.id + "_arrowA");
        } else {
            this.arrowLineA.points([
				[ptEnd.x, ptEnd.y],
				[ptNodeA.x, ptNodeA.y]
            ]);
        }

        if (!this.arrowLineB) {
            jc.line([
				[ptEnd.x, ptEnd.y],
				[ptNodeB.x, ptNodeB.y]
            ]).id(this.id + "_arrowB").layer(dv.imgLayerId).color(colors.white);
            this.arrowLineB = jc('#' + this.id + "_arrowB");
        } else {
            this.arrowLineB.points([
				[ptEnd.x, ptEnd.y],
				[ptNodeB.x, ptNodeB.y]
            ]);
        }

        var lineWidth = Math.round(1 / scale);
        if (lineWidth < 0.2) {
            lineWidth = 0.2;
        }

        this.line._lineWidth = lineWidth;
        this.arrowLineA._lineWidth = lineWidth;
        this.arrowLineB._lineWidth = lineWidth;
    }

    annArrow.prototype.onScale = function () {
        this.reDraw(this.ptStart, this.ptEnd);
    }

    annArrow.prototype.del = function () {
        if (this.line) {
            this.line.del();
            this.line = undefined;
        }
        if (this.arrowLineA) {
            this.arrowLineA.del();
            this.arrowLineA = undefined;
        }
        if (this.arrowLineB) {
            this.arrowLineB.del();
            this.arrowLineB = undefined;
        }
    }

    annArrow.prototype.setEdit = function (edit) {
        this.isInEdit = edit;

        if (edit) {
            this.line.color(colors.red);
            this.arrowLineA.color(colors.red);
            this.arrowLineB.color(colors.red);
        } else {
            this.line.color(colors.white);
            this.arrowLineA.color(colors.white);
            this.arrowLineB.color(colors.white);
        }
    }

    /*********************************
	 * the annRect class
	 */

    function annRect(viewer) {
        annObject.call(this);
        this.type = annType.rect;
        this.parent = viewer;
        this.id = viewer._newObjectId();
    }

    annRect.prototype = new annObject();

    annRect.prototype.onMouseDown = function (arg) {
        if (this.curStep == stepEnum.step1) {
            this.ptStart = {
                x: arg.x,
                y: arg.y
            };
            this.curStep = stepEnum.step2;
        }
    }

    annRect.prototype.onMouseMove = function (arg) {
        var dv = this.parent;
        if (this.curStep == stepEnum.step2) {
            this.width = Math.abs(arg.x - this.ptStart.x);
            this.height = Math.abs(arg.y - this.ptStart.y);

            //create rect if not created
            if (!this.rect) {
                var rectId = dv._newObjectId();
                jc.rect(this.ptStart.x, this.ptStart.y, this.width, this.height).layer(dv.imgLayerId).id(rectId).color(colors.white);
                this.rect = jc('#' + rectId);

                this._setChildMouseEvent(this.rect);
            }

            this.rect._width = this.width;
            this.rect._height = this.height;

            if (!this.circleA) {
                var idCircleA = this.id + "_aCircle";
                jc.circle(this.ptStart.x, this.ptStart.y, 5).id(idCircleA).layer(dv.imgLayerId).color(colors.white);
                this.circleA = jc("#" + idCircleA);

                this._setChildMouseEvent(this.circleA, 'crosshair');
            }

            if (!this.label) {
                var idLbl = this.id + "_lbl";
                var lblPos = {
                    x: this.ptStart.x + 5,
                    y: this.ptStart.y - 30
                };
                jc.text('', lblPos.x, lblPos.y).id(idLbl).layer(dv.imgLayerId).color(colors.white).font('15px Times New Roman');
                this.label = jc('#' + idLbl);

                this._setChildMouseEvent(this.label);
            }

            if (!this.arrow) {
                this.arrow = new annArrow(dv);
            }

            this.reDraw();
        }
    }

    annRect.prototype.onMouseUp = function (arg) {
        var dv = this.parent;
        if (this.curStep == stepEnum.step2) {

            this.isCreated = true;
            dv._onObjectCreated(this);

            dv.unRegisterEvent(this, eventType.mouseDown);
            dv.unRegisterEvent(this, eventType.mouseMove);
            dv.unRegisterEvent(this, eventType.mouseUp);
        } else {
            this.curStep = stepEnum.step1;
        }
    }

    annRect.prototype.startCreate = function () {
        this.curStep = stepEnum.step1;
        var dv = this.parent;

        dv.registerEvent(this, eventType.mouseDown);
        dv.registerEvent(this, eventType.mouseMove);
        dv.registerEvent(this, eventType.mouseUp);
    }

    annRect.prototype.del = function () {
        var dv = this.parent;
        if (!this.isCreated) {
            dv.unRegisterEvent(this, eventType.mouseDown);
            dv.unRegisterEvent(this, eventType.mouseMove);
            dv.unRegisterEvent(this, eventType.mouseUp);
        }

        if (this.rect) {
            this.rect.del();
            this.rect = undefined;
        }

        if (this.circleA) {
            this.circleA.del();
            this.circleA = undefined;
        }

        if (this.label) {
            this.label.del();
            this.label = undefined;
        }
        if (this.arrow) {
            this.arrow.del();
            this.arrow = undefined;
        }
    }

    annRect.prototype.setEdit = function (edit) {
        this.isInEdit = edit;
        this.setDraggable(edit);
        this.circleA.visible(edit);

        if (edit) {
            this.rect.color(colors.red);
            this.label.color(colors.red);
            this.circleA.color(colors.red);
        } else {
            this.rect.color(colors.white);
            this.label.color(colors.white);
            this.circleA.color(colors.white);
        }

        this.arrow.setEdit(edit);
    }

    annRect.prototype.reDraw = function () {
        var size = 2 * (this.width + this.height);
        size = Math.round(size * 100) / 100;
        var msg = "size=" + size;

        this.label.string(msg);

        this.arrow.reDraw({ x: this.label._x, y: this.label._y }, this.ptStart);

        this.onScale();
    }

    annRect.prototype.onScale = function () {
        var scale = this.parent.getScale();

        //change label font size
        var fontSize = Math.round(15 / scale);
        if (fontSize < 10) {
            fontSize = 10;
        }

        var font = "{0}px Times New Roman".format(fontSize);
        this.label.font(font);

        //change circle radius
        var radius = Math.round(5 / scale);
        if (radius < 1) {
            radius = 1;
        }

        this.circleA._radius = radius;

        //change line size
        var lineWidth = Math.round(1 / scale);
        if (lineWidth < 0.2) {
            lineWidth = 0.2;
        }
        this.circleA._lineWidth = lineWidth;
        this.rect._lineWidth = lineWidth;

        this.arrow.onScale();
    }

    annRect.prototype.setDraggable = function (draggable) {
        var aRect = this;

        this._setChildDraggable(this.rect, draggable, function (deltaX, deltaY) {
            aRect._translateChild(aRect.circleA, deltaX, deltaY);
            aRect._translateChild(aRect.label, deltaX, deltaY);
            aRect.ptStart = {
                x: aRect.rect._x,
                y: aRect.rect._y
            };

            aRect.reDraw();
        });

        this._setChildDraggable(this.circleA, draggable, function (deltaX, deltaY) {
            aRect._translateChild(aRect.rect, deltaX, deltaY);
            aRect.rect._width -= deltaX;
            aRect.rect._height -= deltaY;

            aRect.ptStart = {
                x: aRect.rect._x,
                y: aRect.rect._y
            };

            aRect.width = aRect.rect._width;
            aRect.height = aRect.rect._height;

            aRect._translateChild(aRect.label, deltaX, deltaY);
            aRect.reDraw();
        });

        this._setChildDraggable(this.label, draggable, function (deltaX, deltaY) {
            aRect.reDraw();
        });
    }

    annRect.prototype.serialize = function () {
        var result = "{type:{4},ptStart:{x:{0},y:{1}},width:{2},height:{3}}";
        result = result.format(Math.round(this.ptStart.x), Math.round(this.ptStart.y), Math.round(this.width), Math.round(this.height), this.type);

        return result;
    }

    annRect.prototype.deSerialize = function (jsonObj) {
        if (jsonObj) {
            var ptStart = jsonObj.ptStart;
            var width = jsonObj.width;
            var height = jsonObj.height;

            this.startCreate();
            this.onMouseDown(ptStart);
            this.onMouseMove({
                x: ptStart.x + width,
                y: ptStart.y + height
            });
            this.onMouseUp();
        }
    }

    /*********************************
	 * the annLine class
	 */

    function annLine(viewer) {
        annObject.call(this);
        this.type = annType.line;
        this.parent = viewer;
        this.id = viewer._newObjectId();
    }

    annLine.prototype = new annObject();

    annLine.prototype.startCreate = function () {
        var dv = this.parent;
        this.curStep = stepEnum.step1;

        dv.registerEvent(this, eventType.click);
    }

    annLine.prototype.onClick = function (arg) {
        var dv = this.parent;

        if (this.isCreated) {
            return;
        }

        if (this.curStep == stepEnum.step1) {
            this.ptStart = {
                x: arg.x,
                y: arg.y
            };

            var radius = Math.round(5 / dv.getScale());
            if (radius < 1) {
                radius = 1;
            }

            var idCircleStart = this.id + '_c1';
            jc.circle(this.ptStart.x, this.ptStart.y, radius).id(idCircleStart).layer(dv.imgLayerId).color(colors.white);
            this.circleStart = jc('#' + idCircleStart);

            this.curStep = stepEnum.step2;
        } else if (this.curStep == stepEnum.step2) {
            this.ptEnd = {
                x: arg.x,
                y: arg.y
            };

            var idCircleEnd = this.id + '_c2';
            jc.circle(this.ptEnd.x, this.ptEnd.y, 5).id(idCircleEnd).layer(dv.imgLayerId).color(colors.white);
            this.circleEnd = jc('#' + idCircleEnd);

            var lineId = this.id + '_line';
            jc.line([
				[this.ptStart.x, this.ptStart.y],
				[this.ptEnd.x, this.ptEnd.y]
            ]).id(lineId).layer(dv.imgLayerId).color(colors.white);
            this.line = jc('#' + lineId);

            var idCircleM = this.id + '_cm';
            var ptMiddle = {};
            ptMiddle.x = (this.ptStart.x + this.ptEnd.x) / 2;
            ptMiddle.y = (this.ptStart.y + this.ptEnd.y) / 2;
            jc.circle(ptMiddle.x, ptMiddle.y, 5).id(idCircleM).layer(dv.imgLayerId).color(colors.white).opacity(0);
            this.circleMiddle = jc('#' + idCircleM);

            var idLbl = this.id + '_lbl';
            var lblPos = {
                x: ptMiddle.x,
                y: ptMiddle.y - 30
            };
            jc.text('', lblPos.x, lblPos.y).id(idLbl).layer(dv.imgLayerId).color(colors.white).font('15px Times New Roman');
            this.label = jc('#' + idLbl);

            this.arrow = new annArrow(this.parent);

            this.reDraw();

            this._setChildMouseEvent(this.circleStart, 'crosshair');
            this._setChildMouseEvent(this.circleEnd, 'crosshair');
            this._setChildMouseEvent(this.circleMiddle, 'crosshair');
            this._setChildMouseEvent(this.label);

            this.isCreated = true;
            dv._onObjectCreated(this);

            //unregister events
            dv.unRegisterEvent(this, eventType.click);
        }

        return;
    }

    annLine.prototype.del = function () {
        var dv = this.parent;
        if (!this.isCreated) {
            //unregister events
            dv.unRegisterEvent(this, eventType.click);
        }

        if (this.circleStart) {
            this.circleStart.del();
            this.circleStart = undefined;
        }
        if (this.circleEnd) {
            this.circleEnd.del();
            this.circleEnd = undefined;
        }
        if (this.circleMiddle) {
            this.circleMiddle.del();
            this.circleMiddle = undefined;
        }
        if (this.label) {
            this.label.del();
            this.label = undefined;
        }
        if (this.arrow) {
            this.arrow.del();
            this.arrow = undefined;
        }
        if (this.line) {
            this.line.del();
            this.line = undefined;
        }

        this.isCreated = false;
    }

    annLine.prototype.setEdit = function (edit) {
        this.isInEdit = edit;
        this.setDraggable(edit);

        if (edit) {
            this.line.color(colors.red);
            this.label.color(colors.red);
            this.circleStart.color(colors.red).opacity(1);
            this.circleEnd.color(colors.red).opacity(1);
            this.circleMiddle.color(colors.red).opacity(0);

        } else {
            this.line.color(colors.white);
            this.label.color(colors.white);
            this.circleStart.color(colors.white).opacity(0);
            this.circleEnd.color(colors.white).opacity(0);
            this.circleMiddle.color(colors.white).opacity(0);
        }

        this.arrow.setEdit(edit);
    }

    annLine.prototype.setDraggable = function (draggable) {
        var aLine = this;

        var cs = aLine.circleStart;
        var ce = aLine.circleEnd;
        var cm = aLine.circleMiddle;
        var lbl = aLine.label;

        this._setChildDraggable(cs, draggable, function (deltaX, deltaY) {
            aLine.ptStart = {
                x: cs._x,
                y: cs._y
            };
            aLine.reDraw();
        });

        this._setChildDraggable(ce, draggable, function (deltaX, deltaY) {
            aLine.ptEnd = {
                x: ce._x,
                y: ce._y
            };
            aLine.reDraw();
        });

        this._setChildDraggable(cm, draggable, function (deltaX, deltaY) {
            aLine._translateChild(cs, deltaX, deltaY);
            aLine._translateChild(ce, deltaX, deltaY);

            aLine.ptStart = {
                x: cs._x,
                y: cs._y
            };
            aLine.ptEnd = {
                x: ce._x,
                y: ce._y
            };

            aLine.reDraw();
        });

        this._setChildDraggable(lbl, draggable, function (deltaX, deltaY) {
            aLine.reDraw();
        });
    }

    annLine.prototype.reDraw = function () {
        var dv = this.parent;
        this.line.points([
			[this.ptStart.x, this.ptStart.y],
			[this.ptEnd.x, this.ptEnd.y]
        ]);

        var ptMiddle = {};
        ptMiddle.x = (this.ptStart.x + this.ptEnd.x) / 2;
        ptMiddle.y = (this.ptStart.y + this.ptEnd.y) / 2;
        this.circleMiddle._x = ptMiddle.x;
        this.circleMiddle._y = ptMiddle.y;

        var msg = "length: " + Math.round(countDistance(this.ptStart, this.ptEnd) * 100) / 100;
        this.label.string(msg);

        this.arrow.reDraw({ x: this.label._x, y: this.label._y }, ptMiddle);

        this.onScale();
    }

    annLine.prototype.onScale = function () {
        var dv = this.parent;
        var scale = dv.getScale();

        //change label font size
        var fontSize = Math.round(15 / scale);
        if (fontSize < 10) {
            fontSize = 10;
        }

        var font = "{0}px Times New Roman".format(fontSize);
        this.label.font(font);

        //change circle radius
        var radius = Math.round(5 / scale);
        if (radius < 1) {
            radius = 1;
        }

        this.circleStart._radius = radius;
        this.circleMiddle._radius = radius;
        this.circleEnd._radius = radius;

        //change line size
        var lineWidth = Math.round(1 / scale);
        if (lineWidth < 0.2) {
            lineWidth = 0.2;
        }
        this.circleStart._lineWidth = lineWidth;
        this.circleMiddle._lineWidth = lineWidth;
        this.circleEnd._lineWidth = lineWidth;
        this.line._lineWidth = lineWidth;

        this.arrow.onScale();
    }

    annLine.prototype.serialize = function () {
        var result = "{type: {4},ptStart:{x:{0},y:{1}},ptEnd:{x:{2},y:{3}}}";
        result = result.format(Math.round(this.ptStart.x), Math.round(this.ptStart.y), Math.round(this.ptEnd.x), Math.round(this.ptEnd.y), this.type);

        return result;
    }

    annLine.prototype.deSerialize = function (jsonObj) {
        if (jsonObj) {
            this.startCreate();
            var ptStart = jsonObj.ptStart;
            this.onClick(ptStart);
            var ptEnd = jsonObj.ptEnd;
            this.onClick(ptEnd);
        }
    }

    //export definitiens
    window.dicomViewer = dicomViewer;
    window.dicomTag = dicomTag;
    window.dicomFile = dicomFile;
    window.overlayPos = overlayPos;

})(window, undefined);