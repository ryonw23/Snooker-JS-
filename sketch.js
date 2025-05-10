// Matter.js variables
var Engine = Matter.Engine;
var Render = Matter.Render;
var World = Matter.World;
var Bodies = Matter.Bodies;
var Body = Matter.Body;
var engine;

// Initialise categories for collision filters
var cueStickCategory = 0x0001;
var pocketCategory = 0x0002;

// Initialise variables for table
var table;
var tableWidth = 400;
var walls = [];
var wallThickness;
var leftBound;
var rightBound;
var upperBound;
var lowerBound;
var horizontalWallLength;
var verticalWallHeight;

// Initialise variables for all balls
var ballDiam = tableWidth/36;

// Initialise variables for pockets
var pockets = [];
var pottedBalls = [];
var pocketDiam = ballDiam*1.5; 

// Initialise variables for cue balls
var cueBalls = [];
var isCueBallMoving;

// Initialise variables for red balls
var redBalls = [];
var isRedBallMoving;

// Initialise variables for colour balls
var colourBalls = [];
var isColourBallMoving;

// Initialise variables for cue stick
var stickHandle;
var stickEnd;
var stickDistance;
var stickEndDistance;
var stickDragging = false;
var mouseWasPressed = false;
var aimAssist = false;

// Initialise variables for menu and popups
var menu = true;
var mode = 0;
var displayDelay = 400;
var displayingFoul = false;

// Initialise variables for control type (mouse or key)
var delay = 1;
var mouseControls = true;
var keyControls = false;
var keyAngle = 0;
var keyDistance = 0;
var keyStrike = false;

// Initialise turns to increment each time ball is striked (allows for reseting cuestick to prevent errors)
var turns = 0;

// Initialise variables for weather challenge
var weatherMode;
var weatherModes = ['normal','snow','rain'];
var weatherBackground;

// How weather affects physics
var ballsRestitutions = [0.95,1,0.8];
var wallsRestitutions = [0.85,1,0.7];
var strikeMagnitudes = [0.00035,0.0004,0.0003];
var frictions = [0.0095,0.004,0.012];

var ballRes;
var wallRes;
var strikeMag;
var friction;


// Assign index to toggle through weather modes
var index = 0;

var snowflakes = [];
var snowflakesCount = 200;
var snowflakesMinRad;
var snowflakesMaxRad = 12;

var raindrops = [];
var raindropsCount = 200;
var raindropsMinRad;
var raindropsMaxRad = 7;

function setup() 
{
  canvas = createCanvas(1000, 600);

  // Assign table boundaries based on canvas size and table size
  leftBound = (width-tableWidth*2)/2 + ballDiam*2;
  rightBound = (tableWidth*2) + leftBound - ballDiam*4;
  upperBound = (height-tableWidth)/2 + ballDiam*2;
  lowerBound = tableWidth + upperBound - ballDiam*4;

  // Create engine
  engine = Engine.create();
  engine.world.gravity.y = 0;

  // Initialise tables, pockets and cuestick
  setupTable(tableWidth);
  setupPockets(pocketDiam);
  setupCueStick();

  // Initialise weather modes
  weatherMode = weatherModes[index];
  for (let i = 0; i < raindropsCount; i++) 
  {
    raindrops.push(new Raindrop());
  }
  for (let i = 0; i < snowflakesCount; i++) 
  {
    snowflakes.push(new Snowflake());
  }
}

function draw() 
{
  // Randomise minmmum radius for snowflakes and raindrops every frame
  raindropsMinRad = random(0,1.5);
  snowflakesMinRad = random(0,2);

  // Set background based on weather condition
  // Set physics based on weather condition
  checkWeather();

  // Update physics due to weather
  updatePhysics();

  background(weatherBackground);

  Engine.update(engine);

  // Draw table and pockets after setting up (table drawn first to be behind balls and pockets)
  drawTable(tableWidth);
  drawPockets();

  // Set up balls based on mode chosen (1,2,3 according to coursework requirement 3)
  // Mode 1: Standard placement of all balls
  if(mode == 1)
  {
    pottedBalls = [];
    for(var i = redBalls.length-1; i >= 0; i--)
    {
      deleteFromWorld(redBalls[i]);
      redBalls.splice(i,1);
    }
    for(var i = colourBalls.length-1; i >= 0; i--)
    {
      deleteFromWorld(colourBalls[i]);
      colourBalls.splice(i,1);
    }
    for(var i = cueBalls.length-1; i >= 0; i--)
    {
      deleteFromWorld(cueBalls[i]);
      cueBalls.splice(i,1);
    }
    setupColourBalls(mode);
    setupRedBalls(mode);
    mode = 0;
  }
  // Mode 2: Random placement of red balls, standard placement of colour balls
  else if(mode == 2)
  {
    pottedBalls = [];
    for(var i = redBalls.length-1; i >= 0; i--)
    {
      deleteFromWorld(redBalls[i]);
      redBalls.splice(i,1);
    }
    for(var i = colourBalls.length-1; i >= 0; i--)
    {
      deleteFromWorld(colourBalls[i]);
      colourBalls.splice(i,1);
    }
    for(var i = cueBalls.length-1; i >= 0; i--)
    {
      deleteFromWorld(cueBalls[i]);
      cueBalls.splice(i,1);
    }
    setupColourBalls(mode);
    setupRedBalls(mode);
    mode = 0;
  }
  // Mode 3: Random placement of all balls
  else if(mode == 3)
  {
    pottedBalls = [];
    for(var i = redBalls.length-1; i >= 0; i--)
    {
      deleteFromWorld(redBalls[i]);
      redBalls.splice(i,1);
    }
    for(var i = colourBalls.length-1; i >= 0; i--)
    {
      deleteFromWorld(colourBalls[i]);
      colourBalls.splice(i,1);
    }
    for(var i = cueBalls.length-1; i >= 0; i--)
    {
      deleteFromWorld(cueBalls[i]);
      cueBalls.splice(i,1);
    }
    setupColourBalls(mode);
    setupRedBalls(mode);
    mode = 0;
  }
  // Check if mode is out of bounds, return to default empty table
  else if(mode > 3 || mode < 0)
  {
    mode = 0;
  }
  // Draw balls after setting up 
  drawBalls('colours');
  drawBalls('red');
  drawBalls('white');

  // Prevent placing cueball without initialising other balls or when there are no balls
  if((redBalls.length > 0 || colourBalls.length > 0) && !menu)
  {
    // Draw placeholder balls when there is no current cue ball
    if(cueBalls.length == 0)
    {
      drawPlaceholderCueBall(mouseX,mouseY);
      isMouseInBall(mouseX,mouseY);
    }
    else 
    {
      // Once cue ball is placed (upon mouse click), run collision checks
      detectCollision();
      // If any ball is moving, remove cue stick out of frame
      if (isRedBallMoving || isCueBallMoving || isColourBallMoving) 
      {
        // Hide cue stick
        Body.setPosition(stickEnd, {x: 100000, y: 100000});
        Body.setPosition(stickHandle, {x: 100000, y: 100000});
      } 
      else 
      {
        // Bring cue stick back once all balls stop moving
        updateCueStick();
      }
    }
  }  
  // Check for menu toggle
  if(menu)
  {
    // Draw menu
    drawMenu();
  }
  // Make use of "turns" variable to refresh controls after each shot taken
  if(turns > 0)
  {
    refreshControls();
    updateCueStick();
    turns = 0;
  }
  // Check for every 2 consecutive potted balls
    checkConsecutivePots();

  if(!menu)
  {
    drawWeatherConditions();
  }
}

// Function to set up table
function setupTable(size)
{
  // Allow easy adjustment of walls based on table width
  var wallThicknessRatio = 1/2 / 12;
  wallThickness = wallThicknessRatio * 3/4 * size;

  horizontalWallLength = size*8/9+32;
  verticalWallHeight = size*6/7+34;

  var upperY = height/2-size/2+wallThickness/2;
  var lowerY = height/2-size/2+size-wallThickness/2;
  var sideY = height/2;

  var horizontalLeftX = width/2-size/2+5;
  var horizontalRightX = width/2+size/2-5;

  var sideLeftX = width/2+size-wallThickness/2;
  var sideRightX = width/2-size+wallThickness/2;

  // Create matter.js bodies for upper wall
  walls.push(Bodies.trapezoid(horizontalLeftX,upperY,horizontalWallLength, wallThickness, 0.08, {isStatic: true, density:1, restitution: wallRes, angle: PI, label: 'wall'} ))
  walls.push(Bodies.trapezoid(horizontalRightX, upperY, horizontalWallLength, wallThickness, 0.08, {isStatic: true, density:1, restitution: wallRes, angle: PI, label: 'wall'} ));

  // Create matter.js bodies for lower wall
  walls.push(Bodies.trapezoid(horizontalLeftX, lowerY, horizontalWallLength, wallThickness, 0.08, {isStatic: true, density:1, restitution: wallRes, angle: 0, label: 'wall'} ));
  walls.push(Bodies.trapezoid(horizontalRightX, lowerY, horizontalWallLength, wallThickness, 0.08, {isStatic: true, density:1, restitution: wallRes, angle: 0, label: 'wall'} ));

  // Create matter.js bodies for side walls
  walls.push(Bodies.trapezoid(sideLeftX, sideY, verticalWallHeight, wallThickness, 0.08, {isStatic: true, density:1, restitution: wallRes, angle: -PI/2, label: 'wall'}));
  walls.push(Bodies.trapezoid(sideRightX, sideY, verticalWallHeight, wallThickness, 0.08, {isStatic: true, density:1, restitution: wallRes, angle: PI/2, label: 'wall'}));

  // Iterate through walls array and add each wall to world engine
  for(var i = 0; i< walls.length; i++)
  {
    World.add(engine.world, [walls[i]]);
  }
}

// Function to draw table
function drawTable(size)
{
  // Use push and pop to prevent any changes from spilling over to other objects
  push();
  rectMode(CENTER);
  // Draw base playing area
  if(weatherMode == weatherModes[0])
  {
    fill('green');
  }
  if(weatherMode == weatherModes[1])
  {
    fill('ghostwhite');
  }
  if(weatherMode == weatherModes[2])
  {
    fill('darkgreen');
  }
  rect(width/2,height/2,size*2,size);

  // Draw line and D-zone
  var arcDiam = size/3;
  var lineX = width/2-size+size*2/5;
  var lineY = height/2-size/2;
  strokeWeight(5);
  if(weatherMode == weatherModes[1])
  {
    stroke('green');
  }
  else
  {
    stroke('white');
  }
  line(lineX,lineY,lineX,lineY+size);
  noFill();
  arc(lineX, height/2, arcDiam, arcDiam, PI/2, -PI/2,CHORD);

  // Draw walls
  noStroke();
  if(weatherMode == weatherModes[0])
  {
    fill('darkgreen');
  }
  if(weatherMode == weatherModes[1])
  {
    fill('darkseagreen');
  }
  if(weatherMode == weatherModes[2])
  {
    fill('darkolivegreen');
  }
  // Iterate through all walls and draw them
  for(var i = 0; i< walls.length; i++)
  {
    drawBodies(walls[i].vertices);
  };

  // Draw gold of outer layer
  noFill();
  stroke('gold')
  strokeWeight(10);
  rect(width/2,height/2,size*2+2,size+2,10);

  var horizontalWoodLength = size*8/9+16;
  var verticalWoodHeight = size*6/7+20;
  var woodThickness = 10;
  var offset = 1;

  var upperY = height/2-size/2;
  var lowerY = height/2-size/2+size;
  var sideY = height/2;

  var horizontalLeftX = width/2-size/2+4;
  var horizontalRightX = width/2+size/2-4;

  var sideRightX = width/2+size;
  var sideLeftX = width/2-size;
  // Draw wood of outer layer
  fill('brown');
  noStroke();

  rect(horizontalLeftX,upperY-offset,horizontalWoodLength,woodThickness);
  rect(horizontalRightX,upperY-offset,horizontalWoodLength,woodThickness);
  rect(horizontalLeftX,lowerY+offset,horizontalWoodLength,woodThickness);
  rect(horizontalRightX,lowerY+offset,horizontalWoodLength,woodThickness);

  rect(sideRightX+offset,sideY,woodThickness,verticalWoodHeight);
  rect(sideLeftX-offset,sideY,woodThickness,verticalWoodHeight);

  pop();
}

// Function to set up pockets
function setupPockets(size)
{
  var leftX = width/2-tableWidth+size/2;
  var rightX = width/2+tableWidth-size/2;
  var middleX = width/2;

  var offset = 3;
  var upperY = height/2-tableWidth/2+size/2;
  var lowerY = height/2+tableWidth/2-size/2;

  var pocketSize = size/2

  // Set up upper pockets
  pockets.push(Bodies.circle(leftX, upperY, pocketSize,{collisionFilter: {category: pocketCategory, mask: 0x0000}}));
  pockets.push(Bodies.circle(middleX, upperY-offset, pocketSize,{collisionFilter: {category: pocketCategory, mask: 0x0000}}));
  pockets.push(Bodies.circle(rightX, upperY, pocketSize,{collisionFilter: {category: pocketCategory, mask: 0x0000}}));

  // Set up lower pockets
  pockets.push(Bodies.circle(leftX, lowerY, pocketSize,{collisionFilter: {category: pocketCategory, mask: 0x0000}}));
  pockets.push(Bodies.circle(middleX, lowerY+offset, pocketSize,{collisionFilter: {category: pocketCategory, mask: 0x0000}}));
  pockets.push(Bodies.circle(rightX, lowerY, pocketSize,{collisionFilter: {category: pocketCategory, mask: 0x0000}}));
}

// Function to draw pockets
function drawPockets()
{
  // Use push and pop to prevent any changes from spilling over to other objects
  push();
  fill('black');
  // Iterate through all pockets and draw them
  for(var i = 0; i < pockets.length; i++)
  {
    drawBodies(pockets[i].vertices);
  }
  pop();
}

// Function to check if ball enters pocket (i.e. potted)
function isInPocket(body)
{
  var pos = body.position;
  // Iterate through all pockets
  for(var i = 0; i < pockets.length; i++)
  {
    // Check if distance between ball center and pocket is less than the radius of the pocket
    var distance  = dist(pos.x,pos.y,pockets[i].position.x,pockets[i].position.y);
    if(distance < pocketDiam/2)
    {
      return true;
    };
  }
  return false;
}

// Function to set up any ball
function setupBalls(x,y,color)
{
  // Set up matter.js body for cue ball separate from other balls in case of any changes needed to be made
  if(color == 'white')
  {
    var ball = Bodies.circle(x, y, ballDiam/2, {friction: 0, frictionAir: friction, restitution: ballRes, label: color});
  }
  // Set up matter.js body for other balls
  else
  {
    var ball = Bodies.circle(x, y, ballDiam/2, {friction: 0, frictionAir: friction, restitution: ballRes, label: color});
  }
  // Set ball mass and density for proper collisions
  Body.setMass(ball, ball.mass*8.5);
  Body.setDensity(ball, 0.01);
  World.add(engine.world, [ball]);

  // If red ball is set up, add to redBalls array
  if(color == 'red')
  {
    redBalls.push(ball);
  }
  // If cue ball is set up, add to cueBalls array
  else if(color == 'white')
  {
    cueBalls.push(ball);
  }
  // If colour ball is set up, add to colourBalls array
  else
  {
    colourBalls.push(ball);
  }
}

// Function to draw any ball
function drawBalls(color)
{
  // Use push and pop to prevent any changes from spilling over to other objects
  push();

  // Use darkgreen stroke to add "shadow on ball"
  if(weatherMode == weatherModes[0])
  {
    stroke('darkgreen');
  }
  if(weatherMode == weatherModes[1])
  {
    stroke('lightgrey');
  }
  if(weatherMode == weatherModes[2])
  {
    stroke('darkgreen');
  }

  // Draw red balls
  if(color == 'red')
  {
    // Iterate through redBalls array
    for (var i=redBalls.length-1;i>=0;i--)
    {
      // Check the movement of each red ball, return true if moving, return false if stationary
      if(redBalls[i].speed > 0.01)
      {
        isRedBallMoving = true;
      }
      else
      {
        isRedBallMoving = false;
      }

      // Fill according to ball colour (red)
      fill(redBalls[i].label);
      drawBodies(redBalls[i].vertices);

      // Use push and pop to prevent any changes from spilling over to other objects
      push();
      // Add small, white, transluscent circle to give ball depth
      fill(255,255,255,60);
      noStroke();
      ellipse(redBalls[i].position.x-1,redBalls[i].position.y+1,6,6);
      pop();

      // Check if the ball is in pocket or is off table 
      if(isInPocket(redBalls[i]))
      {
        // Add potted ball to the pottedBalls array
        pottedBalls.push(redBalls[i]);
        deleteFromWorld(redBalls[i]);
      }
      if(isInPocket(redBalls[i]) || isOffTable(redBalls[i]))
      {
        // Remove ball from world and redBalls array
        deleteFromWorld(redBalls[i]);
        redBalls.splice(i,1);
      }
    }
  }
  
  // Draw cue/white ball
  else if(color == 'white')
  {
    // Iterate through cueBalls array
    for (var i=cueBalls.length-1;i>=0;i--)
    {
      // Check the movement of cue ball, return true if moving, return false if stationary
      if(cueBalls[i].speed > 0.01)
      {
        isCueBallMoving = true;
      }
      else
      {
        isCueBallMoving = false;
      }

      // Fill according to ball colour (white)
      fill('whitesmoke');
      drawBodies(cueBalls[i].vertices);

      // Use push and pop to prevent any changes from spilling over to other objects
      push();
      // Add small, grey circle to give ball depth
      fill('white');
      noStroke();
      ellipse(cueBalls[i].position.x-1,cueBalls[i].position.y+1,6,6);
      pop();

      // Check if the ball is in the pocket or is off the table
      if(isInPocket(cueBalls[i]))
      {
        // Add potted ball to the pottedBalls array
        pottedBalls.push(cueBalls[i]);
      }
      if(isInPocket(cueBalls[i]) || isOffTable(cueBalls[i]))
      {
        // Remove ball from world and cueBalls array
        deleteFromWorld(cueBalls[i]);
        cueBalls.splice(i,1);
      }
    }
  }

  // Draw colour balls
  else if(color == 'colours')
  {
    // Iterate through colourBalls array
    for (var i=colourBalls.length-1;i>=0;i--)
    {
      // Check the movement of colour ball, return true if moving, return false if stationary
      if(colourBalls[i].speed > 0.01)
      {
        isColourBallMoving = true;
      }
      else
      {
        isColourBallMoving = false;
      }

      // Fill according to ball colour (yellow,brown,green,blue,pink,black)
      fill(colourBalls[i].label);
      drawBodies(colourBalls[i].vertices);

      // Use push and pop to prevent any changes from spilling over to other objects
      push();
      // Add small, white, transluscent circle to give ball depth
      fill(255,255,255,30);
      noStroke();
      ellipse(colourBalls[i].position.x-1,colourBalls[i].position.y+1,6,6);
      pop();

      // Check if the ball is in the pocket or is off the table
      if(isInPocket(colourBalls[i]))
      {
        // Add potted ball to the pottedBalls array
        pottedBalls.push(colourBalls[i]);
      }
      if(isInPocket(colourBalls[i]) || isOffTable(colourBalls[i]))
      {
        var middleX = width/2;
        var lineOffset = -tableWidth+tableWidth*2/5;
        var pinkOffset = tableWidth-tableWidth*70/144;
        var blackOffset = tableWidth-tableWidth*35/144;

        var middleY = height/2;
        var greenOffset = -tableWidth/2+tableWidth/3;
        var yellowOffset = -greenOffset;
        // Place colour balls back in original position
        if(colourBalls[i].label == 'blue')
        {
          setupBalls(middleX,middleY,'blue');
        }
        if(colourBalls[i].label == 'brown')
        {
          setupBalls(middleX+lineOffset,middleY,'brown');
        }
        if(colourBalls[i].label == 'greenyellow')
        {
          setupBalls(middleX+lineOffset,middleY+greenOffset,'greenyellow');
        }
        if(colourBalls[i].label == 'yellow')
        {
          setupBalls(middleX+lineOffset,middleY+yellowOffset,'yellow');
        }
        if(colourBalls[i].label == 'pink')
        {
          setupBalls(middleX+pinkOffset,middleY,'pink');
        }
        if(colourBalls[i].label == 'darkslategrey')
        {
          setupBalls(middleX+blackOffset,middleY,'darkslategrey');
        }
        // Remove ball from world and cueBalls array
        deleteFromWorld(colourBalls[i]);
        colourBalls.splice(i,1);
      }
    }
  }
  pop();
}

// Function to set up colour balls according to mode (1,2,3)
function setupColourBalls(mode)
{
  var middleX = width/2;
  var lineOffset = -tableWidth+tableWidth*2/5;
  var pinkOffset = tableWidth-tableWidth*70/144;
  var blackOffset = tableWidth-tableWidth*35/144;

  var middleY = height/2;
  var greenOffset = -tableWidth/2+tableWidth/3;
  var yellowOffset = -greenOffset;
  // If mode 1 or 2 selected, place colour balls in the standard placement
  if(mode == 1 || mode == 2)
  {
    setupBalls(middleX,middleY,'blue');
    setupBalls(middleX+lineOffset,middleY,'brown');
    setupBalls(middleX+lineOffset,middleY+greenOffset,'greenyellow');
    setupBalls(middleX+lineOffset,middleY+yellowOffset,'yellow');
    setupBalls(middleX+pinkOffset,middleY,'pink');
    setupBalls(middleX+blackOffset,middleY,'darkslategrey');
  }

  // If mode 3 selected, place colour balls in random placement
  else if(mode == 3)
  {
    var colours = ['blue','brown','greenyellow','yellow','pink','darkslategrey']
    for(var i = 0; i < 6;i++)
    {
      var randomX = random(leftBound,rightBound);
      var randomY = random(upperBound,lowerBound);
      setupBalls(randomX,randomY,colours[i]);
    }
  }
}

// Function to set up red balls
function setupRedBalls(mode)
{
  var middleX = width/2;
  var middleY = height/2;
  var pinkOffset = tableWidth-tableWidth*70/144;

  // If mode 1 seleced, place red balls in standard placement
  if(mode == 1)
  {
    // Iterate through number of rows
    for (var i = 1; i < 6; i++) 
    {
      // Set up i number of balls in each row
      for (let j = 0; j < i; j++) 
      {
        var x = middleX + pinkOffset + ballDiam*i-i;
        var y = middleY + ballDiam * (j-(i-1)/2);
        setupBalls(x, y, 'red');
      }
    }
  }

  // If mode 2 or 3 selected, place red balls in random placement
  else if(mode == 2 || mode == 3)
  {
    for(var i = 0; i < 15; i++)
    {
      var randomX = random(leftBound,rightBound);
      var randomY = random(upperBound,lowerBound);
      for(var j = 0; j < colourBalls.length; j++)
      {
        // Check if balls are too close to colour balls
        if(dist(randomX,randomY,colourBalls[j].position.x,colourBalls[j].position.y) < ballDiam)
        {
          randomX += ballDiam;
          randomY += ballDiam;
        }
      }
      setupBalls(randomX,randomY,'red');
    }
  }
}

// Function to draw placeholder cue ball (red when invalid placement, white when valid placement)
function drawPlaceholderCueBall(mouseX,mouseY)
{
  // Use push and pop to prevent any changes from spilling over to other objects
  push();
  if(weatherMode == weatherModes[1])
  {
    stroke('black')
  }
  else
  {
    noStroke();
  }
  
  // Check that the mouse is in the D-zone and is not placed inside another ball
  if(isMouseInD(mouseX,mouseY) && !isMouseInBall(mouseX,mouseY))
  {
    // If true, placeholder ball is white (valid)
    fill(255,255,255,150);
  }
  else
  {
    // If false, placeholder ball is red (invalid)
    fill(255,0,0,150);
  }
  // Draw the ellipse following the mouse
  ellipse(mouseX,mouseY,20,20);
  pop();
}

// Function to check if mouse is in D-zone
function isMouseInD(mouseX,mouseY)
{
  var arcRad = tableWidth/6
  var lineX = width/2-tableWidth+tableWidth*2/5
  var distance = dist(mouseX,mouseY,width/2-tableWidth+tableWidth*2/5, height/2);
  // Check that the distance of the mouse is not more than the radius of the D-zone 
  // AND that the x position of the mouse is on the left of the baulk line
  if(distance <= arcRad && mouseX <= lineX)
  {
    return true;
  }
  return false;
}

// Function to check if mouse is within radius of another ball
function isMouseInBall(mouseX,mouseY)
{
  // Iterate through all red balls
  for(var i = 0; i < redBalls.length; i++)
  {
    // Check if the distance between the cue ball and any red ball is less than the combined radius of both balls (i.e. diameter of a ball)
    var distanceMouseToRed = dist(mouseX,mouseY,redBalls[i].position.x,redBalls[i].position.y);
    if(distanceMouseToRed < ballDiam)
    {
      return true;
    }
  }
  // Iterate through all colour balls
  for(var i = 0; i < colourBalls.length; i++)
  {
    // Check if the distance between the cue ball and any colour ball is less than the combined radius of both balls (i.e. diameter of a ball)
    var distanceMouseToColours = dist(mouseX,mouseY,colourBalls[i].position.x,colourBalls[i].position.y);
    if (distanceMouseToColours < ballDiam)
    {
      return true;
    }
  }
  return false;
}

// Function to set up cue stick
function setupCueStick()
{
  // Position cuestick offscreen
  var initialiseX = 100000;
  var initialiseY = 100000;

  var cueLength = 100;
  var cueWidth = 4;

  // Create matter.js bodies for cue stick
  stickHandle = Bodies.rectangle(initialiseX,initialiseY,cueLength,cueWidth,{collisionFilter: { category: cueStickCategory, mask: 0x0000}});
  stickEnd = Bodies.circle(initialiseX,initialiseY,cueWidth/2,{collisionFilter: { category: cueStickCategory, mask: 0x0000}});
  World.add(engine.world,[stickHandle,stickEnd]);
}

// Function to draw and update cue stick
function updateCueStick()
{
  push();

  // Initialise cue stick positions relative to the cue ball
  var stickX = cueBalls[0].position.x;
  var stickY = cueBalls[0].position.y;

  // Distance between the cue ball and the stick's handle
  stickDistance = ballDiam * 6-5; 

  // Distance from the cue ball to the stick's end
  stickEndDistance = ballDiam; 

  var angle;
  var distance;

  // Check what type of control is selected (mouse or keys)
  if(mouseControls)
  {
    // Change angle and distance based on the mouse positions
    angle = atan2(mouseY - stickY, mouseX - stickX);
    distance = min(dist(stickX,stickY,mouseX,mouseY),100);
  }
  else if(keyControls)
  {
    // Change angle and distance based on key inputs 
    if (keyIsDown(LEFT_ARROW) === true)
    {
      // Change angle anti-clockwise direction
      keyAngle -= 0.02;
    }
    if (keyIsDown(RIGHT_ARROW) === true)
    {
      // Change angle clockwise direction
      keyAngle += 0.02;
    }
    // Change angle based on key inputs
    angle = keyAngle;

    if (keyIsDown(UP_ARROW) === true)
    {
      // Increase power
      keyDistance += 1;
    }
    if (keyIsDown(DOWN_ARROW) === true)
    {
      // Decrease power
      keyDistance -= 1;
    }
    // Change distance based on key inputs
    limitKeyDistance = max(ballDiam/2,keyDistance)
    distance = min(limitKeyDistance,100);
  }

  // Check if mouse is dragging stick or key controls are selected
  if(stickDragging || keyControls)
  {
    // Change distance of cue stick relative to the ball according to the updated distance
    stickEndDistance += distance;
    stickDistance += distance;
  }

  // Draw power bar with respect to stick end distance from cue ball
  powerBar(stickEndDistance);

  // Change distance and angle of cue stick based on distance and angle 
  var stickHandleX = stickX + stickDistance * cos(angle);
  var stickHandleY = stickY + stickDistance * sin(angle);
  var stickEndX = stickX + stickEndDistance * cos(angle);
  var stickEndY = stickY + stickEndDistance * sin(angle);

  // Place cue stick based on new positions
  Body.setPosition(stickEnd, {x: stickEndX, y: stickEndY});
  Body.setPosition(stickHandle, {x: stickHandleX, y: stickHandleY});

  // Rotate cue stick based on new angles
  Body.setAngle(stickHandle, angle);
  Body.setAngle(stickEnd, angle);

  // Draw cue stick
  noStroke();
  fill('lime');
  drawBodies(stickEnd.vertices);
  fill('orange');
  drawBodies(stickHandle.vertices);

  // Check if key controls is selected and space bar is pressed
  if (keyControls && keyStrike)
  {
    strikeBall(distance,angle);
    keyStrike = false;
  }
  // Check if mousecontrols selected --> check if mouseWasPressed and is no longer pressed AND that the stick is being dragged by mouse
  else if(mouseControls && mouseWasPressed && !mouseIsPressed && stickDragging)
  {
    // Delay before changing stickDragging to false (allow strikeBall() to take place)
    // Reduce delay by 1, until 0
    delay--;
    strikeBall(distance,angle);
    // Reset stickDragging to false and keyStrike to false
    stickDragging = false;
  }
  // Reset delay for next turn
  delay = 1;
  // Assign mouseIsPressed (no longer pressed == false) to mouseWasPressed (previously true)
  mouseWasPressed = mouseIsPressed;

  // Check if aimAssist is toggled (key 'a')
  if(aimAssist)
    {
      push();
      translate(stickX,stickY)
      if(weatherMode == weatherModes[1])
      {
        stroke(0,0,0,100);
      }
      else
      {
        stroke(255,255,255,100);
      }
      strokeWeight(2);
      rotate(angle+PI);
      // Draw line 300 pixels away from cue ball
      line(0,0,300,0);
      noFill();
      // Draw circle at the end of the line
      ellipse(300+5,0,10,10);
      pop();
    }
  pop();
}


// Handle key functions
function keyTyped()
{
  // Assign game mode based on key typed (1,2,3)
  if(key == 1 || key == 2 || key ==3)
  {
    console.log("Key pressed is: " + key + " Mode selected is: " + key)
    mode = key;
  }
  // Toggle aim assist(line of direction) when 'a' is typed
  if (key==='a' || key==='A')
    {
    aimAssist = !aimAssist;
  }
  // Toggle menu when 'm' is typed
  else if (key==='m' || key==='M')
  {
    menu = !menu;
  }
  // Toggle between mouse controls or key controls when 'k' is typed
  else if((key==='k' || key==='K') && cueBalls.length == 1)
  {
    mouseControls = !mouseControls;
    keyControls = !keyControls;
    keyAngle = 0;
    keyDistance = 0;
  }
  // Toggle through weather modes only if no cueball exists
  else if((key==='w' || key==='W') && cueBalls.length == 0 && !isRedBallMoving && !isColourBallMoving)
  {
    index++;
    weatherMode = weatherModes[index%3];
  }
}

// Strike ball only when key is released
function keyReleased()
{
  // Ensure no input while balls are rolling
  if(!isCueBallMoving && !isColourBallMoving && !isRedBallMoving)
  {
    // Strike the cue ball when keycode is 32 (spacebar)
    if(keyCode == 32 && keyControls)
    {
      keyStrike = true;
    }
    else if(mouseControls)
    {
      keyStrike = false;
    }
  }

}

// Handle mouse functions
function mousePressed()
{
  // Check if click takes place within 50 pixels of stickHandle and mouseControls is selected
  var click = dist(mouseX, mouseY, stickHandle.position.x, stickHandle.position.y);
  if(cueBalls.length > 0 && click < 50 && mouseControls)
  {
    stickDragging = true; // Enable dragging
  }

  // Check if mouse is in D-zone and not colliding with ball and that no other cue balls have been set up
  // AND check that red balls and colour balls have already been set up (prevent placement of only cue ball)
  if(isMouseInD(mouseX,mouseY) && !isMouseInBall(mouseX,mouseY) && cueBalls.length == 0 && redBalls.length > 0 && colourBalls.length > 0)
  {
    setupBalls(mouseX,mouseY,'white')
  }
}

// Upon mouse release, check if delay is less than 0 and set stickDragging to false
function mouseReleased() 
{
  if(delay < 0)
  {
    stickDragging = false;
  }
}

// Function to strike ball when mouse released (mouse controls) or space bar pressed (key controls)
function strikeBall(distance,angle)
{ 
  // Add 1 to turns
  turns++;
  // Calculate direction of force based on angle
  var forceX = -cos(angle);
  var forceY = -sin(angle);
  // Calculate strength of force
  var magnitude = distance*strikeMag;
  // Apply force onto cueBall ONLY
  Body.applyForce( cueBalls[0], {x: cueBalls[0].position.x, y: cueBalls[0].position.y}, {x: forceX * magnitude, y: forceY * magnitude});
}

// Function to check if any body is off the table
function isOffTable(body){
  var pos = body.position;
  // Check if the x and y positions of the body are outside of the initialised bounds
  if(pos.x > rightBound+50 || pos.x < leftBound-50 || pos.y > lowerBound+50 || pos.y < upperBound-50)
  {
    return true;
  }
  return false;
}

// Function to draw the menu with modes, options and instructions
function drawMenu()
{
  var middleX = width/2;
  var middleY = height/2;

  var menuWidth = 450;
  var menuHeight = 1000;
  // Menu backdrop
  fill(200,200,200,225);
  rectMode(CENTER);
  noStroke();
  rect(middleX,middleY,menuWidth,menuHeight);

  // Menu header
  textSize(40);
  textAlign(CENTER, CENTER);
  fill('cadetblue')
  text("Snooker",middleX,50);

  // Menu gamemodes
  textSize(30);
  fill('mintcream');
  text("Gamemodes",middleX,90);
  textSize(20);
  fill('midnightblue');
  text("Standard Layout : Press '1'",middleX,120);
  fill('firebrick');
  text("Random Red Balls : Press '2'",middleX,160);
  fill('lemonchiffon');
  text("Random All Balls : Press '3'",middleX,200);
  textSize(22);
  fill('indigo');
  text("Click anywhere in the D-zone",middleX,240);
  text("to place the cue ball",middleX,265);

  // Menu options
  textSize(30);
  fill('mintcream');
  text("Options",middleX,300);
  textSize(20);
  fill('mistyrose');
  text("Toggle Menu : Press 'M'",middleX,340);
  fill('slateblue');
  text("Toggle Aim Assist : Press 'A'",middleX,380);
  fill('turquoise');
  text("Toggle Weather Challenges : Press 'W'",middleX,420);
  fill('indianred');
  text("Toggle Key or Mouse Control : Press 'K'",middleX,460);
  fill('indigo');
  if(mouseControls)
  {
    text("Control : Mouse",middleX,495);
    text("Rotate mouse around cue ball to change angle",middleX,525);
    text("Drag mouse from the cue ball to change strength",middleX,550);
    text("Release mouse to shoot",middleX,575);
  }
  else
  {
    text("Control : Keys ",middleX,495);
    text("Use left and right arrows to change angle",middleX,525);
    text("Use up and down arrows to change strength",middleX,550);
    text("Use spacebar to shoot",middleX,575);
  }
}

// Function to quickly toggle controls and reset the cue stick to prevent issues with the cue stick
function refreshControls()
{
  mouseControls = !mouseControls;
  keyControls = !keyControls;
  mouseControls = !mouseControls;
  keyControls = !keyControls;
  if(keyControls && mouseControls)
  {
    // Check if both controls true at the same time and reset keyControls
    keyControls = !keyControls;
  }
}

// Function to inform users in the event of a foul 
function displayFoul()
{
  push();
  var middleX = width/2;
  var middleY = height/2;
  fill(200,200,200,225);
  rectMode(CENTER)
  noStroke();
  rect(middleX,middleY,400,200);
  textSize(40);
  textAlign(CENTER, CENTER);
  fill('crimson')
  text("Foul",middleX,middleY-50);
  textSize(30);
  text("You cannot pot 2 coloured",middleX,middleY);
  text("(non-red) balls in a row",middleX,middleY+50);
  pop();
}

// Function to check collision of cue ball with other bodies (red balls, colour balls, walls)
function detectCollision()
{
  var posA = cueBalls[0].position;

  // Collision for red balls
  for(var i = 0; i < redBalls.length; i++)
  {
    var posB = redBalls[i].position;
    // Check if distance between center of cue ball and center of red balls is less than or equal to the combined radius of both (i.e. diameter of one ball)
    var distance = dist(posA.x,posA.y,posB.x,posB.y);
    if (distance <= ballDiam)
    {
      console.log("Collision of cue ball with " + redBalls[i].label + " ball");
    }
  }

  // Collision for colour balls
  for(var i = 0; i < colourBalls.length; i++)
  {
    var posB = colourBalls[i].position;
    // Check if distance between center of cue ball and center of colour balls is less than or equal to the combined radius of both (i.e. diameter of one ball)
    var distance = dist(posA.x,posA.y,posB.x,posB.y);
    if (distance <= ballDiam)
    {
      // Set exceptions for "black" and "green" balls as labels are not true to colour of ball
      if(colourBalls[i].label == 'darkslategrey')
      {
        console.log("Collision of cue ball with black colour ball");
      }
      else if(colourBalls[i].label == 'greenyellow')
      {
        console.log("Collision of cue ball with green colour ball");
      }
      else
      {
        console.log("Collision of cue ball with " + colourBalls[i].label + " colour ball");
      }
    }
  }
  
  // Collision for walls
  for(var i = 0; i < walls.length; i++)
  {
    var posB = walls[i].position;

    var absY = abs(posA.y - posB.y);
    var absX = abs(posA.x - posB.x);

    var ballToWall = round(ballDiam/2 + wallThickness/2);

    // Upper walls
    // Check if the wall is in the top half of the table
    if(posB.y < height/2-50)
    {
      if(absY < ballToWall && absX < horizontalWallLength/2-10)
      {
        console.log("Collision of cue ball with upper wall");
      }
    }
    // Lower walls
    // Check if the wall is in the bottom half of the table
    else if(posB.y > height/2+50)
    {
      if(absY < ballToWall && absX < horizontalWallLength/2-10)
      {
        console.log("Collision of cue ball with lower wall");
      }
    }
    // Left wall
    // Check if the wall is in the left half of the table
    else if(posB.x < width/2 - 50)
    {
      if(absX < ballToWall && absY < verticalWallHeight/2-10)
      {
        console.log("Collision of cue ball with left wall");
      }
    }
    // Right wall
    // Check if the wall is in the right half of the table
    else if(posB.x > width/2 + 50)
    {
      if(absX < ballToWall && absY < verticalWallHeight/2-10)
      {
        console.log("Collision of cue ball with right wall");
      }
    }
  }
}

// Function to check the first pot against the next one
function checkConsecutivePots()
{
  var colours = ['blue','brown','greenyellow','yellow','pink','darkslategrey'];
  // Check if the array of pottedBalls has length of 2
  if(pottedBalls.length == 2)
  {
    console.log("Potted balls are: " + pottedBalls[0].label + " and " + pottedBalls[1].label)
    // Assign first and second ball labels (colours) to variables
    var ballA = pottedBalls[0].label;
    var ballB = pottedBalls[1].label;
    
    // Check if the first or second ball label is the same as the index in colours array
    for(var i = 0; i < colours.length; i++)
    {
      if(ballA == colours[i])
      {
        // Assign first ball 'colours' label
        ballA = 'colours'
      }
      if(ballB == colours[i])
      {
        // Assign second ball 'colours' label
        ballB = 'colours'
      }
    }
    // Check if both balls are colours
    if(ballA == 'colours' && ballB == 'colours')
    {
      // Check display delay is more than 0
      if(displayDelay >= 0)
      {
        // Set displaying foul to true (double logic check to prevent overlap)
        displayingFoul = true;
        // Reduce delay 
        displayDelay--
        if(displayingFoul)
        {
          // Display actual foul message
          displayFoul();
        }
      }
      // Once delay reaches less than 0
      else
      {
        // Reinstate display delay
        displayDelay = 400;
        // Set displaying foul to false (double logic to prevent overlap)
        displayingFoul = false;
        // Remove first ball from array to prepare to check against next consecutive
        pottedBalls.splice(0,1);
      }
    }
    else
    {
    // Remove first ball even if both not colour
    pottedBalls.splice(0,1);
    }
  }
}

// Delete object from world
function deleteFromWorld(body) {
  World.remove(engine.world, body);
}

// Draw objects based on vertices
function drawBodies(vertices) {
  beginShape();
  for (var i = 0; i < vertices.length; i++) 
  {
    vertex(vertices[i].x, vertices[i].y);
  }
  endShape(CLOSE);
}

// Draw power bar based on cuestick
function powerBar(distance) 
{
  var maxWidth = width * 4/5;
  var barHeight = 40;
  var barX = width * 0.1;
  var barY = height - barHeight - 20;

  var barWidth = map(distance, 0, 111.2, 0, maxWidth);

  var normal = map(distance, 0, 100, 0, 1);
  var colour;

  if (normal < 0.5) 
    {
    colour = lerpColor(color(0, 255, 0), color(255, 255, 0), normal * 2);
  } 
  else 
  {
    colour = lerpColor(color(255, 255, 0), color(255, 0, 0), (normal - 0.5) * 2);
  }

  push();
  rectMode(CORNER);
  fill(200);
  rect(barX, barY, maxWidth, barHeight);

  fill(colour);
  rect(barX, barY, barWidth, barHeight);

  fill('white');
  textSize(35);
  text("POWER", width/2,barY+barHeight/2+3);
  pop();
}

function drawWeatherConditions()
{
  push();
  if(weatherMode == weatherModes[0])
  {
    text("Challenge: None",width/2,50);
  }
  if(weatherMode == weatherModes[1]) 
  {
    for (let i = snowflakes.length - 1; i >= 0; i--) 
    {
      snowflakes[i].render();
      // Remove and replace drops that are too small
      if (snowflakes[i].radius <= snowflakesMinRad) 
      {
        snowflakes.splice(i, 1); // Remove the current drop
        snowflakes.push(new Snowflake()); // Add a new drop at a random position
      }
    }
    fill('black');
    text("Challenge: slippery table, hard walls",width/2,50);
  }
  if(weatherMode == weatherModes[2]) 
  {
    for (let i = raindrops.length - 1; i >= 0; i--) 
    {
      raindrops[i].render();
      // Remove and replace drops that are too small
      if (raindrops[i].radius <= raindropsMinRad) 
      {
        raindrops.splice(i, 1); // Remove the current drop
        raindrops.push(new Raindrop()); // Add a new drop at a random position
      }
    }
    fill('white');
    text("Challenge: bogged table, slow balls",width/2,50);
  }
  text("(Weather can only be changed if cue ball is not in play)",width/2,75);
  textSize(30);
  text("Weather: "+ weatherMode,width/2,25);
  pop();
}

// Class for rain
class Raindrop 
{
  constructor() 
  {
    this.posX = random(width);
    this.posY = random(height);
    this.radius = raindropsMaxRad;
    this.speed = random(4,5);
  }

  update() 
  {
    var middleX = width/2;
    var middleY = height/2;

    // Move the drop towards the center
    var angle = atan2(middleY - this.posY, middleX - this.posX);
    this.posX += cos(angle) * this.speed;
    this.posY += sin(angle) * this.speed;

    // Calculate the distance to the center
    var distanceToCenter = dist(this.posX, this.posY, middleX, middleY);

    // Shrink the drop size based on distance to the center
    var maxDistance = dist(0, 0, middleX, middleY); // Distance from corner to center
    this.radius = map(distanceToCenter, 0, maxDistance, 0, raindropsMaxRad);
  }

  display() 
  {
    push();
    noStroke();
    fill(112,182,234,100);
    ellipse(this.posX, this.posY, this.radius * 2);
    pop();
  }

  render() 
  {
    this.update();
    this.display();
  }
}

class Snowflake 
{
  constructor() 
  {
    this.posX = random(width);
    this.posY = random(height);
    this.radius = snowflakesMaxRad;
    this.speed = random(0.3,1);
  }

  update() 
  {
    var middleX = width/2;
    var middleY = height/2;

    // Move the snowflake towards the center
    var angle = atan2(middleY - this.posY, middleX - this.posX);
    this.posX += cos(angle) * this.speed;
    this.posY += sin(angle) * this.speed;

    // Calculate the distance to the center
    var distanceToCenter = dist(this.posX, this.posY, middleX, middleY);

    // Shrink the snowflake size based on distance to the center
    var maxDistance = dist(0, 0, middleX, middleY);
    this.radius = map(distanceToCenter, 0, maxDistance, 0, snowflakesMaxRad);
  }

  display() 
  {
    push();
    stroke(220,220,220,100);
    drawSnowflake(this.posX, this.posY, this.radius);
    pop();
  }

  render() 
  {
    this.update();
    this.display();
  }
}

// Function to draw snowflake
function drawSnowflake(x,y,radius)
{
  for( var i =0; i < TWO_PI; i += TWO_PI/7)
  {
    var x1 = x + cos(i)*radius;
    var y1 = y + sin(i)*radius;
    var x2 = x + cos(i + TWO_PI/3)*radius;
    var y2 = y + sin(i + TWO_PI/3)*radius;
    line(x1,y1,x2,y2);
  }
}

function checkWeather()
{
  if(weatherMode == 'normal') 
    {
      weatherBackground = 'thistle';
      // Ball physics
      ballRes = ballsRestitutions[0];
      friction = frictions[0];
      // Wall physics
      wallRes = wallsRestitutions[0];
      // Striking power
      strikeMag = strikeMagnitudes[0];
    }
    else if(weatherMode == 'snow') 
    {
      weatherBackground = 'mintcream';
      // Ball physics
      ballRes = ballsRestitutions[1];
      friction = frictions[1];
      // Wall physics
      wallRes = wallsRestitutions[1];
      // Striking power
      strikeMag = strikeMagnitudes[1];
    }
    else if(weatherMode == 'rain') 
    {
      weatherBackground = 'darkblue';
      // Ball physics
      ballRes = ballsRestitutions[2];
      friction = frictions[2];
      // Wall physics
      wallRes = wallsRestitutions[2];
      // Striking power
      strikeMag = strikeMagnitudes[2];
    }
}

function updatePhysics()
{
  // Apply changes to cue balls
  if(cueBalls.length != 0)
    {
      cueBalls[0].restitution = ballRes;
      cueBalls[0].frictionAir = friction;
    }
    // Apply changes to red balls
    for(var i = 0; i < redBalls.length; i++)
    {
      redBalls[i].restitution = ballRes;
      redBalls[i].frictionAir = friction;
    }
    // Apply changes to colour balls
    for(var i = 0; i < colourBalls.length; i++)
    {
      colourBalls[i].restitution = ballRes;
      colourBalls[i].frictionAir = friction;
    }
    // Apply changes to walls 
    for(var i = 0; i < walls.length; i++)
    {
      walls[i].restitution = ballRes;
      walls[i].frictionAir = friction;
    }
}
