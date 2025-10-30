let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    engine;

let imageBalls = [];
let outsideBalls = [];
let imgs = {};
let canvasW = window.innerWidth;
let canvasH = window.innerHeight;

const NUM_INSIDE = 10;
const NUM_EACH_OUTSIDE = 3;
const outsideImages = ["1.png", "2.png", "3.png", "4.png"];

// Z 轮廓点
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

  // ✅ 添加屏幕边界墙（防止小球飞出屏幕）
  let wallOptions = { isStatic: true };
  let wallThickness = 20;
  let leftWall = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, wallOptions);
  let rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, wallOptions);
  let topWall = Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, wallOptions);
  let bottomWall = Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, wallOptions);
  World.add(world, [leftWall, rightWall, topWall, bottomWall]);

  // ✅ 计算 yOffset 让 Z 居中
  let allY = zContour.map(p => p[1]);
  let minY = Math.min(...allY);
  let maxY = Math.max(...allY);
  let shapeHeight = maxY - minY;
  yOffset = height / 2 - (minY + shapeHeight / 2);

  // ✅ 创建 Z 轮廓墙
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

  // ✅ Z 内部 type.png
  for (let i = 0; i < NUM_INSIDE; i++) {
    let x = 190;
    let y = 300 + yOffset;
    let ball = Bodies.rectangle(x, y, 44, 10, {
      restitution: 0.5,
      frictionAir: 0.2
    });
    ball.imageKey = "base";
    ball.isInside = true;
    imageBalls.push(ball);
    World.add(world, ball);
  }

  // ✅ 外部图片
  for (let key of outsideImages) {
    for (let i = 0; i < NUM_EACH_OUTSIDE; i++) {
      let x = random(30, width - 30);
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

  // ✅ 启用陀螺仪（已授权）
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

  // 画出Z图形（仅视觉用）
  fill(255);
  noStroke();
  beginShape();
  for (let pt of zContour) {
    vertex(pt[0], pt[1] + yOffset);
  }
  endShape(CLOSE);

  drawBodies(imageBalls);
  drawBodies(outsideBalls);

  // 加速度
  let allBalls = imageBalls.concat(outsideBalls);
  let forceScale = 0.0005;
  for (let b of allBalls) {
    let fx = gyroX * forceScale;
    let fy = gyroY * forceScale;
    Body.applyForce(b, b.position, { x: fx, y: fy });
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
    pop();
  }
}
