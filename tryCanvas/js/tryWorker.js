
self.onmessage = function (msg) {
    switch (msg.data.aTopic) {
        case 'do_sendWorkerArrBuff':
                sendWorkerArrBuff(msg.data.aBuf)
            break;
        default:
            throw 'no aTopic on incoming message to ChromeWorker';
    }
}

function sendWorkerArrBuff(aBuf) {
    console.info('from worker, PRE send back aBuf.byteLength:', aBuf.byteLength);    
    var gBuf = new Uint8Array(aBuf);
    
	gBuf[0] = 11;
	gBuf[1] = 22;
	gBuf[2] = 33;
	
    self.postMessage({aTopic:'do_sendMainArrBuff', aBuf:gBuf.buffer}, [gBuf.buffer]);

    console.info('from worker, POST send back aBuf.byteLength:', aBuf.byteLength);
}