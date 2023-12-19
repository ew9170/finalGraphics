'use strict';
  // Global variables that are set and used
  // across the application

let gl,
program,
texture,
uvs,
indices;

  // VAO stuff
  let myVAO = null;
  let myVertexBuffer = null;
  let myUVBuffer = null;
  let myIndexBuffer = null;

  let sphereBufferInfo = null;
  let sphereUniforms = null;

  let cubeBuffer = null;
  let cubeUVBuffer = null;
  let cubeTexture = null;
  let cubeBufferInfo = null;

  let cube2Buffer = null;
  let cube2UVBuffer = null;
  let cube2Texture = null;
  let cube2BufferInfo = null;

  let cubeUniforms = null;
  let cube2Uniforms = null;

  let finalMatrix = null;

  let objectsToDraw = null;
    
  // Other globals with default values;
  let division1 = 3;
  let division2 = 1;
  let anglesReset = [30.0, 30.0, 0.0];
  let angles = [30.0, 30.0, 0.0];
  let angleInc = 5.0;
  
  // Shapes we can draw
  let CUBE = 1;
  let curShape = CUBE;

  let screenWidth = window.innerWidth;
  let screenHeight = window.innerHeight;

  let eye_store = [0, 0, 5];  // Initial camera position
  let target_store = [0, 0, 0];  // Point the camera is looking at
  let up_store = [0, 1, 0];  // Up direction
  let speed = 0.05

// Given an id, extract the content's of a shader script
  // from the DOM and return the compiled shader
  function getShader(id) {
    const script = document.getElementById(id);
    const shaderString = script.text.trim();

    // Assign shader depending on the type of shader
    let shader;
    if (script.type === 'x-shader/x-vertex') {
      shader = gl.createShader(gl.VERTEX_SHADER);
    }
    else if (script.type === 'x-shader/x-fragment') {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    }
    else {
      return null;
    }

    // Compile the shader using the supplied shader code
    gl.shaderSource(shader, shaderString);
    gl.compileShader(shader);

    // Ensure the shader is valid
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

function loadImage(url) {
    return new Promise((resolve, reject) => {
        let image = new Image();

        image.onload = () => {
            resolve(image);
        };

        image.onerror = (error) => {
            reject(error);
        };
        image.src = url;
    });
}

// given a list of urls, load them all and return perform the callback when finished loading
async function loadImages(urls) {
      let images = [];
      let imagesToLoad = urls.length;

    for (let imageUrl of urls) {
        try {
            let image = await loadImage(imageUrl);
            images.push(image);
        } catch (error) {
            console.error(`Failed to load image: ${imageUrl}`, error);
        }
    }
    return images;
  }

  // Create a program with the appropriate vertex and fragment shaders
function initProgram() {
    const vertexShader = getShader('vertex-shader');
    const fragmentShader = getShader('fragment-shader');

    // Create a program
    program = gl.createProgram();
    // Attach the shaders to this program
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Could not initialize shaders');
    }

    // Use this program instance
    gl.useProgram(program);
    // We attach the location of these shader values to the program instance
    // for easy access later in the code
    program.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
    program.aVertexTextureCoords = gl.getAttribLocation(program, 'aVertexTextureCoords')
    program.uFinalMatrix = gl.getUniformLocation(program, 'finalMatrix');
    program.uSampler = gl.getUniformLocation(program, 'uSampler');

    indices = [];
    uvs = [];

    cubeBufferInfo = {};
    cube2BufferInfo = {};

    if (cubeBuffer == null) cubeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    cubeBufferInfo.buffer = cubeBuffer;
    cubeBufferInfo.points = makeCube(1);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeBufferInfo.points), gl.STATIC_DRAW);

    // create and bind uv buffer
    if (cubeUVBuffer == null) cubeUVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    cubeBufferInfo.uvBuffer = cubeUVBuffer; // what if some primitives don't have textures?

    // cube 2 buffers
    if (cube2Buffer == null) cube2Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cube2Buffer);
    cube2BufferInfo.points = makeCube(1, 2);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube2BufferInfo.points), gl.STATIC_DRAW);
    cube2BufferInfo.buffer = cube2Buffer;

    // should be same uvs
    if (cube2UVBuffer == null) cube2UVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cube2UVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    cube2BufferInfo.uvBuffer = cube2UVBuffer;

    // set up uniforms

    cubeUniforms = {
        uFinalMatrix: gl.getUniformLocation(program, 'finalMatrix'),
        uSampler: gl.getUniformLocation(program, 'uSampler'),
    };

    objectsToDraw = [
        {
            programInfo: program,
            bufferInfo: cubeBufferInfo,
            uniforms: cubeUniforms,
        },
        {
            programInfo: program,
            bufferInfo: cube2BufferInfo,
            uniforms: cube2Uniforms,
        }
        // would insert more objects here
    ];

    // Clean
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    let processed_images = loadImages(
        ['./default_acacia_wood.png', './default_brick.png'],
    )

    processed_images.then(function(images) {
        createNewShapes(images);
    });
}

  // general call to make and bind a new object based on current
  // settings..Basically a call to shape specfic calls in cgIshape.js
  function createNewShapes(images) {
      let iteration = 0;
      objectsToDraw.forEach(function(object) {
          let image = images[iteration++];
          let programInfo = object.programInfo;
          let bufferInfo = object.bufferInfo.buffer;
          let shapePoints = object.bufferInfo.points;
          gl.useProgram(programInfo);

          // set up vertex buffer
          let vertexBuffer = bufferInfo.buffer;
          gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
          gl.enableVertexAttribArray(programInfo.aVertexPosition);
          gl.vertexAttribPointer(programInfo.aVertexPosition, 4, gl.FLOAT, false, 0, 0);

          // set up uv buffer
          let uvBuffer = bufferInfo.uvBuffer;
          gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
          gl.enableVertexAttribArray(programInfo.aVertexTextureCoords);
          gl.vertexAttribPointer(programInfo.aVertexTextureCoords, 2, gl.FLOAT, false, 0, 0);

          // set up texture
          let texture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, texture);
          console.log("createNewShapes: " + object);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

          // set up IBO
          let indexBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, myIndexBuffer);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

          draw();
      });

      // // clear your points and elements
      // points = [];
      // indices = [];
      // uvs = [];
      //
      // // make your shape based on type
      // if (curShape === CUBE) makeCube(1);
      // else
      //     console.error(`Bad object type`);
      //
      // //create and bind VAO
      // if (myVAO == null) myVAO = gl.createVertexArray();
      // gl.bindVertexArray(myVAO);
      //
      // // create and bind vertex buffer
      // if (myVertexBuffer == null) myVertexBuffer = gl.createBuffer();
      // gl.bindBuffer(gl.ARRAY_BUFFER, myVertexBuffer);
      // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
      // gl.enableVertexAttribArray(program.aVertexPosition);
      // gl.vertexAttribPointer(program.aVertexPosition, 4, gl.FLOAT, false, 0, 0);
      //
      // // create and bind uv buffer
      // if (myUVBuffer == null) myUVBuffer = gl.createBuffer();
      // gl.bindBuffer(gl.ARRAY_BUFFER, myUVBuffer);
      // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
      // gl.enableVertexAttribArray(program.aVertexTextureCoords);
      // // note that texture uv's are 2d, which is why there's a 2 below
      // gl.vertexAttribPointer(program.aVertexTextureCoords, 2, gl.FLOAT, false, 0, 0);
      //
      // // uniform values
      // let modelMatrix = glMatrix.mat4.create();
      // const viewMatrix = glMatrix.mat4.create();
      // const projectionMatrix = glMatrix.mat4.create();
      //
      // glMatrix.mat4.perspective(projectionMatrix, 45, gl.canvas.width / gl.canvas.height, 0.0001, 1000.0);
      //
      // const mvMatrix = glMatrix.mat4.create();
      // const mvpMatrix = glMatrix.mat4.create();
      //
      // glMatrix.mat4.translate(modelMatrix, modelMatrix, [0, 0, -3]);
      //
      // let eye = glMatrix.vec3.fromValues(eye_store[0], eye_store[1], eye_store[2]);  // Initial camera position
      // let target = glMatrix.vec3.fromValues(target_store[0], target_store[1], target_store[2]);  // Point the camera is looking at
      // let up = glMatrix.vec3.fromValues(up_store[0], up_store[1], up_store[2]);  // Up direction
      //
      // glMatrix.mat4.lookAt(viewMatrix, eye, target, up);
      //
      // // Apply transformations
      // let cameraPosLocation = glMatrix.vec3.fromValues(cameraPos[0], cameraPos[1], cameraPos[2]);
      // modelMatrix = glMatrix.mat4.translate(modelMatrix, modelMatrix, cameraPosLocation);
      //
      // glMatrix.mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
      // glMatrix.mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);
      //
      // let finalMatrixLocation = gl.getUniformLocation(program, 'finalMatrix');
      //
      // gl.uniformMatrix4fv(finalMatrixLocation, false, mvpMatrix);
      //
      // // Setting up the IBO
      // if (myIndexBuffer == null) myIndexBuffer = gl.createBuffer();
      // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, myIndexBuffer);
      // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
      //
      // // Clean
      // gl.bindVertexArray(null);
      // gl.bindBuffer(gl.ARRAY_BUFFER, null);
      // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  }

  // We call draw to render to our canvas
  function draw() {
    // Clear the scene
    gl.clearColor(0.267, 0.557, 0.894, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Bind the VAO
    gl.bindVertexArray(myVAO);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, myIndexBuffer);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(program.uSampler, 0);
    // Draw to the scene using triangle primitives
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    // Clean
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  // Entry point to our application
  function init() {
    // Retrieve the canvas
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) {
      console.error(`There is no canvas with id ${'webgl-canvas'} on this page.`);
      return null;
    }

    // deal with keypress
    window.addEventListener('keydown', gotKey ,false);

      window.addEventListener('resize', function() {
          screenWidth = window.innerWidth;
          screenHeight = window.innerHeight;

          canvas.width = screenWidth / 2;
          canvas.height = screenHeight / 2;

          gl.viewport(0, 0, screenWidth / 2, screenHeight / 2);
          draw();
      });

    // Retrieve a WebGL context
    gl = canvas.getContext('webgl2');
    canvas.width = screenWidth / 2;
    canvas.height = screenHeight / 2;
    // Set the clear color to be black
    gl.clearColor(0, 0, 0, 1);
      
    // some GL initialization
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.clearColor(0.0,0.0,0.0,1.0)
    gl.depthFunc(gl.LEQUAL)
    gl.clearDepth(1.0)

    // Read, compile, and link your shaders
    initProgram();
    
    // do a draw
    draw();
  }
