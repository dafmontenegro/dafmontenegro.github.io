class Star {

  constructor() {
    this.update();
  }

  update() {  
    this.radio = random(1, 3);
    this.x = random(-width / 2, width / 2);
    this.y = random(-height / 2, height / 2);
    this.px = random(this.x, width / 2);
    this.py = random(this.y, height / 2);
  }

  show(speed) {
    if (dist(0, 0, this.x, this.y) < mag(width / 2, height / 2)) {
      this.color = map(dist(0, 0, this.x, this.y), 0, 300, 128, 255, true);
      fill(this.color);
      stroke(this.color);
      this.px = this.x;
      this.py = this.y;
      this.x *= speed;
      this.y *= speed;
      this.radio *= speed;
      ellipse(this.x, this.y, this.radio, this.radio);
      line(this.px, this.py, this.x, this.y);
    } else {
      this.update();
    }
  }

}

var stars = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (var i = 0; i < 210; i++) {
    stars[i] = new Star();
  }
}

function draw() {
  background(0);
  translate(width / 2, height / 2);
  for (var i = 0; i < stars.length; i++) {
    stars[i].show(mouseDistance());
  }
  fill(255);
  let distance = map(mouseDistance(), 1, 1.1, 32, 3);
  ellipse(0, 0, distance, distance);
  if (distance > 24) {
    push();
    stroke(0);
    strokeWeight(3);
    textSize(48);
    textStyle(BOLD);
    textFont('Georgia');
    textAlign(CENTER, CENTER);
    fill(255, 255, 0);
    text('Coming Soon!', 0, 0);
    pop();
  }
}

function mouseDistance() {
  return map(dist(width / 2, height / 2, mouseX, mouseY), 0, 300, 1, 1.1, true);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}