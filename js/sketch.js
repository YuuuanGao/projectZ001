let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    engine;

let imageBalls = [];
let outsideBalls = [];
let imgs = {};

const CANVAS_W = 375;
const CANVAS_H = 667;

const NUM_INSIDE = 10;
const NUM_EACH_OUTSIDE = 3;
const outsideImages = ["1.png", "2.png", "3.png", "4.png"];

// Z 轮廓
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
  createCanvas(windowWidth, windowHeight);
  engine = Engine.create();
  let world = engine.world;

  // 计算垂直偏移用于居中内容
  let allY = zContour.map(p => p[1]);
  let minY = Math.min(...allY);
  let maxY = Math.max(...allY);
  let shapeHeight = maxY - minY;
  yOffset = CANVAS_H / 2 - (minY + shapeHeight / 2);

  // 创建 Z 外墙
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

  // Z 里的 ball
  for (let i = 0; i < NUM_INSIDE; i++) {
    let x = CANVAS_W / 2;
    let y = CANVAS_H / 2;
    let ball = Bodies.rectangle(x, y, 44, 10, {
      restitution: 0.5,
      frictionAir: 0.2
    });
    ball.imageKey = "base";
    ball.isInside = true;
    imageBalls.push(ball);
    World.add(world, ball);
  }

  // 外部四张图
  for (let key of outsideImages) {
    for (let i = 0; i < NUM_EACH_OUTSIDE; i++) {
      let x = random(30, CANVAS_W - 30);
      let y = random(30, 100);
      let ball = Bodies.rectangle(x, y, 62, 50, {
        restitution: 0.5,
        frictionAir: 0.2
      });
      ball.imageKey = key;
      ball.isInside = false;
      outsideBalls.push(ball);
      World.add(world, ball);
    }
  }

  // 陀螺仪监听
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission().then(response => {
      if (response === "granted") {
        window.addEventListener("deviceorientation", handleGyro);
      }
    }).catch(console.error);
  } else {
    window.addEventListener("deviceorientation", handleGyro);
  }
}

function handleGyro(event) {
  gyroX = event.gamma || 0;
  gyroY = event.beta || 0;
}

function draw() {
  background('#3273dc');
  Engine.update(engine);

  // 居中画布内容
  push();
  translate(width / 2 - CANVAS_W / 2, height / 2 - CANVAS_H / 2);

  // Z 形状
  fill(255);
  noStroke();
  beginShape();
  for (let pt of zContour) {
    vertex(pt[0], pt[1] + yOffset);
  }
  endShape(CLOSE);

  drawBodies(imageBalls);
  drawBodies(outsideBalls);

  // 施加力
  let allBalls = imageBalls.concat(outsideBalls);
  let forceScale = 0.0005;
  for (let b of allBalls) {
    let fx = gyroX * forceScale;
    let fy = gyroY * forceScale;
    Body.applyForce(b, b.position, { x: fx, y: fy });
  }

  pop();
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
    pop();
  }
}
