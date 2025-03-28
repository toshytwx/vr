class ShaderProgram {
    constructor(name, program, gl) {
        this.name = name;
        this.prog = program;

        gl.useProgram(this.prog);

        this.iAttribPosition = gl.getAttribLocation(this.prog, "aPosition");
        this.iAttribTexCoord = gl.getAttribLocation(this.prog, "aTexCoord");
        this.iModelViewMatrix = gl.getUniformLocation(this.prog, "uModelViewMatrix");
        this.iProjectionMatrix = gl.getUniformLocation(this.prog, "uProjectionMatrix");
        this.iColor = gl.getUniformLocation(this.prog, "color");
    }
}
export { ShaderProgram };
