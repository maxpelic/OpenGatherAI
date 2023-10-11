# Open Gather AI
## Introduction

*Open Gather AI* is a project to build a customizable, open-source NPC that can be added to any gather town map. The NPC can have many different options enabled for different features, and is built in a way that it's easy to create new features for it. Built using the [Gather Town API](https://gathertown.notion.site/Gather-Websocket-API-bf2d5d4526db412590c3579c36141063)

You're free to use this NPC code and modules in any gather space you own that people can freely access. If you want to charge to host this code or otherwise profit from this project you'll need to get permission from the authors of any modules you plan to use. However, feel free to use the base code without permission.

## Installation

1. Clone this repository
2. Run `npm install` in the root directory
3. Create a file `config.json` with the information for your space, API key, NPC data, and modules you would like to run. See `example_config.json` for an example
4. Run `node index.js` to start the server

## Modules

### coming soon...

## Contributing

To contribute to this repository, create a pull request with your changes. If you would like to add a module, please see the section below.

### How to build a module

Each modules should be in it's own folder in the `modules` directory. The module should have a `module.json` file that contains the following information:

```json
{
    "name": "Module Name",
    "description": "A description of the module",
    "authors": "Your Name, Other Contributors"
}
```

The module should also have an `index.js` file that exports an `init` function runs on startup. This function takes the NPC object and can access the game via `npc.game`. For example:

```js
module.exports = {
    init: function (npc) {
        console.log('Example module loaded!');
        console.log(npc.game.players)
    }
}
```

Modules can commands features using the `npc.registerCommand(command, description, permission, action)`. You can specify which parameters should be included when running the command by appending them to the end of the command name (e.g. `/example <param1> <param2>`). The `action` parameter is a function that will recieve the `playerId` and parameters as arguments. permission level can be `"op"`, `"all"`, or left blank to require assigning each player permission to run the function. For example:

```js
npc.registerCommand("/example <param1>", "An example command", "op", (playerId, param1) => {
    npc.sendMessage(playerId, `You ran the example command with param1: ${param1}`);
};
```

