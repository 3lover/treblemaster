import cdf from 'https://cdn.jsdelivr.net/gh/stdlib-js/stats-base-dists-beta-cdf@esm/index.mjs';


/**
  Converts a UIntArray to a String
  @param {UIntArray Reader} reader - The DataView we use to read the array
*/
export function convertIntArrayToString(reader, initialOffset) {
  let returnedString = "";
  let finalOffset = 0;
  for (; finalOffset < 999; finalOffset++) {
    let characterCode = reader.getInt8(initialOffset + (finalOffset));
    if (characterCode === 0) break;
    returnedString += String.fromCharCode(characterCode);
  }
  return [decodeURIComponent(returnedString), initialOffset + finalOffset + 1];
}

/**
breaks down a packet into readable information and returns the packet info in an array
@param {DataView} reader - the packet we recieved
@param {Array} dataTypes - goes through the buffer and takes the datatype next on this array
@return {Array} the decoded array with all the sent information
*/
export function decodePacket (reader, dataTypes, initialOffset = 0) {
  let offset = initialOffset;
  let decoded = [];
  let repeating = [];
  let zeroRepeats = false;
  for (let i = 0; i < dataTypes.length; i++) {
    let usedDecode = decoded;
    for (let j = 0; j < repeating.length; j++) {
      usedDecode = usedDecode[usedDecode.length - 1];
    }
    if (zeroRepeats && dataTypes[i] !== "end") continue;
    switch (dataTypes[i]) {
      case "int8": {
        usedDecode.push(reader.getInt8(offset));
        offset += 1;
        break;
      }
      case "int16": {
        usedDecode.push(reader.getInt16(offset));
        offset += 2;
        break;
      }
      case "int32": {
        usedDecode.push(reader.getInt32(offset));
        offset += 4;
        break;
      }
      case "float32": {
        usedDecode.push(reader.getFloat32(offset));
        offset += 4;
        break;
      }
      case "int64": {
        usedDecode.push(reader.getInt64(offset));
        offset += 8;
        break;
      }

      case "float32array": {
        let arraylength = reader.getInt32(offset);
        offset += 4;
        let decodedarray = [];
        for (let j = 0; j < arraylength; j++) {
          decodedarray.push(reader.getFloat32(offset));
          offset += 4;
        }
        usedDecode.push(decodedarray);
        break;
      }

      case "float32arrayarray": {
        let outerarraylength = reader.getInt32(offset);
        offset += 4;
        let decodedouterarray = [];
        for (let j = 0; j < outerarraylength; j++) {
          let innerarraylength = reader.getInt32(offset);
          let decodedinnerarray = [];
          offset += 4;
          for (let k = 0; k < innerarraylength; k++) {
            decodedinnerarray.push(reader.getFloat32(offset));
            offset += 4;
          }
          decodedouterarray.push(decodedinnerarray);
        }
        usedDecode.push(decodedouterarray);
        break;
      }

      case "string": {
        let decodedString = convertIntArrayToString(reader, offset);
        usedDecode.push(decodedString[0]);
        offset = decodedString[1];
        break;
      }

      case "repeat": {
        usedDecode.push([]);
        repeating.push([reader.getInt32(offset), i]);
        if (reader.getInt32(offset) === 0) zeroRepeats = true;
        offset += 8;
        break;
      }

      case "end": {
        zeroRepeats = false;
        for (let a = 0; a < 99; a++) {
          repeating[repeating.length - 1][0]--;
          if (repeating[repeating.length - 1][0] <= 0) {
            repeating.splice(repeating.length - 1, 1);
            break;
          }
          else {
            i = repeating[repeating.length - 1][1];
          }
          break;
        }
        break;
      }
    }
  }
  
  return decoded;
}

export function getPacketOffset(reader, dataTypes) {
  let offset = 0;
  let repeating = [];
  for (let i = 0; i < dataTypes.length; i++) {
    switch (dataTypes[i]) {
      case "int8": {
        offset += 1;
        break;
      }
      case "int16": {
        offset += 2;
        break;
      }
      case "int32": {
        offset += 4;
        break;
      }
      case "float32": {
        offset += 4;
        break;
      }
      case "int64": {
        offset += 8;
        break;
      }

      case "float32array": {
        let arraylength = reader.getInt32(offset);
        offset += 4 * (arraylength + 1);
        break;
      }

      case "float32arrayarray": {
        let outerarraylength = reader.getInt32(offset);
        offset += 4;
        for (let j = 0; j < outerarraylength; j++) {
          let innerarraylength = reader.getInt32(offset);
          offset += 4;
          for (let k = 0; k < innerarraylength; k++) {
            offset += 4;
          }
        }
        break;
      }

      case "string": {
        let decodedString = convertIntArrayToString(reader, offset);
        offset = decodedString[1];
        break;
      }

      case "repeat": {
        repeating.push([reader.getInt32(offset), i]);
        offset += 8;
        break;
      }

      case "end": {
        //offset += 1;
        for (let a = 0; a < 99; a++) {
          repeating[repeating.length - 1][0]--;
          if (repeating[repeating.length - 1][0] <= 0) {
            repeating.splice(repeating.length - 1, 1);
            break;
          }
          else {
            i = repeating[repeating.length - 1][1];
          }
          break;
        }
        break;
      }
    }
  }
  
  return offset;
}

/**
encodes an array of data into an arraybuffer to send, and calculate how long it must be to do so
@param {Array} data - all the data we are encoding
@param {Array} dataTypes - the datatype we convert each bit of data into
@return {ArrayBuffer} the encoded arraybuffer, ready to be sent
*/
export function encodePacket(data, dataTypes) {
  let offset = 0;
  let repeating = [];
  let zeroRepeats = false
  let dataPosition = 0;
  
  let arraylength = 0;
  for (let i = 0; i < dataTypes.length; i++) {
    if (zeroRepeats && dataTypes[i] !== "end") continue;
    switch (dataTypes[i]) {
        // integers and floats
      case "int64": arraylength += 4;
      case "float32":
      case "int32": arraylength += 2;
      case "int16": arraylength += 1;
      case "int8": {
        arraylength += 1;
        break;
      }
        // float32array
      case "float32array": {
        arraylength += 4 * (data[dataPosition].length + 1);
        break;
      }
        
        // for vertex and stuff
      case "float32arrayarray": {
        arraylength += 4;
        for (let d of data[dataPosition])
          arraylength += 4 * (d.length + 1);
        break;
      }
        
        // strings
      case "string": {
        arraylength += encodeURIComponent(data[dataPosition]).length + 1;
        break;
      }
        
        // breaks down all data types between this and end a certain number of times
      case "repeat": {
        arraylength += 8;
        repeating.push([data[dataPosition], i]);
        if (data[dataPosition] === 0) zeroRepeats = true;
        break;
      }

      case "end": {
        zeroRepeats = false;
        //arraylength += 1;
        for (let a = 0; a < 99; a++) {
          repeating[repeating.length - 1][0]--;
          if (repeating[repeating.length - 1][0] <= 0) {
            repeating.splice(repeating.length - 1, 1);
            break;
          }
          else {
            i = repeating[repeating.length - 1][1];
            dataPosition--;
          }
          break;
        }
        break;
      }
    }
    dataPosition++;
  }
  
  let encoded = new ArrayBuffer(arraylength);
  let dv = new DataView(encoded);
  repeating = [];
  zeroRepeats = false;
  dataPosition = 0;
  
  for (let i = 0; i < dataTypes.length; i++) {
    if (zeroRepeats && dataTypes[i] !== "end") continue;
    switch (dataTypes[i]) {
      case "int8": {
        dv.setInt8(offset, data[dataPosition]);
        offset += 1;
        break;
      }
      case "int16": {
        dv.setInt16(offset, data[dataPosition]);
        offset += 2;
        break;
      }
      case "int32": {
        dv.setInt32(offset, data[dataPosition]);
        offset += 4;
        break;
      }
      case "float32": {
        dv.setFloat32(offset, data[dataPosition]);
        offset += 4;
        break;
      }
      case "int64": {
        dv.setInt64(offset, data[dataPosition]);
        offset += 8;
        break;
      }

      case "float32array": {
        dv.setInt32(offset, data[dataPosition].length);
        offset += 4;
        for (let j = 0; j < data[dataPosition].length; j++) {
          dv.setFloat32(offset, data[dataPosition][j]);
          offset += 4;
        }
        break;
      }

      case "float32arrayarray": {
        dv.setInt32(offset, data[dataPosition].length);
        offset += 4;
        for (let j = 0; j < data[dataPosition].length; j++) {
          dv.setInt32(offset, data[dataPosition][j].length);
          offset += 4;
          for (let k = 0; k < data[dataPosition][j].length; k++) {
            dv.setFloat32(offset, data[dataPosition][j][k]);
            offset += 4;
          }
        }
        break;
      }

      case "string": {
        let usedString = encodeURIComponent(data[dataPosition]);
        for (let j = 0; j < usedString.length; j++) {
          dv.setInt8(offset, usedString.charCodeAt(j) < 128 ? usedString.charCodeAt(j) : 63);
          offset++;
        }
        dv.setInt8(offset, 0);
        offset++;
        break;
      }

        // breaks down all data types between this and end a certain number of times
      case "repeat": {
        dv.setInt32(offset, data[dataPosition]);
        offset += 8;
        repeating.push([data[dataPosition], i]);
        if (data[dataPosition] === 0) zeroRepeats = true;
        break;
      }

      case "end": {
        zeroRepeats = false;
        for (let a = 0; a < 99; a++) {
          repeating[repeating.length - 1][0]--;
          if (repeating[repeating.length - 1][0] <= 0) {
            repeating.splice(repeating.length - 1, 1);
            break;
          }
          else {
            i = repeating[repeating.length - 1][1];
            dataPosition--;
          }
          break;
        }
        break;
      }
    }
    dataPosition++;
  }
  
  return encoded;
}

/**
removes the floating point imprecision from a number when turning it into a string
*/
export function chop(number) {
  return String(Math.round(parseFloat(number) * 100000) / 100000);
}

export function lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  let uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
  let uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    let intersectionX = x1 + (uA * (x2-x1));
    let intersectionY = y1 + (uA * (y2-y1));
    return [intersectionX, intersectionY];
  }
  return null;
}

export function dist(pointa, pointb) {
  return Math.sqrt((pointa.x - pointb.x) ** 2 + (pointa.y - pointb.y) ** 2);
}

export function RectangleCircle(rect, circle) {
  let testX = circle.x;
  let testY = circle.y;
  if (circle.x < rect.x) testX = rect.x;
  else if (circle.x > rect.x + rect.w) testX = rect.x + rect.w;
  if (circle.y < rect.y) testY = rect.y;
  else if (circle.y > rect.y + rect.h) testY = rect.y + rect.h;

  let distX = circle.x - testX;
  let distY = circle.y - testY;
  let distance = (distX ** 2) + (distY ** 2);

  return distance <= circle.r ** 2;
}

export function downloadFile(name, content) {
  const link = document.createElement("a");
  const file = new Blob([content], { type: 'text/plain' });
  link.href = URL.createObjectURL(file);
  link.download = `${name}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export function clamp(value, min, max, round = 0.0001) {
  if (min > max) return Math.round(Math.max(Math.min(min, value), max) / round) * round;
  return Math.round(Math.max(Math.min(max, value), min) / round) * round;
}


export function getIss(syntax, forcedSeed) {
  let randomness = syntax[1] - syntax[0];
  let finalAnswer = 0;
  let seed = forcedSeed ?? Math.random();
  switch(syntax[2]) {
    case 0: {
      // exponential function, higher numbers mean a lower average, lower numbers mean a higher average
      finalAnswer = syntax[0] + randomness * Math.pow(seed, syntax[3]);
      break;
    }
    case 1: {
      // beta function, higher numbers input cause more average results, lower numbers input cause more edge case results 
      finalAnswer = syntax[0] + randomness * cdf(seed, 1/syntax[3], 1/syntax[3]);
      break;
    }
  }
  
  return Math.round(finalAnswer / syntax[4]) * syntax[4];
}


export let defaultSettings = {
  metadata: {
    name: "Default Loadout",
    hosted: false,
    owned: true,
    loadoutId: 0
  },
  
  powerupSettings: {
    powerupSpawnTimer: [3, 8, 0, 1, 1],
    maxPowerups: [4, 4, 0, 1, 1],
  },
  
  powerups: [
    {
      name: "Default Weapon",
      id: 0,
      attachments: [[0, -1, 0, 0.1, 0.1, 0.1, -0.1, -0.1, -0.1, -0.1, 0.1], [-1, -1, 0, 0, 0.04, 0.14, 0.04, 0.14, -0.04, 0, -0.04]],
      appearance: [[0, -1, 0, 0, 0, 0.1]],
      bubbleShape: [[0, 7, 0, 0, 0, 0.1]],
      wallIds: 0,
      
      spawning: {
        allowSpawning: true,
        spawnPriority: 100,
        fakeSpawnProbability: 0,
        maxSpawns: [0, 0, 0, 1, 1],
        removeOnTimer: false,
        removalTimer: [10, 10, 0, 1, 1],
        spawnEquipped: false, //
        spawnEquippedChance: 100,
        spawnEquippedPriority: 100,
        bubbleSize: [100, 100, 0, 1, 0.01],
        treatAsDefault: false //
      },
      
      firing: {
        shotReloadTime: [1, 1, 0, 1, 0.01], //
        roundReloadTime: [1, 1, 0, 1, 0.01], //
        shotsPerRound: [3, 3, 0, 1, 1], //
        roundsPerWeapon: [1, 1, 0, 1, 1], //
        quantity: [1, 1, 0, 1, 1],
        countPerBullet: false,
        directionAdditive: [0, 0, 0, 1, 0.01],
        fireLocation: [0, 0, 0, 1, 0.01],
        addLocationToDirection: true,
        totalRecoil: [0, 0, 0, 1, 0.01],
        prefireAnimationLock: [0, 0, 0, 1, 0.01],
        postfireAnimationLock: [0, 0, 0, 1, 0.01],
        firingDistanceFromCenter: [100, 100, 0, 1, 0.01],
        removeAfterEvent: 0,
        removeAfterTimer: [10, 10, 0, 1, 0.01],
        precomputeRoundAttributes: false, //
        precomputeShotAttributes: false, //
        reloadWhenUnequipped: false, //
        removeOnLastRound: true, //
        fireOnPickup: false
      },
      
      baseAttributes: {
        speed: [120, 120, 0, 1, 1], //
        overrideBase: false,
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
          enabled: false, 
          changePer: {
            secondAdd: [0, 0, 0, 1, 1],
            bounceAdd: [0, 0, 0, 1, 1],
            collisionAdd: [0, 0, 0, 1, 1],
            secondMult: [1, 1, 0, 1, 1],
            bounceMult: [1, 1, 0, 1, 1],
            collisionMult: [1, 1, 0, 1, 1],
          },
          minSpeed: [0, 0, 0, 1, 1],
          maxSpeed: [1000000, 1000000, 0, 1, 1],
          duration: [0, 0, 0, 1, 1],
          effectDelay: [0, 0, 0, 1, 1],
          lockPerBullet: true,
        },
        targeting: {
          enabled: false,
          adjustmentInterval: [0.5, 0.5, 0, 1, 1],
          adjustmentLerp: [90, 90, 0, 1, 1],
          adjustmentInaccuracy: [0, 0, 0, 1, 1],
          effectDelay: [0, 0, 0, 1, 1],
          duration: [10, 10, 0, 1, 1],
          allowTargetingSame: true,
          allowTargetingTeam: true,
          targetBullets: false,
          processType: 0,
          lockPerBullet: true,
        },
        sizeChange: {
          enabled: false,
          changePer: {
            secondAdd: [0, 0, 0, 1, 1],
            bounceAdd: [0, 0, 0, 1, 1],
            collisionAdd: [0, 0, 0, 1, 1],
            secondMult: [1, 1, 0, 1, 1],
            bounceMult: [1, 1, 0, 1, 1],
            collisionMult: [1, 1, 0, 1, 1],
          },
          minSize: [0, 0, 0, 1, 1],
          maxSize: [1000000, 1000000, 0, 1, 1],
          duration: [0, 0, 0, 1, 1],
          effectDelay: [0, 0, 0, 1, 1],
          lockPerBullet: true,
        },
        rangeCut: {
          enabled: false,
          changePer: {
            secondAdd: [0, 0, 0, 1, 1],
            bounceAdd: [0, 0, 0, 1, 1],
            collisionAdd: [0, 0, 0, 1, 1],
            secondMult: [1, 1, 0, 1, 1],
            bounceMult: [1, 1, 0, 1, 1],
            collisionMult: [1, 1, 0, 1, 1],
          },
          maxRange: [600, 600, 0, 1, 1],
          duration: [0, 0, 0, 1, 1],
          effectDelay: [0, 0, 0, 1, 1],
          lockPerBullet: true,
        },
        opacityChange: {
          enabled: false,
          changePer: {
            secondAdd: [0, 0, 0, 1, 1],
            bounceAdd: [0, 0, 0, 1, 1],
            collisionAdd: [0, 0, 0, 1, 1],
            secondMult: [1, 1, 0, 1, 1],
            bounceMult: [1, 1, 0, 1, 1],
            collisionMult: [1, 1, 0, 1, 1],
          },
          minVisibility: [0, 0, 0, 1, 1],
          maxVisibility: [100, 100, 0, 1, 1],
          duration: [0, 0, 0, 1, 1],
          effectDelay: [0, 0, 0, 1, 1],
          lockPerBullet: true,
        },
      },
      
      health: {
        healthChange: {
          enabled: false,
          changePer: {
            secondAdd: [0, 0, 0, 1, 1],
            bounceAdd: [0, 0, 0, 1, 1],
            collisionAdd: [0, 0, 0, 1, 1],
            secondMult: [1, 1, 0, 1, 1],
            bounceMult: [1, 1, 0, 1, 1],
            collisionMult: [1, 1, 0, 1, 1],
          },
          maxHealth: [1000000, 1000000, 0, 1, 1],
          duration: [0, 0, 0, 1, 1],
          effectDelay: [0, 0, 0, 1, 1],
          lockPerBullet: true,
        },
        damageResistChange: {
          enabled: false,
          changePer: {
            secondAdd: [0, 0, 0, 1, 1],
            bounceAdd: [0, 0, 0, 1, 1],
            collisionAdd: [0, 0, 0, 1, 1],
            secondMult: [1, 1, 0, 1, 1],
            bounceMult: [1, 1, 0, 1, 1],
            collisionMult: [1, 1, 0, 1, 1],
          },
          minResist: [0, 0, 0, 1, 1],
          maxResist: [1000000, 1000000, 0, 1, 1],
          duration: [0, 0, 0, 1, 1],
          effectDelay: [0, 0, 0, 1, 1],
          lockPerBullet: true,
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
          tanks: false,
          maxTankCollisions: [0, 0, 0, 1, 1],
          bullets: false,
          maxBulletCollisions: [0, 0, 0, 1, 1],
        },
        maxCollisionPerTank: [0, 0, 0, 1, 1],
        oneCollisionDamage: [100, 100, 0, 1, 1],
        isLandmine: false,
        freeze: {
          freezesTanks: false,
          freezesBullets: false,
          initialFreezeSpeedMultiplier: [50, 50, 0, 1, 1],
          finalFreezeSpeedMultiplier: [100, 100, 0, 1, 1],
          transitionTime: [5, 5, 0, 1, 1],
          stacks: false,
          conditionPriority: 100,
          overrideBorderColor: false,
          borderColor: 0
        },
        poison: {
          poisonsTanks: false,
          poisonsBullets: false,
          poisonDamageIntervals: [5, 5, 0, 1, 1],
          poisonDuration: [5, 5, 0, 1, 1],
          totalRawDamage: [100, 100, 0, 1, 1],
          totalPercentageDamage: [0, 0, 0, 1, 1],
          allowPoisonKill: false,
          minPoisonHealth: 20,
          stacks: false,
          conditionPriority: 100,
          overrideBorderColor: false,
          borderColor: 0,
          showDamageFrames: false,
        },
        physicallyCollideWithTanks: false,
        dealNoDamage: false,
        borderBehavior: 0,
        constantCollide: false,
      },
      
      light: {
        createLightBubble: false,
        visibilityType: 0,
        bubbleSize: [5000, 5000, 0, 1, 1],
        bubbleSizeChange: {
          enabled: false,
          changePer: {
            secondAdd: [0, 0, 0, 1, 1],
            bounceAdd: [0, 0, 0, 1, 1],
            collisionAdd: [0, 0, 0, 1, 1],
            secondMult: [1, 1, 0, 1, 1],
            bounceMult: [1, 1, 0, 1, 1],
            collisionMult: [1, 1, 0, 1, 1],
          },
          minSize: [0, 0, 0, 1, 1],
          maxSize: [1000000, 1000000, 0, 1, 1],
          duration: [0, 0, 0, 1, 1],
          effectDelay: [0, 0, 0, 1, 1],
          lockPerBullet: true,
        },
        bubbleOpacity: [90, 90, 0, 1, 1],
        bubbleOpacityChange: {
          enabled: false,
          changePer: {
            secondAdd: [0, 0, 0, 1, 1],
            bounceAdd: [0, 0, 0, 1, 1],
            collisionAdd: [0, 0, 0, 1, 1],
            secondMult: [1, 1, 0, 1, 1],
            bounceMult: [1, 1, 0, 1, 1],
            collisionMult: [1, 1, 0, 1, 1],
          },
          minOpacity: [0, 0, 0, 1, 1],
          maxOpacity: [100, 100, 0, 1, 1],
          duration: [0, 0, 0, 1, 1],
          effectDelay: [0, 0, 0, 1, 1],
          lockPerBullet: true,
        },
        beamDegree: {
          startAngle: [0, 0, 0, 1, 1],
          endAngle: [360, 360, 0, 1, 1],
        },
        pierceWalls: false,
        useAsConcealer: false,
        concealerColor: 0,
        renderOverShadows: false,
        friendlyOpacity: 20,
      },
      
      particles: {
        fragEvents: {
          destruction: false,
          selfDestruct: false,
          rangeDeath: false,
        },
        fragFireBulletId: -1,
        passiveRelease: {
          enabled: false,
          timer: [1, 1, 0, 1, 0.01],
          lockTimer: true,
          delay: [3, 3, 0, 1, 0.01],
          duration: [0, 0, 0, 1, 0.01],
        },
        passiveReleaseBulletId: -1,
        enableBounceRelease: false,
        maxReleasedBullets: [0, 0, 0, 1, 1],
      },
      
      multifire: {
        multifiredWeaponId: -1,
        syncronizeFire: false,
        overrideMultifiredReload: true,
      },
      
      parentEffects: {
        disableBullets: false,
        applyEffectsOnCollect: false,
        applyEffectsOnHit: false,
        playerOpacity: {
          enabled: false,
          start: [0, 0, 0, 1, 0.01],
          end: [100, 100, 0, 1, 0.01],
          duration: [5, 5, 0, 1, 0.01],
          lerp: [1, 1, 0, 1, 0.01],
          processType: 3
        },
        playerSpeed: {
          enabled: false,
          start: [150, 150, 0, 1, 0.01],
          end: [100, 100, 0, 1, 0.01],
          duration: [5, 5, 0, 1, 0.01],
          lerp: [1, 1, 0, 1, 0.01],
          processType: 3
        },
        playerVision: {
          enabled: false,
          start: [150, 150, 0, 1, 0.01],
          end: [100, 100, 0, 1, 0.01],
          duration: [5, 5, 0, 1, 0.01],
          lerp: [1, 1, 0, 1, 0.01],
          processType: 3
        },
        playerBubble: {
          enabled: false,
          start: [150, 150, 0, 1, 0.01],
          end: [100, 100, 0, 1, 0.01],
          changedWallPierce: 0,
          changedVisibilityType: 0,
          duration: [5, 5, 0, 1, 0.01],
          lerp: [1, 1, 0, 1, 0.01],
          processType: 3
        },
        playerHealth: {
          enabled: false,
          added: [100, 100, 0, 1, 0.01]
        },
        playerShield: {
          enabled: false,
          deflectsAttacks: false,
          maxHits: [0, 0, 0, 1, 1],
          maxDefense: [100, 100, 0, 1, 0.01],
          maxDuration: [0, 0, 0, 1, 0.01],
          shieldResistance: [0, 0, 0, 1, 0.01],
          stacks: false,
          conditionPriority: 100,
          shieldColor: 8,
          shieldOpacity: 30,
          shieldRadius: [200, 200, 0, 1, 0.01],
          damageOverflowsToPlayer: true,
        },
      },
      
      inheriting: {
        onPickupPowerupId: -1,
        onFirePowerupId: -1,
        onRemovalPowerupId: -1,
        equipType: 2
      },
      
      misc: {
        selfDestruct: 0,
        seeInvisibleType: 1,
        createTrails: false,
        trailLength: 3,
        trailInterval: 0,
        trailSize: 20,
        trailFading: false,
        overrideTrailColor: false,
        trailColor: 0,
        attachPlayerCamera: false,
        stealPlayerControls: false,
        allowMultiControl: false,
        forceMotion: false,
        bounceOnWalls: false,
        rotationSpeed: [90, 90, 0, 1, 1],
        allowUnequip: false,
        deleteOnUnequip: true,
        retainAfterDeath: false,
        showHealthBar: false,
        minOpacity: 0,
        safeFade: 20,
        forceEquip: false,
        forceEquipPriority: 100,
        dieOnTankDeath: false,
      },
    
    }
  ],
  
  
  personal: {
    tankColor: -1,
    tankName: "",
    
    tankMass: { //
      constrainType: 1,
      minBound: 100,
      maxBound: 100,
      value: [100, 100, 0, 1, 0.01],
    },
    tankSpeed: {
      constrainType: 1,
      minBound: 100,
      maxBound: 100,
      value: [100, 100, 0, 1, 0.01],
    },
    tankAccelerationTime: {
      constrainType: 1,
      minBound: 0.1,
      maxBound: 0.1,
      value: [0.1, 0.1, 0, 1, 0.01],
    },
    tankVelocityDampening: {
      constrainType: 1,
      minBound: 10,
      maxBound: 10,
      value: [10, 10, 0, 1, 0.01],
    },
    tankRotationSpeed: {
      constrainType: 1,
      minBound: 90,
      maxBound: 90,
      value: [90, 90, 0, 1, 0.01],
    },
    tankSize: {
      constrainType: 1,
      minBound: 300,
      maxBound: 300,
      value: [300, 300, 0, 1, 0.01],
    },
    tankOpacity: {
      constrainType: 1,
      minBound: 100,
      maxBound: 100,
      value: [100, 100, 0, 1, 0.01],
    },
    tankRegenDelay: {
      constrainType: 1,
      minBound: 10,
      maxBound: 10,
      value: [10, 10, 0, 1, 0.01],
    },
    tankRegenRaw: {
      constrainType: 1,
      minBound: 10,
      maxBound: 10,
      value: [10, 10, 0, 1, 1],
    },
    tankRegenPercentage: {
      constrainType: 1,
      minBound: 0,
      maxBound: 0,
      value: [0, 0, 0, 1, 1],
    },
    tankHealth: {
      constrainType: 1,
      minBound: 100,
      maxBound: 100,
      value: [100, 100, 0, 1, 0.01],
    },
    tankResistance: {
      constrainType: 1,
      minBound: 0,
      maxBound: 0,
      value: [0, 0, 0, 1, 0.01],
    },
    
    extraLives: {
      constrainType: 1,
      minBound: 0,
      maxBound: 0,
      value: [0, 0, 0, 1, 1],
    },
    showHealthBar: {
      constrainType: 4,
      value: false,
    },
    
    maxHeldPowerups: { //
      constrainType: 1,
      minBound: 2,
      maxBound: 2,
      value: [2, 2, 0, 1, 1],
    },
    powerupEquipType: {
      constrainType: 1,
      value: 1
    },
    
    cameraOpacity: { //
      constrainType: 1,
      minBound: 90,
      maxBound: 90,
      value: [90, 90, 0, 1, 0.01],
    },
    cameraVision: { //
      constrainType: 1,
      minBound: 5000,
      maxBound: 5000,
      value: [5000, 5000, 0, 1, 0.01],
    },
    cameraBubble: { //
      constrainType: 1,
      minBound: 4000,
      maxBound: 4000,
      value: [4000, 4000, 0, 1, 0.01],
    },
    lockCameraToCenter: {
      constrainType: 4,
      value: false
    },
    cameraBubbleAngleStart: { //
      constrainType: 1,
      minBound: 0,
      maxBound: 0,
      value: [0, 0, 0, 1, 0.01],
    },
    cameraBubbleAngleEnd: { //
      constrainType: 1,
      minBound: 360,
      maxBound: 360,
      value: [360, 360, 0, 1, 0.01],
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
    mode: 0,
    standard: {
      reviveTimer: [5, 5, 0, 1, 0.01],
      surviveTimer: [2, 5, 0, 1, 0.01],
    },
    arena: {
      reviveTimer: [5, 5, 0, 1, 0.01],
      roundTimer: [30, 90, 0, 1, 15],
      killPoints: [5, 5, 0, 1, 1],
      deathLostPoints: [1, 1, 0, 1, 1],
      friendlyFireLostPoints: [1, 1, 0, 1, 1],
      drawHandling: 0
    },
    tag: {
      maxTags: [0, 0, 0, 1, 1],
      weaponChangeWithPlayer: false,
      teleportOnTag: false,
      teleportWhenUsingExtraLife: true,
      friendlyFireDeathHandling: 1,
    },
    monarch: {
      overrideMonarchExtraLives: true,
      monarchExtraLives: [0, 0, 0, 1, 1],
      reviveTimer: [5, 5, 0, 1, 0.01],
      surviveTimer: [2, 5, 0, 1, 0.01],
      kingVisibility: 0,
      spawnRadius: [10000, 10000, 0, 1, 0.01],
      changeMonarchBorders: false
    },
    kingOfTheHill: {
      countdownTimer: [15, 15, 0, 1, 0.01],
      firstCrownAssignment: 0,
      shuffleOnSteal: false,
      oldBearerDies: false,
      crownOwnedByTeam: true,
      arrowToCrown: true,
    },
    teams: {
      teamAssignmentMethod: 0,
      spreadMethodNumberOfTeams: [2, 2, 0, 1, 1],
      spreadType: 1,
      fillMethodMaxTanksPerTeam: [1, 1, 0, 1, 1],
      overrideTeamColor: true
    },
    maxPlayers: 20,
    gamesInARow: 1,
    roundEndTimer: [2, 2, 0, 1, 1],
    roundStartTimer: [0, 0, 0, 1, 1],
  },
  
  general: {
    tankCollisionType: 0,
    tankTextVisibility: 2,
    visibleGhostType: 0,
    ghostSpectateType: 0,
  },
  
  maze: {
    enableMaze: true, //
    tileSize: [800, 800, 0, 1, 0.01], //
    tileDimensions: {x: [3, 8, 0, 1, 1], y: [3, 8, 0, 1, 1]}, //
    closedPercentage: [0, 20, 0, 1, 0.01], //
    wallsRemovedPercentage: [0, 20, 0, 1, 0.01], //
    hallwayLength: [1, 1, 0, 1, 1], //
    wallWidth: [10, 10, 0, 1, 1], //
    customChance: 0,
  },
  
  wallTypes: [
    {
      name: "Wall",
      spawnChance: 100,
      castShadow: true,
      restitution: [100, 100, 0, 1, 0.01],
      roughness: [0, 0, 0, 1, 0.01],
      tankDamage: [0, 0, 0, 1, 0.01],
      bounceDamage: [0, 0, 0, 1, 0.01],
      opacity: [100, 100, 0, 1, 0.01],
      hasHitbox: true,
      removeOnCollide: false,
      opacityOnCollide: [100, 100, 0, 1, 0.01],
      opacityFadeTime: [1, 1, 0, 1, 0.01],
      mass: [0, 0, 0, 1, 0.01],
      thickness: [100, 100, 0, 1, 0.01],
      color: 0,
      ignoreIds: 0,
      dieToIds: 0,
      killWithIds: 0,
      spawnLocation: 0,
      id: 0,
    }
  ],
  
  customMazes: [
    [100, 2,  0, -1, -1, -1, -1,  0, -1, -1, -1, -1,  0, -1, -1, -1, -1,  0, -1, -1, -1, -1]
  ],
  
  waitingRoom: {
    size: {width: [4, 4, 0, 1, 1], height: [4, 4, 0, 1, 1]}, //
    spawnMaze: true, //
    spawnBoxes: false,
    lobbyDeathHandlingType: 2,
    ghostReviveTime: [5, 5, 0, 1, 0.01],
  },
};

export let defaultLight = {
  name: "Unnamed Light",
  bubble: [1000, 1000, 0, 1, 0.01],
  visibility: 3,
  opacity: [90, 90, 0, 1, 0.01],
  startAngle: [0, 0, 0, 1, 0.01],
  endAngle: [360, 360, 0, 1, 0.01],
  positionx: [0, 0, 0, 1, 0.01],
  positiony: [0, 0, 0, 1, 0.01],
  visibleWhenLightsOut: true,
  visibleWhenLightsOn: true,
  ignoreWalls: false,
  onlyWithPowerupId: -1
}

export let defaultWall = {
  name: "Wall",
  spawnChance: 100,
  castShadow: true,
  restitution: [100, 100, 0, 1, 0.01],
  roughness: [0, 0, 0, 1, 0.01],
  tankDamage: [0, 0, 0, 1, 0.01],
  bounceDamage: [0, 0, 0, 1, 0.01],
  opacity: [100, 100, 0, 1, 0.01],
  hasHitbox: true,
  removeOnCollide: false,
  opacityOnCollide: [100, 100, 0, 1, 0.01],
  opacityFadeTime: [1, 1, 0, 1, 0.01],
  mass: [0, 0, 0, 1, 0.01],
  thickness: [100, 100, 0, 1, 0.01],
  color: 0,
  ignoreIds: 0,
  dieToIds: 0,
  killWithIds: 0,
  spawnLocation: 0,
  spawnType: 0,
}

export let defaultPowerup = {
  name: "Default Weapon",
  id: 0,
  attachments: [[0, -1, 0, 0.1, 0.1, 0.1, -0.1, -0.1, -0.1, -0.1, 0.1], [-1, -1, 0, 0, 0.04, 0.14, 0.04, 0.14, -0.04, 0, -0.04]],
  appearance: [[0, -1, 0, 0, 0, 0.1]],
  bubbleShape: [[0, 7, 0, 0, 0, 0.1]],
  wallIds: 0,

  spawning: {
    allowSpawning: true,
    spawnPriority: 100,
    fakeSpawnProbability: 0,
    maxSpawns: [0, 0, 0, 1, 1],
    removeOnTimer: false,
    removalTimer: [10, 10, 0, 1, 1],
    spawnEquipped: false, //
    spawnEquippedChance: 100,
    spawnEquippedPriority: 100,
    bubbleSize: [100, 100, 0, 1, 0.01],
    treatAsDefault: false //
  },

  firing: {
    shotReloadTime: [1, 1, 0, 1, 0.01], //
    roundReloadTime: [1, 1, 0, 1, 0.01], //
    shotsPerRound: [3, 3, 0, 1, 1], //
    roundsPerWeapon: [1, 1, 0, 1, 1], //
    quantity: [1, 1, 0, 1, 1],
    countPerBullet: false,
    directionAdditive: [0, 0, 0, 1, 0.01],
    fireLocation: [0, 0, 0, 1, 0.01],
    addLocationToDirection: true,
    totalRecoil: [0, 0, 0, 1, 0.01],
    prefireAnimationLock: [0, 0, 0, 1, 0.01],
    postfireAnimationLock: [0, 0, 0, 1, 0.01],
    firingDistanceFromCenter: [100, 100, 0, 1, 0.01],
    removeAfterEvent: 0,
    removeAfterTimer: [10, 10, 0, 1, 0.01],
    precomputeRoundAttributes: false, //
    precomputeShotAttributes: false, //
    reloadWhenUnequipped: false, //
    removeOnLastRound: true, //
    fireOnPickup: false
  },

  baseAttributes: {
    speed: [120, 120, 0, 1, 1], //
    overrideBase: false,
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
      enabled: false, 
      changePer: {
        secondAdd: [0, 0, 0, 1, 1],
        bounceAdd: [0, 0, 0, 1, 1],
        collisionAdd: [0, 0, 0, 1, 1],
        secondMult: [1, 1, 0, 1, 1],
        bounceMult: [1, 1, 0, 1, 1],
        collisionMult: [1, 1, 0, 1, 1],
      },
      minSpeed: [0, 0, 0, 1, 1],
      maxSpeed: [1000000, 1000000, 0, 1, 1],
      duration: [0, 0, 0, 1, 1],
      effectDelay: [0, 0, 0, 1, 1],
      lockPerBullet: true,
    },
    targeting: {
      enabled: false,
      adjustmentInterval: [0.5, 0.5, 0, 1, 1],
      adjustmentLerp: [90, 90, 0, 1, 1],
      adjustmentInaccuracy: [0, 0, 0, 1, 1],
      effectDelay: [0, 0, 0, 1, 1],
      duration: [10, 10, 0, 1, 1],
      allowTargetingSame: true,
      allowTargetingTeam: true,
      targetBullets: false,
      processType: 0,
      lockPerBullet: true,
    },
    sizeChange: {
      enabled: false,
      changePer: {
        secondAdd: [0, 0, 0, 1, 1],
        bounceAdd: [0, 0, 0, 1, 1],
        collisionAdd: [0, 0, 0, 1, 1],
        secondMult: [1, 1, 0, 1, 1],
        bounceMult: [1, 1, 0, 1, 1],
        collisionMult: [1, 1, 0, 1, 1],
      },
      minSize: [0, 0, 0, 1, 1],
      maxSize: [1000000, 1000000, 0, 1, 1],
      duration: [0, 0, 0, 1, 1],
      effectDelay: [0, 0, 0, 1, 1],
      lockPerBullet: true,
    },
    rangeCut: {
      enabled: false,
      changePer: {
        secondAdd: [0, 0, 0, 1, 1],
        bounceAdd: [0, 0, 0, 1, 1],
        collisionAdd: [0, 0, 0, 1, 1],
        secondMult: [1, 1, 0, 1, 1],
        bounceMult: [1, 1, 0, 1, 1],
        collisionMult: [1, 1, 0, 1, 1],
      },
      maxRange: [600, 600, 0, 1, 1],
      duration: [0, 0, 0, 1, 1],
      effectDelay: [0, 0, 0, 1, 1],
      lockPerBullet: true,
    },
    opacityChange: {
      enabled: false,
      changePer: {
        secondAdd: [0, 0, 0, 1, 1],
        bounceAdd: [0, 0, 0, 1, 1],
        collisionAdd: [0, 0, 0, 1, 1],
        secondMult: [1, 1, 0, 1, 1],
        bounceMult: [1, 1, 0, 1, 1],
        collisionMult: [1, 1, 0, 1, 1],
      },
      minVisibility: [0, 0, 0, 1, 1],
      maxVisibility: [100, 100, 0, 1, 1],
      duration: [0, 0, 0, 1, 1],
      effectDelay: [0, 0, 0, 1, 1],
      lockPerBullet: true,
    },
  },

  health: {
    healthChange: {
      enabled: false,
      changePer: {
        secondAdd: [0, 0, 0, 1, 1],
        bounceAdd: [0, 0, 0, 1, 1],
        collisionAdd: [0, 0, 0, 1, 1],
        secondMult: [1, 1, 0, 1, 1],
        bounceMult: [1, 1, 0, 1, 1],
        collisionMult: [1, 1, 0, 1, 1],
      },
      maxHealth: [1000000, 1000000, 0, 1, 1],
      duration: [0, 0, 0, 1, 1],
      effectDelay: [0, 0, 0, 1, 1],
      lockPerBullet: true,
    },
    damageResistChange: {
      enabled: false,
      changePer: {
        secondAdd: [0, 0, 0, 1, 1],
        bounceAdd: [0, 0, 0, 1, 1],
        collisionAdd: [0, 0, 0, 1, 1],
        secondMult: [1, 1, 0, 1, 1],
        bounceMult: [1, 1, 0, 1, 1],
        collisionMult: [1, 1, 0, 1, 1],
      },
      minResist: [0, 0, 0, 1, 1],
      maxResist: [1000000, 1000000, 0, 1, 1],
      duration: [0, 0, 0, 1, 1],
      effectDelay: [0, 0, 0, 1, 1],
      lockPerBullet: true,
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
      tanks: false,
      maxTankCollisions: [0, 0, 0, 1, 1],
      bullets: false,
      maxBulletCollisions: [0, 0, 0, 1, 1],
    },
    maxCollisionPerTank: [0, 0, 0, 1, 1],
    oneCollisionDamage: [100, 100, 0, 1, 1],
    isLandmine: false,
    freeze: {
      freezesTanks: false,
      freezesBullets: false,
      initialFreezeSpeedMultiplier: [50, 50, 0, 1, 1],
      finalFreezeSpeedMultiplier: [100, 100, 0, 1, 1],
      transitionTime: [5, 5, 0, 1, 1],
      stacks: false,
      conditionPriority: 100,
      overrideBorderColor: false,
      borderColor: 0
    },
    poison: {
      poisonsTanks: false,
      poisonsBullets: false,
      poisonDamageIntervals: [5, 5, 0, 1, 1],
      poisonDuration: [5, 5, 0, 1, 1],
      totalRawDamage: [100, 100, 0, 1, 1],
      totalPercentageDamage: [0, 0, 0, 1, 1],
      allowPoisonKill: false,
      minPoisonHealth: 20,
      stacks: false,
      conditionPriority: 100,
      overrideBorderColor: false,
      borderColor: 0,
      showDamageFrames: false,
    },
    physicallyCollideWithTanks: false,
    dealNoDamage: false,
  },

  light: {
    createLightBubble: false,
    visibilityType: 0,
    bubbleSize: [5000, 5000, 0, 1, 1],
    bubbleSizeChange: {
      enabled: false,
      changePer: {
        secondAdd: [0, 0, 0, 1, 1],
        bounceAdd: [0, 0, 0, 1, 1],
        collisionAdd: [0, 0, 0, 1, 1],
        secondMult: [1, 1, 0, 1, 1],
        bounceMult: [1, 1, 0, 1, 1],
        collisionMult: [1, 1, 0, 1, 1],
      },
      minSize: [0, 0, 0, 1, 1],
      maxSize: [1000000, 1000000, 0, 1, 1],
      duration: [0, 0, 0, 1, 1],
      effectDelay: [0, 0, 0, 1, 1],
      lockPerBullet: true,
    },
    bubbleOpacity: [90, 90, 0, 1, 1],
    bubbleOpacityChange: {
      enabled: false,
      changePer: {
        secondAdd: [0, 0, 0, 1, 1],
        bounceAdd: [0, 0, 0, 1, 1],
        collisionAdd: [0, 0, 0, 1, 1],
        secondMult: [1, 1, 0, 1, 1],
        bounceMult: [1, 1, 0, 1, 1],
        collisionMult: [1, 1, 0, 1, 1],
      },
      minOpacity: [0, 0, 0, 1, 1],
      maxOpacity: [100, 100, 0, 1, 1],
      duration: [0, 0, 0, 1, 1],
      effectDelay: [0, 0, 0, 1, 1],
      lockPerBullet: true,
    },
    beamDegree: {
      startAngle: [0, 0, 0, 1, 1],
      endAngle: [360, 360, 0, 1, 1],
    },
    pierceWalls: false,
    useAsConcealer: false,
    concealerColor: 0,
    renderOverShadows: false,
    friendlyOpacity: 20,
  },

  particles: {
    fragEvents: {
      destruction: false,
      selfDestruct: false,
      rangeDeath: false,
    },
    fragFireBulletId: -1,
    passiveRelease: {
      enabled: false,
      timer: [1, 1, 0, 1, 0.01],
      lockTimer: true,
      delay: [3, 3, 0, 1, 0.01],
      duration: [0, 0, 0, 1, 0.01],
    },
    passiveReleaseBulletId: -1,
    enableBounceRelease: false,
    maxReleasedBullets: [0, 0, 0, 1, 1],
  },

  multifire: {
    multifiredWeaponId: -1,
    syncronizeFire: false,
    overrideMultifiredReload: true,
  },

  parentEffects: {
    disableBullets: false,
    applyEffectsOnCollect: false,
    applyEffectsOnHit: false,
    playerOpacity: {
      enabled: false,
      start: [0, 0, 0, 1, 0.01],
      end: [100, 100, 0, 1, 0.01],
      duration: [5, 5, 0, 1, 0.01],
      lerp: [1, 1, 0, 1, 0.01],
      processType: 3
    },
    playerSpeed: {
      enabled: false,
      start: [150, 150, 0, 1, 0.01],
      end: [100, 100, 0, 1, 0.01],
      duration: [5, 5, 0, 1, 0.01],
      lerp: [1, 1, 0, 1, 0.01],
      processType: 3
    },
    playerVision: {
      enabled: false,
      start: [150, 150, 0, 1, 0.01],
      end: [100, 100, 0, 1, 0.01],
      duration: [5, 5, 0, 1, 0.01],
      lerp: [1, 1, 0, 1, 0.01],
      processType: 3
    },
    playerBubble: {
      enabled: false,
      start: [150, 150, 0, 1, 0.01],
      end: [100, 100, 0, 1, 0.01],
      changedWallPierce: 0,
      changedVisibilityType: 0,
      duration: [5, 5, 0, 1, 0.01],
      lerp: [1, 1, 0, 1, 0.01],
      processType: 3
    },
    playerHealth: {
      enabled: false,
      added: [100, 100, 0, 1, 0.01]
    },
    playerShield: {
      enabled: false,
      deflectsAttacks: false,
      maxHits: [0, 0, 0, 1, 1],
      maxDefense: [100, 100, 0, 1, 0.01],
      maxDuration: [0, 0, 0, 1, 0.01],
      shieldResistance: [0, 0, 0, 1, 0.01],
      stacks: false,
      conditionPriority: 100,
      shieldColor: 8,
      shieldOpacity: 30,
      shieldRadius: [200, 200, 0, 1, 0.01],
      damageOverflowsToPlayer: true,
    },
  },

  inheriting: {
    onPickupPowerupId: -1,
    onFirePowerupId: -1,
    onRemovalPowerupId: -1,
    equipType: 2
  },

  misc: {
    selfDestruct: 0,
    seeInvisibleType: 1,
    createTrails: false,
    trailLength: 3,
    trailInterval: 0,
    trailSize: 20,
    trailFading: false,
    overrideTrailColor: false,
    trailColor: 0,
    attachPlayerCamera: false,
    stealPlayerControls: false,
    allowMultiControl: false,
    forceMotion: false,
    bounceOnWalls: false,
    rotationSpeed: [90, 90, 0, 1, 1],
    allowUnequip: false,
    deleteOnUnequip: true,
    retainAfterDeath: false,
    showHealthBar: false,
    minOpacity: 0,
    safeFade: 20,
    forceEquip: false,
    forceEquipPriority: 100,
    dieOnTankDeath: false,
  },

}