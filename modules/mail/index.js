const fs = require('fs');

//make sure ./mail.json exists
if(!fs.existsSync('./mail.json')) {
    fs.writeFileSync('./mail.json', JSON.stringify([]));
}

const getPendingMail = (playerId) => {
    //get pending mail from ./mail.json
    const mail = JSON.parse(fs.readFileSync('./mail.json'));
    if(playerId) {
        return mail.filter(m => m.targetPlayerId === playerId);
    }
    return mail;
};

const sendMail = (fromPlayerId, targetPlayerId, message) => {
    //add mail to ./mail.json
    const mail = JSON.parse(fs.readFileSync('./mail.json'));
    mail.push({ fromPlayerId, targetPlayerId, message });
    //save ./mail.json
    fs.writeFileSync('./mail.json', JSON.stringify(mail));
};

const sendMailToAll = (fromPlayerId, message) => {
    //send mail to all other players
    const mail = JSON.parse(fs.readFileSync('./mail.json'));
    //delete past message to all players
    const pastMessages = mail.filter(m => m.fromPlayerId === fromPlayerId && m.targetPlayerId === "all");
    for(let pastMessage of pastMessages) {
        mail.splice(mail.findIndex(m => m.fromPlayerId === pastMessage.fromPlayerId && m.targetPlayerId === pastMessage.targetPlayerId && m.message === pastMessage.message), 1);
    }
    mail.push({ fromPlayerId, targetPlayerId: "all", message, recievedBy: [] });
    //save ./mail.json
    fs.writeFileSync('./mail.json', JSON.stringify(mail));
};

const deleteMail = (fromPlayerId, targetPlayerId, message) => {
    //remove mail from ./mail.json
    const mail = JSON.parse(fs.readFileSync('./mail.json'));
    const mailIndex = mail.findIndex(m => m.fromPlayerId === fromPlayerId && m.targetPlayerId === targetPlayerId && m.message === message);
    mail.splice(mailIndex, 1);
    //save ./mail.json
    fs.writeFileSync('./mail.json', JSON.stringify(mail));
};

const makeMailObject = (game, targetPlayerId, message) => {
    const targetPlayer = game.players[targetPlayerId] || {};
    const object = {
        "type": 6,
        "_tags": [],
        "_name": "Mail",
        "templateId": "Document - Wo5K9aajeD0udOrewjpss",
        "color": "#ECE9F1",
        "orientation": 3,
        "normal": "https://cdn.gather.town/storage.googleapis.com/gather-town.appspot.com/internal-dashboard/images/fX8nelXLWJuh2H5cydyXW",
        "distThreshold": 3,
        "previewMessage": "New message for " + (targetPlayer.name || 'you') + " (press x)",
        "properties": {
            "message": message
        },
        "height": 1,
        "width": 1,
        "id": "mail" + Math.random().toString(36),
        "customState": "for " + targetPlayerId
    };

    return object;
};

module.exports = {
    init: async (npc) => {
        npc.registerCommand('mail', 'Send a letter to another player', '', async (senderId) => {
            //check which player to send the letter to
            const targetId = await npc.playerSelection("Who would you like to send a letter to?", senderId);

            if(!targetId) return;

            npc.sendMessage("Ok, I'll send it to " + npc.game.players[targetId].name + "! What would you like to say?", senderId);

            const message = npc.game.players[senderId].name + " sent you a message\n\n" + (await npc.awaitResponse(senderId)) + "\n\n" + "This message will go away when you leave."

            if(!message) return;

            //send the letter
            sendMail(senderId, targetId, message);

            //tell the player that the letter has been sent
            npc.sendMessage("Ok, I've sent your letter to " + npc.game.players[targetId].name + "!", senderId);
        });

        npc.registerCommand('mailall', 'Send a letter to all players', 'op', async (senderId) => {
            npc.sendMessage("Ok, I'll send it to everyone! What would you like to say?", senderId);

            const message = npc.game.players[senderId].name + " sent you a message\n\n" + (await npc.awaitResponse(senderId)) + "\n\n" + "This message will go away when you leave."

            if(!message) return;

            //send the letter
            sendMailToAll(senderId, message);

            //tell the player that the letter has been sent
            npc.sendMessage("Ok, I've sent your letter to everyone!", senderId);
        });

        //try to send mail queue
        const sendMailQueue = async () => {
            //get mail in queue
            const mail = getPendingMail();

            //send mail
            for (message of mail) {
                if(message.targetPlayerId === "all") {
                    //loop through all players in npc.game.players that are not in the recievedBy array
                    for(playerId in npc.game.players) {
                        if(playerId === npc.game.getMyPlayer().id) continue;
                        if(!message.recievedBy.includes(playerId)) {
                            const object = makeMailObject(npc.game, playerId, message.message);
                            const playerFound = await npc.moveToPlayer(playerId);
                            if(!playerFound) continue;
                            object.x = npc.game.getMyPlayer().x;
                            object.y = npc.game.getMyPlayer().y;
                            npc.queueAction("addObject", [npc.game.players[playerId].map, object]);
                            message.recievedBy.push(playerId);
                            //save ./mail.json
                            let currentMail = JSON.parse(fs.readFileSync('./mail.json'));
                            currentMail[currentMail.findIndex(m => m.fromPlayerId === message.fromPlayerId && m.targetPlayerId === message.targetPlayerId && m.message === message.message)].recievedBy = message.recievedBy;
                            fs.writeFileSync('./mail.json', JSON.stringify(currentMail));
                        }
                    }
                } else {
                    const targetPlayer = npc.game.players[message.targetPlayerId];

                    if (targetPlayer) {
                        const object = makeMailObject(npc.game, message.targetPlayerId, message.message);
                        const playerFound = await npc.moveToPlayer(targetPlayer.id);
                        if (playerFound) {
                            object.x = npc.game.getMyPlayer().x;
                            object.y = npc.game.getMyPlayer().y;
                            npc.queueAction("addObject", [targetPlayer.map, object]);
                            deleteMail(message.fromPlayerId, message.targetPlayerId, message.message);
                        }
                    }
                }
            }

            //wait 5 seconds
            setTimeout(sendMailQueue, 5000);
        };

        //start mail queue
        sendMailQueue();

        //check when players interact with mail
        npc.game.subscribeToEvent("playerInteractsWithObject", async (data, context) => {
            const { key } = data.playerInteractsWithObject;
            const object = npc.game.getObjectByKey(npc.game.players[context.playerId].map, key);
            if(!object) return;

            const playerId = context.playerId;
            
            if(object._name !== "Mail" || object.customState !== "for " + playerId) return;
            object.customState += " (opened)";
            npc.queueAction("updateObject", [npc.game.players[playerId].map, key, object]);
        });

        //listen to movement events and remove read messages by someone who moved
        npc.game.subscribeToEvent("playerMoves", async (data, context) => {
            const playerId = context.playerId;
            //get mail objects
            const mails = npc.game.filterObjectsInMap(npc.game.players[playerId].map, o => o._name === "Mail" && o.customState === "for " + playerId + " (opened)");
            //remove mail objects
            for(mail of mails) {
                npc.queueAction("deleteObject", [npc.game.players[playerId].map, mail.id]);
            }
        });
    }
}