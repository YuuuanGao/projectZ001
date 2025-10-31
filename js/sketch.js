let engine, world;
let books = [];
let images = {};
let zVertices = [
  [277.73, 83.5], [97.90, 83.5], [71.59, 109.82], [71.59, 129.24],
  [97.90, 155.56], [195.02, 155.56], [210.68, 178.11], [82.86, 506.43],
  [80.98, 516.46], [80.98, 557.18], [106.67, 583.5], [268.33, 583.5],
  [294.64, 557.18], [294.64, 538.39], [268.33, 511.44], [193.14, 511.44],
  [177.47, 488.89], [302.16, 160.57], [303.41, 150.54], [303.41, 109.82],
  [277.73, 83.5]
];
let gyroData = null;
let started = false;

function preload() {
  for (let i = 1; i <= 4; i++) {
    images[i] = loadImage(`js/${i}.png`);
  }
  images["type"] = loadImage("js/type.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  engine = Matter.Engine.create();
  world = engine.world;
  world.gravity.y = 1;

  // 边界
  let thickness = 100;
  let options = { isStatic: true };
  Matter.World.add(world, [
    Matter.Bodies.rectangle(width / 2, -thickness / 2, width, thickness, options),
    Matter.Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, options),
    Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height, options),
    Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, options)
  ]);

  // 添加所有书本
  createBooks();
}

function createBooks() {
  for (let key in images) {
    let img = images[key];
    let isMain = key === "type";
    let x = random(width * 0.1, width * 0.9);
    let y = random(height * 0.1, height * 0.3);
    let w = isMain ? width : img.width / 2.5;
    let h = isMain ? height : img.height / 2.5;

    let body = Matter.Bodies.rectangle(x, y, w, h, {
      restitution: 0.5,
      friction: 0.5
    });

    Matter.World.add(world, body);
    books.push({
      body: body,
      img: img,
      isMain: isMain
    });
  }
}

function draw() {
  background("#1D68F1"); // 背景色填满
  Matter.Engine.update(engine);

  // Z 边界点标注
  fill("yellow");
  textSize(14);
  noStroke();
  for (let pt of zVertices) {
    text(`(${pt[0].toFixed(1)}, ${pt[1].toFixed(1)})`, pt[0], pt[1]);
  }

  // 绘制图像 + 物理体状态
  for (let book of books) {
    let pos = book.body.position;
    let angle = book.body.angle;
    push();
    translate(pos.x, pos.y);
    rotate(angle);
    imageMode(CENTER);
    image(book.img, 0, 0, book.isMain ? width : book.img.width / 2.5, book.isMain ? height : book.img.height / 2.5);
    pop();

    // 文字信息标注
    fill(255);
    textSize(12);
    noStroke();
    let v = book.body.velocity;
    text(
      `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})\n` +
      `v=(${v.x.toFixed(2)}, ${v.y.toFixed(2)})\n` +
      `angle=${angle.toFixed(2)}`,
      pos.x + 10,
      pos.y - 10
    );
  }

  if (started && gyroData) {
    applyGyroForce();
  }
}

function applyGyroForce() {
  let forceX = gyroData.gamma * 0.0005;
  let forceY = gyroData.beta * 0.0005;

  for (let book of books) {
    Matter.Body.applyForce(book.body, book.body.position, {
      x: forceX * book.body.mass,
      y: forceY * book.body.mass
    });
  }
}

function enableGyro() {
  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === "granted") {
          window.addEventListener("deviceorientation", handleOrientation);
          started = true;
        }
      })
      .catch(console.error);
  } else {
    // 非 iOS
    window.addEventListener("deviceorientation", handleOrientation);
    started = true;
  }
}

function handleOrientation(event) {
  gyroData = event;
}
