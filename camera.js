class Camera {
    viewMatrix = glMatrix.mat4.create();
    projectionMatrix = glMatrix.mat4.create();
    viewProjectionMatrix = glMatrix.mat4.create();
    position = glMatrix.vec3.create();
    target = glMatrix.vec3.create();

    constructor(gl, fov, aspect, near, far) {
        this.projectionMatrix = glMatrix.mat4.perspective(this.projectionMatrix, fov, aspect, near, far);
    }


}