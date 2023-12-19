//
// fill in code that creates the triangles for a cube with dimensions 1x1x1
// on each side (and the origin in the center of the cube). with an equal
// number of subdivisions along each cube face as given by the parameter
//subdivisions
//
function makeCube (subdivisions, xOffset= 0)  {
    let p1 = [-0.5 + xOffset, -0.5, 0.5];
    let p2 = [0.5 + xOffset, -0.5, 0.5];
    let p3 = [0.5 + xOffset, 0.5, 0.5];
    let p4 = [-0.5 + xOffset, 0.5, 0.5];

    let pb1 = [0.5 + xOffset, -0.5, -0.5];
    let pb2 = [-0.5 + xOffset, -0.5, -0.5];
    let pb3 = [-0.5 + xOffset, 0.5, -0.5];
    let pb4 = [0.5 + xOffset, 0.5, -0.5];

    let points_list = []


    // initial front face
    subdivideQuad(p1, p2, p3, p4, subdivisions, points_list);

    // initial back face
    subdivideQuad(pb1, pb2, pb3, pb4, subdivisions, points_list);

    // initial left face
    subdivideQuad(pb2, p1, p4, pb3, subdivisions, points_list);

    // initial right face
    subdivideQuad(p2, pb1, pb4, p3, subdivisions, points_list);

    // initial top face
    subdivideQuad(p4, p3, pb4, pb3, subdivisions, points_list);

    // initial bottom face
    subdivideQuad(pb2, pb1, p2, p1, subdivisions, points_list);

    return points_list;
}


function makeInvertedCube (subdivisions) {
    let p1 = [-50, -50, 50];
    let p2 = [50, -50, 50];
    let p3 = [50, 50, 50];
    let p4 = [-50, 50, 50];

    let pb1 = [50, -50, -50];
    let pb2 = [-50, -50, -50];
    let pb3 = [-50, 50, -50];
    let pb4 = [50, 50, -50];

    // initial front face
    subdivideQuad(p1, p2, p3, p4, subdivisions);

    // initial back face
    subdivideQuad(pb1, pb2, pb3, pb4, subdivisions);

    // initial left face
    subdivideQuad(pb2, p1, p4, pb3, subdivisions);

    // initial right face
    subdivideQuad(p2, pb1, pb4, p3, subdivisions);
}

function subdivideQuad(p1, p2, p3, p4, subdivisions, points_list) {
    if (subdivisions === 1) {
        drawQuadrilateral(p1, p2, p3, p4, points_list);
    }
    else {
        // find middle points of each side
        const p12 = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
        const p23 = [(p2[0] + p3[0]) / 2, (p2[1] + p3[1]) / 2, (p2[2] + p3[2]) / 2];
        const p34 = [(p3[0] + p4[0]) / 2, (p3[1] + p4[1]) / 2, (p3[2] + p4[2]) / 2];
        const p41 = [(p4[0] + p1[0]) / 2, (p4[1] + p1[1]) / 2, (p4[2] + p1[2]) / 2];

        // given a plane, find the z value of the center of the plane, could probably be done with 2 points
        const z = (p1[2] + p2[2] + p3[2] + p4[2]) / 4;

        const center = [(p1[0] + p2[0]) / 2, (p1[1] + p4[1]) / 2, z];


        // draw 4 subdivisions for each face
        subdivideQuad(p1, p12, center, p41, subdivisions - 1);
        subdivideQuad(p12, p2, p23, center, subdivisions - 1);
        subdivideQuad(center, p23, p3, p34, subdivisions - 1);
        subdivideQuad(p41, center, p34, p4, subdivisions - 1);
    }
}

function drawQuadrilateral(p1, p2, p3, p4, points_list) {
    // given 4 tuples of 3D points, draw a quadrilateral
    // p1 is the bottom left point, p2 is the bottom right
    // p3 is the top left, p4 is top right
    // bottom left triangle
    addTriangle(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2], p3[0], p3[1], p3[2], points_list);

    uvs.push(0.0);
    uvs.push(0.0);
    uvs.push(1.0);
    uvs.push(0.0);
    uvs.push(1.0);
    uvs.push(1.0);

    // top right triangle
    addTriangle(p1[0], p1[1], p1[2], p3[0], p3[1], p3[2], p4[0], p4[1], p4[2], points_list);
    uvs.push(0.0);
    uvs.push(0.0);
    uvs.push(1.0);
    uvs.push(1.0);
    uvs.push(0.0);
    uvs.push(1.0);
}


////////////////////////////////////////////////////////////////////
//
//  Do not edit below this line
//
///////////////////////////////////////////////////////////////////

function radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

function addTriangle(x0, y0, z0, x1, y1, z1, x2, y2, z2, point_array) {
    let nverts = point_array.length / 4;

    // push first vertex
    point_array.push(x0);
    point_array.push(y0);
    point_array.push(z0);
    point_array.push(1.0);
    indices.push(nverts);
    nverts++;

    // push second vertex
    point_array.push(x1);
    point_array.push(y1);
    point_array.push(z1);
    point_array.push(1.0);
    indices.push(nverts);
    nverts++

    // push third vertex
    point_array.push(x2);
    point_array.push(y2);
    point_array.push(z2);
    point_array.push(1.0);
    indices.push(nverts);
    nverts++;
}

function incrementUniformTranslationX(opposite=false) {
    let forward = glMatrix.vec3.create();
    let right = glMatrix.vec3.create();
    let up = glMatrix.vec3.fromValues(up_store[0], up_store[1], up_store[2]);
    let scale = opposite? -speed : speed;
    // calculate forward vector from target and eye
    glMatrix.vec3.subtract(
        forward,
        glMatrix.vec3.fromValues(target_store[0], target_store[1], target_store[2]),
        glMatrix.vec3.fromValues(eye_store[0], eye_store[1], eye_store[2])
    );

    glMatrix.vec3.normalize(forward, forward);

    // calculate the right
    glMatrix.vec3.cross(right, forward, up);
    glMatrix.vec3.normalize(right, right);

    // translate using right vector
    glMatrix.vec3.scaleAndAdd(eye_store, eye_store, right, scale);
    glMatrix.vec3.scaleAndAdd(target_store, target_store, right, scale);
}

function incrementUniformTranslationZ(opposite=false) {
    let forward = glMatrix.vec3.create();
    let right = glMatrix.vec3.create();
    let up = glMatrix.vec3.fromValues(up_store[0], up_store[1], up_store[2]);
    let scale = opposite? -speed : speed;

    glMatrix.vec3.subtract(
        forward,
        glMatrix.vec3.fromValues(target_store[0], target_store[1], target_store[2]),
        glMatrix.vec3.fromValues(eye_store[0], eye_store[1], eye_store[2])
    );

    glMatrix.vec3.normalize(forward, forward);

    // calculate the right
    glMatrix.vec3.cross(right, forward, up);
    glMatrix.vec3.normalize(right, right);

    // rotation is a vec3 rotation vector
    glMatrix.vec3.scaleAndAdd(eye_store, eye_store, forward, scale);
}

// move left and right
function incrementUniformTranslationY(opposite=false) {
    let forward = glMatrix.vec3.create();
    let right = glMatrix.vec3.create();
    let up = glMatrix.vec3.fromValues(up_store[0], up_store[1], up_store[2]);
    let scale = opposite? -speed : speed;

    glMatrix.vec3.subtract(
        forward,
        glMatrix.vec3.fromValues(target_store[0], target_store[1], target_store[2]),
        glMatrix.vec3.fromValues(eye_store[0], eye_store[1], eye_store[2])
    );

    glMatrix.vec3.normalize(forward, forward);

    // calculate the right
    glMatrix.vec3.cross(right, forward, up);
    glMatrix.vec3.normalize(right, right);

    // calculate up vector
    glMatrix.vec3.cross(up, right, forward);
    glMatrix.vec3.normalize(up, up);

    // rotation is a vec3 rotation vector
    glMatrix.vec3.scaleAndAdd(eye_store, eye_store, up, scale);
    glMatrix.vec3.scaleAndAdd(target_store, target_store, up, scale);
}

function resetUniformTranslation() {
    eye_store = [0, 0, 1];
    target_store = [0, 0, 0];
    up_store = [0, 1, 0];
}

function incrementUniformRotationX(opposite=false) {
    let forward = glMatrix.vec3.create();
    let right = glMatrix.vec3.create();
    let up = glMatrix.vec3.fromValues(up_store[0], up_store[1], up_store[2]);
    let scale = opposite? -speed : speed;
    // calculate forward vector from target and eye
    glMatrix.vec3.subtract(
        forward,
        glMatrix.vec3.fromValues(target_store[0], target_store[1], target_store[2]),
        glMatrix.vec3.fromValues(eye_store[0], eye_store[1], eye_store[2])
    );

    glMatrix.vec3.normalize(forward, forward);

    // calculate the right
    glMatrix.vec3.cross(right, forward, up);
    glMatrix.vec3.normalize(right, right);

    // translate using right vector
    glMatrix.vec3.scaleAndAdd(target_store, target_store, up, scale);
}

function incrementUniformRotationY(opposite=false) {
    let forward = glMatrix.vec3.create();
    let right = glMatrix.vec3.create();
    let up = glMatrix.vec3.fromValues(up_store[0], up_store[1], up_store[2]);
    let scale = opposite? -speed : speed;

    // calculate forward vector from target and eye
    glMatrix.vec3.subtract(
        forward,
        glMatrix.vec3.fromValues(target_store[0], target_store[1], target_store[2]),
        glMatrix.vec3.fromValues(eye_store[0], eye_store[1], eye_store[2])
    );

    glMatrix.vec3.normalize(forward, forward);

    // calculate the right
    glMatrix.vec3.cross(right, forward, up);
    glMatrix.vec3.normalize(right, right);

    // translate using right vector
    glMatrix.vec3.scaleAndAdd(target_store, target_store, right, scale);
}

function increaseSpeed(size = 0.05) {
    speed += size;
}



