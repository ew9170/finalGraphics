'use strict';
  // Global variables that are set and used
  // across the application

let gl,
    program,
    points,
    bary,
    indices;
  
  // VAO stuff
  let myVAO = null;
  let myVertexBuffer = null;
  let myBaryBuffer = null;
  let myIndexBuffer = null;
    
  // Other globals with default values;
  let division1 = 3;
  let division2 = 1;
  let updateDisplay = true;
  let anglesReset = [30.0, 30.0, 0.0];
  let angles = [30.0, 30.0, 0.0];
  let angleInc = 5.0;
  
  // Shapes we can draw
  let CUBE = 1;
  let CYLINDER = 2;
  let CONE = 3;
  let SPHERE = 4;
  let curShape = CUBE;

  let screenWidth = window.innerWidth;
  let screenHeight = window.innerHeight;

  let cameraPos = [0, 0, 0];
  let cameraRot = [0, 0, 0]; // rotation in degrees

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
    program.aBary = gl.getAttribLocation(program, 'bary');
    program.uFinalMatrix = gl.getUniformLocation(program, 'finalMatrix');
  }

  // general call to make and bind a new object based on current
  // settings..Basically a call to shape specfic calls in cgIshape.js
  function createNewShape() {
      
      // clear your points and elements
      points = [];
      indices = [];
      bary = [];
      
      // make your shape based on type
      if (curShape === CUBE) makeCube (division1);
      else
          console.error(`Bad object type`);
          
      //create and bind VAO
      if (myVAO == null) myVAO = gl.createVertexArray();
      gl.bindVertexArray(myVAO);
      
      // create and bind vertex buffer
      if (myVertexBuffer == null) myVertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, myVertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(program.aVertexPosition);
      gl.vertexAttribPointer(program.aVertexPosition, 4, gl.FLOAT, false, 0, 0);
      
      // create and bind bary buffer
      if (myBaryBuffer == null) myBaryBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, myBaryBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bary), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(program.aBary);
      gl.vertexAttribPointer(program.aBary, 3, gl.FLOAT, false, 0, 0);

      // uniform values
      let modelMatrix = glMatrix.mat4.create();
      const viewMatrix = glMatrix.mat4.create();
      const projectionMatrix = glMatrix.mat4.create();

      glMatrix.mat4.perspective(projectionMatrix, 45, gl.canvas.width / gl.canvas.height, 0.0001, 1000.0);

      const mvMatrix = glMatrix.mat4.create();
      const mvpMatrix = glMatrix.mat4.create();

      glMatrix.mat4.translate(modelMatrix, modelMatrix, [0, 0, -3]);

      let eye = glMatrix.vec3.fromValues(eye_store[0], eye_store[1], eye_store[2]);  // Initial camera position
      let target = glMatrix.vec3.fromValues(target_store[0], target_store[1], target_store[2]);  // Point the camera is looking at
      let up = glMatrix.vec3.fromValues(up_store[0], up_store[1], up_store[2]);  // Up direction

      glMatrix.mat4.lookAt(viewMatrix, eye, target, up);

      // glMatrix.mat4.translate(viewMatrix, viewMatrix, [-1, 0, 1]);
      // glMatrix.mat4.rotateX(viewMatrix, viewMatrix, glMatrix.glMatrix.toRadian(cameraRot[0]));
      // glMatrix.mat4.rotateY(viewMatrix, viewMatrix, glMatrix.glMatrix.toRadian(cameraRot[1]));
      // glMatrix.mat4.rotateZ(viewMatrix, viewMatrix, glMatrix.glMatrix.toRadian(cameraRot[2]));
      // glMatrix.mat4.invert(viewMatrix, viewMatrix);

      // Apply transformations
      let cameraPosLocation = glMatrix.vec3.fromValues(cameraPos[0], cameraPos[1], cameraPos[2]);
      modelMatrix = glMatrix.mat4.translate(modelMatrix, modelMatrix, cameraPosLocation);

      glMatrix.mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
      glMatrix.mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);

      let finalMatrixLocation = gl.getUniformLocation(program, 'finalMatrix');

      gl.uniformMatrix4fv(finalMatrixLocation, false, mvpMatrix);
      
      // Setting up the IBO
      if (myIndexBuffer == null) myIndexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, myIndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

      // Clean
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
          
      // indicate a redraw is required.
      updateDisplay = true;
  }

  // We call draw to render to our canvas
  function draw() {
    // Clear the scene
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Bind the VAO
    gl.bindVertexArray(myVAO);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, myIndexBuffer);

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
    
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.clearColor(0.0,0.0,0.0,1.0)
    gl.depthFunc(gl.LEQUAL)
    gl.clearDepth(1.0)

    // Read, compile, and link your shaders
    initProgram();
    
    // create and bind your current object
    createNewShape();
    
    // do a draw
    draw();
  }
