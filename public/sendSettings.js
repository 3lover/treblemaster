import {clamp, defaultSettings, defaultPowerup, defaultLight, defaultWall, decodePacket, getPacketOffset} from "./util.js";
import {basicDataList, powerupDataList, lightDataList, wallDataList} from "./settingHandler.js";

export function createSettingsArrayBuffer(SS) {
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
        dataValues.push(clamp(usedValue, d.min, d.max, d.minround));
        break;
      }
        // ISS
      case 1: {
        // min
        dataValues.push(clamp(usedValue[0], d.min, d.max, d.minround));
        // max
        dataValues.push(clamp(usedValue[1], d.min, d.max, d.minround));
        // type
        dataValues.push(clamp(usedValue[2], 0, 1, 1));
        // degree
        dataValues.push(clamp(usedValue[3], -1000, 1000, 0.01));
        // round
        dataValues.push(clamp(usedValue[4], 0.000001, 1000000, 0.000001));
        break;
      }
        // string
      case 2: {
        dataValues.push(usedValue.substring(0, d.max));
        break;
      }
        // color
      case 3: {
        dataValues.push(clamp(usedValue, -1, 57, 1));
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

export function processSettingsArrayBuffer(reader, extraTypes = []) {
  let separateDecode = decodePacket(reader, extraTypes);
  let offset = 0;
  
  let SS = structuredClone(defaultSettings);
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
        usedValue[d.value[d.value.length - 1]] = clamp(data[off], d.min, d.max, d.minround);
        off++;
        break;
      }
        // ISS
      case 1: {
        let placeholder = [];
        // min
        placeholder.push(clamp(data[off], d.min, d.max, d.minround));
        off++;
        // max
        placeholder.push(clamp(data[off], d.min, d.max, d.minround));
        off++;
        // type
        placeholder.push(clamp(data[off], 0, 1, 1));
        off++;
        // degree
        placeholder.push(clamp(data[off], -1000, 1000, 0.01));
        off++;
        // round
        placeholder.push(clamp(data[off], 0.000001, 1000000, 0.000001));
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
        usedValue[d.value[d.value.length - 1]] = clamp(data[off], -1, 57, 1);
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
  let data = decodePacket(reader, dataTypes, getPacketOffset(reader, extraTypes));
  data.splice(0, 1);
  
  for (let d of basicDataList) {
    let usedValue = SS;
    for (let i = 0; i < d.value.length - 1; i++) usedValue = usedValue[d.value[i]];
    offset = getTypedData(d, offset, usedValue, data);
  }
  
  SS.powerups = [];
  let Poffset = 0;
  while (Poffset < data[offset].length) {
    let DP = structuredClone(defaultPowerup);
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
    let DL = structuredClone(defaultLight);
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
    let DW = structuredClone(defaultWall);
    for (let d of wallDataList) {
      let usedValue = DW;
      for (let i = 0; i < d.value.length - 1; i++) usedValue = usedValue[d.value[i]];
      Woffset = getTypedData(d, Woffset, usedValue, data[offset]);
    }
    SS.wallTypes.push(DW);
  }
  return [SS, separateDecode];
}