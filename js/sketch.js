let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    engine;

let imageBalls = [];
let outsideBalls = [];
let imgs = {};
let canvasW = 375;
let canvasH = 667;

const NUM_INSIDE = 10;
const NUM_EACH_OUTSIDE = 3;
const outsideImages = ["1.png", "2.png", "3.png", "4.png"];

const zContour = [
  [277.73, 83.5], [97.90, 83.5], [71.59, 109.82], [71.59, 129.24],
  [97.90, 155.56], [195.02, 155.56], [210.68, 178.11], [82.86, 506.43],
  [80.98, 516.46], [80.98, 557.18], [106.67, 583.5], [268.33, 583.5],
  [294.64, 557.18], [294.64, 538.39], [268.33, 511.44], [193.14, 511.44],
  [177.47, 488.89], [302.16, 160.57], [303.41, 150.54], [303.41, 109.82],
  [277.73, 83.5]
];

let yOffset = 0;
let gyroX = 0;
let gyroY = 0;

function preload() {
  imgs.base = loadImage("type.png");
  for (let name of outsideImages) {
    imgs[name] = loadImage(name);
  }
}

function setup() {
  createCanvas(canvasW, canvasH);
  engine = Engine.create();
  let world = engine.world;

  let allY = zContour.map(p => p[1]);
  let minY = Math.min(...allY);
  let maxY = Math.max(...allY);
  let shapeHeight = maxY - minY;
  yOffset = height / 2 - (minY + shapeHeight / 2);

  for (let i = 0; i < zContour.length - 1; i++) {
    let a = zContour[i];
    let b = zContour[i + 1];
    let ax = a[0];
    let ay = a[1] + yOffset;
    let bx = b[0];
    let by = b[1] + yOffset;
    let wall = Bodies.rectangle(
      (ax + bx) / 2, (ay + by) / 2,
      dist(ax, ay, bx, by), 5,
      {
        isStatic: true,
        angle: atan2(by - ay, bx - ax),
        render: { visible: false }
      }
    );
    World.add(world, wall);
  }

  for (let i = 0; i < NUM_INSIDE; i++) {
    let x = 190;
    let y = 300 + yOffset;
    let ball = Bodies.rectangle(x, y, 44, 10, {
      restitution: 0.5,
      frictionAir: 0.2
    });
    ball.imageKey = "base";
    imageBalls.push(ball);
    World.add(world, ball);
  }

  for (let key of outsideImages) {
    for (let i = 0; i < NUM_EACH_OUTSIDE; i++) {
      let x = random(30, 345);
      let y = random(30, 100);
      let ball = Bodies.rectangle(x, y, 62, 50, {
        restitution: 0.5,
        frictionAir: 0.2
      });
      ball.imageKey = key;
      outsideBalls.push(ball);
      World.add(world, ball);
    }
  }

  // add edge walls
  let edgeThickness = 50;
  let walls = [
    Bodies.rectangle(canvasW / 2, -edgeThickness / 2, canvasW, edgeThickness, { isStatic: true }), // top
    Bodies.rectangle(canvasW / 2, canvasH + edgeThickness / 2, canvasW, edgeThickness, { isStatic: true }), // bottom
    Bodies.rectangle(-edgeThickness / 2, canvasH / 2, edgeThickness, canvasH, { isStatic: true }), // left
    Bodies.rectangle(canvasW + edgeThickness / 2, canvasH / 2, edgeThickness, canvasH, { isStatic: true }) // right
  ];
  World.add(world, walls);

  window.addEventListener("deviceorientation", handleGyro);
}

function handleGyro(event) {
  gyroX = event.gamma || 0;
  gyroY = event.beta || 0;
}

function draw() {
  background("#3273dc");
  Engine.update(engine);

  fill(255);
  noStroke();
  beginShape();
  for (let pt of zContour) {
    vertex(pt[0], pt[1] + yOffset);
  }
  endShape(CLOSE);

  drawBodies(imageBalls);
  drawBodies(outsideBalls);
  drawZLabels();
}

function drawZLabels() {
  fill(255, 255, 0);
  noStroke();
  textSize(10);
  for (let i = 0; i < zContour.length; i++) {
    let [x, y] = zContour[i];
    text(`(${x.toFixed(1)}, ${y.toFixed(1)})`, x + 5, y + yOffset);
  }
}

function drawBodies(arr) {
  for (let b of arr) {
    push();
    translate(b.position.x, b.position.y);
    rotate(b.angle);
    imageMode(CENTER);
    if (b.imageKey === "base") {
      image(imgs[b.imageKey], 0, 0, 44, 10);
    } else {
      image(imgs[b.imageKey], 0, 0, 62, 50);
    }

    // draw data near the object
    rotate(-b.angle);
    fill(255);
    textSize(9);
    textAlign(CENTER);
    text(`(${b.position.x.toFixed(1)}, ${b.position.y.toFixed(1)})`, 0, -30);
    text(`v=(${b.velocity.x.toFixed(2)}, ${b.velocity.y.toFixed(2)})`, 0, -20);
    text(`angle=${b.angle.toFixed(2)}`, 0, -10);
    pop();

    let fx = gyroX * 0.0005;
    let fy = gyroY * 0.0005;
    Body.applyForce(b, b.position, { x: fx, y: fy });
  }
}
