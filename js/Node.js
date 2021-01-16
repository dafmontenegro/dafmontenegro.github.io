class Node {

    constructor() {
        this.x = random(windowWidth);
        this.y = random(windowHeight);
        this.movX = random(-5, 6);
        this.movY = random(-5, 6);
    }

    move() {
        push();
        strokeWeight(6);
        this.x += this.movX;
        this.y += this.movY;
        point(this.x, this.y);
        this.reverseDirection(this.x < 0 || windowWidth < this.x, this.y < 0 || windowHeight < this.y);
        pop();
    }

    reverseDirection(x = true, y = true) {
        if (x) {
            this.movX *= -1;
            this.x += this.movX;
        }
        if (y) {
            this.movY *= -1;
            this.y += this.movY;
        }
    }

}