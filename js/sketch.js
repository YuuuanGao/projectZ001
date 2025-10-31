let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body;

let engine, world;
let boxes = [];
let images = [];
let boxCount = 8;
let boxSize = 93;
let typeImg;

let zContour = [
  [277.73, 83.5], [97.90, 83.5], [71.59, 109.82], [71.59, 129.24],
  [97.90, 155.56], [195.02, 155.56], [210.68, 178.11], [82.86, 506.43],
  [80.98, 516.46], [80.98, 557.18], [106.67, 583.5], [268.33, 583.5],
  [294.64, 557.18], [294.64, 538.39], [268.33, 511.44], [193.14, 511.44],
  [177.47, 488.89], [302.16, 160.57], [303.41, 150.54], [303.41, 109.82],
  [277.73, 83.5]
];

let gyroEnabled = false;
let yOffset = 0;

function preload() {
  for (let i = 1; i <= 4; i++) {
    images.push(loadImage(`./${i}.png`));
  }
  typeImg = loadImage("./type.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  engine = Engine.create();
  world = engine.world;  // ✅ 全局 world 引用，修复力无效问题

  // Y方向偏移量使Z垂直居中
  let allY = zContour.map(p => p[1]);
  let minY = Math.min(...allY);
  let maxY = Math.max(...allY);
  let shapeHeight = maxY - minY;
  yOffset = height / 2 - (minY + shapeHeight / 2);

  // 创建Z图形碰撞体
  let vertices = zContour.map(p => ({ x: p[0], y: p[1] + yOffset }));
  let shape = Bodies.fromVertices(width / 2, 0, vertices, {
    isStatic: true,
    restitution: 1,
    friction: 0.1
  }, true);
  World.add(world, shape);

  // 墙体边界（上下左右）
  let wallThickness = 100;
  let edgePadding = 100;
  let left = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height + edgePadding, { isStatic: true });
  let right = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height + edgePadding, { isStatic: true });
  let topWall = Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, { isStatic: true });
  let bottom = Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, { isStatic: true });
  World.add(world, [left, right, topWall, bottom]);

  // 添加图像盒子
  for (let i = 0; i < boxCount; i++) {
    let box = Bodies.rectangle(
      random(100, width - 100),
      random(100, height - 200),
      boxSize,
      boxSize,
      { restitution: 0.7, friction: 0.3 }
    );
    box.img = images[i % images.length];
    World.add(world, box);
    boxes.push(box);
  }

  // 创建陀螺仪按钮
  let btn = createButton('启用陀螺仪');
  btn.position(20, 20);
  btn.mousePressed(enableGyro);
}

function draw() {
  background("#3273dc");
  Engine.update(engine);

  // 绘制 type.png 背景
  push();
  imageMode(CENTER);
  translate(width / 2, 0);
  image(typeImg, 0, yOffset + 333, 400, 667); // 居中Z图像
  pop();

  // 显示Z路径点坐标
  fill(255, 255, 0);
  noStroke();
  textSize(12);
  for (let pt of zContour) {
    let x = pt[0] + width / 2;
    let y = pt[1] + yOffset;
    text(`(${x.toFixed(1)}, ${y.toFixed(1)})`, x + 5, y);
  }

  // 显示每个图片和其物理状态
  for (let box of boxes) {
    let pos = box.position;
    let angle = box.angle;
    let v = box.velocity;

    push();
    translate(pos.x, pos.y);
    rotate(angle);
    imageMode(CENTER);
    image(box.img, 0, 0, boxSize, boxSize);
    pop();

    // 显示调试信息
    fill(255);
    textSize(10);
    textAlign(CENTER);
    text(`(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})\nv=(${v.x.toFixed(2)}, ${v.y.toFixed(2)})\nangle=${angle.toFixed(2)}`, pos.x, pos.y + boxSize / 2 + 30);
  }
}

function enableGyro() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
          gyroEnabled = true;
        } else {
          alert("用户拒绝了陀螺仪权限。");
        }
      })
      .catch(err => {
        alert("陀螺仪权限请求失败: " + err);
      });
  } else {
    window.addEventListener('deviceorientation', handleOrientation);
    gyroEnabled = true;
  }
}

function handleOrientation(event) {
  if (!gyroEnabled) return;
  let xAccel = event.gamma / 90;
  let yAccel = event.beta / 90;
  for (let box of boxes) {
    Body.applyForce(box, box.position, {
      x: xAccel * 0.002,
      y: yAccel * 0.002
    });
  }
}
