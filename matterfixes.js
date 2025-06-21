let Matter = require("matter-js");
let Resolver = {};
                                
let Vertices = Matter.Vertices;
let Common = Matter.Common;
let Bounds = Matter.Bounds;

Resolver._restingThresh = 2;
Resolver._restingThreshTangent = Math.sqrt(6);
Resolver._positionDampen = 0.9;
Resolver._positionWarming = 0.8;
Resolver._frictionNormalMultiplier = 5;
Resolver._frictionMaxStatic = Number.MAX_VALUE;
/**
 * Find a solution for pair positions.
 * @method solvePosition
 * @param {pair[]} pairs
 * @param {number} delta
 * @param {number} [damping=1]
 */
exports.solvePosition = function(pairs, delta, damping) {
    let i,
        pair,
        collision,
        bodyA,
        bodyB,
        normal,
        contactShare,
        positionImpulse,
        positionDampen = Resolver._positionDampen * (damping || 1),
        slopDampen = Common.clamp(delta / Common._baseDelta, 0, 1),
        pairsLength = pairs.length,
        ATreatStatic = false,
        BTreatStatic = false;

    // find impulses required to resolve penetration
    for (i = 0; i < pairsLength; i++) {
        pair = pairs[i];

        if (!pair.isActive || pair.isSensor)
            continue;

        collision = pair.collision;
        bodyA = collision.parentA;
        bodyB = collision.parentB;
        normal = collision.normal;

        // get current separation between body edges involved in collision
        pair.separation =
            normal.x * (bodyB.positionImpulse.x + collision.penetration.x - bodyA.positionImpulse.x) +
            normal.y * (bodyB.positionImpulse.y + collision.penetration.y - bodyA.positionImpulse.y);
    }

    for (i = 0; i < pairsLength; i++) {
        pair = pairs[i];

        if (!pair.isActive || pair.isSensor)
            continue;

        collision = pair.collision;
        bodyA = collision.parentA;
        bodyB = collision.parentB;
        normal = collision.normal;
        positionImpulse = pair.separation - pair.slop * slopDampen;
      
        ATreatStatic = bodyA.isStatic || (bodyA.mass > bodyB.mass && bodyA.collisionFilter.me.type !== "tank");
        BTreatStatic = bodyB.isStatic || (bodyB.mass > bodyA.mass && bodyB.collisionFilter.me.type !== "tank");
      
      
        if (ATreatStatic || BTreatStatic) {
            positionImpulse *= 2;
        }
      
        if (!(ATreatStatic || bodyA.isSleeping)) {
            contactShare = positionDampen / bodyA.totalContacts;
            bodyA.positionImpulse.x += normal.x * positionImpulse * contactShare;
            bodyA.positionImpulse.y += normal.y * positionImpulse * contactShare;
        }

        if (!(BTreatStatic || bodyB.isSleeping)) {
            contactShare = positionDampen / bodyB.totalContacts;
            bodyB.positionImpulse.x -= normal.x * positionImpulse * contactShare;
            bodyB.positionImpulse.y -= normal.y * positionImpulse * contactShare;
        }
    }
};