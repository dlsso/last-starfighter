	eurecaClient.exports.spawnEnemy = function(i, x, y, shipType)
	{
		if (i == myId) return; //this is me
		console.log('SPAWN');

		if(shipsList[i]) {
			console.log("Trying to create a ship that already exists.")
		}
		else {
			var shp;
			switch(shipType){
				case "ship1":
					shp = new Ship1(i, game, ship, x, y);
					break;
				case "ship2":
					shp = new Ship2(i, game, ship, x, y);
					break;
			}

			// var shp = new shipType(i, game, ship, x, y);
			shipsList[i] = shp;
			newLogin = true
		}
	}



	function Ship1(myId, game, ship, x, y) {
		Ship.call(this, myId, game, ship)
		this.health = 50;
		this.type = 'ship1'
		this.fireRate = 200;
		// this.shadow = game.add.sprite(x, y, 'enemy', 'shadow');
		this.ship = game.add.sprite(x, y, 'ship');
		this.ship.animations.add('engines', [1, 2], 20, true);
		this.ship.animations.add('off', [0], 20, true);
		// this.turret = game.add.sprite(x, y, 'enemy', 'turret');

		// this.shadow.anchor.set(0.5);
		this.ship.anchor.set(0.5);
		// this.turret.anchor.set(0.3, 0.5);

		this.ship.id = myId;
		game.physics.enable(this.ship, Phaser.Physics.ARCADE);
		this.ship.body.immovable = false;
		this.ship.body.drag.setTo(40);
		this.ship.body.maxVelocity.setTo(330);
		// this.ship.body.collideWorldBounds = true;
		this.ship.body.bounce.setTo(0, 0);
		// setSize does not work with rotation
		// this.ship.body.setSize(40, 15, 20, 15);
		this.ship.angle = -90;

		game.physics.arcade.velocityFromRotation(this.ship.rotation, 0, this.ship.body.velocity);

	}
	Ship1.prototype = Object.create(Ship.prototype);
	Ship1.prototype.constructor = Ship1;


	function create (shipType) {
		//  Resize our game world to be a 2000 x 2000 square
		game.world.setBounds(0, 0, 1920, 1080);
		game.stage.disableVisibilityChange  = true;
		
		//  Our tiled scrolling background
		land = game.add.tileSprite(0, 0, viewportWidth, viewportHeight, 'space');
		land.fixedToCamera = true;
		
		// shipsList = {};
		player = new shipType(myId, game, ship);
		shipsList[myId] = player;
		ship = player.ship;
		// turret = player.turret;
		ship.x= game.world.randomX 
		ship.y= game.world.randomY
		bullets = player.bullets;
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
		// turret.bringToTop();
			
		logo = game.add.sprite(viewportWidth/2 - 200, viewportHeight/3 - 85, 'logo');
		logo.fixedToCamera = true;
		game.input.onDown.add(removeLogo, this);

		game.camera.follow(ship);
		game.camera.focusOnXY(0, 0);

		cursors = game.input.keyboard.createCursorKeys();
		fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		
		setTimeout(removeLogo, 2000);

		var keys = {
			x: ship.x,
			y: ship.y,
			angle: ship.angle,
			rot: ship.rotation,
			alive: ship.alive,
			shipType: ship.type
		}
		eurecaServer.handleKeys(keys);
		eurecaServer.handshake();
		ready = true;
	}


	function menu () {
		var background = game.add.tileSprite(0, 0, viewportWidth, viewportHeight, 'space');
		background.autoScroll(-10,5)
		var logo = game.add.sprite(viewportWidth/2 - 200, 10, 'logo');
		var choose = "Choose your vessel:";
		var style = { font: "32px Serif", fill: "#ddd"};
		var t1 = game.add.text(viewportWidth/4 - 150, 300, choose, style);

		var chooseShip1 = game.add.button(viewportWidth/4 - 150, 400, 'ship', create.bind(this, Ship1));
		var chooseShip2 = game.add.button(viewportWidth/4 - 50, 390, 'ship2', create.bind(this, Ship2));

		var instructions = "Arrow keys to move, spacebar to fire, down for special ability";
		var style2 = { font: "20px Arial", fill: "#ddd", align: "center"};
		var t2 = game.add.text(viewportWidth/2 - 270, viewportHeight - 50, instructions, style2);

	}