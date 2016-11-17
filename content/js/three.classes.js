// JN 2013

function Scene(container, delayStart) {
    // setup physijs
    Physijs.scripts.worker = '/js/physijs_worker.js';
    Physijs.scripts.ammo = '/js/ammo.js';
    // setup Scene
    var me = this;
    // scene properties
    var width = 100;
    var height = 100;
    // camera properties
    var viewAngle = 45;
    var near = 0.1;
    var far = 10000;
    // light properties
    var lightColor = 0xffffff;
    var lightPos = {
        x: 10,
        y: 50,
        z: 130
    };
    // DOM container
    var $container = !!container && makeContainer(container);
    // THREE objects
    var renderer = new THREE.CanvasRenderer();
    var camera;
    var scene = new Physijs.Scene();
    var light;
    // control vars
    var stop = !!delayStart;
    // objects to track
    var children = [];
    // timing
    var startTime;
    // renderer
    var shadowMapEnabled = true;
    var shadowMapSoft = true;

    // physics stuff
    scene.addEventListener('update', function() {
        scene.simulate(undefined, 1);
    });

    // helpers
    function aspect() {
        return width / height;
    }

    function makeContainer(container) {
        return container instanceof jQuery ? container : $(container);
    }

    // proxies to THREE objects
    this.add = function(child) {
        children.push(child);
        return scene.add(child.mesh);
    };

    this.render = function(time) {
        scene.simulate();
        var newChildren = [];
        children.forEach(function(child) {
            if (child.mesh.position.y < -200) {
                scene.remove(child.mesh);
            } else {
                newChildren.push(child);
            }
        });
        children = newChildren;
        renderer.render(scene, camera);
    };

    // accessors

    this.width = function(_) {
        if (!arguments.length) return width;
        width = +_;
        return setupRenderer();
    };

    this.height = function(_) {
        if (!arguments.length) return height;
        height = +_;
        return setupRenderer();
    };

    this.viewAngle = function(_) {
        if (!arguments.length) return viewAngle;
        viewAngle = +_;
        return setupCamera();
    };

    this.near = function(_) {
        if (!arguments.length) return near;
        near = +_;
        return setupCamera();
    };

    this.far = function(_) {
        if (!arguments.length) return far;
        far = +_;
        return setupCamera();
    };

    this.lightColor = function(_) {
        if (!arguments.length) return lightColor;
        lightColor = _;
        return setupLight();
    };

    this.lightPos = function(_) {
        if (!arguments.length) return lightPos;
        lightPos = _.extend(lightPos, _);
        return setupLight();
    };

    this.shadowMapEnabled = function(_) {
        if (!arguments.length) return shadowMapEnabled;
        shadowMapEnabled = !!_;
        return !!this.renderer && setupRenderer() || this;
    };

    this.shadowMapSoft = function(_) {
        if (!arguments.length) return shadowMapSoft;
        shadowMapSoft = !!_;
        return !!this.renderer && setupRenderer() || this;
    };

    // getters only
    
    this.renderer = function() {
        return renderer;
    };

    this.camera = function() {
        return camera;
    };

    this.scene = function() {
        return scene;
    };

    this.light = function() {
        return light;
    };


    // animator
    function step(time) {
        if (startTime === null) startTime = null;
        var timeDelta = time - startTime;
        if (!stop) {
            me.render(timeDelta);
            requestAnimationFrame(step);
        }
    }

    // commands
    this.start = function() {
        scene.setGravity(new THREE.Vector3(0, -30, 0));
        startTime = null;
        stop = false;
        requestAnimationFrame(step);
    };

    this.stop = function() {
        stop = true;
    };

    this.stopped = function() {
        return stop;
    };

    // utils

    function setupCamera() {
        if (!camera) {
            camera = new THREE.PerspectiveCamera(viewAngle, aspect(), near, far);
            camera.position.z = 300;
            scene.add(camera);
        } else {
            camera.far = far;
            camera.near = near;
            camera.viewAngle = viewAngle;
        }
        return me;
    }

    function setupLight() {
        if (!light) {
            light = new THREE.PointLight(lightColor);
            scene.add(light);
        } else {
            light.color = lightColor;
        }
        _.extend(light.position, lightPos);
        return me;
    }

    function setupRenderer() {
        renderer.setSize(width, height);
        renderer.shadowMapEnabled = shadowMapEnabled;
        renderer.shadowMapSoft = shadowMapSoft;
        return me;
    }

    function placeRendererInDOM() {
        $container.append(renderer.domElement);
        return me;
    }

    // create stuff
    function init() {
        setupLight();
        setupCamera();
        setupRenderer();
        placeRendererInDOM();
        return me;
    };

    init();
    if (!delayStart) this.start();
}







// Support for mixins
function Extensible() {
}

Extensible.prototype = {
    extends: function() {
        // mix arbitrary number of objects into this extensible
        _.extend.apply(this, [this].concat(_.map(arguments, function(Type) { return new Type(); })));
    }
};


function SceneObject() {
    var obj = this;
    this.geometry;
    this.mesh;
    this.material;
    var materialFactory = THREE.MeshLambertMaterial;
    var meshFactory = THREE.Mesh;
    var animator = _.noop;
    var color = 0xCC0000;
    var mass;
    var map;
    var shininess = 1;
    var emissive = 1;
    var specular = 1;
    var geoUpdateAttrs = [];


    // helpers
    function configureGeometry() {
        this.geometry.dynamic = true;
        // get the updatable keys from the geometry
        geoUpdateAttrs = _.map(_.filter(_.keys(this.geometry), function(key) {
                return /\w+NeedUpdate$/.test(key);
            }), function(key) {
                return key.replace('NeedUpdate', '');
            });
    }

    function makeGeometry() {
        this.makeGeometry();
        configureGeometry.call(this);
    }

    function makeMesh() {
        this.material = this.createMaterial();
        this.mesh = new meshFactory(this.geometry, this.material, mass);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.overdraw = true;
    }

    // implementation
    this.createMaterial = function() {
        return new materialFactory({
            color: color,
            map: map,
            shininess: shininess,
            emissive: emissive,
            specular: specular
        });
    };

    this.updateGeometry = function() {
        if (!!this.geometry) delete this.geometry;
        makeGeometry.call(this);
        return this;
    };

    this.update = function(firstAttr) {
        if (this.geometry === undefined) makeGeometry.call(this);
        if (this.mesh === undefined) makeMesh.call(this);
        var that = this;
        var attrs = firstAttr === undefined ? geoUpdateAttrs :
            _.isArray(firstAttr) ? firstAttr :
            _.rest(arguments, 0);
        attrs.forEach(function(attr) {
            that.geometry[attr + 'NeedUpdate'] = true;
        });
        return this;
    };

    this.animate = function(time) {
        animator(time);
    };

    // utils
    this.addTo = function(scene) {
        // make sure that everything is up-to-date
        this.update();
        scene.add(this);
        return this;
    };

    this.move = function(x, y, z) {
        if (!this.mesh) this.update();
        var pos = this.mesh.position;
        pos.set(x, y, z);
        this.mesh.__dirtyPosition = true;
        return this;
    };

    this.rotate = function(x, y, z) {
        if (!this.mesh) this.update();
        var rot = this.mesh.rotation;
        rot.set(x, y, z);
        this.mesh.__dirtyRotation = true;
        return this;
    };

    // accessors
    this.color = function(_) {
        if (!arguments.length) return color;
        color = _;
        return !!this.mesh && this.update('colors') || this;
    };

    this.mass = function(_) {
        if (!arguments.length) return mass;
        mass = +_;
        !!this.mesh && delete this.mesh;
        return !!this.mesh && this.update() || this;
    };

    this.map = function(_) {
        if (!arguments.length) return map;
        map = _;
        !!this.mesh && delete this.mesh;
        return !!this.mesh && this.update() || this;
    };

    this.shininess = function(_) {
        if (!arguments.length) return shininess;
        shininess = +_;
        !!this.mesh && delete this.mesh;
        return !!this.mesh && this.update() || this;
    };

    this.emissive = function(_) {
        if (!arguments.length) return emissive;
        emissive = +_;
        !!this.mesh && delete this.mesh;
        return !!this.mesh && this.update() || this;
    };

    this.specular = function(_) {
        if (!arguments.length) return specular;
        specular = +_;
        !!this.mesh && delete this.mesh;
        return !!this.mesh && this.update() || this;
    };

    this.materialFactory = function(_) {
        if (!arguments.length) return materialFactory;
        materialFactory = _;
        !!this.mesh && delete this.mesh;
        return (!!this.mesh && this.update()) || this;
    };

    this.meshFactory = function(_) {
        if (!arguments.length) return meshFactory;
        meshFactory = _;
        !!this.mesh && delete this.mesh;
        return !!this.mesh && this.update() || this;
    };

    this.animator = function(_) {
        if (!arguments.length) return animator;
        animator = (function(startPos) {
            var startTime = new Date().getTime();
            return (function(globalTimeDelta) {
                var currentTime = new Date().getTime();
                var timeDelta = currentTime - startTime;
                _.call(this, timeDelta, startPos, globalTimeDelta);
            }).bind(this);
        }).call(this, this.mesh.position);
        return this;
    };
}

SceneObject.prototype = new Extensible();


function PhysicalObject() {
    this.extends(SceneObject);
    // physical attributes
    var friction = .8;
    var restitution = .3;

    function physiAccessor(property, value) {
        if (this.material === undefined) this.createMaterial();
        var physiObj = this.material._physijs;
        if (value === undefined) return physiObj[property];
        physiObj[property] = +value;
        return this;
    }

    // override material creation, making it physical
    var _createMaterial = this.createMaterial;
    this.createMaterial = function() {
        var m = Physijs.createMaterial(_createMaterial(), friction, restitution);
        return m;
    };

    this.friction = function(_) {
        if (!arguments.length) return friction;
        friction = +_;
        return physiAccessor.call(this, 'friction', friction);
    };

    this.restitution = function(_) {
        if (!arguments.length) return restitution;
        restitution = +_;
        return physiAccessor.call(this, 'restitution', restitution);
    };
}

PhysicalObject.prototype = new Extensible();





function Sphere() {
    var sphere = this;
    var radius = 50;
    var segments = 16;
    var rings = 16;

    this.radius = function(_) {
        if (!arguments.length) return radius;
        radius = +_;
        return this.updateGeometry();
    };

    this.segments = function(_) {
        if (!arguments.length) return segments;
        segments = +_;
        return this.updateGeometry();
    };

    this.rings = function(_) {
        if (!arguments.length) return rings;
        rings = +_;
        return this.updateGeometry();
    };

    // implementation methods
    this.makeGeometry = function() {
        this.geometry = new THREE.SphereGeometry(radius, segments, rings);
    };
}

Sphere.prototype = new SceneObject();




function PhysicalSphere() {
    this.extends(PhysicalObject);
    this.meshFactory(Physijs.SphereMesh);
}

PhysicalSphere.prototype = new Sphere();




function Cylinder() {
    var cylinder = this;
    var height = 10;
    var radiusTop = 20;
    var radiusBottom = 20;
    var radiusSegments = 8;
    var heightSegments = 1;
    var openEnded = false;

    this.radius = function(_) {
        if (!arguments.length) return { top: radiusTop, bottom: radiusBottom };
        if (typeof _ ==='object') {
            radiusTop = +_.top || radiusTop;
            radiusBottom = +_.bottom || radiusBottom;
        } else {
            radiusTop = radiusBottom = +_;
        }
        return this.updateGeometry();
    };

    this.radiusTop = function(_) {
        if (!arguments.length) return radiusTop;
        radiusTop = +_;
        return this.updateGeometry();
    };

    this.radiusBottom = function(_) {
        if (!arguments.length) return radiusBottom;
        radiusBottom = +_;
        return this.updateGeometry();
    };

    this.segments = function(_) {
        if (!arguments.length) return { radius: radiusSegments, height: heightSegments };
        if (typeof _ === 'object') {
            radiusSegments = +_.radius || radiusSegments;
            heightSegments = +_.height || heightSegments;
        } else {
            radiusSegments = heightSegments = +_;
        }
        return this.updateGeometry();
    };

    this.radiusSegments = function(_) {
        if (!arguments.length) return radiusSegments;
        radiusSegments = +_;
        return this.updateGeometry();
    };

    this.heightSegments = function(_) {
        if (!arguments.length) return heightSegments;
        heightSegments = +_;
        return this.updateGeometry();
    };

    this.openEnded = function(_) {
        if (!arguments.length) return openEnded;
        openEnded = !!_;
        return this.updateGeometry();
    };

    this.height = function(_) {
        if (!arguments.length) return height;
        height = +_;
        return this.updateGeometry();
    };

    // implementation methods
    this.makeGeometry = function() {
        this.geometry = new THREE.CylinderGeometry(
            radiusTop,
            radiusBottom,
            height,
            radiusSegments,
            heightSegments,
            openEnded
        );
    };
}

Cylinder.prototype = new SceneObject();




function PhysicalCylinder() {
    this.extends(PhysicalObject);
    this.meshFactory(Physijs.CylinderMesh);
}

PhysicalCylinder.prototype = new Cylinder();






function Plane() {
    var width = 10;
    var height = 10;
    var heightSegments = 1;
    var widthSegments = 1;


    // accessors
    this.width = function(_) {
        if (!arguments.length) return width;
        width = +_;
        return this.updateGeometry();
    };

    this.height = function(_) {
        if (!arguments.length) return height;
        height = +_;
        return this.updateGeometry();
    };

    this.widthSegments = function(_) {
        if (!arguments.length) return widthSegments;
        widthSegments = +_;
        return this.updateGeometry();
    };

    this.heightSegments = function(_) {
        if (!arguments.length) return heightSegments;
        heightSegments = +_;
        return this.updateGeometry();
    };

    this.segments = function(_) {
        if (!arguments.length) return { width: widthSegments, height: heightSegments };
        heightSegments = widthSegments = +_;
        return this.updateGeometry();
    };

    // implementation
    this.makeGeometry = function() {
        this.geometry = new THREE.PlaneGeometry(
            width,
            height,
            widthSegments,
            heightSegments
        );
    };
}

Plane.prototype = new SceneObject();



function Cube() {
    var depth = 1;
    var depthSegments = 1;

    this.segments = function(_) {
        if (!arguments.length) return {
            width: this.widthSegments(),
            height: this.heightSegments(),
            depth: depthSegments
        };
        var segments = +_;
        this.widthSegments(segments);
        this.heightSegments(segments);
        depthSegments = segments;
        return this.updateGeometry();
    };

    this.depthSegments = function(_) {
        if (!arguments.length) return depthSegments;
        depthSegments = +_;
        return this.updateGeometry();
    };

    this.depth = function(_) {
        if (!arguments.length) return depth;
        depth = +_;
        return this.updateGeometry();
    };

    this.makeGeometry = function() {
        this.geometry = new THREE.CubeGeometry(
            this.width(),
            this.height(),
            depth,
            this.widthSegments(),
            this.heightSegments(),
            depthSegments
        );
    };
}

Cube.prototype = new Plane();



function Ground() {
    this.extends(PhysicalObject);
    this.meshFactory(Physijs.BoxMesh);
    this.materialFactory(THREE.MeshLambertMaterial);
    this
        .mass(0)
        .width(100)
        .height(1)
        .depth(40);
}

Ground.prototype = new Cube();
