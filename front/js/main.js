var startButtonId = "start";
var videoPlayerId = "player";
var canvasId = "videoCanvas";
var fpsSelectId = "fps";
var resolutionSelectId = "resolution";
var qualitySelectId = "quality";
var fullscreenButtonId = "fullscreen";
var localStorageButtonsKey = "buttons";

var serverAddress = "mi0x1ex.ru/" + new URLSearchParams(document.location.search).get('ws') + "/";

var websocket = null;
var decoder = null;
var audioCtx = null;
var opusDecoder = null;

var countPackets = 0;
var audioStartTime = 0;
var gameState = 0;
var lastBufferTime = null;

var lastDrawTime = 0;
var waitKeyFrame = false;
var lastFrame = null

const canvas = document.getElementById(canvasId);
const ctx = canvas.getContext("2d");

function initVideoStream() {
    try {
        decoder.close();
    } catch (err) {}
    lastDrawTime = 0;
    waitKeyFrame = true;
    decoder = new VideoDecoder({
        output: function(frame) {
            createImageBitmap(frame).then(function (img) {
                lastFrame = img;
                frame.close();
            });
        },
        error: function(e) {
            console.error('VideoDecoder error:', e);
        }
    });
    const decoderConfig = {
        codec: 'avc1.64001f',
        optimizeForLatency: true
    };
    decoder.configure(decoderConfig)
}

function initAudioStream() {
    try {
        audioCtx.close();
    } catch (err) {}
    try {
        opusDecoder.close();
    } catch (err) {}

    opusDecoder = new window["opus-decoder"].OpusDecoder();
    audioCtx = new AudioContext();
    audioCtx.resume().then(function() {});
    audioStartTime = 0;
}

function connectToServer(resolution, fps, quality, attempt) {
    document.cookie = 'config=' + resolution + ':' + fps + ':' + quality + '; path=/; expires=Tue, 01 Jan 2100 00:00:00 GMT';
    create_new = (attempt > 20) ? true : false;
    websocket = new WebSocket('wss://' + serverAddress + "?config=" + resolution + ':' + fps + ':' + quality + ":" + create_new);
    websocket.binaryType = "arraybuffer";
    websocket.onmessage = function(event) {
        if (gameState == 1) {
            gameState = 2;
            document.getElementById(startButtonId).innerText = "Подключено";
        }
        if (gameState != 2) {
            return;
        }
        if (websocket.readyState != WebSocket.OPEN) {
            return;
        }
        bytesData = new Uint8Array(event.data);
        if (bytesData.length != 80) {
            var keyFrame = hasKeyFrame(bytesData)
            if (!keyFrame && waitKeyFrame) {
                return;
            } else if (waitKeyFrame && keyFrame) {
                waitKeyFrame = false;
            }

            var chunk = new EncodedVideoChunk({
                type: keyFrame ? 'key' : 'delta',
                timestamp: performance.now(),
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

function hasKeyFrame(buffer) {
  if (!buffer || buffer.length < 5) return false;

  let i = 0;
  while (i < buffer.length - 3) {
    let scLen = 0;
    if (buffer[i] === 0 && buffer[i+1] === 0 && buffer[i+2] === 0 && buffer[i+3] === 1) {
      scLen = 4;
    } else if (buffer[i] === 0 && buffer[i+1] === 0 && buffer[i+2] === 1) {
      scLen = 3;
    } else {
      i++;
      continue;
    }

    const nalStart = i + scLen;
    if (nalStart >= buffer.length) return false;

    const nalType = buffer[nalStart] & 0x1f;
    if (nalType === 5) return true;

    i = nalStart;
  }

  return false;
}

function decodeAudioFrame(bytesData) {
    opusDecoder.ready.then(function() {
        try {
            decoded = opusDecoder.decodeFrame(bytesData);
        } catch (err) {
            initAudioStream();
            return;
        }
        if (decoded.samplesDecoded <= 0) {
            return;
        }
        const source = audioCtx.createBufferSource();
        const buffer = audioCtx.createBuffer(2, decoded.samplesDecoded, decoded.sampleRate);
        buffer.copyToChannel(decoded.channelData[0], 0);
        buffer.copyToChannel(decoded.channelData[1], 1);
        source.buffer = buffer;
        source.connect(audioCtx.destination);

        delay = audioStartTime - audioCtx.currentTime;
        if (delay > 0.2) {
            return;
        } else if (delay < 0.1) {
            audioStartTime += 0.1;
        }

        source.start(audioStartTime);
        audioStartTime += buffer.duration;
    })
}

function resetGame() {
    gameState = 0;
    document.getElementById(startButtonId).disabled = false;
    document.getElementById(resolutionSelectId).disabled = false;
    document.getElementById(fpsSelectId).disabled = false;
    document.getElementById(qualitySelectId).disabled = false;
    document.getElementById(startButtonId).innerText = "Играть";
    try {
        audioCtx.close();
    } catch (err) {}
    try {
        decoder.close();
    } catch (err) {}
    try {
        opusDecoder.close();
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
    document.getElementById(startButtonId).innerText = "Играть";
}

function start(attempt) {
    disableUI();
    var message = "Подключение...";
    if (attempt > 1) {
        message += "(" + attempt + " попыток(ка))"
    }
    document.getElementById(startButtonId).innerText = message;

    gameState = 1;

    initVideoStream();
    initAudioStream();

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
        initVideoStream();
    } catch (err) {}
    requestVideoKeyFrame();
}


function healthckeck() {
    if (websocket != null && websocket.readyState == WebSocket.OPEN) {
        command = new Int8Array(1)
        command[0] = 0;
        websocket.send(command);
    }
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
            ctx.canvas.width = 854;
            ctx.canvas.height = 480;
        }
    });
}

function draw() {
    if (lastFrame != null) {
        ctx.drawImage(lastFrame, 0, 0, canvas.width, canvas.height);
        lastDrawTime = performance.now();
        lastFrame = null;
    }
    if (performance.now() - lastDrawTime > 500 && lastDrawTime != 0) {
        resetVideo();
        lastDrawTime = performance.now() + 2000;
    }
}

function requestVideoKeyFrame() {
    command = new Int8Array(3);
    command[0] = 4;
    sendCommandThroughWebsocket(command);
}

loadResolutionAndFpsFromCookie();
setActionsToButtons();

setInterval(function() {
    healthckeck();
}, 500);
setInterval(function() {
    draw();
}, 10);
