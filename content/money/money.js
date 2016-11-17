// JN 2013


// Nouns

function Coin() {
    var coin = this;
    var value;

    //this.materialFactory(THREE.MeshPhongMaterial);

    this.radiusSegments(10);
    this.heightSegments(1);
    this.height(0.5);

    this.value = function(_) {
        if (!arguments.length) return value;
        value = +_;
        return this;
    }
}

Coin.prototype = new PhysicalCylinder();


function Penny() {
    var penny = this;

    this
        .radius(5)
        .color(0xbb6600)
        .value(.01);
}

Penny.prototype = new Coin();