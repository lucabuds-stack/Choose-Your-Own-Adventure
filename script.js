// Game Engine \\

const gameContainer = document.getElementById("game");
const storyParts = document.getElementsByClassName("story")

// Listen to any click inside the game wrapper
gameContainer.addEventListener("click", function(event) {

    // Check if it's the start button
    if (event.target.id === 'startButton') {
        console.log('Button Clicked');

        storyParts[0].classList.add('animation', 'story');
        storyParts[0].style.display = 'flex';
    }

    // Check if the clicked item is actually a choice button
    if (!event.target.classList.contains("choice-btn")) return;
        
    // Get the current active story panel and invis it
    const currentStory = event.target.closest(".story");
    currentStory.classList.add('old-story');

    let nextStoryId
    let nextStoryElement
    let chosenTriggers = null;

    // Check if the button is luck-based
    if (event.target.getAttribute("data-luck") === 'true') {
        // Get all the attributes
        const successChance = parseInt(event.target.getAttribute("data-chance"))
        const successId = event.target.getAttribute("data-success")
        const failId = event.target.getAttribute("data-fail")

        // Roll a check
        const diceRoll = Math.floor(Math.random() * 100) + 1
        console.log(`Player needed <${successChance} and got ${diceRoll}.`)

        // Check if roll passes chance
        if (diceRoll <= successChance) {
            console.log('Player passed!')
            nextStoryId = successId // Set the next story id to the success one
            chosenTriggers = event.target.getAttribute("data-success-trigger")
        } else {
            console.log('Player failed :(')
            nextStoryId = failId // Set the next story id to the failure one
            chosenTriggers = event.target.getAttribute("data-fail-trigger")
        }
    } else {
        // Simply set the next story id to the success one
        nextStoryId = event.target.getAttribute("data-success");
        chosenTriggers = event.target.getAttribute("data-success-trigger")
    }

    executeTriggers(chosenTriggers, nextStoryId)
    nextStoryElement = document.getElementById(nextStoryId);
    
    // Show and animate the new scene
    if (nextStoryElement) {
        nextStoryElement.style.display = "flex";
        nextStoryElement.classList.add("animation");
    }
});

// Player Stats Variables \\
let playerMaxHealth = 100;
let playerHealth = playerMaxHealth;

let playerLevel = 1;
let playerXP = 0;
let levelUpRequirement = 100;
const levelsModifier = 1.25;

let playerEffects = {};
let playerInventory = {};

// Variables \\

const dialogRestart = document.getElementById("restart-pop-up");
const dialogCredits = document.getElementById("creditsDialog");
const buttonRestartContinue = document.getElementById("continueRestart");

const dialogNotAdded = document.getElementById('notAdded');

const restartButton = document.getElementById('restart');
const creditsButton = document.getElementById('credits');

const readModeButton = document.getElementById('readMode');          // The book button in the HUD (turns reading mode ON)
const exitReadModeButton = document.getElementById('exitReadMode');  // The small button that appears in reading mode (turns it OFF)

const healthDisplay = document.getElementById("health-display");
const maxHealthDisplay = document.getElementById("max-health-display");

const levelDisplay = document.getElementById("level");
const xpDisplay = document.getElementById("xp-display");
const maxXpDisplay = document.getElementById("max-xp-display")

const healthBar = document.getElementById("fill-health");
const xpBar = document.getElementById("fill-xp");

const eventTriggers = {
    takeDamage,
    givePlayerXP,
    healPlayer,
    changeStatusEffect,
    givePlayerItem
};

// Functions \\

restartButton.addEventListener('click',function(){dialogRestart.showModal();}); // Show the pop-up when resetting.
creditsButton.addEventListener('click', function(){dialogCredits.showModal();}); // Show credits

// Reading mode: adds/removes the "reading-mode" class on <body>. The CSS does all the visual changes.
function setReadingMode(on) {
    document.body.classList.toggle('reading-mode', on); // true = force the class on, false = force it off
}

readModeButton.addEventListener('click', function(){ setReadingMode(true); });      // Enter reading mode
exitReadModeButton.addEventListener('click', function(){ setReadingMode(false); }); // Leave reading mode
document.addEventListener('keydown', function(event){                               // Escape also leaves reading mode
    if (event.key === 'Escape') setReadingMode(false);
});

// Continuing in pop-up.
buttonRestartContinue.addEventListener('click', function() {
    console.log('Restarting/Reloading Page...');
    location.reload(); // Unless I find a cleaner way to do it this is the simplest way.
});

function executeTriggers(triggerData, nextId) {
    if (!triggerData) return;

    let actions;

    try {
        actions = JSON.parse(triggerData);
    } catch (e) {
        console.error("Invalid trigger JSON:", triggerData);
        return;
    }

    actions.forEach(trigger => {
        const fn = eventTriggers[trigger.action];

        if (!fn) {
            console.warn(`Unknown trigger: ${trigger.action}`);
            return;
        }

        const args = trigger.args || [];

        fn(...args, nextId);
    });
}

function refreshBars(type) {
    function health() {
        healthBar.style.width = `${Math.max(0, Math.min(100, (playerHealth / playerMaxHealth) * 100))}%`;
        healthDisplay.textContent = playerHealth;
        maxHealthDisplay.textContent = playerMaxHealth;
    }

    function xp() {
        xpBar.style.width = `${Math.max(0, Math.min(100, (playerXP / levelUpRequirement) * 100))}%`;
        xpDisplay.textContent = playerXP;
        maxXpDisplay.textContent = levelUpRequirement;
        levelDisplay.textContent = playerLevel;
    }

    if (type && type === 'health') {
        health()
    } else if (type && type === 'xp') {
        xp()
    } else {
        health()
        xp()
    }
}

function killPlayer(deathType) {
    if (deathType == 'health') {
        alert("You Died! Press reset to restart the story.");
        console.log("HOW IT SHOULDN'T BE POSSIBLE TO DIE WHAT");
    } else {
        console.log('Player died to unknown');
        location.reload(true);
        // const memoryHog = [];
        //     while (true) {
        //         memoryHog.push(new Array(10000000).join('x'));
        //     }
    }
}

function takeDamage(damage, nextId) {
    console.log(`Applying ${damage} damage to player.`);
    playerHealth -= damage;
    refreshBars("health")

    const targetPanel = document.getElementById(nextId);
    if (targetPanel) {
        const healthLog = document.createElement("p");
        healthLog.className = "badStatusChange";
        healthLog.textContent = `- ${damage} Health`;

        targetPanel.appendChild(healthLog);
    }

    if (playerHealth <= 0) {
        console.log('Oopsies!')
        killPlayer('health')
    }
}

function healPlayer (healPoints, nextId) {
    console.log(`Regaining ${healPoints} health points.`);
    playerHealth += healPoints;
    refreshBars("health")

    const targetPanel = document.getElementById(nextId);
    if (targetPanel) {
        const healthLog = document.createElement("p");
        healthLog.className = "goodStatusChange";
        healthLog.textContent = `+ ${healPoints} Health`;

        targetPanel.appendChild(healthLog);
    }
}

function checkForLevelUp(nextId) {
    if (playerXP >= levelUpRequirement) {
            console.log('Player leveled up!');

            playerLevel += 1;
            playerXP -= levelUpRequirement;
            levelUpRequirement *= levelsModifier;

            refreshBars("xp")

            console.log('Player is now level ' + playerLevel);
            const targetPanel = document.getElementById(nextId);
            if (targetPanel) {
                const levelUpLog = document.createElement('p');
                levelUpLog.className = "goodStatusChange";
                levelUpLog.textContent = "+ Level Up!";
                levelUpLog.style.fontWeight = "bolder";

                targetPanel.appendChild(levelUpLog);
            }

            checkForLevelUp();
        }
}

function givePlayerXP(xp, nextId) {
    playerXP += xp;
    refreshBars('xp')
    console.log(`Gave player ${xp} xp!`);

    const targetPanel = document.getElementById(nextId);
    if (targetPanel) {
        const xpLog = document.createElement('p');
        xpLog.className = "goodStatusChange";
        xpLog.textContent = `+ ${xp} Xp`;

        targetPanel.appendChild(xpLog);
    }

    checkForLevelUp(nextId);
}

//function updateStatusEffectText() {
//    const displayGood = document.getElementById('goodEffectsDisplay');
//    const displayBad = document.getElementById('badEffectsDisplay');
//    const nullDisplay = document.getElementById('effectNullDisplay');

//    const amountOfEffects = Object.keys(playerEffects).length;
//    displayGood.innerHTML = '';
//    displayBad.innerHTML = '';
//
//    if (amountOfEffects < 1) {nullDisplay.classList.remove('hide'); console.log('No effects to show, showing null display.'); return;};
//    nullDisplay.classList.add('hide');

//    for (const effectName in playerEffects) {
//        const effect = playerEffects[effectName];
//        console.log(`${effectName}: ${effect.effectAlignment}`);

//        const newItem = document.createElement('li');
//        newItem.textContent = effectName;

//        if (effect.effectAlignment === true) {
//            newItem.classList.add('goodStatusChange');
//            displayGood.appendChild(newItem);
//        } else {
//            newItem.classList.add('badStatusChange');
//            displayBad.appendChild(newItem);
//        }
//    }
//}

function changeStatusEffect(effect, type, alignment, nextId) { // type = true(apply)/false(remove) || alignment = true(good effect)/false(bad effect)
    if (type === true) {
        if (playerEffects[effect]) return;
        playerEffects[effect] = {effectAlignment:alignment}
        console.log(playerEffects[effect])

        console.log(`Applied status effect '${effect}' to player.`);
        console.log(`Current status effects: ${playerEffects}`);
    } else {
        if (!(effect in playerEffects)) return;

        delete playerEffects[effect];

        console.log(`Removed effect '${effect}' from the player.`);
    }

    const targetPanel = document.getElementById(nextId);
    if (targetPanel) {
        const effectLog = document.createElement('p');

        if (alignment === undefined) {alignment = true}

        if (alignment === true) {
            effectLog.className = "goodStatusChange";
        } else {
            effectLog.className = "badStatusChange";
        }

        effectLog.textContent = `+ Gained effect: ${effect}`;
        targetPanel.appendChild(effectLog);
    }
}

//function updateInventoryText() {
//    const display = document.getElementById('inventoryDisplay');
//    const nullDisplay = document.getElementById('invNullDisplay');
//    const inventoryLength = Object.keys(playerInventory).length;

//    display.innerHTML = '';

//    function addToUl(item, quantity, plural) {
//        if (!item || !display) return;

//        const newLi = document.createElement('li');
//        let s = '';

//        if (quantity > 1 && plural !== false) {s = 's'};
//        newLi.textContent = `${quantity} ${item}${s}`;

//        newLi.id = item;

//        if (!nullDisplay.classList.contains('hide')) {nullDisplay.classList.add('hide')};
//        display.appendChild(newLi);
//    }

//    if (inventoryLength > 0) {
//        display.innerHTML = '';
//        for (const item in playerInventory) {
//            addToUl(item, playerInventory[item].quantity, playerInventory[item].plural);
//            console.log(`Attempted to push ${item} to end of contents.`);
//        }
//    } else {
//        nullDisplay.classList.remove('hide');
//    }
//}

function givePlayerItem(item, quantity, maxStackSize, plural, nextId) {

    // Create item if it doesn't exist
    if (!playerInventory[item]) {

        // Set the values to default if unspecified
        if (maxStackSize === undefined) {console.warn('maxStackSize unspecified on new item, defaulting to 64.'); maxStackSize = 64}
        if (plural === undefined) {console.warn('plural unspecified on a new item, defaulting to true.'); plural = true}

        // Warn user if quantity not specified and default to 1
        if (quantity === undefined) {console.error('Quantity not specified! Attemping to add 1...'); quantity = 1;}

        // Sets all of the values in the nested array to the givin variables.
        playerInventory[item] = {
            quantity: 0,
            maxStackSize: maxStackSize,
            plural: plural
        };
    } else { // Player has this item already

        // Set values to current item values if unspecified.
        if (maxStackSize === undefined) {maxStackSize = playerInventory[item].maxStackSize;}
        if (plural === undefined) {plural = playerInventory[item].plural;}

        // Sets new values to existing items if changed.
        if (maxStackSize != playerInventory[item].maxStackSize) {playerInventory[item].maxStackSize = maxStackSize;}
        if (plural != playerInventory[item].plural) {playerInventory[item].plural = plural;}
    }

    const invItem = playerInventory[item];

    let newQuantity = invItem.quantity + quantity;

    if (invItem.maxStackSize <= 1) {
        invItem.quantity = 1;
    } else if (newQuantity <= invItem.maxStackSize) {
        invItem.quantity = newQuantity;
    } else {
        invItem.quantity = invItem.maxStackSize;
        console.warn(`Max stack reached for ${item}`);
    }

    if (newQuantity < 1) {
        console.log(`Quantity of ${item} is at zero or in the negatives. (${newQuantity}) Removing from inventory...`)
        delete playerInventory[item];
        console.log(playerInventory);
    }

    // optional UI log
    if (nextId) {
        const targetPanel = document.getElementById(nextId);
        if (targetPanel) {
            const log = document.createElement("p");
            log.className = "goodStatusChange";
            log.textContent = `+ Received item: ${item} (${quantity})`;
            targetPanel.appendChild(log);
        }
    }

    console.log("Inventory:", playerInventory);
    //updateInventoryText();
}

function init() {
    refreshBars();
    //updateInventoryText();
    givePlayerItem('Money', 124, 500, false)
}

init()