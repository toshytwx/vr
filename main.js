import { Model } from './model.js';
import { TrackballRotator } from './Utils/trackball-rotator.js';
import { ShaderProgram } from './shader.js';
import { StereoCamera } from './stereo.js'
import { Texture } from './texture.js'

let gl;
let surface;
let surfaceWebCam;
let shProgram;
let spaceball;
let stereoCamera;
let iTextureWebCam = -1;

let video;

const eyeSeparationSlider = document.getElementById("eyeSeparation");
const fovSlider = document.getElementById("fov");
const nearClippingDistanceSlider = document.getElementById("nearClippingDistance");
const convergenceSlider = document.getElementById("convergence");

eyeSeparationSlider.addEventListener('input', updateStereoCamera);
fovSlider.addEventListener('input', updateStereoCamera);
nearClippingDistanceSlider.addEventListener('input', updateStereoCamera);
convergenceSlider.addEventListener('input', updateStereoCamera);


async function loadShader(gl, url, type) {
    const response = await fetch(url);
    const shaderSource = await response.text();

    const shader = gl.createShader(type);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(`An error occurred compiling the shader: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

async function initShaders() {
    const vertexShader = await loadShader(gl, './shaders/vertex.glsl', gl.VERTEX_SHADER);
    const fragmentShader = await loadShader(gl, './shaders/fragment.glsl', gl.FRAGMENT_SHADER);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
        return null;
    }

    gl.useProgram(shaderProgram);
    return new ShaderProgram('GouraudShader', shaderProgram, gl);
}

function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // PATH ZERO: DRAW ZERO PARALLAX WEBCAM
    if (iTextureWebCam !== -1) {
        if (video.readyState >= 2) {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
        }
        const uIsBackground = gl.getUniformLocation(shProgram.prog, "uIsBackground");
        gl.uniform1i(uIsBackground, 1);
        let matrOrth = m4.orthographic(0, 1, 0, 1, 8, 20);
        gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, matrOrth);
        let translationMatrix = m4.translation(0, 0, -18);
        gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, translationMatrix);
        surfaceWebCam.draw(gl, shProgram);
    }

    const modelView = spaceball.getViewMatrix();
    const rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    const translateToPointZero = m4.translation(0, 0, -10);

    const colorPolygon = new Float32Array([0.5, 0.5, 0.5, 1]);
    const colorEdge = new Float32Array([1, 1, 1, 1]);

    const uIsBackground = gl.getUniformLocation(shProgram.prog, "uIsBackground");
    gl.uniform1i(uIsBackground, 0);

    // 1st pass: for the l eye

    gl.enable(gl.DEPTH_TEST);

    let matrixLeftFustrum = stereoCamera.calcLeftFrustum();
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, matrixLeftFustrum);

    let translateLeftEye = m4.translation(stereoCamera.eyeSeparation / 2, 0, 0);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateLeftEye, matAccum0);
    let matAccum2 = m4.multiply(translateToPointZero, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum2);

    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 0);

    gl.colorMask(true, false, false, true);
    gl.uniform4fv(shProgram.iColor, colorPolygon);
    surface.draw(gl, shProgram);
    gl.uniform4fv(shProgram.iColor, colorEdge);
    surface.drawWireframe(gl, shProgram);

    // 2nd pass: for the r eye

    gl.clear(gl.DEPTH_BUFFER_BIT);

    let matrixRightFustrum = stereoCamera.calcRightFrustum();
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, matrixRightFustrum);

    let translateRightEye = m4.translation(-stereoCamera.eyeSeparation / 2, 0, 0);

    matAccum0 = m4.multiply(rotateToPointZero, modelView);
    matAccum1 = m4.multiply(translateRightEye, matAccum0);
    matAccum2 = m4.multiply(translateToPointZero, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum2);

    gl.colorMask(false, true, true, true);
    gl.uniform4fv(shProgram.iColor, colorPolygon);
    surface.draw(gl, shProgram);
    gl.uniform4fv(shProgram.iColor, colorEdge);
    surface.drawWireframe(gl, shProgram);

    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.colorMask(true, true, true, true);
}

function updateStereoCamera() {
    stereoCamera = new StereoCamera(
        eyeSeparationSlider.value * 1,
        convergenceSlider.value * 1,
        1.3, // aspect ratio of canvas
        fovSlider.value * 1,
        nearClippingDistanceSlider.value * 1,
        20.0
    );
}

async function initGL() {
    shProgram = await initShaders();
    if (!shProgram) return;

    let data = {};
    surface = new Model('Surface of Revolution of a Parabola of Arbitrary Position');
    surface.createSurfaceData(data);
    surface.bindBufferData(gl, data);

    let webCamData = {};
    surfaceWebCam = new Model('Surface of WebCam');
    surfaceWebCam.createWebCamSurfaceData(webCamData);
    surfaceWebCam.bindBufferData(gl, webCamData);

    stereoCamera = new StereoCamera(
        eyeSeparationSlider.value * 1,
        convergenceSlider.value * 1,
        1.3, // aspect ratio of canvas
        fovSlider.value * 1,
        nearClippingDistanceSlider.value * 1,
        20.0
    );

    gl.enable(gl.DEPTH_TEST);
}


async function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }

    try {
        await initGL();
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    video = document.createElement('video');
    video.autoplay = true;

    let constraints = { video: true };
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        video.srcObject = stream;
        let track = stream.getVideoTracks()[0];
        let settings = track.getSettings();

        iTextureWebCam = new Texture(gl, settings.width, settings.height).textureId;
    }).catch(err => {
        console.log(err.name + ": " + err.message);
    });

    spaceball = new TrackballRotator(canvas, draw, 0);

    // 20 frames per second
    setInterval(draw, 1 / 20);

    const ws = new WebSocket('ws://localhost:8989');

    ws.onopen = () => {
        console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
        console.log(event.data)
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
    };

    ws.onerror = (err) => {
        console.error('WebSocket error:', err);
    };
}

init();
