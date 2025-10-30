let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    engine;

let imageBalls = [];
let outsideBalls = [];
let imgs = {};
let canvasW, canvasH;

const NUM_INSIDE = 5;
const NUM_EACH_OUTSIDE = 2;
const outsideImages = ["1.png", "2.png", "3.png", "4.png"];
const Z_IMAGE_WIDTH = 88;
const Z_IMAGE_HEIGHT = 20;
const OUT_IMAGE_WIDTH = 93;
const OUT_IMAGE_HEIGHT = 75;

// p5.js contour path
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
  canvasW = windowWidth;
  canvasH = windowHeight;
  createCanvas(canvasW, canvasH);
  engine = Engine.create();
  let world = engine.world;

  // calculate vertical center offset
  let allY = zContour.map(p => p[1]);
  let minY = Math.min(...allY);
  let maxY = Math.max(...allY);
  let shapeHeight = maxY - minY;
  yOffset = height / 2 - (minY + shapeHeight / 2);

  // Z 内部轮廓墙壁
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

  // ✅ 屏幕边界墙体，防止飞出
  let wallOptions = { isStatic: true, restitution: 1 };
  let wallThickness = 100;
  let leftWall = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, wallOptions);
  let rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, wallOptions);
  let topWall = Bodies.rectangle(width / 2, -wallThickness / 2, width * 2, wallThickness, wallOptions);
  let bottomWall = Bodies.rectangle(width / 2, height + wallThickness / 2, width * 2, wallThickness, wallOptions);
  World.add(world, [leftWall, rightWall, topWall, bottomWall]);

  // Z 内部图片 type.png
  for (let i = 0; i < NUM_INSIDE; i++) {
    let x = 190;
    let y = 300 + yOffset;
    let ball = Bodies.rectangle(x, y, Z_IMAGE_WIDTH, Z_IMAGE_HEIGHT, {
      restitution: 0.5,
      frictionAir: 0.2
    });
    ball.imageKey = "base";
    imageBalls.push(ball);
    World.add(world, ball);
  }

  // 外部图片 1~4.png
  for (let key of outsideImages) {
    for (let i = 0; i < NUM_EACH_OUTSIDE; i++) {
      let x = random(30, width - 30);
      let y = random(30, 100);
      let ball = Bodies.rectangle(x, y, OUT_IMAGE_WIDTH, OUT_IMAGE_HEIGHT, {
        restitution: 0.5,
        frictionAir: 0.2
      });
      ball.imageKey = key;
      outsideBalls.push(ball);
      World.add(world, ball);
    }
  }

  // 启用陀螺仪监听
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
  gyroX = event.gamma || 0; // 左右倾斜
  gyroY = event.beta || 0;  // 前后倾斜
}

function draw() {
  background('#3273dc');
  Engine.update(engine);

  // 绘制 Z 区域
  fill(255);
  noStroke();
  beginShape();
  for (let pt of zContour) {
    vertex(pt[0], pt[1] + yOffset);
  }
  endShape(CLOSE);

  drawBodies(imageBalls, Z_IMAGE_WIDTH, Z_IMAGE_HEIGHT);
  drawBodies(outsideBalls, OUT_IMAGE_WIDTH, OUT_IMAGE_HEIGHT);

  // 应用陀螺仪力
  let allBalls = imageBalls.concat(outsideBalls);
  let forceScale = 0.0002;
  for (let b of allBalls) {
    let fx = gyroX * forceScale;
    let fy = gyroY * forceScale;
    Body.applyForce(b, b.position, { x: fx, y: fy });
  }
}

function drawBodies(arr, w, h) {
  for (let b of arr) {
    push();
    translate(b.position.x, b.position.y);
    rotate(b.angle);
    imageMode(CENTER);
    image(imgs[b.imageKey], 0, 0, w, h);
    pop();
  }
}
