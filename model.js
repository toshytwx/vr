class Vertex {
    constructor(p) {
        this.p = p;
        this.normal = [];
        this.triangles = [];
    }
}

class Triangle {
    constructor(v0, v1, v2) {
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
        this.normal = [];
        this.tangent = [];
    }
}

class Model {
    constructor(name) {
        this.name = name;
        this.vertices = [];
        this.indices = [];
        this.texCoords = [];
        this.count = -1;
    }

    bindBufferData(gl, shProgram, data) {
        this.iVertexBuffer = gl.createBuffer();
        this.iIndexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, data.verticesF32, gl.STATIC_DRAW);
        gl.vertexAttribPointer(shProgram.iAttribPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribPosition);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indicesU16, gl.STATIC_DRAW);

        if (this.texCoords.length > 0) {
            this.texBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.texCoords), gl.STATIC_DRAW);
            gl.vertexAttribPointer(shProgram.iAttribTexCoord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shProgram.iAttribTexCoord);
        }

        this.count = data.indicesU16.length;
    }

    draw(gl) {
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }

    drawWireframe(gl) {
        for (let p = 0; p < this.count; p += 3) {
            gl.drawElements(gl.LINE_LOOP, 3, gl.UNSIGNED_SHORT, p * 2);
        }
    }

    createWebCamSurfaceData(data) {
        let vertices = [];
        let triangles = [];

        vertices.push(new Vertex([0, 0, 0])); // v0
        vertices.push(new Vertex([1, 0, 0])); // v1
        vertices.push(new Vertex([1, 1, 0])); // v2

        vertices.push(new Vertex([1, 1, 0])); // v2
        vertices.push(new Vertex([0, 1, 0])); // v3
        vertices.push(new Vertex([0, 0, 0])); // v0

        let trian1 = new Triangle(0, 1, 2);
        let trian2 = new Triangle(3, 4, 5);

        triangles.push(trian1, trian2);

        this.generateVerticesAndIndicesArrays(vertices, triangles, data);
        this.texCoords = [1, 1, 0,
            1, 0, 0,
            0, 0, 1,
            0, 1, 1];
    }

    createSurfaceData(data) {
        let vertices = [];
        let triangles = [];

        let a = 1.0;
        let c = 0.5;
        let theta = Math.PI / 6;

        let numU = 72;
        let numT = 10;
        let tMin = -1, tMax = 1;

        for (let i = 0; i < numT; i++) {
            let t = tMin + (tMax - tMin) * (i / (numT - 1));
            for (let j = 0; j < numU; j++) {
                let u = (j / numU) * 2 * Math.PI;
                let r = a + t * Math.cos(theta) + c * t * t * Math.sin(theta);
                let x = r * Math.cos(u);
                let y = r * Math.sin(u);
                let z = -t * Math.sin(theta) + c * t * t * Math.cos(theta);
                vertices.push(new Vertex([x, y, z]));
            }
        }

        for (let i = 0; i < numT - 1; i++) {
            for (let j = 0; j < numU; j++) {
                let v0 = i * numU + j;
                let v1 = i * numU + (j + 1) % numU;
                let v2 = (i + 1) * numU + j;
                let v3 = (i + 1) * numU + (j + 1) % numU;

                triangles.push(new Triangle(v0, v1, v2));
                triangles.push(new Triangle(v1, v3, v2));
            }
        }

        this.generateVerticesAndIndicesArrays(vertices, triangles, data);
    }

    generateVerticesAndIndicesArrays(vertices, triangles, data) {
        data.verticesF32 = new Float32Array(vertices.length * 3);
        for (let i = 0; i < vertices.length; i++) {
            data.verticesF32[i * 3 + 0] = vertices[i].p[0];
            data.verticesF32[i * 3 + 1] = vertices[i].p[1];
            data.verticesF32[i * 3 + 2] = vertices[i].p[2];
        }

        data.indicesU16 = new Uint16Array(triangles.length * 3);
        for (let i = 0; i < triangles.length; i++) {
            data.indicesU16[i * 3 + 0] = triangles[i].v0;
            data.indicesU16[i * 3 + 1] = triangles[i].v1;
            data.indicesU16[i * 3 + 2] = triangles[i].v2;
        }

        return data;
    }
}

export { Model };
