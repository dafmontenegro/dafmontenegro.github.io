class Node {

    constructor() {
        this.x = random(windowWidth);
        this.y = random(windowHeight);
        this.movX = random(-2, 3);
        this.movY = random(-2, 3);
    }

    move() {
        this.x += this.movX;
        this.y += this.movY;
        if (this.x < 0 || windowWidth < this.x) {
            this.movX *= -1;
        }
        if (this.y < 0 || windowHeight < this.y) {
            this.movY *= -1;
        }
        point(this.x, this.y);
    }

}

class Structure {

    constructor() {
        this.reload();
    }

    move() {
        strokeWeight(6);
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].move();
        }
        strokeWeight(1);
        this.nodes.sort((a, b) => a.x - b.x);
        let distance = windowWidth/12;
        for (let i = 0; i < this.nodes.length-1; i++) {
            for (let j = i+1; j < this.nodes.length && this.nodes[i].x - this.nodes[j].x < distance; j++) {
                if (dist(this.nodes[i].x, this.nodes[i].y, this.nodes[j].x, this.nodes[j].y) < distance) {
                    line(this.nodes[i].x, this.nodes[i].y, this.nodes[j].x, this.nodes[j].y);
                }
            }
        }
    }

    reload(){
        this.nodes = [];
        for (let i = 0; i < windowWidth/12; i++) {
            this.nodes.push(new Node());
        }
    }

}

function setup() {
    createCanvas(windowWidth, windowHeight);
    structure = new Structure(120);
    strokeWeight(1);
    frameRate(21);
}

function draw() {
    background(255);
    structure.move();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    structure.reload();
}