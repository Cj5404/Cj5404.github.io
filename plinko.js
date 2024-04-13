// Module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Events = Matter.Events;

// Create an engine
var engine = Engine.create();

// Create a renderer
var render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight
    }
});

//Makes the ground
var ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight - 20, window.innerWidth, 40, { isStatic: true });

// Array to store balls
var balls = [];

// Collision group for balls
var ballCollisionGroup = Matter.Body.nextGroup(true);

// Collision group for pegs
var pegsCollisionGroup = Matter.Body.nextGroup(true);

// Counter for balls hitting the ground
var ballHits = 0;

// Function to create a row of pegs
function createPegRow(x, y, row, count) {
    var pegs = [];
    var pegWidth = 12;
    var pegSpacing = 70;
    var startX = x - ((count - 1) * pegSpacing) / 2;
    for (var i = 0; i < count; i++) {
        // Generate unique ID for each peg
        var pegID = String.fromCharCode(65 + row) + (i + 1);
        // Create peg object with unique ID and properties
        var peg = {
            id: pegID,
            x: startX + i * pegSpacing,
            y: y,
            radius: pegWidth / 2,
            isStatic: true,
            restitution: 100,
            collisionFilter: { group: pegsCollisionGroup }
        };
        pegs.push(peg);
    }
    return pegs;
}

// Create peg rows in pyramid shape
var numRows = 8;
var startX = window.innerWidth / 2;
var startY = 100;
for (var row = 0; row < numRows; row++) {
    var numPegs = 3 + row;
    var pegs = createPegRow(startX, startY + row * 75, row, numPegs);
    // Create peg bodies and add them to the world
    pegs.forEach(function(peg) {
        var pegBody = Bodies.circle(peg.x, peg.y, peg.radius, {
            isStatic: peg.isStatic,
            restitution: peg.restitution,
            collisionFilter: peg.collisionFilter
        });
        Composite.add(engine.world, pegBody);
    });
}

// Create separate boxes for counting hits under each exit of the pegs
var exitBoxes = [];
var exitBoxWidth = 50;
var exitBoxHeight = 20;
var exitBoxCounters = []; // Counters for each exit box
var exitBoxPositions = [
    { x: startX - 280, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX - 210, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX - 140, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX - 70, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX  , y: startY + (numRows - 1) * 75 + 25 },
    { x: startX + 70, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX + 140, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX + 210, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX + 280, y: startY + (numRows - 1) * 75 + 25 }
];

exitBoxPositions.forEach(function(position) {
    var exitBox = Bodies.rectangle(position.x, position.y, exitBoxWidth, exitBoxHeight, { isStatic: true, label: 'ExitBox' });
    exitBoxes.push(exitBox);
    Composite.add(engine.world, exitBox);

    // Initialize counters for each exit box
    exitBoxCounters.push(0);
});

// Event listener for collisions with exit boxes
Events.on(engine, 'collisionStart', function(event) {
    var pairs = event.pairs;
    pairs.forEach(function(pair) {
        // Check if a ball collided with an exit box
        if (pair.bodyA.label === 'ExitBox' && balls.includes(pair.bodyB)) {
            removeBall(pair.bodyB);
            // Find the index of the exit box
            var exitBoxIndex = exitBoxes.indexOf(pair.bodyA);
            if (exitBoxIndex !== -1) {
                // Increment the counter for the corresponding exit box
                exitBoxCounters[exitBoxIndex]++;
            }
        } else if (pair.bodyB.label === 'ExitBox' && balls.includes(pair.bodyA)) {
            removeBall(pair.bodyA);
            // Find the index of the exit box
            var exitBoxIndex = exitBoxes.indexOf(pair.bodyB);
            if (exitBoxIndex !== -1) {
                // Increment the counter for the corresponding exit box
                exitBoxCounters[exitBoxIndex]++;
            }
        }
    });
    // Update all exit box counters after collision
    updateAllExitBoxCounters();
});

// Function to remove a ball from the physics world and the array
function removeBall(ball) {
    var ballIndex = balls.indexOf(ball);
    if (ballIndex !== -1) {
        balls.splice(ballIndex, 1);
        Composite.remove(engine.world, ball);
        // Increment ball hits counter
        ballHits++;
        updateBallHitsCounter();
    }
}

// Function to update counter display for each exit box
function updateExitBoxCounter(index) {
    // Update the HTML element displaying the counter for the exit box
    var exitBoxCounterElem = document.getElementById('exitBoxCounter_' + index);
    exitBoxCounterElem.innerText = exitBoxCounters[index] + '\n (' + ((exitBoxCounters[index] / ballHits) * 100).toFixed(2) + '%)';
}

// Function to update all exit box counters
function updateAllExitBoxCounters() {
    exitBoxCounters.forEach(function(counter, index) {
        updateExitBoxCounter(index);
    });
}

// Create and append HTML elements for exit box counters
exitBoxCounters.forEach(function(counter, index) {
    var exitBoxCounter = document.createElement('div');
    exitBoxCounter.id = 'exitBoxCounter_' + index;
    exitBoxCounter.style.position = 'absolute';
    exitBoxCounter.style.top = (exitBoxPositions[index].y + exitBoxHeight / 2 + 5) + 'px';
    exitBoxCounter.style.left = (exitBoxPositions[index].x - exitBoxWidth / 2) + 'px';
    exitBoxCounter.style.color = 'white'; // Set text color to white
    exitBoxCounter.innerText = exitBoxCounters[index]; // Display only the number of hits
    document.body.appendChild(exitBoxCounter);

    // Create percentage display below the exit box counter
    var percentageDisplay = document.createElement('div');
    percentageDisplay.style.color = 'white';
    percentageDisplay.innerText = '(' + ((exitBoxCounters[index] / ballHits) * 100).toFixed(2) + '%)';
    exitBoxCounter.appendChild(percentageDisplay);
});

// Add all bodies to the world
Composite.add(engine.world, [ground]);

// Run the renderer
Render.run(render);

// Create runner
var runner = Runner.create();

// Run the engine
Runner.run(runner, engine);

// Apply gravity to the balls
engine.gravity.y = 0.5;

// Function to update gravity for each ball
function updateBallGravity() {
    balls.forEach(function(ball) {
        // Determine odds for the ball's gravity
        var odds = Math.random(); // Random value between 0 and 1

        // Strength of gravity
        var gravityStrength = 0.001; // Base strength
        if (odds < 0.2) {
            gravityStrength *= 5; // Increase strength for lower odds
        } else if (odds < 0.5) {
            gravityStrength *= 2; // Increase strength for moderate odds
        }

        // Direction of gravity
        var gravityX = 0; // Initialize gravity along X-axis
        if (Math.random() < 0.5) {
            // Apply rightward gravity
            gravityX = gravityStrength * (0.5 + Math.random() * 0.5); // Limit range to center
        } else {
            // Apply leftward gravity
            gravityX = -gravityStrength * (0.5 + Math.random() * 0.5); // Limit range to center
        }

        // Apply customized gravity to the engine
        engine.gravity.x = gravityX;
    });
}

// Update gravity for each ball continuously
Events.on(runner, 'tick', function(event) {
    updateBallGravity();
});

// Event listener for spacebar press
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        // Spawn a new ball at the top center of the screen
        var ball = Bodies.circle(window.innerWidth / 2, 0, 20, { restitution: 0.5, collisionFilter: { group: ballCollisionGroup } });
        balls.push(ball); // Add ball to array
        Composite.add(engine.world, ball);
    }
});

// Event listener for collisions
Events.on(engine, 'collisionStart', function(event) {
    var pairs = event.pairs;
    pairs.forEach(function(pair) {
        // Check if a ball collided with the ground
        if ((pair.bodyA === ground && balls.includes(pair.bodyB)) ||
            (pair.bodyB === ground && balls.includes(pair.bodyA))) {
            // Remove the ball from both the physics world and the array
            var ballIndex = balls.indexOf(pair.bodyA);
            if (ballIndex !== -1) {
                balls.splice(ballIndex, 1);
                Composite.remove(engine.world, pair.bodyA);
                // Increment ball hits counter
                ballHits++;
                updateBallHitsCounter();
            }
            ballIndex = balls.indexOf(pair.bodyB);
            if (ballIndex !== -1) {
                balls.splice(ballIndex, 1);
                Composite.remove(engine.world, pair.bodyB);
                // Increment ball hits counter
                ballHits++;
                updateBallHitsCounter();
            }
        }

    });
});

// Function to update ball hits counter
function updateBallHitsCounter() {
    // Update the HTML element displaying the ball hits count
    document.getElementById('ballHitsCounter').innerText = 'Ball Hits: ' + ballHits;
}

// Create and append HTML element for ball hits counter
var ballHitsCounter = document.createElement('div');
ballHitsCounter.id = 'ballHitsCounter';
ballHitsCounter.style.position = 'absolute';
ballHitsCounter.style.top = '20px';
ballHitsCounter.style.left = '20px';
ballHitsCounter.style.color = 'white'; // Set text color to white
ballHitsCounter.innerText = 'Ball Hits: 0';
document.body.appendChild(ballHitsCounter);
