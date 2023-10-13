const { Chess } = require("chess.js");

const pieceMappings = {
    "B": "iUhDbE8eMcjRXaWgAOFNBc",
    "b": "3wSKKVzBR1U1SWJ3yOlma1",
    "K": "NlBmzlu33L35pvpQEo5qDN",
    "k": "HEDCqMsc9cCFkjcHe6hdpO",
    "N": "orsPk5hsWdzG5DQB7zOZ5E",
    "n": "0kMd3XPSYZ96LXzh2U0MOd",
    "P": "fjZdbsaWoCGzHcBkS85Dx4",
    "p": "4ZuHC21ZPAtAe6FOeIvhjT",
    "Q": "DmZbpieZS9hJHbp3dexBsj",
    "q": "gNf5wJn8g19XsotDvP3oKR",
    "R": "dhoO2f3auJlqEk2AaORFIM",
    "r": "WuEeblCwvmr6j71rEL81Lf"
};

const getChessPieceNormal = (piece, color) => {
    if(color === "w"){
        piece = piece.toUpperCase();
    }
    return "https://cdn.gather.town/storage.googleapis.com/gather-town.appspot.com/uploads/Kb0O8sR6Z4CBWOrQ/" + pieceMappings[piece];
};

const CHESS_SQUARE_LIGHT_NORMAL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAmpJREFUWEelV0tWQyEMhQXZYxehx7FrcB3OdBHWJbQOrZ9FPNsuCE8ggQQSoG0nbR8hXC43Nzz/tt2Hp8cH53xw6ePxW/uCGO/cTKiZpUx+3305DwDWqzsRjst0gCQMDVR4QPnjaP6jxi/HXwJwL4IzEWV+Fwwf1MEnMHEMCAwJPANQGOBr0g7t3bLEDMUMgxAeAWy2+3BbHcH0dkVgoTwDkKcg03rnlkM+AqmBEsk5UGDVC7D/nIX028dD4LoRR9ClLc7Cw6vEJStHEw1HKREvxx9eBWywRx1V6gUCrTlkGlCq4DIhxFk1mxa7ahX01m0SCYmMaGPGgYn6IpzIl8GeE8smLadv3Qkphowj84oDoGXQdE235dCFOakz/Qgu2k05OCq5ogRbrU0Z5lYEfgk7jHOvRKSIipgdGpEUHQIhPGZ5szg6I+XoohWfhk6o1UQFxNqhUo6qD0A7hl5AZpeLeGA0sw2nOGWbUBHhoHuw/i77Bbl8iO1WDVOYmjai4KsLU8/yqWXggrz5CAzeu+UgegErJb7gFZYs/ESuHmlCBj7DegW9oP8RZgL3x4lmpFo3m1d1wxGETkWwoalGhDqRGqjEIxIpwjJ3NxOLOv0rl1LjRjRQtAQp1Zf7CD+qKl8CsNuH9Q0A6KxGV9lItRI32LUEU4LNWzH0OnmtwHt0IzwslwtNy/QB0+UyeIOtDom8hZNmGwDCcCaKok3aaVjEaQxJcRkAvBs2FnqWACGfxVv1nOXdfOC7oWmXJgvy7tM/stQn6K2grIXPoQriOh0hFdDzPdAiUNx1oKZenl9R4oTiPD7mIel0/gPRQGs+Yrd2PAAAAABJRU5ErkJgggAA";

const CHESS_SQUARE_DARK_NORMAL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAoBJREFUWEedV0t2WyEMFQtwMqg97+kaMuuoib3tdtTVPHuSLIAeEBKSkADXk7yAkK5+V5CuH7f86+c7zH4ZANJMoGwWofanyvKac7rt/fn7G1IBcDm/yKNdGxnNCSA1C3VNWGz/Z8gjSGu76aHl4/5FAE7VAfYyA1RZ5RIadg0xUFTiRWzAAgB3CwBNWO+m2XE25XmZGxtFABUB38wemFWN5AyQSFX9wNCOAEiTq3EEExleAmrpPu6fvQZkBGw9xC3gR8j6MQBqCxspoOZAQ9QHXnFSH8bej2AFgNKGmJdV+Lxa2Y8YmcGCRADvt3y5nASJ9CLpxnoELCFpwFxp7BB+eEwFcBwRD3itWC11Rd3wXqd4kdM1MI19HIElSwi9+Nl1KSKyoZJ46rdVFNEdRXyFLAMcj6AN9VmnAyhF/1Oxgt6nbfiMbpaVM2SYI7IY0SmRghceMq7hiBkVx65iLhqjzWvFhNILZj7rkfJKthxRVATC7xSTAiNkvI5qzs4+JhQuRsd4c4xTcD6fFN170bCEo+8FzYhFuSikGoHbxy0XAMufGgSBtCGrgQVNYTo84CgeCMEz7lOtsqeigfKtBq758u0Vx54lereVOoBnWtXCLmcf8kq2sLXMEBef50Rw+rkakEqmvCAilAvz28j2gj0eYhoOESAjg7H4ajaIcuEG49jeB7w82Qm/l4tRamjtOoxMBLaVTzsj7girPySiLuizmOyWuBMMR5a5UQ7yCysBzwJ6G+61lZbaOjP4gafa2/DaytRn+1bH29lhQXqMiFdnDQJde1u71sepBohA1JrAxutxyU/B0vWmZCKnBOnH9zd+1uKiPL+6cOL+XErvWtl/yp5uPGfC3UMAAAAASUVORK5CYIIA";

const CHESS_SQUARE_SELECTED_NORMAL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAmZJREFUWEedV0tWwzAMlMsJWFK24RJlxZWaPTy6bnrLpqcA8+RPI1njT/Gmr4kjj6TRSHaH8+Q/52/CyxORI0o/dk984Shuqa9sQBjyRKfLF7nD+c3vZzaRVvWwGkZH5HyA4TswSgvr5ZcBTH4/PwUfjCcBTPFUAGx7Lt4iO0S0LgWAoShWNmkw8R9yyDlH3vuQ2RsDeD9P/mXeRbMyVfmgkB3saysC8l1t35aC4y6e0aET9guYH+KRo3X5ySTkCGw8RugzTVGQtqwgX+txEhxIKWiQQAIw2wY9LotVVIEFgCsCIEyHlwCt3/ZJE0A9GKjim/FRppzQNpCCEmVH40x9A81Q1aTFbl18FqKYAvW5Z4VLtdnM8SjxrDClKmAl1BwYUsTQI6Kg2AUikRVVOIOrAPSNzVwtJZ1UVRTGAvhnOekI9MHk/TAC8POsUYkW7dZbJiTppydiWsnWDqvANFUTlVbuS8qnU0Pt2XXjdqyaUdoTgKZvmDvl590gw1Tqr/jfdWvHoAxrStThiZGkxv5xJURGhggrtQVIcRmBekUnIome2U6DfIt3Mi2u20iGu2Gp+hpGHlbl5NNlh/JxvRRSzGxDpIN0eFierZWxmXAw18p8izNdKX6E/ZWIjSYiDKVhLD/uxkMvAFpq6o7aoyKW4iyZsoEgNQSXEGZ27uIjcl3MAyMS2xgai4mimwZPdBciczcUc96IJ/pCUQwIDRKflnA3nMIZoeb5jsdhVONR69bX9VPPg+AS6w7LBO6Ukl7x8qlSDs9ND00zaKXNkXv9eN6iLPq+bNwxioJhd5u1+HbEQ7z+AyXgXOGZMpbLAAAAAElFTkSuQmCC";

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
        "zIndex": zindex
    };
}

module.exports = {
    init: (npc) => {
        let chessX, chessY, chessMap, chess, selectedPiece;
        //register chess command
        npc.registerCommand("chess <?pgn>", "Move/reset the chess board to your position", "op", (playerId, ...pgn) => {
            //reset game client
            chess = new Chess();

            if(pgn.length){
                chess.loadPgn(pgn.join(" "));
            }

            chessX = npc.game.players[playerId].x;
            chessY = npc.game.players[playerId].y;
            chessMap = npc.game.players[playerId].map;

            //reset the chess board

            updateBoard(chess.board(), []);

        });

        //listen to interactions with squares
        npc.game.subscribeToEvent("playerInteractsWithObject", async (data, context) => {
            const key = data.playerInteractsWithObject.key;
            const object = npc.game.getObjectByKey(chessMap, key);

            if(!object || !object._tags.includes("npcchess")){
                return;
            }

            //check if there's a piece on the square
            const pieceX = object.x - chessX;
            const pieceY = object.y - chessY;

            if(!chess){
                console.log("no chess game");
                return;
            }

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
            const usedObjects = [];

            const selectedTiles = [];
            if(selectedPiece){
                const moves = chess.moves({ square: selectedPiece, verbose: true });
                for(const move of moves){
                    selectedTiles.push(move.to);
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
