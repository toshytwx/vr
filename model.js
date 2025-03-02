class Model {
    constructor(name) {
        this.name = name;
        this.vertices = [];
        this.uLines = [];
        this.vLines = [];
        this.indices = [];
        this.normals = [];
    }

    bindBufferData(gl, shProgram) {
        this.vertices = this.generateVertices();

        this.iVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        this.iNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);

        this.generateIndices();
        this.iIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
    }

    draw(gl, shProgram) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }
    

    generateVertices() {
        return this.uLines.flat(2).concat(this.vLines.flat(2));
    }

    generateIndices() {
        this.indices = [];
        const uSegments = this.uLines.length;
        const vSegments = this.vLines.length;

        for (let u = 0; u < uSegments - 1; u++) {
            for (let v = 0; v < vSegments - 1; v++) {
                const topLeft = u * vSegments + v;
                const topRight = topLeft + 1;
                const bottomLeft = (u + 1) * vSegments + v;
                const bottomRight = bottomLeft + 1;

                this.indices.push(topLeft, bottomLeft, topRight);
                this.indices.push(bottomLeft, bottomRight, topRight);
            }
        }
    }

    createSurfaceData(a, c, theta, uGranularity, vGranularity) {
        let numSegments = uGranularity;
        let numSteps = vGranularity;
        let maxT = 1.0;
        theta = this.deg2rad(theta);
    
        for (let i = 0; i <= numSegments; i++) {
            let uLine = [];
            let u = this.deg2rad(i * 360 / numSegments);
    
            for (let t = 0; t <= maxT; t += maxT / numSteps) {
                let cosTheta = Math.cos(theta);
                let sinTheta = Math.sin(theta);
                let ctSquared = c * t * t;
    
                let x = (a + t * cosTheta + ctSquared * sinTheta) * Math.cos(u);
                let y = (a + t * cosTheta + ctSquared * sinTheta) * Math.sin(u);
                let z = -t * sinTheta + ctSquared * cosTheta;
                
                uLine.push([x, y, z]);
            }
            this.uLines.push(uLine);
        }

        this.vLines = this.transpose(this.uLines);
        this.normals = this.calculateTangentsAndNormals(a, c, theta);
    }

    calculateTangentsAndNormals(a, c, theta) {
        const dU = 0.01;
        const dV = 0.01;
    
        const normals = [];
    
        theta = this.deg2rad(theta);
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
    
        for (let uIndex = 0; uIndex < this.uLines.length; uIndex++) {
            for (let vIndex = 0; vIndex < this.uLines[uIndex].length; vIndex++) {
                const [x, y, z] = this.uLines[uIndex][vIndex];
    
                const uShifted = uIndex * (2 * Math.PI / (this.uLines.length - 1)) + dU;
                const vShifted = vIndex * (1.0 / (this.vLines.length - 1)) + dV;
    
                const xU = (a + vShifted * cosTheta + (c * vShifted ** 2) * sinTheta) * Math.cos(uShifted);
                const yU = (a + vShifted * cosTheta + (c * vShifted ** 2) * sinTheta) * Math.sin(uShifted);
                const zU = -vShifted * sinTheta + (c * vShifted ** 2) * cosTheta;
                const tangentU = [xU - x, yU - y, zU - z];
    
                const xV = (a + (vShifted + dV) * cosTheta + (c * (vShifted + dV) ** 2) * sinTheta) * Math.cos(uIndex * (2 * Math.PI / (this.uLines.length - 1)));
                const yV = (a + (vShifted + dV) * cosTheta + (c * (vShifted + dV) ** 2) * sinTheta) * Math.sin(uIndex * (2 * Math.PI / (this.uLines.length - 1)));
                const zV = -(vShifted + dV) * sinTheta + (c * (vShifted + dV) ** 2) * cosTheta;
                const tangentV = [xV - x, yV - y, zV - z];
    
                const normal = this.normalize(this.crossProduct(tangentU, tangentV));
                normals.push(...normal);
            }
        }

        return normals;
    }

    crossProduct(u, v) {
        return [
            u[1] * v[2] - u[2] * v[1],
            u[2] * v[0] - u[0] * v[2],
            u[0] * v[1] - u[1] * v[0]
        ];
    }
    
    normalize(vec) {
        const length = Math.sqrt(vec[0]**2 + vec[1]**2 + vec[2]**2);
        return vec.map(coord => coord / length);
    }
    

    transpose(matrix) {
        const [numRows, numCols] = [matrix.length, matrix[0].length];
        return Array.from({ length: numCols }, (_, col) =>
            Array.from({ length: numRows }, (_, row) => matrix[row][col])
        );
    }

    deg2rad(angle) {
        return angle * Math.PI / 180;
    }
}

export { Model };
