const Math2 = require("./Math2.js");


/**
  An array of settings to verify formatted as:
  Setting Name, Setting Type <0 int, 1 string, 2 boolean>, {Boundaries}
*/

exports.gameConfigData = [
  ["maxplayers", 0, {upper: 100, lower: 2, round: 1}]
];

/**
  Converts a UIntArray to a String
  @param {UIntArray Reader} reader - The DataView we use to read the array
*/
exports.convertIntArrayToString = function(reader, initialOffset) {
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
exports.decodePacket = function (reader, dataTypes, initialOffset = 0) {
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
        let decodedString = exports.convertIntArrayToString(reader, offset);
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

/**
Calculates the length of a set of dataTypes
*/
exports.getPacketOffset = function (reader, dataTypes) {
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
        let decodedString = exports.convertIntArrayToString(reader, offset);
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
exports.encodePacket = function (data, dataTypes) {
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


function logMatrix(m, l) {
  for (let i of m) {
    let line = ""
    for (let j of i) {
      if (l === undefined) line += JSON.stringify(j) + ", ";
      else line += j[l] + ", ";
    }
    console.log(line);
  }
}
/**
Returns a matrix of cells that form a possible maze
*/
exports.generateMaze = function(properties) {
  // initialize all cell values
  const mazeArea = properties.xTiles * properties.yTiles;
  let returnedMaze = [];
  for (let i = 0; i < properties.yTiles; i++) {
    returnedMaze.push(new Array(properties.xTiles));
    for (let j = 0; j < returnedMaze[i].length; j++) returnedMaze[i][j] = {
      left: [!properties.wrap, -1],
      right: [true, -1],
      top: [!properties.wrap, -1],
      bottom: [true, -1],
      closed: properties.closedTiles === 0 ? 0 : 1,
      reached: 0
    };
  }
  
  let center = [Math.floor(properties.yTiles / 2), Math.floor(properties.xTiles / 2)];
  let openNeeded = Math.floor(mazeArea * (100 - properties.closedTiles)/100);
  if (properties.neverShortenHallways) {
    properties.hallwayLength = Math.min(Math.min(Math.floor(properties.yTiles/2) - 1, Math.floor(properties.xTiles/2) - 1), properties.hallwayLength);
    properties.hallwayLength = Math.max(1, properties.hallwayLength);
  }
  // now that we have a fully closed matrix, go through and cut holes out of it until we reach our quota
  if (properties.closedTiles !== 0) {
    let openedAreas = 1;
    let openedTiles = [];
    returnedMaze[center[0]][center[1]].closed = 0;
    openedTiles.push(center);

    while (openedAreas < openNeeded) {
      let tileId = Math.floor(Math.random() * openedTiles.length);
      let baseTile = openedTiles[tileId];
      let directions = [0, 1, 2, 3];
      while (directions.length > 0) {
        // get a random direction
        let direction = Math.floor(Math.random() * directions.length);
        direction = directions.splice(direction, 1)[0];
        // if it runs us into a border, change the hallway length to the distance to the edge of the map
        // if we are on wrap mode, we can ignore this
        let usedDistance = properties.hallwayLength;
        if (!properties.wrap) {
          if (direction === 0) usedDistance = Math.min(usedDistance, baseTile[1]);
          if (direction === 1) usedDistance = Math.min(usedDistance, properties.yTiles - 1 - baseTile[0]);
          if (direction === 2) usedDistance = Math.min(usedDistance, properties.xTiles - 1 - baseTile[1]);
          if (direction === 3) usedDistance = Math.min(usedDistance, baseTile[0]);
        }
        if (usedDistance === 0) continue;
        
        if (properties.neverShortenHallways && usedDistance !== properties.hallwayLength) continue;
        // unclose all tiles in the given direction
        
        for (let j = 1; j <= usedDistance; j++) {
          if (openedAreas >= openNeeded) break;
          let changedInput = (baseTile[1] - j + properties.xTiles) % properties.xTiles;
          if (direction === 0 && returnedMaze[baseTile[0]][changedInput].closed) {
            returnedMaze[baseTile[0]][changedInput].closed = 0;
            openedTiles.push([baseTile[0], changedInput]);
            openedAreas++;
          }
          changedInput = (baseTile[0] + j) % properties.yTiles;
          if (direction === 1 && returnedMaze[changedInput][baseTile[1]].closed) {
            returnedMaze[changedInput][baseTile[1]].closed = 0;
            openedTiles.push([changedInput, baseTile[1]]);
            openedAreas++;
          }
          changedInput = (baseTile[1] + j) % properties.xTiles;
          if (direction === 2 && returnedMaze[baseTile[0]][changedInput].closed) {
            returnedMaze[baseTile[0]][changedInput].closed = 0;
            openedTiles.push([baseTile[0], changedInput]);
            openedAreas++;
          }
          changedInput = (baseTile[0] - j + properties.yTiles) % properties.yTiles;
          if (direction === 3 && returnedMaze[changedInput][baseTile[1]].closed) {
            returnedMaze[changedInput][baseTile[1]].closed = 0;
            openedTiles.push([changedInput, baseTile[1]]);
            openedAreas++;
          }
        }
        break;
      }
      if (openedAreas >= openNeeded) break;
    }
  }
  
  // now that we have the cookie cutter outline of our maze, let's delete some walls to match it
  // we use Prim's algorithm, starting the the midpoint we calculated earlier
  returnedMaze[center[0]][center[1]].reached = 1;
  let reachedTiles = [[center[0], center[1]]];
  let totalReached = 1;
  while (totalReached < openNeeded) {
    let startingTileIndex = Math.floor(Math.random() * reachedTiles.length);
    let startingTileLoc = reachedTiles[startingTileIndex];
    let startingTile = returnedMaze[startingTileLoc[0]][startingTileLoc[1]];
    
    let directions = [0, 1, 2, 3];
    while (directions.length > 0) {
      let direction = Math.floor(Math.random() * directions.length);
      direction = directions.splice(direction, 1)[0];
      let endTile = null;
      if (direction === 0) {
        if (!properties.wrap && startingTileLoc[1] + 1 >= returnedMaze[0].length) continue;
        else endTile = returnedMaze[startingTileLoc[0]][(startingTileLoc[1] + 1) % properties.xTiles];
      }
      if (direction === 1) {
        if (!properties.wrap && startingTileLoc[0] + 1 >= returnedMaze.length) continue;
        else endTile = returnedMaze[(startingTileLoc[0] + 1) % properties.yTiles][startingTileLoc[1]];
      }
      if (direction === 2) {
        if (!properties.wrap && startingTileLoc[1] - 1 < 0) continue;
        else endTile = returnedMaze[startingTileLoc[0]][(startingTileLoc[1] - 1 + properties.xTiles) % properties.xTiles];
      }
      if (direction === 3) {
        if (!properties.wrap && startingTileLoc[0] - 1 < 0) continue;
        else endTile = returnedMaze[(startingTileLoc[0] - 1 + properties.yTiles) % properties.yTiles][startingTileLoc[1]];
      }
      
      if (direction === 0 && !endTile.closed && !endTile.reached) {
        startingTile.right[0] = false;
        endTile.left[0] = false;
        reachedTiles.push([startingTileLoc[0], (startingTileLoc[1] + 1) % properties.xTiles]);
        endTile.reached = 1;
        totalReached++;
      }
      if (direction === 1 && !endTile.closed && !endTile.reached) {
        startingTile.bottom[0] = false;
        endTile.top[0] = false;
        reachedTiles.push([(startingTileLoc[0] + 1) % properties.yTiles, startingTileLoc[1]]);
        endTile.reached = 1;
        totalReached++;
      }
      if (direction === 2 && !endTile.closed && !endTile.reached) {
        startingTile.left[0] = false;
        endTile.right[0] = false;
        reachedTiles.push([startingTileLoc[0], (startingTileLoc[1] - 1 + properties.xTiles) % properties.xTiles]);
        endTile.reached = 1;
        totalReached++;
      }
      if (direction === 3 && !endTile.closed && !endTile.reached) {
        startingTile.top[0] = false;
        endTile.bottom[0] = false;
        reachedTiles.push([(startingTileLoc[0] - 1 + properties.yTiles) % properties.yTiles, startingTileLoc[1]]);
        endTile.reached = 1;
        totalReached++;
      }
    }
    if (directions.length === 0) reachedTiles.splice(startingTileIndex, 1);
  }
  
  // go through all the closed tiles now that we are done with other walls, and remove the walls between them
  for (let i = 0; i < returnedMaze.length; i++) {
    for (let j = 0; j < returnedMaze[0].length; j++) {
      if (!returnedMaze[i][j].closed) continue;
      let changedInput = (i - 1 + properties.yTiles) % properties.yTiles;
      if ((properties.wrap || i > 0) && returnedMaze[changedInput][j].closed) {
        returnedMaze[i][j].top[0] = false;
        returnedMaze[changedInput][j].bottom[0] = false;
      }
      changedInput = (i + 1) % properties.yTiles;
      if ((properties.wrap || i < returnedMaze.length - 1) && returnedMaze[changedInput][j].closed) {
        returnedMaze[i][j].bottom[0] = false;
        returnedMaze[changedInput][j].top[0] = false;
      }
      changedInput = (j - 1 + properties.xTiles) % properties.xTiles;
      if ((properties.wrap || j > 0) && returnedMaze[i][changedInput].closed) {
        returnedMaze[i][j].left[0] = false;
        returnedMaze[i][changedInput].right[0] = false;
      }
      changedInput = (j + 1) % properties.xTiles;
      if ((properties.wrap || j < returnedMaze[0].length - 1) && returnedMaze[i][changedInput].closed) {
        returnedMaze[i][j].right[0] = false;
        returnedMaze[i][changedInput].left[0] = false;
      }
    }
  }
  
  // remove some walls if we are into that
  let removableWalls = [];
  for (let i = 0; i < returnedMaze.length; i++) {
    for (let j = 0; j < returnedMaze[0].length; j++) {
      if (returnedMaze[i][j].closed) continue;
      // check bottom wall of everything but far bottom
      if (properties.wrap || i < returnedMaze.length - 1) {
        if (!returnedMaze[(i + 1) % properties.yTiles][j].closed) removableWalls.push([i, j, 0]);
      }
      // check right wall of everything but far right
      if (properties.wrap || j < returnedMaze[0].length - 1) {
        if (!returnedMaze[i][(j + 1) % properties.xTiles].closed) removableWalls.push([i, j, 1]);
      }
    }
  }
  let wallsRemoved = Math.floor(properties.wallsRemovedPercentage * removableWalls.length / 100);
  for (let i = 0; i < wallsRemoved; i++) {
    let removingWall = Math.floor(Math.random() * removableWalls.length);
    let wallInfo = removableWalls[removingWall];
    returnedMaze[wallInfo[0]][wallInfo[1]][wallInfo[2] === 1 ? "right" : "bottom"][0] = false;
    if (wallInfo[2] === 1) returnedMaze[wallInfo[0]][(wallInfo[1] + 1) % properties.xTiles].left[0] = false;
    if (wallInfo[2] === 0) returnedMaze[(wallInfo[0] + 1) % properties.yTiles][wallInfo[1]].top[0] = false;
    removableWalls.splice(removingWall, 1);
  }
  return returnedMaze;
}

/**
Interpret Setting Syntax

syntax follows the form
[lower,upper,distributionType,distributionStrength]

lower is the lowest possible value
upper is the highest possible value
distribution type is 0: exponential, 1: beta
distribution strength affects the distribution skew, 1 is normall linear
rounding is the lowest signifigant figure
*/
const jStat = require("jstat");
exports.ISS = function(syntax) {
  let randomness = syntax[1] - syntax[0];
  let finalAnswer = 0;
  switch(syntax[2]) {
    case 0: {
      // exponential function, higher numbers mean a lower average, lower numbers mean a higher average
      finalAnswer = syntax[0] + randomness * Math.pow(Math.random(), syntax[3]);
      break;
    }
    case 1: {
      // beta function, higher numbers input cause more average results, lower numbers input cause more edge case results 
      finalAnswer = syntax[0] + randomness * jStat.beta.cdf(Math.random(), 1/syntax[3], 1/syntax[3]);
      break;
    }
  }
  
  return Math2.clamp(Math.round(finalAnswer / syntax[4]) * syntax[4], syntax[0], syntax[1]);
}

exports.settingConstrain = function(hostSetting, clientSetting) {
  // client direct set
  if (hostSetting.constrainType === 3) return clientSetting.value;
  // host direct set
  if (hostSetting.constrainType === 4) return hostSetting.value;
  
  // client random number set
  if (hostSetting.constrainType === 0) return exports.ISS(clientSetting.value);
  // host random number set
  if (hostSetting.constrainType === 1) return exports.ISS(hostSetting.value);
  // client constrained random number set
  return Math2.clamp(exports.ISS(clientSetting.value), hostSetting.minBound, hostSetting.maxBound);
}

exports.getPriority = function(arr) {
  let total = arr.reduce(function(last, current) {
    return last + current;
  }, 0);
  total *= Math.random();
  for (let i = 0; i < arr.length; i++) {
    if (total < arr[i]) return i;
    total -= arr[i];
  }
  return -1;
}

// yeeted it right off stack overflow
exports.shuffle = function(arr) {
  let currentIndex = arr.length;
  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
  }
  return arr;
}

// checks two sets of ids and returns true if they share a number
exports.matchIds = function(id1, id2) {
  return (id1 & id2) > 0;
}