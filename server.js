const express = require('express');
const minify = require("express-minify");
const cors = require("cors");
const compression = require("compression");
const WebSocket = require("express-ws");
const app = express();
const http = require('http');
const port = 3000;

const anArrayOfEnglishWords = require("an-array-of-english-words");
const protocol = require("./utils/protocol.json");
const util = require("./utils/util.js");

const framerate = 30; 

let Matter = require("matter-js");
const {Engine, Render, Runner, Composite, Composites, Collision, Common, MouseConstraint, Mouse, Bodies, Body, Bounds, Detector, Resolver, Query} = require("matter-js");
const fixes = require("./matterfixes.js");
Resolver.solvePosition = fixes.solvePosition;
Resolver._restingThresh = 0;

const Math2 = require("./utils/Math2.js");
const createSettings = require("./utils/createSettings.js");

const clone = require("clone");

let testingvar = false;

class Lobby {
  static lobbies = [];
  
  static idAllowed(id) {
    if (id.length < 2) return;
    for (let l of Lobby.lobbies) if (l.id === id) return false;
    return true;
  }
  
  static checkForLobbyWithId(id) {
    for (let l of Lobby.lobbies) if (l.id === id) return l;
    return -1;
  }
  
  /**
    Checks all lobbies for a player id, and returns a player object if found, or null if not
    @param {Socket ID} searchID - The socket id of the player we are checking the request from
  */
  static checkForPlayer(searchSocket) {
    for (let l of Lobby.lobbies) for (let p of l.players) if (p.socket === searchSocket) return p;
    return null;
  }
  
  // sets all tank teams to null for team assignment
  resetTeams() {
    for (let p of this.players) p.team = null;
    this.players = util.shuffle(this.players);
    this.totalTeams = util.ISS(this.host.clientSettings.gamemode.teams.spreadMethodNumberOfTeams);
    this.maxPerTeam = util.ISS(this.host.clientSettings.gamemode.teams.fillMethodMaxTanksPerTeam);
  }
  
  // checks the current teams of tanks to assign the best fitting team
  findBestTeam(rules) {
    let teams = [];
    for (let p of this.players) {
      if (p.team === null) continue;
      let teamFound = false;
      for (let team of teams) if (team[0] === p.team) {
        team[1]++;
        teamFound = true;
      }
      if (!teamFound) teams.push([p.team, 1]);
    }
    switch (rules.gamemode.teams.teamAssignmentMethod) {
      // overflow method, fill teams until max players are hit
      case 0: {
        for (let team = 1; team < 999; team++) {
          let continuing = false;
          for (let t of teams) if (t[0] === team) {
            if (t[1] < this.maxPerTeam) return team;
            else continuing = true;
          }
          if (continuing) continue;
          return team;
        }
        break;
      }
      // group method, where however many teams exist, we fill to those
      case 1: {
        switch (rules.gamemode.teams.spreadType) {
          // random distribution
          case 0: {
            return Math.floor(Math.random() * this.totalTeams) + 1;
            break;
          }
          // even distribution
          case 1: {
            let lowestTeam = [0, Infinity];
            for (let team = 1; team <= this.totalTeams; team++) {
              let continuing = false;
              for (let t of teams) if (t[0] === team) {
                if (t[1] < lowestTeam[1]) lowestTeam = t;
                continuing = true;
              }
              if (continuing) continue;
              return team;
            }
            return lowestTeam[0];
            break;
          }
        }
        break;
      }
    }
    console.log("team generation broke");
    return null;
  }
  
  findNewHost() {
    for (let o of this.objects) {
      if (o.type !== "tank" || o === this.host) continue;
      this.host = o;
      this.refreshLobby(true);
      
      for (let p of this.players) {
        let sendingSettingsTypes = createSettings.createSettingsArrayBuffer(this.host.clientSettings);
        let sendData = [protocol.sendHostSettings, ...sendingSettingsTypes[0]];
        let sendTypes = ["int8", ...sendingSettingsTypes[1]];
        p.socket.talk(util.encodePacket(sendData, sendTypes));
      }
      console.log("new host found!");
      return;
    }
    Lobby.lobbies.splice(Lobby.lobbies.indexOf(this), 1);
    console.log("no players found, closing lobby");
  }
  
  generateId(length = 1) {
    let generatedId = "";
    for (let i = 0; i < length; i++) {
      generatedId += anArrayOfEnglishWords[Math.floor(anArrayOfEnglishWords.length * Math.random())];
    }
    
    if (!Lobby.idAllowed(generatedId)) return Lobby.generateId(length);
    else return generatedId;
  }
  
  createPowerupFromId(id) {
    let power = null;
    for (let i = 0; i < this.host.clientSettings.powerups.length; i++) {
      if (this.host.clientSettings.powerups[i].id === id) {
        power = i;
        break;
      }
    }
    if (power === null) return null;
    return new Powerup(power, this);
  }
  
  getWallById(id) {
    for (let i of this.host.clientSettings.wallTypes) {
      if (i.id === id) return i;
    }
    return this.host.clientSettings.wallTypes[0];
  }
  
  createRepresentation() {
    this.nodeRepresentation = [];
    for (let i = 0; i < this.mazePlan.length; i++) {
      for (let j = 0; j < this.mazePlan[i].length; j++) {
        if (this.mazePlan[i][j].closed) continue;
        let node = {
          x: j,
          y: i,
          branches: [],
          targetDistance: 0
        };
        if (!this.mazePlan[i][j].left[0]) node.branches.push({x: j - 1, y: i});
        if (!this.mazePlan[i][j].right[0]) node.branches.push({x: j + 1, y: i});
        if (!this.mazePlan[i][j].top[0]) node.branches.push({x: j, y: i - 1});
        if (!this.mazePlan[i][j].bottom[0]) node.branches.push({x: j, y: i + 1});
        this.nodeRepresentation.push(node);
      }
    }
  }
  
  pathfindToTarget(start, target) {
    // first find the respective squares of both the start and the target
    const ASharpMapSize = {x: this.mazeDimensions.x, y: this.mazeDimensions.y};
    const startGridPosition = {
      x: Math.floor(start.shape.position.x / (this.size.width / ASharpMapSize.x) + ASharpMapSize.x/2),
      y: Math.floor(start.shape.position.y / (this.size.height / ASharpMapSize.y) + ASharpMapSize.y/2)
    };
    const targetGridPosition = {
      x: Math.floor(target.shape.position.x / (this.size.width / ASharpMapSize.x) + ASharpMapSize.x/2),
      y: Math.floor(target.shape.position.y / (this.size.height / ASharpMapSize.y) + ASharpMapSize.y/2)
    };
    
    // we pretend each grid cell is the center of a maze tile
    // we start at the node of our start object, then attempt to move towards the target along nodes using A*
    let startingNode = null;
    for (let r of this.nodeRepresentation) {
      if (r.x === startGridPosition.x && r.y === startGridPosition.y) startingNode = r;
      r.targetDistance = Math2.dist(targetGridPosition, r);
    }
    // if we don't have our starting node, get confused and just give up
    if (startingNode === null) {
      console.log("targeting object not on grid")
      return null;
    }
    /* 
      otherwise, we iterate through our series of nodes.
      if the node we are currently on is the target node, we win and can trace back our shortest path
      otherwise, we update all nodes around it if it is the shortest path to them, then choose the next best node
      if we would check 9999 or more cells, we give up pre-emptively because like serious why would you need that
    */
    let checkedBranches = [{x: startingNode.x, y: startingNode.y, checked: true, value: 0, fastest: null, node: startingNode}];
    let checkingBranch = checkedBranches[0];
    for (let a = 0; a < 9999; a++) {
      if (checkingBranch.x === targetGridPosition.x && checkingBranch.y === targetGridPosition.y) {
        // we found our correct path, so now we backtrack until we get the first square on our journey, and tell the bullet to go there
        let firstTile = checkingBranch;
        for (let i = 0; i < 9999; i++) {
          // if we are in the same tile, tell it to just absolute follow towards the target
          if (firstTile.fastest === null) return null;
          // otherwise go until we are the next tile from the starting tile then break for our next step
          if (firstTile.fastest.fastest === null) break;
          firstTile = firstTile.fastest;
        }
        // now that we have the next tile, return the center of the tile so the update loop and move the bullet towards it
        return {
          x: (firstTile.x + 0.5) * (this.size.width / ASharpMapSize.x) - this.size.width/2,
          y: (firstTile.y + 0.5) * (this.size.height / ASharpMapSize.y) - this.size.height/2,
        };
        break;
      }
      
      checkingBranch.checked = true;
      
      // if this wasn't our target, update nodes around us with new distances
      for (let c = 0; c < checkingBranch.node.branches.length; c++) {
        let checkX = checkingBranch.node.branches[c].x;
        let checkY = checkingBranch.node.branches[c].y;
        if (checkX < 0 || checkX >= ASharpMapSize.x) continue;
        if (checkY < 0 || checkY >= ASharpMapSize.y) continue;

        // go through every branch of our original tile and see if we have already checked that tile before
        let newBranch = null;
        for (let branch of checkedBranches) {
          if (branch.x === checkX && branch.y === checkY) {
            newBranch = branch;
            break;
          }
        }
        if (newBranch === null) {
          // if our node doesn't exist, add a new one to our discovered list for future checking
          let attachedNode = null;
          for (let r of this.nodeRepresentation) if (checkingBranch.node.branches[c].x === r.x && checkingBranch.node.branches[c].y === r.y) attachedNode = r;
          checkedBranches.push({
            x: checkX, 
            y: checkY, 
            checked: false, 
            value: checkingBranch.value + attachedNode.targetDistance + 1, 
            fastest: checkingBranch, 
            node: attachedNode
          });
        }
        else {
          // if we found a new faster route, update it, otherwise ignore existing nodes
          if (newBranch.value > checkingBranch.value + newBranch.node.targetDistance + 1) {
            newBranch.value = checkingBranch.value + newBranch.node.targetDistance + 1;
            newBranch.fastest = checkingBranch;
          }
        }
      }
      
      // every node the checked cell neighbors is added or updated on our checking branch
      // we can now check the one with the lowest value and repeat the whole process until we find the target or are out of squares
      let lowestValueBranch = null;
      for (let i = 0; i < checkedBranches.length; i++) {
        if (checkedBranches[i].checked) continue;
        if (lowestValueBranch === null || lowestValueBranch.value > checkedBranches[i].value) {
          lowestValueBranch = checkedBranches[i];
        }
      }
      // if no branches exist and we still don't have a path, we conclude no path exists
      if (lowestValueBranch === null) {
        console.log("no targeting path found");
        return null;
      }
      checkingBranch = lowestValueBranch;
    }
  }
  
  endGame(rules) {
    if (this.inLobby) return;
    
    for (let player of this.players) {
      player.games++;
      for (let p = player.powerups.length - 1; p >= 0; p--) {
        if (!player.powerups[p].powerupData.misc.retainAfterRound && !player.powerups[p].powerupData.spawning.treatAsDefault) player.powerups.splice(p, 1);
      }
    }
    
    switch (rules.gamemode.mode) {
      // Standard
      case 0: {
        // the survive timer is up, so award a win to the last team alive, if they exist
        let winningTeam = null;
        for (let p of this.players) {
          if (p.ghost && p.remainingLives <= 0 && p.respawnTimer <= 0) continue;
          winningTeam = p.team;
          break;
        }
        if (winningTeam !== null) for (let p of this.players) if (p.team === winningTeam) p.wins++;
        break;
      }
      // Arena
      case 1: {
        // whoever has the most points wins
        let winningPlayers = [this.players[0]];
        for (let i = 1; i < this.players.length; i++) {
          if (this.players[i].points > winningPlayers[0].points) winningPlayers = [this.players[i]];
          if (this.players[i].points === winningPlayers[0].points && winningPlayers[0] !== this.players[i]) winningPlayers.push(this.players[i]);
        }
        switch (rules.gamemode.arena.drawHandling) {
          // random
          case 2: {
            winningPlayers[Math.floor(Math.random() * winningPlayers.length)].wins++;
            break;
          }
          // none
          case 4: break;
          // everyone
          default: {
            for (let w of winningPlayers) w.wins++;
            break;
          }
        }
        break;
      }
      // Tag
      case 2: {
        for (let p of this.players) p.wins++;
        break;
      }
      // Monarch
      case 3: {
        let winningTeam = null;
        for (let p of this.players) {
          if ((p.ghost && p.remainingLives <= 0 && p.respawnTimer <= 0) || !p.teamMonarch) continue;
          winningTeam = p.team;
          break;
        }
        if (winningTeam !== null) for (let p of this.players) if (p.team === winningTeam) p.wins++;
        break;
      }
      // King of the Hill
      case 4: {
        let crownTeam = null;
        for (let p of this.players) if (p.hasCrown) {
          crownTeam = p.team;
          break;
        }
        for (let p of this.players) if (p.team === crownTeam) p.wins++;
        break;
      }
    }
    
    // and now refresh the lobby since we are done awarding points, and if we are done go back to the lobby
    this.remainingGames--;
    this.pauseTimer = util.ISS(rules.gamemode.roundEndTimer) * framerate;
    this.refreshAfterTimer = true;
  }
  
  constructor(gameConfig, id, lobbyName) {
    this.host = null;
    this.name = lobbyName;
    this.id = Lobby.idAllowed(id) ? id : this.generateId();
    this.gameConfig = util.gameConfigData;
    this.players = [];
    this.objects = [];
    this.size = {width: 0, height: 0};
    this.mazeDimensions = {x: 1, y: 1};
    this.inLobby = true;
    this.totalTeams = 1;
    this.maxPerTeam = 1;
    
    this.powerupsLeftToSpawn = 0;
    this.spawnsOfType = [];
    this.powerupSpawnTimer = 0;
    this.mazePlan = null;
    this.nodeRespresentation = [];
    this.wallThickness = 0.1;
    
    this.pauseTimer = 0;
    this.refreshAfterTimer = false;
    this.remainingGames = 0;
    this.endGameTimer = 0;
    this.gameTimer = -1;
    
    this.engine = Engine.create();
    this.world = this.engine.world;
    this.engine.gravity.scale = 0;
    
    /**
    When two objects collide, checks what happens from there.
    */
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      for (let p of pairs) {
        let priorityOrder = ["tank", "bullet", "wall", "box", "shield"];
        let e = null;
        let other = null;
        for (let priority of priorityOrder) {
          if (p.bodyA.collisionFilter.me.type === priority) {
            e = p.bodyA.collisionFilter.me;
            other = p.bodyB.collisionFilter.me;
            break;
          }
          else if (p.bodyB.collisionFilter.me.type === priority) {
            other = p.bodyA.collisionFilter.me;
            e = p.bodyB.collisionFilter.me;
            break;
          }
        }
        if (e === null) return;
        
        const rules = e.lobby.host.clientSettings;
        
        switch (e.type) {
          case "tank": {
            switch (other.type) {
              case "tank": {
                if (rules.general.tankCollisionType === 0 && !(e.ghost || other.ghost)) {
                  // tanks that ignore each other handled elsewhere, but if damage collisions is on the damage is handled here
                  // use the highest resistance from shields that we have
                  let eResist = 0, eHealth = 0;
                  let otherResist = 0, otherHealth = 0;
                  for (let i = 0; i < e.shields.length; i++) {
                    if (eResist < e.shields[i].resistance) eResist = e.shields[i].resistance;
                    eHealth += e.shields[i].healthRemaining;
                  }
                  for (let i = 0; i < other.shields.length; i++) {
                    if (otherResist < other.shields[i].resistance) otherResist = other.shields[i].resistance;
                    otherHealth += other.shields[i].healthRemaining;
                  }
                  
                  // get the difference, counting in shield help
                  let ePool = (e.health + eHealth + e.damageResistance + eResist);
                  let otherPool = (other.health + otherHealth + other.damageResistance + otherResist);
                  let healthDifference = Math.min(ePool, otherPool);
                  
                  // when dealing damage to shields, start from the least recent and go to the most recent when breaking them
                  if (ePool === otherPool) {
                    other.health = 0;
                    e.health = 0;
                  }
                  if (ePool > otherPool) {
                    let eDamage = healthDifference - e.damageResistance - eResist;
                    for (let i = 0; i < e.shields.length; i++) {
                      e.shields[i].hitsRemaining--;
                      if (e.shields[i].healthRemaining <= eDamage || e.shields[i].hitsRemaining <= 0) {
                        if (e.shields[i].damageOverflowsToPlayer) eDamage -= e.shields[i].healthRemaining;
                        else eDamage = 0;
                        e.shields[i].shieldObject.annihilate();
                        e.shields.splice(i, 1);
                        i--;
                        continue;
                      }
                      e.shields[i].healthRemaining -= Math.max(0, eDamage);
                      eDamage = 0;
                    }
                    other.health = 0;
                    e.health -= Math.max(0, eDamage);
                  }
                  
                  if (otherPool > ePool) {
                    let otherDamage = healthDifference - other.damageResistance - otherResist;
                    for (let i = 0; i < other.shields.length; i++) {
                      other.shields[i].hitsRemaining--;
                      if (other.shields[i].healthRemaining <= otherDamage || other.shields[i].hitsRemaining <= 0) {
                        if (other.shields[i].damageOverflowsToPlayer) otherDamage -= other.shields[i].healthRemaining;
                        else otherDamage = 0;
                        other.shields[i].shieldObject.annihilate();
                        other.shields.splice(i, 1);
                        i--;
                        continue;
                      }
                      other.shields[i].healthRemaining -= Math.max(0, otherDamage);
                      otherDamage = 0;
                    }
                    e.health = 0;
                    other.health -= Math.max(0, otherDamage);
                  }
                  
                  e.damagedThisFrame = true;
                  other.damagedThisFrame = true;
                  
                  if (e.health <= 0) {
                    e.killer = other;
                    e.killerTeam = [other.team, other.color];
                  }
                  if (other.health <= 0) {
                    other.killer = e;
                    other.killerTeam = [e.team, e.color];
                  }
                  
                  pairs[pairs.indexOf(p)].isSensor = true;
                }
                break;
              }
              case "bullet": {
                // Tank on bullet collision
                const inter = other.powerupRef.powerupData.interactions;
                
                // if we physically collide, we don't worry about damage or anything like that, but we do collide
                if (inter.physicallyCollideWithTanks) {
                  other.runCollision(e);
                  break;
                }
                else pairs[pairs.indexOf(p)].isSensor = true;
                
                // if this is a landmine, we don't do anything except arm ourselves
                if (other.treatAsLandmine) {
                  other.armed = true;
                  break;
                }
                
                // if we have only one collision per tank, make note of it
                let foundMax = false;
                if (inter.maxCollisionPerTank[1] !== 0) {
                  for (let i = 0; i < other.tanksCollidedWith.length; i++) {
                    if (other.tanksCollidedWith[i][0] === e) {
                      other.tanksCollidedWith[i][1]--;
                      foundMax = true;
                      break;
                    }
                  }
                  if (!foundMax) other.tanksCollidedWith.push([e, util.ISS(inter.maxCollisionPerTank) - 1]);
                }
                
                if (!inter.dealNoDamage) {
                  let eResist = 0, eHealth = 0;
                  for (let i = 0; i < e.shields.length; i++) {
                    if (eResist < e.shields[i].resistance) eResist = e.shields[i].resistance;
                    eHealth += e.shields[i].healthRemaining;
                  }
                  let ePool = (e.health + eHealth + e.damageResistance + eResist);
                  let otherPool = other.health + other.damageResistance;
                  let healthDifference = Math.min(ePool, otherPool);
                  
                  if (inter.maxCollisionPerTank[1] !== 0) healthDifference = util.ISS(inter.oneCollisionDamage);

                  let eDamage = healthDifference - e.damageResistance - eResist;
                  for (let i = 0; i < e.shields.length; i++) {
                    e.shields[i].hitsRemaining--;
                    if (e.shields[i].healthRemaining <= eDamage || e.shields[i].hitsRemaining <= 0) {
                      if (e.shields[i].damageOverflowsToPlayer) eDamage -= e.shields[i].healthRemaining;
                      else eDamage = 0;
                      e.shields[i].shieldObject.annihilate();
                      e.shields.splice(i, 1);
                      i--;
                      continue;
                    }
                    e.shields[i].healthRemaining -= Math.max(0, eDamage);
                    eDamage = 0;
                  }
                  e.health -= Math.max(0, eDamage);
                  other.health -= Math.max(0, healthDifference - other.damageResistance);

                  e.damagedThisFrame = true;
                  other.damagedThisFrame = true;
                }
                
                other.runCollision(e);
                
                if (e.health <= 0) {
                  e.killer = other.parent;
                  e.killerTeam = [other.team, other.color];
                }
                break;
              }
              case "bubble": {
                // Tank on powerup bubble collision
                pairs[pairs.indexOf(p)].isSensor = true;
                other.containedPower.inheritToParent(
                  e, 
                  util.settingConstrain(rules.personal.powerupEquipType, e.clientSettings.personal.powerupEquipType), 
                  other.containedPower
                );
                other.annihilate();
                break;
              }
              case "box":
              case "wall": {
                // Tank on wall collision
                if (other.tankDamage > 0) {
                  e.health -= other.tankDamage;
                  e.damagedThisFrame = true;
                }
                if (e.health <= 0) {
                  e.killer = e;
                  e.killerTeam = [e.team, e.color];
                }
                
                if (!other.hasHitbox) {
                  pairs[pairs.indexOf(p)].isSensor = true;
                  if (other.removeOnCollide) other.annihilate();
                }
                if (other.opacityOnCollide !== other.initialOpacity) {
                  other.opacity = other.opacityOnCollide;
                  other.fadingTimer = other.opacityFadeTime === 0 ? Infinity : other.opacityFadeTime;
                }
                break;
              }
            }
            break;
          }
          case "bullet": {
            const bulletData = e.powerupRef.powerupData;
            switch (other.type) {
              case "bullet": {
                const otherBulletData = other.powerupRef.powerupData;
                // when two bullets collide, find the highest collision type priority based on if they are the same team or not, and then proceed
                let highestPriority = 0;
                if (bulletData.interactions.bulletInteractionPriority > otherBulletData.interactions.bulletInteractionPriority)
                  highestPriority = e.team === other.team ? bulletData.interactions.sameTeamBulletInteractions : bulletData.interactions.bulletInteractions;
                else 
                  highestPriority = e.team === other.team ? otherBulletData.interactions.sameTeamBulletInteractions : otherBulletData.interactions.bulletInteractions;
                
                switch (highestPriority) {
                  // if they ignore each other, this already doesn't run
                  case 1: {
                    // damage
                    pairs[pairs.indexOf(p)].isSensor = true;
                    
                    if (!bulletData.interactions.dealNoDamage && !otherBulletData.interactions.dealNoDamage) {
                      let healthDifference = Math.min((e.health + e.damageResistance), (other.health + other.damageResistance));
                      e.health -= Math.max(0, healthDifference - e.damageResistance);
                      other.health -= Math.max(0, healthDifference - other.damageResistance);
                      e.damagedThisFrame = true;
                      other.damagedThisFrame = true;
                    }
                    
                    other.runCollision(e);
                    e.runCollision(other);
                    break;
                  }
                  // if they bounce in case 2, just do nothing
                }
                
                // increment our max bullet hits
                if (e.hitsRemaining.bullets >= 0) {
                  e.hitsRemaining.bullets--;
                  if (e.hitsRemaining.bullets < 0) e.annihilate(0);
                }
                break;
              }
              case "shield": {
                let shieldRef = null;
                for (let i = 0; i < other.tank.shields.length; i++) if (other.tank.shields[i].shieldObject === other) shieldRef = other.tank.shields[i];
                if (shieldRef === null) break;
                shieldRef.healthRemaining -= e.health - shieldRef.resistance;
                shieldRef.hitsRemaining--;
                if (shieldRef.healthRemaining <= 0 || shieldRef.hitsRemaining <= 0) {
                  other.annihilate();
                  other.tank.shields.splice(other.tank.shields.indexOf(shieldRef), 1);
                }
                break;
              }
              case "box":
              case "wall": {
                // if bounce particle release is on, release a particle
                if (e.particleRelease.enabled && !e.particleRelease.delayed && e.particleRelease.bounceRelease) {
                  let spawning = e.lobby.createPowerupFromId(bulletData.particles.passiveReleaseBulletId);
                  if (spawning !== null) {
                    e.fire({
                      fromBullet: true,
                    }, spawning);
                    if (e.particleRelease.maxReleasedBullets > 0) {
                      e.particleRelease.maxReleasedBullets--;
                      if (e.particleRelease.maxReleasedBullets <= 0) e.particleRelease.enabled = false;
                    }
                  }
                }
                
                // bounce rotation
                if (e.rotationAdjustments.enabled && e.rotationAdjustments.delay <= 0) {
                  const totalChange = e.rotationAdjustments.bounce;
                  if (e.rotationAdjustments.applyToAngular) {
                    e.rotationSpeed += totalChange/framerate;
                  } else {
                    Body.setVelocity(e.shape, {
                      x: Math.cos(e.shape.angle + totalChange) * e.shape.speed,
                      y: Math.sin(e.shape.angle + totalChange) * e.shape.speed,
                    });
                    Body.setAngle(e.shape, e.shape.angle + totalChange);
                  }
                }
                // bounce acceleration
                if (e.accelerationAdjustments.enabled && e.accelerationAdjustments.delay <= 0) {
                  e.constantVelocity += e.accelerationAdjustments.bounceAdd;
                  e.constantVelocity *= e.accelerationAdjustments.bounceMult;
                  e.constantVelocity = Math2.clamp(e.constantVelocity, e.accelerationAdjustments.minSpeed, e.accelerationAdjustments.maxSpeed);
                  if (!bulletData.interactions.physicallyCollideWithTanks) Body.setSpeed(e.shape, e.constantVelocity);
                }
                // bounce size change
                if (e.sizeAdjustments.enabled && e.sizeAdjustments.delay <= 0) {
                  e.scale(0, e.sizeAdjustments.bounceAdd);
                  e.scale(1, e.sizeAdjustments.bounceMult);
                  e.scale(2, e.sizeAdjustments.minSize, e.sizeAdjustments.maxSize);
                }
                // bounce range change
                if (e.rangeAdjustments.enabled && e.rangeAdjustments.delay <= 0) {
                  e.range += e.rangeAdjustments.bounceAdd * framerate;
                  e.range *= e.rangeAdjustments.bounceMult;
                  e.range = Math2.clamp(e.range, 0, e.rangeAdjustments.maxRange);
                  if (e.range <= 0) e.annihilate(1);
                }
                // bounce opacity change
                if (e.opacityAdjustments.enabled && e.opacityAdjustments.delay <= 0) {
                  e.opacity += e.opacityAdjustments.bounceAdd;
                  e.opacity *= e.opacityAdjustments.bounceMult;
                  e.opacity = Math2.clamp(e.opacity, e.opacityAdjustments.minOpacity, e.opacityAdjustments.maxOpacity);
                }
                // bounce health change
                if (e.healthAdjustments.enabled && e.healthAdjustments.delay <= 0) {
                  const placeholderHealth = parseFloat(e.health);
                  e.health += e.healthAdjustments.bounceAdd;
                  e.health *= e.healthAdjustments.bounceMult;
                  e.health = Math2.clamp(e.health, 0, e.healthAdjustments.maxHealth);
                  if (e.health <= 0) e.annihilate(0);
                  if (e.health < placeholderHealth) e.damagedThisFrame = true;
                }
                // bounce resist change
                if (e.resistAdjustments.enabled && e.resistAdjustments.delay <= 0) {
                  e.damageResistance += e.resistAdjustments.bounceAdd;
                  e.damageResistance *= e.resistAdjustments.bounceMult;
                  e.damageResistance = Math2.clamp(e.damageResistance, e.resistAdjustments.minResist, e.resistAdjustments.maxResist);
                }
                // bounce bubble size change
                if (e.bubbleSizeAdjustments.enabled && e.bubbleSizeAdjustments.delay <= 0) {
                  e.lights[0].circle += e.bubbleSizeAdjustments.bounceAdd * 4.5/16;
                  e.lights[0].circle *= e.bubbleSizeAdjustments.bounceMult;
                  e.lights[0].circle = Math2.clamp(e.lights[0].circle, e.bubbleSizeAdjustments.minSize, e.bubbleSizeAdjustments.maxSize);
                }
                // bounce bubble opacity change
                if (e.bubbleOpacityAdjustments.enabled && e.bubbleOpacityAdjustments.delay <= 0) {
                  e.lights[0].opacity += e.bubbleOpacityAdjustments.bounceAdd;
                  e.lights[0].opacity *= e.bubbleOpacityAdjustments.bounceMult;
                  e.lights[0].opacity = Math2.clamp(e.lights[0].opacity, e.bubbleOpacityAdjustments.minOpacity, e.bubbleOpacityAdjustments.maxOpacity);
                }
                
                if (bulletData.interactions.destroyWalls) {
                  pairs[pairs.indexOf(p)].isSensor = true;
                  other.annihilate();
                }
                
                // increment our max wall hits
                if (e.hitsRemaining.walls >= 0) {
                  e.hitsRemaining.walls--;
                  if (e.hitsRemaining.walls < 0) e.annihilate(0);
                }
                
                // if the wall does bounce damage, deal it
                if (other.bounceDamage > 0) {
                  e.health -= other.bounceDamage;
                  e.damagedThisFrame = true;
                }
                
                if (!other.hasHitbox) {
                  pairs[pairs.indexOf(p)].isSensor = true;
                  if (other.removeOnCollide) other.annihilate();
                }
                if (other.opacityOnCollide !== other.initialOpacity) {
                  other.opacity = other.opacityOnCollide;
                  other.fadingTimer = other.opacityFadeTime === 0 ? Infinity : other.opacityFadeTime;
                }
                
                if (util.matchIds(bulletData.wallIds, other.dieToIds)) {
                  other.annihilate();
                  pairs[pairs.indexOf(p)].isSensor = true;
                }
                if (util.matchIds(bulletData.wallIds, other.killWithIds)) {
                  e.annihilate(0);
                }
                
                // get the restitution of our bullet and wall, multiply them, and that is our applied velocity dampen
                e.constantVelocity *= (e.restitution * other.restitution);
                
                // same thing with roughness, rougness of walls and bullets add together to form a larger range of deviation
                if (e.roughness + other.roughness > 0) {
                  const deviation = ((Math.random() - 0.5) * (e.roughness + other.roughness));
                  Body.setVelocity(e.shape, {
                    x: Math.cos(e.shape.angle + deviation) * e.shape.speed,
                    y: Math.sin(e.shape.angle + deviation) * e.shape.speed,
                  });
                  Body.setAngle(e.shape, e.shape.angle + deviation);
                }
                
                // if we hit a wall, add to our trail since we now know we have a new velocity
                if (e.drawTrail) {
                  e.trailPoints.push(e.shape.position.x, e.shape.position.y, bulletData.misc.trailLength * framerate);
                  e.trailTimer = bulletData.misc.trailInterval * framerate;
                }
                
                break;
              }
              case "border": {
                // bullet on border collisions
                if (bulletData.interactions.borderBehavior === 0) e.annihilate(2);
                break;
              }
            }
          }
        }
        
        e.torqueUnlock = Math.floor(framerate / 10) + 1;
        other.torqueUnlock = Math.floor(framerate / 10) + 1;
      }
    });
  }
  
  /**
  makes walls and stuff from a maze plan
  */
  buildMaze() {
    let rules = this.host.clientSettings;
    let width = this.size.width / this.mazePlan[0].length;
    let height = this.size.height / this.mazePlan.length;
    let smallWidth = width * this.wallThickness;
    let smallHeight = height * this.wallThickness;
    for (let i = 0; i < this.mazePlan.length; i++) {
      for (let j = 0; j < this.mazePlan[0].length; j++) {
        let tile = this.mazePlan[i][j];
        for (let k = 0; k < 4; k++) {
          if (k === 0 && (!tile.top[0] || i !== 0)) continue;
          if (k === 1 && !tile.right[0]) continue;
          if (k === 2 && !tile.bottom[0]) continue;
          if (k === 3 && (!tile.left[0] || j !== 0)) continue;
          
          let wallType = -1;
          if (k === 0 && tile.top[1] !== -1) wallType = this.getWallById(tile.top[1]);
          else if (k === 1 && tile.right[1] !== -1) wallType = this.getWallById(tile.right[1]);
          else if (k === 2 && tile.bottom[1] !== -1) wallType = this.getWallById(tile.bottom[1]);
          else if (k === 3 && tile.left[1] !== -1) wallType = this.getWallById(tile.left[1]);
          else {
            let priorities = [];
            for (let w of rules.wallTypes) {
              switch (w.spawnLocation) {
                case 0: {
                  priorities.push(w.spawnChance);
                  break;
                }
                case 1: {
                  if (   i === 0 && tile.top[0]
                      || i === this.mazePlan.length - 1 && tile.bottom[0]
                      || j === 0 && tile.left[0]
                      || j === this.mazePlan[0].length - 1 && tile.right[0]) priorities.push(w.spawnChance);
                  else priorities.push(0);
                  break;
                }
                case 2: {
                  if (   i === 0 && tile.top[0]
                      || i === this.mazePlan.length - 1 && tile.bottom[0]
                      || j === 0 && tile.left[0]
                      || j === this.mazePlan[0].length - 1 && tile.right[0]) priorities.push(0);
                  else priorities.push(w.spawnChance);
                  break;
                }
              }
            }
            if (priorities.length <= 0) priorities = [1];
            wallType = rules.wallTypes[util.getPriority(priorities)];
          }
          
          let usedSmallWidth = smallWidth * util.ISS(wallType.thickness) / 100;
          let usedSmallHeight = smallHeight * util.ISS(wallType.thickness) / 100;
          
          // if horizontal, if we have something on our left or right shrink our width
          let xMod = 0;
          let widthMod = 0;
          if (k === 0 || k === 2) {
            if (tile.left[0] || 
                ((k === 0) && (i > 0 && this.mazePlan[i - 1][j].left[0])) || 
                ((k === 2) && (i < this.mazePlan.length - 1 && this.mazePlan[i + 1][j].left[0]))
            ) {
              widthMod -= usedSmallWidth/2;
              xMod += usedSmallWidth/4;
            }
            if (tile.right[0] || 
                ((k === 0) && (i > 0 && this.mazePlan[i - 1][j].right[0])) || 
                ((k === 2) && (i < this.mazePlan.length - 1 && this.mazePlan[i + 1][j].right[0]))
            ) {
              widthMod -= usedSmallWidth/2;
              xMod -= usedSmallWidth/4;
            }
          }
          let yMod = 0;
          let heightMod = 0;
          if (k === 1) {
            if (i <= 0 || !this.mazePlan[i - 1][j].right[0]) {
              heightMod += usedSmallHeight/2;
              yMod -= usedSmallHeight/4;
            }
            if (i >= this.mazePlan.length - 1 || !this.mazePlan[i + 1][j].right[0]) {
              heightMod += usedSmallHeight/2;
              yMod += usedSmallHeight/4;
            }
          }
          if (k === 3) {
            if (i <= 0 || !this.mazePlan[i - 1][j].left[0]) {
              heightMod += usedSmallHeight/2;
              yMod -= usedSmallHeight/4;
            }
            if (i >= this.mazePlan.length - 1 || !this.mazePlan[i + 1][j].left[0]) {
              heightMod += usedSmallHeight/2;
              yMod += usedSmallHeight/4;
            }
          }
          
          let mass = util.ISS(wallType.mass);
          
          let wallElement = new Wall({
            name: wallType.name,
            lobby: this,
            shape: Bodies.rectangle(
              j * width + (k === 0 || k === 2 ? width/2 : 0) + (k === 1 ? width : 0) - this.size.width/2 + xMod,
              i * height + (k === 1 || k === 3 ? height/2 : 0) + (k === 2 ? height : 0) - this.size.height/2 + yMod,
              (k === 0 || k === 2 ? width : usedSmallWidth) + widthMod,
              (k === 1 || k === 3 ? height : usedSmallHeight) + heightMod,
              {isStatic: mass === 0 ? true : false}
            ),
            mass: mass,
            color: wallType.color,
            shadowCaster: wallType.castShadow,
            renderOrder: 500 + Math.floor(Math.random() * 100), // walls render orders from 500 to 599, inclusive
            collisionInfo: [
              ["border", mass !== 0, mass !== 0],
              ["wall", mass !== 0, mass !== 0],
              ["bubble", mass === 0, mass === 0],
              ["all", true, true],
            ],
            borderWidth: 0,
            initialOpacity: util.ISS(wallType.opacity) / 100,
            restitution: util.ISS(wallType.restitution) / 100,
            roughness: util.ISS(wallType.roughness) * Math.PI / 180,
            bounceDamage: util.ISS(wallType.bounceDamage),
            tankDamage: util.ISS(wallType.tankDamage),
            hasHitbox: wallType.hasHitbox,
            removeOnCollide: wallType.removeOnCollide,
            opacityOnCollide: util.ISS(wallType.opacityOnCollide) / 100,
            opacityFadeTime: util.ISS(wallType.opacityFadeTime) * framerate,
            ignoreIds: wallType.ignoreIds,
            dieToIds: wallType.dieToIds,
            killWithIds: wallType.killWithIds
          });
        }
        if (tile.closed) {
          let heightMod = 0;
          let widthMod = 0;
          if (i > 0 && this.mazePlan[i - 1][j].closed) {
            heightMod += smallHeight;
          }
          if (j > 0 && this.mazePlan[i][j - 1].closed) {
            widthMod += smallWidth;
          }
          new Wall({
            name: "Closed Tile Wall",
            lobby: this,
            shape: Bodies.rectangle(
              j * width + width/2 - this.size.width/2 - widthMod/2,
              i * height + height/2 - this.size.height/2 - heightMod/2,
              width - smallWidth + widthMod,
              height - smallHeight + heightMod,
              {isStatic: true}
            ),
            color: 3,
            opacity: 0.5,
            renderOrder: 400 + Math.floor(Math.random() * 100), // closed tiles render orders from 400 to 499, inclusive
            borderColor: 3,
            shadowCaster: false,
            collisionInfo: [
              ["wall", false, false],
              ["border", false, false],
              ["all", true, true],
            ],
            borderWidth: 0,
          });
        }
      }
    }
  }
  
  /** 
  uses the host's settings to create a lobby to specifications
  */
  refreshLobby(toLobby) {
    const rules = this.host.clientSettings;
    
    this.endGameTimer = 0;
    this.gameTimer = -1;
    this.refreshAfterTimer = false;
    
    // delete all objects except the players, and then refresh their attributes
    for (let o = this.objects.length - 1; o >= 0; o--) if (this.objects[o].type !== "tank")
      this.objects[o].annihilate();
    this.resetTeams();
    for (let p of this.players) p.setAttributes();
    
    if (rules.gamemode.teams.overrideTeamColor) {
      let teamColors = [];
      for (let p of this.players) {
        let colorFound = false;
        for (let t = 0; t < teamColors.length; t++) if (teamColors[t][0] === p.team) colorFound = true;
        if (p.clientSettings.personal.tankColor !== -1 && !colorFound) teamColors.push([p.team, p.color]);
      }
      for (let p of this.players) {
        p.color = null;
        for (let t = 0; t < teamColors.length; t++) if (teamColors[t][0] === p.team) p.color = teamColors[t][1];
        if (p.color === null) {
          p.color = Math.floor(Math.random() * 55) + 1;
          teamColors.push([p.team, p.color]);
        }
      }
    }
    
    if (toLobby) this.remainingGames = rules.gamemode.gamesInARow;
    else {
      this.pauseTimer = util.ISS(rules.gamemode.roundStartTimer) * framerate;
      switch (rules.gamemode.mode) {
        // Arena
        case 1: {
          this.gameTimer = util.ISS(rules.gamemode.arena.roundTimer) * framerate;
          break;
        }
        // Tag
        case 2: {
          for (let p of this.players) {
            p.points = util.ISS(rules.gamemode.tag.maxTags);
          }
          break;
        }
        // Monarch
        case 3: {
          let teamPlayers = [];
          for (let p of this.players) {
            let teamFound = false;
            for (let team of teamPlayers) {
              if (team[0] !== p.team) continue;
              team[1].push(p);
              teamFound = true;
            }
            if (!teamFound) teamPlayers.push([p.team, [p]])
          }
          for (let team of teamPlayers) {
            let monarch = team[1][Math.floor(Math.random() * team[1].length)];
            monarch.teamMonarch = true;
            if (rules.gamemode.monarch.overrideMonarchExtraLives) monarch.remainingLives = util.ISS(rules.gamemode.monarch.monarchExtraLives);
          }
          break;
        }
        // KotH
        case 4: {
          if (rules.gamemode.kingOfTheHill.firstCrownAssignment === 1) {
            if (rules.gamemode.kingOfTheHill.crownOwnedByTeam) {
              let crowned = this.players[Math.floor(Math.random() * this.players.length)];
              for (let p of this.players) if (p.team === crowned.team) p.hasCrown = true;
            }
            else this.players[Math.floor(Math.random() * this.players.length)].hasCrown = true;
          }
          if (rules.gamemode.kingOfTheHill.firstCrownAssignment === 2) {
            let lowestScoringPlayer = [this.players[0]];
            for (let p of this.players) {
              if (p.wins/p.games < lowestScoringPlayer[0].wins/lowestScoringPlayer[0].games) lowestScoringPlayer = [p];
              else if (p.wins/p.games === lowestScoringPlayer[0].wins/lowestScoringPlayer[0].games) lowestScoringPlayer.push(p);
            }
            if (rules.gamemode.kingOfTheHill.crownOwnedByTeam) {
              let crowned = lowestScoringPlayer[Math.floor(Math.random() * lowestScoringPlayer.length)];
              for (let p of this.players) if (p.team === crowned.team) p.hasCrown = true;
            }
            else lowestScoringPlayer[Math.floor(Math.random() * lowestScoringPlayer.length)].hasCrown = true;
          }
          if (rules.gamemode.kingOfTheHill.firstCrownAssignment !== 0) this.gameTimer = util.ISS(rules.gamemode.kingOfTheHill.countdownTimer) * framerate;
          break;
        }
      }
    }
    
    // apply all the general lobby settings for this game
    this.powerupsLeftToSpawn = util.ISS(rules.powerupSettings.maxPowerups);
    this.spawnsOfType = new Array(rules.powerups.length).fill(0);
    for (let i = 0; i < rules.powerups.length; i++) {
      this.spawnsOfType[i] = util.ISS(rules.powerups[i].spawning.maxSpawns);
      if (this.spawnsOfType[i] === 0) this.spawnsOfType[i] = -1;
    }
    
    // create a maze, depending on if we are in lobby or in game
    let chosenSize = toLobby ? util.ISS(rules.maze.tileSize) : util.ISS(rules.maze.tileSize);
    let xSize = toLobby ? util.ISS(rules.waitingRoom.size.width) : util.ISS(rules.maze.tileDimensions.x);
    let ySize = toLobby ? util.ISS(rules.waitingRoom.size.height) : util.ISS(rules.maze.tileDimensions.y);
    this.wallThickness = util.ISS(rules.maze.wallWidth) / 100;
    if (toLobby ? rules.waitingRoom.spawnMaze : rules.maze.enableMaze) {
      if (Math.random() > rules.maze.customChance / 100) {
        // generate a maze if a custom isn't chosen
        this.mazePlan = util.generateMaze({
          xTiles: xSize,
          yTiles: ySize,
          closedTiles: util.ISS(rules.maze.closedPercentage),
          hallwayLength: util.ISS(rules.maze.hallwayLength),
          neverShortenHallways: true,
          wrap: false,
          wallsRemovedPercentage: util.ISS(rules.maze.wallsRemovedPercentage)
        });
      }
      else {
        // if we have a custom maze set to spawn instead, choose our custom maze and spawn it
        let priorities = [];
        for (let i = 0; i < rules.customMazes.length; i++) {
          priorities.push(rules.customMazes[i][0]);
        }
        let chosenSpawn = util.getPriority(priorities);
        
        let mazePrototype = rules.customMazes[chosenSpawn];
        xSize = mazePrototype[1];
        ySize = (mazePrototype.length - 2) / mazePrototype[1] / 5;
        
        this.mazePlan = [];
        
        for (let i = 0; i < ySize; i++) {
          this.mazePlan.push([]);
          for (let j = 0; j < mazePrototype[1]; j++) {
            this.mazePlan[i].push({
              top: [mazePrototype[3 + j * 5 + i * xSize * 5] !== -1, mazePrototype[3 + j * 5 + i * xSize * 5]],
              right: [mazePrototype[4 + j * 5 + i * xSize * 5] !== -1, mazePrototype[4 + j * 5 + i * xSize * 5]],
              bottom: [mazePrototype[5 + j * 5 + i * xSize * 5] !== -1, mazePrototype[5 + j * 5 + i * xSize * 5]],
              left: [mazePrototype[6 + j * 5 + i * xSize * 5] !== -1, mazePrototype[6 + j * 5 + i * xSize * 5]],
              closed: mazePrototype[2 + j * 5 + i * xSize * 5],
              reached: 0
            });
          }
        }
      }
      this.size = {
        width: chosenSize * xSize,
        height: chosenSize * ySize,
      };
      this.mazeDimensions = {
        x: xSize,
        y: ySize
      };
      this.createRepresentation();
      this.buildMaze();
      
      for (let o = this.players.length - 1; o >= 0; o--) {
        this.randomLocation(this.players[o], {type: 1, w: this.size.width, h: this.size.height, x: 0, y: 0});
      }
    }
    this.createBorders();
    
    for (let o = this.players.length - 1; o >= 0; o--) {
      Body.setAngle(this.players[o].shape, Math.random() * 2 * Math.PI);
      this.randomLocation(this.players[o], {type: 1, w: this.size.width, h: this.size.height, x: 0, y: 0});
    }
    
    this.inLobby = toLobby;
    this.powerupSpawnTimer = util.ISS(rules.powerupSettings.powerupSpawnTimer) * framerate;
  }

  
  /**
  creates 4 walls around 0,0, based on the room size
  @param {Number} width - the total width of the room
  @param {Number} height - the total height of the room
  */
  createBorders() {
    let width = this.size.width + (this.size.width / this.mazePlan[0].length * this.wallThickness);
    let height = this.size.height + (this.size.height / this.mazePlan.length * this.wallThickness);
    let borderWidth = 1000000;
    let borderHeight = 1000000;
    new Entity({name: "Top Border", lobby: this, shape: Bodies.rectangle(0, -height/2 - borderHeight/2, width, borderHeight, {isStatic: true}), noRender: true, type: "border", hitsGhost: true});
    new Entity({name: "Right Border", lobby: this, shape: Bodies.rectangle(-width/2 - borderWidth/2, 0, borderWidth, height, {isStatic: true}), noRender: true, type: "border", hitsGhost: true});
    new Entity({name: "Bottom Border", lobby: this, shape: Bodies.rectangle(0, height/2 + borderHeight/2, width, borderHeight, {isStatic: true}), noRender: true, type: "border", hitsGhost: true});
    new Entity({name: "Left Border", lobby: this, shape: Bodies.rectangle(width/2 + borderWidth/2, 0, borderWidth, height, {isStatic: true}), noRender: true, type: "border", hitsGhost: true});
  }
  
  /**
  Finds a valid location to spawn an object in, within some boundary
  @object {Object Shape} shape - a Matter-js object to move
  @param {Object} boundary - can be either a type 0 circle, or a type 1 rectangle boundary object
  */
  randomLocation(entity, boundary, inBounds = false) {
    entity.resetLerp = true;
    for (let i = 0; i < 999; i++) {
      let loc = {x: 0, y: 0};
      switch (boundary.type) {
        // circle
        case 0: {
          let theta = Math.random() * Math.PI * 2;
          let r = Math.random() * boundary.r;
          loc.x = boundary.x + Math.cos(theta) * r;
          loc.y = boundary.y + Math.sin(theta) * r;
          break;
        }
        // square
        case 1: {
          loc.x = boundary.x + Math.random() * boundary.w - boundary.w / 2;
          loc.y = boundary.y + Math.random() * boundary.h - boundary.h / 2;
          break;
        }
      }
      if (inBounds) {
        loc.x = Math2.clamp(loc.x, 0, e.lobby.size.width);
        loc.y = Math2.clamp(loc.y, 0, e.lobby.size.height);
      }
      Body.setPosition(entity.shape, loc);
      // check if shape intersects any shapes that it collides with
      let breaker = false;
      for (let o of this.objects) {
        if (o.shape === entity.shape) continue;
        if (!Detector.canCollide(entity.shape.collisionFilter, o.shape.collisionFilter)) continue;
        if (Collision.collides(entity.shape, o.shape) !== null) breaker = true;
        if (breaker) break;
      }
      if (breaker) continue;
      break;
    }
  }
}

let cameraId = 0;
class Camera {
  constructor(target, vision, p) {
    this.id = cameraId;
    cameraId++;
    this.truevision = vision;
    this.vision = vision;
    this.truecircle = p.circle ?? 2000 * 9/16;
    this.circle = p.circle ?? 2000 * 9/16;
    this.target = target;
    this.trackedObject = target;
    this.lockAtCenter = p.lockAtCenter ?? false;
    this.offset = p.offset ?? {x: 0, y: 0};
    this.realOffset = p.offset ?? {x: 0, y: 0};
    this.shader = 0;
    this.screenBounds = {x: 1, y: 9/16};
    this.precision = 200;
    this.visibleObjects = [];
    this.renderedObjects = [];
    this.visibility = {
      enemy: p.visibilityEnemy ?? false,
      team: p.visibilityTeam ?? false,
      self: p.visibilitySelf ?? true,
      parent: p.visibilityParent ?? false,
    };
    this.trueIgnoreWalls = p.ignoreWalls ?? true;
    this.ignoreWalls = p.ignoreWalls ?? true;
    this.opacity = p.opacity ?? 1;
    this.arc = {start: p.startAngle ?? 0, end: p.endAngle ?? 360};
    this.obfuscator = p.obfuscator ?? false;
    this.colorTint = p.colorTint ?? 0;
    if (this.colorTint === -1) this.colorTint = Math.floor(Math.random() * 55) + 1;
    this.renderOverShadows = p.renderOverShadows ?? false;
    this.friendlyOpacity = p.friendlyOpacity ?? 0;
    this.previousIntersection = [];
    this.visibleOff = p.visibleOff ?? true;
    this.visibleOn = p.visibleOn ?? true;
    this.forcePowerup = p.forcePowerup ?? -1;
  }
  
  changeVision(newVision) {
    this.truevision = newVision;
    this.vision = newVision;
  }
  
  /**
  checks if an object is able to be rendered by the camera, or if it is too far away
  @param {Matter Object} object - the matter-js mesh being checked
  */
  checkBounds(object, bubble = null) {
    // easy screen size filter
    const posx = this.lockAtCenter ? 0 : this.trackedObject.shape.position.x;
    const posy = this.lockAtCenter ? 0 : this.trackedObject.shape.position.y;
    if (bubble === null) {
      if (object.bounds.max.x < posx - this.screenBounds.x * this.vision/2 + this.offset.x) return false;
      if (object.bounds.min.x > posx + this.screenBounds.x * this.vision/2 + this.offset.x) return false;
      if (object.bounds.max.y < posy - this.screenBounds.y * this.vision/2 + this.offset.y) return false;
      if (object.bounds.min.y > posy + this.screenBounds.y * this.vision/2 + this.offset.y) return false;

      return true;
    }
    
    // slightly harder check for keeping within bubble
    return Math2.RectangleCircle({
      x: object.bounds.min.x,
      y: object.bounds.min.y, 
      w: object.bounds.max.x - object.bounds.min.x,
      h: object.bounds.max.y - object.bounds.min.y
    }, {
      x: posx + this.offset.x,
      y: posy + this.offset.y,
      r: bubble
    });
  }
  
  updateFrame() {
    this.offset = {
      x: this.realOffset.x * Math.cos(this.target.shape.angle) - this.realOffset.y * Math.sin(this.target.shape.angle),
      y: this.realOffset.x * Math.sin(this.target.shape.angle) + this.realOffset.y * Math.cos(this.target.shape.angle)
    };
  }
  
  /**
  checks for the lights that can reach the rectangle of the player's screen. If a light's radius doesn't intersect, we don't need
  to render it and therefore the objects it shows do not need to be added to the visible objects here.
  */
  getLights() {
    let lightData = [];
    
    this.renderedObjects = [];
    for (let o of this.target.lobby.objects) {
      if (o.lights.length <= 0) continue;
      if (o.ghost && !this.target.ghost) continue;
      for (let l of o.lights) {
        // check our visibility effects first, then our actual visibility
        if (l.target.lightsOff && !l.visibleOff) continue;
        if (!l.target.lightsOff && !l.visibleOn) continue;
        if (l.forcePowerup !== -1) {
          if (l.target.powerups[0].powerupData.id !== l.forcePowerup) continue;
        }
        
        let usedVis;
        if (l.target.type === "tank" && l.target.getBiggestEffect(5) !== null) usedVis = l.target.getBiggestEffect(5);
        else usedVis = l.visibility;
        
        let usedOpacity = l.opacity;
        let canSee = true;
        if (!usedVis.self && l.target === this.target) canSee = false;
        if ((!usedVis.parent || l.target.parent !== this.target) && l.target !== this.target) {
          if (!usedVis.enemy && l.target.team !== this.target.team) canSee = false;
          if (!usedVis.team && l.target.team === this.target.team && l.target !== this.target) canSee = false;
        }
        if (!canSee) {
          if (!l.obfuscator) continue;
          usedOpacity = usedOpacity * l.friendlyOpacity;
        }
        
        // if the square around the light is too far away to see, we don't need to worry about it at all
        const thisPosX = this.lockAtCenter ? 0 : this.trackedObject.shape.position.x;
        const thisPosY = this.lockAtCenter ? 0 : this.trackedObject.shape.position.y;
        const lPosX = l.lockAtCenter ? 0 : l.trackedObject.shape.position.x;
        const lPosY = l.lockAtCenter ? 0 : l.trackedObject.shape.position.y;
        if (!Math2.rectangleIntersection({
          x: thisPosX + this.offset.x, 
          y: thisPosY + this.offset.y,
          w: this.vision, h: this.vision * 9/16,
        }, {
          x: lPosX + this.offset.x, 
          y: lPosY + this.offset.y,
          w: l.circle * 2, h: l.circle * 2,
        })) continue;
        
        if (l === this) {
          for (let v of this.target.lobby.objects.filter((e) => {
            if (e.noRender) return false;
            return this.checkBounds(e.shape);
          })) this.renderedObjects.push(v);
        }
        else for (let v of l.visibleObjects) this.renderedObjects.push(v);
        
        let sentAngles = [
          l.arc.start * (Math.PI / 180) + (l.target.angleLock ? 0 : l.trackedObject.shape.angle) + l.target.addedAngle,
          l.arc.end * (Math.PI / 180) + (l.target.angleLock ? 0 : l.trackedObject.shape.angle) + l.target.addedAngle
        ];
        if (l.arc.start === 0 && l.arc.end === 360) sentAngles = [0, Math.PI * 2];
        
        lightData.push([
          l.id,
          l.circle / this.vision,
          ((lPosX + l.offset.x) - thisPosX) / this.vision,
          ((lPosY + l.offset.y) - thisPosY) / this.vision,
          l === this ? 1 : 0,
          l.target.ghost || l.ignoreWalls ? 1 : 0,
          usedOpacity,
          sentAngles[0],
          sentAngles[1],
          l.obfuscator ? 1 : 0,
          l.obfuscator ? l.colorTint : 0,
          l.renderOverShadows ? 1 : 0
        ]);
      }
    }
    return lightData;
  }
  
  getVisibleObjects() {
    this.visibleObjects = this.target.lobby.objects.filter((e) => {
      if (e.noRender) return false;
      if (e.type === "bullet" && e.drawTrail) return true;
      return this.checkBounds(e.shape, this.circle);
    });
  }
  
  getUsedVision() {
    this.vision = this.truevision * this.target.getBiggestEffect(2);
    this.circle = this.truecircle * this.target.getBiggestEffect(3);
    this.ignoreWalls = this.target.getBiggestEffect(4);
    if (this.ignoreWalls === null) this.ignoreWalls = this.trueIgnoreWalls;
  }
  
  getView() {
    const rules = this.target.lobby.host.clientSettings;
    
    let xoff = (this.lockAtCenter ? 0 : this.trackedObject.shape.position.x) + this.offset.x;
    let yoff = (this.lockAtCenter ? 0 : this.trackedObject.shape.position.y) + this.offset.y;
    
    let shapes = [];
    for (let e of this.renderedObjects) {
      
      if (e.deletingThisFrame) continue;
      if (e.noForm) continue;
      
      let objx = e.shape.position.x - xoff;
      let objy = e.shape.position.y - yoff;
      
      let objcolor = e.color;
      let objborder = e.borderColor;
      let objopacity = e.opacity;
      let objorder = e.renderOrder;
      if (e.ghost) {
        switch (rules.general.visibleGhostType) {
          // only ghosts see ghosts
          case 0: {
            if (!this.target.ghost) continue;
            break;
          }
          // killers see their victim's ghosts
          case 1: {
            if (!this.target.ghost && e.killer !== this.target) continue;
            break;
          }
          // team only sees ghosts
          case 2: {
            if (!this.target.ghost && e.team !== this.target.team) continue;
            break;
          }
          // everyone sees ghosts in case 3, so no need to have it
          case 4: {
            if (Collision.collides(this.trackedObject.shape, e.shape) === null) continue;
            break;
          }
        }
        objopacity = 0.5;
        objcolor = 6;
        objorder += 100;
      }
      
      if (e.type === "tank") {
        // apply the tank's most critical effect to the tank's statistics
        objopacity *= e.getBiggestEffect(0);
      }
      
      if (e.type === "shield") {
        objx = e.tank.shape.position.x - xoff;
        objy = e.tank.shape.position.y - yoff;
      }
      
      // let ghosts see invisible bullets, and fade safe bullets
      if (this.target.ghost || e === this.target) objopacity = 0.2 + 0.8 * objopacity;
      else if (e.type === "bullet") {
        if (e.armed) objopacity = 1;
        if (!Detector.canCollide(e.shape.collisionFilter, this.trackedObject.shape.collisionFilter)) objopacity *= e.safeFade;
        const minParentOpacity = e.powerupRef.powerupData.misc.minOpacity/100;
        switch (e.powerupRef.powerupData.misc.seeInvisibleType) {
          case 1: {
            if (this.target !== e.parent) break;
            objopacity = (minParentOpacity) + objopacity * (1 - minParentOpacity);
            break;
          }
          case 2: {
            if (this.target.team !== e.team) break;
            objopacity = (minParentOpacity) + objopacity * (1 - minParentOpacity);
            break;
          }
        }
      }
      
      let shieldValue = 0;
      let shieldTotal = 0;
      let shieldAmount = 0;
      for (let s of e.shields) {
        shieldTotal += s.maxHealth;
        shieldAmount += s.healthRemaining;
        shieldValue = shieldAmount / shieldTotal;
      }
      
      // if visibility is turned off behind walls, raycast to see if the object is behind a shadow casting object
      let bodies = [];
      let showEffects = false;
      if (e.type === "tank") {
        switch (rules.general.tankTextVisibility) {
          case 0: {
            showEffects = true;
            break;
          }
          case 2: {
            for (let i = 0; i < this.target.lobby.objects.length; i++) {
              const t = this.target.lobby.objects[i];
              if (t.shadowCaster && t !== this.target && t !== e && objopacity >= 1 && !this.ignoreWalls && !this.target.ghost) bodies.push(t.shape);
            }
            showEffects = Query.ray(bodies, this.trackedObject.shape.position, e.shape.position).length === 0;
            break;
          }
        }
      }
      else showEffects = true;
      
      let healthPercentage = e.health/e.maxHealth;
      if (e.type === "bullet" && e.healthAdjustments.initialEnabled) healthPercentage = e.health / e.healthAdjustments.maxHealth;
      
      let nameColor = 0;
      if (e.type === "tank" && e.team === this.target.team && e != this.target) nameColor = 25;
      if (e.type === "tank" && e.teamMonarch) {
        switch (rules.gamemode.monarch.kingVisibility) {
          case 0: {
            nameColor = e.team === this.target.team ? 19 : 43;
            break;
          }
          case 1: {
            if (e.team !== this.target.team) nameColor = 43;
            break;
          }
          case 2: {
            if (e.team === this.target.team) nameColor = 19;
            break;
          }
          case 3: {
            if (e === this.target) nameColor = 19;
            break;
          }
        }
        if (rules.gamemode.monarch.changeMonarchBorders) objborder = nameColor;
      }
      if (e.type === "tank" && e.hasCrown) {
        nameColor = 19;
      }
      
      // if we have poison, freeze, or any other border changig effect, use the highest priority one
      let highestPriorityEffect = -1;
      for (let p of e.poisonEffects) {
        if (p.borderOverride && p.priority > highestPriorityEffect) {
          objborder = p.overrideColor;
          highestPriorityEffect = p.priority;
        }
      }
      for (let f of e.freezeEffects) {
        if (f.borderOverride && f.priority > highestPriorityEffect) {
          objborder = f.overrideColor;
          highestPriorityEffect = f.priority;
        }
      }
      let trailColor = 0;
      if (e.drawTrail) {
        if (e.powerupRef.powerupData.misc.overrideTrailColor) trailColor = e.powerupRef.powerupData.misc.trailColor;
        else trailColor = objcolor;
      }
      
      let regenBarColor = 25;
      if (e.type === "tank") {
        if (e.regeneration.percentage > 0 || e.regeneration.raw > 0) {
          if (e.regeneration.leftoverTimer > 0 || e.health >= e.maxHealth) regenBarColor = 25;
          else regenBarColor = 28;
        }
      }
      
      shapes.push([
        /* 0  id */ e.id,
        /* 1  x pos */ objx / this.vision,
        /* 2  y pos */ objy / this.vision,
        /* 3  color */ objcolor,
        /* 4  border color */ objborder,
        /* 5  render order */ objorder,
        /* 6  shadow casting */ e.shadowCaster ? 1 : 0,
        /* 7  border size */ e.borderWidth / this.vision,
        /* 8  removed this frame */ e.deletingThisFrame ? 1 : 0,
        /* 9  opacity */ objopacity,
        /* 10 edge type */ 0,
        /* 11 disable vertice lerping */ 0,
        /* 12 do not render */ (e.type === "tank" || e.type === "bullet" || e.type === "bubble") ? 1 : 0,
        /* 13 draw healthbar */ e.showHealthBar && showEffects ? 1 : 0,
        /* 14 healthbar value */ healthPercentage,
        /* 15 healthbar size */ e.attachmentScaling / this.vision,
        /* 16 damaged this frame */ e.damagedThisFrame ? 1 : 0,
        /* 17 shield value */ shieldValue,
        /* 18 trail size */ e.drawTrail ? e.attachmentScaling * e.powerupRef.powerupData.misc.trailSize / 50 / this.vision : 0,
        /* 19 trail fading */ e.drawTrail ? e.powerupRef.powerupData.misc.trailFading ? 1 : 0 : 0,
        /* 20 trail color */ trailColor,
        /* 21 healthbar color */ regenBarColor,
        /* 22 name color */ nameColor
      ]);
      if (e.type !== "tank" || !showEffects) shapes.push([]);
      else {
        let nameValues = [];
        let usedName = encodeURIComponent(e.name);
        for (let j = 0; j < usedName.length; j++) nameValues.push(usedName.charCodeAt(j) < 128 ? usedName.charCodeAt(j) : 63);
        shapes.push(nameValues);
      }
      if (e.type !== "bullet" || !e.drawTrail) shapes.push([]);
      else {
        let adjustedTrail = [];
        for (let t = 0; t < e.trailPoints.length; t += 3) {
          adjustedTrail.push((e.trailPoints[t] - xoff) / this.vision);
          adjustedTrail.push((e.trailPoints[t + 1] - yoff) / this.vision);
          adjustedTrail.push(e.trailPoints[t + 2]);
        }
        shapes.push(adjustedTrail);
      }

      if (e.shape.vertices.length <= 25) {
        let vertices = [];
        for (let v of e.shape.vertices) {
          vertices.push((v.x - e.shape.position.x) / this.vision, (v.y - e.shape.position.y ) / this.vision);
        }
        shapes.push(vertices);
      }
      else {
        shapes.push([Math.sqrt((e.shape.vertices[0].x - e.shape.position.x) ** 2 + (e.shape.vertices[0].y - e.shape.position.y) ** 2) / this.vision]);
      }
      
      let attachments = [];
      if (e.type === "tank" && e.powerups.length > 0) for (let i of e.powerups[0].powerupData.attachments) attachments.push(i);
      if (e.type === "bullet" || e.type === "bubble") for (let i of e.attachments) attachments.push(i);
      
      for (let i = 0; i < attachments.length; i++) {
        let a = attachments[i];
        
        let xPos = objx / this.vision;
        let yPos = objy / this.vision;
        let usedAngle = (e.angleLock ? 0 : e.shape.angle) + e.addedAngle;
        if (a[3] === -99999 || a[3] === -99998) {
          let rotatedX = a[5] * Math.cos(usedAngle) - a[6] * Math.sin(usedAngle);
          xPos = (objx + rotatedX * e.attachmentScaling * 10) / this.vision;
          let rotatedY = a[5] * Math.sin(usedAngle) + a[6] * Math.cos(usedAngle);
          yPos = (objy + rotatedY * e.attachmentScaling * 10) / this.vision;
        }
        else if (a.length === 6) {
          let rotatedX = a[3] * Math.cos(usedAngle) - a[4] * Math.sin(usedAngle);
          xPos = (objx + rotatedX * e.attachmentScaling * 10) / this.vision;
          let rotatedY = a[3] * Math.sin(usedAngle) + a[4] * Math.cos(usedAngle);
          yPos = (objy + rotatedY * e.attachmentScaling * 10) / this.vision;
        }
        
        shapes.push([
          /* 0  */ e.id + ((i + 1) / (attachments.length + 1)),
          /* 1  */ xPos,
          /* 2  */ yPos,
          /* 3  */ a[1] === -1 ? objcolor : a[1],
          /* 4  */ objborder,
          /* 5  */ objorder + (a[0]/1000 - 1),
          /* 6  */ 0,
          /* 7  */ e.borderWidth / this.vision,
          /* 8  */ e.deletingThisFrame ? 1 : 0,
          /* 9  */ objopacity,
          /* 10 */ a[2],
          /* 11 */ e.noLerpThisFrame ? 1 : 0,
          /* 12 */ 0,
          /* 13 */ 0,
          /* 14 */ 0,
          /* 15 */ 0,
          /* 16 */ e.damagedThisFrame ? 1 : 0,
          /* 17 */ 0,
          /* 18 */ 0,
          /* 19 */ 0,
          /* 20 */ 0,
          /* 21 */ 25,
          /* 22 */ 0
        ]);
        shapes.push([]);
        shapes.push([]);
        let vertices = [];
        if (a[3] === -99999 || a[3] === -99998) {
          vertices = a.slice(3);
          vertices.splice(1, 0, usedAngle, e.attachmentScaling / this.vision * vertices[1]);
        }
        else if (a.length === 6) {
          vertices = [a[5] * e.attachmentScaling * 10 / this.vision];
        }
        else for (let v = 3; v < a.length; v += 2) {
          let xAspect = a[v] * Math.cos(usedAngle) - a[v + 1] * Math.sin(usedAngle);
          let yAspect = a[v] * Math.sin(usedAngle) + a[v + 1] * Math.cos(usedAngle);
          xAspect *= e.attachmentScaling * 10;
          yAspect *= e.attachmentScaling * 10;
          vertices.push((xAspect) / this.vision, (yAspect) / this.vision);
        }
        shapes.push(vertices);
      }
      if (e.damagedThisFrame && e.type === "tank") e.regeneration.leftoverTimer = parseInt(e.regeneration.delay);
      e.damagedThisFrame = false;
    }
    return shapes;
  }
  
  getExtra() {
    const posX = this.lockAtCenter ? 0 : this.trackedObject.shape.position.x;
    const posY = this.lockAtCenter ? 0 : this.trackedObject.shape.position.y;
    let closestx = 0;
    let closesty = 0;
    if (this.target.lobby.host.clientSettings.gamemode.kingOfTheHill.arrowToCrown && !this.target.hasCrown) {
      let closestCrown = [null, 0];
      for (let p of this.target.lobby.players) {
        if (!p.hasCrown) continue;
        let dist = Math2.dist(p.shape.position, this.target.shape.position);
        if (closestCrown[0] === null || dist < closestCrown[1]) closestCrown = [p, dist];
      }
      if (closestCrown[0] !== null && closestCrown[1] > this.circle) {
        closestx = (closestCrown[0].shape.position.x - this.target.shape.position.x) / this.vision;
        closesty = (closestCrown[0].shape.position.y - this.target.shape.position.y) / this.vision;
      }
    }
    
    let borderWidth = this.target.lobby.size.width + (this.target.lobby.size.width / this.target.lobby.mazePlan[0].length * this.target.lobby.wallThickness);
    let borderHeight = this.target.lobby.size.height + (this.target.lobby.size.height / this.target.lobby.mazePlan.length * this.target.lobby.wallThickness);
    return [
      /* 0  */ (-borderWidth/2 - posX - this.offset.x) / this.vision,
      /* 1  */ (borderWidth/2 - posX - this.offset.x) / this.vision,
      /* 2  */ (-borderHeight/2 - posY - this.offset.y) / this.vision,
      /* 3  */ (borderHeight/2 - posY - this.offset.y) / this.vision,
      /* 4  */ this.target.resetLerp,
      /* 5  */ closestx,
      /* 6  */ closesty
    ];
  }
}


class Powerup {
  constructor(powerupIndex, lobby) {
    this.powerupData = lobby.host.clientSettings.powerups[powerupIndex];
    this.precomputedRounds = this.powerupData.firing.precomputeRoundAttributes;
    this.precomputedShots = this.powerupData.firing.precomputeShotAttributes;
    
    this.remainingReload = 0;
    
    if (this.precomputedRounds) this.precomputeRoundAttributes();
    if (this.precomputedShots) this.precomputeRoundAttributes();
    
    this.remainingShots = this.getAttribute("shotsPerRound");
    this.remainingRounds = util.ISS(this.powerupData.firing.roundsPerWeapon) - 1;
    
    this.currentMultifirePowerup = this;
    this.timeRemaining = this.powerupData.firing.removeAfterEvent === 1 ? util.ISS(this.powerupData.firing.removeAfterTimer) * framerate : 0;
    this.waitingToFire = false;
    this.nameColor = 0;
    for (let i of this.powerupData.bubbleShape) if (i[1] >= 0) {
      this.nameColor = i[1];
      break;
    }
  }
  
  precomputeRoundAttributes() {
    this.shotsPerRound = util.ISS(this.powerupData.firing.shotsPerRound);
    this.roundReload = util.ISS(this.powerupData.firing.roundReloadTime);
  }
  
  precomputeShotAttributes() {
    this.shotReload = util.ISS(this.powerupData.firing.shotReloadTime);
    this.shotSpeed = util.ISS(this.powerupData.baseAttributes.speed);
    this.shotQuantity = util.ISS(this.powerupData.firing.quantity);
    this.shotFireDistance = util.ISS(this.powerupData.firing.firingDistanceFromCenter);
    this.shotHealth = util.ISS(this.powerupData.baseAttributes.health);
    this.shotResist = util.ISS(this.powerupData.baseAttributes.damageResist);
    this.directionAdditive = util.ISS(this.powerupData.firing.directionAdditive);
    this.shotFireLocation = util.ISS(this.powerupData.firing.fireLocation);
    this.shotRange = util.ISS(this.powerupData.baseAttributes.range);
    this.shotSize = util.ISS(this.powerupData.baseAttributes.size);
    this.shotOpacity = util.ISS(this.powerupData.baseAttributes.opacity);
    this.shotRecoil = util.ISS(this.powerupData.firing.totalRecoil);
    this.shotMass = util.ISS(this.powerupData.baseAttributes.mass);
  }
  
  getAttribute(a) {
    if (this.precomputedRounds) switch (a) {
      case "shotsPerRound": return this.shotsPerRound;
      case "roundReload": return this.roundReload;
      case "shotFireDistance": return this.shotFireDistance;
      case "shotRecoil": return this.shotRecoil;
    }
    if (this.precomputedShots) switch (a) {
      case "shotReload": return this.shotReload;
      case "shotQuantity": return this.shotQuantity;
      case "shotSpeed": return this.shotSpeed;
      case "shotHealth": return this.shotHealth;
      case "shotResist": return this.shotResist;
      case "shotDirectionAdditive": return this.directionAdditive;
      case "shotFireLocation": return this.directionAdditive;
      case "shotRange": return this.shotRange;
      case "shotSize": return this.shotSize;
      case "shotOpacity": return this.shotOpacity;
      case "shotMass": return this.shotMass;
    }
    
    switch(a) {
      case "shotsPerRound": return util.ISS(this.powerupData.firing.shotsPerRound);
      case "shotQuantity": return util.ISS(this.powerupData.firing.quantity);
      case "shotSpeed": return util.ISS(this.powerupData.baseAttributes.speed);
      case "shotFireDistance": return util.ISS(this.powerupData.firing.firingDistanceFromCenter);
      case "shotReload": return util.ISS(this.powerupData.firing.shotReloadTime);
      case "roundReload": return util.ISS(this.powerupData.firing.roundReloadTime);
      case "shotHealth": return util.ISS(this.powerupData.baseAttributes.health);
      case "shotResist": return util.ISS(this.powerupData.baseAttributes.damageResist);
      case "shotDirectionAdditive": return util.ISS(this.powerupData.firing.directionAdditive);
      case "shotFireLocation": return util.ISS(this.powerupData.firing.fireLocation);
      case "shotRange": return util.ISS(this.powerupData.baseAttributes.range);
      case "shotSize": return util.ISS(this.powerupData.baseAttributes.size);
      case "shotOpacity": return util.ISS(this.powerupData.baseAttributes.opacity);
      case "shotRecoil": return util.ISS(this.powerupData.firing.totalRecoil);
      case "shotMass": return util.ISS(this.powerupData.baseAttributes.mass);
    }
  }
  
  inheritToParent(parent, equipType, powerupReference, stack = 100) {
    const powerData = powerupReference.powerupData;
    if (parent.maxHeldPowerups < parent.powerups.length + 1 && !powerData.parentEffects.disableBullets) return;
    
    // Act like we picked up a powerup bubble with the inheriting powerup id
    if (!powerData.parentEffects.applyEffectsOnHit && (powerData.parentEffects.disableBullets || powerData.parentEffects.applyEffectsOnCollect)) {
      powerupReference.applyParentEffects(parent, stack);
      if (powerData.parentEffects.disableBullets) {
        return;
      }
    }
    // when inheriting we don't care about apply events since they have their own
    if (powerData.inheriting.onPickupPowerupId !== -1 && stack >= 0) {
      powerupReference.inheritToParent(parent, powerData.inheriting.equipType, parent.lobby.createPowerupFromId(powerData.inheriting.onPickupPowerupId), stack - 1);
    }
    
    switch(equipType) {
      case 0: {
        // equip new powerups over old ones
        parent.powerups.splice(0, 0, powerupReference);
        break;
      }
      case 1: {
        // equip only if we have a treat as default type powerup on
        if (parent.powerups[0].powerupData.spawning.treatAsDefault) parent.powerups.splice(0, 0, powerupReference);
        else parent.powerups.push(powerupReference);
        break;
      }
      case 2: {
        // put it in the backpack no matter what
        parent.powerups.push(powerupReference);
        break;
      }
    }
    // perform any instantaneous powerup bubble stuff
    if (powerupReference.powerupData.firing.fireOnPickup) {
      parent.attemptFire(powerupReference, true);
    }
    parent.refreshPowerups();
  }
  
  // apply the effects of the powerup on the parent tank, like shield and opacity changes
  applyParentEffects(parent, stack = 100) {
    let processType, usedLerp;
    if (this.powerupData.parentEffects.playerOpacity.enabled) {
      processType = this.powerupData.parentEffects.playerOpacity.processType;
      usedLerp = util.ISS(this.powerupData.parentEffects.playerOpacity.lerp) * framerate;
      parent.opacityEffects.push({
        fadeIn: (processType === 1 || processType === 3 ? usedLerp : 0),
        duration: util.ISS(this.powerupData.parentEffects.playerOpacity.duration) * framerate,
        fadeOut: (processType === 2 || processType === 3 ? usedLerp : 0),
        lerpTime: usedLerp,
        start: util.ISS(this.powerupData.parentEffects.playerOpacity.start)/100,
        end: util.ISS(this.powerupData.parentEffects.playerOpacity.end)/100
      });
    }
    if (this.powerupData.parentEffects.playerSpeed.enabled) {
      processType = this.powerupData.parentEffects.playerSpeed.processType;
      usedLerp = util.ISS(this.powerupData.parentEffects.playerSpeed.lerp) * framerate;
      parent.speedEffects.push({
        fadeIn: (processType === 1 || processType === 3 ? usedLerp : 0),
        duration: util.ISS(this.powerupData.parentEffects.playerSpeed.duration) * framerate,
        fadeOut: (processType === 2 || processType === 3 ? usedLerp : 0),
        lerpTime: usedLerp,
        start: util.ISS(this.powerupData.parentEffects.playerSpeed.start)/100,
        end: util.ISS(this.powerupData.parentEffects.playerSpeed.end)/100
      });
    }
    if (this.powerupData.parentEffects.playerVision.enabled) {
      processType = this.powerupData.parentEffects.playerVision.processType;
      usedLerp = util.ISS(this.powerupData.parentEffects.playerVision.lerp) * framerate;
      parent.visionEffects.push({
        fadeIn: (processType === 1 || processType === 3 ? usedLerp : 0),
        duration: util.ISS(this.powerupData.parentEffects.playerVision.duration) * framerate,
        fadeOut: (processType === 2 || processType === 3 ? usedLerp : 0),
        lerpTime: usedLerp,
        start: util.ISS(this.powerupData.parentEffects.playerVision.start)/100,
        end: util.ISS(this.powerupData.parentEffects.playerVision.end)/100
      });
    }
    if (this.powerupData.parentEffects.playerBubble.enabled) {
      processType = this.powerupData.parentEffects.playerBubble.processType;
      usedLerp = util.ISS(this.powerupData.parentEffects.playerBubble.lerp) * framerate;
      parent.bubbleEffects.push({
        fadeIn: (processType === 1 || processType === 3 ? usedLerp : 0),
        duration: util.ISS(this.powerupData.parentEffects.playerBubble.duration) * framerate,
        fadeOut: (processType === 2 || processType === 3 ? usedLerp : 0),
        lerpTime: usedLerp,
        start: util.ISS(this.powerupData.parentEffects.playerBubble.start)/100,
        end: util.ISS(this.powerupData.parentEffects.playerBubble.end)/100,
        pierce: this.powerupData.parentEffects.playerBubble.changedWallPierce,
        visibility: this.powerupData.parentEffects.playerBubble.changedVisibilityType
      });
    }
    if (this.powerupData.parentEffects.playerHealth.enabled) parent.health += util.ISS(this.powerupData.parentEffects.playerHealth.added);
    
    if (this.powerupData.parentEffects.playerShield.enabled) {
      let failedToApply = false;
      if (!this.powerupData.parentEffects.playerShield.stacks) for (let i = 0; i < parent.shields.length; i++) {
        if (parent.shields[i].stacks) continue;
        if (parent.shields[i].conditionPriority > this.powerupData.parentEffects.playerShield.conditionPriority) failedToApply = true;
        else {
          parent.shields[i].shieldObject.annihilate();
          parent.shields.splice(i, 1);
        }
        break;
      }
      
      if (!failedToApply) {
        let maxHealth = util.ISS(this.powerupData.parentEffects.playerShield.maxDefense);
        let usedHits = util.ISS(this.powerupData.parentEffects.playerShield.maxHits);
        let usedRadius = util.ISS(this.powerupData.parentEffects.playerShield.shieldRadius);
        parent.shields.push({
          deflectsAttacks: this.powerupData.parentEffects.playerShield.deflectsAttacks,
          hitsRemaining: usedHits === 0 ? Infinity : usedHits,
          maxHealth: maxHealth === 0 ? Infinity : maxHealth,
          healthRemaining: maxHealth === 0 ? Infinity : maxHealth,
          timeRemaining: util.ISS(this.powerupData.parentEffects.playerShield.maxDuration) * framerate,
          resistance: util.ISS(this.powerupData.parentEffects.playerShield.shieldResistance),
          conditionPriority: this.powerupData.parentEffects.playerShield.conditionPriority,
          stacks: this.powerupData.parentEffects.playerShield.stacks,
          damageOverflowsToPlayer: this.powerupData.parentEffects.playerShield.damageOverflowsToPlayer,
          shieldObject: new Shield(this, parent, {
            shape: Bodies.circle(parent.shape.position.x, parent.shape.position.y, parent.attachmentScaling * usedRadius / 100, {isStatic: true}),
            lobby: parent.lobby,
            team: parent.team
          })
        });
      }
    }
  }
}

let currentId = 0;
class Entity {
  constructor(p) {
    this.id = currentId;
    this.name = p.name ?? "Unnamed Entity";
    this.type = p.type ?? "unknown";
    this.team = p.team ?? 0;
    this.color = p.color ?? 2;
    if (this.color === -1) this.color = Math.floor(Math.random() * 55) + 1;
    this.borderColor = p.borderColor ?? 0;
    this.borderWidth = p.borderWidth ?? 30;
    this.opacity = p.opacity ?? 1;
    this.renderOrder = p.renderOrder ?? 0;
    this.shadowCaster = p.shadowCaster ?? false;
    this.noRender = p.noRender ?? false;
    this.lights = [];
    this.lightsOff = false;
    this.attachments = p.attachments ?? [];
    this.attachmentScaling = p.attachmentScaling ?? 150;
    this.deletingThisFrame = false;
    this.parent = p.parent ?? null;
    this.children = [];
    
    this.lobby = p.lobby;
    this.lobby.objects.push(this);
    
    this.shape = p.shape ?? Bodies.polygon(0, 0, 7, 500);
    this.velocityDampen = 0.1;
    this.dampenRate = Math.pow(this.velocityDampen, 1/framerate);
    this.maxSpeed = 10;
    this.acceleration = 0.1;
    if (!this.shape.isStatic) Body.setMass(this.shape, p.mass ?? 1);
    this.shape.friction = 0;
    this.shape.frictionAir = 0;
    this.shape.frictionStatic = 0;
    
    this.angularDampen = 0.1;
    this.maxAngularSpeed = Math.PI / 2;
    this.angularAcceleration = Math.PI / 2;
    this.torqueUnlock = 0;
    this.shape.restitution = 1;
    this.addedAngle = p.addedAngle ?? 0;
    this.angleLock = p.angleLock ?? false;
    this.restitution = p.restitution ?? 1;
    this.roughness = p.roughness ?? 0;
    
    this.health = p.health ?? 100;
    this.maxHealth = p.maxHealth ?? parseInt(this.health);
    this.showHealthBar = p.showHealthBar ?? false;
    this.damageResistance = p.damageResistance ?? 0;
    this.regeneration = {};
    this.ghost = false;
    this.hitsGhost = p.hitsGhost ?? false;
    this.respawnTimer = 0;
    this.shields = [];
    this.killer = null;
    this.killerTeam = null;
    
    this.poisonEffects = [];
    this.freezeEffects = [];
    
    this.shape.collisionFilter.me = this;
    this.collisionInfo = p.collisionInfo ?? [
      // [type, same team, different team]
      ["all", true, true],
    ]
    
    Composite.add(this.lobby.world, [
      this.shape,
    ]);
    
    currentId++;
  }
  
  /** 
  scales the entire shape, making sure all parts stay correct
  **/
  scale(type, amount1, amount2, scaleBorder = false) {
    switch (type) {
      case 0: {
        // addition
        const scaleFactor = (this.attachmentScaling + amount1) / this.attachmentScaling;
        const initialMass = parseFloat(this.shape.mass);
        if (scaleBorder) this.borderWidth *= scaleFactor;
        this.attachmentScaling += amount1;
        Body.scale(this.shape, scaleFactor, scaleFactor);
        Body.setMass(initialMass);
        break;
      }
      case 1: {
        // multiplication
        const initialMass = parseFloat(this.shape.mass);
        if (scaleBorder) this.borderWidth *= amount1;
        this.attachmentScaling *= amount1;
        Body.scale(this.shape, amount1, amount1);
        Body.setMass(initialMass);
        break;
      }
      case 2: {
        // clamp
        if (this.attachmentScaling > amount1 && this.attachmentScaling < amount2) return;
        const initialMass = parseFloat(this.shape.mass);
        const initialScaling = parseFloat(this.attachmentScaling);
        this.attachmentScaling = Math2.clamp(initialScaling, amount1, amount2);
        const scaleFactor = this.attachmentScaling / initialScaling;
        if (scaleBorder) this.borderWidth *= scaleFactor;
        Body.scale(this.shape, scaleFactor, scaleFactor);
        Body.setMass(initialMass);
        break;
      }
    }
    if (this.attachmentScaling <= 0) this.annihilate(0);
  }
  
  /** deals poison damage to the tank if the frame is right, and also increments the freeze timers for simplicty sake **/
  takePoisonDamage() {
    for (let i = this.poisonEffects.length - 1; i >= 0; i--) {
      const p = this.poisonEffects[i];
      p.timer--;
      if (p.timer <= 0) {
        p.timer = p.intervalTime;
        this.health -= (p.intervalRaw + p.intervalPercentage);
        if (this.health / this.maxHealth < p.minimumHealth/100) this.health = this.maxHealth * p.minimumHealth/100;
        if (p.showDamageFrames) {
          this.damagedThisFrame = true;
          this.regeneration.leftoverTimer = parseInt(this.regeneration.delay);
        }
        this.health = Math2.clamp(this.health, 0, this.maxHealth);
        p.damageIntervalsLeft--;
        if (p.damageIntervalsLeft <= 0) this.poisonEffects.splice(i, 1);
      }
    }
    
    for (let i = this.freezeEffects.length - 1; i >= 0; i--) {
      const f = this.freezeEffects[i];
      f.timer--;
      if (f.timer <= 0) this.freezeEffects.splice(i, 1);
    }
  }
  
  /** returns the multiplier on the objects speed depending on their freeze conditions **/
  getFreezeMultiplier() {
    let finalMult = 1;
    for (let i = this.freezeEffects.length - 1; i >= 0; i--) {
      const f = this.freezeEffects[i];
      finalMult *= Math2.lerp(f.freezeSpeedFinal, f.freezeSpeedInitial, f.timer / f.totalTime);
    }
    if (this.type === "tank") finalMult *= this.getBiggestEffect(1);
    return finalMult;
  }
  
  /**
  prepares the client to delete an object
  */
  annihilate(type = -1) {
    if (this.deletingThisFrame) return;
    const rules = this.lobby.host.clientSettings;
    if (this.type === "bullet") {
      const power = this.powerupRef.powerupData;
      if (this.treatAsDefault.enabled) this.treatAsDefault.power.remainingShots++;
      // if the type of death is correct, create a frag
      if ((power.particles.fragEvents.destruction && type === 0) || (power.particles.fragEvents.rangeDeath && type === 1) || (power.particles.fragEvents.selfDestruct && type === 2)) {
        let spawning = this.lobby.createPowerupFromId(power.particles.fragFireBulletId);
        if (spawning !== null) {
          this.fire({
            fromBullet: true,
          }, spawning);
        }
      }
      this.parent.bulletArray.splice(this.parent.bulletArray.indexOf(this), 1);
      if (this.parent.camera.trackedObject === this) this.parent.camera.trackedObject = this.parent;
      if (this.parent.controlledObjects.includes(this)) this.parent.controlledObjects.splice(this.parent.controlledObjects.indexOf(this), 1);
    }
    if (this.type === "bubble") this.lobby.powerupsLeftToSpawn++;
    this.deletingThisFrame = true;
  }
  /**
  removes all children, all connections to teams and the world, the physics mesh, then deletes the object itself
  */
  delete() {
    Composite.remove(this.lobby.world, [
      this.shape,
    ]);
    if (this.lobby.objects.indexOf(this) !== -1) this.lobby.objects.splice(this.lobby.objects.indexOf(this), 1);
    if (this.lobby.players.indexOf(this) !== -1) this.lobby.players.splice(this.lobby.players.indexOf(this), 1);
  }
  /**
  tell the entity to shoot a bullet
  */
  fire(p, powerup) {
    if (this.deletingThisFrame) return;
    
    // cast a ray to the nearest wall, or up until the distance the bullet is fired from the object, and set that as our spawn point
    let bodies = [];
    for (let i = 0; i < this.lobby.objects.length; i++) {
      if (this.lobby.objects[i].type === "wall" || this.lobby.objects[i].type === "box") bodies.push(this.lobby.objects[i].shape);
    }
    
    const FFT = powerup.powerupData.baseAttributes.friendlyFireType;
    const interaction = powerup.powerupData.interactions;
    const hitsParent = interaction.tankInteractions === 0 && !(FFT === 1 || FFT === 2 || FFT === 5);
    const hitsTanksSame = interaction.tankInteractions === 0 && !(FFT === 2 || FFT === 3 || FFT === 5);
    const hitsTanksOther = interaction.tankInteractions === 0 && !(FFT === 4 || FFT === 5);
    const hitsWalls = interaction.wallInteractions === 0;
    const hitsBorders = interaction.borderBehavior !== 1;
    
    // if we intersect at the point found, keep decreasing our raycast distance until we no longer hit an object, and spawn our bullet there
    let chosenLocation = powerup.getAttribute("shotFireLocation") * Math.PI/180;
    let distanceMult = powerup.getAttribute("shotFireDistance")/100 * this.attachmentScaling * 2;
    for (let i = 0; i < 99; i++) {
      // if our bullet goes through wall, we don't care about any of this so just leave
      if (!hitsWalls) break;
      if (Query.ray(bodies, this.shape.position, {
        x: Math.cos((this.angleLock ? 0 : this.shape.angle) + this.addedAngle + chosenLocation) * distanceMult + this.shape.position.x,
        y: Math.sin((this.angleLock ? 0 : this.shape.angle) + this.addedAngle + chosenLocation) * distanceMult + this.shape.position.y
      }).length > 0) {
        distanceMult *= 0.9;
        continue;
      }
      break;
    }
    
    let quantity = p.quantity ?? util.ISS(powerup.powerupData.firing.quantity);
    let shotID = Math.random();
    
    // for every bullet being shot, set their stats correctly
    for (let i = 0; i < quantity; i++) {
      let baseSize = (p.fromBullet ? this.parent.attachmentScaling : this.attachmentScaling);
      let shotSize = baseSize * powerup.getAttribute("shotSize")/100;
      let shotOpacity = powerup.getAttribute("shotOpacity")/100;
      let constantVelocity;
      if (!powerup.powerupData.baseAttributes.overrideBase) constantVelocity = (p.fromBullet ? this.parent.maxSpeed : this.maxSpeed) * powerup.getAttribute("shotSpeed")/100;
      else constantVelocity = powerup.getAttribute("shotSpeed") / 10;
      if (powerup.powerupData.baseAttributes.copyTankOpacity) shotOpacity *= this.opacity * (this.type === "tank" ? this.getBiggestEffect(0) : 1);
      const poisonDuration = util.ISS(powerup.powerupData.interactions.poison.poisonDuration) * framerate;
      const poisonDamageIntervals = Math2.clamp(util.ISS(powerup.powerupData.interactions.poison.poisonDamageIntervals), 1, poisonDuration + 1);
      const freezeDuration = util.ISS(powerup.powerupData.interactions.freeze.transitionTime) * framerate;
      const accelBase = (p.fromBullet ? this.parent.maxSpeed : this.maxSpeed);
      
      let b = new Bullet({
        name: "Fired Bullet",
        lobby: this.lobby,
        parent: p.fromBullet ? this.parent : this,
        treatAsDefault: p.treatDefault ?? {enabled: i === 0 ? powerup.powerupData.spawning.treatAsDefault : false, power: powerup},
        shape: Bodies.circle(this.shape.position.x, this.shape.position.y, shotSize),
        attachmentScaling: shotSize,
        color: this.color,
        borderColor: 0,
        borderWidth: p.fromBullet ? this.borderWidth : this.borderWidth / 3,
        renderOrder: 600 + Math.floor(Math.random() * 100), // walls render orders from 600 to 699, inclusive
        shadowCaster: powerup.powerupData.baseAttributes.castShadow,
        collisionInfo: [
          ["wall", hitsWalls, hitsWalls],
          ["box", hitsWalls, hitsWalls],
          ["border", hitsBorders, hitsBorders],
          ["tank", hitsTanksSame, hitsTanksOther],
          ["bullet", true, true],
          ["all", true, true],
        ],
        ignoreParent: !hitsParent,
        constantVelocity: constantVelocity,
        team: this.team,
        health: powerup.getAttribute("shotHealth"),
        damageResistance: powerup.getAttribute("shotResist"),
        attachments: powerup.powerupData.appearance,
        range: powerup.getAttribute("shotRange") * framerate,
        safeFade: powerup.powerupData.misc.safeFade/100,
        opacity: shotOpacity,
        showHealthBar: powerup.powerupData.misc.showHealthBar,
        restitution: util.ISS(powerup.powerupData.baseAttributes.restitution) / 100,
        roughness: util.ISS(powerup.powerupData.baseAttributes.roughness) * Math.PI / 180,
        treatAsLandmine: powerup.powerupData.interactions.isLandmine,
        drawTrail: powerup.powerupData.misc.createTrails,
        forceMotionRotationSpeed: util.ISS(powerup.powerupData.misc.rotationSpeed) * Math.PI / 180,
        powerupRef: powerup,
        particleRelease: {
          enabled: powerup.powerupData.particles.passiveRelease.enabled || powerup.powerupData.particles.enableBounceRelease,
          delayed: true,
          timer: framerate * util.ISS(powerup.powerupData.particles.passiveRelease.delay),
          duration: framerate * util.ISS(powerup.powerupData.particles.passiveRelease.duration),
          lockedTimer: util.ISS(powerup.powerupData.particles.passiveRelease.timer),
          passiveRelease: powerup.powerupData.particles.passiveRelease.enabled,
          bounceRelease: powerup.powerupData.particles.enableBounceRelease,
          maxReleasedBullets: util.ISS(powerup.powerupData.particles.maxReleasedBullets)
        },
        rotationSpeed: util.ISS(powerup.powerupData.baseAttributes.angularSpeed) * Math.PI / 180,
        angleLock: powerup.powerupData.baseAttributes.lockBulletAngle,
        rotationAdjustments: {
          enabled: powerup.powerupData.adjustments.rotation.enabled,
          delay: util.ISS(powerup.powerupData.adjustments.rotation.effectDelay) * framerate,
          duration: util.ISS(powerup.powerupData.adjustments.rotation.duration) * framerate,
          second: util.ISS(powerup.powerupData.adjustments.rotation.changePer.second) * Math.PI / 180,
          bounce: util.ISS(powerup.powerupData.adjustments.rotation.changePer.bounce) * Math.PI / 180,
          collision: util.ISS(powerup.powerupData.adjustments.rotation.changePer.collision) * Math.PI / 180,
          unlockedTimer: powerup.powerupData.adjustments.rotation.lockPerBullet ? 0 : framerate,
          applyToAngular: powerup.powerupData.adjustments.rotation.applyToAngular
        },
        accelerationAdjustments: {
          enabled: powerup.powerupData.adjustments.acceleration.enabled,
          delay: util.ISS(powerup.powerupData.adjustments.acceleration.effectDelay) * framerate,
          duration: util.ISS(powerup.powerupData.adjustments.acceleration.duration) * framerate,
          secondAdd: util.ISS(powerup.powerupData.adjustments.acceleration.changePer.secondAdd)/100 * accelBase,
          bounceAdd: util.ISS(powerup.powerupData.adjustments.acceleration.changePer.bounceAdd)/100 * accelBase,
          collisionAdd: util.ISS(powerup.powerupData.adjustments.acceleration.changePer.collisionAdd)/100 * accelBase,
          secondMult: util.ISS(powerup.powerupData.adjustments.acceleration.changePer.secondMult),
          bounceMult: util.ISS(powerup.powerupData.adjustments.acceleration.changePer.bounceMult),
          collisionMult: util.ISS(powerup.powerupData.adjustments.acceleration.changePer.collisionMult),
          unlockedTimer: powerup.powerupData.adjustments.acceleration.lockPerBullet ? 0 : framerate,
          minSpeed: util.ISS(powerup.powerupData.adjustments.acceleration.minSpeed)/100 * accelBase,
          maxSpeed: util.ISS(powerup.powerupData.adjustments.acceleration.maxSpeed)/100 * accelBase,
        },
        sizeAdjustments: {
          enabled: powerup.powerupData.adjustments.sizeChange.enabled,
          delay: util.ISS(powerup.powerupData.adjustments.sizeChange.effectDelay) * framerate,
          duration: util.ISS(powerup.powerupData.adjustments.sizeChange.duration) * framerate,
          secondAdd: util.ISS(powerup.powerupData.adjustments.sizeChange.changePer.secondAdd)/100 * baseSize,
          bounceAdd: util.ISS(powerup.powerupData.adjustments.sizeChange.changePer.bounceAdd)/100 * baseSize,
          collisionAdd: util.ISS(powerup.powerupData.adjustments.sizeChange.changePer.collisionAdd)/100 * baseSize,
          secondMult: util.ISS(powerup.powerupData.adjustments.sizeChange.changePer.secondMult),
          bounceMult: util.ISS(powerup.powerupData.adjustments.sizeChange.changePer.bounceMult),
          collisionMult: util.ISS(powerup.powerupData.adjustments.sizeChange.changePer.collisionMult),
          unlockedTimer: powerup.powerupData.adjustments.sizeChange.lockPerBullet ? 0 : framerate,
          base: baseSize,
          minSize: util.ISS(powerup.powerupData.adjustments.sizeChange.minSize)/100 * baseSize,
          maxSize: util.ISS(powerup.powerupData.adjustments.sizeChange.maxSize)/100 * baseSize,
        },
        rangeAdjustments: {
          enabled: powerup.powerupData.adjustments.rangeCut.enabled,
          delay: util.ISS(powerup.powerupData.adjustments.rangeCut.effectDelay) * framerate,
          duration: util.ISS(powerup.powerupData.adjustments.rangeCut.duration) * framerate,
          secondAdd: util.ISS(powerup.powerupData.adjustments.rangeCut.changePer.secondAdd),
          bounceAdd: util.ISS(powerup.powerupData.adjustments.rangeCut.changePer.bounceAdd),
          collisionAdd: util.ISS(powerup.powerupData.adjustments.rangeCut.changePer.collisionAdd),
          secondMult: util.ISS(powerup.powerupData.adjustments.rangeCut.changePer.secondMult),
          bounceMult: util.ISS(powerup.powerupData.adjustments.rangeCut.changePer.bounceMult),
          collisionMult: util.ISS(powerup.powerupData.adjustments.rangeCut.changePer.collisionMult),
          unlockedTimer: powerup.powerupData.adjustments.rangeCut.lockPerBullet ? 0 : framerate,
          maxRange: util.ISS(powerup.powerupData.adjustments.rangeCut.maxRange) * framerate,
        },
        opacityAdjustments: {
          enabled: powerup.powerupData.adjustments.opacityChange.enabled,
          delay: util.ISS(powerup.powerupData.adjustments.opacityChange.effectDelay) * framerate,
          duration: util.ISS(powerup.powerupData.adjustments.opacityChange.duration) * framerate,
          secondAdd: util.ISS(powerup.powerupData.adjustments.opacityChange.changePer.secondAdd)/100,
          bounceAdd: util.ISS(powerup.powerupData.adjustments.opacityChange.changePer.bounceAdd)/100,
          collisionAdd: util.ISS(powerup.powerupData.adjustments.opacityChange.changePer.collisionAdd)/100,
          secondMult: util.ISS(powerup.powerupData.adjustments.opacityChange.changePer.secondMult),
          bounceMult: util.ISS(powerup.powerupData.adjustments.opacityChange.changePer.bounceMult),
          collisionMult: util.ISS(powerup.powerupData.adjustments.opacityChange.changePer.collisionMult),
          unlockedTimer: powerup.powerupData.adjustments.opacityChange.lockPerBullet ? 0 : framerate,
          base: shotOpacity,
          minOpacity: util.ISS(powerup.powerupData.adjustments.opacityChange.minVisibility)/100,
          maxOpacity: util.ISS(powerup.powerupData.adjustments.opacityChange.maxVisibility)/100,
        },
        healthAdjustments: {
          enabled: powerup.powerupData.health.healthChange.enabled,
          initialEnabled: powerup.powerupData.health.healthChange.enabled,
          delay: util.ISS(powerup.powerupData.health.healthChange.effectDelay) * framerate,
          duration: util.ISS(powerup.powerupData.health.healthChange.duration) * framerate,
          secondAdd: util.ISS(powerup.powerupData.health.healthChange.changePer.secondAdd),
          bounceAdd: util.ISS(powerup.powerupData.health.healthChange.changePer.bounceAdd),
          collisionAdd: util.ISS(powerup.powerupData.health.healthChange.changePer.collisionAdd),
          secondMult: util.ISS(powerup.powerupData.health.healthChange.changePer.secondMult),
          bounceMult: util.ISS(powerup.powerupData.health.healthChange.changePer.bounceMult),
          collisionMult: util.ISS(powerup.powerupData.health.healthChange.changePer.collisionMult),
          unlockedTimer: powerup.powerupData.health.healthChange.lockPerBullet ? 0 : framerate,
          maxHealth: util.ISS(powerup.powerupData.health.healthChange.maxHealth),
        },
        resistAdjustments: {
          enabled: powerup.powerupData.health.damageResistChange.enabled,
          initialEnabled: powerup.powerupData.health.damageResistChange.enabled,
          delay: util.ISS(powerup.powerupData.health.damageResistChange.effectDelay) * framerate,
          duration: util.ISS(powerup.powerupData.health.damageResistChange.duration) * framerate,
          secondAdd: util.ISS(powerup.powerupData.health.damageResistChange.changePer.secondAdd),
          bounceAdd: util.ISS(powerup.powerupData.health.damageResistChange.changePer.bounceAdd),
          collisionAdd: util.ISS(powerup.powerupData.health.damageResistChange.changePer.collisionAdd),
          secondMult: util.ISS(powerup.powerupData.health.damageResistChange.changePer.secondMult),
          bounceMult: util.ISS(powerup.powerupData.health.damageResistChange.changePer.bounceMult),
          collisionMult: util.ISS(powerup.powerupData.health.damageResistChange.changePer.collisionMult),
          unlockedTimer: powerup.powerupData.health.damageResistChange.lockPerBullet ? 0 : framerate,
          minResist: util.ISS(powerup.powerupData.health.damageResistChange.minResist),
          maxResist: util.ISS(powerup.powerupData.health.damageResistChange.maxResist),
        },
        bubbleSizeAdjustments: {
          enabled: powerup.powerupData.light.bubbleSizeChange.enabled && powerup.powerupData.light.createLightBubble,
          initialEnabled: powerup.powerupData.light.bubbleSizeChange.enabled,
          delay: util.ISS(powerup.powerupData.light.bubbleSizeChange.effectDelay) * framerate,
          duration: util.ISS(powerup.powerupData.light.bubbleSizeChange.duration) * framerate,
          secondAdd: util.ISS(powerup.powerupData.light.bubbleSizeChange.changePer.secondAdd),
          bounceAdd: util.ISS(powerup.powerupData.light.bubbleSizeChange.changePer.bounceAdd),
          collisionAdd: util.ISS(powerup.powerupData.light.bubbleSizeChange.changePer.collisionAdd),
          secondMult: util.ISS(powerup.powerupData.light.bubbleSizeChange.changePer.secondMult),
          bounceMult: util.ISS(powerup.powerupData.light.bubbleSizeChange.changePer.bounceMult),
          collisionMult: util.ISS(powerup.powerupData.light.bubbleSizeChange.changePer.collisionMult),
          unlockedTimer: powerup.powerupData.light.bubbleSizeChange.lockPerBullet ? 0 : framerate,
          minSize: util.ISS(powerup.powerupData.light.bubbleSizeChange.minSize) * 4.5/16,
          maxSize: util.ISS(powerup.powerupData.light.bubbleSizeChange.maxSize) * 4.5/16,
        },
        bubbleOpacityAdjustments: {
          enabled: powerup.powerupData.light.bubbleOpacityChange.enabled && powerup.powerupData.light.createLightBubble,
          initialEnabled: powerup.powerupData.light.bubbleOpacityChange.enabled,
          delay: util.ISS(powerup.powerupData.light.bubbleOpacityChange.effectDelay) * framerate,
          duration: util.ISS(powerup.powerupData.light.bubbleOpacityChange.duration) * framerate,
          secondAdd: util.ISS(powerup.powerupData.light.bubbleOpacityChange.changePer.secondAdd)/100,
          bounceAdd: util.ISS(powerup.powerupData.light.bubbleOpacityChange.changePer.bounceAdd)/100,
          collisionAdd: util.ISS(powerup.powerupData.light.bubbleOpacityChange.changePer.collisionAdd)/100,
          secondMult: util.ISS(powerup.powerupData.light.bubbleOpacityChange.changePer.secondMult),
          bounceMult: util.ISS(powerup.powerupData.light.bubbleOpacityChange.changePer.bounceMult),
          collisionMult: util.ISS(powerup.powerupData.light.bubbleOpacityChange.changePer.collisionMult),
          unlockedTimer: powerup.powerupData.light.bubbleOpacityChange.lockPerBullet ? 0 : framerate,
          minOpacity: util.ISS(powerup.powerupData.light.bubbleOpacityChange.minOpacity)/100,
          maxOpacity: util.ISS(powerup.powerupData.light.bubbleOpacityChange.maxOpacity)/100,
        },
        hitsRemaining: {
          walls: powerup.powerupData.interactions.destroyOnHitting.walls ? util.ISS(powerup.powerupData.interactions.destroyOnHitting.maxWallCollisions) : -1,
          tanks: powerup.powerupData.interactions.destroyOnHitting.tanks ? util.ISS(powerup.powerupData.interactions.destroyOnHitting.maxTankCollisions) : -1,
          bullets: powerup.powerupData.interactions.destroyOnHitting.bullets ? util.ISS(powerup.powerupData.interactions.destroyOnHitting.maxBulletCollisions) : -1,
        },
        poison: {
          poisonsTanks: powerup.powerupData.interactions.poison.poisonsTanks,
          poisonsBullets: powerup.powerupData.interactions.poison.poisonsBullets,
          damageIntervalsLeft: poisonDamageIntervals,
          intervalTime: poisonDuration / poisonDamageIntervals,
          timer: poisonDuration / poisonDamageIntervals,
          intervalRaw: util.ISS(powerup.powerupData.interactions.poison.totalRawDamage) / poisonDamageIntervals,
          intervalPercentage: util.ISS(powerup.powerupData.interactions.poison.totalPercentageDamage) / 100 / poisonDamageIntervals,
          minimumHealth: powerup.powerupData.interactions.poison.allowPoisonKill ? powerup.powerupData.interactions.poison.minPoisonHealth : 0,
          stacks: powerup.powerupData.interactions.poison.stacks,
          priority: powerup.powerupData.interactions.poison.conditionPriority,
          borderOverride: powerup.powerupData.interactions.poison.overrideBorderColor,
          overrideColor: powerup.powerupData.interactions.poison.borderColor,
          showDamageFrames: powerup.powerupData.interactions.poison.showDamageFrames,
        },
        freeze: {
          freezesTanks: powerup.powerupData.interactions.freeze.freezesTanks,
          freezesBullets: powerup.powerupData.interactions.freeze.freezesBullets,
          freezeSpeedInitial: util.ISS(powerup.powerupData.interactions.freeze.initialFreezeSpeedMultiplier)/100,
          freezeSpeedFinal: util.ISS(powerup.powerupData.interactions.freeze.finalFreezeSpeedMultiplier)/100,
          timer: freezeDuration,
          totalTime: freezeDuration,
          stacks: powerup.powerupData.interactions.freeze.stacks,
          priority: powerup.powerupData.interactions.freeze.conditionPriority,
          borderOverride: powerup.powerupData.interactions.freeze.overrideBorderColor,
          overrideColor: powerup.powerupData.interactions.freeze.borderColor,
        },
        targeting: {
          enabled: powerup.powerupData.adjustments.targeting.enabled,
          interval: util.ISS(powerup.powerupData.adjustments.targeting.adjustmentInterval) * framerate,
          remainingInterval: 0,
          lerp: util.ISS(powerup.powerupData.adjustments.targeting.adjustmentLerp) / 100,
          inaccuracy: util.ISS(powerup.powerupData.adjustments.targeting.adjustmentInaccuracy) * Math.PI/180,
          delay: util.ISS(powerup.powerupData.adjustments.targeting.effectDelay) * framerate,
          duration: util.ISS(powerup.powerupData.adjustments.targeting.duration) * framerate,
          targetsSame: powerup.powerupData.adjustments.targeting.allowTargetingSame,
          targetsTeam: powerup.powerupData.adjustments.targeting.allowTargetingTeam,
          targetBullets: powerup.powerupData.adjustments.targeting.targetBullets,
          type: powerup.powerupData.adjustments.targeting.processType,
          unlocked: powerup.powerupData.adjustments.targeting.lockPerBullet
        },
        shotID: shotID,
      });
      
      if (p.fromBullet) this.parent.bulletArray.push(b);
      else this.bulletArray.push(b);
      
      if (b.health <= 0) b.health = Infinity;
      
      Body.setMass(b.shape, powerup.getAttribute("shotMass"));
      let directionOffset = powerup.getAttribute("shotDirectionAdditive") * Math.PI/180;
      let usedDirection = (this.angleLock ? 0 : this.shape.angle) + this.addedAngle + (powerup.powerupData.firing.addLocationToDirection ? chosenLocation : 0) + directionOffset;
      Body.setVelocity(b.shape, {
        x: Math.cos(usedDirection) * b.constantVelocity,
        y: Math.sin(usedDirection) * b.constantVelocity,
      });
      Body.setPosition(b.shape, {
        x: Math.cos((this.angleLock ? 0 : this.shape.angle) + this.addedAngle + chosenLocation) * distanceMult + b.shape.position.x,
        y: Math.sin((this.angleLock ? 0 : this.shape.angle) + this.addedAngle + chosenLocation) * distanceMult + b.shape.position.y
      });
      Body.setAngle(b.shape, usedDirection);
      
      if (powerup.powerupData.light.createLightBubble) {
        let visT = powerup.powerupData.light.visibilityType;
        let bulletLight = new Camera(
          b, 1, {
            visibilityTeam: visT === 0 || visT === 2,
            visibilityParent: visT === 0 || visT === 2 || visT === 3,
            visibilityEnemy: visT === 0 || visT === 1,
            circle: util.ISS(powerup.powerupData.light.bubbleSize) * 4.5/16,
            opacity: util.ISS(powerup.powerupData.light.bubbleOpacity) / 100,
            ignoreWalls: powerup.powerupData.light.pierceWalls,
            startAngle: util.ISS(powerup.powerupData.light.beamDegree.startAngle),
            endAngle: util.ISS(powerup.powerupData.light.beamDegree.endAngle),
            obfuscator: powerup.powerupData.light.useAsConcealer,
            colorTint: powerup.powerupData.light.concealerColor,
            renderOverShadows: powerup.powerupData.light.renderOverShadows,
            friendlyOpacity: powerup.powerupData.light.friendlyOpacity/100,
          }
        );
        b.lights.push(bulletLight);
      }
      
      if (powerup.powerupData.misc.createTrails) {
        b.trailPoints.push(b.shape.position.x, b.shape.position.y, powerup.powerupData.misc.trailLength * framerate);
        b.trailTimer = powerup.powerupData.misc.trailInterval * framerate;
      }
      
      if (powerup.powerupData.misc.attachPlayerCamera) {
        if (this.type === "tank") this.camera.trackedObject = b;
        else this.parent.camera.trackedObject = b;
      }
      
      if (powerup.powerupData.misc.stealPlayerControls) {
        if (this.type === "tank") {
          if (!powerup.powerupData.misc.allowMultiControl) this.controlledObjects = [];
          this.controlledObjects.push(b);
        }
        else {
          if (!powerup.powerupData.misc.allowMultiControl) this.parent.controlledObjects = [];
          this.parent.controlledObjects.push(b);
        }
      }
    }
    
    // inflict recoil on the firing object
    let recoilAmount = powerup.getAttribute("shotRecoil")/100;
    Body.applyForce(this.shape, this.shape.position, {
      x: Math.cos((this.angleLock ? 0 : this.shape.angle) + this.addedAngle + chosenLocation) * -recoilAmount,
      y: Math.sin((this.angleLock ? 0 : this.shape.angle) + this.addedAngle + chosenLocation) * -recoilAmount
    });
  }
}

class Wall extends Entity {
  constructor(p) {
    super(p);
    this.name = p.name ?? "Unnamed Wall";
    this.type = p.mass === 0 ? "wall" : "box";
    this.team = -1;
    this.velocityDampen = 0.9;
    this.dampenRate = Math.pow(this.velocityDampen, 1/framerate);
    this.tankDamage = p.tankDamage ?? 0;
    this.bounceDamage = p.bounceDamage ?? 0;
    this.hasHitbox = p.hasHitbox ?? true;
    this.removeOnCollide = p.removeOnCollide ?? false;
    this.opacity = p.initialOpacity ?? 1;
    this.initialOpacity = p.initialOpacity ?? 1;
    this.opacityOnCollide = p.opacityOnCollide ?? 1;
    this.opacityFadeTime = p.opacityFadeTime ?? 0;
    this.fadingTimer = 0;
    this.ignoreIds = p.ignoreIds ?? 0;
    this.dieToIds = p.dieToIds ?? 0;
    this.killWithIds = p.killWithIds ?? 0;
  }
}

class Box extends Entity {
  constructor(p) {
    super(p);
    this.name = p.name ?? "Unnamed Box";
    this.type = "box";
    this.team = -1;
  }
}

class Shield extends Entity {
  constructor(parent, tank, p) {
    super(p);
    this.parent = parent;
    this.tank = tank;
    this.deflectsAttacks = parent.powerupData.parentEffects.playerShield.deflectsAttacks;
    this.color = parent.powerupData.parentEffects.playerShield.shieldColor;
    this.opacity = parent.powerupData.parentEffects.playerShield.shieldOpacity / 100;
    this.radius = util.ISS(parent.powerupData.parentEffects.playerShield.shieldRadius);
    this.renderOrder = 200 + Math.floor(Math.random() * 100), // shields render orders from 200 to 299, inclusive
    this.borderWidth = 0;
    
    this.name = "Shield";
    this.type = "shield";
    this.collisionInfo = p.collisionInfo ?? [
      // [type, same team, different team]
      ["bullet", this.deflectsAttacks, this.deflectsAttacks],
      ["all", false, false],
    ];
  }
}

class Bullet extends Entity {
  constructor(p) {
    super(p);
    this.name = p.name ?? "Unnamed Bullet";
    this.type = "bullet";
    this.team = p.team ?? 0;
    this.shotID = p.shotID ?? -1;
    
    this.range = p.range ?? 0;
    if (this.range <= 0) this.range = Infinity;
    this.constantVelocity = p.constantVelocity ?? 5;
    this.safeFade = p.safeFade ?? 100;
    this.ignoreParent = p.ignoreParent ?? false;
    this.powerupRef = p.powerupRef ?? null;
    this.particleRelease = p.particleRelease ?? {enabled: false};
    this.rotationSpeed = p.rotationSpeed ?? 0;
    this.forceMotionRotationSpeed = p.forceMotionRotationSpeed ?? 0;
    this.lastAngle = 0;
    
    this.rotationAdjustments = p.rotationAdjustments ?? {};
    this.accelerationAdjustments = p.accelerationAdjustments ?? {};
    this.sizeAdjustments = p.sizeAdjustments ?? {};
    this.rangeAdjustments = p.rangeAdjustments ?? {};
    this.opacityAdjustments = p.opacityAdjustments ?? {};
    this.healthAdjustments = p.healthAdjustments ?? {};
    this.resistAdjustments = p.resistAdjustments ?? {};
    this.bubbleSizeAdjustments = p.bubbleSizeAdjustments ?? {};
    this.bubbleOpacityAdjustments = p.bubbleOpacityAdjustments ?? {};
    this.targeting = p.targeting ?? {};
    this.hitsRemaining = p.hitsRemaining ?? {};
    this.tanksCollidedWith = [];
    this.poison = p.poison ?? {};
    this.freeze = p.freeze ?? {};
    this.armed = false;
    this.treatAsLandmine = p.treatAsLandmine ?? false;
    this.drawTrail = p.drawTrail ?? false;
    this.trailTimer = 0;
    this.trailPoints = [];
    this.constantCollisions = [];
    
    this.treatAsDefault = p.treatAsDefault ?? {enabled: false};
  }
  
  resetAdjustment(adj, category, addMult) {
    adj.unlockedTimer = framerate;
    adj.secondAdd = util.ISS(category.secondAdd) * addMult;
    adj.bounceAdd = util.ISS(category.bounceAdd) * addMult;
    adj.collisionAdd = util.ISS(category.collisionAdd) * addMult;
    adj.secondMult = util.ISS(category.secondMult);
    adj.bounceMult = util.ISS(category.bounceMult);
    adj.collisionMult = util.ISS(category.collisionMult);
  }
  
  runCollision(e) {
    const ref = this.powerupRef.powerupData;
    
    // collision rotation
    if (this.rotationAdjustments.enabled && this.rotationAdjustments.delay <= 0) {
      const totalChange = this.rotationAdjustments.collision;
      if (this.rotationAdjustments.applyToAngular) {
        this.rotationSpeed += totalChange/framerate;
      } else {
        Body.setVelocity(this.shape, {
          x: Math.cos(this.shape.angle + totalChange) * this.shape.speed,
          y: Math.sin(this.shape.angle + totalChange) * this.shape.speed,
        });
        Body.setAngle(this.shape, this.shape.angle + totalChange);
      }
    }
    // collision acceleration
    if (this.accelerationAdjustments.enabled && this.accelerationAdjustments.delay <= 0) {
      this.constantVelocity += this.accelerationAdjustments.collisionAdd;
      this.constantVelocity *= this.accelerationAdjustments.collisionMult;
      this.constantVelocity = Math2.clamp(this.constantVelocity, this.accelerationAdjustments.minSpeed, this.accelerationAdjustments.maxSpeed);
      if (!this.powerupRef.powerupData.interactions.physicallyCollideWithTanks) Body.setSpeed(this.shape, this.constantVelocity);
    }
    // collision size change
    if (this.sizeAdjustments.enabled && this.sizeAdjustments.delay <= 0) {
      this.scale(0, this.sizeAdjustments.collisionAdd);
      this.scale(1, this.sizeAdjustments.collisionMult);
      this.scale(2, this.sizeAdjustments.minSize, this.sizeAdjustments.maxSize);
    }
    // collision range change
    if (this.rangeAdjustments.enabled && this.rangeAdjustments.delay <= 0) {
      this.range += this.rangeAdjustments.collisionAdd * framerate;
      this.range *= this.rangeAdjustments.collisionMult;
      this.range = Math2.clamp(this.range, 0, this.rangeAdjustments.maxRange);
      if (this.range <= 0) this.annihilate(1);
    }
    // collision opacity change
    if (this.opacityAdjustments.enabled && this.opacityAdjustments.delay <= 0) {
      this.opacity += this.opacityAdjustments.collisionAdd;
      this.opacity *= this.opacityAdjustments.collisionMult;
      this.opacity = Math2.clamp(this.opacity, this.opacityAdjustments.minOpacity, this.opacityAdjustments.maxOpacity);
    }
    // collision health change
    if (this.healthAdjustments.enabled && this.healthAdjustments.delay <= 0) {
      const placeholderHealth = parseFloat(this.health);
      this.health += this.healthAdjustments.collisionAdd;
      this.health *= this.healthAdjustments.collisionMult;
      this.health = Math2.clamp(this.health, 0, this.healthAdjustments.maxHealth);
      if (this.health <= 0) this.annihilate(0);
      if (this.health < placeholderHealth) this.damagedThisFrame = true;
    }
    // collision health change
    if (this.resistAdjustments.enabled && this.resistAdjustments.delay <= 0) {
      this.damageResistance += this.resistAdjustments.collisionAdd;
      this.damageResistance *= this.resistAdjustments.collisionMult;
      this.damageResistance = Math2.clamp(this.damageResistance, this.resistAdjustments.minResist, this.resistAdjustments.maxResist);
    }
    // collision bubble size change
    if (this.bubbleSizeAdjustments.enabled && this.bubbleSizeAdjustments.delay <= 0) {
      this.lights[0].circle += this.bubbleSizeAdjustments.collisionAdd * 4.5/16;
      this.lights[0].circle *= this.bubbleSizeAdjustments.collisionMult;
      this.lights[0].circle = Math2.clamp(this.lights[0].circle, this.bubbleSizeAdjustments.minSize, this.bubbleSizeAdjustments.maxSize);
    }
    // collision bubble opacity change
    if (this.bubbleOpacityAdjustments.enabled && this.bubbleOpacityAdjustments.delay <= 0) {
      this.lights[0].opacity += this.bubbleOpacityAdjustments.collisionAdd;
      this.lights[0].opacity *= this.bubbleOpacityAdjustments.collisionMult;
      this.lights[0].opacity = Math2.clamp(this.lights[0].opacity, this.bubbleOpacityAdjustments.minOpacity, this.bubbleOpacityAdjustments.maxOpacity);
    }
    
    // increment the bullets max tank hits
    if (e.type === "tank" && this.hitsRemaining.tanks >= 0) {
      this.hitsRemaining.tanks--;
      if (this.hitsRemaining.tanks < 0) this.annihilate(0);
    }
    
    // if we have poison effects, give it to the person or bullet
    if ((e.type === "tank" && this.poison.poisonsTanks) || (e.type === "bullet" && this.poison.poisonsBullets)) {
      let apply = true;
      for (let i = 0; i < e.poisonEffects.length; i++) {
        if (e.poisonEffects[i].stacks) continue;
        if (e.poisonEffects[i].priority > this.poison.priority) apply = false;
        else e.poisonEffects.splice(i, 1);
      }
      if (apply) {
        e.poisonEffects.push(clone(this.poison, false));
        e.poisonEffects[e.poisonEffects.length - 1].intervalPercentage *= e.maxHealth;
      }
    }
    // same with freeze effects
    if ((e.type === "tank" && this.freeze.freezesTanks) || (e.type === "bullet" && this.freeze.freezesBullets)) {
      let apply = true;
      for (let i = 0; i < e.freezeEffects.length; i++) {
        if (e.freezeEffects[i].stacks) continue;
        if (e.freezeEffects[i].priority > this.freeze.priority) apply = false;
        else e.freezeEffects.splice(i, 1);
      }
      if (apply) e.freezeEffects.push(clone(this.freeze, false));
    }
    
    // if we apply effects on hit, apply those effects to the hit tank
    if (ref.parentEffects.applyEffectsOnHit) {
      this.powerupRef.applyParentEffects(e);
    }
    
    // if we have constant collisions enabled, then store the colliding object on a list to check every frame until it leaves
    if (this.constantCollisions.indexOf(e) === -1) this.constantCollisions.push(e);
  }
}

class Tank extends Entity {
  constructor(p) {
    super(p);
    
    this.clientSettings = clone(require("./utils/defaultSettings.js").defaults, false);
    
    this.socket = p.socket;
    this.keypressed = [false, false, false, false, false];
    this.type = "tank";
    this.resetLerp = false;
    this.noLerpThisFrame = false;
    this.tankScale = p.tankScale ?? 1;
    
    this.camera = null;
    this.usedCam = null;
    this.noForm = false;
    this.renderOrder = 0 + Math.floor(Math.random() * 100); // tanks render from 0 to 99, inclusive
    this.color = this.clientSettings.personal.tankColor;
    if (this.color === -1) this.color = Math.floor(Math.random() * 55) + 1;
    this.team = p.team ?? null;
    this.animationLocked = 0;
    
    this.lobby.players.push(this);
    
    this.remainingLives = 0;
    this.wins = 0;
    this.games = 0;
    this.points = 0;
    this.teamMonarch = false;
    this.hasCrown = false;
    
    this.powerups = [];
    this.maxHeldPowerups = 0;
    this.tankReloadDelay = 0;
    this.bulletArray = [];
    this.updateBackpack = true;
    
    this.opacityEffects = [];
    this.speedEffects = [];
    this.visionEffects = [];
    this.bubbleEffects = [];
    this.controlledObjects = [];
  }
  rotate(magnitude) {
    let freezeMultiplier = this.getFreezeMultiplier();
    if (Math.abs(freezeMultiplier) > 2) freezeMultiplier = 2 * Math.sign(freezeMultiplier);
    Body.setAngularVelocity(this.shape, magnitude * freezeMultiplier);
  }
  move(magnitude) {
    let freezeMultiplier = this.getFreezeMultiplier();
    let movementScalar = magnitude * this.maxSpeed * freezeMultiplier / Math.max(1, framerate * this.acceleration);
    let vx = this.shape.velocity.x + movementScalar * Math.cos(this.shape.angle);
    let vy = this.shape.velocity.y + movementScalar * Math.sin(this.shape.angle);
    let currentMax = this.shape.speed * this.dampenRate;
        
    if (Math.sqrt((vx) ** 2 + (vy) ** 2) > this.maxSpeed * Math.abs(freezeMultiplier)) {
      let newDirection = Math.atan2(vy, vx);
      vx = Math.max(this.maxSpeed * Math.abs(freezeMultiplier), currentMax) * Math.cos(newDirection);
      vy = Math.max(this.maxSpeed * Math.abs(freezeMultiplier), currentMax) * Math.sin(newDirection);
    }
    Body.setVelocity(this.shape, {
      x: vx,
      y: vy,
    });
  }
  
  /**
  uses the tank's client and host's settings to remake the tank's attributes
  */
  setAttributes() {
    const rules = this.lobby.host.clientSettings;
    
    this.respawnTimer = 0;
    this.ghost = false;
    this.resetEffects();
    this.killer = null;
    this.killerTeam = null;
    this.points = 0;
    this.teamMonarch = false;
    this.hasCrown = false;
    
    this.color = this.clientSettings.personal.tankColor;
    if (this.color === -1) this.color = Math.floor(Math.random() * 55) + 1;
    
    this.team = null;
    this.team = this.lobby.findBestTeam(rules);
    
    Body.setVelocity(this.shape, {
      x: 0,
      y: 0,
    });
    this.maxSpeed = util.settingConstrain(
      rules.personal.tankSpeed,
      this.clientSettings.personal.tankSpeed
    ) / 10;
    this.acceleration = util.settingConstrain(
      rules.personal.tankAccelerationTime,
      this.clientSettings.personal.tankAccelerationTime
    );
    this.velocityDampen = util.settingConstrain(
      rules.personal.tankVelocityDampening,
      this.clientSettings.personal.tankVelocityDampening
    ) / 100;
    this.dampenRate = Math.pow(this.velocityDampen, 1/framerate);
    this.maxAngularSpeed = util.settingConstrain(
      rules.personal.tankRotationSpeed,
      this.clientSettings.personal.tankRotationSpeed
    ) * Math.PI / 180;
    
    let newScale = util.settingConstrain(
      rules.personal.tankSize,
      this.clientSettings.personal.tankSize
    ) / 2;
    this.scale(1, newScale / this.attachmentScaling, true);
    Body.setMass(this.shape, util.settingConstrain(
      rules.personal.tankMass,
      this.clientSettings.personal.tankMass
    ));
    
    this.opacity = util.settingConstrain(
      rules.personal.tankOpacity,
      this.clientSettings.personal.tankOpacity
    ) / 100;
    
    
    this.collisionInfo = [
      ["tank", rules.general.tankCollisionType === 2, rules.general.tankCollisionType !== 1],
      ["all", true, true],
    ],
    
    this.health = util.settingConstrain(
      rules.personal.tankHealth,
      this.clientSettings.personal.tankHealth
    );
    this.maxHealth = parseInt(this.health);
    this.damageResistance = util.settingConstrain(
      rules.personal.tankResistance,
      this.clientSettings.personal.tankResistance
    );
    this.showHealthBar = util.settingConstrain(
      rules.personal.showHealthBar,
      this.clientSettings.personal.showHealthBar
    );
    this.remainingLives = util.settingConstrain(
      rules.personal.extraLives,
      this.clientSettings.personal.extraLives
    );
    
    this.regeneration = {
      raw: util.settingConstrain(
        rules.personal.tankRegenRaw,
        this.clientSettings.personal.tankRegenRaw
      ),
      percentage: util.settingConstrain(
        rules.personal.tankRegenPercentage,
        this.clientSettings.personal.tankRegenPercentage
      ) / 100,
      delay: util.settingConstrain(
        rules.personal.tankRegenDelay,
        this.clientSettings.personal.tankRegenDelay
      ) * framerate,
      leftoverTimer: 0
    }
    
    this.maxHeldPowerups = util.settingConstrain(
      rules.personal.maxHeldPowerups,
      this.clientSettings.personal.maxHeldPowerups
    );
    
    let visT = util.settingConstrain(
      rules.personal.cameraVisibility,
      this.clientSettings.personal.cameraVisibility
    );
    this.camera = new Camera(
      this, 
      util.settingConstrain(
        rules.personal.cameraVision,
        this.clientSettings.personal.cameraVision
      ), {
        visibilityTeam: visT === 0 || visT === 2,
        visibilitySelf: visT === 0 || visT === 2 || visT === 3,
        visibilityEnemy: visT === 0 || visT === 1,
        circle: util.settingConstrain(
          rules.personal.cameraBubble,
          this.clientSettings.personal.cameraBubble
        ) * 4.5/16,
        opacity: util.settingConstrain(
          rules.personal.cameraOpacity,
          this.clientSettings.personal.cameraOpacity
        ) / 100,
        ignoreWalls: util.settingConstrain(
          rules.personal.cameraIgnoreWalls,
          this.clientSettings.personal.cameraIgnoreWalls
        ),
        startAngle: util.settingConstrain(
          rules.personal.cameraBubbleAngleStart,
          this.clientSettings.personal.cameraBubbleAngleStart
        ),
        endAngle: util.settingConstrain(
          rules.personal.cameraBubbleAngleEnd,
          this.clientSettings.personal.cameraBubbleAngleEnd
        ),
        lockAtCenter: util.settingConstrain(
          rules.personal.lockCameraToCenter,
          this.clientSettings.personal.lockCameraToCenter
        ),
      }
    );
    this.usedCam = this.camera;
    this.noForm = false;
    this.lights = [];
    this.lights.push(this.camera);
    
    let usedLights = rules.personal.constrainLights ? rules.personal.lights : this.clientSettings.personal.lights;
    for (let addedLight of usedLights) {
      this.lights.push(new Camera(
        this, 
        0, {
          visibilityTeam: addedLight.visibility === 0 || addedLight.visibility === 2,
          visibilitySelf: addedLight.visibility === 0 || addedLight.visibility === 2 || addedLight.visibility === 3,
          visibilityEnemy: addedLight.visibility === 0 || addedLight.visibility === 1,
          circle: util.ISS(addedLight.bubble) * 4.5/16,
          opacity: util.ISS(addedLight.opacity) / 100,
          ignoreWalls: addedLight.ignoreWalls,
          startAngle: util.ISS(addedLight.startAngle),
          endAngle: util.ISS(addedLight.endAngle),
          visibleOn: addedLight.visibleWhenLightsOn,
          visibleOff: addedLight.visibleWhenLightsOut,
          forcePowerup: addedLight.onlyWithPowerupId,
          offset: {
            x: util.ISS(addedLight.positionx)/100 * this.attachmentScaling, 
            y: util.ISS(addedLight.positiony)/100 * this.attachmentScaling
          }
        }
      ));
    }
    
    this.powerups = [];
    let priorities = [];
    for (let i = 0; i < rules.powerups.length; i++) {
      if (!rules.powerups[i].spawning.spawnEquipped || Math.random() > rules.powerups[i].spawning.spawnEquippedChance/100) priorities.push(0);
      else priorities.push(rules.powerups[i].spawning.spawnEquippedPriority);
    }
    for (let i = 0; i < this.maxHeldPowerups; i++) {
      let chosenSpawn = util.getPriority(priorities);
      if (chosenSpawn === -1) break;
      this.powerups.push(new Powerup(chosenSpawn, this.lobby));
      priorities.splice(chosenSpawn, 1);
    }
    this.refreshPowerups();
  }
  
  // finds the camera of the killer, or whoever killed them
  findKillerCamera(rules, base = this, stack = 9) {
    // killer spectate
    if (rules.general.ghostSpectateType === 1) {
      if (this.killer === null) return this.camera;
      if (stack > 0) return this.killer.findKillerCamera(rules, base, stack - 1);
    }
    // teammate spectate
    if (rules.general.ghostSpectateType === 3) {
      for (let p of this.lobby.players) {
        if (p.team !== this.team || p.ghost) continue;
        return p.camera;
      }
    }
    // if all else fails, either random camera or just use your own
    let possibilities = [];
    for (let p of this.lobby.players) {
      if (p.ghost) continue;
      possibilities.push(p);
    }
    if (possibilities.length > 0) return possibilities[Math.floor(possibilities.length * Math.random())].camera;
    return base.camera;
  }
  
  // runs if the self destruct action is deemed to have run
  destructBullets(keyType) {
    let destructed = false;
    for (let i = this.bulletArray.length - 1; i >= 0; i--) {
      const destructType = this.bulletArray[i].powerupRef.powerupData.misc.selfDestruct;
      if (
        (keyType === 0 && destructType >= 1) ||
        (keyType === 1 && destructType >= 2) ||
        (keyType === 2 && destructType === 3)
      ) {
        this.bulletArray[i].annihilate(2);
        this.keypressed[4] = false;
        destructed = true;
      }
    }
    return destructed;
  }
  
  // run when the tank's powerups change
  refreshPowerups() {
    this.noLerpThisFrame = true;
    this.updateBackpack = true;
    // sort powerups by their force equip status
    this.powerups = this.powerups.sort(function(a, b) {
      if (a.powerupData.misc.forceEquip) {
        if (!b.powerupData.misc.forceEquip) return -1;
        if (a.powerupData.misc.forceEquipPriority > b.powerupData.misc.forceEquipPriority) return -1;
      }
      if (b.powerupData.misc.forceEquip) {
        if (!a.powerupData.misc.forceEquip) return 1;
        if (b.powerupData.misc.forceEquipPriority > a.powerupData.misc.forceEquipPriority) return 1;
      }
      return 0;
    });
    
    let firstPower = this.powerups.splice(0, 1)[0];
    this.powerups = this.powerups.sort(function(a, b) {
      if (a.powerupData.spawning.treatAsDefault && !b.powerupData.spawning.treatAsDefault) return 1;
      if (b.powerupData.spawning.treatAsDefault && !a.powerupData.spawning.treatAsDefault) return -1;
      if(a.powerupData.name.toLowerCase() < b.powerupData.name.toLowerCase()) return -1;
      if(a.powerupData.name.toLowerCase() > b.powerupData.name.toLowerCase()) return 1;
      return 0;
    });
    this.powerups.splice(0, 0, firstPower);
  }
  
  // on death or round end, reset our effects
  resetEffects() {
    this.poisonEffects = [];
    this.freezeEffects = [];
    this.opacityEffects = [];
    this.speedEffects = [];
    this.visionEffects = [];
    this.bubbleEffects = [];
    this.shields = [];
    if (this.camera) this.camera.trackedObject = this;
    this.controlledObjects = [];
    if (!this.ghost) {
      this.usedCam = this.camera;
      this.noForm = false;
    }
  }
  
  // gets the effect for things like opacity and speed effects
  getBiggestEffect(effect) {
    if (effect === 0) {
      let usedOpacity = 1;
      for (let i of this.opacityEffects) {
        if (i.fadeIn > 0) {
          usedOpacity *= Math2.lerp(i.end, i.start, 1 - i.fadeIn/i.lerpTime);
          continue;
        }
        else if (i.duration > 0) {
            usedOpacity *= i.start;
            continue;
        }
        else {
          usedOpacity *= Math2.lerp(i.start, i.end, 1 - i.fadeOut/i.lerpTime);
          continue;
        }
      }
      return usedOpacity;
    }
    if (effect === 1) {
      let usedSpeed = 1;
      for (let i of this.speedEffects) {
        if (i.fadeIn > 0) {
          usedSpeed *= Math2.lerp(i.end, i.start, 1 - i.fadeIn/i.lerpTime);
          continue;
        }
        else if (i.duration > 0) {
            usedSpeed *= i.start;
            continue;
        }
        else {
          usedSpeed *= Math2.lerp(i.start, i.end, 1 - i.fadeOut/i.lerpTime);
          continue;
        }
      }
      return usedSpeed;
    }
    if (effect === 2) {
      let usedVision = 1;
      for (let i of this.visionEffects) {
        if (i.fadeIn > 0) {
          usedVision *= Math2.lerp(i.end, i.start, 1 - i.fadeIn/i.lerpTime);
          continue;
        }
        else if (i.duration > 0) {
            usedVision *= i.start;
            continue;
        }
        else {
          usedVision *= Math2.lerp(i.start, i.end, 1 - i.fadeOut/i.lerpTime);
          continue;
        }
      }
      return usedVision;
    }
    if (effect === 3) {
      let usedBubble = 1;
      for (let i of this.bubbleEffects) {
        if (i.fadeIn > 0) {
          usedBubble *= Math2.lerp(i.end, i.start, 1 - i.fadeIn/i.lerpTime);
          continue;
        }
        else if (i.duration > 0) {
            usedBubble *= i.start;
            continue;
        }
        else {
          usedBubble *= Math2.lerp(i.start, i.end, 1 - i.fadeOut/i.lerpTime);
          continue;
        }
      }
      return usedBubble;
    }
    if (effect === 4) {
      for (let i = this.bubbleEffects.length - 1; i >= 0; i--) {
        switch (this.bubbleEffects) {
          case 0: continue;
          case 1: return true;
          case 2: return false;
        }
      }
      return null;
    }
    if (effect === 5) {
      for (let i = this.bubbleEffects.length - 1; i >= 0; i--) {
        switch(this.bubbleEffects[i].visibility) {
          case 0: continue;
          case 1: return { enemy: true, team: true, self: true, parent: true };
          case 2: return { enemy: false, team: true, self: true, parent: true };
          case 3: return { enemy: false, team: false, self: true, parent: false };
        }
      }
      return null;
    }
  }
  
  /** 
    gets the leaderboard data and sends it
  */
  getLeaderboard(toLobby) {
    if (toLobby || this.lobby.refreshAfterTimer) {
      let data = [protocol.leaderboardInfo, 1, "Player Win Rates", this.lobby.players.length];
      for (let p of this.lobby.players) data.push(`${p.name}: ${p.wins}/${p.games}`, p.color);
      data.push(0);
      this.socket.talk(util.encodePacket(data, ["int8", "int8", "string", "repeat", "string", "int8", "end"]));
      return;
    }
    switch (this.lobby.host.clientSettings.gamemode.mode) {
      // Standard
      case 0: {
        let data = [protocol.leaderboardInfo, 1, "Player Status", this.lobby.players.length];
        for (let p of this.lobby.players) data.push(p.name, p.ghost && p.remainingLives <= 0 && p.respawnTimer <= 0 ? 8 : 0);
        data.push(0);
        this.socket.talk(util.encodePacket(data, ["int8", "int8", "string", "repeat", "string", "int8", "end"]));
        return;
      }
      // Arena
      case 1: {
        let data = [protocol.leaderboardInfo, 1, "Player Points", this.lobby.players.length];
        for (let p of this.lobby.players) data.push(`${p.name}: ${p.points}`, p.color);
        data.push(0);
        this.socket.talk(util.encodePacket(data, ["int8", "int8", "string", "repeat", "string", "int8", "end"]));
        return;
      }
      // Tag
      case 2: {
        let livingPlayers = this.lobby.players.filter((p) => !p.ghost);
        let data = [protocol.leaderboardInfo, 1, "Player Teams", livingPlayers.length];
        for (let p of livingPlayers) data.push(p.name, p.color);
        data.push(0);
        this.socket.talk(util.encodePacket(data, ["int8", "int8", "string", "repeat", "string", "int8", "end"]));
        return;
      }
      // Monarch and KotH don't need a leaderboard
      case 3:
      case 4: {
        this.socket.talk(util.encodePacket([protocol.leaderboardInfo, 0, "", 0, 0], ["int8", "int8", "string", "repeat", "string", "int8", "end"]));
        return;
      }
    }
  }
  
  /**
    returns an array of arrays for the backpack data to send to the client
    [Powerup Name], [Powerup Name Color, Allow Unequip]
  */
  getBackpackData() {
    let backpackData = [[this.updateBackpack ? 1 : 0]];
    for (let p of this.powerups) {
      let nameValues = [];
      let usedName = encodeURIComponent(p.powerupData.name);
      for (let j = 0; j < usedName.length; j++) nameValues.push(usedName.charCodeAt(j) < 128 ? usedName.charCodeAt(j) : 63);
      backpackData.push(nameValues);
      backpackData.push([
        p.nameColor,
        p.powerupData.misc.allowUnequip ? 1 : 0
      ]);
    }
    return backpackData;
  }
  
  // attempts to unequip the bullet and put it back on the field
  attemptUnequip(index) {
    if (this.powerups.length <= 1) return;
    if (!this.powerups[index].powerupData.misc.allowUnequip) return;
    if (!this.powerups[index].powerupData.misc.deleteOnUnequip) {
      let bubbleSize = util.ISS(this.powerups[index].powerupData.spawning.bubbleSize);
      new PowerupBubble({
        name: "Powerup Bubble",
        lobby: this.lobby,
        shape: Bodies.circle(0, 0, bubbleSize),
        attachmentScaling: bubbleSize,
        collisionInfo: [
          ["tank", true, true],
          ["wall", true, true],
          ["box", true, true],
          ["border", true, true],
          ["all", false, false],
        ],
        attachments: this.powerups[index].powerupData.bubbleShape,
        containedPower: this.powerups[index],
        fakeSpawn: false,
        removalTimer: this.powerups[index].timeRemaining,
        renderOrder: -100 + Math.floor(Math.random() * 100), // bubble render orders from -100 to -1, inclusive
        borderWidth: 10,
        location: {x: this.shape.position.x, y: this.shape.position.y},
        oldUser: this
      });
    }
    
    if (index === 0) this.tankReloadDelay = parseInt(this.remainingReload);
    this.powerups.splice(index, 1);
    this.refreshPowerups();
  }
  
  /**
  turns a tank into a ghost
  */
  intoGhost(respawnTimer) {
    if (this.lobby.host.clientSettings.general.ghostSpectateType !== 0) {
      this.usedCam = this.findKillerCamera(this.lobby.host.clientSettings);
      this.noForm = true;
    }
    this.ghost = true;
    this.animationlocked = 0;
    for (let p = this.powerups.length - 1; p >= 0; p--) {
      if (!this.powerups[p].powerupData.misc.retainAfterDeath && !this.powerups[p].powerupData.spawning.treatAsDefault) this.powerups.splice(p, 1);
    }
    this.respawnTimer = respawnTimer;
    this.refreshPowerups();
  }
  
  /**
  When tanks die, they go through this process
  */
  kill(killer = null) {
    const rules = this.lobby.host.clientSettings;
    if (this.ghost) return;
    if (killer !== null) {
      this.killer = killer;
      this.killerTeam = [killer.team, killer.color];
    }
    
    for (let i = this.bulletArray.length - 1; i >= 0; i--) {
      if (this.bulletArray[i].powerupRef.powerupData.misc.dieOnTankDeath) this.bulletArray[i].annihilate();
    }
    
    if (this.lobby.inLobby) {
      switch (rules.waitingRoom.lobbyDeathHandlingType) {
        case 0: {
          // teleport them randomly and otherwise ignore it
          this.health = util.settingConstrain(
            rules.personal.tankHealth,
            this.clientSettings.personal.tankHealth
          );
          this.lobby.randomLocation(this, {type: 1, w: this.lobby.size.width, h: this.lobby.size.height, x: 0, y: 0});
          return;
        }
        case 1: {
          // just ignore it
          this.health = util.settingConstrain(
            rules.personal.tankHealth,
            this.clientSettings.personal.tankHealth
          );
          return;
        }
        case 2: {
          // turn them into a ghost
          this.intoGhost(util.ISS(rules.waitingRoom.ghostReviveTime) * framerate);
          return;
        }
      }
    }
    
    switch (rules.gamemode.mode) {
      // Standard
      case 0: {
        if (this.remainingLives > 0) {
          this.intoGhost(util.ISS(rules.gamemode.standard.reviveTimer) * framerate + 1);
          this.remainingLives--;
        }
        else this.intoGhost(0);
        break;
      }
      // Arena
      case 1: {
        if (this.remainingLives > 0) this.remainingLives--;
        else {
          if (this.killer.team === this.team) {
            this.points -= util.ISS(rules.gamemode.arena.friendlyFireLostPoints);
          }
          else {
            this.killer.points += util.ISS(rules.gamemode.arena.killPoints);
            this.points -= util.ISS(rules.gamemode.arena.deathLostPoints);
          }
        }
        this.intoGhost(util.ISS(rules.gamemode.arena.reviveTimer) * framerate + 1);
        break;
      }
      // Tag
      case 2: {
        if ((this.remainingLives <= 0 && rules.gamemode.tag.teleportOnTag) || 
            (this.remainingLives > 0 && rules.gamemode.tag.teleportWhenUsingExtraLife)) this.intoGhost(1);
        else {
          this.health = util.settingConstrain(
            rules.personal.tankHealth,
            this.clientSettings.personal.tankHealth
          );
          this.resetEffects();
        }
        
        if (this.remainingLives > 0) this.remainingLives--;
        else {
          if (this.points > 0) {
            this.points--;
            if (this.points <= 0) {
              this.intoGhost(0);
              break;
            }
          }
          
          if (this.killerTeam[0] === this.team) {
            switch (rules.gamemode.tag.friendlyFireDeathHandling) {
              case 1: {
                let closestPlayer = [null, 0];
                for (let i = 0; i < this.lobby.players.length; i++) {
                  if (this.lobby.players[i].team === this.team) continue;
                  let d = Math2.dist(this.shape.position, this.lobby.players[i].shape.position);
                  if (closestPlayer[0] === null || d < closestPlayer[1]) {
                    closestPlayer = [this.lobby.players[i], d];
                  }
                }
                if (closestPlayer[0] !== null) {
                  this.killer = closestPlayer[0];
                  this.killerTeam = [this.killer.team, this.killer.color];
                }
                break;
              }
              case 2: {
                let possiblePlayers = [];
                for (let i = 0; i < this.lobby.players.length; i++) {
                  if (this.lobby.players[i].team === this.team) continue;
                  possiblePlayers.push(this.lobby.players[i]);
                }
                if (possiblePlayers.length > 0) {
                  this.killer = possiblePlayers[Math.floor(Math.random() * possiblePlayers.length)];
                  this.killerTeam = [this.killer.team, this.killer.color];
                }
                break;
              }
            }
          }
          
          this.team = this.killerTeam[0];
          if (rules.gamemode.teams.overrideTeamColor) {
            this.color = this.killerTeam[1];
          }
          
          if (rules.gamemode.tag.weaponChangeWithPlayer) for (let b of this.bulletArray) {
            b.team = this.team;
            b.color = this.color;
          }
        }
        break;
      }
      // Monarch
      case 3: {
        let monarchFound = false;
        for (let p of this.lobby.players) {
          if (p.team !== this.team || !p.teamMonarch || (p.ghost && p.remainingLives <= 0 && p.respawnTimer <= 0)) continue;
          monarchFound = true;
          break;
        }
        if (!monarchFound) {
          this.intoGhost(0);
          break;
        }
        if (this.remainingLives > 0) {
          this.intoGhost(util.ISS(rules.gamemode.monarch.reviveTimer) * framerate + 1);
          this.remainingLives--;
        }
        else this.intoGhost(0);
        break;
      }
      // KotH
      case 4: {
        let noCrown = true;
        for (let p of this.lobby.players) {
          if (!p.hasCrown) continue;
          noCrown = false;
          break;
        }
        if (noCrown) this.hasCrown = true;
        
        if (this.hasCrown) {
          for (let p of this.lobby.players) {
            if (p.ghost) p.intoGhost(1);
            if (rules.gamemode.kingOfTheHill.shuffleOnSteal) p.intoGhost(1);
          }
          if (this.killer === this) {
            let closestPlayer = [null, 0];
            for (let i = 0; i < this.lobby.players.length; i++) {
              if (this.lobby.players[i].team === this.team) continue;
              let d = Math2.dist(this.shape.position, this.lobby.players[i].shape.position);
              if (closestPlayer[0] === null || d < closestPlayer[1]) {
                closestPlayer = [this.lobby.players[i], d];
              }
            }
            if (closestPlayer[0] !== null) {
              this.killer = closestPlayer[0];
              this.killerTeam = [this.killer.team, this.killer.color];
            }
          }
          
          if (rules.gamemode.kingOfTheHill.crownOwnedByTeam) {
            for (let p of this.lobby.players) {
              if (p.team === this.killerTeam[0]) p.hasCrown = true;
              else p.hasCrown = false;
            }
          }
          else {
            this.killer.hasCrown = true;
            this.hasCrown = false;
          }
          this.lobby.gameTimer = util.ISS(rules.gamemode.kingOfTheHill.countdownTimer) * framerate;
          
          if (rules.gamemode.kingOfTheHill.oldBearerDies) this.intoGhost(0);
        }
        
        this.intoGhost(1);
        break;
      }
    }
  }
  
  /** 
  attempts to fire the tank's guns looking at reload and stuff
  */
  attemptFire(powerup, fuckSafety = false) {
    let fireData = powerup.powerupData;
    // if we don't care about reload delay, safety, or preconditions, then just fuck it
    if (!fuckSafety) {
      // make sure dead people can't fire
      if (this.ghost) return;
      // make sure we have a powerup
      if (this.powerups.length < 1) return;
      // make sure we aren't still on reload
      if (powerup.remainingReload > 0 || this.tankReloadDelay > 0) return;

      // if we have a prefire animation lock, lock the tank and then actually fire the bullet later
      if (!powerup.waitingToFire && util.ISS(fireData.firing.prefireAnimationLock)) {
        powerup.waitingToFire = true;
        this.animationLocked = util.ISS(fireData.firing.prefireAnimationLock) * framerate;
        return;
      }
    }
    // if firing the weapon starts a timer, do that
    if (fireData.firing.removeAfterEvent === 2 && powerup.timeRemaining === 0) {
      powerup.timeRemaining = util.ISS(fireData.firing.removeAfterTimer) * framerate;
    }
    
    let doAmmo = true;
    let reloadPowerupSource = powerup;
    if (fireData.multifire.multifiredWeaponId !== -1 && !fireData.multifire.syncronizeFire) {
      if (fireData.spawning.treatAsDefault) {
        doAmmo = false;
        if (powerup.currentMultifirePowerup.powerupData.id === powerup.powerupData.id) doAmmo = true;
      } else {
        let switchedPower = this.lobby.createPowerupFromId(powerup.currentMultifirePowerup.powerupData.multifire.multifiredWeaponId);
        if (switchedPower !== null && switchedPower.powerupData.id !== powerup.powerupData.id) doAmmo = false;
      }
      if (!powerup.powerupData.multifire.overrideMultifiredReload) reloadPowerupSource = powerup.currentMultifirePowerup;
    }
    
    
    // make sure we still have ammo
    let shotQuantity = powerup.getAttribute("shotQuantity");
    if (doAmmo) {
      if (powerup.remainingShots <= 0) {
        if (powerup.remainingRounds <= 0 || fireData.spawning.treatAsDefault) return;
        powerup.remainingRounds--;
        powerup.remainingShots = powerup.getAttribute("shotsPerRound");
      }

      if (fireData.firing.countPerBullet) {
        shotQuantity = util.clamp(shotQuantity, 0, powerup.remainingShots);
        powerup.remainingShots -= shotQuantity;
      }
      else powerup.remainingShots--;
    }
      
    if (powerup.remainingShots <= 0 && !fireData.spawning.treatAsDefault) {
      this.tankReloadDelay = framerate * reloadPowerupSource.getAttribute("roundReload");
    }
    else powerup.remainingReload = framerate * reloadPowerupSource.getAttribute("shotReload");
    
    let FFT = fireData.baseAttributes.friendlyFireType;
    
    let usedPowerup = (fireData.multifire.multifiredWeaponId !== -1 && !fireData.multifire.syncronizeFire) ? powerup.currentMultifirePowerup : powerup;
    
    this.fire({
      fromBullet: false,
      quantity: shotQuantity
    }, usedPowerup);
    // unsyncronized and syncronized multi-firing respecitvely
    if (fireData.multifire.multifiredWeaponId !== -1 && !fireData.multifire.syncronizeFire) {
      let switchedPower = this.lobby.createPowerupFromId(usedPowerup.powerupData.multifire.multifiredWeaponId);
      if (switchedPower === null || switchedPower.powerupData.id === powerup.powerupData.id) powerup.currentMultifirePowerup = powerup;
      else powerup.currentMultifirePowerup = switchedPower;
    }
    if (fireData.multifire.multifiredWeaponId !== -1 && fireData.multifire.syncronizeFire) {
      let currentPowerup = powerup;
      for (let i = 0; i < 99; i++) {
        currentPowerup = this.lobby.createPowerupFromId(currentPowerup.powerupData.multifire.multifiredWeaponId);
        if (currentPowerup === null) break;
        this.fire({
          treatDefault: {enabled: false},
          fromBullet: false,
        }, currentPowerup);
      }
    }
    
    // if we have a postfire animation lock, lock the tank after firing
    this.animationLocked = util.ISS(fireData.firing.postfireAnimationLock) * framerate;
    powerup.waitingToFire = false;
    
    powerup.applyParentEffects(this);
    if (fireData.inheriting.onFirePowerupId !== -1) {
      this.keypressed[4] = false;
      powerup.inheritToParent(this, fireData.inheriting.equipType, this.lobby.createPowerupFromId(fireData.inheriting.onFirePowerupId));
    }
    
    if (powerup.remainingShots <= 0 && powerup.remainingRounds <= 0 && !fireData.spawning.treatAsDefault) {
      if (fireData.firing.removeOnLastRound) {
        if (fireData.inheriting.onRemovalPowerupId !== -1) {
          this.keypressed[4] = false;
          powerup.inheritToParent(this, fireData.inheriting.equipType, this.lobby.createPowerupFromId(fireData.inheriting.onRemovalPowerupId));
        }
        this.powerups.splice(this.powerups.indexOf(powerup), 1);
        this.refreshPowerups();
      }
    }
  }
}

class PowerupBubble extends Entity {
  constructor(p) {
    super(p);
    this.name = p.name ?? "Unnamed Bubble";
    this.type = "bubble";
    this.team = -1;
    this.containedPower = p.containedPower;
    this.fakeSpawn = p.fakeSpawn;
    this.removalTimer = p.removalTimer;
    if (p.location) Body.setPosition(this.shape, p.location);
    else this.lobby.randomLocation(this, {type: 1, w: this.lobby.size.width, h: this.lobby.size.height, x: 0, y: 0});
    this.oldUser = p.oldUser ?? null;
  }
}


/**
checks if two objects should collide based on things like teams and death status
*/
Detector.canCollide = function(filterA, filterB) {
  let e = filterA.me;
  let other  = filterB.me;
  
  if (!filterA.me || !filterB.me) {
    console.log("Collision Detector is missing a parent");
    return false;
  }
  
  if (e.ghost != other.ghost && !(e.hitsGhost || other.hitsGhost)) return false;
  
  if (e.type === "bullet" && other.type === "bullet") {
    if (e.shotID === other.shotID) return false;
    let highestPriority = 0;
    if (e.powerupRef.powerupData.interactions.bulletInteractionPriority > other.powerupRef.powerupData.interactions.bulletInteractionPriority)
        highestPriority = e.team === other.team ? e.powerupRef.powerupData.interactions.sameTeamBulletInteractions : e.powerupRef.powerupData.interactions.bulletInteractions;
    else 
      highestPriority = e.team === other.team ? other.powerupRef.powerupData.interactions.sameTeamBulletInteractions : other.powerupRef.powerupData.interactions.bulletInteractions;
    if (highestPriority === 0) return false;
  }
  
  if ((e.type === "bullet" && other.type === "tank") || (other.type === "bullet" && e.type === "tank")) {
    if (e.type === "bullet") for (let cw of e.tanksCollidedWith) if (cw[0] === other && cw[1] <= 0) return false;
    if (other.type === "bullet") for (let cw of other.tanksCollidedWith) if (cw[0] === e && cw[1] <= 0) return false;
  }
 
  if (e.type === "bullet" && e.parent === other) return !e.ignoreParent;
  if (other.type === "bullet" && other.parent === e) return !other.ignoreParent;
  
  if (e.type === "bubble" && other.type === "tank" && e.oldUser === other) return false;
  if (other.type === "bubble" && e.type === "tank" && other.oldUser === e) return false;
  
  if (e.type === "shield" && !e.deflectsAttacks) return false;
  if (other.type === "shield" && !other.deflectsAttacks) return false;
  if (e.type === "shield" && other.type === "bullet") return Detector.canCollide(e.tank.shape.collisionFilter, filterB);
  if (other.type === "shield" && e.type === "bullet") return Detector.canCollide(other.tank.shape.collisionFilter, filterA);
  
  if (e.type === "wall" && other.type === "bullet") if (util.matchIds(other.powerupRef.powerupData.wallIds, e.ignoreIds)) return false;
  if (other.type === "wall" && e.type === "bullet") if (util.matchIds(e.powerupRef.powerupData.wallIds, other.ignoreIds)) return false;
    
  if (e.type === "tank" && other.type === "bubble" 
      && e.maxHeldPowerups <= e.powerups.length && !other.containedPower.powerupData.parentEffects.disableBullets) return false;
  if (other.type === "tank" && e.type === "bubble" 
      && other.maxHeldPowerups <= other.powerups.length && !e.containedPower.powerupData.parentEffects.disableBullets) return false;
  
  let valid = false;
  for (let i = 0; i < e.collisionInfo.length; i++) {
    if (e.collisionInfo[i][0] === "all" || e.collisionInfo[i][0] === other.type) {
      if (e.collisionInfo[i][1] && e.team === other.team) valid = true;
      if (e.collisionInfo[i][2] && e.team !== other.team) valid = true;
      if (valid === false) return false;
    }
    if (valid) break;
  }
  if (!valid) return false;
  valid = false;
  for (let i = 0; i < other.collisionInfo.length; i++) {
    if (other.collisionInfo[i][0] === "all" || other.collisionInfo[i][0] === e.type) {
      if (other.collisionInfo[i][1] && other.team === e.team) valid = true;
      if (other.collisionInfo[i][2] && other.team !== e.team) valid = true;
      if (valid === false) return false;
    }
    if (valid) break;
  }
  if (!valid) return false;
	return true;
};


const sockets = {
  tally: 1,
  clients: [],
  class: class {
    constructor(socket, request) {
      this.id = sockets.tally++;
      
      this.socket = socket;
      this.request = request;
      this.socket.binaryType = "arraybuffer";
      this.tankInstance = null;
      
      socket.onerror = error => this.error(error);
      socket.onclose = reason => this.close(reason);
      socket.onmessage = data => this.message(data);
    }
    
    createTankInstance(rawData) {
      this.tankInstance = new Tank(rawData);
      return this.tankInstance;
    }
    
    message(packet) {
      let callingPlayer = Lobby.checkForPlayer(this);
      let reader = new DataView(packet.data);
      
      switch (reader.getInt8(0)) {
        case protocol.log: {
          let p = util.decodePacket(reader, ["int8", "string"]);
          console.log(p[1]);
          break;
        }
        case protocol.join: {
          console.time("join reading arraybuffer");
          let breakdown = clone(createSettings.processSettingsArrayBuffer(reader, ["int8", "string", "string"]), false);
          let p = breakdown[1];
          console.timeEnd("join reading arraybuffer");
          console.time("join creating tank object");
          
          let l = Lobby.checkForLobbyWithId(p[2]);
          if (l === -1) console.log("lobby does not exist but someone tried to join it");
          
          if (l.players.length >= l.host.clientSettings.gamemode.maxPlayers) {
            this.talk(util.encodePacket([protocol.kick, "Max Players", "This lobby is full, try joining later."], ["int8", "string", "string"]));
            console.log("lobby full, join request rejected")
            console.timeEnd("join creating tank object");
            break;
          }
          
          let sendingSettingsTypes = createSettings.createSettingsArrayBuffer(l.host.clientSettings);
          let sendData = [protocol.sendHostSettings, ...sendingSettingsTypes[0]];
          let sendTypes = ["int8", ...sendingSettingsTypes[1]];
          this.talk(util.encodePacket(sendData, sendTypes));
          
          let joinTank = this.createTankInstance({
            name: p[1],
            socket: this,
            lobby: l,
            shape: Bodies.rectangle(0, 0, 300, 300),
            color: 6
          });
          console.timeEnd("join creating tank object");
          console.time("join setting up tank");
          
          joinTank.setAttributes();
          
          l.randomLocation(joinTank, {type: 1, w: l.size.width, h: l.size.height, x: 0, y: 0});
          console.timeEnd("join setting up tank");
          break;
        }
        case protocol.host: {
          console.time("host reading arraybuffer");
          let breakdown = clone(createSettings.processSettingsArrayBuffer(reader, ["int8", "string", "string", "string"]), false);
          let p = breakdown[1];
          console.timeEnd("host reading arraybuffer");
          console.time("host creating tank object");
          
          if (this.tankInstance !== null) {
            console.log("The same socket attempted to have two tanks.");
            break;
          }
          
          if (Lobby.checkForLobbyWithId(p[2]) !== -1) {
            this.talk(util.encodePacket([protocol.alreadyExists, p[1], p[2]], ["int8", "string", "string"]));
            console.log("lobby exists, joining instead")
            console.timeEnd("host creating tank object");
            break;
          }
          
          console.log(`creating a lobby with id <${p[2]}>`);
          let l = new Lobby({}, p[2], p[3]);
          Lobby.lobbies.push(l);
          let hostTank = this.createTankInstance({
            name: p[1], 
            socket: this, 
            lobby: l, 
            shape: Bodies.rectangle(0, 0, 300, 300),
            color: 6
          });
          l.host = hostTank;
          console.timeEnd("host creating tank object");
          console.time("host setting up lobby");
          
          hostTank.clientSettings = breakdown[0];
          
          l.refreshLobby(true);
          
          let sendingSettingsTypes = createSettings.createSettingsArrayBuffer(hostTank.clientSettings);
          let sendData = [protocol.sendHostSettings, ...sendingSettingsTypes[0]];
          let sendTypes = ["int8", ...sendingSettingsTypes[1]];
          this.talk(util.encodePacket(sendData, sendTypes));
          
          console.timeEnd("host setting up lobby");
          break;
        }
        case protocol.left: {
          if (!callingPlayer) break;
          callingPlayer.keypressed[0] = reader.getInt8(1) === 1 ? true : false;
          if (reader.getInt8(1) === 0) Body.setAngularVelocity(callingPlayer.shape, 0);
          if (reader.getInt8(1) === 1) callingPlayer.destructBullets(2);
          break;
        }
        case protocol.right: {
          if (!callingPlayer) break;
          callingPlayer.keypressed[1] = reader.getInt8(1) === 1 ? true : false;
          if (reader.getInt8(1) === 0) Body.setAngularVelocity(callingPlayer.shape, 0);
          if (reader.getInt8(1) === 1) callingPlayer.destructBullets(2);
          break;
        }
        case protocol.up: {
          if (!callingPlayer) break;
          callingPlayer.keypressed[2] = reader.getInt8(1) === 1 ? true : false;
          if (reader.getInt8(1) === 1) callingPlayer.destructBullets(2);
          break;
        }
        case protocol.down: {
          if (!callingPlayer) break;
          callingPlayer.keypressed[3] = reader.getInt8(1) === 1 ? true : false;
          if (reader.getInt8(1) === 1) callingPlayer.destructBullets(2);
          break;
        }
        case protocol.space: {
          if (!callingPlayer) break;
          callingPlayer.keypressed[4] = reader.getInt8(1) === 1 ? true : false;
          if (reader.getInt8(1) === 1) callingPlayer.destructBullets(1);
          break;
        }
        case protocol.action: {
          testingvar = true;
          if (!callingPlayer) break;
          if (reader.getInt8(1) === 0) break;
          if (callingPlayer.animationLocked > 0) break;
          if (callingPlayer.destructBullets(0)) break;
          callingPlayer.lightsOff = !callingPlayer.lightsOff;
          break;
        }
        case protocol.unequip: {
          if (!callingPlayer) break;
          if (reader.getInt8(1) === 0) break;
          if (callingPlayer.animationLocked > 0) break;
          callingPlayer.attemptUnequip(0);
          break;
        }
        case protocol.enter: {
          if (!callingPlayer) break;
          if (callingPlayer.lobby.host !== callingPlayer) break;
          if (reader.getInt8(1) === 0) break;
          if (callingPlayer.lobby.inLobby) callingPlayer.lobby.refreshLobby(false);
          else callingPlayer.lobby.refreshLobby(true);
          break;
        }
        case protocol.clientSendSettings: {
          if (!callingPlayer) break;
          if (!callingPlayer.lobby.inLobby) {
            if (callingPlayer.lobby.host === callingPlayer) {
              this.talk(util.encodePacket([protocol.forcedWaitingRoom, "Changing settings has brought the game back to the waiting room."], ["int8", "string"]));
              callingPlayer.lobby.refreshLobby(false);
            }
            else {
              this.talk(util.encodePacket([protocol.failedToSendSettings, "Please wait to update your used settings until back in the waiting room."], ["int8", "string"]));
              break;
            }
          }
          callingPlayer.clientSettings = clone(createSettings.processSettingsArrayBuffer(reader)[0], false);
          if (callingPlayer === callingPlayer.lobby.host) {
            callingPlayer.lobby.refreshLobby(true);
          } 
          else {
            callingPlayer.lobby.resetTeams();
            for (let i of callingPlayer.lobby.players) i.setAttributes();
          }
          for (let i of callingPlayer.lobby.players) {
            let sendingSettingsTypes = createSettings.createSettingsArrayBuffer(callingPlayer.lobby.host.clientSettings);
            let sendData = [protocol.sendHostSettings, ...sendingSettingsTypes[0]];
            let sendTypes = ["int8", ...sendingSettingsTypes[1]];
            this.talk(util.encodePacket(sendData, sendTypes));
          }
          break;
        }
        case protocol.backpackClicked: {
          if (!callingPlayer) break;
          if (callingPlayer.animationLocked > 0) break;
          let backpackRequest = util.decodePacket(reader, ["int8", "int8", "int8", "string"]);
          if (callingPlayer.powerups.length <= backpackRequest[2]) return;
          if (callingPlayer.powerups[backpackRequest[2]].powerupData.name !== backpackRequest[3]) return;
          if (backpackRequest[1] === 0) {
            let placeholder = callingPlayer.powerups[0];
            callingPlayer.powerups[0] = callingPlayer.powerups[backpackRequest[2]];
            callingPlayer.powerups[backpackRequest[2]] = placeholder;
          }
          if (backpackRequest[1] === 1) {
            callingPlayer.attemptUnequip(backpackRequest[2]);
          }
          callingPlayer.refreshPowerups();
          break;
        }
        default: {
          console.log("Unknown request recieved");
          break;
        }
      }
    }
    
    close() {
      let closingPlayer = Lobby.checkForPlayer(this);
      if (closingPlayer === null) return;
      if (closingPlayer.lobby.host === closingPlayer) closingPlayer.lobby.findNewHost();
      closingPlayer.annihilate();
    }

    talk(data) {
      if (this.socket.readyState === 1) this.socket.send(data, {binary: true});
    }

    error(error) {
      throw error;
    }

    kick(reason) {
      
    }
  },

  connect(socket, request) {
    console.log(`Socket ${sockets.tally} has connected. Active sockets: ${sockets.clients.length + 1}`);
    let connectingSocket = new sockets.class(socket, request);
    sockets.clients.push(connectingSocket);
    connectingSocket.talk(util.encodePacket([protocol.confirmConnection], ["int8"]));
  }
}

const site = ((port, connect) => {
  WebSocket(app);
  
  app.ws("/ws", connect);
  
  app.use(compression());
  //app.use(minify());
  app.use(cors());
  app.use(express.static("public"));
  app.use(express.json());
  
  app.listen(port, () => console.log("Express is now active on port %s", port));
  return (directory, callback) => app.get(directory, callback);
})(port, sockets.connect);

app.use(express.static("public"));
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/public/index.html");
});

let serverSpeed = 0;
function update() {
  for (let l of Lobby.lobbies) {
    const rules = l.host.clientSettings;
    // create powerups
    if (l.powerupsLeftToSpawn > 0 && l.powerupSpawnTimer <= 0) {
      // choose a powerup based on their priority
      let priorities = [];
      for (let i = 0; i < rules.powerups.length; i++) {
        if (!rules.powerups[i].spawning.allowSpawning || l.spawnsOfType[i] === 0) priorities.push(0);
        else priorities.push(rules.powerups[i].spawning.spawnPriority);
      }
      let chosenSpawn = util.getPriority(priorities);
      if (chosenSpawn !== -1) {
        let containedPower = new Powerup(chosenSpawn, l);
        let bubbleSize = util.ISS(containedPower.powerupData.spawning.bubbleSize);

        new PowerupBubble({
          name: "Powerup Bubble",
          lobby: l,
          shape: Bodies.circle(0, 0, bubbleSize),
          attachmentScaling: bubbleSize,
          collisionInfo: [
            ["tank", true, true],
            ["wall", true, true],
            ["box", true, true],
            ["border", true, true],
            ["all", false, false],
          ],
          attachments: containedPower.powerupData.bubbleShape,
          containedPower: containedPower,
          fakeSpawn: Math.random() < containedPower.powerupData.spawning.fakeSpawnProbability/100,
          removalTimer: util.ISS(containedPower.powerupData.spawning.removalTimer) * framerate,
          renderOrder: -100 + Math.floor(Math.random() * 100), // bubble render orders from -100 to -1, inclusive
          borderWidth: 10,
        });

        l.powerupsLeftToSpawn--;
        if (l.spawnsOfType[chosenSpawn] > 0) l.spawnsOfType[chosenSpawn]--;
        l.powerupSpawnTimer = util.ISS(rules.powerupSettings. powerupSpawnTimer) * framerate;
      }
    }
    if (l.powerupSpawnTimer > 0) l.powerupSpawnTimer--;
    
    if (!l.inLobby && l.pauseTimer <= 0) switch (rules.gamemode.mode) {
      // Standard
      case 0: {
        // if only one team is left alive, start the round-end timer. Respawning players with extra lives count as alive
        if (l.endGameTimer > 0) {
          l.endGameTimer--;
          if (l.endGameTimer <= 0) l.endGame(rules);
          break;
        }
        
        let teamFound = null;
        let oneLeft = true;
        for (let p of l.players) {
          if (p.ghost && p.remainingLives <= 0 && p.respawnTimer <= 0) continue;
          if (teamFound !== null && teamFound !== p.team) {
            oneLeft = false;
            break;
          } 
          teamFound = p.team;
        }
        if (oneLeft) l.endGameTimer = util.ISS(rules.gamemode.standard.surviveTimer) * framerate;
        break;
      }
      // Arena
      case 1: {
        // increment the timer every check, and if it reaches 0 end the game
        l.gameTimer--;
        if (l.gameTimer <= 0) {
          l.gameTimer = 0;
          let highestPlayer = [l.players[0], false];
          for (let p of l.players) {
            if (p.points > highestPlayer[0].points) highestPlayer = [p, false];
            if (p.points === highestPlayer[0].points && p !== highestPlayer[0]) highestPlayer[1] = true;
          }
          if (highestPlayer[1]) {
            if (rules.gamemode.arena.drawHandling === 1) for (let p of l.players) if (p.points < highestPlayer[0].points) {
              p.kill(p);
              p.respawnTimer = 0;
            }
            if (rules.gamemode.arena.drawHandling !== 0 && rules.gamemode.arena.drawHandling !== 1) l.endGame(rules);
          }
          else l.endGame(rules);
        }
        break;
      }
      // Tag
      case 2: {
        let teamFound = null;
        let oneLeft = true;
        for (let p of l.players) {
          if (p.ghost) continue;
          if (teamFound !== null && teamFound !== p.team) {
            oneLeft = false;
            break;
          } 
          teamFound = p.team;
        }
        if (oneLeft) l.endGame(rules);
        break;
      }
      // Monarch
      case 3: {
        // for every team with a living player, if they have a permanently dead monarch, murder everyone
        if (l.endGameTimer > 0) {
          l.endGameTimer--;
          if (l.endGameTimer <= 0) l.endGame(rules);
          break;
        }
        let livingTeams = [];
        for (let p of l.players) {
          if (p.ghost && p.remainingLives <= 0 && p.respawnTimer <= 0) continue;
          let teamFound = false;
          for (let t of livingTeams) {
            if (t[0] !== p.team) continue;
            teamFound = true;
            if (p.teamMonarch) t[1] = true;
          }
          if (!teamFound) livingTeams.push([p.team, p.teamMonarch]);
        }
        let oneLeft = 1;
        for (let t of livingTeams) {
          if (t[1]) {
            oneLeft--;
            continue;
          }
          for (let p of l.players) if (p.team === t[0]) p.kill(p);
        }
        if (oneLeft >= 0) l.endGameTimer = util.ISS(rules.gamemode.monarch.surviveTimer) * framerate;
        break;
      }
      // King of the Hill
      case 4: {
        // if the countdown timer ever hits 0, end the game in the crown holder's favor
        if (l.gameTimer > 0) {
          l.gameTimer--;
          if (l.gameTimer <= 0) l.endGame(rules);
          break;
        }
        break;
      }
    }
    
    if (l.pauseTimer > 0) {
      l.pauseTimer--;
      if (l.pauseTimer <= 0 && l.refreshAfterTimer) l.refreshLobby(l.remainingGames <= 0);
    }
    else for (let e of l.objects) {
      switch (e.type) {
        case "tank": {
          // if we are dead, reset all our effects, poison, and freeze
          if (e.ghost) e.resetEffects();
          
          // if we are not moving dampen our velocity, if we are not spinning dampen our rotation
          let dampenTorque = true;
          let dampenSpeed = true;
          
          if (e.animationLocked <= 0 && e.controlledObjects.length === 0) {
            if (e.keypressed[0]) {
              e.rotate(-e.maxAngularSpeed/framerate);
              dampenTorque = false;
            }
            if (e.keypressed[1]) {
              e.rotate(e.maxAngularSpeed/framerate);
              dampenTorque = false;
            }
            if (e.keypressed[2]) {
              e.move(1);
              dampenSpeed = false;
            }
            if (e.keypressed[3]) {
              e.move(-1);
              dampenSpeed = false;
            }
          }
          
          if (dampenTorque && e.torqueUnlock <= 0) Body.setAngularVelocity(e.shape, e.shape.angularVelocity * Math.pow(e.angularDampen, 1/framerate));
          if (dampenSpeed) Body.setVelocity(e.shape, {
            x: e.shape.velocity.x * e.dampenRate,
            y: e.shape.velocity.y * e.dampenRate,
          });
          
          // decrease reload and removal timers
          for (let p = e.powerups.length - 1; p >= 0; p--) {
            if (e.powerups[p].remainingReload > 0 && (p === 0 || e.powerups[p].powerupData.firing.reloadWhenUnequipped)) e.powerups[p].remainingReload--;
            if (e.powerups[p].timeRemaining > 0) {
              e.powerups[p].timeRemaining--;
              if (e.powerups[p].timeRemaining <= 0) {
                if (p === 0) e.tankReloadDelay = framerate * e.powerups[p].getAttribute("roundReload");
                e.powerups.splice(p, 1);
                e.refreshPowerups();
              }
            }
          }
          if (e.tankReloadDelay > 0) e.tankReloadDelay--;
          
          
          // firing bullets
          if (e.keypressed[4] && e.animationLocked <= 0 && e.controlledObjects.length === 0) e.attemptFire(e.powerups[0]);
          
          if (e.animationLocked > 0) {
            e.animationLocked--;
            if (e.powerups[0].waitingToFire && e.animationLocked <= 0 && e.controlledObjects.length === 0) e.attemptFire(e.powerups[0]);
          }
          
          // tank opacity effects
          for (let i = e.opacityEffects.length - 1; i >= 0; i--) {
            if (e.opacityEffects[i].fadeIn > 0) e.opacityEffects[i].fadeIn--;
            else if (e.opacityEffects[i].duration > 0) e.opacityEffects[i].duration--;
            else if (e.opacityEffects[i].fadeOut > 0) e.opacityEffects[i].fadeOut--;
            else e.opacityEffects.splice(i, 1);
          }
          // tank speed effects
          for (let i = e.speedEffects.length - 1; i >= 0; i--) {
            if (e.speedEffects[i].fadeIn > 0) e.speedEffects[i].fadeIn--;
            else if (e.speedEffects[i].duration > 0) e.speedEffects[i].duration--;
            else if (e.speedEffects[i].fadeOut > 0) e.speedEffects[i].fadeOut--;
            else e.speedEffects.splice(i, 1);
          }
          // tank vision effects
          for (let i = e.visionEffects.length - 1; i >= 0; i--) {
            if (e.visionEffects[i].fadeIn > 0) e.visionEffects[i].fadeIn--;
            else if (e.visionEffects[i].duration > 0) e.visionEffects[i].duration--;
            else if (e.visionEffects[i].fadeOut > 0) e.visionEffects[i].fadeOut--;
            else e.visionEffects.splice(i, 1);
          }
          // tank bubble effects
          for (let i = e.bubbleEffects.length - 1; i >= 0; i--) {
            if (e.bubbleEffects[i].fadeIn > 0) e.bubbleEffects[i].fadeIn--;
            else if (e.bubbleEffects[i].duration > 0) e.bubbleEffects[i].duration--;
            else if (e.bubbleEffects[i].fadeOut > 0) e.bubbleEffects[i].fadeOut--;
            else e.bubbleEffects.splice(i, 1);
          }
          
          // update shield positions
          for (let i = 0; i < e.shields.length; i++) {
            Body.setPosition(e.shields[i].shieldObject.shape, {x: e.shape.position.x, y: e.shape.position.y});
            if (e.shields[i].timeRemaining > 0) {
              e.shields[i].timeRemaining--;
              if (e.shields[i].timeRemaining <= 0) {
                e.shields[i].shieldObject.annihilate();
                e.shields.splice(i, 1);
                i--;
              }
            }
          }
          
          e.takePoisonDamage();
          
          // add our regen to our tank health, or count down the timer if we are during impact frames
          if (e.regeneration.leftoverTimer > 0 && (e.regeneration.raw > 0 || e.regeneration.percentage > 0)) e.regeneration.leftoverTimer--;
          
          if (e.regeneration.leftoverTimer <= 0 && e.health < e.maxHealth && !e.ghost) {
            e.health += e.regeneration.raw / framerate;
            e.health += (e.maxHealth - e.health) * e.regeneration.percentage/framerate;
            e.health = Math2.clamp(e.health, 0, e.maxHealth);
          }
          
          // if we are dead and on a timer respawn us, or if we are below 0 health also kill us
          if (e.respawnTimer > 0) {
            e.respawnTimer--;
            if (e.respawnTimer <= 0) {
              e.ghost = false;
              e.noLerpThisFrame = true;
              e.health = util.settingConstrain(
                rules.personal.tankHealth,
                e.clientSettings.personal.tankHealth
              );
              e.killer = null;
              e.killerTeam = null;
              if (!l.inLobby && rules.gamemode.mode === 3 && !e.teamMonarch) {
                let teamMonarch = null;
                for (let p of l.players) {
                  if (p.teamMonarch && p.team === e.team) {
                    teamMonarch = p;
                    break;
                  }
                }
                e.lobby.randomLocation(e, {
                  type: 0,
                  x: teamMonarch.shape.position.x,
                  y: teamMonarch.shape.position.y,
                  r: Math.min(util.ISS(rules.gamemode.monarch.spawnRadius), e.lobby.size.width + e.lobby.size.height)
                }, true);
              }
              else e.lobby.randomLocation(e, {type: 1, w: e.lobby.size.width, h: e.lobby.size.height, x: 0, y: 0});
              Body.setAngle(e.shape, Math.random() * 2 * Math.PI);
              e.usedCam = e.camera;
              e.noForm = false;
            }
          }
          else if (e.health <= 0) e.kill();
          break;
        }
        case "bullet": {
          const freezeMult = e.getFreezeMultiplier();
          if (!e.parent.controlledObjects.includes(e) || (e.powerupRef.powerupData.misc.forceMotion && e.powerupRef.powerupData.misc.bounceOnWalls)) {
            if (e.powerupRef.powerupData.interactions.physicallyCollideWithTanks && e.torqueUnlock > 0) {
              e.constantVelocity = e.shape.speed;
            }
            Body.setSpeed(e.shape, e.constantVelocity * freezeMult);
            if (e.shape.speed === 0) {
              Body.setVelocity(e.shape, {
                x: Math.cos(e.lastAngle) * e.constantVelocity * freezeMult,
                y: Math.sin(e.lastAngle) * e.constantVelocity * freezeMult,
              });
            }
            Body.setAngularSpeed(e.shape, 0);
            if (e.constantVelocity * freezeMult > 0) {
              let newAngle = Math.atan2(e.shape.velocity.y, e.shape.velocity.x);
              if (Math.abs(Math2.normalizeAngle(e.lastAngle) - Math2.normalizeAngle(newAngle)) > 0.1) e.noLerpThisFrame = true;
              Body.setAngle(e.shape, newAngle);
            }
            if (e.parent.controlledObjects.includes(e) && e.powerupRef.powerupData.misc.forceMotion) {
              if (e.parent.keypressed[0]) {
                Body.setAngle(e.shape, e.shape.angle - e.forceMotionRotationSpeed/framerate);
              }
              if (e.parent.keypressed[1]) {
                Body.setAngle(e.shape, e.shape.angle + e.forceMotionRotationSpeed/framerate);
              }
              Body.setVelocity(e.shape, {
                x: Math.cos(e.shape.angle) * e.constantVelocity * freezeMult,
                y: Math.sin(e.shape.angle) * e.constantVelocity * freezeMult,
              });
            }
          }
          else {
            // if we are being controlled, do that
            Body.setAngularSpeed(e.shape, 0);
            if (e.parent.keypressed[0]) {
              Body.setAngle(e.shape, e.shape.angle - e.forceMotionRotationSpeed/framerate);
            }
            if (e.parent.keypressed[1]) {
              Body.setAngle(e.shape, e.shape.angle + e.forceMotionRotationSpeed/framerate);
            }
            if (!e.powerupRef.powerupData.misc.forceMotion) {
              let dampenSpeed = true;
              if (e.parent.keypressed[2]) {
                Body.setVelocity(e.shape, {
                  x: Math.cos(e.lastAngle) * e.constantVelocity * freezeMult,
                  y: Math.sin(e.lastAngle) * e.constantVelocity * freezeMult,
                });
                dampenSpeed = false;
              }
              if (e.parent.keypressed[3]) {
                Body.setVelocity(e.shape, {
                  x: -Math.cos(e.lastAngle) * e.constantVelocity * freezeMult,
                  y: -Math.sin(e.lastAngle) * e.constantVelocity * freezeMult,
                });
                dampenSpeed = false;
              }
              if (dampenSpeed) Body.setSpeed(e.shape, 0);
            }
            else Body.setVelocity(e.shape, {
              x: Math.cos(e.lastAngle) * e.constantVelocity * freezeMult,
              y: Math.sin(e.lastAngle) * e.constantVelocity * freezeMult,
            });
          }
          
          if (e.shape.speed > 0) e.lastAngle = e.shape.angle;
          
          // if we have any constant collisions, check them then collide
          if (e.powerupRef.powerupData.interactions.constantCollide) {
            for (let c = e.constantCollisions.length - 1; c >= 0; c--) {
              if (!Collision.collides(e.shape, e.constantCollisions[c].shape)) {
                e.constantCollisions.splice(c, 1);
                continue;
              }
              Matter.Events.trigger(l.engine, 'collisionStart', {pairs: [Matter.Pair.create(Collision.create(e.shape, e.constantCollisions[c].shape))]});
            }
          }
          
          e.takePoisonDamage();
          
          if (e.health <= 0) {
            e.annihilate(0);
          }
          
          if (e.range > 0) {
            e.range--;
            if (e.range <= 0) {
              e.annihilate(1);
            }
          }
          
          if (e.armed) {
            let goingToExplode = true;
            for (let holder of l.objects) {
              if (holder.type !== "tank") continue;
              if (Collision.collides(holder.shape, e.shape) !== null && !e.ghost) {
                goingToExplode = false;
                break;
              }
            }
            if (goingToExplode && ! e.deletingThisFrame) e.annihilate(0);
          }
          
          if (e.drawTrail) {
            e.trailTimer--;
            if (e.trailTimer <= 0) {
              e.trailTimer = e.powerupRef.powerupData.misc.trailInterval * framerate;
              e.trailPoints.push(e.shape.position.x, e.shape.position.y, e.powerupRef.powerupData.misc.trailLength * framerate);
            }
            if (e.powerupRef.powerupData.misc.trailLength > 0) for (let t = e.trailPoints.length - 1; t >= 0; t -= 3) {
              e.trailPoints[t]--;
              if (e.trailPoints[t] <= 0) e.trailPoints.splice(t - 2, 3);
            }
          }
          
          // passive particle release
          const particleRules = e.powerupRef.powerupData.particles;
          if (e.particleRelease.enabled) {
            if (e.particleRelease.timer <= 0) e.particleRelease.delayed = false;
            if (e.particleRelease.timer <= 0 && e.particleRelease.passiveRelease) {
              let spawning = l.createPowerupFromId(particleRules.passiveReleaseBulletId);
              if (spawning !== null) {
                e.fire({
                  fromBullet: true,
                }, spawning);
                e.particleRelease.timer = framerate * (particleRules.passiveRelease.lockTimer ? e.particleRelease.lockedTimer : util.ISS(particleRules.passiveRelease.timer));
                if (e.particleRelease.maxReleasedBullets > 0) {
                  e.particleRelease.maxReleasedBullets--;
                  if (e.particleRelease.maxReleasedBullets <= 0) e.particleRelease.enabled = false;
                }
              }
            }
            else e.particleRelease.timer--;
            if (e.particleRelease.duration > 0 && !e.particleRelease.delayed) {
              e.particleRelease.duration--;
              if (e.particleRelease.duration <= 0) e.particleRelease.enabled = false;
            }
          }
          
          // visual rotation from angular speed
          e.addedAngle += e.rotationSpeed / framerate;
          
          // rotate the bullet based on angular adjustments
          if (e.rotationAdjustments.enabled) {
            if (e.rotationAdjustments.delay > 0) e.rotationAdjustments.delay--;
            else {
              if (e.rotationAdjustments.unlockedTimer > 0) {
                e.rotationAdjustments.unlockedTimer--;
                if (e.rotationAdjustments.unlockedTimer <= 0) {
                  e.rotationAdjustments.unlockedTimer = framerate;
                  e.rotationAdjustments.second = util.ISS(e.powerupRef.powerupData.adjustments.rotation.changePer.second) * Math.PI/180;
                  e.rotationAdjustments.bounce = util.ISS(e.powerupRef.powerupData.adjustments.rotation.changePer.bounce) * Math.PI/180;
                  e.rotationAdjustments.collision = util.ISS(e.powerupRef.powerupData.adjustments.rotation.changePer.collision) * Math.PI/180;
                }
              }
              
              const totalChange = e.rotationAdjustments.second;
              if (e.rotationAdjustments.applyToAngular) {
                e.rotationSpeed += totalChange/framerate;
              } else {
                Body.setVelocity(e.shape, {
                  x: Math.cos(e.shape.angle + totalChange/framerate) * e.shape.speed,
                  y: Math.sin(e.shape.angle + totalChange/framerate) * e.shape.speed,
                });
                Body.setAngle(e.shape, e.shape.angle + totalChange/framerate);
              }
              
              if (e.rotationAdjustments.duration > 0) {
                e.rotationAdjustments.duration--;
                if (e.rotationAdjustments.duration <= 0) e.rotationAdjustments.enabled = false;
              }
            }
          }
          
          // acceleration adjustments
          if (e.accelerationAdjustments.enabled) {
            if (e.accelerationAdjustments.delay > 0) e.accelerationAdjustments.delay--;
            else {
              if (e.accelerationAdjustments.unlockedTimer > 0) {
                e.accelerationAdjustments.unlockedTimer--;
                if (e.accelerationAdjustments.unlockedTimer <= 0) e.resetAdjustment(e.accelerationAdjustments, e.powerupRef.powerupData.adjustments.acceleration.changePer, 0.01);
              }
              
              e.constantVelocity += e.accelerationAdjustments.secondAdd / framerate;
              e.constantVelocity *= Math.pow(e.accelerationAdjustments.secondMult, 1/framerate);
              e.constantVelocity = Math2.clamp(e.constantVelocity, e.accelerationAdjustments.minSpeed, e.accelerationAdjustments.maxSpeed);
              if (!e.powerupRef.powerupData.interactions.physicallyCollideWithTanks) Body.setSpeed(e.shape, e.constantVelocity);
              
              if (e.accelerationAdjustments.duration > 0) {
                e.accelerationAdjustments.duration--;
                if (e.accelerationAdjustments.duration <= 0) e.accelerationAdjustments.enabled = false;
              }
            }
          }
          
          // size adjustments
          if (e.sizeAdjustments.enabled) {
            if (e.sizeAdjustments.delay > 0) e.sizeAdjustments.delay--;
            else {
              if (e.sizeAdjustments.unlockedTimer > 0) {
                e.sizeAdjustments.unlockedTimer--;
                if (e.sizeAdjustments.unlockedTimer <= 0) e.resetAdjustment(e.sizeAdjustments, e.powerupRef.powerupData.adjustments.sizeChange.changePer, 0.01 * e.sizeAdjustments.base);
              }
              
              if (e.sizeAdjustments.secondAdd !== 0) e.scale(0, e.sizeAdjustments.secondAdd / framerate);
              if (e.sizeAdjustments.secondMult !== 1) e.scale(1, Math.pow(e.sizeAdjustments.secondMult, 1/framerate));
              e.scale(2, e.sizeAdjustments.minSize, e.sizeAdjustments.maxSize);
              
              if (e.sizeAdjustments.duration > 0) {
                e.sizeAdjustments.duration--;
                if (e.sizeAdjustments.duration <= 0) e.sizeAdjustments.enabled = false;
              }
            }
          }
          
          // range adjustments
          if (e.rangeAdjustments.enabled) {
            if (e.rangeAdjustments.delay > 0) e.rangeAdjustments.delay--;
            else {
              if (e.rangeAdjustments.unlockedTimer > 0) {
                e.rangeAdjustments.unlockedTimer--;
                if (e.rangeAdjustments.unlockedTimer <= 0) e.resetAdjustment(e.rangeAdjustments, e.powerupRef.powerupData.adjustments.rangeCut.changePer, 1);
              }
              
              e.range += e.rangeAdjustments.secondAdd;
              e.range *= Math.pow(e.rangeAdjustments.secondMult, 1/framerate);
              e.range = Math2.clamp(e.range, 0, e.rangeAdjustments.maxRange);
              if (e.range <= 0) e.annihilate(1);
              
              if (e.rangeAdjustments.duration > 0) {
                e.rangeAdjustments.duration--;
                if (e.rangeAdjustments.duration <= 0) e.rangeAdjustments.enabled = false;
              }
            }
          }
          
          // opacity adjustments
          if (e.opacityAdjustments.enabled) {
            if (e.opacityAdjustments.delay > 0) e.opacityAdjustments.delay--;
            else {
              if (e.opacityAdjustments.unlockedTimer > 0) {
                e.opacityAdjustments.unlockedTimer--;
                if (e.opacityAdjustments.unlockedTimer <= 0) e.resetAdjustment(e.opacityAdjustments, e.powerupRef.powerupData.adjustments.opacityChange.changePer, 0.01 * e.opacityAdjustments.base);
              }
              
              e.opacity += e.opacityAdjustments.secondAdd / framerate;
              e.opacity *= Math.pow(e.opacityAdjustments.secondMult, 1/framerate);
              e.opacity = Math2.clamp(e.opacity, e.opacityAdjustments.minOpacity, e.opacityAdjustments.maxOpacity);
              
              if (e.opacityAdjustments.duration > 0) {
                e.opacityAdjustments.duration--;
                if (e.opacityAdjustments.duration <= 0) e.opacityAdjustments.enabled = false;
              }
            }
          }
          
          // health adjustments
          if (e.healthAdjustments.enabled) {
            if (e.healthAdjustments.delay > 0) e.healthAdjustments.delay--;
            else {
              if (e.healthAdjustments.unlockedTimer > 0) {
                e.healthAdjustments.unlockedTimer--;
                if (e.healthAdjustments.unlockedTimer <= 0) e.resetAdjustment(e.healthAdjustments, e.powerupRef.powerupData.health.healthChange.changePer, 1);
              }
              
              const placeholderHealth = parseFloat(e.health);
              e.health += e.healthAdjustments.secondAdd / framerate;
              e.health *= Math.pow(e.healthAdjustments.secondMult, 1/framerate);
              e.health = Math2.clamp(e.health, 0, e.healthAdjustments.maxHealth);
              if (e.health <= 0) e.annihilate(0);
              if (e.health < placeholderHealth) e.damagedThisFrame = true;
              
              if (e.healthAdjustments.duration > 0) {
                e.healthAdjustments.duration--;
                if (e.healthAdjustments.duration <= 0) e.healthAdjustments.enabled = false;
              }
            }
          }
          
          // damage resist adjustments
          if (e.resistAdjustments.enabled) {
            if (e.resistAdjustments.delay > 0) e.resistAdjustments.delay--;
            else {
              if (e.resistAdjustments.unlockedTimer > 0) {
                e.resistAdjustments.unlockedTimer--;
                if (e.resistAdjustments.unlockedTimer <= 0) e.resetAdjustment(e.resistAdjustments, e.powerupRef.powerupData.health.damageResistChange.changePer, 1);
              }
              
              e.damageResistance += e.resistAdjustments.secondAdd / framerate;
              e.damageResistance *= Math.pow(e.resistAdjustments.secondMult, 1/framerate);
              e.damageResistance = Math2.clamp(e.damageResistance, e.resistAdjustments.minResist, e.resistAdjustments.maxResist);
              
              if (e.resistAdjustments.duration > 0) {
                e.resistAdjustments.duration--;
                if (e.resistAdjustments.duration <= 0) e.resistAdjustments.enabled = false;
              }
            }
          }
          
          // bubble size adjustments
          if (e.bubbleSizeAdjustments.enabled) {
            if (e.bubbleSizeAdjustments.delay > 0) e.bubbleSizeAdjustments.delay--;
            else {
              if (e.bubbleSizeAdjustments.unlockedTimer > 0) {
                e.bubbleSizeAdjustments.unlockedTimer--;
                if (e.bubbleSizeAdjustments.unlockedTimer <= 0) e.resetAdjustment(e.bubbleSizeAdjustments, e.powerupRef.powerupData.light.bubbleSizeChange.changePer, 1);
              }
              
              e.lights[0].circle += e.bubbleSizeAdjustments.secondAdd * 4.5/16 / framerate;
              e.lights[0].circle *= Math.pow(e.bubbleSizeAdjustments.secondMult, 1/framerate);
              e.lights[0].circle = Math2.clamp(e.lights[0].circle, e.bubbleSizeAdjustments.minSize, e.bubbleSizeAdjustments.maxSize);
              
              if (e.bubbleSizeAdjustments.duration > 0) {
                e.bubbleSizeAdjustments.duration--;
                if (e.bubbleSizeAdjustments.duration <= 0) e.bubbleSizeAdjustments.enabled = false;
              }
            }
          }
          
          // bubble opacity adjustments
          if (e.bubbleOpacityAdjustments.enabled) {
            if (e.bubbleOpacityAdjustments.delay > 0) e.bubbleOpacityAdjustments.delay--;
            else {
              if (e.bubbleOpacityAdjustments.unlockedTimer > 0) {
                e.bubbleOpacityAdjustments.unlockedTimer--;
                if (e.bubbleOpacityAdjustments.unlockedTimer <= 0) e.resetAdjustment(e.bubbleOpacityAdjustments, e.powerupRef.powerupData.light.bubbleOpacityChange.changePer, 0.01);
              }
              
              e.lights[0].opacity += e.bubbleOpacityAdjustments.secondAdd / framerate;
              e.lights[0].opacity *= Math.pow(e.bubbleOpacityAdjustments.secondMult, 1/framerate);
              e.lights[0].opacity = Math2.clamp(e.lights[0].opacity, e.bubbleOpacityAdjustments.minOpacity, e.bubbleOpacityAdjustments.maxOpacity);
              
              if (e.bubbleOpacityAdjustments.duration > 0) {
                e.bubbleOpacityAdjustments.duration--;
                if (e.bubbleOpacityAdjustments.duration <= 0) e.bubbleOpacityAdjustments.enabled = false;
              }
            }
          }
          
          // if we have targeting enabled, we use A* pathfinding in order to find a path towards the tank in the maze
          if (e.targeting.enabled) {
            if (e.targeting.delay > 0) e.targeting.delay--;
            else if (e.targeting.remainingInterval > 0) {
              e.targeting.remainingInterval--;
              if (e.targeting.duration > 0) {
                e.targeting.duration--;
                if (e.targeting.duration <= 0) e.targeting.enabled = false;
              }
            }
            else {
              e.targeting.remainingInterval = parseInt(e.targeting.interval);
              
              if (e.targeting.unlocked) {
                e.targeting.lerp = util.ISS(e.powerupRef.powerupData.adjustments.targeting.adjustmentLerp) / 100;
                e.targeting.inaccuracy = util.ISS(e.powerupRef.powerupData.adjustments.targeting.adjustmentInaccuracy) * Math.PI/180;
              }
              
              // get the closest tank to us
              let closest = [-1, null];
              for (let t of l.objects) {
                if (t.type !== "tank" && t.type !== "bullet") continue;
                if (t.type === "bullet" && !e.targeting.targetBullets) continue;
                if (t.ghost) continue;
                if (e === t) continue;
                if (!e.targeting.targetsSame && e.parent === t) continue;
                if (!e.targeting.targetsTeam && e.team === t.team) continue;
                let calcDist = Math2.dist(e.shape.position, t.shape.position);
                if (closest[0] === -1 || calcDist < closest[0]) closest = [calcDist, t];
              }
              if (closest[0] === -1) break;

              let angleToTarget = 0;
              switch (e.targeting.type) {
                case 0: {
                  // absolute target, just move towards the closest tank ignoring obstacles
                  angleToTarget = Math.atan2(closest[1].shape.position.y - e.shape.position.y, closest[1].shape.position.x - e.shape.position.x);
                  break;
                }
                case 1: {
                  // tracking to the target using A* pathfinding
                  let pathInfo = l.pathfindToTarget(e, closest[1]);
                  if (pathInfo === null) pathInfo = closest[1].shape.position;
                  angleToTarget = Math.atan2(pathInfo.y - e.shape.position.y, pathInfo.x - e.shape.position.x);
                }
              }
              
              angleToTarget += e.targeting.inaccuracy;
              let adjustedShapeAngle = (e.shape.angle + (Math.PI * 200)) % (Math.PI * 2);
              let adjustedNewAngle = (angleToTarget + (Math.PI * 200)) % (Math.PI * 2);
              if (Math.abs(adjustedShapeAngle - adjustedNewAngle) > Math.PI) adjustedShapeAngle -= Math.PI * 2;
              
              angleToTarget = Math2.lerp(adjustedShapeAngle, adjustedNewAngle, e.targeting.lerp);
              
              Body.setVelocity(e.shape, {
                x: Math.cos(angleToTarget) * e.shape.speed,
                y: Math.sin(angleToTarget) * e.shape.speed,
              });
              Body.setAngle(e.shape, angleToTarget);
              
              if (e.targeting.duration > 0) {
                e.targeting.duration--;
                if (e.targeting.duration <= 0) e.targeting.enabled = false;
              }
            }
          }
          
          break;
        }
        case "bubble": {
          if (e.containedPower.powerupData.spawning.removeOnTimer) {
            e.removalTimer--;
            if (e.removalTimer <= 0) e.annihilate();
          }
          
          if (e.oldUser !== null) {
            if (Collision.collides(e.oldUser.shape, e.shape) === null) {
              e.oldUser = null;
            }
          }
          break;
        }
        case "box": {
          Body.setSpeed(e.shape, e.shape.speed * e.dampenRate);
          Body.setAngularSpeed(e.shape, e.shape.angularSpeed * e.dampenRate);
        }
        case "wall": {
          if (e.fadingTimer > 0) {
            if (e.opacityFadeTime !== 0) {
              e.opacity = Math2.lerp(e.initialOpacity, e.opacityOnCollide, e.fadingTimer / e.opacityFadeTime);
              e.fadingTimer--;
            }
            else e.opacity = e.opacityOnCollide;
          }
          else e.opacity = e.initialOpacity;
          break;
        }
      }
      
      if (e.torqueUnlock > 0) e.torqueUnlock--;
      
      if (l.host.clientSettings.maze.wrap) {
        if (e.shape.position.x >= l.size.width/2) {
          Body.setPosition(e.shape, {
            x: e.shape.position.x - (Math.floor(e.shape.position.x/l.size.width) + 1) * l.size.width,
            y: e.shape.position.y
          });
        }
        if (e.shape.position.x <= -l.size.width/2) {
          Body.setPosition(e.shape, {
            x: e.shape.position.x + (Math.abs(Math.floor(e.shape.position.x/l.size.width))) * l.size.width,
            y: e.shape.position.y
          });
        }
        if (e.shape.position.y >= l.size.height/2) {
          Body.setPosition(e.shape, {
            x: e.shape.position.x,
            y: e.shape.position.y - (Math.floor(e.shape.position.y/l.size.height) + 1) * l.size.height
          });
        }
        if (e.shape.position.y <= -l.size.height/2) {
          Body.setPosition(e.shape, {
            x: e.shape.position.x,
            y: e.shape.position.y + (Math.abs(Math.floor(e.shape.position.y/l.size.height))) * l.size.height
          });
        }
      }
    }
    
    // use subframes if our server isn't too slow
    let framesToSpare = 5;
    if (l.objects.length > 100) framesToSpare = 3;
    if (l.objects.length > 200) framesToSpare = 1;
    if (l.pauseTimer <= 0) for (let f = 0; f < framesToSpare; f++) Engine.update(l.engine, 1000/framerate/framesToSpare);
    testingvar = false;
    // tell each camera to get their objects, so that we can add objects of visible lights based on their own bubble.
    for (let o of l.objects) for (let light of o.lights) light.getVisibleObjects();
    
    // update the cameras to use the right values before doing a render pass
    for (let o of l.objects) for (let light of o.lights) light.updateFrame();
    for (let p of l.players) {
      for (let light of p.lights) light.getUsedVision();
    }
    for (let p of l.players) {
      if (!p.usedCam) continue;
      let lightData = p.usedCam.getLights();
      let cameraData = p.usedCam.getView();
      let cameraExtra = p.usedCam.getExtra();
      let backpackData = p.getBackpackData();
      p.socket.talk(util.encodePacket(
        [protocol.gameupdate, cameraData, lightData, cameraExtra, backpackData], 
        ["int8", "float32arrayarray", "float32arrayarray", "float32array", "float32arrayarray"]
      ));
      p.resetLerp = false;
      p.updateBackpack = false;
    }
    for (let o = l.objects.length - 1; o >= 0; o--) {
      l.objects[o].noLerpThisFrame = false;
      if (l.objects[o].deletingThisFrame) l.objects[o].delete();
    }
  }
  serverSpeed++;
}
setInterval(update, 1000/framerate);

// loops over things like leaderboard, which can be updated only 4 times a second and still be fine
function lowPriorityLoop() {
  for (let l of Lobby.lobbies) {
    for (let p of l.players) {
      p.getLeaderboard(p.lobby.inLobby);
      p.socket.talk(util.encodePacket([protocol.timerUpdate, l.gameTimer / framerate], ["int8", "float32"]));
    }
  }
}
setInterval(lowPriorityLoop, 250);

let testingInterval = 2000;
setInterval(function() {
  if (serverSpeed/(testingInterval/1000) <= 20) console.log("Framerate dropped to " + serverSpeed/(testingInterval/1000) + "fps");
  serverSpeed = 0;
}, testingInterval);