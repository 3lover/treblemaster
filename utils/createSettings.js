let util = require("./util.js");
let Math2 = require("./Math2.js");
let clone = require("clone");
  let wallDataList = [
    {value: ["name"], type: 2, min: 0, max: 32, minround: 1},
    {value: ["spawnChance"], type: 0, min: 0, max: 1000000, minround: 1},
    {value: ["castShadow"], type: 4},
    {value: ["restitution"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["roughness"], type: 1, min: 0, max: 180, minround: 0.01},
    {value: ["tankDamage"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["bounceDamage"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["opacity"], type: 1, min: 0, max: 100, minround: 0.01},
    {value: ["hasHitbox"], type: 4},
    {value: ["removeOnCollide"], type: 4},
    {value: ["opacityOnCollide"], type: 1, min: 0, max: 100, minround: 0.01},
    {value: ["opacityFadeTime"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["mass"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["thickness"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["color"], type: 3},
    {value: ["ignoreIds"], type: 0, min: 0, max: 4294967295, minround: 1},
    {value: ["dieToIds"], type: 0, min: 0, max: 4294967295, minround: 1},
    {value: ["killWithIds"], type: 0, min: 0, max: 4294967295, minround: 1},
    {value: ["spawnLocation"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["id"], type: 0, min: 0, max: 4294967295, minround: 1},
  ];
  let lightDataList = [
    {value: ["name"], type: 2, min: 0, max: 32, minround: 1},
    {value: ["bubble"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["visibility"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["opacity"], type: 1, min: 0, max: 100, minround: 0.01},
    {value: ["startAngle"], type: 1, min: 0, max: 360, minround: 0.01},
    {value: ["endAngle"], type: 1, min: 0, max: 360, minround: 0.01},
    {value: ["positionx"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["positiony"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["visibleWhenLightsOut"], type: 4},
    {value: ["visibleWhenLightsOn"], type: 4},
    {value: ["ignoreWalls"], type: 4},
    {value: ["onlyWithPowerupId"], type: 0, min: -1, max: 4294967295, minround: 1},
  ];
  let powerupDataList = [
    // metadata
    {value: ["name"], type: 2, min: 0, max: 32, minround: 1},
    {value: ["id"], type: 0, min: 0, max: 4294967295, minround: 1},
    {value: ["attachments"], type: 5},
    {value: ["appearance"], type: 5},
    {value: ["bubbleShape"], type: 5},
    {value: ["wallIds"], type: 0, min: 0, max: 4294967295, minround: 1},
    
    //spawning
    {value: ["spawning", "allowSpawning"], type: 4},
    {value: ["spawning", "spawnPriority"], type: 0, min: 0, max: 1000000, minround: 1},
    {value: ["spawning", "fakeSpawnProbability"], type: 0, min: 0, max: 100, minround: 0.01},
    {value: ["spawning", "maxSpawns"], type: 1, min: 0, max: 1000000, minround: 1},
    {value: ["spawning", "removeOnTimer"], type: 4},
    {value: ["spawning", "removalTimer"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["spawning", "spawnEquipped"], type: 4},
    {value: ["spawning", "spawnEquippedChance"], type: 0, min: 0, max: 100, minround: 0.01},
    {value: ["spawning", "spawnEquippedPriority"], type: 0, min: 0, max: 1000000, minround: 1},
    {value: ["spawning", "bubbleSize"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["spawning", "treatAsDefault"], type: 4},
    
    // firing
    {value: ["firing", "shotReloadTime"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["firing", "roundReloadTime"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["firing", "shotsPerRound"], type: 1, min: 1, max: 1000000, minround: 1},
    {value: ["firing", "roundsPerWeapon"], type: 1, min: 1, max: 1000000, minround: 1},
    {value: ["firing", "quantity"], type: 1, min: 0, max: 1000, minround: 1},
    {value: ["firing", "countPerBullet"], type: 4},
    {value: ["firing", "directionAdditive"], type: 1, min: -180, max: 180, minround: 0.01},
    {value: ["firing", "fireLocation"], type: 1, min: -180, max: 180, minround: 0.01},
    {value: ["firing", "addLocationToDirection"], type: 4},
    {value: ["firing", "totalRecoil"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["firing", "prefireAnimationLock"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["firing", "postfireAnimationLock"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["firing", "firingDistanceFromCenter"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["firing", "removeAfterEvent"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["firing", "removeAfterTimer"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["firing", "precomputeRoundAttributes"], type: 4},
    {value: ["firing", "precomputeShotAttributes"], type: 4},
    {value: ["firing", "reloadWhenUnequipped"], type: 4},
    {value: ["firing", "removeOnLastRound"], type: 4},
    {value: ["firing", "fireOnPickup"], type: 4},
    
    // base attributes
    {value: ["baseAttributes", "speed"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["baseAttributes", "overrideBase"], type: 4},
    {value: ["baseAttributes", "angularSpeed"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["baseAttributes", "lockBulletAngle"], type: 4},
    {value: ["baseAttributes", "size"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["baseAttributes", "opacity"], type: 1, min: 0, max: 100, minround: 0.01},
    {value: ["baseAttributes", "copyTankOpacity"], type: 4},
    {value: ["baseAttributes", "restitution"], type: 1, min: 0, max: 100, minround: 0.01},
    {value: ["baseAttributes", "roughness"], type: 1, min: 0, max: 180, minround: 0.01},
    {value: ["baseAttributes", "health"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["baseAttributes", "damageResist"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["baseAttributes", "friendlyFireType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["baseAttributes", "range"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["baseAttributes", "mass"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["baseAttributes", "castShadow"], type: 4},
    
    // adjustments
    {value: ["adjustments", "rotation", "enabled"], type: 4},
    {value: ["adjustments", "rotation", "changePer", "second"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["adjustments", "rotation", "changePer", "bounce"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["adjustments", "rotation", "changePer", "collision"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["adjustments", "rotation", "applyToAngular"], type: 4},
    {value: ["adjustments", "rotation", "duration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["adjustments", "rotation", "effectDelay"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["adjustments", "rotation", "lockPerBullet"], type: 4},
    
    {value: ["adjustments", "acceleration", "enabled"], type: 4},
    {value: ["adjustments", "acceleration", "changePer", "secondAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["adjustments", "acceleration", "changePer", "bounceAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["adjustments", "acceleration", "changePer", "collisionAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["adjustments", "acceleration", "changePer", "secondMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "acceleration", "changePer", "bounceMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "acceleration", "changePer", "collisionMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "acceleration", "minSpeed"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "acceleration", "maxSpeed"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "acceleration", "duration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["adjustments", "acceleration", "effectDelay"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["adjustments", "acceleration", "lockPerBullet"], type: 4},
    
    {value: ["adjustments", "targeting", "enabled"], type: 4},
    {value: ["adjustments", "targeting", "adjustmentInterval"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["adjustments", "targeting", "adjustmentLerp"], type: 1, min: 0, max: 100, minround: 0.01},
    {value: ["adjustments", "targeting", "adjustmentInaccuracy"], type: 1, min: -360, max: 360, minround: 0.01},
    {value: ["adjustments", "targeting", "effectDelay"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["adjustments", "targeting", "duration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["adjustments", "targeting", "allowTargetingSame"], type: 4},
    {value: ["adjustments", "targeting", "allowTargetingTeam"], type: 4},
    {value: ["adjustments", "targeting", "targetBullets"], type: 4},
    {value: ["adjustments", "targeting", "processType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["adjustments", "targeting", "lockPerBullet"], type: 4},
    
    {value: ["adjustments", "sizeChange", "enabled"], type: 4},
    {value: ["adjustments", "sizeChange", "changePer", "secondAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["adjustments", "sizeChange", "changePer", "bounceAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["adjustments", "sizeChange", "changePer", "collisionAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["adjustments", "sizeChange", "changePer", "secondMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "sizeChange", "changePer", "bounceMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "sizeChange", "changePer", "collisionMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "sizeChange", "minSize"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "sizeChange", "maxSize"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "sizeChange", "duration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["adjustments", "sizeChange", "effectDelay"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["adjustments", "sizeChange", "lockPerBullet"], type: 4},
    
    {value: ["adjustments", "rangeCut", "enabled"], type: 4},
    {value: ["adjustments", "rangeCut", "changePer", "secondAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["adjustments", "rangeCut", "changePer", "bounceAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["adjustments", "rangeCut", "changePer", "collisionAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["adjustments", "rangeCut", "changePer", "secondMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "rangeCut", "changePer", "bounceMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "rangeCut", "changePer", "collisionMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "rangeCut", "maxRange"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["adjustments", "rangeCut", "duration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["adjustments", "rangeCut", "effectDelay"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["adjustments", "rangeCut", "lockPerBullet"], type: 4},
    
    {value: ["adjustments", "opacityChange", "enabled"], type: 4},
    {value: ["adjustments", "opacityChange", "changePer", "secondAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["adjustments", "opacityChange", "changePer", "bounceAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["adjustments", "opacityChange", "changePer", "collisionAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["adjustments", "opacityChange", "changePer", "secondMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "opacityChange", "changePer", "bounceMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "opacityChange", "changePer", "collisionMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["adjustments", "opacityChange", "minVisibility"], type: 1, min: 0, max: 100, minround: 0.01},
    {value: ["adjustments", "opacityChange", "maxVisibility"], type: 1, min: 0, max: 100, minround: 0.01},
    {value: ["adjustments", "opacityChange", "duration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["adjustments", "opacityChange", "effectDelay"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["adjustments", "opacityChange", "lockPerBullet"], type: 4},
    
    // health
    
    {value: ["health", "healthChange", "enabled"], type: 4},
    {value: ["health", "healthChange", "changePer", "secondAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["health", "healthChange", "changePer", "bounceAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["health", "healthChange", "changePer", "collisionAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["health", "healthChange", "changePer", "secondMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["health", "healthChange", "changePer", "bounceMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["health", "healthChange", "changePer", "collisionMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["health", "healthChange", "maxHealth"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["health", "healthChange", "duration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["health", "healthChange", "effectDelay"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["health", "healthChange", "lockPerBullet"], type: 4},
    
    {value: ["health", "damageResistChange", "enabled"], type: 4},
    {value: ["health", "damageResistChange", "changePer", "secondAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["health", "damageResistChange", "changePer", "bounceAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["health", "damageResistChange", "changePer", "collisionAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["health", "damageResistChange", "changePer", "secondMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["health", "damageResistChange", "changePer", "bounceMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["health", "damageResistChange", "changePer", "collisionMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["health", "damageResistChange", "minResist"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["health", "damageResistChange", "maxResist"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["health", "damageResistChange", "duration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["health", "damageResistChange", "effectDelay"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["health", "damageResistChange", "lockPerBullet"], type: 4},
    
    // interactions
    {value: ["interactions", "tankInteractions"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["interactions", "bulletInteractions"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["interactions", "sameTeamBulletInteractions"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["interactions", "bulletInteractionPriority"], type: 0, min: 0, max: 1000000, minround: 1},
    {value: ["interactions", "wallInteractions"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["interactions", "destroyWalls"], type: 4},
    
    {value: ["interactions", "destroyOnHitting", "walls"], type: 4},
    {value: ["interactions", "destroyOnHitting", "maxWallCollisions"], type: 1, min: 0, max: 1000000, minround: 1},
    {value: ["interactions", "destroyOnHitting", "tanks"], type: 4},
    {value: ["interactions", "destroyOnHitting", "maxTankCollisions"], type: 1, min: 0, max: 1000000, minround: 1},
    {value: ["interactions", "destroyOnHitting", "bullets"], type: 4},
    {value: ["interactions", "destroyOnHitting", "maxBulletCollisions"], type: 1, min: 0, max: 1000000, minround: 1},
    
    {value: ["interactions", "maxCollisionPerTank"], type: 1, min: 0, max: 1000000, minround: 1},
    {value: ["interactions", "oneCollisionDamage"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["interactions", "isLandmine"], type: 4},
    
    {value: ["interactions", "freeze", "freezesTanks"], type: 4},
    {value: ["interactions", "freeze", "freezesBullets"], type: 4},
    {value: ["interactions", "freeze", "initialFreezeSpeedMultiplier"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["interactions", "freeze", "finalFreezeSpeedMultiplier"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["interactions", "freeze", "transitionTime"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["interactions", "freeze", "stacks"], type: 4},
    {value: ["interactions", "freeze", "conditionPriority"], type: 0, min: 0, max: 1000000, minround: 1},
    {value: ["interactions", "freeze", "overrideBorderColor"], type: 4},
    {value: ["interactions", "freeze", "borderColor"], type: 3},
    
    {value: ["interactions", "poison", "poisonsTanks"], type: 4},
    {value: ["interactions", "poison", "poisonsBullets"], type: 4},
    {value: ["interactions", "poison", "poisonDamageIntervals"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["interactions", "poison", "poisonDuration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["interactions", "poison", "totalRawDamage"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["interactions", "poison", "totalPercentageDamage"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["interactions", "poison", "allowPoisonKill"], type: 4},
    {value: ["interactions", "poison", "minPoisonHealth"], type: 0, min: 0, max: 100, minround: 0.01},
    {value: ["interactions", "poison", "stacks"], type: 4},
    {value: ["interactions", "poison", "conditionPriority"], type: 0, min: 0, max: 1000000, minround: 1},
    {value: ["interactions", "poison", "overrideBorderColor"], type: 4},
    {value: ["interactions", "poison", "borderColor"], type: 3},
    {value: ["interactions", "poison", "showDamageFrames"], type: 4},
    
    {value: ["interactions", "physicallyCollideWithTanks"], type: 4},
    {value: ["interactions", "dealNoDamage"], type: 4},
    {value: ["interactions", "borderBehavior"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["interactions", "constantCollide"], type: 4},
    
    //lights
    {value: ["light", "createLightBubble"], type: 4},
    {value: ["light", "visibilityType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["light", "bubbleSize"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["light", "bubbleSizeChange", "enabled"], type: 4},
    {value: ["light", "bubbleSizeChange", "changePer", "secondAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["light", "bubbleSizeChange", "changePer", "bounceAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["light", "bubbleSizeChange", "changePer", "collisionAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["light", "bubbleSizeChange", "changePer", "secondMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["light", "bubbleSizeChange", "changePer", "bounceMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["light", "bubbleSizeChange", "changePer", "collisionMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["light", "bubbleSizeChange", "minSize"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["light", "bubbleSizeChange", "maxSize"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["light", "bubbleSizeChange", "duration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["light", "bubbleSizeChange", "effectDelay"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["light", "bubbleSizeChange", "lockPerBullet"], type: 4},
    
    {value: ["light", "bubbleOpacity"], type: 1, min: 0, max: 100, minround: 0.01},
    {value: ["light", "bubbleOpacityChange", "enabled"], type: 4},
    {value: ["light", "bubbleOpacityChange", "changePer", "secondAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["light", "bubbleOpacityChange", "changePer", "bounceAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["light", "bubbleOpacityChange", "changePer", "collisionAdd"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["light", "bubbleOpacityChange", "changePer", "secondMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["light", "bubbleOpacityChange", "changePer", "bounceMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["light", "bubbleOpacityChange", "changePer", "collisionMult"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["light", "bubbleOpacityChange", "minOpacity"], type: 1, min: 0, max: 100, minround: 0.01},
    {value: ["light", "bubbleOpacityChange", "maxOpacity"], type: 1, min: 0, max: 100, minround: 0.01},
    {value: ["light", "bubbleOpacityChange", "duration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["light", "bubbleOpacityChange", "effectDelay"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["light", "bubbleOpacityChange", "lockPerBullet"], type: 4},
    
    {value: ["light", "beamDegree", "startAngle"], type: 1, min: 0, max: 360, minround: 0.01},
    {value: ["light", "beamDegree", "endAngle"], type: 1, min: 0, max: 360, minround: 0.01},
    {value: ["light", "pierceWalls"], type: 4},
    {value: ["light", "useAsConcealer"], type: 4},
    {value: ["light", "concealerColor"], type: 3},
    {value: ["light", "renderOverShadows"], type: 4},
    {value: ["light", "friendlyOpacity"], type: 0, min: 0, max: 100, minround: 0.01},
    
    // particles
    {value: ["particles", "fragEvents", "destruction"], type: 4},
    {value: ["particles", "fragEvents", "selfDestruct"], type: 4},
    {value: ["particles", "fragEvents", "rangeDeath"], type: 4},
    
    {value: ["particles", "fragFireBulletId"], type: 0, min: -1, max: 4294967295, minround: 1},
    
    {value: ["particles", "passiveRelease", "enabled"], type: 4},
    {value: ["particles", "passiveRelease", "timer"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["particles", "passiveRelease", "lockTimer"], type: 4},
    {value: ["particles", "passiveRelease", "delay"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["particles", "passiveRelease", "duration"], type: 1, min: 0, max: 600, minround: 0.01},
    
    {value: ["particles", "passiveReleaseBulletId"], type: 0, min: -1, max: 4294967295, minround: 1},
    {value: ["particles", "enableBounceRelease"], type: 4},
    {value: ["particles", "maxReleasedBullets"], type: 1, min: 0, max: 1000000, minround: 1},
    
    // multifire
    {value: ["multifire", "multifiredWeaponId"], type: 0, min: -1, max: 4294967295, minround: 1},
    {value: ["multifire", "syncronizeFire"], type: 4},
    {value: ["multifire", "overrideMultifiredReload"], type: 4},
    
    // parent effects
    {value: ["parentEffects", "disableBullets"], type: 4},
    {value: ["parentEffects", "applyEffectsOnCollect"], type: 4},
    {value: ["parentEffects", "applyEffectsOnHit"], type: 4},
    
    {value: ["parentEffects", "playerOpacity", "enabled"], type: 4},
    {value: ["parentEffects", "playerOpacity", "start"], type: 1, min: 0, max: 100, minround: 0.01},
    {value: ["parentEffects", "playerOpacity", "end"], type: 1, min: 0, max: 100, minround: 0.01},
    {value: ["parentEffects", "playerOpacity", "duration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["parentEffects", "playerOpacity", "lerp"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["parentEffects", "playerOpacity", "processType"], type: 0, min: 0, max: 10, minround: 1},
    
    {value: ["parentEffects", "playerSpeed", "enabled"], type: 4},
    {value: ["parentEffects", "playerSpeed", "start"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["parentEffects", "playerSpeed", "end"], type: 1, min: -1000000, max: 1000000, minround: 0.01},
    {value: ["parentEffects", "playerSpeed", "duration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["parentEffects", "playerSpeed", "lerp"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["parentEffects", "playerSpeed", "processType"], type: 0, min: 0, max: 10, minround: 1},
    
    {value: ["parentEffects", "playerVision", "enabled"], type: 4},
    {value: ["parentEffects", "playerVision", "start"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["parentEffects", "playerVision", "end"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["parentEffects", "playerVision", "duration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["parentEffects", "playerVision", "lerp"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["parentEffects", "playerVision", "processType"], type: 0, min: 0, max: 10, minround: 1},
    
    {value: ["parentEffects", "playerBubble", "enabled"], type: 4},
    {value: ["parentEffects", "playerBubble", "start"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["parentEffects", "playerBubble", "end"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["parentEffects", "playerBubble", "duration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["parentEffects", "playerBubble", "lerp"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["parentEffects", "playerBubble", "processType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["parentEffects", "playerBubble", "changedWallPierce"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["parentEffects", "playerBubble", "changedVisibilityType"], type: 0, min: 0, max: 10, minround: 1},
    
    {value: ["parentEffects", "playerHealth", "enabled"], type: 4},
    {value: ["parentEffects", "playerHealth", "added"], type: 1, min: 0, max: 1000000, minround: 0.01},
    
    {value: ["parentEffects", "playerShield", "enabled"], type: 4},
    {value: ["parentEffects", "playerShield", "deflectsAttacks"], type: 4},
    {value: ["parentEffects", "playerShield", "maxHits"], type: 1, min: 0, max: 1000000, minround: 1},
    {value: ["parentEffects", "playerShield", "maxDefense"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["parentEffects", "playerShield", "maxDuration"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["parentEffects", "playerShield", "shieldResistance"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["parentEffects", "playerShield", "stacks"], type: 4},
    {value: ["parentEffects", "playerShield", "conditionPriority"], type: 0, min: 0, max: 1000000, minround: 1},
    {value: ["parentEffects", "playerShield", "shieldColor"], type: 3},
    {value: ["parentEffects", "playerShield", "shieldOpacity"], type: 0, min: 0, max: 100, minround: 0.01},
    {value: ["parentEffects", "playerShield", "shieldRadius"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["parentEffects", "playerShield", "damageOverflowsToPlayer"], type: 4},
    
    // inheriting
    {value: ["inheriting", "onPickupPowerupId"], type: 0, min: -1, max: 4294967295, minround: 1},
    {value: ["inheriting", "onFirePowerupId"], type: 0, min: -1, max: 4294967295, minround: 1},
    {value: ["inheriting", "onRemovalPowerupId"], type: 0, min: -1, max: 4294967295, minround: 1},
    {value: ["inheriting", "equipType"], type: 0, min: 0, max: 10, minround: 1},
    
    // miscellanious
    {value: ["misc", "selfDestruct"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["misc", "seeInvisibleType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["misc", "createTrails"], type: 4},
    {value: ["misc", "trailLength"], type: 0, min: 0, max: 600, minround: 0.01},
    {value: ["misc", "trailInterval"], type: 0, min: 0, max: 600, minround: 0.01},
    {value: ["misc", "trailSize"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["misc", "trailFading"], type: 4},
    {value: ["misc", "overrideTrailColor"], type: 4},
    {value: ["misc", "trailColor"], type: 3},
    {value: ["misc", "attachPlayerCamera"], type: 4},
    {value: ["misc", "stealPlayerControls"], type: 4},
    {value: ["misc", "allowMultiControl"], type: 4},
    {value: ["misc", "forceMotion"], type: 4},
    {value: ["misc", "bounceOnWalls"], type: 4},
    {value: ["misc", "rotationSpeed"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["misc", "allowUnequip"], type: 4},
    {value: ["misc", "deleteOnUnequip"], type: 4},
    {value: ["misc", "retainAfterDeath"], type: 4},
    {value: ["misc", "showHealthBar"], type: 4},
    {value: ["misc", "minOpacity"], type: 0, min: 0, max: 100, minround: 0.01},
    {value: ["misc", "safeFade"], type: 0, min: 0, max: 100, minround: 0.01},
    {value: ["misc", "forceEquip"], type: 4},
    {value: ["misc", "forceEquipPriority"], type: 0, min: 0, max: 1000000, minround: 1},
    {value: ["misc", "dieOnTankDeath"], type: 4},
  ];
  let basicDataList = [
    // metadata
    {value: ["metadata", "name"], type: 2, min: 0, max: 32, minround: 1},
    {value: ["metadata", "hosted"], type: 4},
    {value: ["metadata", "owned"], type: 4},
    {value: ["metadata", "loadoutId"], type: 0, min: -1, max: 4294967295, minround: 1},
    
    // powerups
    {value: ["powerupSettings", "powerupSpawnTimer"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["powerupSettings", "maxPowerups"], type: 1, min: 0, max: 1000, minround: 1},
    
    // personal
    {value: ["personal", "tankColor"], type: 3},
    {value: ["personal", "tankName"], type: 2, min: 0, max: 16, minround: 1},
    
    {value: ["personal", "tankMass", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "tankMass", "minBound"], type: 0, min: 0.01, max: 1000000, minround: 0.01},
    {value: ["personal", "tankMass", "maxBound"], type: 0, min: 0.01, max: 1000000, minround: 0.01},
    {value: ["personal", "tankMass", "value"], type: 1, min: 0.01, max: 1000000, minround: 0.01},
    
    {value: ["personal", "tankSpeed", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "tankSpeed", "minBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "tankSpeed", "maxBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "tankSpeed", "value"], type: 1, min: 0, max: 1000000, minround: 0.01},
    
    {value: ["personal", "tankAccelerationTime", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "tankAccelerationTime", "minBound"], type: 0, min: 0, max: 600, minround: 0.01},
    {value: ["personal", "tankAccelerationTime", "maxBound"], type: 0, min: 0, max: 600, minround: 0.01},
    {value: ["personal", "tankAccelerationTime", "value"], type: 1, min: 0, max: 600, minround: 0.01},
  
    {value: ["personal", "tankVelocityDampening", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "tankVelocityDampening", "minBound"], type: 0, min: 0, max: 100, minround: 0.01},
    {value: ["personal", "tankVelocityDampening", "maxBound"], type: 0, min: 0, max: 100, minround: 0.01},
    {value: ["personal", "tankVelocityDampening", "value"], type: 1, min: 0, max: 100, minround: 0.01},
    
    {value: ["personal", "tankRotationSpeed", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "tankRotationSpeed", "minBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "tankRotationSpeed", "maxBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "tankRotationSpeed", "value"], type: 1, min: 0, max: 1000000, minround: 0.01},
        
    {value: ["personal", "tankSize", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "tankSize", "minBound"], type: 0, min: 0.01, max: 1000000, minround: 0.01},
    {value: ["personal", "tankSize", "maxBound"], type: 0, min: 0.01, max: 1000000, minround: 0.01},
    {value: ["personal", "tankSize", "value"], type: 1, min: 0.01, max: 1000000, minround: 0.01},
    
    {value: ["personal", "tankOpacity", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "tankOpacity", "minBound"], type: 0, min: 0, max: 100, minround: 0.01},
    {value: ["personal", "tankOpacity", "maxBound"], type: 0, min: 0, max: 100, minround: 0.01},
    {value: ["personal", "tankOpacity", "value"], type: 1, min: 0, max: 100, minround: 0.01},
      
    {value: ["personal", "tankRegenDelay", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "tankRegenDelay", "minBound"], type: 0, min: 0, max: 600, minround: 0.01},
    {value: ["personal", "tankRegenDelay", "maxBound"], type: 0, min: 0, max: 600, minround: 0.01},
    {value: ["personal", "tankRegenDelay", "value"], type: 1, min: 0, max: 600, minround: 0.01},
      
    {value: ["personal", "tankRegenRaw", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "tankRegenRaw", "minBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "tankRegenRaw", "maxBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "tankRegenRaw", "value"], type: 1, min: 0, max: 1000000, minround: 0.01},
  
    {value: ["personal", "tankRegenPercentage", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "tankRegenPercentage", "minBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "tankRegenPercentage", "maxBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "tankRegenPercentage", "value"], type: 1, min: 0, max: 1000000, minround: 0.01},
      
    {value: ["personal", "tankHealth", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "tankHealth", "minBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "tankHealth", "maxBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "tankHealth", "value"], type: 1, min: 0, max: 1000000, minround: 1},
    
    {value: ["personal", "tankResistance", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "tankResistance", "minBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "tankResistance", "maxBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "tankResistance", "value"], type: 1, min: 0, max: 1000000, minround: 1},
      
    {value: ["personal", "extraLives", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "extraLives", "minBound"], type: 0, min: 0, max: 100, minround: 1},
    {value: ["personal", "extraLives", "maxBound"], type: 0, min: 0, max: 100, minround: 1},
    {value: ["personal", "extraLives", "value"], type: 1, min: 0, max: 100, minround: 1},
      
    {value: ["personal", "showHealthBar", "constrainType"], type: 0, min: 3, max: 10, minround: 1},
    {value: ["personal", "showHealthBar", "value"], type: 4},
    
    {value: ["personal", "maxHeldPowerups", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "maxHeldPowerups", "minBound"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "maxHeldPowerups", "maxBound"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "maxHeldPowerups", "value"], type: 1, min: 0, max: 10, minround: 1},
  
    {value: ["personal", "powerupEquipType", "constrainType"], type: 0, min: 3, max: 10, minround: 1},
    {value: ["personal", "powerupEquipType", "value"], type: 0, min: 0, max: 10, minround: 1},
    
    {value: ["personal", "cameraOpacity", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "cameraOpacity", "minBound"], type: 0, min: 0, max: 100, minround: 0.01},
    {value: ["personal", "cameraOpacity", "maxBound"], type: 0, min: 0, max: 100, minround: 0.01},
    {value: ["personal", "cameraOpacity", "value"], type: 1, min: 0, max: 100, minround: 0.01},
    
    {value: ["personal", "cameraVision", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "cameraVision", "minBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "cameraVision", "maxBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "cameraVision", "value"], type: 1, min: 0, max: 1000000, minround: 0.01},
    
    {value: ["personal", "cameraBubble", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "cameraBubble", "minBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "cameraBubble", "maxBound"], type: 0, min: 0, max: 1000000, minround: 0.01},
    {value: ["personal", "cameraBubble", "value"], type: 1, min: 0, max: 1000000, minround: 0.01},
    
    {value: ["personal", "lockCameraToCenter", "constrainType"], type: 0, min: 3, max: 10, minround: 1},
    {value: ["personal", "lockCameraToCenter", "value"], type: 4},
    
    {value: ["personal", "cameraBubbleAngleStart", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "cameraBubbleAngleStart", "minBound"], type: 0, min: 0, max: 360, minround: 0.01},
    {value: ["personal", "cameraBubbleAngleStart", "maxBound"], type: 0, min: 0, max: 360, minround: 0.01},
    {value: ["personal", "cameraBubbleAngleStart", "value"], type: 1, min: 0, max: 360, minround: 0.01},
    
    {value: ["personal", "cameraBubbleAngleEnd", "constrainType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["personal", "cameraBubbleAngleEnd", "minBound"], type: 0, min: 0, max: 360, minround: 0.01},
    {value: ["personal", "cameraBubbleAngleEnd", "maxBound"], type: 0, min: 0, max: 360, minround: 0.01},
    {value: ["personal", "cameraBubbleAngleEnd", "value"], type: 1, min: 0, max: 360, minround: 0.01},
    
    {value: ["personal", "cameraVisibility", "constrainType"], type: 0, min: 3, max: 10, minround: 1},
    {value: ["personal", "cameraVisibility", "value"], type: 0, min: 0, max: 10, minround: 1},
    
    {value: ["personal", "cameraIgnoreWalls", "constrainType"], type: 0, min: 3, max: 10, minround: 1},
    {value: ["personal", "cameraIgnoreWalls", "value"], type: 4},
    
    {value: ["personal", "constrainLights"], type: 4},
    
    // gamemode
    {value: ["gamemode", "mode"], type: 0, min: 0, max: 10, minround: 1},
    
    {value: ["gamemode", "standard", "reviveTimer"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["gamemode", "standard", "surviveTimer"], type: 1, min: 0, max: 600, minround: 0.01},
    
    {value: ["gamemode", "arena", "reviveTimer"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["gamemode", "arena", "roundTimer"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["gamemode", "arena", "killPoints"], type: 1, min: -100, max: 100, minround: 1},
    {value: ["gamemode", "arena", "deathLostPoints"], type: 1, min: -100, max: 100, minround: 1},
    {value: ["gamemode", "arena", "friendlyFireLostPoints"], type: 1, min: -100, max: 100, minround: 1},
    {value: ["gamemode", "arena", "drawHandling"], type: 0, min: 0, max: 10, minround: 1},
    
    {value: ["gamemode", "tag", "maxTags"], type: 1, min: 0, max: 100, minround: 1},
    {value: ["gamemode", "tag", "weaponChangeWithPlayer"], type: 4},
    {value: ["gamemode", "tag", "teleportOnTag"], type: 4},
    {value: ["gamemode", "tag", "teleportWhenUsingExtraLife"], type: 4},
    {value: ["gamemode", "tag", "friendlyFireDeathHandling"], type: 0, min: 0, max: 10, minround: 1},
    
    {value: ["gamemode", "monarch", "overrideMonarchExtraLives"], type: 4},
    {value: ["gamemode", "monarch", "monarchExtraLives"], type: 1, min: 0, max: 100, minround: 1},
    {value: ["gamemode", "monarch", "reviveTimer"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["gamemode", "monarch", "surviveTimer"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["gamemode", "monarch", "kingVisibility"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["gamemode", "monarch", "spawnRadius"], type: 1, min: 0, max: 1000000, minround: 0.01},
    {value: ["gamemode", "monarch", "changeMonarchBorders"], type: 4},
    
    {value: ["gamemode", "kingOfTheHill", "countdownTimer"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["gamemode", "kingOfTheHill", "firstCrownAssignment"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["gamemode", "kingOfTheHill", "shuffleOnSteal"], type: 4},
    {value: ["gamemode", "kingOfTheHill", "oldBearerDies"], type: 4},
    {value: ["gamemode", "kingOfTheHill", "crownOwnedByTeam"], type: 4},    
    {value: ["gamemode", "kingOfTheHill", "arrowToCrown"], type: 4},    
    
    {value: ["gamemode", "teams", "teamAssignmentMethod"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["gamemode", "teams", "spreadMethodNumberOfTeams"], type: 1, min: 0, max: 100, minround: 1},
    {value: ["gamemode", "teams", "spreadType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["gamemode", "teams", "fillMethodMaxTanksPerTeam"], type: 1, min: 0, max: 100, minround: 1},
    {value: ["gamemode", "teams", "overrideTeamColor"], type: 4},
    
    {value: ["gamemode", "maxPlayers"], type: 0, min: 1, max: 100, minround: 1},
    {value: ["gamemode", "gamesInARow"], type: 0, min: 1, max: 100, minround: 1},
    {value: ["gamemode", "roundEndTimer"], type: 1, min: 0, max: 600, minround: 0.01},
    {value: ["gamemode", "roundStartTimer"], type: 1, min: 0, max: 600, minround: 0.01},
    
    // general
    {value: ["general", "tankCollisionType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["general", "tankTextVisibility"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["general", "visibleGhostType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["general", "ghostSpectateType"], type: 0, min: 0, max: 10, minround: 1},
    
    // maze
    {value: ["maze", "enableMaze"], type: 4},
    {value: ["maze", "tileSize"], type: 1, min: 1, max: 1000000, minround: 0.01},
    {value: ["maze", "tileDimensions", "x"], type: 1, min: 1, max: 50, minround: 1},
    {value: ["maze", "tileDimensions", "y"], type: 1, min: 1, max: 50, minround: 1},
    {value: ["maze", "closedPercentage"], type: 1, min: 0, max: 100, minround: 0.01},
    {value: ["maze", "wallsRemovedPercentage"], type: 1, min: 0, max: 100, minround: 0.01},
    {value: ["maze", "hallwayLength"], type: 1, min: 1, max: 100, minround: 1},
    {value: ["maze", "wallWidth"], type: 1, min: 0.01, max: 100, minround: 0.01},
    {value: ["maze", "customChance"], type: 0, min: 0, max: 100, minround: 0.01},
    
    {value: ["customMazes"], type: 5},
    
    // waiting room
    {value: ["waitingRoom", "size", "width"], type: 1, min: 1, max: 50, minround: 1},
    {value: ["waitingRoom", "size", "height"], type: 1, min: 1, max: 50, minround: 1},
    {value: ["waitingRoom", "spawnMaze"], type: 4},
    {value: ["waitingRoom", "spawnBoxes"], type: 4},
    {value: ["waitingRoom", "lobbyDeathHandlingType"], type: 0, min: 0, max: 10, minround: 1},
    {value: ["waitingRoom", "ghostReviveTime"], type: 1, min: 0, max: 600, minround: 0.01},
];

exports.processSettingsArrayBuffer = (reader, extraTypes = []) => {
  let separateDecode = util.decodePacket(reader, extraTypes);
  let offset = 0;
  
  let SS = require("./defaultSettings.js").defaults;
  // first go through the settings we can see directly, and that don't have the option to appear and arbitrary amount of times
  let dataTypes = ["int8"];
  function getTypes(type) {
    switch (type) {
      case 0: {
        dataTypes.push("float32");
        break;
      }
      case 1: {
        for (let i = 0; i < 5; i++) dataTypes.push("float32");
        break;
      }
      case 2: {
        dataTypes.push("string");
        break;
      }
      case 3: {
        dataTypes.push("int8");
        break;
      }
      case 4: {
        dataTypes.push("int8");
        break;
      }
      case 5: {
        dataTypes.push("float32arrayarray");
        break;
      }
    }
  }
  for (let d of basicDataList) getTypes(d.type);
  // powerup data
  dataTypes.push("repeat");
   for (let d of powerupDataList) getTypes(d.type);
  dataTypes.push("end");
  // light data
  dataTypes.push("repeat");
   for (let d of lightDataList) getTypes(d.type);
  dataTypes.push("end");
  // wall data
  dataTypes.push("repeat");
   for (let d of wallDataList) getTypes(d.type);
  dataTypes.push("end");
  
  function getTypedData(d, off, usedValue, data) {
    switch (d.type) {
        // number
      case 0: {
        usedValue[d.value[d.value.length - 1]] = Math2.clamp(data[off], d.min, d.max, d.minround);
        off++;
        break;
      }
        // ISS
      case 1: {
        let placeholder = [];
        // min
        placeholder.push(Math2.clamp(data[off], d.min, d.max, d.minround));
        off++;
        // max
        placeholder.push(Math2.clamp(data[off], d.min, d.max, d.minround));
        off++;
        // type
        placeholder.push(Math2.clamp(data[off], 0, 1, 1));
        off++;
        // degree
        placeholder.push(Math2.clamp(data[off], -1000, 1000, 0.01));
        off++;
        // round
        placeholder.push(Math2.clamp(data[off], 0.000001, 1000000, 0.000001));
        off++;
        
        usedValue[d.value[d.value.length - 1]] = placeholder;
        break;
      }
        // string
      case 2: {
        usedValue[d.value[d.value.length - 1]] = data[off].substring(0, d.max);
        off++;
        break;
      }
        // color
      case 3: {
        usedValue[d.value[d.value.length - 1]] = Math2.clamp(data[off], -1, 57, 1);
        off++;
        break;
      }
        // boolean
      case 4: {
        usedValue[d.value[d.value.length - 1]] = !!data[off];
        off++;
        break;
      }
        // attachments
      case 5: {
        usedValue[d.value[d.value.length - 1]] = data[off];
        off++;
      }
    }
    return off;
  }
  
  // now construct our data array
  let data = util.decodePacket(reader, dataTypes, util.getPacketOffset(reader, extraTypes));
  data.splice(0, 1);
  
  for (let d of basicDataList) {
    let usedValue = SS;
    for (let i = 0; i < d.value.length - 1; i++) usedValue = usedValue[d.value[i]];
    offset = getTypedData(d, offset, usedValue, data);
  }
  
  SS.powerups = [];
  let Poffset = 0;
  while (Poffset < data[offset].length) {
    let DP = clone(require("./defaultSettings.js").defaultPowerup, false);
    for (let d of powerupDataList) {
      let usedValue = DP;
      for (let i = 0; i < d.value.length - 1; i++) usedValue = usedValue[d.value[i]];
      Poffset = getTypedData(d, Poffset, usedValue, data[offset]);
    }
    SS.powerups.push(DP);
  }

  offset++;
  
  SS.personal.lights = [];
  let Loffset = 0;
  while (Loffset < data[offset].length) {
    let DL = clone(require("./defaultSettings.js").defaultLight, false);
    for (let d of lightDataList) {
      let usedValue = DL;
      for (let i = 0; i < d.value.length - 1; i++) usedValue = usedValue[d.value[i]];
      Loffset = getTypedData(d, Loffset, usedValue, data[offset]);
    }
    SS.personal.lights.push(DL);
  }
  
  offset++;
  
  SS.wallTypes = [];
  let Woffset = 0;
  while (Woffset < data[offset].length) {
    let DW = clone(require("./defaultSettings.js").defaultWall, false);
    for (let d of wallDataList) {
      let usedValue = DW;
      for (let i = 0; i < d.value.length - 1; i++) usedValue = usedValue[d.value[i]];
      Woffset = getTypedData(d, Woffset, usedValue, data[offset]);
    }
    SS.wallTypes.push(DW);
  }
  SS.metadata.owned = false;
  SS.metadata.hosted = true;
  return [SS, separateDecode];
}

exports.createSettingsArrayBuffer = (SS) => {
  // first go through the settings we can see directly, and that don't have the option to appear and arbitrary amount of times
  let dataValues = [14];
  let dataTypes = ["int8"];
  
  function allocateTypes(type) {
    switch (type) {
      case 0: {
        dataTypes.push("float32");
        break;
      }
      case 1: {
        for (let i = 0; i < 5; i++) dataTypes.push("float32");
        break;
      }
      case 2: {
        dataTypes.push("string");
        break;
      }
      case 3: {
        dataTypes.push("int8");
        break;
      }
      case 4: {
        dataTypes.push("int8");
        break;
      }
      case 5: {
        dataTypes.push("float32arrayarray");
      }
    }
  }
  function assignToTypes(d, usedValue) {
    switch (d.type) {
        // number
      case 0: {
        dataValues.push(Math2.clamp(usedValue, d.min, d.max, d.minround));
        break;
      }
        // ISS
      case 1: {
        // min
        dataValues.push(Math2.clamp(usedValue[0], d.min, d.max, d.minround));
        // max
        dataValues.push(Math2.clamp(usedValue[1], d.min, d.max, d.minround));
        // type
        dataValues.push(Math2.clamp(usedValue[2], 0, 1, 1));
        // degree
        dataValues.push(Math2.clamp(usedValue[3], -1000, 1000, 0.01));
        // round
        dataValues.push(Math2.clamp(usedValue[4], 0.000001, 1000000, 0.000001));
        break;
      }
        // string
      case 2: {
        dataValues.push(usedValue.substring(0, d.max));
        break;
      }
        // color
      case 3: {
        dataValues.push(Math2.clamp(usedValue, -1, 57, 1));
        break;
      }
        // boolean
      case 4: {
        dataValues.push(usedValue ? 1 : 0);
        break;
      }
        // attachments
      case 5: {
        dataValues.push(usedValue);
      }
    }
  }
  
  
  for (let d of basicDataList) {
    let usedValue = SS;
    for (let i = 0; i < d.value.length; i++) usedValue = usedValue[d.value[i]];
    allocateTypes(d.type);
    assignToTypes(d, usedValue);
  }
  
  // send powerups
  dataValues.push(SS.powerups.length);
  dataTypes.push("repeat");
  for (let d of powerupDataList) {
    allocateTypes(d.type);
  }
  for (let powerup of SS.powerups) {
    for (let d of powerupDataList) {
      let usedValue = powerup;
      for (let i = 0; i < d.value.length; i++) usedValue = usedValue[d.value[i]];
      assignToTypes(d, usedValue);
    }
  }
  dataValues.push(0);
  dataTypes.push("end");
  
  // send lights
  dataValues.push(SS.personal.lights.length);
  dataTypes.push("repeat");
  for (let d of lightDataList) {
    allocateTypes(d.type);
  }
  for (let light of SS.personal.lights) {
    for (let d of lightDataList) {
      let usedValue = light;
      for (let i = 0; i < d.value.length; i++) usedValue = usedValue[d.value[i]];
      assignToTypes(d, usedValue);
    }
  }
  dataValues.push(0);
  dataTypes.push("end");
  
  // send wall types
  dataValues.push(SS.wallTypes.length);
  dataTypes.push("repeat");
  for (let d of wallDataList) {
    allocateTypes(d.type);
  }
  for (let wall of SS.wallTypes) {
    for (let d of wallDataList) {
      let usedValue = wall;
      for (let i = 0; i < d.value.length; i++) usedValue = usedValue[d.value[i]];
      assignToTypes(d, usedValue);
    }
  }
  dataValues.push(0);
  dataTypes.push("end");
  
  return [dataValues, dataTypes];
}
