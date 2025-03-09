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
let copyVideo;

let iTextureWebCam = -1;

let video;

const uSlider = document.getElementById("uGranularity");
const vSlider = document.getElementById("vGranularity");

uSlider.addEventListener('input', updateSurface);
vSlider.addEventListener('input', updateSurface);

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
    if (iTextureWebCam >= 0  && copyVideo) {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
    }

    let matrOrth = m4.orthographic(0, 1, 0, 1, 8, 20);
    // TODO: Place your code here to draw webCam surface

    // const projection = m4.perspective(Math.PI / 8, 1, 8, 12);
    const modelView = spaceball.getViewMatrix();
    const rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    const translateToPointZero = m4.translation(0, 0, -10);

    const colorPolygon = new Float32Array([0.5, 0.5, 0.5, 1]);
    const colorEdge = new Float32Array([1, 1, 1, 1]);

    // 1st pass for the l eye
    if (stereoCamera) {
        let matrixLeftFustrum = stereoCamera.calcLeftFrustum();
        gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, matrixLeftFustrum);

        let translateLeftEye = m4.translation(stereoCamera.eyeSeparation / 2, 0, 0);

        let matAccum0 = m4.multiply(rotateToPointZero, modelView);
        let matAccum1 = m4.multiply(translateLeftEye, matAccum0);
        let matAccum2 = m4.multiply(translateToPointZero, matAccum1);

        // const modelViewProjection = m4.multiply(translateToPointZero, matAccum0);
        // const normalMatrix = m4.inverse(m4.transpose(modelViewMatrix));

        // gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projection);
        gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum2);
        // gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalMatrix);

        // gl.uniform3fv(shProgram.iLightPosition, [1.0, 1.0, 1.0]);
        // gl.uniform3f(shProgram.iViewPosition, 0.0, 0.0, 5.0);
        // gl.uniform3f(shProgram.iAmbientColor, 0.2, 0.2, 0.2);
        // gl.uniform3f(shProgram.iDiffuseColor, 0.6, 0.6, 0.6);
        // gl.uniform3f(shProgram.iSpecularColor, 1.0, 1.0, 1.0);
        // gl.uniform1f(shProgram.iShininess, 32.0);

        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1, 0);

        gl.colorMask(true, false, false, true);
        gl.uniform4fv(shProgram.iColor, colorPolygon);
        surface.draw(gl, shProgram);
        gl.uniform4fv(shProgram.iColor, colorEdge);
        surface.drawWireframe(gl);

        // 2nd pass for the r eye

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
        surface.drawWireframe(gl);

        gl.disable(gl.POLYGON_OFFSET_FILL);
        gl.colorMask(true, true, true, true);
    }
}


function updateSurface() {
    surface = new Model('Surface of Revolution of a Parabola of Arbitrary Position');
    surface.createSurfaceData(0.8, 1.25, 270, uSlider.value, vSlider.value);
    surface.bindBufferData(gl, shProgram);
    draw();
}

async function initGL() {
    shProgram = await initShaders();
    if (!shProgram) return;

    surface = new Model('Surface of Revolution of a Parabola of Arbitrary Position');
    surface.createSurfaceData(0.8, 1.25, 270, 72, 20);
    surface.bindBufferData(gl, shProgram);

    surfaceWebCam = new Model('Surface of Revolution of a Parabola of Arbitrary Position WebCam');
    // TODO: Place your code here to load two triangle geometry


    // TODO: task 2
    stereoCamera = new StereoCamera(
        .7,
        14.0,
        1.3, // aspect ratio of canvas
        0.4,
        8.0,
        20.0
    );

    gl.enable(gl.DEPTH_TEST);
    draw();
}


function init() {
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
        initGL();
        requestAnimationFrame(draw);
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    video = document.createElement('video');
    video.autoplay = true;

    // Connect to video stream
    let constraints = { video: true };
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video.srcObject = stream;

        let track = stream.getVideoTracks()[0];
        let settings = track.getSettings();

        iTextureWebCam = new Texture(gl, settings.width, settings.height).textureId;

        video.addEventListener("playing", function() {
            copyVideo = true;
          }, true);
          video.addEventListener("ended", function() {
            video.currentTime = 0;
            video.play();
          }, true);
          
          video.play();
    }).catch(function (err) {
        console.log(err.name + ": " + err.message);
    });

    setInterval(draw, 1 / 20);

    spaceball = new TrackballRotator(canvas, draw, 0);
}

function animateLight(time) {
    const radius = 10.0;
    const speed = 0.001;
    const x = radius * Math.cos(time * speed);
    const z = radius * Math.sin(time * speed);
    const y = 5.0;

    if (shProgram) {
        gl.uniform3f(shProgram.iLightDirection, x, y, z);
        surface.draw(gl, shProgram);
    }
    requestAnimationFrame(animateLight);
}
init();
