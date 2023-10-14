const { Chess } = require("chess.js");

const getChessPieceNormal = (piece, color) => {
    if(color === "w"){
        piece = piece.toUpperCase();
    }
    return "https://gatherfile.com/chess/" + piece + ".png";
};

const CHESS_SQUARE_LIGHT_NORMAL = "https://gatherfile.com/chess/chessLight.png";

const CHESS_SQUARE_DARK_NORMAL = "https://gatherfile.com/chess/chessDark.png";

const CHESS_SQUARE_SELECTED_NORMAL = "https://gatherfile.com/chess/chessSelected.png";

const coordsToSquare = (x, y) => { 
    return 'abcdefgh'[x] + (8 - y);
};

const makeSprite = (normal, x, y, zindex, interactable) => {
    return {
        "normal": normal,
        "_name": "Chess Object",
        "_tags": ["npcchess"],
        "x": x,
        "y": y,
        "type": interactable ? 5 : 0,
        "distThreshold": 0,
        "previewMessage": " ",
        "width": 1,
        "height": 1,
        "id": "chess_piece_" + Math.random().toString(36).substring(7),
        "zIndex": zindex,
        "offsetY": interactable ? 0 : -8
    };
}

module.exports = {
    init: (npc) => {
        let chessX, chessY, chessMap, chess, selectedPiece;
        //register chess command

        const loadFromFile = () => {

            //load from ./chess.json
            const fs = require("fs");
            const chessJson = JSON.parse(fs.readFileSync("./chess.json"));
            chess = new Chess();
            chess.load(chessJson.fen);
            chessX = chessJson.x;
            chessY = chessJson.y;
            chessMap = chessJson.map;
            selectedPiece = null;
        };

        npc.registerCommand("chess <?fen>", "Move/reset the chess board to your position", "op", (playerId, ...fen) => {
            //reset game client
            chess = new Chess();

            if(fen.length){
                chess.load(fen.join(" "));
            }

            chessX = npc.game.players[playerId].x;
            chessY = npc.game.players[playerId].y;
            chessMap = npc.game.players[playerId].map;
            selectedPiece = null;

            //reset the chess board

            updateBoard(chess.board(), []);

        });

        npc.registerCommand("fen", "Get the current FEN of the chess board", "all", (playerId) => {
            npc.sendMessage(chess.fen(), playerId);
        });

        npc.registerCommand("turn", "Check whose turn it is", "all", (playerId) => {
            if(!chess){
                loadFromFile();
            }
            npc.sendMessage(chess.turn() === 'b' ? "Black" : "White", playerId);
        });

        //listen to interactions with squares
        npc.game.subscribeToEvent("playerInteractsWithObject", async (data, context) => {
            const key = data.playerInteractsWithObject.key;
            const object = npc.game.getObjectByKey(data.playerInteractsWithObject.mapId, key);

            if(!object || !object._tags.includes("npcchess")){
                return;
            }

            if(!chess){
                console.log("loading from file");
                loadFromFile();
            }

            //check if there's a piece on the square
            const pieceX = object.x - chessX;
            const pieceY = object.y - chessY;

            const squareIndex = coordsToSquare(pieceX, pieceY);

            if(selectedPiece){
                //try moving the piece to this square
                try{
                    chess.move({ from: selectedPiece, to: squareIndex });
                    selectedPiece = null;
                    updateBoard(chess.board());
                    return;
                } catch(e){
                    //check if promotion is required
                    const validMoves = chess.moves({ square: selectedPiece, verbose: true });
                    selectedPiece = null;
                    const possibleMoves = validMoves.filter(move => move.to == squareIndex);
                    if(possibleMoves.length){
                        //promotion required
                        npc.sendMessage("What piece do you want to promote to? (Q, R, B, N)", context.playerId);
                        const selectedPromotion = (await npc.awaitResponse(context.playerId)).toLowerCase();
                        if(!["q", "r", "b", "n"].includes(selectedPromotion)){
                            npc.sendMessage("Invalid promotion piece.", context.playerId);
                            selectedPiece = null;
                            updateBoard(chess.board());
                            return;
                        } else {
                            chess.move({ from: possibleMoves[0].from, to: possibleMoves[0].to, promotion: selectedPromotion });
                            updateBoard(chess.board());
                            return;
                        }

                    }
                }
            }

            const square = chess.get(squareIndex);

            if(!square){
                return;
            }

            selectedPiece = squareIndex;

            updateBoard(chess.board());

        });

        const updateBoard = (board) => {
            //save chess state in ./chess.json
            const fs = require("fs");
            fs.writeFileSync("./chess.json", JSON.stringify({
                "fen":chess.fen(),
                "map":chessMap,
                "x":chessX,
                "y":chessY
            }));

            const usedObjects = [];

            let selectedTiles = [];
            if(selectedPiece){
                const moves = chess.moves({ square: selectedPiece, verbose: true });
                for(const move of moves){
                    selectedTiles.push(move.to);
                }
                if(selectedTiles.length){
                    selectedTiles.push(selectedPiece);
                }
            }

            if(chess.isGameOver()){
                //show the winner, if it's a winning state
                if(chess.isCheckmate()){
                    if(chess.turn() === "b"){
                        selectedTiles = [
                            "a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1",
                            "a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2",
                            "a3", "b3", "c3", "d3", "e3", "f3", "g3", "h3",
                            "a4", "b4", "c4", "d4", "e4", "f4", "g4", "h4"
                        ];
                    } else {
                        selectedTiles = [
                            "a5", "b5", "c5", "d5", "e5", "f5", "g5", "h5",
                            "a6", "b6", "c6", "d6", "e6", "f6", "g6", "h6",
                            "a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7",
                            "a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"
                        ];
                    }
                } else {
                    selectedTiles = [
                        "a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1",
                        "a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2",
                        "a3", "b3", "c3", "d3", "e3", "f3", "g3", "h3",
                        "a4", "b4", "c4", "d4", "e4", "f4", "g4", "h4",
                        "a5", "b5", "c5", "d5", "e5", "f5", "g5", "h5",
                        "a6", "b6", "c6", "d6", "e6", "f6", "g6", "h6",
                        "a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7",
                        "a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"
                    ];
                }
            }

            //add all chess pieces and squares
            for(const row in board){
                for(const col in board[row]){
                    const square = board[row][col];
                    const squareX = parseInt(col) + chessX;
                    const squareY = parseInt(row) + chessY;
                    const squareColor = col % 2 ? row % 2 ? "light" : "dark" : row % 2 ? "dark" : "light";
                    let squareNormal = CHESS_SQUARE_LIGHT_NORMAL;
                    if(squareColor == "dark"){
                        squareNormal = CHESS_SQUARE_DARK_NORMAL;
                    }
                    if(selectedTiles.includes(coordsToSquare(col, row))){
                        squareNormal = CHESS_SQUARE_SELECTED_NORMAL;
                    }

                    //check if square is alreay in the map
                    const squareExists = npc.game.filterObjectsInMap(chessMap, obj=>{
                        return obj.x == squareX && obj.y == squareY && obj.normal == squareNormal;
                    });

                    if(!squareExists.length){
                        //add square
                        npc.queueAction("addObject", chessMap, makeSprite(squareNormal, squareX, squareY, 1000, true));
                    } else {
                        usedObjects.push(squareExists[0].id);
                    }

                    //check if piece exists
                    if(square){
                        const pieceNormal = getChessPieceNormal(square.type, square.color);
                        //check if piece is already in the map
                        const pieceExists = npc.game.filterObjectsInMap(chessMap, obj=>{
                            return obj.x == squareX && obj.y == squareY && obj.normal == pieceNormal;
                        });

                        if(!pieceExists.length){
                            //add piece
                            npc.queueAction("addObject", chessMap, makeSprite(pieceNormal, squareX, squareY, 2000));
                        } else {
                            usedObjects.push(pieceExists[0].id);
                        }
                    }
                }
            }

            //remove unused objects
            const allChessObjects = npc.game.filterObjectsInMap(chessMap, obj=>{
                return obj._tags.includes("npcchess");
            });

            for(const obj of allChessObjects){
                if(!usedObjects.includes(obj.id)){
                    npc.queueAction("deleteObject", chessMap, obj.id);
                }
            }
        }
    }
}
