//Aliases
let Application = PIXI.Application,
		loader = PIXI.loader,
		resources = PIXI.loader.resources,
		Rectangle = PIXI.Rectangle,
		TextureCache = PIXI.TextureCache,
		Sprite = PIXI.Sprite;

//Create a Pixi Application
let app = new Application({ antialias: true });
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(800, 472);
//app.renderer.resize(window.innerWidth, window.innerHeight);

//Add the canvas that Pixi automatically created for you to the HTML document
document.querySelector('#root').appendChild(app.view);

class Wormy {
	constructor(app, game){
		this.game = game;
		this.JUMP_VELOCITY = -3.8;

		// master state
		this.states = ['idle', 'airborne'];
		this.possible_states = {
			idle: [],
			moving: ['climbing'],
			airborne: ['climbing'],
			climbing: ['moving', 'stabbing'],
			stabbing: [],
		};
		this.last_direction = 'right';
		this.direction = 'right';

		// idle states
		this.idle_right_states = [
			TextureCache["idle-R1.png"],
			TextureCache["idle-R2.png"],
			TextureCache["idle-R3.png"],
		];
		this.idle_left_states = [
			TextureCache["idle-L1.png"],
			TextureCache["idle-L2.png"],
			TextureCache["idle-L3.png"],
		];
		this.idle_state = 0;
		this.idle_state_duration = 750;
		this.idle_state_last_change = Date.now();

		// moving states
		this.moving_right_states = [
			TextureCache["moving-R1.png"],
			TextureCache["moving-R2.png"],
		];
		this.moving_left_states = [
			TextureCache["moving-L1.png"],
			TextureCache["moving-L2.png"],
		];
		this.moving_state = 0;
		this.moving_state_duration = 200;
		this.moving_state_last_change = Date.now();

		// climbing states
		this.climbing_states = [
			TextureCache["climbing-R.png"],
			TextureCache["climbing-L.png"]
		]

		// stabing states
		this.stabbing_states = [
			TextureCache["stabbing-R.png"],
			TextureCache["stabbing-R-blood.png"],
			TextureCache["stabbing-L.png"],
			TextureCache["stabbing-L-blood.png"]
		]

		// intial state
		this.sprite = new Sprite(this.idle_right_states[0]);
		this.sprite.x = 32 * 5;
		this.sprite.y = 32 * 7;
		this.sprite.vx = 0;
		this.sprite.vy = 0;
		this.max_vx = 5;
		this.min_vx = -5;
		this.speed = 1;
		app.stage.addChild(this.sprite);
	}

	getStateIndex = (state) => {
		let index = this.states.indexOf(state);
		if (index >= 0){
			return index;
		} else {
			return null;
		}
	}

	isState = (state) => {
		let index = this.states.indexOf(state);
		return (index >= 0);
	}

	canState = (state) => {
		let canState = true;
		this.states.forEach(current => {
			if (this.possible_states[current].indexOf(state) >= 0){
				canState = false;
			}
		})
		return canState;
	}

	removeState = (state) => {
		if (this.isState(state)){
			this.states = this.states.filter(current => current !== state);
		}
	}

	addState = (state) => {
		if (!this.isState(state)){
			this.states.push(state);
		}
	}

	update = (delta) => {
		
		// Apply gravity
		if (this.game.should_apply_gravity(this.sprite)){
			this.game.apply_gravity(this.sprite);
		} else {
			this.sprite.vy = 0;
			this.removeState('airborne');
		}

		// update direction & x-axis motion
		if (this.game.keys['ArrowRight'] && !this.game.keys['ArrowLeft']){
			this.direction = 'right';
			if (!this.isState('airborne')){
				this.sprite.vx = Math.min(this.sprite.vx + this.speed, this.max_vx);
				this.addState('moving');
			}
		} else if (!this.game.keys['ArrowRight'] && this.game.keys['ArrowLeft']) {
			this.direction = 'left';
			if (!this.isState('airborne')){
				this.sprite.vx = Math.max(this.sprite.vx - this.speed, this.min_vx);
				this.addState('moving');
			}
		} else if (
			!this.game.keys['ArrowRight'] && 
			!this.game.keys['ArrowLeft'] &&
			!this.isState('airborne')
		){
			this.sprite.vx = 0;
			this.removeState('moving');
		}

		// update y-axis motion
		if (!this.isState('airborne')){
			if (this.game.keys['ArrowUp']){
				if (
					this.game.can_climb(this.sprite) &&
					this.canState('climbing')
				){
					this.addState('climbing')
					this.sprite.vy = -1;
				} else if (
					!this.isState('airborne') &&
					this.canState('airborne')
				) {
					this.addState('airborne');
					this.sprite.vy += this.JUMP_VELOCITY;
				}
			}
		}
		
		// stabbing
		if (this.game.keys[" "] && this.canState('stabbing')){
			this.addState('stabbing');
		} else {
			this.removeState('stabbing');
		}

		// detect sprite state
		if (this.isState('idle')){
			if (
				Date.now() - this.idle_state_last_change > this.idle_state_duration || 
				this.direction != this.last_direction
			){
				let state_rotation = [0, 1, 2, 1];
				this.idle_state = (this.idle_state + 1) % state_rotation.length;
				if (this.direction == 'right'){
					this.sprite.texture = this.idle_right_states[state_rotation[this.idle_state]];
				} else {
					this.sprite.texture = this.idle_left_states[state_rotation[this.idle_state]];
				}
				this.idle_state_last_change = Date.now();
			}
		}

		if (this.isState('moving')){
			if (
				Date.now() - this.moving_state_last_change > this.moving_state_duration || 
				this.direction != this.last_direction
			){
				this.moving_state = (this.moving_state + 1) % this.moving_right_states.length;
				if (this.direction == 'right'){
					this.sprite.texture = this.moving_right_states[this.moving_state];
				} else {
					this.sprite.texture = this.moving_left_states[this.moving_state];
				}
				this.moving_state_last_change = Date.now();
			}
		} else if (
			this.isState('climbing') &&
			this.game.keys['ArrowUp']	
		){
			if (this.direction === 'right'){
				this.sprite.texture = this.climbing_states[0];
			} else {
				this.sprite.texture = this.climbing_states[1];
			}
		} else {
			this.removeState('climbing');
		}

		if (
			this.isState('stabbing') &&
			!this.isState('climbing')	 
		){
			if (this.direction == 'right'){
				this.sprite.texture = this.stabbing_states[0];
			} else {
				this.sprite.texture = this.stabbing_states[2];
			}
		} else {
			this.removeState('stabbing');
		}
		
		this.sprite.x += this.sprite.vx;
		this.sprite.y += this.sprite.vy;
		this.last_direction = this.direction; console.log(this.states);
	}
}

class Game{
	constructor(){
		this.keys = {};
		this.objects = [];
		this.gravity = 0.2;
		this.tile_size = 32;
		function r(){
			let min = 12;
			let max = 15;
			let len = max - min;
			return Math.floor(Math.random() * len) + min;
		}
		this.map = [
			[r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r()],
			[r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r()],
			[r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r()],
			[r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),2,r(),r()],
			[r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),1,r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r()],
			[r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r()],
			[r(),r(),r(),r(),r(),2,r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r()],
			[r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r()],
			[r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),2,r(),r(),r(),r(),r(),r(),r(),r()],
			[r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r()],
			[r(),r(),r(),r(),9,6,6,6,7,r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r()],
			[r(),r(),r(),r(),3,r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r()],
			[r(),r(),r(),r(),3,r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),1,r(),r()],
			[r(),r(),r(),r(),3,r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r(),r()],
			[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
		];
		this.collision_map = {
			floor_collision: [0, 4, 5, 6, 7, 8, 9, 10, 11],
			climbable: [3, 8, 9, 10, 11]
		};
		this.map_index_map = [
			"ground.png",                   // 0
			"rock_1.png",                   // 1
			"rock_2.png",                   // 2
			"stairs.png",                   // 3
			"pipe_complete.png",            // 4
			"pipe_left.png",                // 5
			"pipe_middle.png",              // 6
			"pipe_right.png",               // 7
			"pipe_complete_stairs.png",     // 8
			"pipe_left_stairs.png",         // 9
			"pipe_middle_stairs.png",       // 10
			"pipe_right_stairs.png",        // 11
			"background_1.png",             // 12
			"background_2.png",             // 13
			"background_3.png",             // 14
			"background_4.png"              // 15
		];
		loader
			.add("/assets/images/wormy.json")
			.add("/assets/images/underground.json")
			.on("progress", this.loadProgressHandler)
			.load(this.setup);
	}

	add_map = () => {
		let map_tiles = new PIXI.Container();
		for (let row = 0; row < this.map.length; row++){
			for (let col = 0; col < this.map[row].length; col++){
				let tile_index = this.map[row][col];
				let tile_path = this.map_index_map[tile_index];
				let texture = TextureCache[tile_path];
				let tile = new Sprite(texture);
				let x = col * this.tile_size;
				let y = row * this.tile_size;
				tile.position.set(x, y);
				map_tiles.addChild(tile);
			}
		}
		app.stage.addChild(map_tiles);
	}

	start_debug_circle(x, y){
		const graphics = new PIXI.Graphics();
		graphics.beginFill(0xffffff, 2);
		graphics.drawCircle(x,y,1);
		graphics.endFill();
		app.stage.addChild(graphics);
	}

	loadProgressHandler = (loader, resource) => {
		//console.log("loading: " + resource.url); 
		//console.log("progress: " + loader.progress + "%"); 
	}

	addObject = (obj) => {
		this.objects.push(obj);
	}

	setup = () => {
		// setup key listeners
		window.addEventListener('keydown', (e) => {
			this.keys[e.key] = true;
		})
		window.addEventListener('keyup', (e) => {
			this.keys[e.key] = false;
		})

		// draw map
		this.add_map();

		// add objects
		let wormy = new Wormy(app, this);
		this.addObject(wormy);

		// start loop
		app.ticker.add(delta => this.gameLoop(delta));
	}

	apply_gravity = (obj) => {
		if (Math.abs(obj.vy) < 4){
			obj.vy += this.gravity;
		}
	}

	tile_coordinates = (obj, rel = 'middle') => {
		let row, col;
		if (rel === 'top-left'){
			row = Math.floor(obj.y / this.tile_size) - 1;
			col = Math.floor(obj.x / this.tile_size);
		} else if (rel ==='top-right'){
			row = Math.floor(obj.y / this.tile_size);
			col = Math.floor((obj.x + this.tile_size) / this.tile_size);
		} else if (rel === 'bottom-left'){
			row = Math.floor((obj.y + this.tile_size) / this.tile_size) - 1;
			col = Math.floor(obj.x / this.tile_size);
		} else if (rel === 'bottom-middle'){
			row = Math.floor((obj.y + this.tile_size) / this.tile_size) - 1;
			col = Math.floor((obj.x + (this.tile_size / 2)) / this.tile_size);
		} else if (rel === 'bottom-right'){
			row = Math.floor((obj.y + this.tile_size) / this.tile_size);
			col = Math.floor((obj.x + this.tile_size) / this.tile_size);
		} else if (rel === 'middle') {
			row = Math.floor((obj.y + (this.tile_size / 2)) / this.tile_size);
			col = Math.floor((obj.x + (this.tile_size / 2)) / this.tile_size);
		}
		return { row, col };
	}

	tile_num = (obj, rel) => {
		let {row, col} = this.tile_coordinates(obj, rel);
		return this.map[row][col];
	}

	tile_num_below = (obj, rel) => {
		let {row, col} = this.tile_coordinates(obj, rel);
		return this.map[row + 1][col];
	}

	should_apply_gravity = (obj) => {
		let tile_num = this.tile_num_below(obj, 'bottom-middle');
		let  should = (this.collision_map.floor_collision.indexOf(tile_num) < 0);
		return should;
	}

	can_climb = (obj) => {
		let tile_num = this.tile_num(obj, 'middle');
		let  can = (this.collision_map.climbable.indexOf(tile_num) >= 0);
		return can;
	}

	gameLoop = (delta) => {
		this.objects.forEach(obj => obj.update(delta));
	}
	
}
let game = new Game();
