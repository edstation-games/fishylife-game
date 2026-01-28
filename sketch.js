let bgImage;
let bgImage2;
let fishImage;
let seaweedImage;
let coralImage;
let coral2Image;
let rockImage;
let oilImage;
let fishermanImage;
let hookImage;
let gearImage;
let seahorseImage;

// Graphics buffers for pixelated text
let gameOverTextBuffer;
let restartTextBuffer;
let pixelifyFont;

// Seaweed positions (fixed positions so they don't move)
let seaweedPositions = [];

// Falling oil drops
let oilDrops = [];
let oilSpawnTimer = 0;
let oilSpawnRate = 60; // Frames between oil spawns (more frequent for difficulty)

// Camera/scroll offset for background movement
let cameraOffset = 0;
let worldWidth = 2000; // Wider world for scrolling

// Game state
let gameState = 'home'; // 'home', 'playing', 'gameover', or 'dialogue'

// Scenario system
let currentScenario = 1;
let rockPositions = [];

// Fish player
let fish = {
  x: 300,
  y: 200,
  size: 90, // 50% bigger (was 60)
  speed: 5,
  direction: -1, // -1 = facing left (default), 1 = facing right
  health: 100,
  maxHealth: 100
};

// Fisherman boss (scenario 4)
let fisherman = {
  x: 0,
  y: 0,
  size: 120,
  height: 180, // Taller than width for stretched appearance
  speed: 2,
  vx: 0,
  vy: 0,
  directionChangeTimer: 0,
  directionChangeRate: 60 // Change direction every 60 frames
};

// Fishing rod projectiles
let fishingRods = [];
let rodSpawnTimer = 0;
let rodSpawnRate = 80; // Frames between rod throws (faster shooting)

// Seahorse NPCs (scenario 1)
let seahorses = [];
let seahorseDialogueTriggered = false; // Track if dialogue has been triggered

function setup() {
  // Create full window canvas
  createCanvas(windowWidth, windowHeight);
  
  // Pixelify Sans font is loaded via CSS in index.html
  // We'll use the font name string directly in textFont()
  // Set a flag to indicate font is available (loaded via CSS)
  pixelifyFont = 'Pixelify Sans';
  
  // Wait a moment for CSS font to load, then create text buffers
  setTimeout(function() {
    createTextBuffers();
  }, 100);
  
  // Load images asynchronously (non-blocking)
  bgImage = loadImage('assets/background.png?v=' + Date.now());
  bgImage2 = loadImage('assets/backround2.png?v=' + Date.now());
  fishImage = loadImage('assets/fish.png');
  seaweedImage = loadImage('assets/seaweed.png');
  coralImage = loadImage('assets/coral.png');
  coral2Image = loadImage('assets/coral2.png');
  rockImage = loadImage('assets/rock.png', function() {
    console.log('Rock image loaded');
  });
  oilImage = loadImage('assets/oil.png');
  fishermanImage = loadImage('assets/fisherman.png');
  hookImage = loadImage('assets/hook.png');
  gearImage = loadImage('assets/gear.png');
  seahorseImage = loadImage('assets/seahorse.png');
  
  // Initialize scenario 1
  loadScenario(1);
  
  // Create graphics buffers for pixelated text (will be updated when font loads)
  createTextBuffers();
}

function createTextBuffers() {
  gameOverTextBuffer = createGraphics(300, 100);
  gameOverTextBuffer.pixelDensity(1);
  gameOverTextBuffer.background(0, 0, 0, 0);
  gameOverTextBuffer.fill(255, 255, 255);
  gameOverTextBuffer.textAlign(CENTER, CENTER);
  if (pixelifyFont) {
    gameOverTextBuffer.textFont(pixelifyFont);
  }
  gameOverTextBuffer.textSize(40); // Bigger text size
  gameOverTextBuffer.text('GAME OVER', 150, 50);
  
  restartTextBuffer = createGraphics(500, 60);
  restartTextBuffer.pixelDensity(1);
  restartTextBuffer.background(0, 0, 0, 0);
  restartTextBuffer.fill(255, 255, 255);
  restartTextBuffer.textAlign(CENTER, CENTER);
  if (pixelifyFont) {
    restartTextBuffer.textFont(pixelifyFont);
  }
  restartTextBuffer.textSize(22); // Bigger text size
  restartTextBuffer.text('Press SPACE to go back to home screen', 250, 30);
}

function drawGameOver() {
  // Very light overlay to make text readable but keep assets visible
  fill(0, 0, 0, 80); // Reduced opacity (was 150) so assets show through
  rect(0, 0, width, height);
  
  // Recreate text buffers if font just loaded
  if (pixelifyFont && (!gameOverTextBuffer || !restartTextBuffer)) {
    createTextBuffers();
  }
  
  // Draw pixelated text using pre-created graphics buffers
  push();
  imageMode(CENTER);
  noSmooth(); // Disable smoothing for pixelated scaling
  
  // Draw the game over text buffer scaled up (bigger)
  if (gameOverTextBuffer) {
    image(gameOverTextBuffer, width / 2, height / 2 - 40, 600, 200);
  }
  
  // Draw the restart text buffer scaled up (bigger)
  if (restartTextBuffer) {
    image(restartTextBuffer, width / 2, height / 2 + 40, 1000, 120);
  }
  
  pop();
}

function restartGame() {
  gameState = 'playing';
  // Reset fish position
  fish.x = 300;
  fish.y = 200;
  // Reset fish health
  fish.health = 100;
  fish.maxHealth = 100;
  // Clear all oil drops
  oilDrops = [];
  oilSpawnTimer = 0;
  // Clear fishing rods
  fishingRods = [];
  rodSpawnTimer = 0;
  // Reset fisherman
  fisherman.x = 0;
  fisherman.y = 0;
  fisherman.vx = 0;
  fisherman.vy = 0;
  fisherman.directionChangeTimer = 0;
  // Reset camera
  cameraOffset = 0;
  // Reset to scenario 1
  loadScenario(1);
}

function keyPressed() {
  // Start game from home screen with space or enter
  if (gameState === 'home' && (key === ' ' || key === 'Enter')) {
    startGame();
  }
  // Go back to home screen from game over
  if (gameState === 'gameover' && key === ' ') {
    gameState = 'home';
  }
  // Exit dialogue with space or enter
  if (gameState === 'dialogue' && (key === ' ' || key === 'Enter')) {
    gameState = 'playing';
  }
}

function mousePressed() {
  // Check if settings button is clicked (works on all screens)
  let settingsButtonSize = 40;
  let settingsButtonX = width - 30;
  let settingsButtonY = 30;
  
  if (mouseX > settingsButtonX - settingsButtonSize / 2 && 
      mouseX < settingsButtonX + settingsButtonSize / 2 &&
      mouseY > settingsButtonY - settingsButtonSize / 2 && 
      mouseY < settingsButtonY + settingsButtonSize / 2) {
    // Settings button clicked - placeholder for settings menu
    console.log('Settings clicked');
    // TODO: Add settings menu functionality
    return;
  }
  
  // Check if play button is clicked on home screen
  if (gameState === 'home') {
    let buttonX = width / 2;
    let buttonY = height / 2 + 50;
    let buttonWidth = 200;
    let buttonHeight = 60;
    
    if (mouseX > buttonX - buttonWidth / 2 && mouseX < buttonX + buttonWidth / 2 &&
        mouseY > buttonY - buttonHeight / 2 && mouseY < buttonY + buttonHeight / 2) {
      startGame();
    }
  }
}

function startGame() {
  gameState = 'playing';
  // Reset fish position
  fish.x = 300;
  fish.y = 200;
  // Reset fish health
  fish.health = 100;
  fish.maxHealth = 100;
  // Clear all oil drops
  oilDrops = [];
  oilSpawnTimer = 0;
  // Clear fishing rods
  fishingRods = [];
  rodSpawnTimer = 0;
  // Reset fisherman
  fisherman.x = 0;
  fisherman.y = 0;
  fisherman.vx = 0;
  fisherman.vy = 0;
  fisherman.directionChangeTimer = 0;
  // Reset camera
  cameraOffset = 0;
  // Reset to scenario 1
  loadScenario(1);
}

function drawHomeScreen() {
  // Draw background
  if (bgImage && bgImage.width > 0) {
    imageMode(CORNER);
    let scale = height / bgImage.height;
    let bgDisplayWidth = bgImage.width * scale;
    let bgDisplayHeight = height;
    let tilesNeeded = Math.ceil(width / bgDisplayWidth);
    for (let i = 0; i < tilesNeeded; i++) {
      image(bgImage, i * bgDisplayWidth, 0, bgDisplayWidth, bgDisplayHeight);
    }
  } else {
    background(200, 220, 255); // Light blue fallback background
  }
  
  // Draw decorative seaweeds at the bottom (calculate first to make corals shorter)
  let seaweedWidth = 0;
  let seaweedHeight = 0;
  let bottomY = height;
  
  if (seaweedImage && seaweedImage.width > 0) {
    imageMode(CORNER);
    seaweedWidth = seaweedImage.width * 0.2;
    seaweedHeight = seaweedImage.height * 0.2;
    bottomY = height - seaweedHeight;
    
    // Draw seaweeds at various positions
    image(seaweedImage, 150, bottomY, seaweedWidth, seaweedHeight);
    image(seaweedImage, 300, bottomY, seaweedWidth, seaweedHeight);
    image(seaweedImage, width - 250, bottomY, seaweedWidth, seaweedHeight);
    image(seaweedImage, width - 400, bottomY, seaweedWidth, seaweedHeight);
  }
  
  // Draw decorative corals at the bottom (shorter than seaweeds)
  if (coralImage && coralImage.width > 0 && seaweedHeight > 0) {
    imageMode(CORNER);
    // Make corals about 70% of seaweed height
    let coralHeight = seaweedHeight * 0.7;
    let coralWidth = (coralImage.width / coralImage.height) * coralHeight;
    let coralY = height - coralHeight;
    
    // Draw multiple corals
    image(coralImage, 50, coralY, coralWidth, coralHeight);
    image(coralImage, width - 100, coralY, coralWidth, coralHeight);
  }
  
  if (coral2Image && coral2Image.width > 0 && seaweedHeight > 0) {
    imageMode(CORNER);
    // Make coral2 about 70% of seaweed height
    let coral2Height = seaweedHeight * 0.7;
    let coral2Width = (coral2Image.width / coral2Image.height) * coral2Height;
    let coral2Y = height - coral2Height;
    
    // Draw coral2 in the middle
    image(coral2Image, width / 2 - coral2Width / 2, coral2Y, coral2Width, coral2Height);
  }
  
  // Draw static black pixel fish silhouettes (pixel art style)
  let fishPositions = [
    {x: width * 0.15, y: height * 0.25, pixelSize: 4, facingRight: true},
    {x: width * 0.35, y: height * 0.35, pixelSize: 5, facingRight: false},
    {x: width * 0.65, y: height * 0.28, pixelSize: 4, facingRight: true},
    {x: width * 0.85, y: height * 0.32, pixelSize: 3, facingRight: false},
    {x: width * 0.25, y: height * 0.45, pixelSize: 5, facingRight: true},
    {x: width * 0.75, y: height * 0.40, pixelSize: 4, facingRight: true}
  ];
  
  for (let i = 0; i < fishPositions.length; i++) {
    let fish = fishPositions[i];
    push();
    translate(fish.x, fish.y);
    noSmooth(); // Disable anti-aliasing for pixelated look
    fill(0, 0, 0); // Black color
    noStroke();
    
    // Draw pixelated fish silhouette using rectangles
    let px = fish.pixelSize; // Pixel size
    
    if (fish.facingRight) {
      // Fish facing right - pixel art pattern
      // Body (3x2 pixels)
      rect(-px * 1.5, -px, px * 3, px * 2);
      // Head (2x2 pixels)
      rect(px * 1.5, -px, px * 2, px * 2);
      // Tail (left side, 2 pixels)
      rect(-px * 3.5, 0, px * 2, px);
      rect(-px * 3.5, -px, px, px);
      // Top fin
      rect(-px, -px * 2, px, px);
      rect(0, -px * 2, px, px);
      // Bottom fin
      rect(-px, px * 2, px, px);
      rect(0, px * 2, px, px);
    } else {
      // Fish facing left - flip the pattern
      scale(-1, 1);
      // Body (3x2 pixels)
      rect(-px * 1.5, -px, px * 3, px * 2);
      // Head (2x2 pixels)
      rect(px * 1.5, -px, px * 2, px * 2);
      // Tail (left side, 2 pixels)
      rect(-px * 3.5, 0, px * 2, px);
      rect(-px * 3.5, -px, px, px);
      // Top fin
      rect(-px, -px * 2, px, px);
      rect(0, -px * 2, px, px);
      // Bottom fin
      rect(-px, px * 2, px, px);
      rect(0, px * 2, px, px);
    }
    pop();
  }
  
  // Draw title
  push();
  fill(255, 255, 255);
  textAlign(CENTER, CENTER);
  textSize(60);
  if (pixelifyFont) {
    textFont(pixelifyFont);
  }
  text('FISHY LIFE', width / 2, height / 2 - 100);
  pop();
  
  // Draw play button
  let buttonX = width / 2;
  let buttonY = height / 2 + 50;
  let buttonWidth = 200;
  let buttonHeight = 60;
  
  // Button background
  fill(0, 150, 0); // Green color
  stroke(255, 255, 255);
  strokeWeight(3);
  rect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 10);
  noStroke();
  
  // Button text
  fill(255, 255, 255);
  textAlign(CENTER, CENTER);
  textSize(32);
  if (pixelifyFont) {
    textFont(pixelifyFont);
  }
  text('PLAY', buttonX, buttonY);
  
  // Instructions
  fill(255, 255, 255);
  textAlign(CENTER, CENTER);
  textSize(18);
  if (pixelifyFont) {
    textFont(pixelifyFont);
  }
  text('Press SPACE or click PLAY to start', width / 2, height / 2 + 150);
  
  // Draw settings button
  drawSettingsButton();
}

function drawDialogue() {
  // Calculate 4:5 aspect ratio viewport (width:height = 4:5, so height is 5/4 of width)
  // Make it a centered viewport with black margins
  let dialogueWidth = min(width * 0.8, height * 0.8 * (4/5));
  let dialogueHeight = dialogueWidth * (5/4); // Height is 5/4 of width for 4:5 ratio
  
  // Center the dialogue viewport
  let dialogueX = (width - dialogueWidth) / 2;
  let dialogueY = (height - dialogueHeight) / 2;
  
  // Draw black margins (background)
  fill(0, 0, 0);
  rect(0, 0, width, height);
  
  // Draw dialogue viewport background
  fill(200, 220, 255); // Light blue background
  rect(dialogueX, dialogueY, dialogueWidth, dialogueHeight);
  
  // Draw border around dialogue
  stroke(255, 255, 255);
  strokeWeight(4);
  noFill();
  rect(dialogueX, dialogueY, dialogueWidth, dialogueHeight);
  noStroke();
  
  // Draw seahorse (centered in dialogue viewport)
  if (seahorses.length > 0 && seahorseImage && seahorseImage.width > 0) {
    let seahorse = seahorses[0];
    push();
    imageMode(CENTER);
    let seahorseX = dialogueX + dialogueWidth / 2;
    let seahorseY = dialogueY + dialogueHeight * 0.4;
    image(seahorseImage, seahorseX, seahorseY, seahorse.size, seahorse.size);
    pop();
  }
  
  // Draw dialogue text box
  let textBoxWidth = dialogueWidth * 0.8;
  let textBoxHeight = dialogueHeight * 0.25;
  let textBoxX = dialogueX + (dialogueWidth - textBoxWidth) / 2;
  let textBoxY = dialogueY + dialogueHeight * 0.65;
  
  // Text box background
  fill(50, 50, 50, 200);
  rect(textBoxX, textBoxY, textBoxWidth, textBoxHeight, 10);
  
  // Text box border
  stroke(255, 255, 255);
  strokeWeight(2);
  noFill();
  rect(textBoxX, textBoxY, textBoxWidth, textBoxHeight, 10);
  noStroke();
  
  // Draw "Hello" text
  fill(255, 255, 255);
  textAlign(CENTER, CENTER);
  textSize(32);
  if (pixelifyFont) {
    textFont(pixelifyFont);
  }
  text('Hello', textBoxX + textBoxWidth / 2, textBoxY + textBoxHeight / 2);
  
  // Draw instruction to exit
  fill(200, 200, 200);
  textSize(16);
  text('Press SPACE to continue', dialogueX + dialogueWidth / 2, dialogueY + dialogueHeight - 30);
}

function drawSettingsButton() {
  // Settings button at top right
  let buttonSize = 40;
  let buttonX = width - 30;
  let buttonY = 30;
  
  push();
  rectMode(CENTER);
  
  // Button background
  fill(50, 50, 50, 200); // Semi-transparent dark gray
  stroke(255, 255, 255);
  strokeWeight(2);
  rect(buttonX, buttonY, buttonSize, buttonSize, 5);
  noStroke();
  
  // Settings icon using gear.png image with gray tint
  if (gearImage && gearImage.width > 0) {
    push();
    translate(buttonX, buttonY);
    imageMode(CENTER);
    // Apply gray tint (128, 128, 128 is medium gray)
    tint(128, 128, 128);
    let iconSize = 24;
    image(gearImage, 0, 0, iconSize, iconSize);
    noTint();
    pop();
  } else {
    // Fallback: draw simple gray circle if image not loaded
    fill(128, 128, 128);
    noStroke();
    ellipse(buttonX, buttonY, 20, 20);
  }
  pop();
}

function loadScenario(scenario) {
  currentScenario = scenario;
  
  // Clear oil drops when entering scenario 1 or 4
  if (scenario === 1 || scenario === 4) {
    oilDrops = [];
    oilSpawnTimer = 0;
  }
  
  // Initialize seahorse when entering scenario 1
  if (scenario === 1) {
    seahorses = [];
    seahorseDialogueTriggered = false; // Reset dialogue flag when entering scenario 1
    // Create one seahorse at a random position
    seahorses.push({
      x: random(200, worldWidth - 200),
      y: random(100, height - 300),
      vx: random(-1, 1),
      vy: random(-0.5, 0.5),
      size: fish.size, // Same size as fish
      direction: random() > 0.5 ? 1 : -1, // 1 = facing right, -1 = facing left
      directionChangeTimer: 0,
      directionChangeRate: random(60, 120)
    });
  } else {
    // Clear seahorse when leaving scenario 1
    seahorses = [];
  }
  
  // Initialize fisherman when entering scenario 4
  if (scenario === 4) {
    // Initialize fisherman position (random position in the world)
    fisherman.x = random(500, worldWidth - 500);
    fisherman.y = random(100, height - 200);
    fisherman.vx = random(-2, 2);
    fisherman.vy = random(-2, 2);
    fisherman.directionChangeTimer = 0;
  }
  
  // Initialize seaweed based on scenario
  initializeSeaweed(scenario);
  
  // Initialize rocks based on scenario
  initializeRocks(scenario);
}

function initializeSeaweed(scenario) {
  seaweedPositions = [];
  
  // Calculate seaweed size (15% of original - 50% smaller than 30%)
  // Use actual image width if loaded, otherwise estimate
  let seaweedWidth = 50; // Default estimate
  if (seaweedImage && seaweedImage.width > 0) {
    seaweedWidth = seaweedImage.width * 0.15; // 15% of original size (50% smaller than 30%)
  }
  
  let spacing = 0; // 0px space between each
  
  // Calculate how many seaweed plants needed
  let totalWidth = seaweedWidth + spacing; // Width of one seaweed + spacing
  let count = Math.ceil(worldWidth / totalWidth); // Enough to fill entire world width
  
  // Different seaweed counts per scenario
  if (scenario === 2) {
    count = Math.floor(count / 2); // Half the number
  } else if (scenario === 3) {
    count = Math.floor(count * 0.75); // 3/4 of the number
  } else if (scenario === 4) {
    count = Math.floor(count * 0.25); // 1/4 of the number
  }
  
  // Position seaweed side by side with 0px gaps
  let startX = 0; // Start at left edge of world
  for (let i = 0; i < count; i++) {
    seaweedPositions.push({
      x: startX + (totalWidth * i)
    });
  }
}

function initializeRocks(scenario) {
  rockPositions = [];
  
  if (!rockImage || rockImage.width === 0) {
    return; // Can't initialize without rock image
  }
  
  let rockWidth = rockImage.width * 0.15; // Same size as seaweed
  let rockHeight = (rockImage.height / rockImage.width) * rockWidth;
  
  // Get coral position for alignment
  let coralWidth = coralImage ? coralImage.width * 0.075 : 50; // 50% of seaweed size (15% * 0.5)
  let coralHeight = coralImage ? (coralImage.height / coralImage.width) * coralWidth : 50;
  let coralY = height - coralHeight;
  let rockY = coralY + coralHeight - rockHeight; // Align bottom with coral bottom
  
  if (scenario === 1) {
    // Scenario 1: 2 rocks
    rockPositions.push({ x: 200, y: rockY });
    rockPositions.push({ x: width - 300, y: rockY });
  } else if (scenario === 2) {
    // Scenario 2: 6 rocks (triple the 2 rocks)
    // Spread them across the world width
    let spacing = worldWidth / 7; // Divide into 7 sections, place rocks at boundaries
    for (let i = 1; i <= 6; i++) {
      rockPositions.push({ x: spacing * i, y: rockY });
    }
  } else if (scenario === 3) {
    // Scenario 3: 4 rocks, positioned in clusters
    rockPositions.push({ x: 150, y: rockY });
    rockPositions.push({ x: 250, y: rockY });
    rockPositions.push({ x: worldWidth - 350, y: rockY });
    rockPositions.push({ x: worldWidth - 250, y: rockY });
  } else if (scenario === 4) {
    // Scenario 4: 8 rocks, evenly spaced
    let spacing = worldWidth / 9; // Divide into 9 sections, place rocks at boundaries
    for (let i = 1; i <= 8; i++) {
      rockPositions.push({ x: spacing * i, y: rockY });
    }
  }
}

function draw() {
  // Show home screen if in home state
  if (gameState === 'home') {
    drawHomeScreen();
    return; // Don't run game logic
  }
  
  // Show dialogue screen if in dialogue state
  if (gameState === 'dialogue') {
    drawDialogue();
    return; // Don't run game logic
  }
  
  // Keep fish always visible - center camera on fish
  let targetCameraOffset = fish.x - width / 2; // Center fish on screen
  // Constrain camera to world bounds
  targetCameraOffset = constrain(targetCameraOffset, 0, worldWidth - width);
  // Smoothly move camera towards target
  cameraOffset = lerp(cameraOffset, targetCameraOffset, 0.1);
  
  // Draw background image fixed (not scrolling, filling vertically and tiling horizontally)
  // Use backround2.png for scenario 4, otherwise use background.png
  let currentBgImage = (currentScenario === 4 && bgImage2 && bgImage2.width > 0) ? bgImage2 : bgImage;
  
  if (currentBgImage && currentBgImage.width > 0) {
    imageMode(CORNER);
    
    // Scale background to fit the height of the canvas
    let scale = height / currentBgImage.height;
    let bgDisplayWidth = currentBgImage.width * scale;
    let bgDisplayHeight = height; // Fill entire height
    
    // Calculate how many times we need to repeat the image horizontally
    let tilesNeeded = Math.ceil(width / bgDisplayWidth);
    
    // Draw the background image multiple times to fill the entire width
    for (let i = 0; i < tilesNeeded; i++) {
      let bgX = i * bgDisplayWidth;
      image(currentBgImage, bgX, 0, bgDisplayWidth, bgDisplayHeight);
    }
  } else {
    background(200, 220, 255); // Light blue fallback background
  }
  
  // Recalculate seaweed positions if image is loaded and positions need updating
  if (seaweedImage && seaweedImage.width > 0) {
    let seaweedWidth = seaweedImage.width * 0.15; // 15% of original (50% smaller than 30%)
    let spacing = 0;
    let totalWidth = seaweedWidth + spacing;
    let expectedCount = Math.ceil(worldWidth / totalWidth); // Enough to fill world width
    
    // Adjust expected count based on scenario
    if (currentScenario === 2) {
      expectedCount = Math.floor(expectedCount / 2); // Half for scenario 2
    } else if (currentScenario === 3) {
      expectedCount = Math.floor(expectedCount * 0.75); // 3/4 for scenario 3
    } else if (currentScenario === 4) {
      expectedCount = Math.floor(expectedCount * 0.25); // 1/4 for scenario 4
    }
    
    // Recalculate if positions are wrong or empty
    if (seaweedPositions.length === 0 || seaweedPositions.length !== expectedCount) {
      initializeSeaweed(currentScenario);
    }
  }
  
  // Draw seaweed at the bottom
  if (seaweedImage && seaweedImage.width > 0 && seaweedPositions.length > 0) {
    imageMode(CORNER);
    let seaweedWidth = seaweedImage.width * 0.15; // 15% of original size (50% smaller)
    let seaweedHeight = seaweedImage.height * 0.15; // 15% of original size (50% smaller)
    let bottomY = height - seaweedHeight;
    
    // Draw seaweed plants side by side with 0px gaps, scrolling with camera
    for (let i = 0; i < seaweedPositions.length; i++) {
      image(seaweedImage, seaweedPositions[i].x - cameraOffset, bottomY, seaweedWidth, seaweedHeight);
    }
  }
  
  // Draw coral at bottom, 50% of seaweed size
  let coralY = height; // Default to bottom
  let coralHeight = 0;
  if (coralImage && coralImage.width > 0 && seaweedImage && seaweedImage.width > 0) {
    imageMode(CORNER);
    // Coral is 50% of seaweed's displayed size
    let seaweedDisplayWidth = seaweedImage.width * 0.15; // Seaweed's current size
    let coralWidth = seaweedDisplayWidth * 0.5; // 50% of seaweed size
    coralHeight = (coralImage.height / coralImage.width) * coralWidth; // Maintain aspect ratio
    coralY = height - coralHeight; // Aligned at bottom
    let coralX = 20 - cameraOffset; // Position on the left side, scrolling
    image(coralImage, coralX, coralY, coralWidth, coralHeight);
  }
  
  // Draw coral2 at bottom-middle of the game
  if (coral2Image && coral2Image.width > 0 && seaweedImage && seaweedImage.width > 0) {
    imageMode(CORNER);
    // Coral2 is 50% of seaweed's displayed size (same as coral)
    let seaweedDisplayWidth = seaweedImage.width * 0.15; // Seaweed's current size
    let coral2Width = seaweedDisplayWidth * 0.5; // 50% of seaweed size
    let coral2Height = (coral2Image.height / coral2Image.width) * coral2Width; // Maintain aspect ratio
    let coral2Y = height - coral2Height; // Aligned at bottom
    let coral2X = (width / 2 - coral2Width / 2) - cameraOffset; // Center horizontally, scrolling
    image(coral2Image, coral2X, coral2Y, coral2Width, coral2Height);
  }
  
  // Draw rocks at bottom, aligned with the bottom of the coral (scrolling with camera)
  if (rockImage && rockImage.width > 0 && rockPositions.length > 0) {
    imageMode(CORNER);
    let rockWidth = rockImage.width * 0.15; // Same size as seaweed
    let rockHeight = (rockImage.height / rockImage.width) * rockWidth; // Maintain aspect ratio
    
    // Draw all rocks from rockPositions array
    for (let i = 0; i < rockPositions.length; i++) {
      let rock = rockPositions[i];
      let rockScreenX = rock.x - cameraOffset;
      image(rockImage, rockScreenX, rock.y, rockWidth, rockHeight);
    }
  }
  
  // Spawn and update falling oil drops (only if game is playing, not in scenario 1 or 4)
  if (gameState === 'playing' && currentScenario !== 4 && currentScenario !== 1) {
    oilSpawnTimer++;
    if (oilSpawnTimer >= oilSpawnRate) {
    // Randomly assign rotation: 0 = normal, 90 = sideways, 180 = upside down
    let rotationType = floor(random(3)); // 0, 1, or 2
    let rotation = 0;
    if (rotationType === 0) {
      rotation = 0; // Normal (1/3)
    } else if (rotationType === 1) {
      rotation = 90; // Sideways (1/3)
    } else {
      rotation = 180; // Upside down (1/3)
    }
    
    // Spawn new oil drop from random position at top
    oilDrops.push({
      x: random(width) + cameraOffset, // World position
      y: -50,
      speed: 5 + random(4), // Even faster speed (5-9 pixels per frame)
      size: fish.size * 1.5, // 1.5x bigger than fish
      rotation: rotation // Rotation angle in degrees
    });
    oilSpawnTimer = 0;
    }
  }
  
  // Update and draw oil drops (skip in scenario 1 and 4)
  if (currentScenario !== 4 && currentScenario !== 1) {
    for (let i = oilDrops.length - 1; i >= 0; i--) {
      let oil = oilDrops[i];
      
      // Only update if game is playing
      if (gameState === 'playing') {
        oil.y += oil.speed; // Fall down
        
        // Check collision with fish
        let oilScreenX = oil.x - cameraOffset;
        let distance = dist(oilScreenX, oil.y, fish.x - cameraOffset, fish.y);
        if (distance < (oil.size / 2 + fish.size / 2)) {
          // Collision detected - game over
          gameState = 'gameover';
        }
      }
    
    // Remove oil that has fallen off screen
    if (oil.y > height + 50) {
      oilDrops.splice(i, 1);
      continue;
    }
    
    // Draw oil drop (only if visible on screen)
    let oilScreenX = oil.x - cameraOffset;
    if (oilScreenX > -50 && oilScreenX < width + 50) {
      if (oilImage && oilImage.width > 0) {
        push();
        translate(oilScreenX, oil.y);
        rotate(radians(oil.rotation)); // Apply rotation
        imageMode(CENTER);
        image(oilImage, 0, 0, oil.size, oil.size);
        pop();
      } else {
        // Fallback: draw a simple circle
        push();
        translate(oilScreenX, oil.y);
        rotate(radians(oil.rotation));
        fill(50, 50, 50);
        ellipse(0, 0, oil.size, oil.size);
        pop();
      }
    }
    }
  }
  
  // Clear oil drops when entering scenario 4
  if (currentScenario === 4 && oilDrops.length > 0) {
    oilDrops = [];
  }
  
  // Update and draw seahorses in scenario 1
  if (currentScenario === 1 && gameState === 'playing') {
    for (let i = 0; i < seahorses.length; i++) {
      let seahorse = seahorses[i];
      
      // Update direction change timer
      seahorse.directionChangeTimer++;
      
      // Change direction periodically or when hitting boundaries
      if (seahorse.directionChangeTimer >= seahorse.directionChangeRate ||
          seahorse.x <= 100 || seahorse.x >= worldWidth - 100 ||
          seahorse.y <= 50 || seahorse.y >= height - 200) {
        seahorse.vx = random(-1, 1);
        seahorse.vy = random(-0.5, 0.5);
        seahorse.direction = seahorse.vx > 0 ? -1 : 1; // Face direction of movement
        seahorse.directionChangeTimer = 0;
        seahorse.directionChangeRate = random(60, 120);
      }
      
      // Update position
      seahorse.x += seahorse.vx;
      seahorse.y += seahorse.vy;
      
      // Keep seahorse within world bounds
      seahorse.x = constrain(seahorse.x, 100, worldWidth - 100);
      seahorse.y = constrain(seahorse.y, 50, height - 200);
      
      // Draw seahorse
      let seahorseScreenX = seahorse.x - cameraOffset;
      
      // Check if fish is close enough for dialogue (only once, and only if seahorse is facing the fish)
      if (gameState === 'playing' && !seahorseDialogueTriggered) {
        let fishScreenX = fish.x - cameraOffset;
        let distance = dist(fishScreenX, fish.y, seahorseScreenX, seahorse.y);
        
        // Check if seahorse is facing the fish
        // If fish is to the right of seahorse, seahorse should face right (direction = -1, which flips to face right)
        // If fish is to the left of seahorse, seahorse should face left (direction = 1, normal)
        let fishIsToRight = fish.x > seahorse.x;
        let seahorseFacingRight = seahorse.direction === -1; // -1 flips to face right
        let seahorseFacingFish = (fishIsToRight && seahorseFacingRight) || (!fishIsToRight && !seahorseFacingRight);
        
        if (distance < 100 && seahorseFacingFish) { // Trigger dialogue when within 100 pixels AND facing the fish
          gameState = 'dialogue';
          seahorseDialogueTriggered = true; // Mark as triggered so it can only happen once
        }
      }
      if (seahorseScreenX > -50 && seahorseScreenX < width + 50) {
        if (seahorseImage && seahorseImage.width > 0) {
          push();
          translate(seahorseScreenX, seahorse.y);
          imageMode(CENTER);
          scale(seahorse.direction, 1); // Flip based on direction
          image(seahorseImage, 0, 0, seahorse.size, seahorse.size);
          pop();
        } else {
          // Fallback: draw simple seahorse shape
          push();
          fill(100, 150, 200);
          noStroke();
          translate(seahorseScreenX, seahorse.y);
          scale(seahorse.direction, 1);
          ellipse(0, 0, seahorse.size, seahorse.size * 0.8);
          // Simple tail
          triangle(-seahorse.size/2, 0, -seahorse.size, -seahorse.size/3, -seahorse.size, seahorse.size/3);
          pop();
        }
      }
    }
  }
  
  // Move fish with arrow keys (only if game is playing)
  if (gameState === 'playing') {
    if (keyIsDown(LEFT_ARROW)) {
      fish.x -= fish.speed;
      fish.direction = 1; // Face left (no flip needed if image faces left by default)
    }
    if (keyIsDown(RIGHT_ARROW)) {
      fish.x += fish.speed;
      fish.direction = -1; // Face right (flip horizontally)
    }
    if (keyIsDown(UP_ARROW)) {
      fish.y -= fish.speed;
    }
    if (keyIsDown(DOWN_ARROW)) {
      fish.y += fish.speed;
    }
    
    // Keep fish within world bounds (allow movement in wider world)
    fish.x = constrain(fish.x, fish.size/2, worldWidth - fish.size/2);
    fish.y = constrain(fish.y, fish.size/2, height - fish.size/2);
    
    // Check if fish reached right edge to trigger next scenario
    if (fish.x >= worldWidth - fish.size/2 - 10 && currentScenario < 4) {
      // Fish reached right edge, load next scenario
      let nextScenario = currentScenario + 1;
      loadScenario(nextScenario);
      // Reset fish position to left side for next scenario
      fish.x = fish.size/2 + 50;
    }
    
    // Check if fish reached left edge to go back to previous scenario
    if (currentScenario > 1 && fish.x <= fish.size/2 + 10) {
      // Fish reached left edge, go back to previous scenario
      let previousScenario = currentScenario - 1;
      loadScenario(previousScenario);
      // Reset fish position to right side for previous scenario
      fish.x = worldWidth - fish.size/2 - 50;
    }
  }
  
  // Draw game over screen
  if (gameState === 'gameover') {
    drawGameOver();
  }
  
  // Draw fisherman boss in scenario 4
  if (currentScenario === 4 && gameState === 'playing') {
    // Update fisherman movement (moves freely)
    fisherman.directionChangeTimer++;
    
    // Change direction periodically or when hitting boundaries
    if (fisherman.directionChangeTimer >= fisherman.directionChangeRate || 
        fisherman.x <= 100 || fisherman.x >= worldWidth - 100 ||
        fisherman.y <= 100 || fisherman.y >= height - 200) {
      // Random direction change
      fisherman.vx = random(-2, 2);
      fisherman.vy = random(-2, 2);
      fisherman.directionChangeTimer = 0;
    }
    
    // Update fisherman position
    fisherman.x += fisherman.vx;
    fisherman.y += fisherman.vy;
    
    // Keep fisherman within world bounds
    fisherman.x = constrain(fisherman.x, 100, worldWidth - 100);
    fisherman.y = constrain(fisherman.y, 100, height - 200);
    
    // Spawn fishing rods
    rodSpawnTimer++;
    if (rodSpawnTimer >= rodSpawnRate) {
      // Throw a fishing rod towards the fish (50% faster)
      let rodSpeed = 6;
      let angle = atan2(fish.y - fisherman.y, fish.x - fisherman.x);
      fishingRods.push({
        x: fisherman.x, // World position
        y: fisherman.y + 20, // World position
        vx: cos(angle) * rodSpeed,
        vy: sin(angle) * rodSpeed,
        size: 30
      });
      rodSpawnTimer = 0;
    }
    
    // Draw fisherman (stretched taller)
    if (fishermanImage && fishermanImage.width > 0) {
      push();
      imageMode(CENTER);
      image(fishermanImage, fisherman.x - cameraOffset, fisherman.y, fisherman.size, fisherman.height);
      pop();
    } else {
      // Fallback
      fill(100, 50, 0);
      ellipse(fisherman.x - cameraOffset, fisherman.y, fisherman.size, fisherman.height);
    }
    
    // Update and draw fishing rods
    for (let i = fishingRods.length - 1; i >= 0; i--) {
      let rod = fishingRods[i];
      
      // Update position (world coordinates)
      rod.x += rod.vx;
      rod.y += rod.vy;
      
      // Convert to screen coordinates for collision and drawing
      let rodScreenX = rod.x - cameraOffset;
      let rodScreenY = rod.y;
      
      // Check collision with fish
      let fishScreenX = fish.x - cameraOffset;
      let distance = dist(rodScreenX, rodScreenY, fishScreenX, fish.y);
      if (distance < (rod.size / 2 + fish.size / 2)) {
        // Hit! Reduce health (fisherman does 10 damage)
        fish.health -= 10;
        fish.health = max(0, fish.health); // Don't go below 0
        
        // Remove the rod
        fishingRods.splice(i, 1);
        
        // Check if health is 0
        if (fish.health <= 0) {
          gameState = 'gameover';
        }
        continue;
      }
      
      // Remove rods that are off screen (check world coordinates)
      if (rod.x < cameraOffset - 100 || rod.x > cameraOffset + width + 100 || 
          rod.y < -100 || rod.y > height + 100) {
        fishingRods.splice(i, 1);
        continue;
      }
      
      // Draw fishing hook image (only if on screen)
      if (rodScreenX > -50 && rodScreenX < width + 50) {
        push();
        translate(rodScreenX, rodScreenY);
        // Rotate hook to point in direction of movement
        let hookAngle = atan2(rod.vy, rod.vx);
        rotate(hookAngle);
        
        // Draw hook image (3x bigger)
        if (hookImage && hookImage.width > 0) {
          imageMode(CENTER);
          image(hookImage, 0, 0, rod.size * 3, rod.size * 3);
        } else {
          // Fallback: draw a simple circle if image not loaded
          fill(100, 100, 100);
          ellipse(0, 0, rod.size, rod.size);
        }
        
        pop();
      }
    }
  }
  
  // Draw fish with proper direction (relative to camera)
  if (fishImage && fishImage.width > 0) {
    push();
    imageMode(CENTER);
    // Draw fish at screen position (fish.x - cameraOffset)
    translate(fish.x - cameraOffset, fish.y);
    scale(fish.direction, 1); // Flip horizontally based on direction
    image(fishImage, 0, 0, fish.size, fish.size);
    pop();
  } else {
    // Fallback: draw a simple circle if image not loaded
    fill(255, 200, 0);
    ellipse(fish.x - cameraOffset, fish.y, fish.size, fish.size);
  }
  
  // Draw health bar last so it's always on top
  drawHealthBar();
  
  // Draw settings button
  drawSettingsButton();
}

function drawHealthBar() {
  // Save current drawing state
  push();
  
  // Reset all transformations to ensure health bar is drawn in screen coordinates
  resetMatrix();
  
  // Set drawing modes explicitly
  rectMode(CORNER);
  imageMode(CORNER);
  
  // Fixed position at top left with 20px margins (screen coordinates)
  let barWidth = 250;
  let barHeight = 30;
  let barX = 20; // 20px from left
  let barY = 20; // 20px from top
  
  // Draw background of health bar (dark gray)
  fill(50, 50, 50);
  noStroke();
  rect(barX, barY, barWidth, barHeight);
  
  // Draw health portion
  let healthPercent = fish.health / fish.maxHealth;
  if (healthPercent > 0.5) {
    fill(0, 255, 0); // Green for high health
  } else if (healthPercent > 0.25) {
    fill(255, 255, 0); // Yellow for medium health
  } else {
    fill(255, 0, 0); // Red for low health
  }
  rect(barX, barY, barWidth * healthPercent, barHeight);
  
  // Draw border (white outline)
  noFill();
  stroke(255, 255, 255);
  strokeWeight(3);
  rect(barX, barY, barWidth, barHeight);
  noStroke();
  
  // Draw health text below the bar
  fill(255, 255, 255);
  textAlign(LEFT, TOP);
  textSize(16);
  if (pixelifyFont) {
    textFont(pixelifyFont);
  }
  text('Health: ' + Math.floor(fish.health) + '/' + fish.maxHealth, barX, barY + barHeight + 8);
  
  // Restore drawing state
  pop();
}

function windowResized() {
  // Resize canvas when window is resized
  resizeCanvas(windowWidth, windowHeight);
  // Reinitialize scenario for new canvas size
  loadScenario(currentScenario);
}
