function setup() {
    createCanvas(windowWidth, windowHeight);
    structure = new Structure();
    textAlign(CENTER, CENTER);
    textFont('Georgia');
    frameRate(12);
}

function draw() {
    background(0);
    stroke(255);
    structure.move();
    noStroke();
    fill(255, 255, 0);
    textSize(structure.unit*3);
    text('404', windowWidth / 2, windowHeight / 2);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    structure.createNodes();
}