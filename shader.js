class ShaderProgram {
    constructor(name, program, gl) {
        this.name = name;
        this.prog = program;

        gl.useProgram(this.prog);

        this.iAttribPosition = gl.getAttribLocation(this.prog, "aPosition");
        // this.iAttribNormal = gl.getAttribLocation(this.prog, "aNormal");
        this.iModelViewMatrix = gl.getUniformLocation(this.prog, "uModelViewMatrix");
        this.iProjectionMatrix = gl.getUniformLocation(this.prog, "uProjectionMatrix");
        this.iColor = gl.getUniformLocation(this.prog, "color");
        // this.iNormalMatrix = gl.getUniformLocation(this.prog, "uNormalMatrix");
        // this.iLightDirection = gl.getUniformLocation(this.prog, "uLightDirection");
        // this.iColor = gl.getUniformLocation(this.prog, "color");
        // this.iViewPosition = gl.getUniformLocation(this.prog, "uViewPosition");
        // this.iAmbientColor = gl.getUniformLocation(this.prog, "uAmbientColor");
        // this.iDiffuseColor = gl.getUniformLocation(this.prog, "uDiffuseColor");
        // this.iSpecularColor = gl.getUniformLocation(this.prog, "uSpecularColor");
        // this.iShininess = gl.getUniformLocation(this.prog, "uShininess");
    }
}
export { ShaderProgram };
