var startButtonId = "start";
var videoPlayerId = "player";
var canvasId = "videoCanvas";
var fpsSelectId = "fps";
var resolutionSelectId = "resolution";
var qualitySelectId = "quality";
var fullscreenButtonId = "fullscreen";
var localStorageButtonsKey = "buttons";

var serverAddress = "localhost:8080";

var websocket = null;
var decoder = null;
var audioCtx = null;
var opusDecoder = null;

var countPackets = 0;
var startTime = 0;
var gameState = 0;
var checkVideoStreamTimestamp = null;
var lastBufferTime = null;


function initVideoStream() {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    decoder = new VideoDecoder({
        output: function(frame) {
            ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
            frame.close();
        },
        error: function(e) {
            console.error('VideoDecoder error:', e);
        }
    });
    var decoderConfig = {
        codec: 'avc1.64001f',
        optimizeForLatency: true
    };
    decoder.configure(decoderConfig)
    opusDecoder = new window["opus-decoder"].OpusDecoder();
}

function connectToServer(resolution, fps, quality, attempt) {
    document.cookie = 'config=' + resolution + ':' + fps + ':' + quality + '; path=/; expires=Tue, 01 Jan 2100 00:00:00 GMT';
    websocket = new WebSocket('ws://' + serverAddress + "?config=" + resolution + ':' + fps + ':' + quality);
    websocket.binaryType = "arraybuffer";
    websocket.onmessage = function(event) {
        if (gameState == 1) {
            gameState = 2;
            setCheckVideoStreamTime(1000);
        }
        if (gameState != 2) {
            return;
        }
        if (websocket.readyState != WebSocket.OPEN) {
            return;
        }
        bytesData = new Uint8Array(event.data);
        if (bytesData.length != 80) {
            var type = determineFrameType(bytesData, true)
            if (type != 'key' && type != 'delta') {
                return;
            }
            var chunk = new EncodedVideoChunk({
                type: type,
                timestamp: performance.now(),
                duration: 0,
                data: bytesData
            });
            decoder.decode(chunk);
        } else {
            decodeAudioFrame(bytesData);
        }
    }
    websocket.onclose = function(event) {
        resetGame();
        if (attempt > 100) {
            alert('Error connection to server');
        } else {
            start(attempt + 1);
        }
    }
}

function initAudioContext() {
    audioCtx = new AudioContext();
    audioCtx.resume().then(function() {});
}

function decodeAudioFrame(bytesData) {
    opusDecoder.ready.then(function() {
        decoded = opusDecoder.decodeFrame(bytesData);
        if (decoded.samplesDecoded <= 0) {
            return;
        }
        if (audioCtx == null) {
            initAudioContext();
        }
        const source = audioCtx.createBufferSource();
        const buffer = audioCtx.createBuffer(2, decoded.samplesDecoded, decoded.sampleRate);
        buffer.copyToChannel(decoded.channelData[0], 0);
        buffer.copyToChannel(decoded.channelData[1], 1);
        source.buffer = buffer;
        source.connect(audioCtx.destination);

        delay = startTime - audioCtx.currentTime;
        if (delay > 0.2) {
            return;
        } else if (delay < 0.1) {
            startTime += 0.1;
        }

        source.start(startTime);
        startTime += buffer.duration;
    })
}

function resetGame() {
    gameState = 0;
    document.getElementById(startButtonId).disabled = false;
    document.getElementById(resolutionSelectId).disabled = false;
    document.getElementById(fpsSelectId).disabled = false;
    document.getElementById(qualitySelectId).disabled = false;
    document.getElementById(startButtonId).innerText = "START";
    try {
        audioCtx.close();
    } catch (err) {}
    try {
        decoder.close();
    } catch (err) {}

    audioCtx = null;
}

function disableUI() {
    document.getElementById(startButtonId).disabled = true;
    document.getElementById(resolutionSelectId).disabled = true;
    document.getElementById(fpsSelectId).disabled = true;
    document.getElementById(qualitySelectId).disabled = true;
}

function enableUI() {
    document.getElementById(startButtonId).disabled = false;
    document.getElementById(resolutionSelectId).disabled = false;
    document.getElementById(fpsSelectId).disabled = false;
    document.getElementById(qualitySelectId).disabled = false;
    document.getElementById(startButtonId).innerText = "Start";
}

function start(attempt) {
    disableUI();
    var message = "Connection...";
    if (attempt > 1) {
        message += "(" + attempt + " attemp(s))"
    }
    document.getElementById(startButtonId).innerText = message;

    startTime = 0;
    gameState = 1;

    initVideoStream();

    fps = document.getElementById(fpsSelectId).value
    resolution = document.getElementById(resolutionSelectId).value
    quality = document.getElementById(qualitySelectId).value

    setTimeout(function() {
        connectToServer(resolution, fps, quality, attempt);
    }, 100);
}

function fullscreen() {
    var elem = document.getElementById(canvasId);
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
    ctx = elem.getContext("2d")
    ctx.canvas.width = window.outerWidth;
    ctx.canvas.height = window.outerHeight;
}

function loadResolutionAndFpsFromCookie() {
    cookies = document.cookie.split('=')
    target = null;
    for (cookie in cookies) {
        if (cookies[cookie] == 'config') {
            target = cookies[Number(cookie) + 1]
        }
    }
    if (target == null) {
        return;
    }
    parts = target.split(':')
    resolution = parts[0]
    fps = parts[1]
    quality = parts[2]
    document.getElementById(resolutionSelectId).value = resolution;
    document.getElementById(fpsSelectId).value = fps;
    document.getElementById(qualitySelectId).value = quality;
}

function setCheckVideoStreamTime(t) {
    checkVideoStreamTimestamp = Date.now() + t
}

function sendCommandThroughWebsocket(command) {
    if (gameState != 2) {
        return;
    }
    if (websocket != null && websocket.readyState == WebSocket.OPEN) {
        websocket.send(command);
    }
}

function resetVideo() {
    try {
        decoder.close();
    } catch (err) {}
    command = new Int8Array(3);
    command[0] = 4;
    sendCommandThroughWebsocket(command);
    setCheckVideoStreamTime(2000);
}

function checkVideoStream() {
    if (gameState != 2) {
        return;
    }
    if (checkVideoStreamTimestamp != null) {
        if (Date.now() > checkVideoStreamTimestamp) {
            checkVideoStreamTimestamp = null
        } else {
            return;
        }
    }
    buffered = document.getElementById(videoPlayerId).buffered
    if (buffered.length == 0) {
        console.log('not buffered');
        resetVideo();
        return;
    }
    currentBufferTime = buffered.end(buffered.length - 1)
    if (lastBufferTime != null && currentBufferTime == lastBufferTime) {
        console.log('buffering stopped');
        resetVideo();
        return;
    }
    lastBufferTime = currentBufferTime
    currentVideoTime = document.getElementById(videoPlayerId).currentTime
    delay = buffered.end(buffered.length - 1) - currentVideoTime

    if (delay > 0.5) {
        console.log(buffered.end(buffered.length - 1) - currentVideoTime);
        resetVideo();
        return;
    }
}

function healthckeck() {
    if (websocket != null && websocket.readyState == WebSocket.OPEN) {
        command = new Int8Array(1)
        command[0] = 0;
        websocket.send(command);
    }
}

function determineFrameType(data, isMP4) {
    if (isMP4) {
        const flags = new DataView(data.buffer).getUint32(0);
        return (flags & 0x020000) ? 'key' : 'delta';
    } else {
        const startPos = findNalStart(data);
        if (startPos === -1) return 'unknown';
        const nalType = data[startPos] & 0x1F;
        switch (nalType) {
            case 5:
                return 'key';
            case 1:
                return 'delta';
            case 7:
            case 8:
                return 'config';
            default:
                return 'unknown';
        }
    }
}

function findNalStart(data) {
    for (let i = 0; i < data.length - 3; i++) {
        if (data[i] === 0x00 && data[i + 1] === 0x00 &&
            (data[i + 2] === 0x01 || (data[i + 2] === 0x00 && data[i + 3] === 0x01))) {
            return data[i + 2] === 0x01 ? i + 3 : i + 4;
        }
    }
    return -1;
}

function setActionsToButtons() {
    document.getElementById(startButtonId).addEventListener('click', function(e) {
        start(1);
    })
    document.getElementById(fullscreenButtonId).addEventListener('click', function(event) {
        fullscreen();
    });

    document.getElementById("reset").addEventListener('click', function(event) {
        document.cookie = "config=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None;";
        localStorage.clear();
        location.reload();
    });

    document.addEventListener('fullscreenchange', function() {
        if (!document.fullscreenElement) {
            ctx = document.getElementById(canvasId).getContext("2d")
            ctx.canvas.width = 854;
            ctx.canvas.height = 480;
        }
    });
}

loadResolutionAndFpsFromCookie();
setActionsToButtons();

setInterval(function() {
    checkVideoStream();
}, 1000);
setInterval(function() {
    healthckeck();
}, 500);