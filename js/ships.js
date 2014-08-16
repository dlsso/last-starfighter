var land;
var shadow;
var ship;
var turret;
var player;
var shipsList;
var explosions;
var logo;
var cursors;
var fireButton;
var bullets;
var restartButton;
var myId=0;
var viewportWidth = window.innerWidth * window.devicePixelRatio;
var viewportHeight = window.innerHeight * window.devicePixelRatio;
var fireRate = 400;
var nextFire = 0;
var newLogin = false

var ready = false;
var eurecaServer;
//this function will handle client communication with the server
var eurecaClientSetup = function() {
	//create an instance of eureca.io client
	var eurecaClient = new Eureca.Client();
	
	eurecaClient.ready(function (proxy) {		
		eurecaServer = proxy;
	});
	
	//methods defined under "exports" namespace become available in the server side
	
	eurecaClient.exports.setId = function(id) 
	{
		//create() is moved here to make sure nothing is created before uniq id assignation
		myId = id;
		create();
		eurecaServer.handshake();
		ready = true;
	}	
	
	eurecaClient.exports.kill = function(id)
	{	
		if (shipsList[id]) {
			shipsList[id].kill();
			delete shipsList[id];
		    if(id === ship.id){
			    restartButton = game.add.button(200, 200, 'restart', restart, this);
			    restartButton.fixedToCamera = true
			}
			// console.log('killing ', id, shipsList[id]);
		}
	}	
	
	eurecaClient.exports.spawnEnemy = function(i, x, y)
	{
		if (i == myId) return; //this is me
		console.log('SPAWN');
		if(shipsList[i]) {
			console.log("Trying to create a ship that already exists.")
		}
		else {
			var shp = new Ship(i, game, ship, x, y);
			shipsList[i] = shp;
			newLogin = true
		}
	}
	
	eurecaClient.exports.updateState = function(id, state)
	{
		if (shipsList[id])  {
			shipsList[id].cursor = state;
			shipsList[id].ship.x = state.x;
			shipsList[id].ship.y = state.y;
			shipsList[id].ship.angle = state.angle;
			shipsList[id].turret.rotation = state.rot;
			shipsList[id].alive = state.alive;
			shipsList[id].update();
		}
	}
}


Ship = function (index, game, player, x, y) {
	this.cursor = {
		left:false,
		right:false,
		up:false,
		fire:false		
	}

	this.input = {
		left:false,
		right:false,
		up:false,
		fire:false
	}

    // var x = Math.floor(Math.random() * 2000) + 1
    // var x = 100
    // var y = 100
    // var y = Math.floor(Math.random() * 2000) + 1


    this.game = game;
    this.health = 30;
    this.player = player;
    this.bullets = game.add.group();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.bullets.createMultiple(20, 'bullet', 0, false);
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('anchor.y', 0.5);
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.setAll('checkWorldBounds', true);	
	
	
	this.currentSpeed =0;
    this.fireRate = 200;
    this.nextFire = 0;
    this.alive = true;

    this.shadow = game.add.sprite(x, y, 'enemy', 'shadow');
    this.ship = game.add.sprite(x, y, 'enemy', 'ship1');
    this.turret = game.add.sprite(x, y, 'enemy', 'turret');

    this.shadow.anchor.set(0.5);
    this.ship.anchor.set(0.5);
    this.turret.anchor.set(0.3, 0.5);

    this.ship.id = index;
    game.physics.enable(this.ship, Phaser.Physics.ARCADE);
    this.ship.body.immovable = false;
    this.ship.body.collideWorldBounds = true;
    this.ship.body.bounce.setTo(0, 0);

    this.ship.angle = 0;

    game.physics.arcade.velocityFromRotation(this.ship.rotation, 0, this.ship.body.velocity);

};

Ship.prototype.update = function() {

	// eurecaServer.playerJustLoggedIn()


	var inputChanged = (
		this.cursor.left != this.input.left ||
		this.cursor.right != this.input.right ||
		this.cursor.up != this.input.up ||
		this.cursor.fire != this.input.fire
	);
	
	
	if (inputChanged || newLogin === true)
	{
		//Handle input change here
		//send new values to the server		
		if (this.ship.id == myId)
		{
			// send latest valid state to the server
			this.input.x = this.ship.x;
			this.input.y = this.ship.y;
			this.input.angle = this.ship.angle;
			this.input.rot = this.turret.rotation;
			this.input.alive = this.ship.alive;

			eurecaServer.handleKeys(this.input);
			newLogin = false		
		}
	}


	//cursor value is now updated by eurecaClient.exports.updateState method
	

    if (this.cursor.left)
    {
        this.ship.angle -= 4;
    }
    else if (this.cursor.right)
    {
        this.ship.angle += 4;
    }	
    if (this.cursor.up)
    {
        //  The speed we'll travel at
        this.currentSpeed = 300;
    }
    else
    {
        if (this.currentSpeed > 0)
        {
            this.currentSpeed -= 4;
        }
    }
    if (this.cursor.fire)
    {	
		this.fire({x:this.cursor.tx, y:this.cursor.ty});
    }
	
	
	
    if (this.currentSpeed > 0)
    {
        game.physics.arcade.velocityFromRotation(this.ship.rotation, this.currentSpeed, this.ship.body.velocity);
    }	
	else
	{
		game.physics.arcade.velocityFromRotation(this.ship.rotation, 0, this.ship.body.velocity);
	}
	
	
    this.shadow.x = this.ship.x;
    this.shadow.y = this.ship.y;
    this.shadow.rotation = this.ship.rotation;
    this.turret.rotation = this.ship.rotation;

    this.turret.x = this.ship.x;
    this.turret.y = this.ship.y;
};


Ship.prototype.fire = function(target) {
		if (!this.alive) return;
        if (this.game.time.now > this.nextFire && this.bullets.countDead() > 0)
        {
            this.nextFire = this.game.time.now + this.fireRate;
            var bullet = this.bullets.getFirstDead();
            // Using sin and cos to add offset in direction tank is facing
            bullet.reset(this.turret.x + Math.cos(this.turret.rotation)*50, this.turret.y + Math.sin(this.turret.rotation)*50);


			bullet.rotation = this.turret.rotation;
			game.physics.arcade.velocityFromRotation(this.turret.rotation, 800, bullet.body.velocity);
        }
}


Ship.prototype.kill = function() {
	this.alive = false;
	this.ship.kill();
	this.turret.kill();
	this.shadow.kill();
}

var game = new Phaser.Game(viewportWidth, viewportHeight, Phaser.AUTO, 'phaser-example', { preload: preload, create: eurecaClientSetup, update: update, render: render });

function preload () {

    game.load.atlas('ship', 'assets/ships.png', 'assets/ships.json');
    game.load.atlas('enemy', 'assets/enemy-ships.png', 'assets/ships.json');
    game.load.image('logo', 'assets/logo.png');
    game.load.image('bullet', 'assets/bullet.png');
    game.load.image('earth', 'assets/scorched_earth.png');
    game.load.spritesheet('kaboom', 'assets/explosion.png', 64, 64, 23);
    game.load.image('restart','assets/restart.png'); 
}



function create () {
    //  Resize our game world to be a 2000 x 2000 square
    game.world.setBounds(0, 0, 1000, 1000);
	game.stage.disableVisibilityChange  = true;
	
    //  Our tiled scrolling background
    land = game.add.tileSprite(0, 0, viewportWidth, viewportHeight, 'earth');
    land.fixedToCamera = true;
    
    shipsList = {};
	player = new Ship(myId, game, ship);
	shipsList[myId] = player;
	ship = player.ship;
	turret = player.turret;
	ship.x= game.world.randomX 
	ship.y= game.world.randomY
	bullets = player.bullets;
	shadow = player.shadow;

    //  Explosion pool
    explosions = game.add.group();
    for (var i = 0; i < 10; i++)
    {
        var explosionAnimation = explosions.create(0, 0, 'kaboom', [0], false);
        explosionAnimation.anchor.setTo(0.5, 0.5);
        explosionAnimation.animations.add('kaboom');
    }

    ship.bringToTop();
    turret.bringToTop();
		
    logo = game.add.sprite(0, 200, 'logo');
    logo.fixedToCamera = true;
    game.input.onDown.add(removeLogo, this);

    game.camera.follow(ship);
    game.camera.focusOnXY(0, 0);

    cursors = game.input.keyboard.createCursorKeys();
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	
	setTimeout(removeLogo, 1000);

	var keys = {
		x: ship.x,
		y: ship.y,
		angle: ship.angle,
		rot: ship.rotation,
		alive: ship.alive
	}
	eurecaServer.handleKeys(keys);
}

function respawn () {
    //  Resize our game world to be a 2000 x 2000 square
    // game.world.setBounds(0, 0, 1000, 1000);
	// game.stage.disableVisibilityChange  = true;
	
    //  Our tiled scrolling background
    land = game.add.tileSprite(0, 0, viewportWidth, viewportHeight, 'earth');
    land.fixedToCamera = true;
    
    shipsList = {};
	player = new Ship(myId, game, ship);
	shipsList[myId] = player;
	ship = player.ship;
	turret = player.turret;
	ship.x= game.world.randomX 
	ship.y= game.world.randomY
	// bullets = player.bullets;
	// shadow = player.shadow;
    //  Explosion pool
    explosions = game.add.group();

    for (var i = 0; i < 10; i++)
    {
        var explosionAnimation = explosions.create(0, 0, 'kaboom', [0], false);
        explosionAnimation.anchor.setTo(0.5, 0.5);
        explosionAnimation.animations.add('kaboom');
    }

    ship.bringToTop();
    turret.bringToTop();
		
    // logo = game.add.sprite(0, 200, 'logo');
    // logo.fixedToCamera = true;
    // game.input.onDown.add(removeLogo, this);
	// setTimeout(removeLogo, 1000);

    game.camera.follow(ship);
    game.camera.focusOnXY(0, 0);

    // cursors = game.input.keyboard.createCursorKeys();
    // fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	

	var keys = {
		x: ship.x,
		y: ship.y,
		angle: ship.angle,
		rot: ship.rotation,
		alive: ship.alive
	}
	eurecaServer.handleKeys(keys);
}

function removeLogo () {
    game.input.onDown.remove(removeLogo, this);
    logo.kill();
}

function update () {
	//do not update if client not ready
	if (!ready) return;
	
	player.input.left = cursors.left.isDown;
	player.input.right = cursors.right.isDown;
	player.input.up = cursors.up.isDown;
	player.input.fire = fireButton.isDown;
	player.input.tx = game.input.x+ game.camera.x;
	player.input.ty = game.input.y+ game.camera.y;
	
	turret.rotation = ship.rotation
    land.tilePosition.x = -game.camera.x;
    land.tilePosition.y = -game.camera.y;
	
    for (var i in shipsList)
    {
		if (!shipsList[i]) continue;
		var curBullets = shipsList[i].bullets;
		var curShip = shipsList[i].ship;
		if (shipsList[i].alive) shipsList[i].update();
		for (var j in shipsList)
		{
			if (!shipsList[j]) continue;
			if (j!=i) 
			{
			
				var targetShip = shipsList[j].ship;
				
				game.physics.arcade.overlap(curBullets, targetShip, bulletHitPlayer, null, this);
			
			}
			if (!shipsList[j].alive)
			{
				shipsList[j].update();
			}			
		}
    }
}

function bulletHitPlayer (ship, bullet) {
    bullet.kill();
    shipsList[ship.id].health -= 10
    console.log("ship.health:", ship.health)
    if (shipsList[ship.id].health<=0)
    {
        var explosionAnimation = explosions.getFirstExists(false);
        explosionAnimation.reset(ship.x, ship.y);
        explosionAnimation.play('kaboom', 30, false, true);
    	setTimeout(function(){eurecaServer.deletePlayer(ship.id)},40)
    }

}

function restart () {
	restartButton.kill()
	ready = false;
	respawn();
	eurecaServer.handshake();
	ready = true;		
}

function render () {}

