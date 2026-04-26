/**
 * Physics engine setup using Matter.js
 */
class PhysicsEngine {
    constructor() {
        this.engine = null;
        this.world = null;
        this.render = null;
        this.runner = null;
    }

    init(canvas, width, height) {
        // Create engine
        this.engine = Matter.Engine.create({
            enableSleeping: true,
            constraintIterations: 4,
            positionIterations: 8,
            velocityIterations: 8
        });
        
        this.world = this.engine.world;
        this.world.gravity.y = 0; // Top-down view, no gravity

        // Create renderer
        this.render = Matter.Render.create({
            canvas: canvas,
            engine: this.engine,
            options: {
                width: width,
                height: height,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio || 1
            }
        });

        // Create runner
        this.runner = Matter.Runner.create({
            isFixed: true,
            delta: 1000 / 60
        });
    }

    start() {
        Matter.Render.run(this.render);
        Matter.Runner.run(this.runner, this.engine);
    }

    stop() {
        if (this.render) Matter.Render.stop(this.render);
        if (this.runner) Matter.Runner.stop(this.runner);
    }

    clear() {
        Matter.World.clear(this.world);
        Matter.Engine.clear(this.engine);
    }

    addBody(body) {
        Matter.World.add(this.world, body);
    }

    removeBody(body) {
        Matter.World.remove(this.world, body);
    }

    setVelocity(body, velocity) {
        Matter.Body.setVelocity(body, velocity);
    }

    setPosition(body, position) {
        Matter.Body.setPosition(body, position);
    }

    applyForce(body, position, force) {
        Matter.Body.applyForce(body, position, force);
    }

    onCollision(callback) {
        Matter.Events.on(this.engine, 'collisionStart', callback);
    }

    onAfterUpdate(callback) {
        Matter.Events.on(this.engine, 'afterUpdate', callback);
    }

    resize(width, height) {
        this.render.options.width = width;
        this.render.options.height = height;
        this.render.canvas.width = width * (window.devicePixelRatio || 1);
        this.render.canvas.height = height * (window.devicePixelRatio || 1);
    }
}
