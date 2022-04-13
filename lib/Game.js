const inquirer = require('inquirer');
const Enemy = require('./Enemy');
const Player = require('./Player');

function Game() {
    this.roundNumber = 0;
    this.isPlayerTurn = false;
    this.enemies = [];
    this.currentEnemy;
    this.player;
}

Game.prototype.initializeGame = function() {
    this.enemies.push(new Enemy('goblin', 'sword'));
    this.enemies.push(new Enemy('orc', 'baseball bat'));
    this.enemies.push(new Enemy('skeleton', 'axe'));

    this.currentEnemy = this.enemies[0];

    // ask player for their name and create player object
    inquirer
        .prompt({
            type: 'text',
            name:'name',
            message: 'What is your name?'
        })
        // destructure name from the prompt object
        .then(({ name }) => {
            this.player = new Player(name);

            // start new battle
            this.startNewBattle();
        });
}

Game.prototype.startNewBattle = function() {
    if (this.player.agility > this.currentEnemy.agility) {
        this.isPlayerTurn = true;
    }
    else {
        this.isPlayerTurn = false;
    }

    console.log('Your stats are as follows:');
    console.table(this.player.getStats());

    console.log(this.currentEnemy.getDescription());

    this.battle();
}

Game.prototype.battle = function() {
    if (this.isPlayerTurn) {
        // Ask user if they would like to use a potion or attack
        inquirer
            .prompt({
                type: 'list',
                message: 'What would you like to do?',
                name: 'action',
                choices: ['Attack', 'Use potion']
            })
            .then(({ action }) => {
                if (action === 'Use potion') {
                    if (!this.player.getInventory()) {
                        console.log("You don't have any potions!");
                        return this.checkEndOfBattle();
                    }

                    inquirer
                        .prompt({
                            type: 'list',
                            message: 'Which potion would you like to use?',
                            name: 'action',
                            // get the index of the potion with potion name for each choice (display indices starting at 1)
                            choices: this.player.getInventory().map((item, index) => `${index + 1}: ${item.name}`)
                        })
                        .then(({ action }) => {
                            // split the action of "index: potionName" into an array [index, potionName]
                            const potionDetails = action.split(': ');

                            // pass the potion index from the new array - 1 (since we added 1 above) to use potion
                            this.player.usePotion(potionDetails[0] - 1);
                            console.log(`You used a ${potionDetails[1]} potion.`);

                            this.checkEndOfBattle();
                        });
                }
                else {
                    const damage = this.player.getAttackValue();
                    this.currentEnemy.reduceHealth(damage);

                    console.log(`You attacked the ${this.currentEnemy.name}`);
                    console.log(this.currentEnemy.getHealth());

                    this.checkEndOfBattle();
                }
            });
    }
    else {
        const damage = this.currentEnemy.getAttackValue();
        this.player.reduceHealth(damage);

        console.log(`You were attacked by the ${this.currentEnemy.name}`);
        console.log(this.player.getHealth());

        this.checkEndOfBattle();
    }
}

Game.prototype.checkEndOfBattle = function() {
    // if both the player and enemy are alive
    if (this.player.isAlive() && this.currentEnemy.isAlive()) {
        // switch turn order and rerun battle
        this.isPlayerTurn = !this.isPlayerTurn;
        this.battle();
    }
    // if the player is alive and the enemy is dead
    else if (this.player.isAlive() && !this.currentEnemy.isAlive()) {
        console.log(`You've defeated the ${this.currentEnemy.name}`);

        // add a potion from the enemy to the player inventory
        this.player.addPotion(this.currentEnemy.potion);
        console.log(`${this.player.name} found a ${this.currentEnemy.potion.name} potion`);

        // increase battle round number
        this.roundNumber++;

        // if all enemies have been defeated, player wins and game ends. Otherwise start new battle
        if (this.roundNumber < this.enemies.length) {
            // if game continues, increment to the next enemy
            this.currentEnemy = this.enemies[this.roundNumber];
            this.startNewBattle();
        }
        else {
            console.log('You win!');
        }
    }
    else {
        console.log("You've been defeated!");
    }
};

module.exports = Game;