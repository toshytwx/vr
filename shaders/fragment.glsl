precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uTexture;
uniform bool uIsBackground;
uniform vec4 color;

void main() {
    if (uIsBackground) {
        gl_FragColor = texture2D(uTexture, vTexCoord);
    } else {
        gl_FragColor = color;
    }
}