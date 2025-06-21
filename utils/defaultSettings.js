exports.defaultPowerup = {
      name: "Default Weapon", //
      id: 0, //
      attachments: [[0, -1, 0, 0.1, 0.1, 0.1, -0.1, -0.1, -0.1, -0.1, 0.1], [-1, -1, 0, 0, 0.04, 0.14, 0.04, 0.14, -0.04, 0, -0.04]], //
      appearance: [[0, -1, 0, 0, 0, 0.1]], //
      bubbleShape: [[0, 7, 0, 0, 0, 0.1]], //
      wallIds: 0, //
      
      spawning: {
        allowSpawning: true, //
        spawnPriority: 100, //
        fakeSpawnProbability: 0, //
        maxSpawns: [0, 0, 0, 1, 1], //
        removeOnTimer: false, //
        removalTimer: [10, 10, 0, 1, 1], //
        spawnEquipped: false, //
        spawnEquippedChance: 100, //
        spawnEquippedPriority: 100, //
        bubbleSize: [100, 100, 0, 1, 1], //
        treatAsDefault: false //
      },
      
      firing: {
        shotReloadTime: [1, 1, 0, 1, 1], //
        roundReloadTime: [1, 1, 0, 1, 1], //
        shotsPerRound: [3, 3, 0, 1, 1], //
        roundsPerWeapon: [1, 1, 0, 1, 1], //
        quantity: [1, 1, 0, 1, 1], //
        countPerBullet: false, //
        directionAdditive: [0, 0, 0, 1, 1], //
        fireLocation: [0, 0, 0, 1, 1], //
        addLocationToDirection: true, //
        totalRecoil: [0, 0, 0, 1, 1], //
        prefireAnimationLock: [0, 0, 0, 1, 1], //
        postfireAnimationLock: [0, 0, 0, 1, 1], //
        firingDistanceFromCenter: [100, 100, 0, 1, 1], //
        removeAfterEvent: 0, //
        removeAfterTimer: [10, 10, 0, 1, 1], //
        precomputeRoundAttributes: false, //
        precomputeShotAttributes: false, //
        reloadWhenUnequipped: false, //
        removeOnLastRound: true, //
        fireOnPickup: false //
      },
      
      baseAttributes: {
        speed: [120, 120, 0, 1, 1], //
        overrideBase: false, //
        angularSpeed: [0, 0, 0, 1, 1], //
        lockBulletAngle: false, //
        size: [30, 30, 0, 1, 1], //
        opacity: [100, 100, 0, 1, 1], //
        copyTankOpacity: true, //
        restitution: [100, 100, 0, 1, 1], //
        roughness: [0, 0, 0, 1, 1], //
        health: [100, 100, 0, 1, 1], //
        damageResist: [0, 0, 0, 1, 1], //
        friendlyFireType: 0, //
        range: [10, 10, 0, 1, 1], //
        mass: [10, 10, 0, 1, 1], //
        castShadow: false //
      },
      
      adjustments: {
        rotation: {
          enabled: false, //
          changePer: {
            second: [0, 0, 0, 1, 1], //
            bounce: [0, 0, 0, 1, 1], //
            collision: [0, 0, 0, 1, 1], //
          },
          applyToAngular: false,
          duration: [0, 0, 0, 1, 1], //
          effectDelay: [0, 0, 0, 1, 1], //
          lockPerBullet: true, //
        },
        acceleration: {
          enabled: false, //
          changePer: {
            secondAdd: [0, 0, 0, 1, 1], //
            bounceAdd: [0, 0, 0, 1, 1], //
            collisionAdd: [0, 0, 0, 1, 1], //
            secondMult: [1, 1, 0, 1, 1], //
            bounceMult: [1, 1, 0, 1, 1], //
            collisionMult: [1, 1, 0, 1, 1], //
          },
          minSpeed: [0, 0, 0, 1, 1], //
          maxSpeed: [1000000, 1000000, 0, 1, 1], //
          duration: [0, 0, 0, 1, 1], //
          effectDelay: [0, 0, 0, 1, 1], //
          lockPerBullet: true, //
        },
        targeting: {
          enabled: false, //
          adjustmentInterval: [0.5, 0.5, 0, 1, 1], //
          adjustmentLerp: [90, 90, 0, 1, 1], //
          adjustmentInaccuracy: [0, 0, 0, 1, 1], //
          effectDelay: [0, 0, 0, 1, 1], //
          duration: [10, 10, 0, 1, 1], //
          allowTargetingSame: true, //
          allowTargetingTeam: true, //
          targetBullets: false, //
          processType: 0, //
          lockPerBullet: true, //
        },
        sizeChange: {
          enabled: false, //
          changePer: {
            secondAdd: [0, 0, 0, 1, 1], //
            bounceAdd: [0, 0, 0, 1, 1], //
            collisionAdd: [0, 0, 0, 1, 1], //
            secondMult: [1, 1, 0, 1, 1], //
            bounceMult: [1, 1, 0, 1, 1], //
            collisionMult: [1, 1, 0, 1, 1], //
          },
          minSize: [0, 0, 0, 1, 1], //
          maxSize: [1000000, 1000000, 0, 1, 1], //
          duration: [0, 0, 0, 1, 1], //
          effectDelay: [0, 0, 0, 1, 1], //
          lockPerBullet: true, //
        },
        rangeCut: {
          enabled: false, //
          changePer: {
            secondAdd: [0, 0, 0, 1, 1], //
            bounceAdd: [0, 0, 0, 1, 1], //
            collisionAdd: [0, 0, 0, 1, 1], //
            secondMult: [1, 1, 0, 1, 1], //
            bounceMult: [1, 1, 0, 1, 1], //
            collisionMult: [1, 1, 0, 1, 1], //
          },
          maxRange: [600, 600, 0, 1, 1], //
          duration: [0, 0, 0, 1, 1], //
          effectDelay: [0, 0, 0, 1, 1], //
          lockPerBullet: true, //
        },
        opacityChange: {
          enabled: false, //
          changePer: {
            secondAdd: [0, 0, 0, 1, 1], //
            bounceAdd: [0, 0, 0, 1, 1], //
            collisionAdd: [0, 0, 0, 1, 1], //
            secondMult: [1, 1, 0, 1, 1], //
            bounceMult: [1, 1, 0, 1, 1], //
            collisionMult: [1, 1, 0, 1, 1], //
          },
          minVisibility: [0, 0, 0, 1, 1], //
          maxVisibility: [100, 100, 0, 1, 1], //
          duration: [0, 0, 0, 1, 1], //
          effectDelay: [0, 0, 0, 1, 1], //
          lockPerBullet: true, //
        },
      },
      
      health: {
        healthChange: {
          enabled: false, //
          changePer: {
            secondAdd: [0, 0, 0, 1, 1], //
            bounceAdd: [0, 0, 0, 1, 1], //
            collisionAdd: [0, 0, 0, 1, 1], //
            secondMult: [1, 1, 0, 1, 1], //
            bounceMult: [1, 1, 0, 1, 1], //
            collisionMult: [1, 1, 0, 1, 1], //
          },
          maxHealth: [1000000, 1000000, 0, 1, 1], //
          duration: [0, 0, 0, 1, 1], //
          effectDelay: [0, 0, 0, 1, 1], //
          lockPerBullet: true, //
        },
        damageResistChange: {
          enabled: false, //
          changePer: {
            secondAdd: [0, 0, 0, 1, 1], //
            bounceAdd: [0, 0, 0, 1, 1], //
            collisionAdd: [0, 0, 0, 1, 1], //
            secondMult: [1, 1, 0, 1, 1], //
            bounceMult: [1, 1, 0, 1, 1], //
            collisionMult: [1, 1, 0, 1, 1], //
          },
          minResist: [0, 0, 0, 1, 1], //
          maxResist: [1000000, 1000000, 0, 1, 1], //
          duration: [0, 0, 0, 1, 1], //
          effectDelay: [0, 0, 0, 1, 1], //
          lockPerBullet: true, //
        },
      },
      
      interactions: {
        tankInteractions: 0, //
        bulletInteractions: 0, //
        sameTeamBulletInteractions: 0, //
        bulletInteractionPriority: 100, //
        wallInteractions: 0, //
        destroyWalls: false,
        destroyOnHitting: {
          walls: false, //
          maxWallCollisions: [0, 0, 0, 1, 1], //
          tanks: false, //
          maxTankCollisions: [0, 0, 0, 1, 1], //
          bullets: false, //
          maxBulletCollisions: [0, 0, 0, 1, 1], //
        },
        maxCollisionPerTank: [0, 0, 0, 1, 1], //
        oneCollisionDamage: [100, 100, 0, 1, 1], //
        isLandmine: false, //
        freeze: {
          freezesTanks: false, //
          freezesBullets: false, //
          initialFreezeSpeedMultiplier: [50, 50, 0, 1, 1], //
          finalFreezeSpeedMultiplier: [100, 100, 0, 1, 1], //
          transitionTime: [5, 5, 0, 1, 1], //
          stacks: false, //
          conditionPriority: 100, //
          overrideBorderColor: false, //
          borderColor: 0 //
        },
        poison: {
          poisonsTanks: false, //
          poisonsBullets: false, //
          poisonDamageIntervals: [5, 5, 0, 1, 1], //
          poisonDuration: [5, 5, 0, 1, 1], //
          totalRawDamage: [100, 100, 0, 1, 1], //
          totalPercentageDamage: [0, 0, 0, 1, 1], //
          allowPoisonKill: false, //
          minPoisonHealth: 20, //
          stacks: false, //
          conditionPriority: 100, //
          overrideBorderColor: false, //
          borderColor: 0, //
          showDamageFrames: false, //
        },
        physicallyCollideWithTanks: false, //
        dealNoDamage: false, //
        borderBehavior: 0, //
        constantCollide: false, //
      },
      
      light: {
        createLightBubble: false, //
        visibilityType: 0, //
        bubbleSize: [5000, 5000, 0, 1, 1], //
        bubbleSizeChange: {
          enabled: false, //
          changePer: {
            secondAdd: [0, 0, 0, 1, 1], //
            bounceAdd: [0, 0, 0, 1, 1], //
            collisionAdd: [0, 0, 0, 1, 1], //
            secondMult: [1, 1, 0, 1, 1], //
            bounceMult: [1, 1, 0, 1, 1], //
            collisionMult: [1, 1, 0, 1, 1], //
          },
          minSize: [0, 0, 0, 1, 1], //
          maxSize: [1000000, 1000000, 0, 1, 1], //
          duration: [0, 0, 0, 1, 1], //
          effectDelay: [0, 0, 0, 1, 1], //
          lockPerBullet: true, //
        },
        bubbleOpacity: [90, 90, 0, 1, 1], //
        bubbleOpacityChange: {
          enabled: false, //
          changePer: {
            secondAdd: [0, 0, 0, 1, 1], //
            bounceAdd: [0, 0, 0, 1, 1], //
            collisionAdd: [0, 0, 0, 1, 1], //
            secondMult: [1, 1, 0, 1, 1], //
            bounceMult: [1, 1, 0, 1, 1], //
            collisionMult: [1, 1, 0, 1, 1], //
          },
          minOpacity: [0, 0, 0, 1, 1], //
          maxOpacity: [100, 100, 0, 1, 1], //
          duration: [0, 0, 0, 1, 1], //
          effectDelay: [0, 0, 0, 1, 1], //
          lockPerBullet: true, //
        },
        beamDegree: {
          startAngle: [0, 0, 0, 1, 1], //
          endAngle: [360, 360, 0, 1, 1], //
        },
        pierceWalls: false, //
        useAsConcealer: false, //
        concealerColor: 0, //
        renderOverShadows: false, //
        friendlyOpacity: 20, //
      },
      
      particles: {
        fragEvents: {
          destruction: false, //
          selfDestruct: false, //
          rangeDeath: false, //
        },
        fragFireBulletId: -1, //
        passiveRelease: {
          enabled: false, //
          timer: [1, 1, 0, 1, 1], //
          lockTimer: true, //
          delay: [3, 3, 0, 1, 1], //
          duration: [0, 0, 0, 1, 1], //
        },
        passiveReleaseBulletId: -1, //
        enableBounceRelease: false, //
        maxReleasedBullets: [0, 0, 0, 1, 1], //
      },
      
      multifire: {
        multifiredWeaponId: -1, //
        syncronizeFire: false, //
        overrideMultifiredReload: true, //
      },
      
      parentEffects: {
        disableBullets: false, //
        applyEffectsOnCollect: false, //
        applyEffectsOnHit: false, //
        playerOpacity: {
          enabled: false, //
          start: [0, 0, 0, 1, 1], //
          end: [100, 100, 0, 1, 1], //
          duration: [5, 5, 0, 1, 1], //
          lerp: [1, 1, 0, 1, 1], //
          processType: 3 //
        },
        playerSpeed: {
          enabled: false, //
          start: [150, 150, 0, 1, 1], //
          end: [100, 100, 0, 1, 1], //
          duration: [5, 5, 0, 1, 1], //
          lerp: [1, 1, 0, 1, 1], //
          processType: 3 //
        },
        playerVision: {
          enabled: false, //
          start: [150, 150, 0, 1, 1], //
          end: [100, 100, 0, 1, 1], //
          duration: [5, 5, 0, 1, 1], //
          lerp: [1, 1, 0, 1, 1], //
          processType: 3 //
        },
        playerBubble: {
          enabled: false, //
          start: [150, 150, 0, 1, 1], //
          end: [100, 100, 0, 1, 1], //
          changedWallPierce: 0, //
          changedVisibilityType: 0, //
          duration: [5, 5, 0, 1, 1], //
          lerp: [1, 1, 0, 1, 1], //
          processType: 3 //
        },
        playerHealth: {
          enabled: false, //
          added: [100, 100, 0, 1, 1] //
        },
        playerShield: {
          enabled: false, //
          deflectsAttacks: false, //
          maxHits: [0, 0, 0, 1, 1], //
          maxDefense: [100, 100, 0, 1, 1], //
          maxDuration: [0, 0, 0, 1, 1], //
          shieldResistance: [0, 0, 0, 1, 1], //
          stacks: false, //
          conditionPriority: 100, //
          shieldColor: 8, //
          shieldOpacity: 30, //
          shieldRadius: [200, 200, 0, 1, 1], //
          damageOverflowsToPlayer: true, //
        },
      },
  
      inheriting: {
        onPickupPowerupId: -1, //
        onFirePowerupId: -1, //
        onRemovalPowerupId: -1, //
        equipType: 2 //
      },
      
      misc: {
        selfDestruct: 0, //
        seeInvisibleType: 1, //
        createTrails: false, //
        trailLength: 3, //
        trailInterval: 0, //
        trailSize: 20, //
        trailFading: false, //
        overrideTrailColor: false, //
        trailColor: 0, //
        attachPlayerCamera: false, //
        stealPlayerControls: false, //
        allowMultiControl: false, //
        forceMotion: false, //
        bounceOnWalls: false, //
        rotationSpeed: [90, 90, 0, 1, 1], //
        allowUnequip: false, //
        deleteOnUnequip: true, //
        retainAfterDeath: false, //
        showHealthBar: false, //
        minOpacity: 0, //
        safeFade: 20, //
        forceEquip: false, //
        forceEquipPriority: 100, //
        dieOnTankDeath: false, //
      }
    };

exports.defaults = {
  metadata: {
    name: "Default Loadout", //
    hosted: false, //
    owned: true, //
    loadoutId: 0 //
  },
  
  powerupSettings: {
    powerupSpawnTimer: [3, 8, 0, 1, 1], //
    maxPowerups: [4, 4, 0, 1, 1], //
  },
  
  powerups: [], //
  
  personal: {
    tankColor: -1, //
    tankName: "", //
    
    tankMass: { //
      constrainType: 1,
      minBound: 100,
      maxBound: 100,
      value: [100, 100, 0, 1, 1],
    },
    tankSpeed: { //
      constrainType: 1,
      minBound: 100,
      maxBound: 100,
      value: [100, 100, 0, 1, 1],
    },
    tankAccelerationTime: { //
      constrainType: 1,
      minBound: 0.1,
      maxBound: 0.1,
      value: [0.1, 0.1, 0, 1, 0.1],
    },
    tankVelocityDampening: { //
      constrainType: 1,
      minBound: 10,
      maxBound: 10,
      value: [10, 10, 0, 1, 1],
    },
    tankRotationSpeed: { //
      constrainType: 1,
      minBound: 90,
      maxBound: 90,
      value: [90, 90, 0, 1, 1],
    },
    tankSize: { //
      constrainType: 1,
      minBound: 300,
      maxBound: 300,
      value: [300, 300, 0, 1, 1],
    },
    tankOpacity: { //
      constrainType: 1,
      minBound: 100,
      maxBound: 100,
      value: [100, 100, 0, 1, 1],
    },
    tankRegenDelay: { //
      constrainType: 1,
      minBound: 10,
      maxBound: 10,
      value: [10, 10, 0, 1, 1],
    },
    tankRegenRaw: { //
      constrainType: 1,
      minBound: 10,
      maxBound: 10,
      value: [10, 10, 0, 1, 1],
    },
    tankRegenPercentage: { //
      constrainType: 1,
      minBound: 0,
      maxBound: 0,
      value: [0, 0, 0, 1, 1],
    },
    
    tankHealth: { //
      constrainType: 1,
      minBound: 100,
      maxBound: 100,
      value: [100, 100, 0, 1, 1],
    },
    tankResistance: { //
      constrainType: 1,
      minBound: 0,
      maxBound: 0,
      value: [0, 0, 0, 1, 1],
    },
    
    extraLives: { //
      constrainType: 1,
      minBound: 0,
      maxBound: 0,
      value: [0, 0, 0, 1, 1],
    },
    showHealthBar: { //
      constrainType: 4,
      value: false,
    },
    
    maxHeldPowerups: { //
      constrainType: 1,
      minBound: 2,
      maxBound: 2,
      value: [2, 2, 0, 1, 1],
    },
    powerupEquipType: { //
      constrainType: 1,
      value: 1
    },
    
    cameraOpacity: { //
      constrainType: 1,
      minBound: 90,
      maxBound: 90,
      value: [90, 90, 0, 1, 1],
    },
    cameraVision: { //
      constrainType: 1,
      minBound: 5000,
      maxBound: 5000,
      value: [5000, 5000, 0, 1, 1],
    },
    cameraBubble: { //
      constrainType: 1,
      minBound: 4000,
      maxBound: 4000,
      value: [4000, 4000, 0, 1, 1],
    },
    lockCameraToCenter: { //
      constrainType: 4,
      value: false
    },
    cameraBubbleAngleStart: { //
      constrainType: 1,
      minBound: 0,
      maxBound: 0,
      value: [0, 0, 0, 1, 1],
    },
    cameraBubbleAngleEnd: { //
      constrainType: 1,
      minBound: 360,
      maxBound: 360,
      value: [360, 360, 0, 1, 1],
    },
    cameraVisibility: { //
      constrainType: 4,
      value: 3
    },
    cameraIgnoreWalls: { //
      constrainType: 4,
      value: false,
    },
    constrainLights: true, //
    lights: [], //
  },
  
  gamemode: {
    mode: 0, //
    standard: {
      reviveTimer: [5, 5, 0, 1, 1], //
      surviveTimer: [2, 5, 0, 1, 1], //
    },
    arena: {
      reviveTimer: [5, 5, 0, 1, 1], //
      roundTimer: [30, 90, 0, 1, 15], //
      killPoints: [5, 5, 0, 1, 1], //
      deathLostPoints: [1, 1, 0, 1, 1], //
      friendlyFireLostPoints: [1, 1, 0, 1, 1], //
      drawHandling: 0 //
    },
    tag: {
      maxTags: [0, 0, 0, 1, 1], //
      weaponChangeWithPlayer: false, //
      teleportOnTag: false, //
      teleportWhenUsingExtraLife: true, //
      friendlyFireDeathHandling: 1, //
    },
    monarch: {
      overrideMonarchExtraLives: true, //
      monarchExtraLives: [0, 0, 0, 1, 1], //
      reviveTimer: [5, 5, 0, 1, 1], //
      surviveTimer: [2, 5, 0, 1, 1], //
      kingVisibility: 0, //
      spawnRadius: [10000, 10000, 0, 1, 1], //
      changeMonarchBorders: false //
    },
    kingOfTheHill: {
      countdownTimer: [15, 15, 0, 1, 1], //
      firstCrownAssignment: 0, //
      shuffleOnSteal: false, //
      oldBearerDies: false, //
      crownOwnedByTeam: true, //
      arrowToCrown: true, //
    },
    teams: {
      teamAssignmentMethod: 0, //
      spreadMethodNumberOfTeams: [2, 2, 0, 1, 1], //
      spreadType: 1, //
      fillMethodMaxTanksPerTeam: [1, 1, 0, 1, 1], //
      overrideTeamColor: true //
    },
    maxPlayers: 20, //
    gamesInARow: 1, //
    roundEndTimer: [2, 2, 0, 1, 1], //
    roundStartTimer: [0, 0, 0, 1, 1], //
  },
  
  general: {
    tankCollisionType: 0, //
    tankTextVisibility: 2, //
    visibleGhostType: 0, //
    ghostSpectateType: 0, //
  },
  
  maze: {
    enableMaze: true, //
    tileSize: [800, 800, 0, 1, 1], //
    tileDimensions: {x: [3, 8, 0, 1, 1], y: [3, 8, 0, 1, 1]}, //
    closedPercentage: [0, 20, 0, 1, 1], //
    wallsRemovedPercentage: [0, 20, 0, 1, 1], //
    hallwayLength: [1, 1, 0, 1, 1], //
    wallWidth: [10, 10, 0, 1, 1], //
    customChance: 0, //
  },
  
  wallTypes: [
    {
      name: "Wall", //
      spawnChance: 100, //
      castShadow: true, //
      restitution: [100, 100, 0, 1, 0.01], //
      roughness: [0, 0, 0, 1, 0.01], //
      tankDamage: [0, 0, 0, 1, 0.01], //
      bounceDamage: [0, 0, 0, 1, 0.01], //
      opacity: [100, 100, 0, 1, 0.01], //
      hasHitbox: true, //
      removeOnCollide: false, //
      opacityOnCollide: [100, 100, 0, 1, 0.01], //
      opacityFadeTime: [1, 1, 0, 1, 0.01], //
      mass: [0, 0, 0, 1, 0.01], //
      thickness: [100, 100, 0, 1, 0.01], //
      color: 0, //
      ignoreIds: 0, //
      dieToIds: 0, //
      killWithIds: 0, //
      spawnLocation: 0, //
      id: 0, //
    }
  ],
  
  customMazes: [ //
    [100, 2,  0, -1, -1, -1, -1,  0, -1, -1, -1, -1,  0, -1, -1, -1, -1,  0, -1, -1, -1, -1]
  ],
  
  waitingRoom: {
    size: {width: [4, 4, 0, 1, 1], height: [4, 4, 0, 1, 1]}, //
    spawnMaze: true, //
    spawnBoxes: false,
    lobbyDeathHandlingType: 2, //
    ghostReviveTime: [5, 5, 0, 1, 1], //
  },
};

exports.defaultLight = {
  name: "Unnamed Light",
  bubble: [1000, 1000, 0, 1, 1], //
  visibility: 3, //
  opacity: [90, 90, 0, 1, 0.01], //
  startAngle: [0, 0, 0, 1, 1], //
  endAngle: [360, 360, 0, 1, 1], //
  positionx: [0, 0, 0, 1, 1], //
  positiony: [0, 0, 0, 1, 1], //
  visibleWhenLightsOut: true, //
  visibleWhenLightsOn: true, //
  ignoreWalls: false, //
  onlyWithPowerupId: -1 //
};

exports.defaultWall = {
  name: "Wall",
  spawnChance: 10,
  castShadow: true,
  restitution: [1, 1, 0, 1, 0.01],
  roughness: [1, 1, 0, 1, 0.01],
  DPS: [1, 1, 0, 1, 0.01],
  ghostWall: false,
  opacity: [1, 1, 0, 1, 0.01],
  hasHitbox: true,
  removeOnCollide: false,
  opacityOnCollide: [1, 1, 0, 1, 0.01],
  opacityFadeTime: [1, 1, 0, 1, 0.01],
  mass: [1, 1, 0, 1, 0.01],
  spawnType: 0,
}