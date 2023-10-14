const { Game } = require("@gathertown/gather-game-client");
global.WebSocket = require("isomorphic-ws");
const fs = require("fs");
const easystarjs = require("easystarjs");
require('colors').enable();

class NPC {
    actionQueue = [];
    actionQueueMessageSent = false;
    game = null;
    loadedModules = [];
    awaitingPlayerChats = {};
    permissions = null;
    config = null;

    commands = {
        cancel: {
            "description": "/cancel\nCancel the current action",
            "permission": "all",
            "action": (senderId) => {
                this.awaitingPlayerChats[senderId] = null;
            }
        }
    };

    constructor(config, modules=[]) {
        //load the config from file
        if (typeof config === "string") {
            config = "../" + config;
            config = require(config);
        }
        //update modules list if included in config
        if (config.modules) {
            modules = modules.concat(config.modules);
        }

        //update the NPC object with config options and defaults
        config.npcData.isNpc = true;
        config.npcData.map = config.npcData.map || config.mapId;
        config.npcData.isSignedIn = config.npcData.isSignedIn || true;

        this.config = config;

        //register permission commands
        this.registerCommand("op", "Give a player OP permissions (allow them to execute any command)", "op", async (senderId) => {
            const playerId = await this.playerSelection("Please select a player to give OP permissions to:", senderId);

            if(this.checkPermission(playerId, "op")) {
                this.sendMessage(this.game.players[playerId].name + " already has OP permissions.", senderId);
                return;
            }

            this.permissions[playerId] = this.permissions[playerId] || {};
            this.permissions[playerId].op = true;

            this.savePermissions();

            this.sendMessage(this.game.players[playerId].name + " now has OP permissions.", senderId);
        });

        this.registerCommand("deop", "Remove a player's OP permissions", "op", async (senderId) => {
            //get a list of player ids with OP permissions
            const opPlayers = Object.keys(this.permissions).filter(playerId => this.permissions[playerId].op && playerId !== senderId);
            if(opPlayers.length === 0) {
                this.sendMessage("No other players have OP permissions.", senderId);
                return;
            }

            const playerId = await this.playerSelection("Please select a player to remove OP permissions from:", senderId, opPlayers);

            if(!this.checkPermission(playerId, "op")) {
                this.sendMessage(this.game.players[playerId].name + " does not have OP permissions.", senderId);
                return;
            }

            this.permissions[playerId].op = false;

            this.savePermissions();

            this.sendMessage(this.game.players[playerId].name + " no longer has OP permissions.", senderId);
        });

        this.registerCommand("give <command_name>", "Give a player permission to execute a command", "op", async (senderId, commandName) => {
            //params[0] = command
            if(!commandName) {
                this.sendMessage("Please specify a command. Try /give <command_name>", senderId);
                return;
            }
            if(!this.commands[commandName]) {
                this.sendMessage("Command not found.", senderId);
                return;
            }

            const playerId = await this.playerSelection("Please select a player to give permission to:", senderId);

            if(this.checkPermission(playerId, "", commandName)) {
                this.sendMessage(this.game.players[playerId].name + " already has permission to execute /" + commandName, senderId);
                return;
            }

            this.permissions[playerId] = this.permissions[playerId] || {};
            this.permissions[playerId].permissions = this.permissions[playerId].permissions || [];
            this.permissions[playerId].permissions.push(commandName);

            this.savePermissions();

            this.sendMessage(this.game.players[playerId].name + " now has permission to execute /" + commandName, senderId);
        });

        this.registerCommand("revoke <command_name>", "Remove a player's permission to execute a command", "op", async (senderId, commandName) => {

            if(!commandName) {
                this.sendMessage("Please specify a command. Try /revoke <command_name>", senderId);
                return;
            }
            if(!this.commands[commandName]) {
                this.sendMessage("Command not found.", senderId);
                return;
            }

            //get a list of player ids with permission to execute this command
            const players = Object.keys(this.permissions).filter(playerId => this.permissions[playerId].permissions && this.permissions[playerId].permissions.includes(commandName) && playerId !== senderId);

            if(players.length === 0) {
                this.sendMessage("No other players have permission to execute /" + commandName, senderId);
                return;
            }

            const playerId = await this.playerSelection("Please select a player to revoke permission from:", senderId, players);

            if(!this.checkPermission(playerId, "", commandName)) {
                this.sendMessage(this.game.players[playerId].name + " does not have permission to execute /" + commandName, senderId);
                return;
            }

            this.permissions[playerId].permissions = this.permissions[playerId].permissions.filter(command => command !== commandName);

            this.savePermissions();

            this.sendMessage(this.game.players[playerId].name + " no longer has permission to execute /" + commandName, senderId);
        });

        //list all users and their permissions
        this.registerCommand("permissions", "List all users and their permissions", "op", (senderId) => {
            let message = "Permissions:\n";
            Object.keys(this.permissions).forEach(playerId => {
                if(!this.permissions[playerId].op && (!this.permissions[playerId].permissions || this.permissions[playerId].permissions.length === 0)) return;
                message += "\n" + this.game.players[playerId].name + ": " + (this.permissions[playerId].op ? "OP" : (this.permissions[playerId].permissions?.join(", ") || ""));
            });
            this.sendMessage(message, senderId);
        });

        //initialize and join the game
        this.game = new Game(config.spaceId, () => Promise.resolve({ apiKey: config.apiKey }));

        //connect to the game
        this.game.connect();

        this.game.subscribeToConnection(async (connected) => {
            if (connected) {
                this.game.enter(config.npcData);
                await this.game.waitForInit();

                console.log(("\nConnected to Gather as " + config.npcData.name + "!\n").green);

            }
        });
        
        //load modules
        modules.forEach((module) => {
            this.loadModule(module);
        });

        //list which modules are loaded (options are any folder in the modules folder)
        const possibleModules = fs.readdirSync("./modules").filter((file) => {
            return fs.statSync("./modules/" + file).isDirectory();
        });
        console.log("\n\nLoaded modules: ");
        for (let i = 0; i < possibleModules.length; i++) {
            const module = possibleModules[i];
            if (!this.loadedModules.includes(module)) {
                if(modules.includes(module)) {
                    console.log(module.red + " (failed to load)");
                } else {
                    console.log(module.strikethrough);
                }
            } else {
                console.log(module.green);
            }
        }

        //listen for messages
        this.game.subscribeToEvent("playerChats", data => {
            if(data.playerChats.recipient !== this.game.getMyPlayer().id) return;

            //handle the message
            this.handlePlayerDM(data.playerChats.senderId, data.playerChats.contents);
        });

        //action queue
        setInterval(() => {
            if (this.actionQueue.length > 0) {
                const action = this.actionQueue.shift();
                this.runAction(action.gameFunction, action.params);
            }
        }, 100);

        //movement
        setInterval(() => {
            this.move();
        }, 200);
    };

    //prevent rate limiting with an action queue
    queueAction = (gameFunction, ...params) => {
        this.actionQueue.push({ gameFunction, params });
        if(this.actionQueue.length >= 10 && (!this.actionQueueMessageSent || new Date().getTime() - this.actionQueueMessageSent > 1000 * 30)) {
            console.log(("Action queue is filling up (" + this.actionQueue.length + " actions queued).").yellow);
            this.actionQueueMessageSent = new Date().getTime();
        }
    };
    
    runAction = (gameFunction, params) => {
        params = params || [];
        this.game[gameFunction].call(this.game, ...params);
    };

    //load a module
    loadModule = (moduleFolder) => {
        if (this.loadedModules.includes(moduleFolder)) {
            return;
        }

        try{
            const { init } = require("../modules/" + moduleFolder);
            init(this);
        } catch (e) {
            console.error(`Error loading module ${moduleFolder}: ${e}`.red);
            return;
        }
        
        this.loadedModules.push(moduleFolder);
    };

    //send a message to a user
    sendMessage = (message, targetId) => {
        this.queueAction("chat", targetId, [], this.game.players[targetId].map, {contents: message});
    };

    //wait for a user to respond to a message
    awaitResponse = (targetId) => {
        return new Promise((resolve) => {
            this.awaitingPlayerChats[targetId] = resolve;
        });
    };

    //handle a dm sent to the NPC
    handlePlayerDM = (playerId, message) => {
        //check for command

        //check for a command
        if(message.startsWith("/")) {
            const message_parts = message.split(" ");
            const command = message_parts[0].substring(1);
            const params = message_parts.slice(1);

            if (this.commands[command]) {
                if(this.checkPermission(playerId, this.commands[command].permission, command)) {
                    //reset awaiting player chats
                    this.awaitingPlayerChats[playerId] = null;
                    //run the command
                    this.commands[command].action(playerId, ...params);
                    return;
                }
            }
        }

        //check if we are awaiting a response from this player
        if (this.awaitingPlayerChats[playerId]) {
            this.awaitingPlayerChats[playerId](message);
            this.awaitingPlayerChats[playerId] = null;
            return;
        }

        //nothing happened, let the player know we don't understand
        this.sendMessage("Sorry, I don't understand.\n\nHere are some commands you can try:\n\n" + Object.keys(this.commands).filter(command=>this.checkPermission(playerId, this.commands[command].permission, command)).map((command) => {
            return this.commands[command].description + "\n"
        }).join("\n"), playerId);
    };

    //check permission of a player
    checkPermission = (playerId, permissionLevel, command) => {
        if(permissionLevel === "all") return true;
        //get permissions file
        if(!this.permissions) this.permissions = require("../permissions.json");
        if(!this.permissions[playerId]) return false;
        //check if the player is OP
        if(this.permissions[playerId].op) return true;
        if(permissionLevel === "op") return false;
        //check if the player has permission for the command
        return this.permissions[playerId].permissions?.includes(command);
    };

    savePermissions = () => {
        //fill in names where available
        for(const playerId in this.permissions) {
            if(!this.permissions[playerId]?.name) {
                this.permissions[playerId].name = this.game.players[playerId].name;
            }
        }
        fs.writeFileSync("./permissions.json", JSON.stringify(this.permissions, null, 4));
    };

    //add command function
    registerCommand = (command, description, permission, action) => {
        const commandName = command.split(" ")[0];
        description = "/" + command + "\n" + description;
        if(this.commands[commandName]) console.log(`Warning: Command ${commandName} already exists, overwriting.`.red);
        this.commands[commandName] = {
            description,
            permission,
            action
        };
    };

    //list players and allow the user to select one
    playerSelection = async (message, targetId, includePlayers) => {
        message = message || "Please select a player:";
        const playerOptions = Object.keys(this.game.players).filter(playerId => {
            if(!includePlayers) return true;
            return includePlayers.includes(playerId);
        }).map((playerId) => {
            return {
                label: this.game.players[playerId].name,
                value: playerId
            };
        });
        for (let i = 0; i < playerOptions.length; i++) {
            message += "\n" + (i + 1) + ". " + playerOptions[i].label;
        }
        message += "\n\nPlease enter the number of the player you would like to select, or type /cancel to cancel.";

        this.sendMessage(message, targetId);

        const response = await this.awaitResponse(targetId);

        const selectedPlayer = playerOptions[parseInt(response) - 1];
        if (!selectedPlayer) {
            this.sendMessage("Invalid selection, try again.", targetId);
            return await this.playerSelection(message, targetId);
        }

        return selectedPlayer.value;
    };

    //movement
    //the basic idea with movement is that you can queue target locations or players asynchonously, and the NPC will move to them in order and fulfill the promise when it reaches it's destination
    //this allows you to queue up multiple movements and have them happen in order, making it easy for modules to move the NPC around without conflicts

    movementQueue = [];

    //move to a location
    moveToLocation = async (x, y, map) => {
        map = map || this.config.mapId;
        return new Promise((resolve) => {
            this.movementQueue.push({ x, y, map, resolve });
        });
    };

    //move to player
    moveToPlayer = async (playerId) => {
        return new Promise((resolve) => {
            this.movementQueue.push({ playerId, resolve });
        });
    };

    //make a move
    move = async () => {

        try {
            this.game.getMyPlayer();
        } catch (e) {
            //game has probably not loaded yet
            return;
        }

        let currentTarget = this.movementQueue[0];

        if (!currentTarget) {
            currentTarget = this.config.home;
            currentTarget.map = this.config.mapId;
        }

        //check if player or location
        if(currentTarget.playerId){
            if(currentTarget.playerId === this.game.getMyPlayer().id) {
                //complete movement
                this.movementQueue.shift();
                currentTarget.resolve && currentTarget.resolve(true);
                return;
            }

            if(!this.game.players[currentTarget.playerId]) {
                //player not found
                this.movementQueue.shift();
                currentTarget.resolve && currentTarget.resolve(false);
                return;
            }

            currentTarget.x = this.game.players[currentTarget.playerId].x;
            currentTarget.y = this.game.players[currentTarget.playerId].y;
            currentTarget.map = this.game.players[currentTarget.playerId].map;

            //check if the NPC is within 1 square of the player
            if(Math.abs(this.game.getMyPlayer().x - currentTarget.x) <= 1 && Math.abs(this.game.getMyPlayer().y - currentTarget.y) <= 1 && this.game.getMyPlayer().map === currentTarget.map) {
                //complete movement
                this.movementQueue.shift();
                currentTarget.resolve && currentTarget.resolve(true);
                return;
            }
        }

        //check if NPC is on the current target
        if (this.game.getMyPlayer().x === currentTarget.x && this.game.getMyPlayer().y === currentTarget.y && this.game.getMyPlayer().map === currentTarget.map) {
            //complete movement
            this.movementQueue.shift();
            currentTarget.resolve && currentTarget.resolve(true);
            return;
        }

        let foundPortal = false; //this will be used again later

        //if target is in a different map, try to find a portal to that map
        if (currentTarget.map !== this.game.getMyPlayer().map) {
            const portals = this.game.completeMaps[this.game.getMyPlayer().map].portals;

            for(const portal of portals) {
                if(portal.targetMap === currentTarget.map) {
                    foundPortal = true;

                    //set target destination to portal
                    currentTarget = {
                        x: portal.x,
                        y: portal.y,
                        map: this.game.getMyPlayer().map
                    };

                    //check if NPC is on the current target
                    if (this.game.getMyPlayer().x === currentTarget.x && this.game.getMyPlayer().y === currentTarget.y && this.game.getMyPlayer().map === currentTarget.map) {
                        //move through portal
                        this.queueAction("teleport", portal.targetMap, portal.targetX, portal.targetY);
                        return;
                    }

                    break;
                }
            }

            if(!foundPortal) {
                //just teleport to the other map
                this.queueAction("teleport", currentTarget.map, this.game.getMyPlayer().x, this.game.getMyPlayer().y);
                return;
            }
        }

        //find path to target
        const easystar = new easystarjs.js();

        //build map
        const { collisions, nooks } = this.game.completeMaps[currentTarget.map];
        const map_width = this.game.completeMaps[currentTarget.map].dimensions[0];
        const map_height = this.game.completeMaps[currentTarget.map].dimensions[1];

        const grid = [];
        for (let y = 0; y < map_height; y++) {
            const row = [];
            for (let x = 0; x < map_width; x++) {
                if(!collisions[y] || !collisions[y][x]) {
                    row.push(0);
                } else {
                    row.push(1);
                }
            }
            grid.push(row);
        }

        //try to avoid nooks, completely avoid restricted nooks
        for (const id in nooks) {
            const nook = nooks[id];
            for(let i = 0; i < nook.nookCoords.coords.length; i++){
                const { x, y } = nook.nookCoords.coords[i];
                grid[y][x] = 2;

                if(nook.restricted && !nook.allowedUsers.users.includes(this.game.getMyPlayer().id)){
                    grid[y][x] = 3;
                }
            }
        }

        easystar.setGrid(grid);
        easystar.setAcceptableTiles([0, 1, 2]);
        easystar.setTileCost(1, 300); //avoid walls
        easystar.setTileCost(2, 5); //avoid nooks

        try{
            easystar.findPath(this.game.getMyPlayer().x, this.game.getMyPlayer().y, currentTarget.x, currentTarget.y, (path) => {
                if (!path) {
                    //no path found
                    //if it's a portal we're trying to reach, just teleport
                    if(foundPortal) {
                        this.queueAction("teleport", currentTarget.map, this.game.getMyPlayer().x, this.game.getMyPlayer().y);
                        return;
                    }
                    this.movementQueue.shift();
                    currentTarget.resolve && currentTarget.resolve(false);
                    return;
                }

                //move to next square in path
                const nextSquare = path[1];
                
                //check which direction to face
                const direction = 
                    this.game.getMyPlayer().x > nextSquare.x ? 5 : //left
                    this.game.getMyPlayer().x < nextSquare.x ? 7 : //right
                    this.game.getMyPlayer().y > nextSquare.y ? 3 : //up
                    1; //down

                //move by teleporting to ignore walls and portals we don't intend to use
                this.queueAction("teleport", currentTarget.map, nextSquare.x, nextSquare.y, this.game.getMyPlayer().id, direction);

                return;
            });
        } catch (e) {
            console.error(e);
            this.movementQueue.shift();
            currentTarget.resolve && currentTarget.resolve(false);
            return;
        }
        easystar.calculate();
    };

};

module.exports = {
    NPC
};