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

// Initialize user's balance
var userBalance = 1000; // Set an initial balance, you can adjust this as needed

// Create and append HTML element for input field and user balance display
var betInput = document.createElement('input');
betInput.id = 'betInput';
betInput.type = 'number';
betInput.placeholder = 'Enter bet amount';
betInput.style.position = 'absolute';
betInput.style.top = '50px';
betInput.style.left = '20px';
document.body.appendChild(betInput);

var userBalanceDisplay = document.createElement('div');
userBalanceDisplay.id = 'userBalanceDisplay';
userBalanceDisplay.style.position = 'absolute';
userBalanceDisplay.style.top = '80px';
userBalanceDisplay.style.left = '20px';
userBalanceDisplay.style.color = 'white';
userBalanceDisplay.innerText = 'Balance: $' + userBalance.toFixed(2);
document.body.appendChild(userBalanceDisplay);

// Function to update user balance display
function updateUserBalanceDisplay() {
    userBalanceDisplay.innerText = 'Balance: $' + userBalance.toFixed(2);
}

// Function to create a row of pegs
function createPegRow(x, y, row, count) {
    var pegs = [];
    var pegWidth = 15;
    var pegSpacing = 80;
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
            restitution: 1,
            collisionFilter: { group: pegsCollisionGroup }
        };
        pegs.push(peg);
    }
    return pegs;
}

// Create peg rows in pyramid shape
var numRows = 10;
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
var exitBoxMultipliers = [21, 7.5, 3, 0.9, 0.22, 0.16, 0.22, 0.9, 3, 7.5, 21]; // Multipliers for each exit box
var exitBoxPositions = [
    { x: startX - 400, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX - 320, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX - 240, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX - 160, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX - 80, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX , y: startY + (numRows - 1) * 75 + 25 },
    { x: startX + 80, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX + 160, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX + 240, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX + 320, y: startY + (numRows - 1) * 75 + 25 },
    { x: startX + 400, y: startY + (numRows - 1) * 75 + 25 }
];

exitBoxPositions.forEach(function(position, index) {
    var exitBox = Bodies.rectangle(position.x, position.y, exitBoxWidth, exitBoxHeight, { isStatic: true, label: 'ExitBox', multiplier: exitBoxMultipliers[index] });
    exitBoxes.push(exitBox);
    Composite.add(engine.world, exitBox);

    // Initialize counters for each exit box
    exitBoxCounters.push(0);

    // Create text element for displaying the multiplier inside the exit box
    var multiplierText = document.createElement('div');
    multiplierText.classList.add('multiplier-text');
    multiplierText.innerText = 'x' + exitBoxMultipliers[index];
    multiplierText.style.position = 'absolute';
    multiplierText.style.top = position.y + 'px';
    multiplierText.style.left = position.x + 'px';
    multiplierText.style.color = 'white';
    multiplierText.style.fontSize = '12px';
    multiplierText.style.transform = 'translate(-50%, -50%)'; // Center the text
    document.body.appendChild(multiplierText);
});

// Event listener for collisions with exit boxes
Events.on(engine, 'collisionStart', function(event) {
    var pairs = event.pairs;
    pairs.forEach(function(pair) {
        // Check if a ball collided with an exit box
        if (pair.bodyA.label === 'ExitBox' && balls.includes(pair.bodyB)) {
            // Multiply the original bet amount by the multiplier and add it back to user's balance
            userBalance += pair.bodyB.betAmount * pair.bodyA.multiplier;
            updateUserBalanceDisplay();
            removeBall(pair.bodyB);
            // Find the index of the exit box
            var exitBoxIndex = exitBoxes.indexOf(pair.bodyA);
            if (exitBoxIndex !== -1) {
                // Increment the counter for the corresponding exit box
                exitBoxCounters[exitBoxIndex]++;
            }
        } else if (pair.bodyB.label === 'ExitBox' && balls.includes(pair.bodyA)) {
            // Multiply the original bet amount by the multiplier and add it back to user's balance
            userBalance += pair.bodyA.betAmount * pair.bodyB.multiplier;
            updateUserBalanceDisplay();
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
        if (odds < 0.9) {
            gravityStrength *= 0.5; // Increase strength for lower odds
        } else if (odds < 1) {
            gravityStrength *= 1; // Increase strength for moderate odds
        }

        // Direction of gravity
        var gravityX = 0; // Initialize gravity along X-axis
        if (Math.random() < 0.5) {
            // Apply rightward gravity, biased towards the lower multiplier areas
            gravityX = gravityStrength * (Math.random() * 0.02); // Bias towards the center
        } else {
            // Apply leftward gravity, biased towards the lower multiplier areas
            gravityX = -gravityStrength * (Math.random() * 0.02); // Bias towards the center
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
        var betAmount = parseFloat(betInput.value);
        if (!isNaN(betAmount) && betAmount > 0 && userBalance >= betAmount) {
            // Deduct the bet amount from user's balance
            userBalance -= betAmount;
            updateUserBalanceDisplay();

            // Spawn a new ball at the top center of the screen
            var ball = Bodies.circle(window.innerWidth / 2, 0, 20, {
                restitution: 0.5,
                collisionFilter: { group: ballCollisionGroup },
                betAmount: betAmount // Add a property to store the bet amount with the ball
            });
            balls.push(ball); // Add ball to array
            Composite.add(engine.world, ball);
        } else {
            // Notify user if bet amount is invalid or exceeds balance
            alert('Invalid bet amount or insufficient balance.');
        }
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
