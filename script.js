const recordButton = document.getElementById("recordButton");

const buttonText = document.getElementById("buttonText");
const buttonIcon = document.getElementById("buttonIcon");

const timerElement = document.getElementById("timer");
const errorMessage = document.getElementById("errorMessage");

const canvas = document.getElementById("waveCanvas");
const ctx = canvas.getContext("2d");

const recordScreen = document.getElementById("recordScreen");
const finalScreen = document.getElementById("finalScreen");


let mediaRecorder;
let audioChunks = [];

let audioContext;
let analyser;
let microphone;

let animationId;

let recordingStartTime;

let timerInterval;

let isRecording = false;


/* =========================
   CANVAS
========================= */

function resizeCanvas() {

    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;

    ctx.scale(
        window.devicePixelRatio,
        window.devicePixelRatio
    );
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);


/* =========================
   DRAW WAVE
========================= */

function drawWave() {

    if (!isRecording) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.clearRect(0, 0, width, height);

    analyser.fftSize = 256;

    const dataArray =
        new Uint8Array(analyser.frequencyBinCount);

    analyser.getByteTimeDomainData(dataArray);


    const elapsed =
        (Date.now() - recordingStartTime) / 1000;


    /*
        Maximum visible length:
        30 seconds
    */

    const progress =
        Math.min(elapsed / 30, 1);


    const maxWidth = width * progress;


    ctx.beginPath();


    for (let x = 0; x < maxWidth; x++) {

        const dataIndex =
            Math.floor(
                (x / maxWidth) * dataArray.length
            );

        const value =
            dataArray[dataIndex] / 128;

        const y =
            height / 2 +
            (value - 1) * 60;


        if (x === 0) {

            ctx.moveTo(x, y);

        } else {

            ctx.lineTo(x, y);

        }

    }


    ctx.lineWidth = 3;

    ctx.strokeStyle = "rgba(255,255,255,0.9)";

    ctx.shadowBlur = 12;

    ctx.shadowColor = "rgba(255,255,255,0.6)";

    ctx.stroke();


    animationId =
        requestAnimationFrame(drawWave);
}


/* =========================
   START RECORDING
========================= */

async function startRecording() {

    errorMessage.textContent = "";

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });


        audioContext =
            new AudioContext();


        analyser =
            audioContext.createAnalyser();


        microphone =
            audioContext.createMediaStreamSource(stream);


        microphone.connect(analyser);


        mediaRecorder =
            new MediaRecorder(stream);


        audioChunks = [];


        mediaRecorder.ondataavailable = event => {

            audioChunks.push(event.data);

        };


        mediaRecorder.onstop = () => {

            stream.getTracks().forEach(track => {
                track.stop();
            });

            checkRecordingLength();

        };


        mediaRecorder.start();


        isRecording = true;

        recordingStartTime = Date.now();


        recordButton.classList.add("recording");

        buttonIcon.textContent = "●";

        buttonText.textContent = "Recording...";


        timerInterval =
            setInterval(updateTimer, 100);


        drawWave();

    } catch (error) {

        errorMessage.textContent =
            "Please allow microphone access to record your voice.";

    }

}


/* =========================
   STOP RECORDING
========================= */

function stopRecording() {

    if (!mediaRecorder || !isRecording) return;


    isRecording = false;


    mediaRecorder.stop();


    cancelAnimationFrame(animationId);

    clearInterval(timerInterval);


    recordButton.classList.remove("recording");

    buttonIcon.textContent = "🎙";

    buttonText.textContent = "Hold to record";

}


/* =========================
   TIMER
========================= */

function updateTimer() {

    const seconds =
        Math.floor(
            (Date.now() - recordingStartTime) / 1000
        );


    const minutes =
        Math.floor(seconds / 60);


    const remainingSeconds =
        seconds % 60;


    timerElement.textContent =

        String(minutes).padStart(2, "0")
        +
        ":"
        +
        String(remainingSeconds).padStart(2, "0");

}


/* =========================
   CHECK LENGTH
========================= */

function checkRecordingLength() {

    const duration =
        (Date.now() - recordingStartTime) / 1000;


    if (duration < 30) {

        errorMessage.textContent =
            "The audio should be at least 30 seconds long. Say something more.";

        return;

    }


    showFinalScreen();

}


/* =========================
   FINAL SCREEN
========================= */

function showFinalScreen() {

    recordScreen.style.opacity = "0";

    recordScreen.style.transform =
        "scale(0.95)";


    setTimeout(() => {

        recordScreen.style.display =
            "none";


        finalScreen.style.display =
            "block";


        setTimeout(() => {

            finalScreen.classList.add("show");

        }, 50);

    }, 1000);

}


/* =========================
   BUTTON
========================= */


/*
    Desktop:
    hold mouse button
*/

recordButton.addEventListener(
    "mousedown",
    startRecording
);


recordButton.addEventListener(
    "mouseup",
    stopRecording
);


recordButton.addEventListener(
    "mouseleave",
    () => {

        if (isRecording) {
            stopRecording();
        }

    }
);


/*
    Mobile:
    hold finger
*/

recordButton.addEventListener(
    "touchstart",
    event => {

        event.preventDefault();

        startRecording();

    }
);


recordButton.addEventListener(
    "touchend",
    event => {

        event.preventDefault();

        stopRecording();

    }
);