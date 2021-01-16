class Structure {

    constructor() {
        this.createNodes();
    }

    move() {
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].move();
        }
        this.nodes.sort((nodeA, nodeB) => nodeA.x - nodeB.x);
        for (let i = 0; i < this.nodes.length - 1; i++) {
            let j = i + 1;
            while (j < this.nodes.length && this.nodes[i].x - this.nodes[j].x < this.unit) {
                let distance = dist(this.nodes[i].x, this.nodes[i].y, this.nodes[j].x, this.nodes[j].y);
                if (distance < this.unit) {
                    line(this.nodes[i].x, this.nodes[i].y, this.nodes[j].x, this.nodes[j].y);
                    if (distance < 6) {
                        this.nodes[i].reverseDirection();
                        this.nodes[j].reverseDirection();
                    }
                }
                j++;
            }
        }
    }

    createNodes() {
        this.nodes = [];
        this.unit = (windowWidth * windowHeight) / 17280;
        for (let i = 1; i < this.unit; i++) {
            this.nodes.push(new Node());
        }
    }

}