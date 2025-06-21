let testingvar = false;

import {clamp, defaultSettings, defaultLight, encodePacket, decodePacket, lineIntersect, getIss, RectangleCircle, dist, downloadFile, chop} from "./util.js";
import {createSettingsArrayBuffer, processSettingsArrayBuffer} from "./sendSettings.js";
import {basicDataList, powerupDataList, lightDataList, wallDataList} from "./settingHandler.js";
import {keynames} from "./keynames.js";

const elm = {
  frontPage: document.getElementById("frontpage"),
  settingsPage: document.getElementById("settingspage"),
  playPage: document.getElementById("playpage"),
  
  howToPlayButton: document.getElementById("howtoplaybtn"),
  boardHolder: document.getElementById("boardholder"),
  
  frontTitle: document.getElementById("fronttitle"),
  tonkImg: document.getElementById("tonkimg"),
  tonkImgCaption: document.getElementById("tonkimgcaption"),
  settingsButton: document.getElementById("settingsbutton"),
  playButton: document.getElementById("playbutton"),
  
  settingsBackButton: document.getElementById("settingsbackbutton"),
  settingMusicTab: document.getElementById("settingmusictab"),
  settingGraphicTab: document.getElementById("settinggraphictab"),
  settingMiscTab: document.getElementById("settingmisctab"),
  settingMusicContent: document.getElementById("settingmusiccontent"),
  settingGraphicContent: document.getElementById("settinggraphiccontent"),
  settingMiscContent: document.getElementById("settingmisccontent"),
  
  playBackButton: document.getElementById("playbackbutton"),
  joinButton: document.getElementById("joinbutton"),
  nicknameInput: document.getElementById("nicknameinput"),
  lobbyCodeInput: document.getElementById("lobbycodeinput"),
  
  themeInput: document.getElementById("themeinput"),
  lerpInput: document.getElementById("lerpinput"),
  
  settingViewerHolder: document.getElementById("settingviewerholder"),
  settingPageXButton: document.getElementById("settingpagexbutton"),
  settingPageBackButton: document.getElementById("settingpagebackbutton"),
  settingPageSearchBar: document.getElementById("settingpagesearchbar"),
  settingPageSearchButton: document.getElementById("settingpagesearchbutton"),
  settingPageLeftHolder: document.getElementById("settingpageleftholder"),
  settingPageRightHolder: document.getElementById("settingpagerightholder"),
  settingPageApplyChanges: document.getElementById("settingpageapplychanges"),
  
  rightSettingButton1: document.getElementById("rightsettingbutton1"),
  rightSettingButton2: document.getElementById("rightsettingbutton2"),
  rightSettingButton3: document.getElementById("rightsettingbutton3"),
  rightSettingButton4: document.getElementById("rightsettingbutton4"),
  rightSettingText: document.getElementById("rightsettingtext"),
  rightSettingPartialInput: document.getElementById("rightsettingpartialinput"),
  rightSettingPartialInputLabel: document.getElementById("rightsettingpartialinputlabel"),
  rightSettingFullInput: document.getElementById("rightsettingfullinput"),
  rightSettingSelect: document.getElementById("rightsettingselect"),
  
  editMenuPage: document.getElementById("editmenupage"),
  editMenuBackButton: document.getElementById("editmenubackbutton"),
  editPageHolder: document.getElementById("editpageholder"),
  editMenuTitle: document.getElementById("editmenutitle"),

  issMinInput: document.getElementById("issminvalue"),
  issMaxInput: document.getElementById("issmaxvalue"),
  issRoundInput: document.getElementById("issroundvalue"),
  issStrengthInput: document.getElementById("issstrengthvalue"),
  issDistributionInput: document.getElementById("issdistributionvalue"),
  issMinHolder: document.getElementById("issminholder"),
  issMaxHolder: document.getElementById("issmaxholder"),
  issRoundHolder: document.getElementById("issroundholder"),
  issStrengthHolder: document.getElementById("issstrengthholder"),
  issDistributionHolder: document.getElementById("issdistributionholder"),
  issGraph: document.getElementById("issgraph"),
  issMinConstrain: document.getElementById("issminconstrain"),
  issMaxConstrain: document.getElementById("issmaxconstrain"),
  
  attachmentGeneralHolder: document.getElementById("attachmentgeneralholder"),
  attachmentGeneralGrabber: document.getElementById("attachmentgeneralgrabber"),
  attachmentEditHolder: document.getElementById("attachmenteditholder"),
  attachmentEditGrabber: document.getElementById("attachmenteditgrabber"),
  attachmentAddHolder: document.getElementById("attachmentaddholder"),
  attachmentAddGrabber: document.getElementById("attachmentaddgrabber"),
  attachmentCanvas: document.getElementById("attachmentcanvas"),
  attachmentToggleSnap: document.getElementById("attachmenttogglesnap"),
  attachmentLockGrid: document.getElementById("attachmentlockgrid"),
  attachmentViewMode: document.getElementById("attachmentviewmode"),
  attachmentChangeColor: document.getElementById("attachmentchangecolor"),
  attachmentChangeLayer: document.getElementById("attachmentchangelayer"),
  attachmentResetDraft: document.getElementById("attachmentresetdraft"),
  attachmentAddCircle: document.getElementById("attachmentaddcircle"),
  attachmentAddRectangle: document.getElementById("attachmentaddrectangle"),
  attachmentAddCustom: document.getElementById("attachmentaddcustom"),
  attachmentAddSvg: document.getElementById("attachmentaddsvg"),
  attachmentDeleteSelected: document.getElementById("attachmentdeleteselected"),
  attachmentMakePremade: document.getElementById("attachmentmakepremade"),
  attachmentImportPremade: document.getElementById("attachmentimportpremade"),
  attachmentChangeConnect: document.getElementById("attachmentchangeconnect"),
  
  customMazeHolder: document.getElementById("custommazeholder"),
  customMazeCanvas: document.getElementById("custommazecanvas"),
  customMazeWallTypes: document.getElementById("custommazewalltypes"),
  customMazeDelete: document.getElementById("custommazedelete"),
  customMazeSpawnPriority: document.getElementById("custommazespawnpriority"),
  customMazeX: document.getElementById("custommazex"),
  customMazeY: document.getElementById("custommazey"),
  customMazeWallTypesDesc: document.getElementById("custommazewalltypesdesc"),
  customMazeSpawnPriorityDesc: document.getElementById("custommazespawnprioritydesc"),
  customMazeXDesc: document.getElementById("custommazexdesc"),
  customMazeYDesc: document.getElementById("custommazeydesc"),
  customMazeBar: document.getElementById("custommazebar"),
  
  popupPage: document.getElementById("popuppage"),
  popupCover: document.getElementById("popupcover"),
  popupTitle: document.getElementById("popuppagetitle"),
  popupText: document.getElementById("popuppagetext"),
  
  backpack: document.getElementById("backpack"),
  backpackHider: document.getElementById("backpackhider"),
  
  leaderboard: document.getElementById("leaderboard"),
  leaderboardText: document.getElementById("leaderboardtext"),
  leaderboardHider: document.getElementById("leaderboardhider"),
  
  gameTimer: document.getElementById("gametimer"),
  
// special
  root: document.documentElement
};

const localData = {
  openPages: [0],
  previousPages: [],
  frontTitleTimeout: null,
  frontTitleCombo: 0,
  pwettyWainbowMode: false,
  openSettingTab: 0,
  settingWindowOpen: false,
  selectedLoadout: 0,
  settingPageId: 1,
  layoutType: 0,
  searchingForSetting: false,
  currentSettingPage: null,
  currentSubsetting: 0,
  editingSettingData: {},
  hostLoadout: 0,
  currentPowerupId: 0,
  currentLightId: 0,
  currentWallId: 0,
  advancedEditing: false,
  attachmentSelectedShape: null,
  attachmentSnapping: 0,
  attachmentViewMode: 0,
  attachmentSelectedVertice: null,
  attachmentLockGrid: false,
  attachmentMakingShape: false,
  customPoints: [],
  attachmentCopy: null,
  attachmentUndoHistorySpot: 0,
  undoHistory: [],
  AO: {x: 0, y: 0, s: 1},
  selectedMaze: 0,
  selectedWall: -1,
  changeWallSelection: true,
  wallOpposite: 0,
  baseOffset: {x: 0, y: 0},
  leaderboardInfo: [],
  expectedTimer: -1,
  expectedTimerEnd: -1,
  preloadedSVGs: new Map(),
  keybinding: false
}

let saveData = {
  lerpValue: 40,
  playerName: "",
  lobbyCode: "code",
  theme: "dark",
  keybinds: {
    forwardkey: [38, 87],
    backwardkey: [40, 83],
    rightkey: [39, 68],
    leftkey: [37, 65],
    firekey: [32],
    enterkey: [13],
    actionkey: [90],
    unequipkey: [88],
    leavekey: [27]
  }
}

/**
sets our initial canvas size and creates a function to resize the canvas context when resizing the window
*/
let canvas = document.getElementById("gamecanvas");
let gameCtx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let maskCanvas = document.getElementById("maskcanvas");
let maskCtx = maskCanvas.getContext("2d");
maskCanvas.width = canvas.width;
maskCanvas.height = canvas.height;
let shadowCutCanvas = document.getElementById("shadowcutcanvas");
let shadowCtx = shadowCutCanvas.getContext("2d");
shadowCutCanvas.width = canvas.width;
shadowCutCanvas.height = canvas.height;
let shadowMasterCanvas = document.getElementById("shadowmastercanvas");
let shadowMasterCtx = shadowMasterCanvas.getContext("2d");
shadowMasterCanvas.width = canvas.width;
shadowMasterCanvas.height = canvas.height;
let attctx = elm.attachmentCanvas.getContext("2d");
elm.attachmentCanvas.width = canvas.width;
elm.attachmentCanvas.height = canvas.height * 0.9;
let cusctx = elm.customMazeCanvas.getContext("2d");
elm.customMazeCanvas.width = canvas.width * 0.6;
elm.customMazeCanvas.height = canvas.height * 0.9;

let R = canvas.height * (16/9) > canvas.width ? canvas.height * (16/9) : canvas.width;
let minDim = canvas.height > canvas.width ? canvas.width : canvas.height;
gameCtx.translate(canvas.width/2, canvas.height/2);
maskCtx.translate(canvas.width/2, canvas.height/2);
shadowCtx.translate(canvas.width/2, canvas.height/2);
shadowMasterCtx.translate(canvas.width/2, canvas.height/2);
attctx.translate(canvas.width/2, canvas.height * 0.9/2);
cusctx.translate(canvas.width * 0.6/2, canvas.height * 0.9/2);
window.addEventListener("resize", function() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  shadowCutCanvas.width = canvas.width;
  shadowCutCanvas.height = canvas.height;
  shadowMasterCanvas.width = canvas.width;
  shadowMasterCanvas.height = canvas.height;
  elm.attachmentCanvas.width = canvas.width;
  elm.attachmentCanvas.height = canvas.height * 0.9;
  elm.customMazeCanvas.width = canvas.width * 0.6;
  elm.customMazeCanvas.height = canvas.height * 0.9;
  
  R = canvas.height * (16/9) > canvas.width ? canvas.height * (16/9) : canvas.width;
  minDim = canvas.height > canvas.width ? canvas.width : canvas.height;
  gameCtx.translate(canvas.width/2, canvas.height/2);
  maskCtx.translate(canvas.width/2, canvas.height/2);
  shadowCtx.translate(canvas.width/2, canvas.height/2);
  shadowMasterCtx.translate(canvas.width/2, canvas.height/2);
  attctx.translate(canvas.width/2, canvas.height * 0.9/2);
  cusctx.translate(canvas.width * 0.6/2, canvas.height * 0.9/2);
  
  let settingLoc = SS[localData.selectedLoadout];
  if (localData.editingSettingData.location === undefined) return;
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
  graphIss(settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]]);
});

/**
basically an enum with our protocol meanings
*/
const protocol = {
  "log": 0,
  "host": 1,
  "join": 2,
  "serverlog": 3,
  "gameupdate": 4,
  "left": 5,
  "right": 6,
  "up": 7,
  "down": 8,
  "confirmConnection": 9,
  "kick": 10,
  "alreadyExists": 11,
  "space": 12,
  "action": 13,
  "clientSendSettings": 14,
  "failedToSendSettings": 15,
  "enter": 16,
  "unequip": 17,
  "backpackClicked": 18,
  "forcedWaitingRoom": 19,
  "leaderboardInfo": 20,
  "timerUpdate": 21,
  "sendHostSettings": 22
}

const socketData = {
  objects: [],
  lights: [],
  borders: null,
  trueBorders: null,
  nearestCrown: {x: 0, y: 0},
  trueNearestCrown: {x: 0, y: 0}
}

let SS = [];
if (localStorage.getItem("SS")) {
  SS = JSON.parse(decodeURIComponent(atob(localStorage.getItem("SS"))));
  
  for (let i = SS.length - 1; i >= 0; i--) {
    if (!SS[i].metadata.owned) SS.splice(i, 1);
    else SS[i].metadata.hosted = false;
  }
  
  // go through our data lists and fill in anything missed
  let defaultData = structuredClone(defaultSettings);
  for (let i = 0; i < SS.length; i++) {
    // basic loadout stuff
    for (let basicData of basicDataList) {
      let location = SS[i];
      let defaultLoc = defaultData;
      for (let loc of basicData.value) {
        defaultLoc = defaultLoc[loc];
        if (location[loc] === undefined || typeof location[loc] !== typeof defaultLoc) location[loc] = structuredClone(defaultLoc);
        location = location[loc];
      }
    }
    // within each loadout, go through every powerup too
    for (let j = 0; j < SS[i].powerups.length; j++) {
      for (let powerupData of powerupDataList) {
        let location = SS[i].powerups[j];
        let defaultLoc = defaultData.powerups[0];
        for (let loc of powerupData.value) {
          defaultLoc = defaultLoc[loc];
          if (location[loc] === undefined || typeof location[loc] !== typeof defaultLoc) location[loc] = structuredClone(defaultLoc);
          location = location[loc];
        }
      }
    }
    // now let's check every wall type because you never know I guess...
    for (let j = 0; j < SS[i].wallTypes.length; j++) {
      for (let wallData of wallDataList) {
        let location = SS[i].wallTypes[j];
        let defaultLoc = defaultData.wallTypes[0];
        for (let loc of wallData.value) {
          defaultLoc = defaultLoc[loc];
          if (location[loc] === undefined || typeof location[loc] !== typeof defaultLoc) location[loc] = structuredClone(defaultLoc);
          location = location[loc];
        }
      }
    }
    let defaultLightData = structuredClone(defaultLight);
    // last and certainly least, go through each light
    for (let j = 0; j < SS[i].personal.lights.length; j++) {
      for (let lightData of lightDataList) {
        let location = SS[i].personal.lights[j];
        let defaultLoc = defaultLightData;
        for (let loc of lightData.value) {
          defaultLoc = defaultLoc[loc];
          if (location[loc] === undefined || typeof location[loc] !== typeof defaultLoc) location[loc] = structuredClone(defaultLoc);
          location = location[loc];
        }
      }
    }
  }
}
else {
  SS.push(structuredClone(defaultSettings));
  SS[0].powerups[0].spawning.spawnEquipped = true;
  SS[0].powerups[0].spawning.treatAsDefault = true;
  SS[0].powerups[0].spawning.allowSpawning = false;
}

let pageColors;
async function fetchPageColors() {
  pageColors = await (await fetch("./json/colors.json")).json();
  setPageColors();
}
function setPageColors() {
  let usedTheme = pageColors[saveData.theme];
  for (let i = 0; i < Object.keys(usedTheme).length; i++) {
    elm.root.style.setProperty(Object.keys(usedTheme)[i], Object.values(usedTheme)[i]);
  }
  
  // add all the color options to the attachment color select menu
  for (let i = elm.attachmentChangeColor.options.length - 1; i >= 0; i--) {
    elm.attachmentChangeColor.remove(i);
  }
  for (let i = -2; i < Object.values(pageColors[saveData.theme]).length; i++) {
    let option = document.createElement("option");
    let selectedColor = i === -1 ? pageColors[saveData.theme]["--red"] : i === -2 ? pageColors[saveData.theme]["--white"] : Object.values(pageColors[saveData.theme])[i];
    option.style.backgroundColor = selectedColor;
    option.style.color = getReadableTextColor(selectedColor);
    switch (i) {
      case -1: {
        option.text = "Fill Color";
        break;
      }
      case -2: {
        option.text = "Border Color";
        break;
      }
      case 55: {
        option.text = "Rainbow";
        break;
      }
      case 56: {
        option.text = "Strobe Rainbow";
        break;
      }
      default: {
        option.text = `Color ${i + 1}`;
        break;
      }
    }
    option.value = i;
    elm.attachmentChangeColor.add(option);
  }
}

// returns a random color from the theme
function randomColor() {
  let usedTheme = pageColors[saveData.theme];
  return Object.values(usedTheme)[Math.floor(Object.keys(usedTheme).length * Math.random())];
}

// breaks down colors in form #rrggbb
function getReadableTextColor(color) {
  const rgb = parseInt(`0x${color.slice(1)}`, 16);
  const total = ((rgb >> 16) & 0xff) + ((rgb >> 8) & 0xff) + (rgb & 0xff);
  if (total > 500 || ((rgb >> 8) & 0xff) > 200) return "#000000";
  else return "#ffffff";
}

function getColor(colorid) {
  if (pageColors === undefined) return "#000000";
  // smooth rainbow
  if (colorid === 55) return Object.values(pageColors[saveData.theme])[Math.floor(new Date().getTime() / 1000) % 8 * 6 + 7];
  // flashy rainbow
  if (colorid >= 56 || colorid < 0) return Object.values(pageColors[saveData.theme])[Math.floor(Math.random() * 55)];
  // otherwise pull the color from our theme
  return Object.values(pageColors[saveData.theme])[colorid];
}

/**
basic lerp function, accepts quadratic
@param {Number} start - the number at 0
@param {Number} end - the number at 1
@param {Number} transition - the number of the shift from 0 to 1
@param {Number} quadratic - the quadratic, 1 being linear
*/
function lerp(start, end, transition = 0.5, quadratic = 1) {
  return start + (end - start) * Math.pow(transition, quadratic);
}
/**
creates a canvas mesh of whatever shape has been provided, allowing stroking or filling later
@param {Canvas Context} ctx - the 2d context for the canvas we are drawing on
@param {Array} vertices - An array of points to connect and make a shape out of, ex: 0, 0, 1, 0, 1, 1, 0, 1 forms a square
@param {Vector} offset - the x and y relative to the vertices
@param {Vector} scaling - the scale relative to the vertices
*/
function drawShape(ctx, vertices, offset, scaling) {
  ctx.beginPath();
  
  if (vertices.length === 1) {
    ctx.arc(offset.x * scaling, offset.y * scaling, vertices[0] * scaling, 0, Math.PI * 2);
    return;
  }
  
  ctx.moveTo((vertices[0] + offset.x) * scaling, (vertices[1] + offset.y) * scaling);
  for (let v = 0; v < vertices.length; v += 2) {
    ctx.lineTo((vertices[v] + offset.x) * scaling, (vertices[v + 1] + offset.y) * scaling);
  }
  ctx.closePath();
}

class Socket {
	constructor() {
		this.socket = null;
    this.connected = false;
	}
  
  connect() {
    if (this.socket !== null) return;
    this.socket = new WebSocket("wss://" + location.host + "/ws");
    this.socket.binaryType = "arraybuffer";
    this.socket.onopen = () => this.open();
		this.socket.onmessage = (data) => this.message(data);
		this.socket.onerror = (error) => this.error(error);
		this.socket.onclose = (reason) => this.close(reason);
  }
  
  disconnect() {
    if (this.socket === null) return;
    this.socket.close();
    this.socket = null;
    this.connected = false;
    socketData.objects = [];
    socketData.lights = [];
    socketData.borders = null;
    socketData.trueBorders = null;
    socketData.nearestCrown = {x: 0, y: 0};
    socketData.trueNearestCrown = {x: 0, y: 0};
  }

	talk(data) {
    if (this.socket === null) return;
		if (this.socket.readyState === 1) this.socket.send(data);
    else setTimeout(() => {this.talk(data)}, 100);
	}

	message(packet) {
    let reader = new DataView(packet.data);
    
		switch (reader.getInt8(0)) {
      case protocol.confirmConnection: {
        if (!this.connected) {
          let sendingSettingsTypes = createSettingsArrayBuffer(SS[0]);
          let sendData = [protocol.host, saveData.playerName, saveData.lobbyCode, "Default Lobby Name", ...sendingSettingsTypes[0]];
          let sendTypes = ["int8", "string", "string", "string", ...sendingSettingsTypes[1]];
          this.talk(encodePacket(sendData, sendTypes));
        }
        this.connected = true;
        break;
      }
      case protocol.serverlog: {
        console.log(decodePacket(reader, ["int8", "string"])[1]);
        break;
      }
      case protocol.kick: {
        let p = decodePacket(reader, ["int8", "string", "string"]);
        createPopup(
            0,
            p[1], 
            p[2],
            ["Ok"],
            [function() {}],
        );
        break;
      }
      case protocol.sendHostSettings: {
        let processedSettings = structuredClone(processSettingsArrayBuffer(reader, ["int8"])[0]);
        processedSettings.metadata.hosted = true;
        processedSettings.metadata.owned = false;
        let idFound = false;
        for (let i = SS.length - 1; i >= 0; i--) {
          if (SS[i].metadata.loadoutId === processedSettings.metadata.loadoutId && SS[i].metadata.name === processedSettings.metadata.name) {
            SS[i].metadata.hosted = true;
            idFound = true;
          }
          else if (SS[i].metadata.hosted) {
            if (SS[i].metadata.owned) SS[i].metadata.hosted = false;
            else SS.splice(i, 1);
          }
        }
        if (!idFound) SS.splice(1, 0, processedSettings);
        
        localData.preloadedSVGs = new Map();
        setupSettingPage();
        break;
      }
      case protocol.timerUpdate: {
        let p = decodePacket(reader, ["int8", "float32"]);
        if (localData.expectedTimer >= 0 && p[1] < 0) elm.gameTimer.style.opacity = "0";
        else if (localData.expectedTimer < 0 && p[1] >= 0) elm.gameTimer.style.opacity = "";
        localData.expectedTimer = p[1];
        localData.expectedTimerEnd = new Date().getTime() + p[1] * 1000;
        break;
      }
      case protocol.leaderboardInfo: {
        let p = decodePacket(reader, ["int8", "int8", "string", "repeat", "string", "int8", "end"]);
        let same = p[2] === localData.leaderboardInfo[2] && p[3].length === localData.leaderboardInfo[3].length;
        for (let i = 0; i < p[3].length; i++) {
          if (!same) break;
          if (localData.leaderboardInfo[3][i] !== p[3][i]) same = false;
        }
        if (!same) {
          localData.leaderboardInfo = p;
          if (p[1] === 0) {
            elm.leaderboard.style.opacity = "0";
            elm.leaderboardHider.style.opacity = "0";
          }
          else {
            elm.leaderboard.style.opacity = "";
            elm.leaderboardHider.style.opacity = "";
          }
          while (elm.leaderboard.childElementCount > 1) elm.leaderboard.removeChild(elm.leaderboard.lastChild);
          elm.leaderboardText.innerText = p[2];
          for (let i = 0; i < p[3].length; i += 2) {
            let scorecard = document.createElement("p");
            scorecard.innerText = p[3][i];
            let scorecardColor = getColor(p[3][i + 1]);
            scorecard.style.color = scorecardColor;
            scorecard.style.backgroundColor = getReadableTextColor(scorecardColor);
            elm.leaderboard.appendChild(scorecard);
          }
        }
        break;
      }
      case protocol.gameupdate: {
        let packet = decodePacket(reader, ["int8", "float32arrayarray", "float32arrayarray", "float32array", "float32arrayarray"]);
        
        // update our backpack visual
        let b = packet[4];
        if (b[0][0] === 1) {
          while (elm.backpack.childElementCount > 1) elm.backpack.removeChild(elm.backpack.lastChild);
          
          socketData.lastBackpack = b;
          for (let i = 1; i < b.length; i += 2) {
            let power = document.createElement("div");
            let powerName = decodeURIComponent(b[i].reduce(function(constructed, nextChar) {
              return constructed + String.fromCharCode(nextChar);
            }, ""));
            power.innerText = ((i - 1) / 2) + (b[i + 1][1] ? "" : "*") + ") " + powerName
            power.classList.add("backpackitem");
            let powerColor = getColor(b[i + 1][0]);
            power.style.color = powerColor;
            power.style.backgroundColor = getReadableTextColor(powerColor);
            
            power.addEventListener("click", function(e) {
              socket.talk(encodePacket([protocol.backpackClicked, 0, (i - 1) / 2, powerName], ["int8", "int8", "int8", "string"]));
            });
            power.addEventListener("contextmenu", function(e) {
              socket.talk(encodePacket([protocol.backpackClicked, 1, (i - 1) / 2, powerName], ["int8", "int8", "int8", "string"]));
            });
            elm.backpack.appendChild(power);
          }
        }
        
        // update extras
        let e = packet[3];
        if (e[4]) {
          socketData.lights = [];
          socketData.objects = [];
          socketData.borders = null;
        }
        socketData.trueBorders = {
          left: e[0],
          right: e[1],
          top: e[2],
          bottom: e[3]
        }
        socketData.trueNearestCrown = {x: e[5], y: e[6]};
        
        // update lights
        let l = packet[2];
        for (let o of socketData.lights) o.gone--;
        for (let i = 0; i < l.length; i++) {
          let found = false;
          for (let o of socketData.lights) {
            if (o.id === l[i][0]) {
              found = true;
              o.camera = !!l[i][4];
              o.gone = 2;
              o.trueradius = l[i][1];
              o.trueposition = {x: l[i][2], y: l[i][3]};
              o.ignoreWalls = !!l[i][5];
              o.opacity = l[i][6];
              o.truearc = {start: l[i][7], end: l[i][8]};
              o.obfuscator = !!l[i][9];
              o.colorTint = l[i][10];
              o.renderOverShadows = l[i][11];
              break;
            }
          }
          
          if (!found) socketData.lights.push(new LightSource(!!l[i][4], l[i][0], l[i][1], {x: l[i][2], y: l[i][3]}, {
            ignoreWalls: !!l[i][5],
            opacity: l[i][6],
            arc: {start: l[i][7], end: l[i][8]},
            obfuscator: !!l[i][9],
            colorTint: l[i][10],
            renderOverShadows: l[i][11]
          }));
        }
        for (let o = socketData.lights.length - 1; o >= 0; o--) if (socketData.lights[o].gone <= 0) socketData.lights[o].destroy();
        
        // update objects
        let p = packet[1];
        for (let o of socketData.objects) o.gone--;
        for (let i = 0; i < p.length; i += 4) {
          let found = false;
          for (let o of socketData.objects) {
            if (o.id === p[i][0]) {
              found = true;
              o.gone = 2;
              o.truevertices = p[i + 3];
              o.trueposition = {x: p[i][1], y: p[i][2]};
              o.color = p[i][3];
              o.borderColor = p[i][4];
              o.renderOrder = p[i][5];
              o.shadowCaster = !!p[i][6];
              o.borderWidth = p[i][7];
              if (p[i][8]) o.gone = 0;
              o.trueOpacity = p[i][9];
              o.edgeType = p[i][10];
              if (p[i][11] === 1) {
                o.vertices = structuredClone(o.truevertices);
                o.position = structuredClone(o.trueposition);
              }
              o.doNotRender = !!p[i][12];
              o.drawHealthBar = !!p[i][13];
              o.healthPercentage = p[i][14];
              o.healthBarSize = p[i][15];
              if (!!p[i][16]) {
                o.lastDamaged = new Date().getTime();
                o.damagedThisFrame = true;
              }
              o.healthBarColor = p[i][21];
              o.shieldPercentage = p[i][17];
              o.displayName = decodeURIComponent(p[i + 1].reduce(function(constructed, nextChar) {
                return constructed + String.fromCharCode(nextChar);
              }, ""));
              o.trailSize = p[i][18];
              o.trailFading = p[i][19];
              o.trailColor = p[i][20];
              o.realTrailPoints = p[i + 2];
              o.nameColor = p[i][22];
              break;
            }
          }
          if (!found) socketData.objects.push(new RenderObject(p[i + 3], p[i][0], {x: p[i][1], y: p[i][2]}, {
            color: p[i][3],
            borderColor: p[i][4],
            renderOrder: p[i][5],
            shadowCaster: !!p[i][6],
            borderWidth: p[i][7],
            opacity: p[i][9],
            edgeType: p[i][10],
            doNotRender: !!p[i][12],
            drawHealthBar: !!p[i][13],
            healthPercentage: p[i][14],
            healthBarSize: p[i][15],
            healthBarColor: p[i][21],
            shieldPercentage: p[i][17],
            displayName: decodeURIComponent(p[i + 1].reduce(function(constructed, nextChar) {return constructed + String.fromCharCode(nextChar)}, "")),
            trailSize: p[i][18],
            trailFading: p[i][19],
            trailColor: p[i][20],
            trailPoints: p[i + 2],
            nameColor: p[i][22]
          }));
        }
        for (let o = socketData.objects.length - 1; o >= 0; o--) if (socketData.objects[o].gone <= 0) socketData.objects[o].destroy();
        break;
      }
      case protocol.alreadyExists: {
        let p = decodePacket(reader, ["int8", "string", "string"]);
        
        let sendingSettingsTypes = createSettingsArrayBuffer(SS[0]);
        let sendData = [protocol.join, p[1], p[2], ...sendingSettingsTypes[0]];
        let sendTypes = ["int8", "string", "string", ...sendingSettingsTypes[1]];
        
        this.talk(encodePacket(sendData, sendTypes));
        break;
      }
      case protocol.failedToSendSettings: {
        let p = decodePacket(reader, ["int8", "string"]);
        createPopup(
            0,
            "Failed To Update", 
            `${p[1]}\nYour settings have still been locally saved.`,
            ["Ok"],
            [function() {}],
          );
        setupSettingPage(true);
        break;
      }
      case protocol.forcedWaitingRoom: {
        let p = decodePacket(reader, ["int8", "string"]);
        createPopup(
            0,
            "Sent To Waiting Room", 
            p[1],
            ["Ok"],
            [function() {}],
          );
        break;
      }
      default: {
        alert("Unknown message id recieved");
        break;
      }
		}
	}

	open() {
		console.log("Socket connected");
	}

	error(error) {
		console.error(error);
	}

	close(reason) {
		console.log("Socket closed");
	}
}
let socket = new Socket();

/**
Takes a string and converts it to an array of ASCII (uint8) characters
@param {String} convert - The string to convert
*/
function convertStringToIntArray(convert) {
  let intArray = [];
  convert = encodeURIComponent(convert);
  for (let i = 0; i < convert.length; i++) intArray.push(convert.charCodeAt(i) < 128 ? convert.charCodeAt(i) : 63);
  intArray.push(0);
  return intArray;
}

/**
run when the html loads
*/
window.addEventListener("load", function () {
  update();
});

function graphIss(iss) {
  elm.issGraph.width = window.innerWidth;
  elm.issGraph.height = window.innerHeight;
  let issctx = elm.issGraph.getContext("2d");
  issctx.clearRect(0, 0, elm.issGraph.width, elm.issGraph.height);
  
  issctx.lineWidth = minDim/200;
  // make grid lines
  for (let i = 0; i <= 10; i++) {
    issctx.beginPath();
    issctx.strokeStyle = pageColors[saveData.theme]["--grey"];
    issctx.moveTo(elm.issGraph.width * 0.15 + elm.issGraph.width * 0.8 * i/10, elm.issGraph.height * 0.1);
    issctx.lineTo(elm.issGraph.width * 0.15 + elm.issGraph.width * 0.8 * i/10, elm.issGraph.height * 0.9);
    issctx.stroke();
  }
  
  for (let i = 0; i <= 10; i++) {
    issctx.beginPath();
    issctx.strokeStyle = pageColors[saveData.theme]["--grey"];
    issctx.moveTo(0.15 * elm.issGraph.width, elm.issGraph.height * 0.1 + elm.issGraph.height * 0.8 * i/10);
    issctx.lineTo(elm.issGraph.width * 0.95, elm.issGraph.height * 0.1 + elm.issGraph.height * 0.8 * i/10);
    issctx.stroke();
  }
  
  // make center lines
  issctx.strokeStyle = pageColors[saveData.theme]["--greyRed"];
  issctx.beginPath();
  issctx.moveTo(elm.issGraph.width * 0.15 + elm.issGraph.width * 0.8 * 5/10, elm.issGraph.height * 0.1);
  issctx.lineTo(elm.issGraph.width * 0.15 + elm.issGraph.width * 0.8 * 5/10, elm.issGraph.height * 0.9);
  issctx.stroke();
  issctx.beginPath();
  issctx.moveTo(0.15 * elm.issGraph.width, elm.issGraph.height * 0.1 + elm.issGraph.height * 0.8 * 5/10);
  issctx.lineTo(elm.issGraph.width * 0.95, elm.issGraph.height * 0.1 + elm.issGraph.height * 0.8 * 5/10);
  issctx.stroke();
  
  issctx.strokeStyle = pageColors[saveData.theme]["--white"];
  issctx.beginPath();
  
  // label gridlines
  for (let i = 0; i <= 10; i++) {
    issctx.beginPath();
    issctx.fillStyle = pageColors[saveData.theme]["--white"];
    issctx.font = Math.floor(minDim/20) + "px 'JetBrains Mono'";
    issctx.textAlign = "center";
    issctx.textBaseline = "middle";
    issctx.fillText(i/10, elm.issGraph.width * 0.15 + elm.issGraph.width * 0.8 * i/10, elm.issGraph.height * 0.95);
  }
  for (let i = 0; i <= 10; i++) {
    issctx.beginPath();
    issctx.fillStyle = pageColors[saveData.theme]["--white"];
    issctx.font = Math.floor(minDim/20) + "px 'JetBrains Mono'";
    issctx.textAlign = "center";
    issctx.textBaseline = "middle";
    let oldDifference = Math.floor(((iss[1] - iss[0]) * (i - 1)/10 + iss[0]) / iss[4]) * iss[4];
    let difference = Math.floor(((iss[1] - iss[0]) * i/10 + iss[0]) / iss[4]) * iss[4];
    if (i > 0 && i < 10 && difference == oldDifference) continue;
    if (i === 0) difference = iss[0];
    if (i === 10) difference = iss[1];
    issctx.fillText(Math.floor(difference * 1000) / 1000, elm.issGraph.width * 0.075, elm.issGraph.height * 0.1 + elm.issGraph.height * 0.8 - (0.8 * elm.issGraph.height * 0.1 * i), elm.issGraph.width * 0.12);
  }
  
  
  // make the lines itself
  issctx.lineWidth = minDim/100;
  for (let i = 0; i <= 1000; i++) {
    let seededValue = getIss(iss, i/1000) - iss[0];
    issctx.lineTo(elm.issGraph.width * 0.15 + elm.issGraph.width * 0.8 * i/1000, elm.issGraph.height * 0.1 + elm.issGraph.height * 0.8 - (elm.issGraph.height * 0.8 * (seededValue / (iss[1] - iss[0]))));
  }
  issctx.stroke();
}

function resetSettingPage() {
  while (elm.settingPageLeftHolder.lastChild) elm.settingPageLeftHolder.removeChild(elm.settingPageLeftHolder.lastChild);
  elm.rightSettingPartialInput.style.display = "none";
  elm.rightSettingPartialInputLabel.style.display = "none";
  elm.rightSettingSelect.style.display = "none";
  elm.rightSettingFullInput.style.display = "none";
  elm.rightSettingButton1.style.backgroundColor = "";
  elm.rightSettingButton1.style.color = "";
  elm.rightSettingButton1.style.display = "none";
  elm.rightSettingButton2.style.display = "none";
  elm.rightSettingButton3.style.display = "none";
  elm.rightSettingButton4.style.display = "none";
  elm.rightSettingButton1.disabled = false;
  elm.rightSettingButton2.disabled = false;
  elm.rightSettingButton3.disabled = false;
  elm.rightSettingButton4.disabled = false;
  elm.rightSettingButton1.classList.remove("disabledbutton");
  elm.rightSettingButton2.classList.remove("disabledbutton");
  elm.rightSettingButton3.classList.remove("disabledbutton");
  elm.rightSettingButton4.classList.remove("disabledbutton");
  elm.rightSettingText.innerText = "";
}

let settingSearch = null;
function setupSettingPage(changedSettings = false, dontChangeId = false) {
  resetSettingPage();
  if (changedSettings) {
    if (!dontChangeId) SS[localData.selectedLoadout].metadata.loadoutId = Math.floor(Math.random() * 65536);
    openApplyChanges();
  }
  localData.searchingForSetting = false;
  if (settingSearch === null) return;
  let page = null;
  for (let i = 0; i < settingSearch.length; i++) if (localData.settingPageId === settingSearch[i].id) page = settingSearch[i];
  if (page === null) {
    // bring us to the oops page when another page of that id does not exist
    alert("page not found!");
    return;
  }
  elm.settingPageSearchBar.value = page.name;
  localData.currentSettingPage = page;
  
  localData.layoutType = page.layoutType;
  
  if (SS[localData.selectedLoadout].powerups.length <= localData.currentPowerupId) localData.currentPowerupId = 0;
  if (SS[localData.selectedLoadout].personal.lights.length <= localData.currentLightId) localData.currentLightId = 0;
  if (SS[localData.selectedLoadout].wallTypes.length <= localData.currentWallId) localData.currentWallId = 0;
  
  // if we are classified under a powerup, light, or wall type, add that to the top of the left holder before anything
  if (page.classification !== 0) {
    let text = document.createElement("p");
    if (page.classification === 1) {
      text.innerText = `Editing ${SS[localData.selectedLoadout].powerups[localData.currentPowerupId].name}\n\n`;
      text.addEventListener("click", function(e) {
        // if you click the editing text, open a select page to choose which powerup is being edited
        resetAdvancedEditPage();
        localData.advancedEditing = true;
        elm.editMenuPage.style.display = "block";
        elm.editPageHolder.style.overflowY = "scroll";
        elm.editMenuTitle.innerText = "Switch Selected Powerup";
          
        for (let i = 0; i < SS[localData.selectedLoadout].powerups.length; i++) {
            let tab = document.createElement("div");
            tab.innerText = SS[localData.selectedLoadout].powerups[i].name;
            tab.classList.add("settingpagetab");
            tab.classList.add("editmenutab");
            if (SS[localData.selectedLoadout].powerups[i].spawning.allowSpawning) {
              tab.classList.add(localData.currentPowerupId === i ? "htabblue" : "tabblue");
            }
            else {
              tab.classList.add(localData.currentPowerupId === i ? "htabgrey" : "tabgrey");
            }
            
            tab.addEventListener("click", function(e) {
              localData.currentPowerupId = i;
              elm.editMenuPage.style.display = "none";
              localData.advancedEditing = false;
              setupSettingPage();
            });
            elm.editPageHolder.appendChild(tab);
          }
      });
      text.style.cursor = "pointer";
    }
    if (page.classification === 2) {
      if (SS[localData.selectedLoadout].personal.lights.length <= 0) {
        text.innerText = `No Lights Exist To Edit\n\n`;
        text.style.color = "var(--red)";
      }
      else {
        text.innerText = `Editing ${SS[localData.selectedLoadout].personal.lights[localData.currentLightId].name}\n\n`;
        text.addEventListener("click", function(e) {
          resetAdvancedEditPage();
          localData.advancedEditing = true;
          elm.editMenuPage.style.display = "block";
          elm.editPageHolder.style.overflowY = "scroll";
          elm.editMenuTitle.innerText = "Switch Selected Light";

          for (let i = 0; i < SS[localData.selectedLoadout].personal.lights.length; i++) {
              let tab = document.createElement("div");
              tab.innerText = SS[localData.selectedLoadout].personal.lights[i].name;
              tab.classList.add("settingpagetab");
              tab.classList.add("editmenutab");
              tab.classList.add(localData.currentLightId === i ? "htabred" : "tabred");

              tab.addEventListener("click", function(e) {
                localData.currentLightId = i;
                elm.editMenuPage.style.display = "none";
                localData.advancedEditing = false;
                setupSettingPage();
              });
              elm.editPageHolder.appendChild(tab);
            }
        });
      }
    }
    if (page.classification === 3) {
      text.innerText = `Editing ${SS[localData.selectedLoadout].wallTypes[localData.currentWallId].name}\n\n`;
      text.addEventListener("click", function(e) {
        resetAdvancedEditPage();
        localData.advancedEditing = true;
        elm.editMenuPage.style.display = "block";
        elm.editPageHolder.style.overflowY = "scroll";
        elm.editMenuTitle.innerText = "Switch Selected Wall";

        for (let i = 0; i < SS[localData.selectedLoadout].wallTypes.length; i++) {
            let tab = document.createElement("div");
            tab.innerText = SS[localData.selectedLoadout].wallTypes[i].name;
            tab.classList.add("settingpagetab");
            tab.classList.add("editmenutab");
            tab.classList.add(localData.currentWallId === i ? "htabyellow" : "tabyellow");

            tab.addEventListener("click", function(e) {
              localData.currentWallId = i;
              elm.editMenuPage.style.display = "none";
              localData.advancedEditing = false;
              setupSettingPage();
            });
            elm.editPageHolder.appendChild(tab);
          }
      });
    }
    text.classList.add("settingpagetext");
    text.classList.add("settingpagepowerupnotice");
    elm.settingPageLeftHolder.appendChild(text);
  }
  
  // first create the button setup for the page, as well as any dynamic or special things
  switch (localData.layoutType) {
    // the loadout page, we create a bunch of loadout icons that highlight and change the selected loadout
    case 0: {
      elm.rightSettingButton1.style.display = "block";
      elm.rightSettingButton2.style.display = "block";
      elm.rightSettingButton3.style.display = "block";
      elm.rightSettingButton4.style.display = "block";
      
      elm.rightSettingText.innerText = SS[localData.selectedLoadout].metadata.name;
      elm.rightSettingButton1.innerText = localData.selectedLoadout === 0 ? "Loadout Enabled" : "Enable Loadout";
      elm.rightSettingButton2.innerText = "Edit Loadout";
      elm.rightSettingButton3.innerText = "Delete Loadout";
      elm.rightSettingButton4.innerText = "Create Loadout";
      
      // create all the loadout options
      for (let o = 0; o < SS.length; o++) {
        let tab = document.createElement("div");
        tab.innerText = SS[o].metadata.name;
        tab.classList.add("settingpagetab");
        
        if (!SS[o].metadata.owned) tab.classList.add(localData.selectedLoadout === o ? "htaborange" : "taborange");
        else if (o === 0) tab.classList.add(localData.selectedLoadout === o ? "htabblue" : "tabblue");
        else tab.classList.add(localData.selectedLoadout === o ? "htabgrey" : "tabgrey");
        
        let icon = document.createElement("div");
        icon.innerText = SS[o].metadata.hosted ? "✰🪖" : "🪖";
        icon.classList.add("settingpagetabicon");
        tab.appendChild(icon);
        
        tab.addEventListener("click", function() {
          page.scrollDistance = parseInt(elm.settingPageLeftHolder.scrollTop);
          localData.selectedLoadout = o;
          setupSettingPage();
        });
        tab.addEventListener("contextmenu", function() {
          SS[o].metadata.owned = true;
          setupSettingPage(true);
        });
        elm.settingPageLeftHolder.appendChild(tab);
      }
      break;
    }
    // a basic folder page
    case 1: {
      elm.rightSettingText.innerText = page.description;
      break;
    }
    // the powerup selector page, letting you choose which powerup is being edited similar to loadout
    case 2: {
      let powerupLoc = SS[localData.selectedLoadout].powerups[localData.currentPowerupId];
          
      elm.rightSettingButton1.style.display = "block";
      elm.rightSettingButton2.style.display = "block";
      elm.rightSettingButton3.style.display = "block";
      elm.rightSettingButton4.style.display = "block";
      
      elm.rightSettingText.innerText = powerupLoc.name;
      elm.rightSettingButton1.innerText = powerupLoc.spawning.allowSpawning ? "Disable Spawning" : "Enable Spawning";
      elm.rightSettingButton2.innerText = "Edit Powerup";
      elm.rightSettingButton3.innerText = "Delete Powerup";
      elm.rightSettingButton4.innerText = "Create Powerup";
      
      // create all the loadout options
      for (let o = 0; o < SS[localData.selectedLoadout].powerups.length; o++) {
        powerupLoc = SS[localData.selectedLoadout].powerups[o];
        let tab = document.createElement("div");
        tab.innerText = powerupLoc.name;
        tab.classList.add("settingpagetab");
        if (powerupLoc.spawning.allowSpawning) tab.classList.add(localData.currentPowerupId === o ? "htabblue" : "tabblue");
        else tab.classList.add(localData.currentPowerupId === o ? "htabgrey" : "tabgrey");
        
        let icon = document.createElement("div");
        icon.innerText = "💥";
        icon.classList.add("settingpagetabicon");
        tab.appendChild(icon);
        
        tab.addEventListener("click", function() {
          page.scrollDistance = parseInt(elm.settingPageLeftHolder.scrollTop);
          localData.currentPowerupId = o;
          setupSettingPage();
        });
        elm.settingPageLeftHolder.appendChild(tab);
      }
      break;
    }
    // the setting page, with a quick editor and a button to open the advanced editor
    case 3: {
      if (localData.currentSubsetting >= page.settings.length) localData.currentSubsetting = 0;
      let openSetting = structuredClone(page.settings[localData.currentSubsetting]);
      if (openSetting.location[0] === "powerups") {
        openSetting.location.splice(1, 0, localData.currentPowerupId);
      }
      if (openSetting.location[0] === "lights") {
        if (SS[localData.selectedLoadout].personal.lights.length <= 0) break;
        openSetting.location.splice(0, 0, "personal");
        openSetting.location.splice(2, 0, localData.currentLightId);
      }
      if (openSetting.location[0] === "wallTypes") {
        openSetting.location.splice(1, 0, localData.currentWallId);
      }
      localData.editingSettingData = openSetting;
      let settingLoc = SS[localData.selectedLoadout];
      for (let i = 0; i < openSetting.location.length - 1; i++) {
        settingLoc = settingLoc[openSetting.location[i]];
      }
      let settingValue = settingLoc[openSetting.location[openSetting.location.length - 1]];
      
      let usedDataList;
      if (openSetting.location[0] === "powerups") {
        usedDataList = powerupDataList;
      }
      else if (openSetting.location[1] === "lights") {
        usedDataList = lightDataList;
      }
      else if (openSetting.location[0] === "wallTypes") {
        usedDataList = wallDataList;
      }
      else {
        usedDataList = basicDataList;
      }
      let valueData = null;
      for (let i = 0; i < usedDataList.length; i++) {
        let breaker = false;
        for (let j = 0; j < usedDataList[i].value.length; j++) {
          if (usedDataList[i].value[j] !== openSetting.location[j + (
            openSetting.location[0] === "powerups" ? 2 :
            openSetting.location[1] === "lights" ? 3 :
            openSetting.location[0] === "wallTypes" ? 2 :
            0
          )]) breaker = true;
          if (breaker) break;
        }
        if (breaker) continue;
        valueData = usedDataList[i];
        break;
      }
      if (valueData === null) alert("Null data value, something went wrong");
      
      elm.rightSettingButton2.style.display = "block";
      elm.rightSettingButton3.style.display = "block";
      elm.rightSettingButton4.style.display = "block";
    
      elm.rightSettingButton2.innerText = "Advanced Edit";
      elm.rightSettingButton3.innerText = openSetting.global ? page.classification === 1 ? "Apply To All" : "Global Variable" : "Personal Variable";
      if (page.classification !== 1) {
        elm.rightSettingButton3.classList.add("disabledbutton");
        elm.rightSettingButton3.disabled = true;
      }
      elm.rightSettingButton4.innerText = "Reset to Default";
      switch (openSetting.type) {
        // select menu
        case 0: {
          elm.rightSettingButton1.style.display = "block";
          elm.rightSettingButton1.disabled = true;
          elm.rightSettingButton1.innerText = "ERROR!";
          for (let i = 0; i < openSetting.options.length; i++) {
            if (openSetting.options[i][0] === settingValue) elm.rightSettingButton1.innerText = openSetting.options[i][1];
          }
          elm.rightSettingButton2.innerText = "Edit";
          break;
        }
        // iss values
        case 1: {
          elm.rightSettingPartialInput.style.display = "block";
          elm.rightSettingPartialInputLabel.style.display = "flex";
          elm.rightSettingPartialInputLabel.innerText = openSetting.label;

          settingLoc[openSetting.location[openSetting.location.length - 1]][0] = clamp(settingValue[0], valueData.min, valueData.max, valueData.minround);
          settingLoc[openSetting.location[openSetting.location.length - 1]][1] = clamp(settingValue[1], valueData.min, valueData.max, valueData.minround);

          settingLoc[openSetting.location[openSetting.location.length - 1]][4] = Math.max(settingValue[4], valueData.minround);
          elm.rightSettingPartialInput.value = settingValue[0] === settingValue[1] ? chop(settingValue[0]) : 
            `${chop(settingValue[0])} to ${chop(settingValue[1])}`;
          break;
        }
        // boolean
        case 2: {
          elm.rightSettingButton1.style.display = "block";
          elm.rightSettingButton2.innerText = "Editor Disabled";
          elm.rightSettingButton2.classList.add("disabledbutton");
          elm.rightSettingButton1.innerText = settingValue ? openSetting.options[0] : openSetting.options[1];
          break;
        }
        // basic number
        case 3: {
          elm.rightSettingPartialInput.style.display = "block";
          elm.rightSettingPartialInputLabel.style.display = "flex";
          elm.rightSettingPartialInputLabel.innerText = openSetting.label;
          elm.rightSettingButton2.innerText = "Editor Disabled";
          elm.rightSettingButton2.classList.add("disabledbutton");

          settingLoc[openSetting.location[openSetting.location.length - 1]] = clamp(settingValue, valueData.min, valueData.max, valueData.minround);
          elm.rightSettingPartialInput.value = chop(settingValue);
          break;
        }
        // string
        case 4: {
          elm.rightSettingFullInput.style.display = "block";
          elm.rightSettingFullInput.value = settingValue;
          elm.rightSettingButton2.innerText = "Editor Disabled";
          elm.rightSettingButton2.classList.add("disabledbutton");
          break;
        }
        // color
        case 5: {
          elm.rightSettingButton1.style.display = "block";
          elm.rightSettingButton1.disabled = true;
          switch (settingValue) {
            case -1: {
              elm.rightSettingButton1.innerText = "Random";
              break;
            }
            case 55: {
              elm.rightSettingButton1.innerText = "Rainbow";
              break;
            }
            case 56: {
              elm.rightSettingButton1.innerText = "Strobe Rainbow";
              break;
            }
            default: {
              elm.rightSettingButton1.innerText = `Color ${settingValue + 1}`;
              break;
            }
          }
          let inputColor = (settingValue === -1) ? randomColor() : Object.values(pageColors[saveData.theme])[settingValue];
          elm.rightSettingButton1.style.backgroundColor = inputColor;
          elm.rightSettingButton1.style.color = getReadableTextColor(inputColor);
          elm.rightSettingButton2.innerText = "Edit";
          break;
        }
        // attachments
        case 6: {
          elm.rightSettingButton1.style.display = "block";
          elm.rightSettingButton1.innerText = "Quick Select";
          elm.rightSettingButton2.innerText = "Create New";
          break;
        }
        // weapon id
        case 7: {
          elm.rightSettingButton1.style.display = "block";
          elm.rightSettingButton1.disabled = true;
          elm.rightSettingButton1.innerText = "No Weapon Selected";
          for (let i = 0; i < SS[localData.selectedLoadout].powerups.length; i++) {
            if (SS[localData.selectedLoadout].powerups[i].id === settingValue) elm.rightSettingButton1.innerText = SS[localData.selectedLoadout].powerups[i].name;
          }
          elm.rightSettingButton2.innerText = "Edit";
          break;
        }
        // wall ids
        case 8: {
          elm.rightSettingButton1.style.display = "block";
          elm.rightSettingButton1.disabled = true;
          elm.rightSettingButton1.innerText = "No IDs";
          let idFound = false;
          for (let a = 0; a < 16; a++) {
            if ((settingValue >> a) % 2 === 1) {
              if (idFound === false) elm.rightSettingButton1.innerText = "IDs: " + a;
              else elm.rightSettingButton1.innerText += ", " + a;
              idFound = true;
            }
          }
          elm.rightSettingButton2.innerText = "Edit Ids";
          break;
        }
        // custom maps
        case 9: {
          elm.rightSettingButton2.innerText = "Edit Custom Mazes";
          break;
        }
      }
      
      elm.rightSettingText.innerText = `${openSetting.name}\n(${localData.currentSubsetting + 1}/${page.settings.length})\nClick to Change`;
      break;
    }
      // exporting data
    case 5: {
      elm.rightSettingButton1.style.display = "block";
      elm.rightSettingButton2.style.display = "block";
      
      elm.rightSettingText.innerText = SS[localData.selectedLoadout].metadata.name;
      elm.rightSettingButton1.innerText = "Export Loadout";
      elm.rightSettingButton2.innerText = "Copy to Clipboard";
      break;
    }
      
      // the light selector page, letting you choose which light is being edited
    case 6: {
      elm.rightSettingButton2.style.display = "block";
      elm.rightSettingButton3.style.display = "block";
      elm.rightSettingButton4.style.display = "block";
      
      elm.rightSettingText.innerText = SS[localData.selectedLoadout].personal.lights.length > 0 ? 
        SS[localData.selectedLoadout].personal.lights[localData.currentLightId].name : `No Light Selected`;
      elm.rightSettingButton2.innerText = "Edit Light";
      elm.rightSettingButton3.innerText = "Delete Light";
      elm.rightSettingButton4.innerText = "Create Light";
      
      for (let o = 0; o < SS[localData.selectedLoadout].personal.lights.length; o++) {
        let tab = document.createElement("div");
        tab.innerText = SS[localData.selectedLoadout].personal.lights[o].name;
        tab.classList.add("settingpagetab");
        tab.classList.add(localData.currentLightId === o ? "htabred" : "tabred");
        
        let icon = document.createElement("div");
        icon.innerText = "💡";
        icon.classList.add("settingpagetabicon");
        tab.appendChild(icon);
        
        tab.addEventListener("click", function() {
          page.scrollDistance = parseInt(elm.settingPageLeftHolder.scrollTop);
          localData.currentLightId = o;
          setupSettingPage();
        });
        elm.settingPageLeftHolder.appendChild(tab);
      }
      break;
    }
      // the wall selector page, letting you choose which wall is being edited
    case 7: {
      elm.rightSettingButton2.style.display = "block";
      elm.rightSettingButton3.style.display = "block";
      elm.rightSettingButton4.style.display = "block";
      
      elm.rightSettingText.innerText = SS[localData.selectedLoadout].wallTypes[localData.currentWallId].name;
      elm.rightSettingButton2.innerText = "Edit Wall";
      elm.rightSettingButton3.innerText = "Delete Wall";
      elm.rightSettingButton4.innerText = "Create Wall";
      
      for (let o = 0; o < SS[localData.selectedLoadout].wallTypes.length; o++) {
        let tab = document.createElement("div");
        tab.innerText = SS[localData.selectedLoadout].wallTypes[o].name;
        tab.classList.add("settingpagetab");
        tab.classList.add(localData.currentWallId === o ? "htabyellow" : "tabyellow");
        
        let icon = document.createElement("div");
        icon.innerText = "🧱";
        icon.classList.add("settingpagetabicon");
        tab.appendChild(icon);
        
        tab.addEventListener("click", function() {
          page.scrollDistance = parseInt(elm.settingPageLeftHolder.scrollTop);
          localData.currentWallId = o;
          setupSettingPage();
        });
        elm.settingPageLeftHolder.appendChild(tab);
      }
      break;
    }
      
      // exporting powerup data
    case 8: {
      elm.rightSettingButton1.style.display = "block";
      elm.rightSettingButton2.style.display = "block";
      
      elm.rightSettingText.innerText = SS[localData.selectedLoadout].metadata.name;
      elm.rightSettingButton1.innerText = "Export Powerup";
      elm.rightSettingButton2.innerText = "Copy to Clipboard";
      break;
    }
  }
  
  // next, add any elements from the page list
  for (let e of page.elements) {
    switch (e.type) {
      case 1: {
        let tab = document.createElement("div");
        tab.innerText = e.name;
        tab.classList.add("settingpagetab");
        
        // find the color of the linked page
        let linkedPage = null;
        for (let i = 0; i < settingSearch.length; i++) if (e.linkId === settingSearch[i].id) linkedPage = settingSearch[i];
        tab.classList.add(linkedPage ? linkedPage.pageColors : "tabblue");
        
        let icon = document.createElement("div");
        icon.innerText = (linkedPage.classification === 1 ? "💥" : linkedPage.classification === 2 ? "💡" : linkedPage.classification === 3 ? "🧱" : "") + ((linkedPage && linkedPage.layoutType === 3) ? "⚙️" : "📁");
        icon.classList.add("settingpagetabicon");
        tab.appendChild(icon);

        tab.addEventListener("click", function() {
          page.scrollDistance = parseInt(elm.settingPageLeftHolder.scrollTop);
          localData.currentSubsetting = 0;
          localData.settingPageId = e.linkId;
          setupSettingPage();
        });
        elm.settingPageLeftHolder.appendChild(tab);
        break;
      }
      case 0: {
        let text = document.createElement("p");
        text.innerText = e.text;
        text.classList.add("settingpagetext");
        for (let i of e.style) text.classList.add(e);
        elm.settingPageLeftHolder.appendChild(text);
        break;
      }
    }
  }
  
  if (page.scrollDistance) elm.settingPageLeftHolder.scrollTop = page.scrollDistance;
  else elm.settingPageLeftHolder.scrollTop = 0;
}

async function fetchSettingSearch() {
  settingSearch = await (await fetch("./json/settingSearch.json")).json();
  setupSettingPage();
}
fetchSettingSearch();

function createPopup(type, title, body, buttonNames, buttonCallbacks) {
  elm.popupPage.style.display = "flex";
  elm.popupTitle.innerText = title;
  elm.popupText.innerText = body;
  while (elm.popupPage.childElementCount > 2) elm.popupPage.removeChild(elm.popupPage.lastChild);
  let id = Math.random()
  function popupListener(e) {
    buttonCallbacks[0](e.keyCode);
    elm.popupPage.style.display = "none";
    localData.keybinding = false;
    document.removeEventListener("keydown", popupListener);
  }
  
  let input;
  switch (type) {
    case 1: {
      input = document.createElement("input");
      input.placeholder = buttonNames[buttonNames.length - 1];
      input.classList.add("popuppagebutton");
      elm.popupPage.appendChild(input);
      break;
    }
    case 2: {
      input = document.createElement("select");
      for (let i of buttonNames[buttonNames.length - 1]) {
        let option = document.createElement("option");
        option.text = i;
        option.value = i;
        input.add(option);
      }
      input.classList.add("popuppagebutton");
      elm.popupPage.appendChild(input);
      break;
    }
    case 3: {
      input = document.createElement("input");
      input.type = "file";
      input.classList.add("popuppagebutton");
      elm.popupPage.appendChild(input);
      break;
    }
    case 4: {
      input = document.createElement("textarea");
      input.classList.add("popuppagebutton");
      input.value = buttonNames[buttonNames.length - 1];
      elm.popupPage.appendChild(input);
      break;
    }
    case 5: {
      localData.keybinding = true;
      document.addEventListener("keydown", popupListener);
    }
  }
  
  for (let n = 0; n < buttonCallbacks.length; n++) {
    let button = document.createElement("button");
    button.innerText = buttonNames[n];
    button.classList.add("popuppagebutton");
    button.addEventListener("click", function(e) {
      elm.popupPage.style.display = "none";
      if (type === 5) {
        localData.keybinding = false;
        document.removeEventListener("keydown", popupListener);
        return;
      }
      if (type === 1 || type === 2) buttonCallbacks[n](input.value);
      else if (type === 3) buttonCallbacks[n](input.files[0]);
      else buttonCallbacks[n]();
    });
    elm.popupPage.appendChild(button);
    if (type === 5) break;
  }
}

function toggleSettingPage() {
  if (localData.advancedEditing) return;
  localData.settingWindowOpen = !localData.settingWindowOpen;
  elm.settingViewerHolder.style.display = localData.settingWindowOpen ? "block" : "none";
}

function openApplyChanges() {
  elm.settingPageApplyChanges.style.top = "90vh";
  elm.settingPageLeftHolder.style.height = "80vh";
}
/**
Element Event Listeners
*/
elm.settingPageXButton.addEventListener("click", function() {
  if (localData.settingWindowOpen) toggleSettingPage();
});


elm.howToPlayButton.addEventListener("click", function() {
  open("https://docs.google.com/presentation/d/1xLDD3LBz_hPkZxekK7sGcJYyz_PDmmPqnD_ZqNzqkzc/edit?usp=sharing");
});

elm.settingPageBackButton.addEventListener("click", function() {
  if (!localData.searchingForSetting) {
    localData.currentSettingPage.scrollDistance = parseInt(elm.settingPageLeftHolder.scrollTop);
    localData.settingPageId = localData.currentSettingPage.backPageId;
  }
  setupSettingPage();
});

elm.editMenuBackButton.addEventListener("click", function() {
  elm.editMenuPage.style.display = "none";
  localData.advancedEditing = false;
  if (localData.editingSettingData.type === 6) {
    localData.attachmentUndoHistorySpot = 0;
    localData.undoHistory = [];
  }
  setupSettingPage();
});

elm.settingPageApplyChanges.addEventListener("click", function() {
  let sendingSettingsTypes = createSettingsArrayBuffer(SS[0]);
  socket.talk(encodePacket(sendingSettingsTypes[0], sendingSettingsTypes[1]));
  elm.settingPageApplyChanges.style.top = "100vh";
  elm.settingPageLeftHolder.style.height = "90vh";
  localStorage.setItem("SS", btoa(encodeURIComponent(JSON.stringify(SS))));
});

elm.settingPageSearchBar.addEventListener("input", function(e) {
  // go through and first see if we have a match
  let possibleMatches = [];
  if (settingSearch === null) return;
  for (let i = 0; i < settingSearch.length; i++) {
    if (!settingSearch[i].allowSearch) continue;
    
    if (settingSearch[i].predictiveSearch) {
      if (settingSearch[i].name.toLowerCase().includes(e.target.value.toLowerCase())) possibleMatches.push(settingSearch[i]);
      else for (let p of settingSearch[i].keywords) {
        if (p.toLowerCase().includes(e.target.value.toLowerCase())) {
          possibleMatches.push(settingSearch[i]);
          break;
        }
      }
    }
      
    if (settingSearch[i].name.toLowerCase() === e.target.value.toLowerCase()) {
      localData.currentSubsetting = 0;
      localData.settingPageId = settingSearch[i].id;
      setupSettingPage();
      return;
    }
  }
  // if we are still here there are no exact matches so lets make flashcards
  resetSettingPage();
  localData.searchingForSetting = true;
  for (let o of possibleMatches) {
    let tab = document.createElement("div");
    tab.innerText = o.name;
    tab.classList.add("settingpagetab");
    tab.classList.add(o.pageColors);
    
    let icon = document.createElement("div");
    icon.innerText = (o.classification === 1 ? "💥" : o.classification === 2 ? "💡" : o.classification === 3 ? "🧱" : "") + ((o.layoutType === 3) ? "⚙️" : "📁");
    icon.classList.add("settingpagetabicon");
    tab.appendChild(icon);
    
    tab.addEventListener("click", function(e) {
      localData.currentSubsetting = 0;
      localData.settingPageId = o.id;
      setupSettingPage();
    });
    elm.settingPageLeftHolder.appendChild(tab);
  }
});

elm.settingPageSearchButton.addEventListener("click", function(e) {
  elm.settingPageSearchBar.value = "";
  elm.settingPageSearchBar.focus();
});

elm.rightSettingPartialInput.addEventListener("change", function(e) {
  let settingLoc = SS[localData.selectedLoadout];
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) {
    settingLoc = settingLoc[localData.editingSettingData.location[i]];
  }
  switch (localData.editingSettingData.type) {
    case 1: {
      let parts = e.target.value.split("to");
      for (let p = 0; p < parts.length; p++) parts[p] = parseFloat(parts[p]);
      if (parts.length === 1 && !isNaN(parts[0])) {
        settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]][0] = parts[0];
        settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]][1] = parts[0];
      }
      else if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]][0] = parts[1] > parts[0] ? parts[0] : parts[1];
        settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]][1] = parts[1] > parts[0] ? parts[1] : parts[0];
      }
      setupSettingPage(true);
      break;
    }
    case 3: {
      let value = parseFloat(e.target.value);
      if (!isNaN(value)) settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = value;
      setupSettingPage(true);
      break;
    }
  }
});

elm.rightSettingFullInput.addEventListener("change", function(e) {
  let settingLoc = SS[localData.selectedLoadout];
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
  let cutString = String(e.target.value).substring(0, localData.editingSettingData.maxlength);
  settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = cutString;
  setupSettingPage(true);
});

elm.rightSettingText.addEventListener("click", function() {
  localData.currentSubsetting++;
  setupSettingPage();
});

elm.rightSettingButton1.addEventListener("click", function() {
  switch (localData.layoutType) {
      // loadout page, enable loadout button
    case 0: {
      let newEnabled = SS.splice(localData.selectedLoadout, 1)[0];
      SS.splice(0, 0, newEnabled);
      localData.selectedLoadout = 0;
      setupSettingPage(true, true);
      break;
    }
      // powerup editor enable spawn button
    case 2: {
      SS[localData.selectedLoadout].powerups[localData.currentPowerupId].spawning.allowSpawning =
        !SS[localData.selectedLoadout].powerups[localData.currentPowerupId].spawning.allowSpawning;
      setupSettingPage(true);
      break;
    }
      // editor
    case 3: {
      let settingLoc = SS[localData.selectedLoadout];
      for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
      
      switch (localData.editingSettingData.type) {
          // boolean
        case 2: {
          settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = 
            !settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
          setupSettingPage(true);
            break;
        }
          // attachments
        case 6: {
          let attachmentSaves;
          if (localData.settingPageId === 2064) attachmentSaves = localStorage.getItem("attachmentTankSaves") ? JSON.parse(atob(localStorage.getItem("attachmentTankSaves"))) : [];
          else if (localData.settingPageId === 2067) attachmentSaves = localStorage.getItem("attachmentBulletSaves") ? JSON.parse(atob(localStorage.getItem("attachmentBulletSaves"))) : [];
          else if (localData.settingPageId === 2065) attachmentSaves = localStorage.getItem("attachmentBubbleSaves") ? JSON.parse(atob(localStorage.getItem("attachmentBubbleSaves"))) : [];
          else attachmentSaves = [];
          
          
          let selectOptions = ["Click To Quick Select"];
          for (let a of attachmentSaves) selectOptions.push(a.name);

          createPopup(
            2,
            "Select Attachment", 
            `Select and confirm an attachment to quick set.`,
            ["Confirm", "Cancel", selectOptions],
            [function(selectValue) {
              if (selectValue === "Click To Quick Select") return;
              for (let a of attachmentSaves) {
                if (a.name === selectValue) {
                  settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = a.value;
                  setupSettingPage(true);
                  return;
                }
              }
            }, function() {}],
          );
          break;
        }
      }
      break;
    }
      // exporting the loadout
    case 5: {
      let loadoutStringifiedData = btoa(JSON.stringify(SS[localData.selectedLoadout]));
      downloadFile(`${SS[localData.selectedLoadout].metadata.name} (TT Loadout)`, loadoutStringifiedData);
      break;
    }
      
      // exporting the powerup
    case 8: {
      let powerupStringifiedData = btoa(JSON.stringify(SS[localData.selectedLoadout].powerups[localData.currentPowerupId]));
      downloadFile(`${SS[localData.selectedLoadout].powerups[localData.currentPowerupId].name} (TT Powerup)`, powerupStringifiedData);
      break;
    }
  }
});

function resetAdvancedEditPage() {
      let children = elm.editPageHolder.getElementsByClassName("settingpagetab");
      for (let i = children.length - 1; i >= 0; i--) elm.editPageHolder.removeChild(children[i]);
  
      elm.issMinHolder.style.display = "none";
      elm.issMaxHolder.style.display = "none";
      elm.issRoundHolder.style.display = "none";
      elm.issStrengthHolder.style.display = "none";
      elm.issDistributionHolder.style.display = "none";
      elm.issGraph.style.display = "none";
      
      elm.attachmentGeneralHolder.style.display = "none";
      elm.attachmentEditHolder.style.display = "none";
      elm.attachmentAddHolder.style.display = "none";
      elm.attachmentCanvas.style.display = "none";
      elm.editPageHolder.style.overflowY = "hidden";
  
      elm.customMazeHolder.style.display = "none";
}

elm.rightSettingButton2.addEventListener("click", function() {
  switch (localData.layoutType) {
      // loadout page, edit loadout button
    case 0: {
      localData.settingPageId = 1001;
      setupSettingPage();
      break;
    }
      // powerup editor edit powerup button
    case 2: {
      localData.settingPageId = 1024;
      setupSettingPage();
      break;
    }
      // clicking advanced edit
    case 3: {
      let children = elm.editPageHolder.getElementsByClassName("settingpagetab");
      for (let i = children.length - 1; i >= 0; i--) elm.editPageHolder.removeChild(children[i]);
      let settingLoc = SS[localData.selectedLoadout];
      for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) {
        settingLoc = settingLoc[localData.editingSettingData.location[i]];
      }
      let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
      resetAdvancedEditPage();
      elm.editMenuTitle.innerText = localData.currentSettingPage.settings[localData.currentSubsetting].name;
      
      switch (localData.editingSettingData.type) {
          // advanced edit select
        case 0: {
          localData.advancedEditing = true;
          elm.editMenuPage.style.display = "block";
          elm.editPageHolder.style.overflowY = "scroll";
          
          for (let i of localData.editingSettingData.options) {
            let tab = document.createElement("div");
            tab.innerText = i[1];
            tab.classList.add("settingpagetab");
            tab.classList.add("editmenutab");
            if (i[0] === settingValue) tab.classList.add("htabgrey");
            else tab.classList.add("tabgrey");
            
            tab.addEventListener("click", function(e) {
              settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = i[0];
              elm.editMenuPage.style.display = "none";
              localData.advancedEditing = false;
              setupSettingPage(true);
            });
            elm.editPageHolder.appendChild(tab);
          }
          break;
        }
          // advanced edit ISS
        case 1: {
          localData.advancedEditing = true;
          elm.editMenuPage.style.display = "block";
          graphIss(settingValue);
          setupSettingPage(true);
          
          elm.issMinHolder.style.display = "block";
          elm.issMaxHolder.style.display = "block";
          elm.issRoundHolder.style.display = "block";
          elm.issStrengthHolder.style.display = "block";
          elm.issDistributionHolder.style.display = "block";
          elm.issGraph.style.display = "block";
          elm.issMinConstrain.style.display = "none";
          elm.issMaxConstrain.style.display = "none";
          
          elm.issMinInput.value = chop(settingValue[0]);
          elm.issMaxInput.value = chop(settingValue[1]);
          elm.issRoundInput.value = chop(settingValue[4]);
          elm.issStrengthInput.value = chop(settingValue[3]);
          elm.issDistributionInput.innerText = settingValue[2] === 0 ? "Exponential" : "Normal";
          
          // if we aren't global constrain text should exist
          if (!localData.currentSettingPage.settings[localData.currentSubsetting].global) {
            let hostSettingLoc = SS[localData.hostLoadout];
            for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) {
              hostSettingLoc = hostSettingLoc[localData.editingSettingData.location[i]];
            }
            
            if (hostSettingLoc.constrainType === 0) return;
            
            if (hostSettingLoc.constrainType === 2) {
              elm.issMinConstrain.style.display = "block";
              elm.issMaxConstrain.style.display = "block";
              elm.issMinConstrain.innerText = `Lower Bound: ${chop(hostSettingLoc.minBound)}`;
              elm.issMaxConstrain.innerText = `Upper Bound: ${chop(hostSettingLoc.maxBound)}`;
            } else if (hostSettingLoc.constrainType === 1) {
              elm.issMinConstrain.style.display = "block";
              elm.issMaxConstrain.style.display = "block";
              if (localData.hostLoadout !== localData.selectedLoadout) {
                elm.issMinConstrain.innerText = `Locked To: ${chop(hostSettingLoc.value[0])}`;
                elm.issMaxConstrain.innerText = `Locked To: ${chop(hostSettingLoc.value[1])}`;
              } else {
                elm.issMinConstrain.innerText = `Locked Min Value`;
                elm.issMaxConstrain.innerText = `Locked Max Value`;
              }
            }
          }
          break;
        }
          
          // advanced edit color
        case 5: {
          localData.advancedEditing = true;
          elm.editMenuPage.style.display = "block";
          elm.editPageHolder.style.overflowY = "scroll";
          
          for (let i = -1; i < Object.values(pageColors[saveData.theme]).length; i++) {
            let tab = document.createElement("div");
            switch (i) {
              case -1: {
                tab.innerText = "Random";
                break;
              }
              case 55: {
                tab.innerText = "Rainbow";
                break;
              }
              case 56: {
                tab.innerText = "Strobe Rainbow";
                break;
              }
              default: {
                tab.innerText = `Color ${i + 1}`;
                break;
              }
            }
            tab.classList.add("settingpagetab");
            tab.classList.add("editmenutab");
            let inputColor = (i === -1) ? randomColor() : Object.values(pageColors[saveData.theme])[i];
            tab.style.backgroundColor = inputColor;
            tab.style.color = getReadableTextColor(inputColor);
            
            tab.addEventListener("click", function(e) {
              settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = i;
              elm.editMenuPage.style.display = "none";
              localData.advancedEditing = false;
              setupSettingPage(true);
            });
            elm.editPageHolder.appendChild(tab);
          }
          break;
        }
         
          // advanced edit attachments
        case 6: {
          let settingLoc = SS[localData.selectedLoadout];
          for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
          let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
          
          localData.advancedEditing = true;
          elm.editMenuPage.style.display = "block";
          elm.attachmentGeneralHolder.style.display = "block";
          elm.attachmentEditHolder.style.display = "block";
          elm.attachmentAddHolder.style.display = "block";
          elm.attachmentCanvas.style.display = "block";
          localData.AO = {x: 0, y: 0, s: 1};
          
          openApplyChanges();
          
          addAttachmentUndo();
          break;
        }
          
          // advanced edit weapon id
        case 7: {
          localData.advancedEditing = true;
          elm.editMenuPage.style.display = "block";
          elm.editPageHolder.style.overflowY = "scroll";
          
          // create an option for none
          let tab = document.createElement("div");
          tab.innerText = "No Weapon Selected";
          tab.classList.add("settingpagetab");
          tab.classList.add("editmenutab");
          if (-1 === settingValue) tab.classList.add("htabred");
          else tab.classList.add("tabred");
          tab.addEventListener("click", function(e) {
            settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = -1;
            elm.editMenuPage.style.display = "none";
            localData.advancedEditing = false;
            setupSettingPage(true);
          });
          elm.editPageHolder.appendChild(tab);
          
          // go through each powerup and add it to the options
          for (let i of SS[localData.selectedLoadout].powerups) {
            tab = document.createElement("div");
            tab.innerText = i.name;
            tab.classList.add("settingpagetab");
            tab.classList.add("editmenutab");
            if (i.spawning.allowSpawning) {
              tab.classList.add(i.id === settingValue ? "htabblue" : "tabblue");
            }
            else {
              tab.classList.add(i.id === settingValue ? "htabgrey" : "tabgrey");
            }
            
            tab.addEventListener("click", function(e) {
              settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = i.id;
              elm.editMenuPage.style.display = "none";
              localData.advancedEditing = false;
              setupSettingPage(true);
            });
            elm.editPageHolder.appendChild(tab);
          }
          break;
        }
          // add or remove wall ids
        case 8: {
          localData.advancedEditing = true;
          elm.editMenuPage.style.display = "block";
          elm.editPageHolder.style.overflowY = "scroll";
          
          for (let a = 0; a < 16; a++) {
            let tab = document.createElement("div");
            tab.innerText = "ID " + a;
            tab.classList.add("settingpagetab");
            tab.classList.add("editmenutab");
            if ((settingValue >> a) % 2 === 1) tab.classList.add("htabgrey");
            else tab.classList.add("tabgrey");
            
            tab.addEventListener("click", function(e) {
              if ((settingValue >> a) % 2 === 1) {
                settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = settingValue - (2 ** a);
              }
              else settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = settingValue + (2 ** a);
              elm.editMenuPage.style.display = "none";
              localData.advancedEditing = false;
              setupSettingPage(true);
            });
            elm.editPageHolder.appendChild(tab);
          }
          break;
        }
          
          // custom mazes attachments
        case 9: {
          localData.advancedEditing = true;
          elm.editMenuPage.style.display = "block";
          elm.customMazeHolder.style.display = "block";
          localData.AO = {x: 0, y: 0, s: 1};
          for (let i = elm.customMazeWallTypes.options.length; i >= 0; i--) {
            elm.customMazeWallTypes.remove(i);
          }
          for (let w of SS[localData.selectedLoadout].wallTypes) {
            let option = document.createElement("option");
            let selectedColor = getColor(w.color);
            option.style.backgroundColor = selectedColor;
            option.style.color = getReadableTextColor(selectedColor);
            option.text = w.name;

            option.value = w.id;
            elm.customMazeWallTypes.add(option);
          }
          
          openApplyChanges();
          break;
        }
          
      }
      break;
    }
      
      // copying the loadout's export data
    case 5: {
      let loadoutStringifiedData = btoa(JSON.stringify(SS[localData.selectedLoadout]));
      createPopup(
        4,
        "Copy Export Data", 
        `Copy and paste the contents of the following textbox into a text file\n(Press ctrl+a in the textbox, then ctrl+c)`,
        ["Done", loadoutStringifiedData],
        [function() {}],
      );
      break;
    }
      
      // light editor edit light button
    case 6: {
      localData.settingPageId = 1060;
      setupSettingPage();
      break;
    }
      // wall editor edit light button
    case 7: {
      localData.settingPageId = 1062;
      setupSettingPage();
      break;
    }
      
      // copying the current powerup's data
    case 8: {
      let powerupStringifiedData = btoa(JSON.stringify(SS[localData.selectedLoadout].powerups[localData.currentPowerupId]));
      createPopup(
        4,
        "Copy Export Data", 
        `Copy and paste the contents of the following textbox into a text file\n(Press ctrl+a in the textbox, then ctrl+c)`,
        ["Done", powerupStringifiedData],
        [function() {}],
      );
      break;
    }
  }
});

let counter = 0;
function addAttachmentUndo() {
  let settingLoc = SS[localData.selectedLoadout];
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
  let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
  
  if (localData.attachmentUndoHistorySpot !== 0) {
    localData.undoHistory.splice(localData.undoHistory.length - localData.attachmentUndoHistorySpot);
  }
  localData.undoHistory.push(structuredClone(settingValue));
  localData.attachmentUndoHistorySpot = 0;
}

elm.attachmentCanvas.addEventListener("wheel", function(e) {
  // find the origin of scroll
  let relativeX = (e.clientX - elm.attachmentCanvas.width/2) / R;
  let relativeY = (e.clientY - canvas.height * 0.1 - elm.attachmentCanvas.height/2) / R;
  
  // scale all shapes if shift is being held
  if (e.shiftKey) {
    let settingLoc = SS[localData.selectedLoadout];
    for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
    for (let a of settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]]) {
      if (a[3] !== -99999 && a[3] !== -99998) for (let i = 3; i < a.length; i++) a[i] *= 1 + (0.002 * e.deltaY);
      else a[4] *= 1 + (0.002 * e.deltaY);
    }
    return;
  }
  
  // otherwise scroll
  let newScroll = localData.AO.s - (0.002 * e.deltaY) * localData.AO.s;
  newScroll = clamp(newScroll, 0.01, 100, 0.001);
  
  let translatedScale = newScroll / localData.AO.s;
  
  localData.AO.x = (localData.AO.x - relativeX) * translatedScale + relativeX;
  localData.AO.y = (localData.AO.y - relativeY) * translatedScale + relativeY;
  
  localData.AO.s = newScroll;
});

elm.attachmentCanvas.addEventListener("mousedown", function(e) {
  let relativeX = (e.clientX - elm.attachmentCanvas.width/2) / R;
  let relativeY = (e.clientY - canvas.height * 0.1 - elm.attachmentCanvas.height/2) / R;
    
  // dealing with shapes and all that annoying stuff
  if (localData.customPoints.length > 0) return;
  let settingLoc = SS[localData.selectedLoadout];
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
  let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
  
  if (localData.attachmentSelectedShape !== null && e.which !== 2) for (let a of settingValue) {
    // if we are selected, check if a vertice was hit. Otherwise, continue as if we are a normal shape
    if (localData.attachmentSelectedShape === a && (a[3] !== -99999 && a[3] !== -99998)) {
      for (let i = 3; i < a.length; i += 2) {
        if (i + 1 >= a.length) break;
        if (
          (a.length !== 6 && dist({x: relativeX, y: relativeY}, {x: (a[i] * localData.AO.s) + localData.AO.x, y: (a[i + 1] * localData.AO.s) + localData.AO.y}) < 0.01) ||
          (a.length === 6 && dist({x: relativeX, y: relativeY}, {x: ((a[3] + a[5]) * localData.AO.s) + localData.AO.x, y: (a[4] * localData.AO.s) + localData.AO.y}) < 0.01) ||
          (a.length === 6 && dist({x: relativeX, y: relativeY}, {x: (a[3] * localData.AO.s) + localData.AO.x, y: (a[4] * localData.AO.s) + localData.AO.y}) < 0.01)
        ) {
          if (a.length !== 6 && a.length >= 11 && e.which === 3) {
            a.splice(i, 2);
            addAttachmentUndo();
            return;
          }
          localData.attachmentSelectedVertice = i;
          if (a.length === 6) {
            localData.attachmentSelectedVertice = dist({x: relativeX, y: relativeY}, {x: ((a[3] + a[5]) * localData.AO.s) + localData.AO.x, y: (a[4] * localData.AO.s) + localData.AO.y}) < 0.01 ? 0 : 1;
          }
          
          function followMouseAround(e2) {
            let clampedX2 = clamp(e2.clientX, canvas.width * 0.05, canvas.width * 0.95);
            let clampedY2 = clamp(e2.clientY, canvas.height * 0.15, canvas.height * 0.95);
            let relativeX2 = ((clampedX2 - elm.attachmentCanvas.width/2) / R - localData.AO.x) / localData.AO.s;
            let relativeY2 = ((clampedY2 - canvas.height * 0.1 - elm.attachmentCanvas.height/2) / R - localData.AO.y) / localData.AO.s;
            
            if (localData.attachmentSnapping !== 2) {
              let snapAmount = localData.attachmentSnapping === 0 ? 50 : 100;
              if (!localData.attachmentLockGrid) snapAmount *= 5 ** Math.round(Math.log(localData.AO.s) / Math.log(5));
              relativeX2 = Math.round(relativeX2 * snapAmount) / snapAmount;
              relativeY2 = Math.round(relativeY2 * snapAmount) / snapAmount;
            }
            
            if (a.length === 6) {
              if (localData.attachmentSelectedVertice === 0) a[5] = clamp(relativeX2 - a[3], 0, Infinity);
              else {
                a[3] = relativeX2;
                a[4] = relativeY2;
              }
            }
            else {
              a[i] = relativeX2;
              a[i + 1] = relativeY2;
            }
          }
          function removeFollowEvent() {
            document.removeEventListener("mousemove", followMouseAround);
            document.removeEventListener("mouseup", removeFollowEvent);
            localData.attachmentSelectedVertice = null;
            
            // if a shape is just a line, remove it
            if (a.length !== 6) {
              let sameX = true;
              let sameY = true;
              for (let j = 5; j < a.length; j += 2) {
                if (a[j] !== a[j - 2]) sameX = false;
                if (a[j + 1] !== a[j - 1]) sameY = false;
              }
              if (sameX || sameY) {
                settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]].splice(settingValue.indexOf(a), 1);
              }
            }
            
            // if a circle has 0 radius, remove it
            if (a.length === 6 && a[5] < 0.001) {
              settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]].splice(settingValue.indexOf(a), 1);
            }
            
            addAttachmentUndo();
          }
          document.addEventListener("mousemove", followMouseAround);
          document.addEventListener("mouseup", removeFollowEvent);
          return;
        }
      }
      
      for (let i = 3; i < a.length; i += 2) {
        if (i + 1 >= a.length) break;
        if (a.length !== 6 && dist({
          x: relativeX, y: relativeY
        }, {
          x: (a[i] + a[i + 2 >= a.length ? 3 : i + 2])/2 * localData.AO.s + localData.AO.x, y: (a[i + 1] + a[i + 3 >= a.length ? 4 : i + 3])/2 * localData.AO.s + localData.AO.y
        }) < 0.01) {
          a.splice(i + 2 >= a.length ? 3 : i + 2 , 0, (a[i] + a[i + 2 >= a.length ? 3 : i + 2])/2, (a[i + 1] + a[i + 3 >= a.length ? 4 : i + 3])/2);
          addAttachmentUndo();
          return;
        }
      }
    }
  }
  
  let shapeFound = null;
  for (let a of settingValue) {
    
    // if we aren't currently selected, then check if the mouse hit us
    // basically to check if inside the shape, draw a line and check if the intersects are even or odd
    let totalIntersects = 0;
    if (a[3] === -99999 || a[3] === -99998) {
      totalIntersects = dist({x: relativeX, y: relativeY}, {x: a[5] * localData.AO.s + localData.AO.x, y: a[6] * localData.AO.s + localData.AO.y}) < a[4] * 0.1 * localData.AO.s ? 1 : 0;
    }
    else if (a.length === 6) {
      totalIntersects = dist({x: relativeX, y: relativeY}, {x: a[3] * localData.AO.s + localData.AO.x, y: a[4] * localData.AO.s + localData.AO.y}) < a[5] * localData.AO.s ? 1 : 0;
    }
    else for (let i = 3; i < a.length; i += 2) {
      if (lineIntersect(
        relativeX, relativeY,
        relativeX + 100, relativeY,
        a[i] * localData.AO.s + localData.AO.x, a[i + 1] * localData.AO.s + localData.AO.y,
        a[i + 2 >= a.length ? 3 : i + 2] * localData.AO.s + localData.AO.x, a[i + 3 >= a.length ? 4 : i + 3] * localData.AO.s + localData.AO.y
      ) !== null) totalIntersects++;
    }
    if (totalIntersects % 2 === 1) {
      localData.attachmentSelectedShape = a;
      elm.attachmentChangeColor.value = a[1];
      elm.attachmentChangeLayer.value = a[0];
      elm.attachmentChangeConnect.innerText = a[2] === 0 ? "Hard Borders" : a[2] === 1 ? "Soft Borders" : a[2] === 2 ? "No Borders" : "Only Borders";
      shapeFound = a;
    }
  }
  
  if (shapeFound === null && e.which !== 2) localData.attachmentSelectedShape = null;
  if (shapeFound !== null && e.which !== 2) {
    let originalVertices = structuredClone(shapeFound);
    function dragMouseAround(e2) {
      let totalXChange = (relativeX - (e2.clientX - elm.attachmentCanvas.width/2) / R) / localData.AO.s;
      let totalYChange = (relativeY - (e2.clientY - canvas.height * 0.1 - elm.attachmentCanvas.height/2) / R) / localData.AO.s;
      
      if (localData.attachmentSnapping !== 2 && (shapeFound.length !== 6 || !e.shiftKey)) {
        let snapAmount = localData.attachmentSnapping === 0 ? 50 : 100;
        if (!localData.attachmentLockGrid) snapAmount *= 5 ** Math.round(Math.log(localData.AO.s) / Math.log(5));
        totalXChange = Math.round(totalXChange * snapAmount) / snapAmount;
        totalYChange = Math.round(totalYChange * snapAmount) / snapAmount;
      }
      
      // if shift is held, expand or contract the shape
      if (e.shiftKey) {
        if (shapeFound[3] === -99999 || shapeFound[3] === -99998) {
          shapeFound[4] = clamp(originalVertices[4] - 2 * totalXChange, 0, Infinity);
        }
        else if (shapeFound.length === 6) {
          shapeFound[5] = clamp(originalVertices[5] - totalXChange, 0, Infinity);
        }
        else {
          let shapeCenter = {x: 0, y: 0};
          for (let i = 3; i < originalVertices.length; i += 2) {
            shapeCenter.x += originalVertices[i] - localData.AO.x;
            shapeCenter.y += originalVertices[i + 1] - localData.AO.y;
          }
          shapeCenter.x /= (originalVertices.length - 3) / 2;
          shapeCenter.y /= (originalVertices.length - 3) / 2;
          //let mouseDist = {x: shapeCenter.x + relativeX - totalXChange, y: shapeCenter.y + relativeY - totalYChange};
          
          for (let i = 3; i < shapeFound.length; i += 2) {
            // relative distance of drag point / relative distance of first click
            let translatedScale = (shapeCenter.x + relativeX - totalXChange) / (shapeCenter.x + relativeX);
            shapeFound[i] = (originalVertices[i] - shapeCenter.x - localData.AO.x) * translatedScale + shapeCenter.x + localData.AO.x;
            shapeFound[i + 1] = (originalVertices[i + 1] - shapeCenter.y - localData.AO.y) * translatedScale + shapeCenter.y + localData.AO.y;
          }
        }
      }
      // otherwise, drag the shape around
      else {
        if (shapeFound[3] === -99999 || shapeFound[3] === -99998) {
          shapeFound[5] = originalVertices[5] - totalXChange;
          shapeFound[6] = originalVertices[6] - totalYChange;
        }
        else if (shapeFound.length === 6) {
          shapeFound[3] = originalVertices[3] - totalXChange;
          shapeFound[4] = originalVertices[4] - totalYChange;
        }
        else for (let i = 3; i < shapeFound.length; i += 2) {
          shapeFound[i] = originalVertices[i] - totalXChange;
          shapeFound[i + 1] = originalVertices[i + 1] - totalYChange;
        }
      }
    }
    function removeDragEvent() {
      document.removeEventListener("mousemove", dragMouseAround);
      document.removeEventListener("mouseup", removeDragEvent);
      
      if (shapeFound.length === 6 && shapeFound[5] < 0.001) {
        settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]].splice(settingValue.indexOf(shapeFound), 1);
      }
      
      addAttachmentUndo();
    }
    document.addEventListener("mousemove", dragMouseAround);
    document.addEventListener("mouseup", removeDragEvent);
    return;
  }
    
  
  // panning around
  localData.baseOffset = {x: parseFloat(localData.AO.x), y: parseFloat(localData.AO.y)};
  function followMouseAround(e2) {
    localData.AO.x = localData.baseOffset.x - relativeX + (e2.clientX - elm.attachmentCanvas.width/2) / R;
    localData.AO.y = localData.baseOffset.y - relativeY + (e2.clientY - canvas.height * 0.1 - elm.attachmentCanvas.height/2) / R;
  }
  function removeFollowEvent() {
    document.removeEventListener("mousemove", followMouseAround);
    document.removeEventListener("mouseup", removeFollowEvent);
  }
  document.addEventListener("mousemove", followMouseAround);
  document.addEventListener("mouseup", removeFollowEvent);
});

elm.attachmentLockGrid.addEventListener("click", function(e) {
  localData.attachmentLockGrid = !localData.attachmentLockGrid; 
  e.target.innerText = localData.attachmentLockGrid ? "Unlock Grid Size" : "Lock Grid Size";
});

elm.attachmentToggleSnap.addEventListener("click", function(e) {
  localData.attachmentSnapping++;
  if (localData.attachmentSnapping > 2) localData.attachmentSnapping = 0;
  e.target.innerText = localData.attachmentSnapping === 0 ? "Large Snap" : localData.attachmentSnapping === 1 ? "Small Snap" : "No Snap";
});

elm.attachmentViewMode.addEventListener("click", function(e) {
  localData.attachmentViewMode++;
  if (localData.attachmentViewMode > 1) localData.attachmentViewMode = 0;
  e.target.innerText = localData.attachmentViewMode === 0 ? "Master View" : "Preview View";
});

elm.attachmentChangeConnect.addEventListener("click", function(e) {
  let settingLoc = SS[localData.selectedLoadout];
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
  let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
  for (let a of settingValue) if (a === localData.attachmentSelectedShape) {
    a[2]++;
    if (a[2] > 3) a[2] = 0;
    e.target.innerText = a[2] === 0 ? "Hard Borders" : a[2] === 1 ? "Soft Borders" : a[2] === 2 ? "No Borders" : "Only Borders";
    addAttachmentUndo();
  }
});

elm.attachmentGeneralGrabber.addEventListener("mousedown", function(e) {
  function followMouseAround(e2) {
    elm.attachmentGeneralHolder.style.top = clamp(e2.clientY - canvas.height * 0.75, -canvas.height * 0.6, canvas.height * 0.25) + "px";
    elm.attachmentGeneralHolder.style.left = clamp(e2.clientX - canvas.width * 0.1, 0, canvas.width * 0.8) + "px";
  }
  function removeFollowEvent() {
    document.removeEventListener("mousemove", followMouseAround);
    document.removeEventListener("mouseup", removeFollowEvent);
  }
  document.addEventListener("mousemove", followMouseAround);
  document.addEventListener("mouseup", removeFollowEvent);
});
elm.attachmentEditGrabber.addEventListener("mousedown", function(e) {
  function followMouseAround(e2) {
    elm.attachmentEditHolder.style.top = clamp(e2.clientY - canvas.height * 0.55, -canvas.height * 0.4, canvas.height * 0.45) + "px";
    elm.attachmentEditHolder.style.left = clamp(e2.clientX - canvas.width * 0.1, 0, canvas.width * 0.8) + "px";
  }
  function removeFollowEvent() {
    document.removeEventListener("mousemove", followMouseAround);
    document.removeEventListener("mouseup", removeFollowEvent);
  }
  document.addEventListener("mousemove", followMouseAround);
  document.addEventListener("mouseup", removeFollowEvent);
});
elm.attachmentAddGrabber.addEventListener("mousedown", function(e) {
  function followMouseAround(e2) {
    elm.attachmentAddHolder.style.top = clamp(e2.clientY - canvas.height * 0.55, -canvas.height * 0.4, canvas.height * 0.45) + "px";
    elm.attachmentAddHolder.style.left = clamp(e2.clientX - canvas.width * 0.1, 0, canvas.width * 0.8) + "px";
  }
  function removeFollowEvent() {
    document.removeEventListener("mousemove", followMouseAround);
    document.removeEventListener("mouseup", removeFollowEvent);
  }
  document.addEventListener("mousemove", followMouseAround);
  document.addEventListener("mouseup", removeFollowEvent);
});

elm.attachmentChangeColor.addEventListener("change", function(e) {
  let settingLoc = SS[localData.selectedLoadout];
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
  let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
  for (let a of settingValue) if (a === localData.attachmentSelectedShape) a[1] = parseInt(e.target.value);
  addAttachmentUndo();
});

elm.attachmentChangeLayer.addEventListener("input", function(e) {
  let settingLoc = SS[localData.selectedLoadout];
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
  let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
  for (let a of settingValue) if (a === localData.attachmentSelectedShape) {
    let usedValue = parseInt(e.target.value.split(" ")[e.target.value.split(" ").length - 1]);
    if (isNaN(usedValue)) usedValue = a[0];
    usedValue = clamp(usedValue, -500, 500);
    a[0] = usedValue;
    addAttachmentUndo();
  }
});

elm.attachmentDeleteSelected.addEventListener("click", function() {
  if (localData.attachmentSelectedShape === null) return;
  let settingLoc = SS[localData.selectedLoadout];
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
  let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
  for (let i = 0; i < settingValue.length; i++) if (settingValue[i] === localData.attachmentSelectedShape) settingValue.splice(i, 1);
  localData.attachmentSelectedShape = null;
  addAttachmentUndo();
});

elm.attachmentResetDraft.addEventListener("click", function(e) {
  createPopup(
    0,
    "Reset Draft", 
    `Are you sure you want to remove all attachments on your current build?`,
    ["Confirm Reset", "Cancel"],
    [function() {
      let settingLoc = SS[localData.selectedLoadout];
      for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
      
      if (localData.settingPageId === 2064) settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = 
        [[0, -1, 0, 0.1, 0.1, 0.1, -0.1, -0.1, -0.1, -0.1, 0.1], [-1, -1, 0, 0, 0.04, 0.14, 0.04, 0.14, -0.04, 0, -0.04]];
      if (localData.settingPageId === 2065) settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = 
        [[0, 7, 0, 0, 0, 0.1]];
      if (localData.settingPageId === 2067) settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = 
        [[0, -1, 0, 0, 0, 0.1]];
      
      localData.attachmentSelectedShape = null;
      localData.AO = {x: 0, y: 0, s: 1};
      addAttachmentUndo();
    }, function() {}],
  );
});

elm.attachmentMakePremade.addEventListener("click", function() {
  let settingLoc = SS[localData.selectedLoadout];
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
  let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
  let attachmentSaves;
  if (localData.settingPageId === 2064) attachmentSaves = localStorage.getItem("attachmentTankSaves") ? JSON.parse(atob(localStorage.getItem("attachmentTankSaves"))) : [];
  else if (localData.settingPageId === 2067) attachmentSaves = localStorage.getItem("attachmentBulletSaves") ? JSON.parse(atob(localStorage.getItem("attachmentBulletSaves"))) : [];
  else if (localData.settingPageId === 2065) attachmentSaves = localStorage.getItem("attachmentBubbleSaves") ? JSON.parse(atob(localStorage.getItem("attachmentBubbleSaves"))) : [];
  else attachmentSaves = [];
  
      // if we already have this attachment saved, check if they want to unsave it
  for (let a of attachmentSaves) {
    if (a.value.length !== settingValue.length) continue;
    let breaker = false;
    for (let i = 0; i < a.value.length; i++) {
      if (a.value[i].length !== settingValue[i].length) breaker = true;
      if (!a.value[i].every((val, idx) => val === settingValue[i][idx])) breaker = true;
      if (breaker) break;
    }
    if (!breaker) {
      createPopup(
        0,
        "Unsave Attachment", 
        `Do you want to unsave the attachment named ${a.name} from your premade attachments?`,
        ["Unsave", "Cancel"],
        [function() {
          attachmentSaves.splice(attachmentSaves.indexOf(a), 1);
          if (localData.settingPageId === 2064) localStorage.setItem("attachmentTankSaves", btoa(JSON.stringify(attachmentSaves)));
          else if (localData.settingPageId === 2067) localStorage.setItem("attachmentBulletSaves", btoa(JSON.stringify(attachmentSaves)));
          else if (localData.settingPageId === 2065) localStorage.setItem("attachmentBubbleSaves", btoa(JSON.stringify(attachmentSaves)));
        }, function() {}],
      );
      return;
    }
  }
  
  createPopup(
    1,
    "Save Attachment", 
    `Select a name to save this attachment as. This will only be seen by you when loading this attachment in the future.`,
    ["Save", "Cancel", "Saved Attachment Name"],
    [function(inputValue) {
      if (inputValue === "Click To Select A Save") createPopup(
        0,
        "Very Funny", 
        `To avoid confusion when opening this attachment, please use a different name.`,
        ["Ok"],
        [function() {}],
      );
      
      // if the name already exists let the person know
      for (let a of attachmentSaves) {
        if (a.name === inputValue) {
          createPopup(
            0,
            "Name Already Used", 
            `You already have an attachment by this name, if you want to save it please try again with a different name.`,
            ["Ok"],
            [function() {}],
          );
          return;
        }
      }
      
      attachmentSaves.splice(0, 0, {
        name: inputValue,
        value: settingValue
      });
      if (localData.settingPageId === 2064) localStorage.setItem("attachmentTankSaves", btoa(JSON.stringify(attachmentSaves)));
      else if (localData.settingPageId === 2067) localStorage.setItem("attachmentBulletSaves", btoa(JSON.stringify(attachmentSaves)));
      else if (localData.settingPageId === 2065) localStorage.setItem("attachmentBubbleSaves", btoa(JSON.stringify(attachmentSaves)));
    }, function() {}],
  );
});

// premade-premades
async function fetchPremades() {
  let premades = await (await fetch("./json/premades.json")).json();
  console.log("setting up your premades");
  localStorage.setItem("attachmentTankSaves", btoa(JSON.stringify(premades.tanks)));
  localStorage.setItem("attachmentBulletSaves", btoa(JSON.stringify(premades.bullets)));
  localStorage.setItem("attachmentBubbleSaves", btoa(JSON.stringify(premades.bubbles)));
}
if (localStorage.getItem("attachmentTankSaves") === null || localStorage.getItem("attachmentBulletSaves") === null) fetchPremades();


elm.attachmentImportPremade.addEventListener("click", function() {
  let settingLoc = SS[localData.selectedLoadout];
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
  let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
  let attachmentSaves;
  if (localData.settingPageId === 2064) attachmentSaves = localStorage.getItem("attachmentTankSaves") ? JSON.parse(atob(localStorage.getItem("attachmentTankSaves"))) : [];
  else if (localData.settingPageId === 2067) attachmentSaves = localStorage.getItem("attachmentBulletSaves") ? JSON.parse(atob(localStorage.getItem("attachmentBulletSaves"))) : [];
  else if (localData.settingPageId === 2065) attachmentSaves = localStorage.getItem("attachmentBubbleSaves") ? JSON.parse(atob(localStorage.getItem("attachmentBubbleSaves"))) : [];
  else attachmentSaves = [];
  
  let selectOptions = ["Click To Select A Save"];
  for (let a of attachmentSaves) selectOptions.push(a.name);
  
  createPopup(
    2,
    "Load Attachment", 
    `Selecting a save will open a copy of it in the editor. This will delete your current draft.`,
    ["Copy Save", "Cancel", selectOptions],
    [function(selectValue) {
      if (selectValue === "Click To Select A Save") return;
      for (let a of attachmentSaves) {
        if (a.name === selectValue) {
          settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = a.value;
          addAttachmentUndo();
          return;
        }
      }
    }, function() {}],
  );
});

elm.attachmentAddCircle.addEventListener("click", function() {
  function createCircleOnClick(e) {
    elm.attachmentCanvas.removeEventListener("click", createCircleOnClick);
    elm.attachmentAddCircle.removeEventListener("click", removeEvents);
    elm.attachmentAddCustom.removeEventListener("click", removeEvents);
    elm.attachmentAddRectangle.removeEventListener("click", removeEvents);
    elm.attachmentCanvas.style.cursor = "";
    
    let clampedX = clamp(e.clientX, canvas.width * 0.05, canvas.width * 0.95);
    let clampedY = clamp(e.clientY, canvas.height * 0.15, canvas.height * 0.95);
    let relativeX = ((clampedX - elm.attachmentCanvas.width/2) / R - localData.AO.x) / localData.AO.s;
    let relativeY = ((clampedY - canvas.height * 0.1 - elm.attachmentCanvas.height/2) / R - localData.AO.y) / localData.AO.s;
    if (localData.attachmentSnapping !== 2) {
      let snapAmount = localData.attachmentSnapping === 0 ? 50 : 100;
      if (!localData.attachmentLockGrid) snapAmount *= 5 ** Math.round(Math.log(localData.AO.s) / Math.log(5));
      relativeX = Math.round(relativeX * snapAmount) / snapAmount;
      relativeY = Math.round(relativeY * snapAmount) / snapAmount;
    }
    
    let settingLoc = SS[localData.selectedLoadout];
    for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
    let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
    let a = [-1, localData.settingPageId === 2065 ? 7 : -1, 0, relativeX, relativeY, 0.02];
    settingValue.push(a);
    localData.attachmentSelectedShape = a;
    localData.attachmentMakingShape = false;
    elm.attachmentChangeColor.value = a[1];
    elm.attachmentChangeLayer.value = a[0];
    elm.attachmentChangeConnect.innerText = a[2] === 1 ? "Soft Edges" : "Hard Edges";
    
    addAttachmentUndo();
  }
  function removeEvents(e) {
    elm.attachmentCanvas.removeEventListener("click", createCircleOnClick);
    elm.attachmentAddCircle.removeEventListener("click", removeEvents);
    elm.attachmentAddCustom.removeEventListener("click", removeEvents);
    elm.attachmentAddRectangle.removeEventListener("click", removeEvents);
    elm.attachmentCanvas.style.cursor = "";
  }
  if (localData.attachmentMakingShape) {
    localData.attachmentMakingShape = false;
    return;
  }
  localData.attachmentMakingShape = true;
  elm.attachmentCanvas.style.cursor = "cell";
  elm.attachmentCanvas.addEventListener("click", createCircleOnClick);
  elm.attachmentAddCustom.addEventListener("click", removeEvents);
  elm.attachmentAddCircle.addEventListener("click", removeEvents);
  elm.attachmentAddRectangle.addEventListener("click", removeEvents);
});

elm.attachmentAddRectangle.addEventListener("click", function() {
  function createRectangleOnClick(e) {
    elm.attachmentCanvas.removeEventListener("click", createRectangleOnClick);
    elm.attachmentAddCircle.removeEventListener("click", removeEvents);
    elm.attachmentAddCustom.removeEventListener("click", removeEvents);
    elm.attachmentAddRectangle.removeEventListener("click", removeEvents);
    elm.attachmentCanvas.style.cursor = "";
    
    let clampedX = clamp(e.clientX, canvas.width * 0.05, canvas.width * 0.95);
    let clampedY = clamp(e.clientY, canvas.height * 0.15, canvas.height * 0.95);
    let relativeX = ((clampedX - elm.attachmentCanvas.width/2) / R - localData.AO.x) / localData.AO.s;
    let relativeY = ((clampedY - canvas.height * 0.1 - elm.attachmentCanvas.height/2) / R - localData.AO.y) / localData.AO.s;
    if (localData.attachmentSnapping !== 2) {
      let snapAmount = localData.attachmentSnapping === 0 ? 50 : 100;
      if (!localData.attachmentLockGrid) snapAmount *= 5 ** Math.round(Math.log(localData.AO.s) / Math.log(5));
      relativeX = Math.round(relativeX * snapAmount) / snapAmount;
      relativeY = Math.round(relativeY * snapAmount) / snapAmount;
    }
    let settingLoc = SS[localData.selectedLoadout];
    for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
    let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
    let min = {x: relativeX - 0.02, y: relativeY - 0.02};
    let max = {x: relativeX + 0.02, y: relativeY + 0.02};
    let a = [-1, localData.settingPageId === 2065 ? 7 : -1, 0, min.x, min.y, min.x, max.y, max.x, max.y, max.x, min.y];
    settingValue.push(a);
    localData.attachmentSelectedShape = a;
    localData.attachmentMakingShape = false;
    elm.attachmentChangeColor.value = a[1];
    elm.attachmentChangeLayer.value = a[0];
    elm.attachmentChangeConnect.innerText = a[2] === 1 ? "Soft Edges" : "Hard Edges";
    
    addAttachmentUndo();
  }
  function removeEvents(e) {
    elm.attachmentCanvas.removeEventListener("click", createRectangleOnClick);
    elm.attachmentAddCircle.removeEventListener("click", removeEvents);
    elm.attachmentAddCustom.removeEventListener("click", removeEvents);
    elm.attachmentAddRectangle.removeEventListener("click", removeEvents);
    elm.attachmentCanvas.style.cursor = "";
  }
  if (localData.attachmentMakingShape) {
    localData.attachmentMakingShape = false;
    return;
  }
  localData.attachmentMakingShape = true;
  elm.attachmentCanvas.style.cursor = "cell";
  elm.attachmentCanvas.addEventListener("click", createRectangleOnClick);
  elm.attachmentAddCustom.addEventListener("click", removeEvents);
  elm.attachmentAddCircle.addEventListener("click", removeEvents);
  elm.attachmentAddRectangle.addEventListener("click", removeEvents);
});

elm.attachmentAddCustom.addEventListener("click", function() {
  function createCustomOnClick(e) {
    let clampedX = clamp(e.clientX, canvas.width * 0.05, canvas.width * 0.95);
    let clampedY = clamp(e.clientY, canvas.height * 0.15, canvas.height * 0.95);
    let relativeX = ((clampedX - elm.attachmentCanvas.width/2) / R - localData.AO.x) / localData.AO.s;
    let relativeY = ((clampedY - canvas.height * 0.1 - elm.attachmentCanvas.height/2) / R - localData.AO.y) / localData.AO.s;
    if (localData.attachmentSnapping !== 2) {
      let snapAmount = localData.attachmentSnapping === 0 ? 50 : 100;
      if (!localData.attachmentLockGrid) snapAmount *= 5 ** Math.round(Math.log(localData.AO.s) / Math.log(5));
      relativeX = Math.round(relativeX * snapAmount) / snapAmount;
      relativeY = Math.round(relativeY * snapAmount) / snapAmount;
    }
    
    if (
      localData.customPoints.length >= 5 &&
      ((relativeX === localData.customPoints[localData.customPoints.length - 2] && relativeY === localData.customPoints[localData.customPoints.length - 1]) ||
      (relativeX === localData.customPoints[3] && relativeY === localData.customPoints[4]))
    ) {
      elm.attachmentCanvas.removeEventListener("click", createCustomOnClick);
      elm.attachmentAddCircle.removeEventListener("click", removeEvents);
      elm.attachmentAddCustom.removeEventListener("click", removeEvents);
      elm.attachmentAddRectangle.removeEventListener("click", removeEvents);
      
      if (localData.customPoints.length < 9) {
        localData.customPoints = [];
        return;
      }
      let settingLoc = SS[localData.selectedLoadout];
      for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
      let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
      let a = structuredClone(localData.customPoints);
      settingValue.push(a);
      localData.attachmentSelectedShape = a;
      localData.attachmentMakingShape = false;
      localData.customPoints = [];
      elm.attachmentChangeColor.value = a[1];
      elm.attachmentChangeLayer.value = a[0];
      elm.attachmentChangeConnect.innerText = "Hard Edges";
    
      addAttachmentUndo();
    }
    else localData.customPoints.push(relativeX, relativeY);
  }
  function removeEvents(e) {
    elm.attachmentCanvas.removeEventListener("click", createCustomOnClick);
    elm.attachmentAddCircle.removeEventListener("click", removeEvents);
    elm.attachmentAddCustom.removeEventListener("click", removeEvents);
    elm.attachmentAddRectangle.removeEventListener("click", removeEvents);
    localData.customPoints = [];
  }
  if (localData.attachmentMakingShape) {
    localData.attachmentMakingShape = false;
    return;
  }
  localData.attachmentMakingShape = true;
  elm.attachmentCanvas.addEventListener("click", createCustomOnClick);
  elm.attachmentAddCustom.addEventListener("click", removeEvents);
  elm.attachmentAddCircle.addEventListener("click", removeEvents);
  elm.attachmentAddRectangle.addEventListener("click", removeEvents);
  localData.customPoints = [-1, localData.settingPageId === 2065 ? 7 : -1, 0];
});

elm.attachmentAddSvg.addEventListener("click", function() {
  createPopup(
    0,
    "Choose SVG Type", 
    "Choose if you want to upload an SVG Path, or SVG File.",
    ["SVG Path", "SVG File", "Cancel"],
    [function() {
      // svg path
      createPopup(
        1,
        "Paste SVG", 
        `SVG scaled between -1 to 1 are recommended.`,
        ["Add", "Cancel", "Paste SVG Here"],
        [function(inputValue) {
          let a = [-1, localData.settingPageId === 2065 ? 7 : -1, 0, -99999, 1, 0, 0];
          for (let j = 0; j < inputValue.length; j++) {
             a.push(inputValue.charCodeAt(j));
          }
          let settingLoc = SS[localData.selectedLoadout];
          for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
          settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]].push(a);
          localData.attachmentSelectedShape = a;
          elm.attachmentChangeColor.value = a[1];
          elm.attachmentChangeLayer.value = a[0];
          elm.attachmentChangeConnect.innerText = "Hard Edges";
        }, function() {}],
      );
    }, function() {
      // svg file
      let input = document.createElement("input");
      input.type = "file";
      input.click();
      input.addEventListener("change", function(e) {
        let reader = new FileReader();
        reader.readAsText(input.files[0], "UTF-8");
        reader.onload = function (e) {
          try {
            let svgfile = structuredClone(e.target.result);
            let a = [-1, localData.settingPageId === 2065 ? 7 : -1, 0, -99998, 1, 0, 0];
            for (let j = 0; j < svgfile.length; j++) {
              a.push(svgfile.charCodeAt(j));
            }
            let settingLoc = SS[localData.selectedLoadout];
            for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
            settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]].push(a);
            localData.attachmentSelectedShape = a;
            elm.attachmentChangeColor.value = a[1];
            elm.attachmentChangeLayer.value = a[0];
            elm.attachmentChangeConnect.innerText = "Hard Edges";
          } catch (err) {
            console.log("import failed: " + err);
          }
        }
      });
    }, function() {}],
  );
  
  addAttachmentUndo();
});

elm.customMazeCanvas.addEventListener("wheel", function(e) {
  // find the origin of scroll
  let relativeX = (e.clientX - canvas.width * 0.4 - elm.customMazeCanvas.width/2) / R;
  let relativeY = (e.clientY - canvas.height * 0.1 - elm.customMazeCanvas.height/2) / R;
  
  // otherwise scroll
  let newScroll = localData.AO.s - (0.002 * e.deltaY) * localData.AO.s;
  newScroll = clamp(newScroll, 0.01, 100, 0.001);
  
  let translatedScale = newScroll / localData.AO.s;
  
  localData.AO.x = (localData.AO.x - relativeX) * translatedScale + relativeX;
  localData.AO.y = (localData.AO.y - relativeY) * translatedScale + relativeY;
  
  localData.AO.s = newScroll;
});

elm.customMazeCanvas.addEventListener("mousedown", function(e) {
  let relativeX = (e.clientX - canvas.width * 0.4 - elm.customMazeCanvas.width/2) / R;
  let relativeY = (e.clientY - canvas.height * 0.1 - elm.customMazeCanvas.height/2) / R;
  
  let defaultWallId = SS[localData.selectedLoadout].wallTypes[0].id;
  let maze = SS[localData.selectedLoadout].customMazes[localData.selectedMaze];
  let mazex = maze[1];
  let mazey = (maze.length - 2) / mazex / 5;
  if (localData.selectedWall !== -1) defaultWallId = maze[localData.selectedWall];
    
    
  if (e.which !== 2) {
    localData.selectedWall = -1;
    localData.wallOpposite = 0;
    localData.changeWallSelection = true;
  }
  
  // check if we clicked on a wall space, and if so either create a wall or select it
  if (e.which !== 2) {
    let squareSize = 0.05 * localData.AO.s;
    for (let i = 0; i < mazex; i++) {
      for (let j = 0; j < mazey; j++) {
        let index = 2 + i * 5 + j * mazex * 5;
        let worldSpaceClick = {
          x: relativeX - localData.AO.x - (squareSize * (i - mazex/2) + squareSize * 0.2),
          y: relativeY - localData.AO.y - (squareSize * (j - mazey/2) + squareSize * 0.2)
        };
        if (worldSpaceClick.x > 0 && worldSpaceClick.x < squareSize * 0.8 && worldSpaceClick.y > 0 && worldSpaceClick.y < squareSize * 0.8) {
          maze[index + 0] = (maze[index + 0] + 1) % 2;
          localData.selectedWall = -1;
          localData.wallOpposite = 1;
          localData.changeWallSelection = true;
        }
        // left wall
        if (worldSpaceClick.x > squareSize * -0.2 && worldSpaceClick.x < 0 && worldSpaceClick.y > 0 && worldSpaceClick.y < squareSize * 0.8) {
          if (maze[index + 4] === -1) maze[index + 4] = defaultWallId;
          if (i > 0 && maze[index - 5 + 2] === -1) maze[index - 5 + 2] = defaultWallId;
          localData.selectedWall = index + 4;
          if (i > 0) localData.wallOpposite = -7;
          localData.changeWallSelection = true;
        }
        // right wall
        if (worldSpaceClick.x > squareSize * 0.8 && worldSpaceClick.x < squareSize && worldSpaceClick.y > 0 && worldSpaceClick.y < squareSize * 0.8) {
          if (maze[index + 2] === -1) maze[index + 2] = defaultWallId;
          if (i < mazex - 1 && maze[index + 5 + 4] === -1) maze[index + 5 + 4] = defaultWallId;
          localData.selectedWall = index + 2;
          if (i < mazex - 1) localData.wallOpposite = 7;
          localData.changeWallSelection = true;
        }
        // top wall
        if (worldSpaceClick.x > 0 && worldSpaceClick.x < squareSize * 0.8 && worldSpaceClick.y > squareSize * -0.2 && worldSpaceClick.y < 0) {
          if (maze[index + 1] === -1) maze[index + 1] = defaultWallId;
          if (j > 0 && maze[index - 5 * mazex + 3] === -1) maze[index - 5 * mazex + 3] = defaultWallId;
          localData.selectedWall = index + 1;
          if (j > 0) localData.wallOpposite = -5 * mazex + 2;
          localData.changeWallSelection = true;
        }
        // bottom wall
        if (worldSpaceClick.x > 0 && worldSpaceClick.x < squareSize * 0.8 && worldSpaceClick.y > squareSize * 0.8 && worldSpaceClick.y < squareSize) {
          if (maze[index + 3] === -1) maze[index + 3] = defaultWallId;
          if (j < mazey - 1 && maze[index + 5 * mazex + 1] === -1) maze[index + 5 * mazex + 1] = defaultWallId;
          localData.selectedWall = index + 3;
          if (j < mazey - 1) localData.wallOpposite = 5 * mazex - 2;
          localData.changeWallSelection = true;
        }
      }
    }
    
    if (e.which === 3) {
      if (localData.selectedWall === -1) return;
      maze[localData.selectedWall] = -1;
      maze[localData.selectedWall + localData.wallOpposite] = -1;
      localData.selectedWall = -1;
      localData.changeWallSelection = true;
      return;
    }
    if (localData.selectedWall !== -1) return;
  }
  
  // panning around
  localData.baseOffset = {x: parseFloat(localData.AO.x), y: parseFloat(localData.AO.y)};
  function followMouseAround(e2) {
    localData.AO.x = localData.baseOffset.x - relativeX + (e2.clientX - canvas.width * 0.4 - elm.customMazeCanvas.width/2) / R;
    localData.AO.y = localData.baseOffset.y - relativeY + (e2.clientY - canvas.height * 0.1 - elm.customMazeCanvas.height/2) / R;
  }
  function removeFollowEvent() {
    document.removeEventListener("mousemove", followMouseAround);
    document.removeEventListener("mouseup", removeFollowEvent);
  }
  document.addEventListener("mousemove", followMouseAround);
  document.addEventListener("mouseup", removeFollowEvent);
});

elm.customMazeWallTypes.addEventListener("change", function(e) {
  if (localData.selectedWall === -1) return;
  let maze = SS[localData.selectedLoadout].customMazes[localData.selectedMaze];
  maze[localData.selectedWall] = parseInt(e.target.value);
  if (localData.wallOpposite !== 0) maze[localData.selectedWall + localData.wallOpposite] = parseInt(e.target.value);
});

elm.customMazeSpawnPriority.addEventListener("change", function(e) {
  let maze = SS[localData.selectedLoadout].customMazes[localData.selectedMaze];
  let newSpawnPriority = parseInt(e.target.value);
  if (newSpawnPriority > 0 && newSpawnPriority < 1000000) maze[0] = newSpawnPriority;
  else e.target.value = maze[0];
});

elm.customMazeX.addEventListener("change", function(e) {
  let maze = SS[localData.selectedLoadout].customMazes[localData.selectedMaze];
  let oldmazex = maze[1];
  let oldmazey = (maze.length - 2) / oldmazex / 5;
  let newx = parseInt(e.target.value);
  
  if (newx < 1 || newx > 30) {
    e.target.value = oldmazex;
    return;
  }
  
  if (oldmazex > newx) {
    createPopup(
      0,
      "Confirm Resize", 
      "By decreasing the x size, the map will be cropped. This can not be undone.",
      ["Confirm Crop", "Cancel"],
      [function() {
        for (let i = oldmazey; i > 0; i--) maze.splice(2 + i * oldmazex * 5 - (oldmazex - newx) * 5, (oldmazex - newx) * 5);
        maze[1] = newx;
        localData.changeWallSelection = true;
      }, function() {}],
    );
  }
  else {
    for (let i = oldmazey; i > 0; i--) {
      for (let j = 0; j < newx - oldmazex; j++) {
        let leftTileWallType = maze[2 + i * oldmazex * 5 - 5 + 2];
        maze.splice(2 + i * oldmazex * 5, 0, 0, -1, -1, -1, leftTileWallType);
      }
    }
    maze[1] = newx;
    localData.changeWallSelection = true;
  }
});
elm.customMazeY.addEventListener("change", function(e) {
  let maze = SS[localData.selectedLoadout].customMazes[localData.selectedMaze];
  let oldmazex = maze[1];
  let oldmazey = (maze.length - 2) / oldmazex / 5;
  let newy = parseInt(e.target.value);
  
  if (newy < 1 || newy > 30) {
    e.target.value = oldmazey;
    return;
  }
  
  if (oldmazey > newy) {
    createPopup(
      0,
      "Confirm Resize", 
      "By decreasing the y size, the map will be cropped. This can not be undone.",
      ["Confirm Crop", "Cancel"],
      [function() {
        let spliceDistance = oldmazex * 5 * (oldmazey - newy);
        maze.splice(maze.length - spliceDistance, spliceDistance);
        localData.changeWallSelection = true;
      }, function() {}],
    );
  }
  else {
    for (let j = oldmazey; j < newy; j++) {
      for (let i = 0; i < oldmazex; i++) {
        let topTileWallType = maze[2 + i * 5 + (j - 1) * oldmazex * 5 + 3];
        maze.push(0, topTileWallType, -1, -1, -1);
      }
    }
    localData.changeWallSelection = true;
  }
});

elm.customMazeDelete.addEventListener("click", function(e) {
  if (localData.selectedWall === -1) {
    if (SS[localData.selectedLoadout].customMazes.length > 1) createPopup(
      0,
      "Confirm Maze Deletion", 
      "Deleting the current maze cannot be undone.",
      ["Confirm Deletion", "Cancel"],
      [function() {
        SS[localData.selectedLoadout].customMazes.splice(localData.selectedMaze, 1);
        localData.selectedMaze = 0;
        localData.selectedWall = -1;
        localData.wallOpposite = 0;
        localData.changeWallSelection = true;
      }, function() {}],
    );
    return;
  }
  let maze = SS[localData.selectedLoadout].customMazes[localData.selectedMaze];
  maze[localData.selectedWall] = -1;
  if (localData.wallOpposite !== 0) maze[localData.selectedWall + localData.wallOpposite] = -1;
  localData.selectedWall = -1;
  localData.changeWallSelection = true;
});

elm.rightSettingButton3.addEventListener("click", function() {
  switch (localData.layoutType) {
      // loadout page, delete loadout button
    case 0: {
      if (!SS[localData.selectedLoadout].metadata.owned) {
        createPopup(
          0,
          "Cannot Delete", 
          "You do not actually own this loadout, but rather it is a replica of the host's settings.",
          ["Ok"],
          [function() {}],
        );
        return;
      }
      
      let trueLoadouts = 0;
      for (let s of SS) if (s.metadata.owned) trueLoadouts++;
      if (trueLoadouts > 1) {
        createPopup(
          0,
          "Delete Loadout", 
          `Are you sure you want to delete the loadout ${SS[localData.selectedLoadout].metadata.name}? This action cannot be undone`,
          ["Confirm Deletion", "Cancel"],
          [function() {
            SS.splice(localData.selectedLoadout, 1);
            localData.selectedLoadout = 0;
            setupSettingPage(true);
          }, function() {}],
        );
        return;
      }
      
      createPopup(
        0,
        "Cannot Delete", 
        "You must have at least 1 loadout. If you want to delete this loadout, try making another first.",
        ["Ok"],
        [function() {}],
      );
      break;
    }
      // powerup delete powerup button
    case 2: {
      if (SS[localData.selectedLoadout].powerups.length > 1) {
        createPopup(
          0,
          "Delete Powerup", 
          `Are you sure you want to delete the powerup ${SS[localData.selectedLoadout].powerups[localData.currentPowerupId].name}? This action cannot be undone`,
          ["Confirm Deletion", "Cancel"],
          [function() {
            SS[localData.selectedLoadout].powerups.splice(localData.currentPowerupId, 1);
            localData.currentPowerupId = 0;
            setupSettingPage(true);
          }, function() {}],
        );
        return;
      }
      
      createPopup(
        0,
        "Cannot Delete", 
        "You must have at least 1 powerup, which will act as the default if none are specified. If you want to delete this powerup, try making another first.",
        ["Ok"],
        [function() {}],
      );
      break;
    }
      // apply to all button for powerups
    case 3: {
      createPopup(
        0,
        "Confirm Apply to All", 
        "This will apply the current setting value to EVERY powerup in your loadout, are you very sure?",
        ["I know what I'm doing", "Cancel"],
        [function() {
          let settingLoc = SS[localData.selectedLoadout];
          for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
          let settingValue = structuredClone(settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]]);
          
          for (let i = 0; i < SS[localData.selectedLoadout].powerups.length; i++) {
            let newLoc = SS[localData.selectedLoadout].powerups[i];
            for (let i = 2; i < localData.editingSettingData.location.length - 1; i++) newLoc = newLoc[localData.editingSettingData.location[i]];
            newLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = settingValue;
          }
          setupSettingPage(true);
        }, function() {}],
      );
      break;
    }
      
      // light delete light button
    case 6: {
      if (SS[localData.selectedLoadout].personal.lights.length <= 0) break;
      createPopup(
        0,
        "Delete Light", 
        `Are you sure you want to delete ${SS[localData.selectedLoadout].personal.lights[localData.currentLightId].name}? This action cannot be undone`,
        ["Confirm Deletion", "Cancel"],
        [function() {
          SS[localData.selectedLoadout].personal.lights.splice(localData.currentLightId, 1);
          localData.currentLightId = 0;
          setupSettingPage(true);
        }, function() {}],
      );
      break;
    }
      // wall delete light button
    case 7: {
      if (SS[localData.selectedLoadout].wallTypes.length > 1) {
        createPopup(
          0,
          "Delete Wall", 
          `Are you sure you want to delete ${SS[localData.selectedLoadout].wallTypes[localData.currentWallId].name}? This action cannot be undone`,
          ["Confirm Deletion", "Cancel"],
          [function() {
            SS[localData.selectedLoadout].wallTypes.splice(localData.currentWallId, 1);
            localData.currentWallId = 0;
            setupSettingPage(true);
          }, function() {}],
        );
      }
      else {
        createPopup(
          0,
          "Cannot Delete", 
          "You must have at least 1 wall type. If you want to delete this wall type, try making another first.",
          ["Ok"],
          [function() {}],
        );
      }
      break;
    }
  }
});

elm.rightSettingButton4.addEventListener("click", function() {
  switch (localData.layoutType) {
      // loadout page, create loadout button
    case 0: {
      createPopup(
        0,
        "New Loadout", 
        "Select your method for creating a new loadout",
        ["Use Default", "Duplicate Selected", "Import From File", "Cancel"],
        [function() {
          // use the default loadout as a base
          let newLoadout = structuredClone(defaultSettings);
          newLoadout.metadata.name = "Unnamed Loadout";
          SS.push(newLoadout);
          localData.selectedLoadout = SS.length - 1;
          SS[localData.selectedLoadout].powerups[0].spawning.spawnEquipped = true;
          SS[localData.selectedLoadout].powerups[0].spawning.treatAsDefault = true;
          SS[localData.selectedLoadout].powerups[0].spawning.allowSpawning = false;
          localData.settingPageId = 2001;
          setupSettingPage(true);
        },
        function() {
          // use the selected loadout as a base
          let newLoadout = structuredClone(SS[localData.selectedLoadout]);
          newLoadout.metadata.name = `Copy of ${SS[localData.selectedLoadout].metadata.name}`;
          newLoadout.metadata.name = newLoadout.metadata.name.substring(0, 32);
          SS.push(newLoadout);
          localData.selectedLoadout = SS.length - 1;
          localData.settingPageId = 2001;
          setupSettingPage(true);
        }, 
        function() {
          // import a file
          let input = document.createElement("input");
          input.type = "file";
          input.click();
          input.addEventListener("change", function(e) {
            let reader = new FileReader();
            reader.readAsText(input.files[0], "UTF-8");
            reader.onload = function (e) {
              try {
                let deconstructedFile = structuredClone(JSON.parse(atob(e.target.result)));
                SS.push(deconstructedFile);
                localData.selectedLoadout = SS.length - 1;
                localData.settingPageId = 2001;
                setupSettingPage(true);
              } catch (err) {
                console.log("import failed");
              }
            }
          });
        },
        function() {}],
      );
      break;
    }
      // create powerup button
    case 2: {
      createPopup(
        0,
        "New Powerup", 
        "Select your method for creating a new powerup",
        ["Use Default", "Duplicate Selected", "Import From File", "Cancel"],
        [function() {
          // use the default powerup as a base
          let newPowerup = structuredClone(defaultSettings.powerups[0]);
          newPowerup.name = "New Powerup";
          newPowerup.id = Math.floor(Math.random() * 4294967295);
          SS[localData.selectedLoadout].powerups.push(newPowerup);
          localData.currentPowerupId = SS[localData.selectedLoadout].powerups.length - 1;
          localData.settingPageId = 2062;
          setupSettingPage(true);
        },
        function() {
          // use the selected powerup as a base
          let newPowerup = structuredClone(SS[localData.selectedLoadout].powerups[localData.currentPowerupId]);
          newPowerup.name = `Copy of ${SS[localData.selectedLoadout].powerups[localData.currentPowerupId].name}`;
          newPowerup.name = newPowerup.name.substring(0, 32);
          newPowerup.id = Math.floor(Math.random() * 4294967295);
          SS[localData.selectedLoadout].powerups.push(newPowerup);
          localData.currentPowerupId = SS[localData.selectedLoadout].powerups.length - 1;
          localData.settingPageId = 2062;
          setupSettingPage(true);
        }, 
        function() {
          // import a file
          let input = document.createElement("input");
          input.type = "file";
          input.click();
          input.addEventListener("change", function(e) {
            let reader = new FileReader();
            reader.readAsText(input.files[0], "UTF-8");
            reader.onload = function (evt) {
              let deconstructedFile = structuredClone(JSON.parse(atob(evt.target.result)));
              SS[localData.selectedLoadout].powerups.push(deconstructedFile);
              localData.currentPowerupId = SS[localData.selectedLoadout].powerups.length - 1;
              localData.settingPageId = 2062;
              setupSettingPage(true);
            }
          });
        },
        function() {}],
      );
      break;
    }
      // reset to default button
    case 3: {
      createPopup(
        0,
        "Confirm Reset to Default", 
        "This will overwrite your current value for this setting",
        ["Confirm", "Cancel"],
        [function() {
          let settingLoc = SS[localData.selectedLoadout];
          let defaultLoc = structuredClone(defaultSettings);
          for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) {
            settingLoc = settingLoc[localData.editingSettingData.location[i]];
            defaultLoc = defaultLoc[localData.editingSettingData.location[i]];
          }
          let defaultSettingValue = defaultLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
          settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = defaultSettingValue;
          setupSettingPage(true);
        }, function() {}],
      );
      break;
    }
      
      // create light button
    case 6: {
      let newLight = structuredClone(defaultLight);
      SS[localData.selectedLoadout].personal.lights.push(newLight);
      localData.currentLightId = SS[localData.selectedLoadout].personal.lights.length - 1;
      setupSettingPage(true);
      break;
    }
      // create wall button
    case 7: {
      let newWall = structuredClone(defaultSettings.wallTypes[0]);
      SS[localData.selectedLoadout].wallTypes.push(newWall);
      localData.currentWallId = SS[localData.selectedLoadout].wallTypes.length - 1;
      SS[localData.selectedLoadout].wallTypes[localData.currentWallId].id = Math.floor(Math.random() * 4294967295);
      setupSettingPage(true);
      break;
    }
  }
});

elm.issMinInput.addEventListener("change", function(e) {
  let settingLoc = SS[localData.selectedLoadout];
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
  let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
  if (parseFloat(e.target.value) > settingValue[1]) {
    let placeholder = e.target.value;
    elm.issMinInput.value = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]][0] = settingValue[1];
    elm.issMaxInput.value = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]][1] = parseFloat(placeholder);
    graphIss(settingValue);
    return;
  }
  settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]][0] = parseFloat(e.target.value);
  e.target.value = chop(e.target.value);
  graphIss(settingValue);
});

elm.issMaxInput.addEventListener("change", function(e) {
  let settingLoc = SS[localData.selectedLoadout];
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
  let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
  if (parseFloat(e.target.value) < settingValue[0]) {
    let placeholder = e.target.value;
    elm.issMaxInput.value = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]][1] = settingValue[0];
    elm.issMinInput.value = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]][0] = parseFloat(placeholder);
    graphIss(settingValue);
    return;
  }
  settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]][1] = parseFloat(e.target.value);
  e.target.value = chop(e.target.value);
  graphIss(settingValue);
});

elm.issRoundInput.addEventListener("change", function(e) {
  let settingLoc = SS[localData.selectedLoadout];
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
  settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]][4] = Math.max(Math.abs(parseFloat(e.target.value)), 0.01);
  e.target.value = Math.max(Math.abs(chop(e.target.value)), 0.01);
  graphIss(settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]]);
});

elm.issStrengthInput.addEventListener("change", function(e) {
  let settingLoc = SS[localData.selectedLoadout];
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
  settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]][3] = parseFloat(e.target.value);
  e.target.value = chop(e.target.value);
  graphIss(settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]]);
});

elm.issDistributionInput.addEventListener("click", function(e) {
  let settingLoc = SS[localData.selectedLoadout];
  for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
  let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]][2];
  settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]][2] = settingValue === 0 ? 1 : 0;
  elm.issDistributionInput.innerText = settingValue === 1 ? "Exponential" : "Normal";
  graphIss(settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]]);
});

let backpackState = false;
elm.backpackHider.addEventListener("click", function(e) {
  if (backpackState) {
    elm.backpack.style.left = "85vw";
    elm.backpackHider.style.left = "84vw";
  } else {
    elm.backpack.style.left = "100vw";
    elm.backpackHider.style.left = "99vw";
  }
  backpackState = !backpackState;
});

let leaderboardState = true;
elm.leaderboardHider.addEventListener("click", function(e) {
  if (leaderboardState) {
    elm.leaderboard.style.left = "-15vw";
    elm.leaderboardHider.style.left = "0";
  } else {
    elm.leaderboard.style.left = "0";
    elm.leaderboardHider.style.left = "15vw";
  }
  leaderboardState = !leaderboardState;
});

/**
Key events
*/
document.addEventListener("keydown", function(e) {
  if (e.repeat) return;
  if (localData.keybinding) return;
  let k = e.keyCode ?? e.which;
  
  // toggle settings menu
  if (k === 81) {
    if (
      !localData.settingWindowOpen
      || (   document.activeElement !== elm.settingPageSearchBar 
          && document.activeElement !== elm.rightSettingPartialInput
          && document.activeElement !== elm.rightSettingFullInput)
    ) toggleSettingPage();
  }

  // if we are in the attachment editor, we have some keybinds too
  if (localData.editingSettingData.type === 6 && localData.advancedEditing) {
    // delete
    if (k === 46) elm.attachmentDeleteSelected.click();
    // save
    if (e.ctrlKey && k === 83) elm.attachmentMakePremade.click();
    // copy
    if (e.ctrlKey && k === 67) {
      if (localData.attachmentSelectedShape === null) return;
      let settingLoc = SS[localData.selectedLoadout];
      for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
      let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
      for (let a of settingValue) if (a === localData.attachmentSelectedShape) {
        localData.attachmentCopy = structuredClone(a);
        if (localData.attachmentCopy.length === 6) localData.attachmentCopy[3] += 0.1;
        else for (let i = 3; i < localData.attachmentCopy.length; i += 2) localData.attachmentCopy[i] += 0.1;
      }
    }
    // cut
    if (e.ctrlKey && k === 88) {
      if (localData.attachmentSelectedShape === null) return;
      let settingLoc = SS[localData.selectedLoadout];
      for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
      let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
      for (let a of settingValue) if (a === localData.attachmentSelectedShape) localData.attachmentCopy = structuredClone(a);
      elm.attachmentDeleteSelected.click();
    }
    // paste
    if (e.ctrlKey && k === 86) {
      if (localData.attachmentCopy === null) return;
      let settingLoc = SS[localData.selectedLoadout];
      for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
      let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
      settingValue.push(structuredClone(localData.attachmentCopy));
    }
    // create rect
    if (!e.ctrlKey && k === 82) elm.attachmentAddRectangle.click();
    // create circle
    if (!e.ctrlKey && k === 67) elm.attachmentAddCircle.click();
    // create custom
    if (!e.ctrlKey && k === 83) elm.attachmentAddCustom.click();
    // shift layer up
    if (k === 38) {
      if (localData.attachmentSelectedShape === null) return;
      let settingLoc = SS[localData.selectedLoadout];
      for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
      let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
      for (let a of settingValue) if (a === localData.attachmentSelectedShape) {
        a[0]++;
        a[0] = clamp(a[0], -500, 500);
        elm.attachmentChangeLayer.value = a[0];
      }
    }
    // shift layer down
    if (k === 40) {
      if (localData.attachmentSelectedShape === null) return;
      let settingLoc = SS[localData.selectedLoadout];
      for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
      let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
      for (let a of settingValue) if (a === localData.attachmentSelectedShape) {
        a[0]--;
        a[0] = clamp(a[0], -500, 500);
        elm.attachmentChangeLayer.value = a[0];
      }
    }
    // undo
    if (e.ctrlKey && k === 90) {
      let settingLoc = SS[localData.selectedLoadout];
      for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
      let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
      localData.attachmentUndoHistorySpot++;
      localData.attachmentUndoHistorySpot = clamp(localData.attachmentUndoHistorySpot, 0, localData.undoHistory.length - 1);
      settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = structuredClone(localData.undoHistory[localData.undoHistory.length - 1 - localData.attachmentUndoHistorySpot]);
      localData.attachmentSelectedShape = null;
    }
    // redo
    if (e.ctrlKey && k === 89) {
      let settingLoc = SS[localData.selectedLoadout];
      for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
      let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
      localData.attachmentUndoHistorySpot--;
      localData.attachmentUndoHistorySpot = clamp(localData.attachmentUndoHistorySpot, 0, localData.undoHistory.length - 1);
      settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]] = structuredClone(localData.undoHistory[localData.undoHistory.length - 1 - localData.attachmentUndoHistorySpot]);
      localData.attachmentSelectedShape = null;
    }
  }
  
  if (localData.settingWindowOpen) {
    // move selector panels up and down, just for organization
    if (k === 38) switch (localData.settingPageId) {
        // loadouts
      case 1: {
        if (localData.selectedLoadout <= 0) return;
        const temp = SS[localData.selectedLoadout - 1];
        SS[localData.selectedLoadout - 1] = SS[localData.selectedLoadout];
        SS[localData.selectedLoadout] = temp;
        localData.selectedLoadout--;
        setupSettingPage();
        return;
      }
        // powerups
      case 1023: {
        if (localData.currentPowerupId <= 0) return;
        const temp = SS[localData.selectedLoadout].powerups[localData.currentPowerupId - 1];
        SS[localData.selectedLoadout].powerups[localData.currentPowerupId - 1] = SS[localData.selectedLoadout].powerups[localData.currentPowerupId];
        SS[localData.selectedLoadout].powerups[localData.currentPowerupId] = temp;
        localData.currentPowerupId--;
        setupSettingPage();
        return;
      }
        // lights
      case 1059: {
        if (localData.currentLightId <= 0) return;
        const temp = SS[localData.selectedLoadout].personal.lights[localData.currentLightId - 1];
        SS[localData.selectedLoadout].personal.lights[localData.currentLightId - 1] = SS[localData.selectedLoadout].personal.lights[localData.currentLightId];
        SS[localData.selectedLoadout].personal.lights[localData.currentLightId] = temp;
        localData.currentLightId--;
        setupSettingPage();
        return;
      }
        // wall types
      case 1061: {
        if (localData.currentWallId <= 0) return;
        const temp = SS[localData.selectedLoadout].wallTypes[localData.currentWallId - 1];
        SS[localData.selectedLoadout].wallTypes[localData.currentWallId - 1] = SS[localData.selectedLoadout].wallTypes[localData.currentWallId];
        SS[localData.selectedLoadout].wallTypes[localData.currentWallId] = temp;
        localData.currentWallId--;
        setupSettingPage();
        return;
      }
    }
    if (k === 40) switch (localData.settingPageId) {
      case 1: {
        if (localData.selectedLoadout >= SS.length - 1) return;
        const temp = SS[localData.selectedLoadout + 1];
        SS[localData.selectedLoadout + 1] = SS[localData.selectedLoadout];
        SS[localData.selectedLoadout] = temp;
        localData.selectedLoadout++;
        setupSettingPage();
        return;
      }
      case 1023: {
        if (localData.currentPowerupId >= SS[localData.selectedLoadout].powerups.length - 1) return;
        const temp = SS[localData.selectedLoadout].powerups[localData.currentPowerupId + 1];
        SS[localData.selectedLoadout].powerups[localData.currentPowerupId + 1] = SS[localData.selectedLoadout].powerups[localData.currentPowerupId];
        SS[localData.selectedLoadout].powerups[localData.currentPowerupId] = temp;
        localData.currentPowerupId++;
        setupSettingPage();
        return;
      }
      case 1059: {
        if (localData.currentLightId >= SS[localData.selectedLoadout].personal.lights.length - 1) return;
        const temp = SS[localData.selectedLoadout].personal.lights[localData.currentLightId + 1];
        SS[localData.selectedLoadout].personal.lights[localData.currentLightId + 1] = SS[localData.selectedLoadout].personal.lights[localData.currentLightId];
        SS[localData.selectedLoadout].personal.lights[localData.currentLightId] = temp;
        localData.currentLightId++;
        setupSettingPage();
        return;
      }
      case 1061: {
        if (localData.currentWallId >= SS[localData.selectedLoadout].wallTypes.length - 1) return;
        const temp = SS[localData.selectedLoadout].wallTypes[localData.currentWallId + 1];
        SS[localData.selectedLoadout].wallTypes[localData.currentWallId + 1] = SS[localData.selectedLoadout].wallTypes[localData.currentWallId];
        SS[localData.selectedLoadout].wallTypes[localData.currentWallId] = temp;
        localData.currentWallId++;
        setupSettingPage();
        return;
      }
    }
    return;
  }
  
  for (let c of saveData.keybinds.leavekey) if (k === c) {
    socket.disconnect();
    previousPage();
    break;
  }
  
  for (let c of saveData.keybinds.forwardkey) if (k === c) { socket.talk(encodePacket([protocol.up, 1], ["int8", "int8"])); break; }
  for (let c of saveData.keybinds.backwardkey) if (k === c) { socket.talk(encodePacket([protocol.down, 1], ["int8", "int8"])); break; }
  for (let c of saveData.keybinds.leftkey) if (k === c) { socket.talk(encodePacket([protocol.left, 1], ["int8", "int8"])); break; }
  for (let c of saveData.keybinds.rightkey) if (k === c) { socket.talk(encodePacket([protocol.right, 1], ["int8", "int8"])); break; }
  
  for (let c of saveData.keybinds.firekey) if (k === c) { socket.talk(encodePacket([protocol.space, 1], ["int8", "int8"])); break; }
  for (let c of saveData.keybinds.enterkey) if (k === c) { socket.talk(encodePacket([protocol.enter, 1], ["int8", "int8"])); break; }
  for (let c of saveData.keybinds.actionkey) if (k === c) { socket.talk(encodePacket([protocol.action, 1], ["int8", "int8"])); break; }
  for (let c of saveData.keybinds.unequipkey) if (k === c) { socket.talk(encodePacket([protocol.unequip, 1], ["int8", "int8"])); break; }
  
  if (k >= 49 && k <= 57) {
    for (let i = 1; i < socketData.lastBackpack.length; i += 2) {
      if ((k - 48) * 2 + 1 !== i) continue;
      let powerName = decodeURIComponent(socketData.lastBackpack[i].reduce(function(constructed, nextChar) {
        return constructed + String.fromCharCode(nextChar);
      }, ""));
      socket.talk(encodePacket([protocol.backpackClicked, 0, (i - 1) / 2, powerName], ["int8", "int8", "int8", "string"]));
    }
  }
  if (k >= 97 && k <= 105) {
    for (let i = 1; i < socketData.lastBackpack.length; i += 2) {
      if ((k - 96) * 2 + 1 !== i) continue;
      let powerName = decodeURIComponent(socketData.lastBackpack[i].reduce(function(constructed, nextChar) {
        return constructed + String.fromCharCode(nextChar);
      }, ""));
      socket.talk(encodePacket([protocol.backpackClicked, 0, (i - 1) / 2, powerName], ["int8", "int8", "int8", "string"]));
    }
  }
});

document.addEventListener("keyup", function(e) {
  let k = e.keyCode ?? e.which;
  for (let c of saveData.keybinds.forwardkey) if (k === c) { socket.talk(encodePacket([protocol.up, 0], ["int8", "int8"])); break; }
  for (let c of saveData.keybinds.backwardkey) if (k === c) { socket.talk(encodePacket([protocol.down, 0], ["int8", "int8"])); break; }
  for (let c of saveData.keybinds.leftkey) if (k === c) { socket.talk(encodePacket([protocol.left, 0], ["int8", "int8"])); break; }
  for (let c of saveData.keybinds.rightkey) if (k === c) { socket.talk(encodePacket([protocol.right, 0], ["int8", "int8"])); break; }
  
  for (let c of saveData.keybinds.firekey) if (k === c) { socket.talk(encodePacket([protocol.space, 0], ["int8", "int8"])); break; }
  for (let c of saveData.keybinds.enterkey) if (k === c) { socket.talk(encodePacket([protocol.enter, 0], ["int8", "int8"])); break; }
  for (let c of saveData.keybinds.actionkey) if (k === c) { socket.talk(encodePacket([protocol.action, 0], ["int8", "int8"])); break; }
  for (let c of saveData.keybinds.unequipkey) if (k === c) { socket.talk(encodePacket([protocol.unequip, 0], ["int8", "int8"])); break; }
});

/**
The rendering object
*/
class RenderObject {
  constructor(vertices, id, position, properties) {
    this.vertices = vertices;
    this.truevertices = vertices;
    this.position = position;
    this.trueposition = position;
    this.circle = false;
    this.borderColor = properties.borderColor ?? 0;
    this.borderWidth = properties.borderWidth ?? 0;
    this.color = properties.color ?? 0;
    this.renderOrder = properties.renderOrder ?? 0;
    this.trueOpacity = properties.opacity ?? 1;
    this.opacity = properties.opacity ?? 1;
    this.noCastVertices = [];
    this.shadowCaster = properties.shadowCaster ?? false;
    this.edgeType = properties.edgeType ?? 0;
    this.AABB = {min: {x: 0, y: 0}, max: {x: 0, y: 0}};
    this.svg = false;
    this.doNotRender = properties.doNotRender ?? false;
    this.drawHealthBar = properties.drawHealthBar ?? false;
    this.healthPercentage = properties.healthPercentage ?? 0;
    this.shieldPercentage = properties.shieldPercentage ?? 0;
    this.healthBarSize = properties.healthBarSize ?? 0;
    this.healthBarColor = properties.healthBarColor ?? 25;
    this.lastDamaged = 0;
    this.damagedThisFrame = false;
    this.displayName = properties.displayName ?? "";
    this.trailPoints = properties.trailPoints ?? [];
    this.realTrailPoints = properties.trailPoints ?? [];
    this.trailSize = properties.trailSize ?? 0;
    this.trailFading = properties.trailFading ?? false;
    this.trailColor = properties.trailColor ?? 0;
    this.nameColor = properties.namecolor ?? 0;
    
    this.gone = 2;
    this.id = id;
  }
  
  getCorners(intersection1, intersection2, canvasBorders) {
    if (intersection1[2] === -1 || intersection2[2] === -1) return [];
    if (intersection1[2] === intersection2[2]) return [];
    
    let returnedCorners = [];
    let c = intersection1[2];
    while (true) {
      c = (c + 3) % 4;
      returnedCorners.push(canvasBorders[c][2], canvasBorders[c][3]);
      if (c === intersection2[2]) break;
    }
    return returnedCorners;
  }
  
  /**
  Creates an array of arrays of vertices clumped together, based on the no shadow cast vertices of the shape
  */
  createShadowClumps() {
    let clumps = [];
    let currentClump = [];
    for (let v = 0; v < this.vertices.length; v += 2) {
      if (this.noCastVertices.indexOf(v/2) === -1) currentClump.push(this.vertices[v], this.vertices[v + 1]);
      else {
        currentClump.push(this.vertices[v], this.vertices[v + 1]);
        clumps.push(currentClump);
        currentClump = [];
      }
    }
    
    if (clumps.length === 0) clumps = [[]];
    for (let i = currentClump.length - 1; i >= 0; i--) clumps[0].splice(0, 0, currentClump[i]);
    for (let i = clumps.length - 1; i >= 0; i--) if (clumps[i].length <= 2) clumps.splice(i, 1);
    
    return clumps;
  }
  
  /**
  calculate the shadow for this shape by making every line segment cast one, except those with first intersections
  */
  castShadow(lightPosition) {
    if (!this.shadowCaster) return;
    shadowCtx.beginPath();
    shadowCtx.globalCompositeOperation = "source-over";
    shadowCtx.clearRect(-shadowCutCanvas.width/2, -shadowCutCanvas.height/2, shadowCutCanvas.width, shadowCutCanvas.height);
    
    let canvasBorders = [
      [-canvas.width/2, -canvas.height/2, canvas.width/2, -canvas.height/2],
      [canvas.width/2, -canvas.height/2, canvas.width/2, canvas.height/2],
      [canvas.width/2, canvas.height/2, -canvas.width/2, canvas.height/2],
      [-canvas.width/2, canvas.height/2, -canvas.width/2, -canvas.height/2],
    ];
  
    if (this.vertices.length === 1) {
      // get the line perpendicular to our camera's angle with the circle by getting the inverse of the arctangent
      let circlePerpendicular = Math.atan2(this.position.y - lightPosition.y, this.position.x - lightPosition.x);
      // go our radius in each direction to get the outermost edges from our camera's perspective
      let innerEdgeRight = {
        x: this.position.x - (Math.sin(circlePerpendicular) * this.vertices[0]),
        y: this.position.y + (Math.cos(circlePerpendicular) * this.vertices[0]),
      }
      let innerEdgeLeft = {
        x: this.position.x + (Math.sin(circlePerpendicular) * this.vertices[0]),
        y: this.position.y - (Math.cos(circlePerpendicular) * this.vertices[0]),
      }
      
      shadowCtx.moveTo(innerEdgeRight.x * R, innerEdgeRight.y * R);
      // find where the line emitted from that poitn from our camera intersects the canvas borders
      let outerAngleRight = Math.atan2(innerEdgeRight.y - lightPosition.y, innerEdgeRight.x - lightPosition.x);
      let outerAngleLeft = Math.atan2(innerEdgeLeft.y - lightPosition.y, innerEdgeLeft.x - lightPosition.x);
      
      let intersectLength = 500 * (canvas.width + canvas.height);
          let intersection1 = null;
          let intersection2 = null;
          let offscreen1 = null;
          let offscreen2 = null;
          for (let i = 0; i < 4; i++) {
            let testIntersect1 = lineIntersect(
              innerEdgeRight.x * R, innerEdgeRight.y * R,
              innerEdgeRight.x * R + Math.cos(outerAngleRight) * intersectLength, innerEdgeRight.y * R + Math.sin(outerAngleRight) * intersectLength,
              canvasBorders[i][0], canvasBorders[i][1],
              canvasBorders[i][2], canvasBorders[i][3]
            );
            if (intersection1 === null && testIntersect1) {
              intersection1 = testIntersect1;
              intersection1.push(i);
            }
            else if (intersection1 !== null && testIntersect1) {
              offscreen1 = testIntersect1;
              offscreen1.push(i);
            }

            let testIntersect2 = lineIntersect(
              innerEdgeLeft.x * R, innerEdgeLeft.y * R,
              innerEdgeLeft.x * R + Math.cos(outerAngleLeft) * intersectLength, innerEdgeLeft.y * R + Math.sin(outerAngleLeft) * intersectLength,
              canvasBorders[i][0], canvasBorders[i][1],
              canvasBorders[i][2], canvasBorders[i][3]
            );
            if (intersection2 === null && testIntersect2) {
              intersection2 = testIntersect2;
              intersection2.push(i);
            }
            else if (intersection2 !== null && testIntersect2) {
              offscreen2 = testIntersect2;
              offscreen2.push(i);
            }
          }
        
          let superLargeNumber = 10 * R;
          if (offscreen1 !== null || offscreen2 !== null || intersection1 === null || intersection2 === null) {
            // if one of them has a set of vertices that are off screen from an off screen light, we run this
            // basically cast from the first to second vertice instead
            intersection1 = [innerEdgeRight.x * R + Math.cos(outerAngleRight) * superLargeNumber, innerEdgeRight.y * R + Math.sin(outerAngleRight) * superLargeNumber, -1];
            intersection2 = [innerEdgeLeft.x * R + Math.cos(outerAngleLeft) * superLargeNumber, innerEdgeLeft.y * R + Math.sin(outerAngleLeft) * superLargeNumber, -1];
          }
      
      shadowCtx.lineTo(intersection1[0], intersection1[1]);
      // from those intersection points check if they are on the same wall or not
      // counterclockwise 1
      let corners = this.getCorners(intersection1, intersection2, canvasBorders);
      for (let i = 0; i < corners.length; i += 2) shadowCtx.lineTo(corners[i], corners[i + 1]);
      
      shadowCtx.lineTo(intersection2[0], intersection2[1]);
      shadowCtx.lineTo(innerEdgeLeft.x * R, innerEdgeLeft.y * R);
      shadowCtx.closePath();
      shadowCtx.globalAlpha = this.opacity;
      shadowCtx.fill();
      shadowCtx.globalCompositeOperation = "destination-out";
      drawShape(shadowCtx, this.vertices, this.position, R);
      shadowCtx.fill();
      shadowCtx.globalCompositeOperation = "source-over";
      
      shadowMasterCtx.drawImage(shadowCutCanvas, -shadowCutCanvas.width/2, -shadowCutCanvas.height/2);
      shadowCtx.globalAlpha = 1;
    }
    else {
      // go through each clump of vertices, aka until a no shadow vertice is found, then make a shadow from each clump
      let clumps = this.createShadowClumps();
      for (let c of clumps) {
          let innerEdgeLeft = {
            x: c[0] + this.position.x,
            y: c[1] + this.position.y,
          }
          let innerEdgeRight = {
            x: c[c.length - 2] + this.position.x,
            y: c[c.length - 1] + this.position.y
          }
          let outerAngleRight = Math.atan2(innerEdgeRight.y - lightPosition.y, innerEdgeRight.x - lightPosition.x);
          let outerAngleLeft = Math.atan2(innerEdgeLeft.y - lightPosition.y, innerEdgeLeft.x - lightPosition.x);
          let intersectLength = 500 * (canvas.width + canvas.height);
          let intersection1 = null;
          let intersection2 = null;
          let offscreen1 = null;
          let offscreen2 = null;
          for (let i = 0; i < 4; i++) {
            let testIntersect1 = lineIntersect(
              innerEdgeRight.x * R, innerEdgeRight.y * R,
              innerEdgeRight.x * R + Math.cos(outerAngleRight) * intersectLength, innerEdgeRight.y * R + Math.sin(outerAngleRight) * intersectLength,
              canvasBorders[i][0], canvasBorders[i][1],
              canvasBorders[i][2], canvasBorders[i][3]
            );
            if (intersection1 === null && testIntersect1) {
              intersection1 = testIntersect1;
              intersection1.push(i);
            }
            else if (intersection1 !== null && testIntersect1) {
              offscreen1 = testIntersect1;
              offscreen1.push(i);
            }

            let testIntersect2 = lineIntersect(
              innerEdgeLeft.x * R, innerEdgeLeft.y * R,
              innerEdgeLeft.x * R + Math.cos(outerAngleLeft) * intersectLength, innerEdgeLeft.y * R + Math.sin(outerAngleLeft) * intersectLength,
              canvasBorders[i][0], canvasBorders[i][1],
              canvasBorders[i][2], canvasBorders[i][3]
            );
            if (intersection2 === null && testIntersect2) {
              intersection2 = testIntersect2;
              intersection2.push(i);
            }
            else if (intersection2 !== null && testIntersect2) {
              offscreen2 = testIntersect2;
              offscreen2.push(i);
            }
          }
        
          let superLargeNumber = 10 * R;
          if (offscreen1 !== null || offscreen2 !== null || intersection1 === null || intersection2 === null) {
            // if one of them has a set of vertices that are off screen from an off screen light, we run this
            // basically cast from the first to second vertice instead
            intersection1 = [innerEdgeRight.x * R + Math.cos(outerAngleRight) * superLargeNumber, innerEdgeRight.y * R + Math.sin(outerAngleRight) * superLargeNumber, -1];
            intersection2 = [innerEdgeLeft.x * R + Math.cos(outerAngleLeft) * superLargeNumber, innerEdgeLeft.y * R + Math.sin(outerAngleLeft) * superLargeNumber, -1];
          }
        
          shadowCtx.moveTo((c[2] + this.position.x) * R, (c[3] + this.position.y) * R);
          for (let i = 0; i < c.length; i += 2) {
            shadowCtx.lineTo((c[i] + this.position.x) * R, (c[i + 1] + this.position.y) * R);
          }
          shadowCtx.lineTo(innerEdgeRight.x * R, innerEdgeRight.y * R);
          shadowCtx.lineTo(intersection1[0], intersection1[1]);
          let corners = this.getCorners(intersection1, intersection2, canvasBorders);
          for (let i = 0; i < corners.length; i += 2) shadowCtx.lineTo(corners[i], corners[i + 1]);

          shadowCtx.lineTo(intersection2[0], intersection2[1]);
          shadowCtx.lineTo(innerEdgeLeft.x * R, innerEdgeLeft.y * R);
          shadowCtx.closePath();
          shadowCtx.globalAlpha = this.opacity;
          shadowCtx.fill();

          shadowMasterCtx.drawImage(shadowCutCanvas, -shadowCutCanvas.width/2, -shadowCutCanvas.height/2);
      }
    }
  }
  
  drawEffects() {
    let timeSinceDamaged = new Date().getTime() - this.lastDamaged;
    if (this.drawHealthBar && ((this.healthPercentage > 0 && this.healthPercentage < 1) || this.shieldPercentage > 0)) {
      let lowestAlpha = 0.2 * this.opacity;
      let highestAlpha = 0.8 * this.opacity;
      if (timeSinceDamaged < 4500) gameCtx.globalAlpha = highestAlpha;
      else if (timeSinceDamaged >= 4500) gameCtx.globalAlpha = (highestAlpha - lowestAlpha) * clamp((5000 - timeSinceDamaged) / 500, 0, 1) + lowestAlpha;
      else gameCtx.globalAlpha = lowestAlpha;
      // health bar
      gameCtx.beginPath();
      gameCtx.rect(
        (this.position.x - this.healthBarSize) * R, (this.position.y + this.healthBarSize * 1.2) * R, 
        this.healthBarSize * 2 * R * this.healthPercentage, this.healthBarSize * 0.1 * R
      );
      gameCtx.fillStyle = getColor(this.healthBarColor);
      gameCtx.fill();
      gameCtx.beginPath();
      gameCtx.rect(
        (this.position.x - this.healthBarSize + this.healthBarSize * 2 * this.healthPercentage) * R, (this.position.y + this.healthBarSize * 1.2) * R, 
        this.healthBarSize * 2 * R * (1 - this.healthPercentage), this.healthBarSize * 0.1 * R
      );
      gameCtx.fillStyle = pageColors[saveData.theme]["--red"];
      gameCtx.fill();
      // shield bar
      if (this.shieldPercentage > 0) {
        gameCtx.globalAlpha = 0.8 * this.opacity;
        gameCtx.beginPath();
        gameCtx.rect(
          (this.position.x - this.healthBarSize) * R, (this.position.y + this.healthBarSize * 1.4) * R, 
          this.healthBarSize * 2 * R * this.shieldPercentage, this.healthBarSize * 0.1 * R
        );
        gameCtx.fillStyle = pageColors[saveData.theme]["--blue"];
        gameCtx.fill();
        gameCtx.beginPath();
        gameCtx.rect(
          (this.position.x - this.healthBarSize + this.healthBarSize * 2 * this.shieldPercentage) * R, (this.position.y + this.healthBarSize * 1.4) * R, 
          this.healthBarSize * 2 * R * (1 - this.shieldPercentage), this.healthBarSize * 0.1 * R
        );
        gameCtx.fillStyle = pageColors[saveData.theme]["--grey"];
        gameCtx.fill();
      }
    }
    
    gameCtx.globalAlpha = this.opacity;
    if (this.displayName.length > 0) {
      gameCtx.beginPath();
      gameCtx.textAlign = "center";
      gameCtx.font = R * this.healthBarSize + "px Jetbrains Mono";
      gameCtx.lineWidth = R * this.healthBarSize * 0.1;
      gameCtx.fillStyle = getColor(this.nameColor);
      gameCtx.strokeStyle = pageColors[saveData.theme]["--white"];
      gameCtx.strokeText(this.displayName, this.position.x * R, (this.position.y - this.healthBarSize * 1.5) * R);
      gameCtx.fillText(this.displayName, this.position.x * R, (this.position.y - this.healthBarSize * 1.5) * R);
    }
    gameCtx.globalAlpha = 1;
  }
  
  drawTrail() {
    for (let i = 0; i < this.realTrailPoints.length; i += 3) {
      if (this.trailPoints.length > this.realTrailPoints.length) {
        this.trailPoints.splice(0, this.trailPoints.length - this.realTrailPoints.length);
      }
      if (i >= this.trailPoints.length) {
        this.trailPoints.push(this.realTrailPoints[i]);
        this.trailPoints.push(this.realTrailPoints[i + 1]);
        this.trailPoints.push(this.realTrailPoints[i + 2]);
      }
      else {
        this.trailPoints[i] = lerp(this.trailPoints[i], this.realTrailPoints[i], saveData.lerpValue/100);
        this.trailPoints[i + 1] = lerp(this.trailPoints[i + 1], this.realTrailPoints[i + 1], saveData.lerpValue/100);
      }
    }
    gameCtx.lineWidth = this.trailSize * R;
    gameCtx.strokeStyle = getColor(this.trailColor);
    gameCtx.beginPath();
    gameCtx.globalAlpha = this.opacity;
    for (let i = 3; i < this.trailPoints.length; i += 3) {
      gameCtx.beginPath();
      gameCtx.moveTo(this.trailPoints[i - 3] * R, this.trailPoints[i - 2] * R);
      gameCtx.lineTo(this.trailPoints[i] * R, this.trailPoints[i + 1] * R);
      if (this.trailFading) gameCtx.globalAlpha = this.opacity * i / this.trailPoints.length;
      gameCtx.stroke();
    }
  }
  
  render() {
    this.opacity = lerp(this.opacity, this.trueOpacity, saveData.lerpValue/100);
    this.position = {
      x: lerp(this.position.x, this.trueposition.x, saveData.lerpValue/100),
      y: lerp(this.position.y, this.trueposition.y, saveData.lerpValue/100)
    }
    if (this.vertices.length !== 1) {
      if (this.vertices.length !== this.truevertices.length) {
        this.vertices = new Array(this.truevertices.length).fill(0);
      } else {
        for (let v = 0; v < this.vertices.length; v++) {
          this.vertices[v] = lerp(this.vertices[v], this.truevertices[v], saveData.lerpValue/100);
        }
      }
    } else this.vertices = this.truevertices;
    
    if (this.vertices.length > 1) {
      this.AABB = {
        min: {x: this.position.x + this.vertices[0], y: this.position.y + this.vertices[1]},
        max: {x: this.position.x + this.vertices[0], y: this.position.y + this.vertices[1]}
      };
      for (let i = 2; i < this.vertices.length; i += 2) {
        this.AABB.min.x = Math.min(this.AABB.min.x, this.vertices[i]);
        this.AABB.max.x = Math.max(this.AABB.max.x, this.vertices[i]);
        this.AABB.min.y = Math.min(this.AABB.min.y, this.vertices[i + 1]);
        this.AABB.max.y = Math.max(this.AABB.max.y, this.vertices[i + 1]);
      }
    } else {
      this.AABB = {
        min: {x: this.position.x + this.vertices[0], y: this.position.y + this.vertices[0]},
        max: {x: this.position.x + this.vertices[0], y: this.position.y + this.vertices[0]}
      };
    }
    
    this.drawEffects();
    if (this.doNotRender) return;
    
    gameCtx.beginPath();
    gameCtx.globalAlpha = Math.min(1, Math.max(0, this.opacity));
    gameCtx.strokeStyle = this.damagedThisFrame ? pageColors[saveData.theme]["--red"] : getColor(this.borderColor);
    gameCtx.lineWidth = Math.max(this.borderWidth * R, 1);
    if (this.edgeType === 1) gameCtx.lineJoin = "round";
    if (this.color === -2) gameCtx.fillStyle = gameCtx.strokeStyle;
    else gameCtx.fillStyle = getColor(this.color);
    
    gameCtx.save();
    let path = (this.vertices[0] === -99999 || this.vertices[0] === -99998) ? new Path2D(this.vertices.slice(6).map(code => String.fromCharCode(code)).join("")) : null;
    let usedImg = undefined;
    if (this.vertices[0] === -99998) {
      let svgData = this.vertices.slice(6).map(code => String.fromCharCode(code)).join("");
      let mapValue = localData.preloadedSVGs.get(svgData);
      if (mapValue) usedImg = mapValue;
      else {
        const svg = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svg);
        const img = new Image();

        img.onload = () => {
          img.ready = true;
          URL.revokeObjectURL(url);
        };

        img.src = url;

        localData.preloadedSVGs.set(svgData, img);
      }
    }
    if (this.vertices[0] !== -99999 && this.vertices[0] !== -99998) {
      let adjVerts = structuredClone(this.vertices);
      if (this.edgeType !== 2) {
        if (this.vertices.length !== 1) {
          let center = {x: 0, y: 0};
          for (let i = 0; i < adjVerts.length; i += 2) {
            center.x += adjVerts[i];
            center.y += adjVerts[i + 1];
          }
          center.x /= adjVerts.length/2;
          center.y /= adjVerts.length/2;
          for (let i = 0; i < adjVerts.length; i += 2) {
            let totalDistance = dist({x: adjVerts[i], y: adjVerts[i + 1]}, center);
            let newDistance = Math.max(0, totalDistance - Math.max(this.borderWidth * R, 1)/2);
            if (newDistance === 0) continue;
            let theta = Math.atan2(adjVerts[i + 1] - center.y, adjVerts[i] - center.x);
            adjVerts[i] = Math.cos(theta) * newDistance + center.x;
            adjVerts[i + 1] = Math.sin(theta) * newDistance + center.y;
          }
        }
        else {
          adjVerts[0] = clamp(adjVerts[0] - this.borderWidth / 2, 0, Infinity);
        }
      }
      drawShape(gameCtx, adjVerts, this.position, R);
    }
    if (this.vertices[0] === -99999 || this.vertices[0] === -99998) {
      gameCtx.translate(this.position.x * R, this.position.y * R);
      gameCtx.scale(this.vertices[2] * R, this.vertices[2] * R);
      gameCtx.rotate(this.vertices[1]);
      gameCtx.lineWidth = Math.max(this.borderWidth * R, 1) / (this.vertices[2] * R);
    }
    if (this.vertices[0] === -99998 && usedImg && usedImg.ready) gameCtx.drawImage(usedImg, -1, -1, 2, 2);
    else {
      if (this.edgeType !== 3) {
        if (path !== null) gameCtx.fill(path);
        else gameCtx.fill();
      }
      if (this.edgeType !== 2) {
        if (path !== null) gameCtx.stroke(path);
        else gameCtx.stroke();
      }
    }
    gameCtx.restore();
    gameCtx.globalAlpha = 1;
    gameCtx.lineJoin = "miter";
    this.damagedThisFrame = false;
  }
  
  destroy() {
    socketData.objects.splice(socketData.objects.indexOf(this), 1);
  }
}

/**
Can be the player's camera, or simply a cutout of the scene to allow the player to see in their visible area
*/
class LightSource {
  constructor(camera, id, radius, position, properties) {
    this.camera = camera;
    this.id = id;
    this.gone = 2;
    this.precision = 300;
    this.radius = radius;
    this.trueradius = radius;
    this.position = position;
    this.trueposition = position;
    this.visibleObjects = [];
    this.ignoreWalls = properties.ignoreWalls ?? true;
    this.opacity = properties.opacity ?? 1;
    this.arc = properties.arc ?? {start: 0, end: Math.PI * 2};
    this.truearc = properties.arc ?? {start: 0, end: Math.PI * 2};
    this.obfuscator = properties.obfuscator ?? false;
    this.renderOverShadows = properties.renderOverShadows ?? false;
    this.colorTint = properties.colorTint ?? 0;
  }
  
  /**
  Creates a light mesh by taking every line segment of every shape, adding it to a mesh facing away
  From the camera, removing all line segments that have a first intersect with a camera ray,
  Then adding in lights
  */
  makeShadowMesh() {
    
    this.position = {
      x: lerp(this.position.x, this.trueposition.x, saveData.lerpValue/100),
      y: lerp(this.position.y, this.trueposition.y, saveData.lerpValue/100)
    }
    this.radius = lerp(this.radius, this.trueradius, saveData.lerpValue/100);
    this.arc = {
      start: lerp(this.arc.start, this.truearc.start, saveData.lerpValue/100),
      end: lerp(this.arc.end, this.truearc.end, saveData.lerpValue/100)
    }
    
    // check what objects exist in our light pool, if any
    this.visibleObjects = [];
    if (!this.ignoreWalls) for (let o of socketData.objects) {
      o.noCastVertices = [];
      if (!this.camera) {
        if (RectangleCircle({
          x: o.AABB.min.x,
          y: o.AABB.min.y, 
          w: o.AABB.max.x - o.AABB.min.x,
          h: o.AABB.max.y - o.AABB.min.y
        }, {
          x: this.position.x,
          y: this.position.y,
          r: this.radius
        })) this.visibleObjects.push(o);
      } else this.visibleObjects.push(o);
    }
    
    
    // for each midpoint of shadowcasting shapes' segments, check if we can see it without passing through its other segments
    // if so disable its shadow since that means it is at the front of the shape
      if (!this.ignoreWalls) for (let o of this.visibleObjects) {
        if (!o.shadowCaster) continue;
        for (let v = 0; v < o.vertices.length; v += 2) {
          let m = {
            x: (o.vertices[v] + o.vertices[(v + 2) % o.vertices.length]) / 2,
            y: (o.vertices[v + 1] + o.vertices[(v + 3) % o.vertices.length]) / 2
          };
          let backwall = false;
          let intersections = [];
          for (let v2 = 0; v2 < o.vertices.length; v2 += 2) {
            let intersect = lineIntersect(
              this.position.x, this.position.y,
              m.x + o.position.x, m.y + o.position.y,
              o.position.x + o.vertices[v2], o.position.y + o.vertices[v2 + 1],
              o.position.x + o.vertices[(v2 + 2) % o.vertices.length], o.position.y + o.vertices[(v2 + 3) % o.vertices.length]
            );
            if (v2 === v) {
              intersect = [m.x + o.position.x, m.y + o.position.y];
            }
            if (intersect === null) continue;
            intersect.push(v2);
            intersections.push(intersect);
          }
          intersections.sort((a, b) => {
            if ((a[0] - this.position.x) ** 2 + (a[1] - this.position.y) ** 2 > (b[0] - this.position.x) ** 2 + (b[1] - this.position.y) ** 2) return 1;
            return -1;
          });
          if (intersections.length > 0) {
            if (intersections[0][2] === v) {
              o.noCastVertices.push(v/2);
            }
          }
        }
      }
    shadowMasterCtx.globalCompositeOperation = "source-over";
    if (!this.camera) this.cutCircle(shadowMasterCtx);
    else shadowMasterCtx.clearRect(-shadowMasterCanvas.width/2, -shadowMasterCanvas.height/2, shadowMasterCanvas.width, shadowMasterCanvas.height);
    if (!this.ignoreWalls) for (let o of this.visibleObjects) {
      shadowMasterCtx.beginPath();
      o.castShadow(this.position);
    }
    maskCtx.globalCompositeOperation = "source-in";
    if (this.camera) {
      this.cutCircle(shadowCtx);
      maskCtx.drawImage(shadowCutCanvas, -maskCanvas.width/2, -maskCanvas.height/2);
      maskCtx.globalCompositeOperation = "source-over";
      maskCtx.drawImage(shadowMasterCanvas, -maskCanvas.width/2, -maskCanvas.height/2);
    }
    else {
      if (this.obfuscator) {
        shadowMasterCtx.globalCompositeOperation = "source-out";
        shadowMasterCtx.fillStyle = getColor(this.colorTint);
        shadowMasterCtx.fillRect(-shadowMasterCanvas.width/2, -shadowMasterCanvas.height/2, shadowMasterCanvas.width, shadowMasterCanvas.height);
        gameCtx.globalCompositeOperation = "source-over";
        gameCtx.drawImage(shadowMasterCanvas, -canvas.width/2, -canvas.height/2);
      }
      else maskCtx.drawImage(shadowMasterCanvas, -maskCanvas.width/2, -maskCanvas.height/2);
    }
  }
  
  cutCircle(ctx) {
    // first render the circles directly onto the canvas because they are the max we can see
    ctx.beginPath();
    ctx.fillRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "destination-out";
    ctx.moveTo(this.position.x * R, this.position.y * R);
    ctx.arc(this.position.x * R, this.position.y * R, this.radius * R, this.arc.start, this.arc.end);
    ctx.globalAlpha = this.opacity;
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }
  
  destroy() {
    socketData.lights.splice(socketData.lights.indexOf(this), 1);
  }
}

  let baseDim = 0.2
  let ranpoints = 6;
  let points = [];
  for (let i = 0; i < ranpoints; i++) {
    let x = Math.random() * Math.cos(i * 2 * Math.PI/ranpoints);
    let y = Math.random() * Math.sin(i * 2 * Math.PI/ranpoints);
    points.push(x, y);
  }

function update() {
  requestAnimationFrame(update);
  
  if (pageColors === undefined) return;
  
  gameCtx.fillStyle = pageColors[saveData.theme]["--white"];
  gameCtx.fillRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
  
  socketData.objects.sort(function(a, b) {
    if(a.renderOrder > b.renderOrder) return 1;
    if(a.renderOrder < b.renderOrder) return -1;
    return 0;
  });
  
  // draw all borders
  if (socketData.trueBorders !== null) {
    if (socketData.borders === null) socketData.borders = {
      left: socketData.trueBorders.left,
      right: socketData.trueBorders.right,
      top: socketData.trueBorders.top,
      bottom: socketData.trueBorders.bottom
    }
    
    socketData.borders.left = lerp(socketData.borders.left, socketData.trueBorders.left, saveData.lerpValue/100);
    socketData.borders.right = lerp(socketData.borders.right, socketData.trueBorders.right, saveData.lerpValue/100);
    socketData.borders.top = lerp(socketData.borders.top, socketData.trueBorders.top, saveData.lerpValue/100);
    socketData.borders.bottom = lerp(socketData.borders.bottom, socketData.trueBorders.bottom, saveData.lerpValue/100);
    
    gameCtx.beginPath();
    gameCtx.strokeStyle = pageColors[saveData.theme]["--black"];
    gameCtx.lineWidth = R * 0.001;
    gameCtx.moveTo(socketData.borders.left * R, socketData.borders.top * R);
    gameCtx.lineTo(socketData.borders.right * R, socketData.borders.top * R);
    gameCtx.lineTo(socketData.borders.right * R, socketData.borders.bottom * R);
    gameCtx.lineTo(socketData.borders.left * R, socketData.borders.bottom * R);
    gameCtx.closePath();
    gameCtx.stroke();
  }
  
  if (localData.expectedTimer >= 0) {
    let time = Math.max((localData.expectedTimerEnd - new Date().getTime()), 0);
    elm.gameTimer.innerText = `${Math.floor(time / 1000)}.${Math.floor((time % 1000) / 100)}`;
    if (time <= 0) elm.gameTimer.style.color = pageColors[saveData.theme]["--red"];
    else elm.gameTimer.style.color = pageColors[saveData.theme]["--black"];
  }
  else elm.gameTimer.innerText = "";

  // to draw trails under bullets, we first loop through and check if any bullets have a trail to draw
  for (let r of socketData.objects) if (r.realTrailPoints.length > 0) r.drawTrail();
  // draw all objects
  for (let r of socketData.objects) r.render();
  
  // draw a line to the nearest crowned player if that is even a thing
  if (socketData.trueNearestCrown.x !== 0 || socketData.trueNearestCrown.y !== 0) {
    socketData.nearestCrown.x = lerp(socketData.nearestCrown.x, socketData.trueNearestCrown.x, saveData.lerpValue/100);
    socketData.nearestCrown.y = lerp(socketData.nearestCrown.y, socketData.trueNearestCrown.y, saveData.lerpValue/100);
    
    gameCtx.beginPath();
    gameCtx.strokeStyle = pageColors[saveData.theme]["--black"];
    gameCtx.lineJoin = "round";
    gameCtx.lineWidth = R * 0.001;
    gameCtx.moveTo(0, 0);
    gameCtx.lineTo(socketData.nearestCrown.x * R, socketData.nearestCrown.y * R);
    gameCtx.stroke();
    gameCtx.lineJoin = "miter";
  }
  
  socketData.lights.sort((a, b) => {
    if (a.obfuscator && !b.obfuscator) return b.camera ? -1 : 1;
    if (b.obfuscator && !a.obfuscator) return a.camera ? 1 : -1;
    
    if (a.camera && !b.camera) return 1;
    if (!a.camera && b.camera) return -1;
    return 0;
  });
  maskCtx.beginPath();
  maskCtx.globalAlpha = 1;
  maskCtx.globalCompositeOperation = "source-over";
  maskCtx.fillStyle = pageColors[saveData.theme]["--black"];
  shadowCtx.fillStyle = pageColors[saveData.theme]["--black"];
  maskCtx.fillRect(-maskCanvas.width/2, -maskCanvas.height/2, maskCanvas.width, maskCanvas.height);
  for (let l of socketData.lights) {
    if (l.obfuscator && l.renderOverShadows) continue;
    l.makeShadowMesh();
  }
  gameCtx.drawImage(maskCanvas, -maskCanvas.width/2, -maskCanvas.height/2);
  
  for (let l of socketData.lights) {
    if (!l.obfuscator || !l.renderOverShadows) continue;
    l.makeShadowMesh();
  }
  
  // draw custom maze canvas
  if (localData.editingSettingData.type === 9 && localData.advancedEditing && SS[localData.selectedLoadout].customMazes.length > localData.selectedMaze) {
    let maze = SS[localData.selectedLoadout].customMazes[localData.selectedMaze];
    let mazex = maze[1];
    let mazey = (maze.length - 2) / mazex / 5;
    let squareSize = 0.05 * localData.AO.s;
    
    if (localData.changeWallSelection) {
      if (localData.selectedWall === -1) {
        elm.customMazeY.value = mazey;
        elm.customMazeX.value = mazex;
        elm.customMazeSpawnPriority.value = maze[0];
        
        elm.customMazeDelete.innerText = "Delete Maze";
        elm.customMazeWallTypes.style.display = "none";
        elm.customMazeSpawnPriority.style.display = "flex";
        elm.customMazeX.style.display = "flex";
        elm.customMazeY.style.display = "flex";
        elm.customMazeWallTypesDesc.style.display = "none";
        elm.customMazeSpawnPriorityDesc.style.display = "flex";
        elm.customMazeXDesc.style.display = "flex";
        elm.customMazeYDesc.style.display = "flex";
      }
      else {
        elm.customMazeWallTypes.value = maze[localData.selectedWall];
        
        elm.customMazeDelete.innerText = "Delete Wall";
        elm.customMazeWallTypes.style.display = "flex";
        elm.customMazeSpawnPriority.style.display = "none";
        elm.customMazeX.style.display = "none";
        elm.customMazeY.style.display = "none";
        elm.customMazeWallTypesDesc.style.display = "flex";
        elm.customMazeSpawnPriorityDesc.style.display = "none";
        elm.customMazeXDesc.style.display = "none";
        elm.customMazeYDesc.style.display = "none";
      }
      
      while (elm.customMazeBar.childElementCount > 0) elm.customMazeBar.removeChild(elm.customMazeBar.lastChild);
      for (let i = 0; i < SS[localData.selectedLoadout].customMazes.length; i++) {
        let m = SS[localData.selectedLoadout].customMazes[i];
        let tab = document.createElement("div");
        tab.classList.add("custommazetab");
        tab.classList.add("tabgrey");
        tab.innerText = `${m[1]}x${(m.length - 2)/m[1]/5} Maze`;
        tab.addEventListener("click", function(e) {
          localData.selectedMaze = i;
          localData.changeWallSelection = true;
        });
        elm.customMazeBar.appendChild(tab);
      }
      let tab = document.createElement("div");
      tab.classList.add("custommazetab");
      tab.classList.add("tabgreen");
      tab.innerText = `New Maze`;
      tab.addEventListener("click", function(e) {
        SS[localData.selectedLoadout].customMazes.push([100, 2,  0, -1, -1, -1, -1,  0, -1, -1, -1, -1,  0, -1, -1, -1, -1,  0, -1, -1, -1, -1]);
        localData.changeWallSelection = true;
      });
      elm.customMazeBar.appendChild(tab);
    }
    localData.changeWallSelection = false;
    
    cusctx.fillStyle = pageColors[saveData.theme]["--white"];
    cusctx.fillRect(-elm.customMazeCanvas.width/2, -elm.customMazeCanvas.height/2, elm.customMazeCanvas.width, elm.customMazeCanvas.height);
    cusctx.strokeStyle = pageColors[saveData.theme]["--orange"];
    cusctx.lineWidth = 0.002 * R * localData.AO.s;
    for (let i = 0; i < mazex; i++) {
      for (let j = 0; j < mazey; j++) {
        let index = 2 + i * 5 + j * mazex * 5;
        cusctx.beginPath();
        cusctx.fillStyle = maze[index + 0] ? pageColors[saveData.theme]["--veryDarkGrey"] : pageColors[saveData.theme]["--veryLightGrey"];
        cusctx.rect(
          (localData.AO.x + squareSize * (i - mazex/2) + squareSize * 0.2) * R,
          (localData.AO.y + squareSize * (j - mazey/2) + squareSize * 0.2) * R,
          squareSize * 0.8 * R,
          squareSize * 0.8 * R
        );
        cusctx.fill();
        
        for (let k = 1; k <= 4; k++) {
          if (k === 1 && j !== 0) continue;
          if (k === 4 && i !== 0) continue;
          let wallType = maze[index + k];
          
          cusctx.beginPath();
          if (maze[index + k] === -1) cusctx.fillStyle = pageColors[saveData.theme]["--lightGrey"];
          else {
            let idFound = false;
            for (let w of SS[localData.selectedLoadout].wallTypes) {
              if (w.id !== maze[index + k]) continue;
              cusctx.fillStyle = getColor(w.color);
              idFound = true;
              break;
            }
            if (!idFound) {
              maze[index + k] = SS[localData.selectedLoadout].wallTypes[0].id;
              cusctx.fillStyle = pageColors[saveData.theme]["--black"];
            }
          }
          
          let smallWidth = 0.2 * squareSize;
          let smallHeight = 0.2 * squareSize;
          let xMod = 0;
          let widthMod = 0;
          let yMod = 0;
          let heightMod = 0;
          if (maze[index + k] !== -1) {
            if (k === 1 || k === 3) {
              widthMod = smallWidth;
              xMod = -smallWidth/2;
              if (maze[index + 4] !== -1 || 
                  ((k === 1) && (j > 0 && maze[index - 5 * mazex + 4] !== -1)) || 
                  ((k === 3) && (j < mazey - 1 && maze[index + 5 * mazex + 4] !== -1))
              ) {
                widthMod -= smallWidth/2;
                xMod += smallWidth/2;
              }
              if (maze[index + 2] !== -1 || 
                  ((k === 1) && (j > 0 && maze[index - 5 * mazex + 2] !== -1)) || 
                  ((k === 3) && (j < mazey - 1 && maze[index + 5 * mazex + 2] !== -1))
              ) {
                widthMod -= smallWidth/2;
              }
            }
            
            if (k === 2) {
              if (j <= 0 || maze[index - 5 * mazex + 2] === -1) {
                heightMod += smallHeight;
                yMod -= smallHeight;
              }
              else if (j > 0) {
                heightMod += smallHeight/2;
                yMod -= smallHeight/2;
              }
              if (j >= mazey - 1 || maze[index + 5 * mazex + 2] === -1) {
                heightMod += smallHeight;
              }
              else if (j < mazey - 1) {
                heightMod += smallHeight/2;
              }
            }
            if (k === 4) {
              if (j <= 0 || maze[index - 5 * mazex + 4] === -1) {
                heightMod += smallHeight;
                yMod -= smallHeight;
              }
              else if (j > 0) {
                heightMod += smallHeight/2;
                yMod -= smallHeight/2;
              }
              if (j >= mazey - 1 || maze[index + 5 * mazex + 4] === -1) {
                heightMod += smallHeight;
              }
              else if (j < mazey - 1) {
                heightMod += smallHeight/2;
              }
            }
          }
          
          cusctx.rect(
            (localData.AO.x + squareSize * (i - mazex/2) + (k === 1 || k === 3 ? squareSize * 0.2 : 0) + (k === 2 ? squareSize : 0) + xMod) * R,
            (localData.AO.y + squareSize * (j - mazey/2) + (k === 2 || k === 4 ? squareSize * 0.2 : 0) + (k === 3 ? squareSize : 0) + yMod) * R,
            (squareSize * (k === 1 || k === 3 ? 0.8 : 0.2) + widthMod) * R,
            (squareSize * (k === 1 || k === 3 ? 0.2 : 0.8) + heightMod) * R
          );
          cusctx.fill();
          if (localData.selectedWall === index + k || localData.selectedWall + localData.wallOpposite === index + k) cusctx.stroke();
        }
      }
    }
  }
  // draw attachment canvas
  else if (localData.editingSettingData.type === 6 && localData.advancedEditing) {
    let settingLoc = SS[localData.selectedLoadout];
    for (let i = 0; i < localData.editingSettingData.location.length - 1; i++) settingLoc = settingLoc[localData.editingSettingData.location[i]];
    let settingValue = settingLoc[localData.editingSettingData.location[localData.editingSettingData.location.length - 1]];
          
    if (localData.attachmentSelectedShape !== null) elm.attachmentEditHolder.style.display = "block";
    else elm.attachmentEditHolder.style.display = "none";
    
    // if our current attachment exists already as a save, change the save button text
    let attachmentSaves;
    if (localData.settingPageId === 2064) attachmentSaves = localStorage.getItem("attachmentTankSaves") ? JSON.parse(atob(localStorage.getItem("attachmentTankSaves"))) : [];
    else if (localData.settingPageId === 2067) attachmentSaves = localStorage.getItem("attachmentBulletSaves") ? JSON.parse(atob(localStorage.getItem("attachmentBulletSaves"))) : [];
    else if (localData.settingPageId === 2065) attachmentSaves = localStorage.getItem("attachmentBubbleSaves") ? JSON.parse(atob(localStorage.getItem("attachmentBubbleSaves"))) : [];
    else attachmentSaves = [];
    elm.attachmentMakePremade.innerText = "Save Attachment";
    for (let a of attachmentSaves) {
      if (a.value.length !== settingValue.length) continue;
      let breaker = false;
      for (let i = 0; i < a.value.length; i++) {
        if (a.value[i].length !== settingValue[i].length) breaker = true;
        if (!a.value[i].every((val, idx) => val === settingValue[i][idx])) breaker = true;
        if (breaker) break;
      }
      if (!breaker) {
        elm.attachmentMakePremade.innerText = "Unsave Attachment";
        break;
      }
    }
    
    // create all attachments that appear under the tank body when in the attachment editor
    attctx.globalAlpha = 1;
    attctx.clearRect(-elm.attachmentCanvas.width/2, -elm.attachmentCanvas.height/2, elm.attachmentCanvas.width, elm.attachmentCanvas.height);
    if (localData.attachmentSnapping !== 2) {
      attctx.lineWidth = R * 0.001;
      attctx.strokeStyle = pageColors[saveData.theme]["--grey"];
      attctx.beginPath();
      let usedSnapValue = localData.attachmentSnapping === 0 ? 0.02 : 0.01;
      if (!localData.attachmentLockGrid) usedSnapValue *= 5 ** -Math.round(Math.log(localData.AO.s) / Math.log(5));
      
      for (let i = 0; i < elm.attachmentCanvas.width; i += R * usedSnapValue * localData.AO.s) {
        attctx.moveTo(i + (localData.AO.x % (usedSnapValue * localData.AO.s)) * R, -elm.attachmentCanvas.height/2);
        attctx.lineTo(i + (localData.AO.x % (usedSnapValue * localData.AO.s)) * R, elm.attachmentCanvas.height/2);
        attctx.moveTo(-i + (localData.AO.x % (usedSnapValue * localData.AO.s)) * R, -elm.attachmentCanvas.height/2);
        attctx.lineTo(-i + (localData.AO.x % (usedSnapValue * localData.AO.s)) * R, elm.attachmentCanvas.height/2);
      }
      for (let i = 0; i < elm.attachmentCanvas.height; i += R * usedSnapValue * localData.AO.s) {
        attctx.moveTo(-elm.attachmentCanvas.width/2, i + (localData.AO.y % (usedSnapValue * localData.AO.s)) * R);
        attctx.lineTo(elm.attachmentCanvas.width/2, i + (localData.AO.y % (usedSnapValue * localData.AO.s)) * R);
        attctx.moveTo(-elm.attachmentCanvas.width/2, -i + (localData.AO.y % (usedSnapValue * localData.AO.s)) * R);
        attctx.lineTo(elm.attachmentCanvas.width/2, -i + (localData.AO.y % (usedSnapValue * localData.AO.s)) * R);
      }
      attctx.stroke();
    }
    
    attctx.beginPath();
    attctx.lineWidth = R * 0.002;
    attctx.strokeStyle = pageColors[saveData.theme]["--cyan"];
    attctx.moveTo(-elm.attachmentCanvas.width/2, localData.AO.y * R);
    attctx.lineTo(elm.attachmentCanvas.width/2, localData.AO.y * R);
    attctx.moveTo(localData.AO.x * R, -elm.attachmentCanvas.height/2);
    attctx.lineTo(localData.AO.x * R, elm.attachmentCanvas.height/2);
    attctx.stroke();
    
    settingValue.sort(function(a, b) {
      if(a[0] > b[0]) return 1;
      if(a[0] < b[0]) return -1;
      return 0;
    });
    
    function makeAttachments() {
      for (let i = 0; i < settingValue.length; i++) {
        attctx.beginPath();
        let usedVertices = structuredClone(settingValue[i]).splice(3);
        
        if (usedVertices.length === 3) {
          usedVertices[0] = (usedVertices[0] * localData.AO.s) + localData.AO.x;
          usedVertices[1] = (usedVertices[1] * localData.AO.s) + localData.AO.y;
          usedVertices[2] = (usedVertices[2] * localData.AO.s);
        }
        else if (usedVertices[0] !== -99999 && usedVertices[0] !== -99998) for (let v = 0; v < usedVertices.length; v += 2) {
          usedVertices[v] = (usedVertices[v] * localData.AO.s) + localData.AO.x;
          usedVertices[v + 1] = (usedVertices[v + 1] * localData.AO.s) + localData.AO.y;
        }

        if (settingValue[i] === localData.attachmentSelectedShape) {
          attctx.strokeStyle = pageColors[saveData.theme]["--orange"];
          if (localData.attachmentViewMode === 0) {
            if (localData.attachmentSelectedVertice !== null) attctx.globalAlpha = 0.5;
            else attctx.globalAlpha = 1;
          }
        }
        else {
          attctx.strokeStyle = pageColors[saveData.theme]["--white"];
          if (localData.attachmentViewMode === 0) attctx.globalAlpha = 0.7;
        }
        
        if (settingValue[i][2] === 1) attctx.lineJoin = "round";
        
        if (settingValue[i][1] === -1) attctx.fillStyle = pageColors[saveData.theme]["--red"];
        else if (settingValue[i][1] === -2) attctx.fillStyle = pageColors[saveData.theme]["--white"];
        else attctx.fillStyle = Object.values(pageColors[saveData.theme])[settingValue[i][1]];
        
        let usedBorderSize = 0.02;
        attctx.lineWidth = R * usedBorderSize * localData.AO.s;
        
        attctx.save();
        let path = (usedVertices[0] === -99999) ? new Path2D(usedVertices.slice(4).map(code => String.fromCharCode(code)).join("")) : null;
        let usedImg = undefined;
        if (usedVertices[0] === -99998) {
          let svgData = usedVertices.slice(4).map(code => String.fromCharCode(code)).join("");
          let mapValue = localData.preloadedSVGs.get(svgData);
          if (mapValue) usedImg = mapValue;
          else {
            const svg = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svg);
            const img = new Image();

            img.onload = () => {
              img.ready = true;
              URL.revokeObjectURL(url);
            };
            
            img.src = url;
            
            localData.preloadedSVGs.set(svgData, img);
          }
        }
        if (usedVertices[0] !== -99999 && usedVertices[0] !== -99998) {
          let adjVerts = structuredClone(usedVertices);
          if (settingValue[i][2] !== 2) {
            if (usedVertices.length !== 3) {
              let center = {x: 0, y: 0};
              for (let i = 0; i < adjVerts.length; i += 2) {
                center.x += adjVerts[i];
                center.y += adjVerts[i + 1];
              }
              center.x /= adjVerts.length/2;
              center.y /= adjVerts.length/2;
              for (let i = 0; i < adjVerts.length; i += 2) {
                let totalDistance = dist({x: adjVerts[i], y: adjVerts[i + 1]}, center);
                let newDistance = Math.max(0, totalDistance - (R * usedBorderSize * localData.AO.s)/2);
                if (newDistance === 0) continue;
                let theta = Math.atan2(adjVerts[i + 1] - center.y, adjVerts[i] - center.x);
                adjVerts[i] = Math.cos(theta) * newDistance + center.x;
                adjVerts[i + 1] = Math.sin(theta) * newDistance + center.y;
              }
            }
            else {
              adjVerts[2] = clamp(adjVerts[2] - (usedBorderSize * localData.AO.s) / 2, 0, Infinity);
            }
          }
          if (usedVertices.length === 3) {
            drawShape(attctx, [adjVerts[2]], {x: adjVerts[0], y: adjVerts[1]}, R);
          }
          else drawShape(attctx, adjVerts, {x: 0, y: 0}, R);
        }
        if (usedVertices[0] === -99999 || usedVertices[0] === -99998) {
          attctx.translate((localData.AO.x + localData.AO.s * usedVertices[2]) * R, (localData.AO.y + localData.AO.s * usedVertices[3]) * R);
          attctx.scale(usedVertices[1] * R * 0.1 * localData.AO.s, usedVertices[1] * R * 0.1 * localData.AO.s);
          attctx.lineWidth = (R * usedBorderSize * localData.AO.s) / (usedVertices[1] * R * 0.1 * localData.AO.s);
        }
        if (usedVertices[0] === -99998 && usedImg && usedImg.ready) attctx.drawImage(usedImg, -1, -1, 2, 2);
        else {
          if (settingValue[i][2] !== 3) {
            if (path !== null) attctx.fill(path);
            else attctx.fill();
          }
          if (settingValue[i][2] !== 2) {
            if (path !== null) attctx.stroke(path);
            else attctx.stroke();
          }
        }
        attctx.restore();
        attctx.globalAlpha = 1;
        attctx.lineJoin = "miter";

        if (settingValue[i] === localData.attachmentSelectedShape) {
          attctx.fillStyle = pageColors[saveData.theme]["--blue"];
          // draw circles with one vertice to control the radius
          if (usedVertices[0] === -99999 || usedVertices[0] === -99998) {
            attctx.beginPath();
            attctx.arc((usedVertices[2] * localData.AO.s + localData.AO.x) * R, (usedVertices[3] * localData.AO.s + localData.AO.y) * R, R * 0.005, 0, Math.PI * 2);
            attctx.fill();
          }
          else if (usedVertices.length === 3) {
            attctx.beginPath();
            attctx.arc((usedVertices[0] + usedVertices[2]) * R, usedVertices[1] * R, R * 0.005, 0, Math.PI * 2);
            attctx.arc(usedVertices[0] * R, usedVertices[1] * R, R * 0.005, 0, Math.PI * 2);
            attctx.fill();
          }
          // otherwise custom shapes use this
          else for (let v = 0; v < usedVertices.length; v += 2) {
            attctx.beginPath();
            attctx.fillStyle = pageColors[saveData.theme]["--blue"];
            attctx.globalAlpha = 1;
            if (localData.attachmentViewMode === 0) {
              if (localData.attachmentSelectedVertice === v + 2) attctx.globalAlpha = 1;
              else if (localData.attachmentSelectedVertice !== null) attctx.globalAlpha = 0.5;
            }
            attctx.arc(usedVertices[v] * R, usedVertices[v + 1] * R, R * 0.005, 0, Math.PI * 2);
            attctx.fill();
            
            attctx.beginPath();
            attctx.fillStyle = pageColors[saveData.theme]["--green"];
            attctx.globalAlpha = 0.3;
            attctx.arc(
              (usedVertices[v] + usedVertices[v + 2 >= usedVertices.length ? 0 : v + 2])/2 * R,
              (usedVertices[v + 1] + usedVertices[v + 3 >= usedVertices.length ? 1 : v + 3])/2 * R,
              R * 0.005, 0, Math.PI * 2
            );
            attctx.fill();
          }
        }
      }
    }
    
    // create the tank itself
    attctx.beginPath();
    if (localData.attachmentViewMode === 0) {
      attctx.globalAlpha = 0.4;
      attctx.fillStyle = pageColors[saveData.theme]["--white"];
      attctx.strokeStyle = pageColors[saveData.theme]["--white"];
      if (localData.settingPageId === 2064) drawShape(attctx, [
        -0.1 * localData.AO.s + localData.AO.x, -0.1 * localData.AO.s + localData.AO.y, 
        -0.1 * localData.AO.s + localData.AO.x, 0.1 * localData.AO.s + localData.AO.y,
        0.1 * localData.AO.s + localData.AO.x, 0.1 * localData.AO.s + localData.AO.y,
        0.1 * localData.AO.s + localData.AO.x, -0.1 * localData.AO.s + localData.AO.y
      ], {x: 0, y: 0}, R);
      else if (localData.settingPageId === 2067 || localData.settingPageId === 2065) drawShape(attctx, [
        0.1 * localData.AO.s
      ], {x: localData.AO.x, y: localData.AO.y}, R);
      attctx.fill();
    }
    makeAttachments();
    
    for (let i = 3; i < localData.customPoints.length; i += 2) {
      attctx.beginPath();
      attctx.fillStyle = pageColors[saveData.theme]["--green"];
      attctx.arc((localData.customPoints[i] * localData.AO.s + localData.AO.x) * R, (localData.customPoints[i + 1] * localData.AO.s + localData.AO.y) * R, R * 0.005, 0, Math.PI * 2);
      attctx.fill();
    }
  }
  
  if (testingvar) {
    alert(clientFramerate[1]);
    testingvar = false;
  }
  clientFramerate[0]++;
}
let clientFramerate = [0, 0];
setInterval(() => {
  clientFramerate[1] = clientFramerate[0];
  clientFramerate[0] = 0;
}, 1000);


// the front page stuff
function restoreSaveData() {
  if (!localStorage.getItem("savedata")) localStorage.setItem("savedata", btoa(JSON.stringify(saveData)));
  try {
    let backupSaveData = JSON.parse(atob(localStorage.getItem("savedata")));
    if (backupSaveData.lerpValue) saveData.lerpValue = backupSaveData.lerpValue;
    if (backupSaveData.playerName) saveData.playerName = backupSaveData.playerName;
    if (backupSaveData.lobbyCode) saveData.lobbyCode = backupSaveData.lobbyCode;
    if (backupSaveData.theme) saveData.theme = backupSaveData.theme;
    if (backupSaveData.keybinds) saveData.keybinds = backupSaveData.keybinds;
    elm.themeInput.value = saveData.theme;
    elm.lerpInput.value = saveData.lerpValue;
    elm.nicknameInput.value = saveData.playerName;
    elm.lobbyCodeInput.value = saveData.lobbyCode;
    fetchPageColors();
    setupKeybinds();
  } catch (err) {
    alert("An error occurred when loading your save data: " + err);
  }
}

function saveCurrentData(refreshInputs = false) {
  localStorage.setItem("savedata", btoa(JSON.stringify(saveData)));
  if (refreshInputs) restoreSaveData();
}

elm.settingsPage.opened = function(close) {
  elm.settingsPage.style.left = "0";
}
elm.settingsPage.closed = function(open) {
  elm.settingsPage.style.left = "-110vw";
}
elm.frontPage.opened = function(close) {
  elm.frontPage.style.left = "0";
}
elm.frontPage.closed = function(open) {
  switch (open[0]) {
    case 1: {
      elm.frontPage.style.left = "110vw";
      break;
    }
    case 2: {
      elm.frontPage.style.left = "-110vw";
      break;
    }
  }
}
elm.playPage.opened = function(close) {
  elm.playPage.style.left = "0";
}
elm.playPage.closed = function(open) {
  elm.playPage.style.left = "110vw";
}
canvas.opened = function(close) {
  canvas.style.left = "0";
  elm.backpack.style.display = "flex";
  elm.backpackHider.style.display = "flex";
  elm.leaderboard.style.display = "flex";
  elm.leaderboardHider.style.display = "flex";
}
canvas.closed = function(open) {
  canvas.style.left = "-110vw";
  elm.backpack.style.display = "none";
  elm.backpackHider.style.display = "none";
  elm.leaderboard.style.display = "none";
  elm.leaderboardHider.style.display = "none";
}

function togglePages(open, close = localData.openPages, prev = false) {
  if (!prev) localData.previousPages.push(structuredClone(localData.openPages));
  const pageids = [
    "frontpage", // 0
    "settingspage", // 1
    "playpage", // 2
    "gamecanvas", // 3
  ];
  for (let c of close) {
    if (open.indexOf(c) !== -1) continue;
    document.getElementById(pageids[c]).closed(open);
    if (localData.openPages.indexOf(c) !== -1) localData.openPages.splice(localData.openPages.indexOf(c), 1);
  }
  for (let p of open) {
    if (close.indexOf(p) !== -1) continue;
    document.getElementById(pageids[p]).opened(close);
    if (localData.openPages.indexOf(p) === -1) localData.openPages.push(p);
  }
}

function previousPage() {
  if (localData.previousPages.length <= 0) return;
  togglePages(localData.previousPages.pop(), localData.openPages, true);
}

elm.settingsBackButton.addEventListener("click", previousPage);
elm.playBackButton.addEventListener("click", previousPage);

async function updateTheme() {
  const themes = await (await fetch("./json/colors.json")).json();
  for (let k = 0; k < Object.keys(themes[saveData.theme]).length; k++) {
    elm.root.style.setProperty(Object.keys(themes[saveData.theme])[k], Object.values(themes[saveData.theme])[k]);
  }
  
  setTimeout(function() {
    for (let e of document.getElementsByTagName("*")) if (e.classList.contains("notransitions")) e.classList.remove("notransitions");
  }, 100);
}

async function updatePwettyColors(reset = false) {
  for (let e of document.getElementsByTagName("*")) {
    if (!e.classList.contains("notransitions")) {
      e.classList.add("notransitions");
    }
  }
  
  const themes = await (await fetch("./json/colors.json")).json();
  for (let k = 0; k < Object.keys(themes[saveData.theme]).length; k++) {
    elm.root.style.setProperty(Object.keys(themes[saveData.theme])[k], randomColor(0));
  }
}

function pwettyWainbowLoop() {
  updatePwettyColors();
  setTimeout(function () {
    if (localData.pwettyWainbowMode) pwettyWainbowLoop();
  }, 100);
}

elm.frontTitle.addEventListener("click", function () {
  clearTimeout(localData.frontTitleTimeout);
  localData.frontTitleCombo++;
  localData.frontTitleTimeout = setTimeout(function() {
    elm.frontTitle.style.color = "var(--white)";
    updateTheme();
    localData.frontTitleCombo = 0;
  }, 1000);
  
  if (localData.frontTitleCombo >= 20) {
    localData.pwettyWainbowMode = true;
    pwettyWainbowLoop();
  }
  else if (localData.frontTitleCombo >= 10) updatePwettyColors();
  
  if (localData.frontTitleCombo < 10) elm.frontTitle.style.color = randomColor(0);
  else elm.frontTitle.style.color = "var(--white)";
});

elm.settingsButton.addEventListener("click", function() {
  togglePages([1]);
});

elm.playButton.addEventListener("click", function() {
  togglePages([2]);
});


/**
changes the currently open setting tab to be 50% of the setting bar
*/
function resizeSettingTabs() {
  elm.settingMusicTab.style.width = "26vmin";
  elm.settingGraphicTab.style.width = "26vmin";
  elm.settingMiscTab.style.width = "25vmin";
  
  elm.settingMusicContent.style.display = "none";
  elm.settingGraphicContent.style.display = "none";
  elm.settingMiscContent.style.display = "none";
  
  switch (localData.openSettingTab) {
    case 0: {
      elm.settingMusicTab.style.width = "51vmin";
      elm.settingGraphicTab.style.left = "calc(50vmax - 0vmin)";
      elm.settingMiscTab.style.left = "calc(50vmax + 25vmin)";
      elm.settingMusicContent.style.display = "block";
      break;
    }
    case 1: {
      elm.settingGraphicTab.style.width = "51vmin";
      elm.settingGraphicTab.style.left = "calc(50vmax - 25vmin)";
      elm.settingMiscTab.style.left = "calc(50vmax + 25vmin)";
      elm.settingGraphicContent.style.display = "block";
      break;
    }
    case 2: {
      elm.settingMiscTab.style.width = "50vmin";
      elm.settingGraphicTab.style.left = "calc(50vmax - 25vmin)";
      elm.settingMiscTab.style.left = "calc(50vmax)";
      elm.settingMiscContent.style.display = "block";
      break;
    }
  }
}
/** 
when a settingtab is clicked, resize all the tabs and open the content
*/
elm.settingMusicTab.addEventListener("click", function() {
  localData.openSettingTab = 0;
  resizeSettingTabs();
});
elm.settingGraphicTab.addEventListener("click", function() {
  localData.openSettingTab = 1;
  resizeSettingTabs();
});
elm.settingMiscTab.addEventListener("click", function() {
  localData.openSettingTab = 2;
  resizeSettingTabs();
});

/**
when the user changes the value of inputs in the settings menu, adjust and save the saveData accordingly
*/
elm.lerpInput.addEventListener("change", function(e) {
  if (isNaN(parseInt(e.target.value))) {
    e.target.style.color = "var(--red)";
    return;
  }
  e.target.style.color = "var(--white)";
  saveData.lerpValue = Math.min(Math.max(1, parseInt(e.target.value)), 100);
  saveCurrentData(true);
});
elm.themeInput.addEventListener("change", function(e) {
  saveData.theme = e.target.value;
  setPageColors();
  saveCurrentData(true);
});
elm.nicknameInput.addEventListener("change", function(e) {
  saveData.playerName = e.target.value.substring(0, 32);
  e.target.value = saveData.playerName;
  saveCurrentData(true);
});
elm.lobbyCodeInput.addEventListener("change", function(e) {
  saveData.lobbyCode = e.target.value.substring(0, 32);
  e.target.value = saveData.lobbyCode;
  saveCurrentData(true);
});
elm.joinButton.addEventListener("click", function(e) {
  socket.connect();
  togglePages([3]);
});

const keybindButtons = [
  ["forwardkey", "Forward Key"],
  ["backwardkey", "Backward Key"],
  ["rightkey", "Right Key"],
  ["leftkey", "Left Key"],
  ["firekey", "Fire Key"],
  ["enterkey", "Start Game Key"],
  ["actionkey", "Action Key"],
  ["unequipkey", "Unequip Key"],
  ["leavekey", "Leave / Back Key"],
];
let keybindsSetup = false;
function setupKeybinds() {
  if (keybindsSetup) return;
  keybindsSetup = true;
  for (let key of keybindButtons) {
    document.getElementById(key[0]).addEventListener("click", function() {
      document.activeElement.blur();
      createPopup(
          5,
          key[1], 
          "Press a key to add or remove it.",
          ["Done"],
          [function(keycode) {
            let keyloc = saveData.keybinds[key[0]];
            if (keyloc.indexOf(keycode) !== -1) keyloc.splice(keyloc.indexOf(keycode), 1);
            else keyloc.push(keycode);
            let keytext = "";
            for (let i = 0; i < keyloc.length; i++) {
              if (i !== 0) keytext += ", ";
              keytext += keynames[keyloc[i]];
            }
            document.getElementById(key[0]).innerHTML = keytext;
            saveCurrentData(true);
          }, function() {}],
      );
    });

    let keytext = "";
    for (let i = 0; i < saveData.keybinds[key[0]].length; i++) {
      if (i !== 0) keytext += ", ";
      keytext += keynames[saveData.keybinds[key[0]][i]];
    }
    document.getElementById(key[0]).innerHTML = keytext;
  }
}

/**
updates the tonk image visible on the front page, and updates the caption
@param specialImg - sets image to a specific image src, otherwise it assigns a random one
*/
async function updateTonkImg(specialImg = "") {
  const imgid = await (await fetch("./json/tonkimages.json")).json();
  
  switch (specialImg) {
    default: {
      let date = new Date();
      let imageChoice = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24) % imgid.length;
      
      elm.tonkImg.src = imgid[imageChoice][1];
      elm.tonkImgCaption.innerText = imgid[imageChoice][0];
      break;
    }
  }
}

/**
run when the html loads
*/
function onLoad() {
  restoreSaveData();
  updateTonkImg();
  resizeSettingTabs();
}
onLoad();