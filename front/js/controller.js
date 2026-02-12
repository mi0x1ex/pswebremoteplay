var lastMousePosition = [0, 0]
var currMousePosition = [0, 0]
var lastMouseProcessingTimeStamp = 0
var stopMouse = false;

var localStorageButtonsKey = "buttons";
var buttonsPanelId = "buttonspanel";
var controllerButtonId = "controller";

var waitButton = null;

psButtonsCommands = {
    'UP': 1,
    'RIGHT': 2,
    'DOWN': 3,
    'LEFT': 4,
    'TRIANGLE': 5,
    'CIRCLE': 6,
    'CROSS': 7,
    'SQUARE': 8,
    'L1': 9,
    'L2': 10,
    'L3': 11,
    'R1': 12,
    'R2': 13,
    'R3': 14,
    'SHARE': 15,
    'TOUCHPAD': 16,
    'OPTIONS': 18,
    'PS': 19
}

pressPsButtons = {
    'UP': false,
    'RIGHT': false,
    'DOWN': false,
    'LEFT': false,
    'TRIANGLE': false,
    'CIRCLE': false,
    'CROSS': false,
    'SQUARE': false,
    'L1': false,
    'L2': false,
    'L3': false,
    'R1': false,
    'R2': false,
    'R3': false,
    'SHARE': false,
    'TOUCHPAD': false,
    'OPTIONS': false,
    'PS': false
}

pressPsLeftStick = {
    'LU': false,
    'LR': false,
    'LD': false,
    'LL': false,
}

pressPsRightStick = {
    'X': 0,
    'Y': 0,
}

controlMap = {
    51: 'UP',
    50: 'RIGHT',
    52: 'DOWN',
    49: 'LEFT',
    81: 'TRIANGLE',
    32: 'CIRCLE',
    82: 'CROSS',
    70: 'SQUARE',
    67: 'L1',
    'RBM': 'L2',
    16: 'L3',
    'MBM': 'R1',
    'LBM': 'R2',
    17: 'R3',
    54: 'SHARE',
    18: 'TOUCHPAD',
    9: 'OPTIONS',
    53: 'PS',
    87: 'LU',
    68: 'LR',
    83: 'LD',
    65: 'LL',
}

leftStickPsButtons = ['LU', 'LR', 'LD', 'LL']

keysNameMap = {
    "0": "Unidentified key",
    "8": "Backspace",
    "9": "Tab",
    "12": "Clear",
    "13": "Enter",
    "16": "Shift",
    "17": "Control",
    "18": "Alt",
    "19": "Pause/Break",
    "20": "Caps Lock",
    "27": "Escape",
    "32": "Space Bar",
    "33": "Page Up",
    "34": "Page Down",
    "35": "End",
    "36": "Home",
    "37": "Left Arrow",
    "38": "Up Arrow",
    "39": "Right Arrow",
    "40": "Down Arrow",
    "41": "Select",
    "42": "Print",
    "43": "Execute",
    "44": "Print Screen / Snapshot",
    "45": "Insert",
    "46": "Delete",
    "47": "Help",
    "48": "0",
    "49": "1",
    "50": "2",
    "51": "3",
    "52": "4",
    "53": "5",
    "54": "6",
    "55": "7",
    "56": "8",
    "57": "9",
    "65": "A",
    "66": "B",
    "67": "C",
    "68": "D",
    "69": "E",
    "70": "F",
    "71": "G",
    "72": "H",
    "73": "I",
    "74": "J",
    "75": "K",
    "76": "L",
    "77": "M",
    "78": "N",
    "79": "O",
    "80": "P",
    "81": "Q",
    "82": "R",
    "83": "S",
    "84": "T",
    "85": "U",
    "86": "V",
    "87": "W",
    "88": "X",
    "89": "Y",
    "90": "Z",
    "91": "Left Window/Meta/OS Key",
    "92": "Right Window/Meta/OS Key",
    "93": "Context Menu",
    "96": "Numpad 0",
    "97": "Numpad 1",
    "98": "Numpad 2",
    "99": "Numpad 3",
    "100": "Numpad 4",
    "101": "Numpad 5",
    "102": "Numpad 6",
    "103": "Numpad 7",
    "104": "Numpad 8",
    "105": "Numpad 9",
    "106": "Multiply",
    "107": "Add",
    "108": "Keypad Enter",
    "109": "Subtract",
    "110": "Decimal Point",
    "111": "Divide",
    "112": "F1",
    "113": "F2",
    "114": "F3",
    "115": "F4",
    "116": "F5",
    "117": "F6",
    "118": "F7",
    "119": "F8",
    "120": "F9",
    "121": "F10",
    "122": "F11",
    "123": "F12",
    "124": "F13",
    "125": "F14",
    "126": "F15",
    "127": "F16",
    "128": "F17",
    "129": "F18",
    "130": "F19",
    "131": "F20",
    "132": "F21",
    "133": "F22",
    "134": "F23",
    "135": "F24",
    "136": "F25",
    "137": "F26",
    "138": "F27",
    "139": "F28",
    "140": "F29",
    "141": "F30",
    "142": "F31",
    "143": "F32",
    "144": "Num Lock",
    "145": "Scroll Lock",
    "166": "Navigate/Page Back",
    "167": "Navigate/Page Forward",
    "168": "Reload/Refresh Page",
    "174": "Audio Volume Down",
    "175": "Audio Volume Up",
    "186": "Semi-colon",
    "187": "Equal Sign",
    "188": "Comma",
    "189": "Dash",
    "190": "Period",
    "191": "Forward Slash",
    "192": "Grave Accent",
    "219": "Open Bracket",
    "220": "Back Slash",
    "221": "Close Bracket",
    "222": "Single Quote",
    "RBM": "RBM",
    "MBM": "MBM",
    "LBM": "LBM"
}

function definePsButton(keyCode) {
    return controlMap[new String(keyCode)];
}

function processPsButton(controlButton, press) {
    psCommand = psButtonsCommands[controlButton]
    if (psCommand == undefined) {
        return;
    }
    pressed = pressPsButtons[controlButton]
    if (pressed != press) {
        pressPsButtons[controlButton] = press;
        command = new Int8Array(2)
        command[0] = 1;
        command[1] = psCommand
        if (!press) {
            command[1] *= (-1)
        }
        sendCommandThroughWebsocket(command);
    }
}

function processPsLeftStick(controllButton, press, slow) {
    if (!leftStickPsButtons.includes(controllButton)) {
        return;
    }
    if (press == pressPsLeftStick[controllButton]) {
        return;
    }
    pressPsLeftStick[controllButton] = press;
    x = 0;
    y = 0;
    if (pressPsLeftStick['LU']) {
        y -= (100 - (slow ? 50 : 0));
    }
    if (pressPsLeftStick['LR']) {
        x += (100 - (slow ? 50 : 0));
    }
    if (pressPsLeftStick['LD']) {
        y += (100 - (slow ? 50 : 0));
    }
    if (pressPsLeftStick['LL']) {
        x -= (100 - (slow ? 50 : 0));
    }
    command = new Int8Array(3)
    command[0] = 2;
    command[1] = x;
    command[2] = y;
    sendCommandThroughWebsocket(command);
}

function pressButton(e, press) {
    if (event.charCode) {
        var charCode = event.charCode;
    } else {
        var charCode = event.keyCode;
    }

    var charCode = event.keyCode;

    if (waitButton != null && !press) {
        applyWaitButton(charCode);
        e.preventDefault();
        return false;
    }

    if (!isGameMode()) {
        return true;
    }
    e.preventDefault();
    if (gameState != 2) {
        return false;
    }
    psButton = definePsButton(charCode);
    if (psButton == undefined) {
        return;
    }

    processPsButton(psButton, press);
    processPsLeftStick(psButton, press, event.getModifierState("CapsLock"));
    return false;
}

function applyWaitButton(charCode) {
    if (waitButton != null) {
        controlMapValues = Object.values(controlMap);
        for (i in controlMapValues) {
            if (controlMapValues[i] == waitButton) {
                delete controlMap[Object.keys(controlMap)[i]]
            }
        }

        controlMap[charCode] = waitButton
        saveButtons();
        loadButtons();
        document.getElementById("controller_wall").style.display = 'none';
        waitButton = null;
    }
}

function pressMouseButton(e, press) {
    mouseKey = e.button;
    mouseKeyAlias = undefined;
    if (mouseKey == 0) {
        mouseKeyAlias = 'LBM';
    } else if (mouseKey == 1) {
        mouseKeyAlias = 'MBM';
    } else if (mouseKey == 2) {
        mouseKeyAlias = 'RBM';
    }

    if (waitButton != null && !press) {
        applyWaitButton(mouseKeyAlias);
        e.preventDefault();
        return false;
    }

    psButton = definePsButton(mouseKeyAlias);
    if (psButton == undefined) {
        return;
    }
    processPsButton(psButton, press);
}

function processMouse(mouseMoveEvent) {
    if (!isGameMode()) {
        return;
    }

    currMousePosition[0] += mouseMoveEvent.movementX;
    currMousePosition[1] += mouseMoveEvent.movementY;
}

function sendMouseCoord() {
    if (!isGameMode()) {
        return;
    }

    x = lastMousePosition[0] - currMousePosition[0]
    y = lastMousePosition[1] - currMousePosition[1]


    if (x == 0 && y == 0 && stopMouse) {
        return;
    }
    stopMouse = false;

    xt = Math.abs(x);
    yt = Math.abs(y);


    if (xt > yt) {
        yt = Math.min(Math.round((yt / xt) * 100), 100)
        xt = 100;
    } else if (xt < yt) {
        xt = Math.min(Math.round((xt / yt) * 100), 100)
        yt = 100;
    } else {
        xt = 0;
        yt = 0;
    }

    if (x > 0) {
        xt = xt * (-1);
    }
    if (y > 0) {
        yt = yt * (-1);
    }

    lastMousePosition[0] = currMousePosition[0];
    lastMousePosition[1] = currMousePosition[1];


    if (pressPsRightStick['X'] == xt && pressPsRightStick['Y'] == yt) {
        return
    }

    pressPsRightStick['X'] = xt;
    pressPsRightStick['Y'] = yt;

    command = new Int8Array(3)
    command[0] = 3;
    command[1] = xt;
    command[2] = yt;
    sendCommandThroughWebsocket(command);

    if (xt == 0 && yt == 0) {
        stopMouse = true;
    }
}

function isGameMode() {
    videoPlayer = document.getElementById(canvasId);
    return document.pointerLockElement === videoPlayer || document.mozPointerLockElement === videoPlayer;
}

function saveButtons() {
    localStorage.setItem(localStorageButtonsKey, JSON.stringify(controlMap))
}

function loadButtons() {
    buttons = localStorage.getItem(localStorageButtonsKey);
    if (!(buttons == null || buttons == undefined)) {
        controlMap = JSON.parse(buttons)
    }
    values = Object.values(controlMap)
    keys = Object.keys(controlMap)
    for (k in Object.keys(psButtonsCommands)) {
        document.getElementById("b_" + Object.keys(psButtonsCommands)[k].toLowerCase()).innerText = "...";
    }

    for (key in values) {
        k = values[key]
        document.getElementById("b_" + k.toLowerCase()).innerText = keysNameMap[keys[key]];
    }
}

function showButtonsPanel() {
    document.getElementById(buttonsPanelId).style.display = 'block';
}

function hideButtonsPanel() {
    document.getElementById(buttonsPanelId).style.display = 'none';
}

function switchButtonsPanel() {
    el = document.getElementById(buttonsPanelId)
    current = el.style.display
    if (current == 'none') {
        el.style.display = 'block'
    } else {
        el.style.display = 'none'
    }
}

loadButtons();

setInterval(function() {
    sendMouseCoord();
}, 20);

document.onkeydown = function(e) {
    return pressButton(e, true);
}
document.onkeyup = function(e) {
    return pressButton(e, false);
}
document.addEventListener("mousedown", function(e) {
    pressMouseButton(e, true);
});
document.addEventListener("mouseup", function(e) {
    pressMouseButton(e, false);
});
document.getElementById(canvasId).addEventListener('mousemove', function(e) {
    processMouse(e);
});
document.getElementById(canvasId).addEventListener('click', function(event) {
    document.getElementById(canvasId).requestPointerLock();
});
document.getElementById(controllerButtonId).addEventListener('click', function() {
    switchButtonsPanel();
})
document.getElementById("controller_wall").addEventListener('click', function() {})

document.getElementById("b_triangle").addEventListener('click', function() {
    waitButton = 'TRIANGLE';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_circle").addEventListener('click', function() {
    waitButton = 'CIRCLE';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_cross").addEventListener('click', function() {
    waitButton = 'CROSS';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_square").addEventListener('click', function() {
    waitButton = 'SQUARE';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_up").addEventListener('click', function() {
    waitButton = 'UP';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_right").addEventListener('click', function() {
    waitButton = 'RIGHT';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_down").addEventListener('click', function() {
    waitButton = 'DOWN';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_left").addEventListener('click', function() {
    waitButton = 'LEFT';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_lu").addEventListener('click', function() {
    waitButton = 'LU';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_lr").addEventListener('click', function() {
    waitButton = 'LR';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_ld").addEventListener('click', function() {
    waitButton = 'LD';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_ll").addEventListener('click', function() {
    waitButton = 'LL';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_l1").addEventListener('click', function() {
    waitButton = 'L1';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_l2").addEventListener('click', function() {
    waitButton = 'L2';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_r1").addEventListener('click', function() {
    waitButton = 'R1';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_r2").addEventListener('click', function() {
    waitButton = 'R2';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_l3").addEventListener('click', function() {
    waitButton = 'L3';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_r3").addEventListener('click', function() {
    waitButton = 'R3';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_share").addEventListener('click', function() {
    waitButton = 'SHARE';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_options").addEventListener('click', function() {
    waitButton = 'OPTIONS';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_ps").addEventListener('click', function() {
    waitButton = 'PS';
    document.getElementById("controller_wall").style.display = 'block';
})
document.getElementById("b_touchpad").addEventListener('click', function() {
    waitButton = 'TOUCHPAD';
    document.getElementById("controller_wall").style.display = 'block';
})