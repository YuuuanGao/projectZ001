let engine, world;
let balls = [];
let img;
let externalImages = [];
let gyroX = 0, gyroY = 0;

function preload() {
  img = loadImage('type.png');
  for (let i = 1; i <= 4; i++) {
    for (let j = 0; j < 3; j++) {
      externalImages.push(loadImage(i + '.png'));
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  engine = Matter.Engine.create();
  world = engine.world;
  world.gravity.scale = 0;

  // internal ball
  for (let i = 0; i < 10; i++) {
    let b = createBall(random(width / 2 - 100, width / 2 + 100), random(height / 2 - 100, height / 2 + 100), img, true);
    balls.push(b);
  }

  // external balls
  for (let i = 0; i < externalImages.length; i++) {
    let b = createBall(random(width), random(height), externalImages[i], false);
    balls.push(b);
  }

  // request permission
  const btn = document.getElementById("gyro-btn");
  btn.addEventListener("click", () => {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission().then(response => {
        if (response === "granted") {
          window.addEventListener("deviceorientation", handleGyro);
          btn.style.display = "none";
        } else {
          alert("权限未授权");
        }
      }).catch(console.error);
    } else {
      // Android 或已授权
      window.addEventListener("deviceorientation", handleGyro);
      btn.style.display = "none";
    }
  });
}

function handleGyro(e) {
  gyroX = e.gamma || 0;
  gyroY = e.beta || 0;
}

function draw() {
  background('#4169e1');
  Matter.Engine.update(engine);

  for (let b of balls) {
    let pos = b.body.position;
    let angle = b.body.angle;

    // Apply force based on gyro
    let fx = gyroX * 0.0005;
    let fy = gyroY * 0.0005;
    Matter.Body.applyForce(b.body, pos, { x: fx, y: fy });

    push();
    translate(pos.x, pos.y);
    rotate(angle);
    imageMode(CENTER);
    image(b.img, 0, 0, b.w, b.h);
    pop();
  }
}

function createBall(x, y, img, isInside) {
  let w = isInside ? 44 : 62;
  let h = isInside ? 10 : 50;
  let body = Matter.Bodies.rectangle(x, y, w, h, {
    restitution: 0.5,
    frictionAir: 0.1
  });
  Matter.World.add(world, body);
  return {
    body,
    img,
    w,
    h
  };
}
