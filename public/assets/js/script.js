//Aliases
let Application = PIXI.Application,
		loader = PIXI.loader,
		resources = PIXI.loader.resources,
		Rectangle = PIXI.Rectangle,
		TextureCache = PIXI.TextureCache,
		Sprite = PIXI.Sprite;

//Create a Pixi Application
let app = new Application({ antialias: true, backgroundColor: 0x240e0e });
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(800, 472);
//app.renderer.resize(window.innerWidth, window.innerHeight);

//Add the canvas that Pixi automatically created for you to the HTML document
document.querySelector('#root').appendChild(app.view);

// start dev tools
const dev = (text) => document.querySelector('#dev').innerText = text
dev('Developer Tools')
// end dev tools

class GameObject {
	constructor(game){
		this.game = game;
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
}

class RainDrop {

}

class Roach extends GameObject {
	constructor(app, game, position){
		super(game);
		this.states = [];
		this.stunned_states = [
			TextureCache["roach-stunned-R1.png"],
			TextureCache["roach-stunned-L1.png"],
		];
		this.moving_right_states = [
			TextureCache["roach-moving-R1.png"],
			TextureCache["roach-moving-R2.png"],
		];
		this.moving_left_states = [
			TextureCache["roach-moving-L1.png"],
			TextureCache["roach-moving-L2.png"],
		];
		this.direction = (Math.floor(Math.random() * 2)) ? 'right':'left';
		if (this.direction === 'right'){
			this.sprite = new Sprite(this.moving_right_states[0]);
		} else {
			this.sprite = new Sprite(this.moving_left_states[0]);
		}
		this.sprite.x = position.x;
		this.sprite.y = position.y;
		this.sprite.vx = 0;
		this.sprite.vy = 0;
		this.max_vx = 3;
		this.min_vx = -3;
		this.speed = 0.5;
		app.stage.addChild(this.sprite);
	}

	update(){
		if (this.game.should_apply_gravity(this.sprite)){
			this.game.apply_gravity(this.sprite);
			this.addState('airborne');
		} else {
			this.removeState('airborne');
			if (this.sprite.vy > this.FALL_TOLERANCE){
				//console.log('die');
				//this.game.start_debug_circle(this.sprite.x, this.sprite.y);
			}
			this.sprite.vy = 0;
		}
		this.sprite.x += this.sprite.vx;
		this.sprite.y += this.sprite.vy;
	}
}


class Wormy {
	constructor(app, game){
		this.game = game;
		this.JUMP_VELOCITY = -3.8;
		this.FALL_DISTANCE_LIMIT = 30;
		this.isTarget = true;

		// master state
		this.states = ['airborne'];
		this.possible_states = {
			moving: [],
			airborne: [],
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
		];
		this.climbing_state = 0;
		this.climbing_state_duration = 300;
		this.climbing_state_last_change = Date.now();

		// stabing states
		this.stabbing_states = [
			TextureCache["stabbing-R.png"],
			TextureCache["stabbing-R-blood.png"],
			TextureCache["stabbing-L.png"],
			TextureCache["stabbing-L-blood.png"]
		]

		// intial state
		this.sprite = new Sprite(this.idle_right_states[0]);
		this.sprite.x = 32 * 1;
		this.sprite.y = 32 * 12;
		this.sprite.vx = 0;
		this.sprite.vy = 0;
		this.max_vx = 3;
		this.min_vx = -3;
		this.speed = 0.5;
		app.stage.addChild(this.sprite);

		this.last_animation = 'climbing';
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

	updateMotion = () => {
		dev(this.states && 'idle')

		// Apply gravity
		if (!this.isState('climbing')){
			if (this.game.should_apply_gravity(this.sprite)){
				this.game.apply_gravity(this.sprite);
				this.addState('airborne');
			} else {
				this.removeState('airborne');
				if (this.sprite.vy > this.FALL_TOLERANCE){
					//console.log('die');
					//this.game.start_debug_circle(this.sprite.x, this.sprite.y);
				}
				this.sprite.vy = 0;
			}
		} else {
			this.removeState('airborne');
		}

		// update direction & x-axis motion
		if (
			(this.game.keys['ArrowRight'] && !this.game.keys['ArrowLeft']) ||
			(this.game.keys['d'] && !this.game.keys['a'])
		){
			this.direction = 'right';
			if (!this.isState('airborne') && !this.isState('climbing')){
				this.sprite.vx = Math.min(this.sprite.vx + this.speed, this.max_vx);
				this.addState('moving');
			}
		} else if (
			(!this.game.keys['ArrowRight'] && this.game.keys['ArrowLeft']) ||
			(!this.game.keys['d'] && this.game.keys['a'])
		){
			this.direction = 'left';
			if (!this.isState('airborne') && !this.isState('climbing')){
				this.sprite.vx = Math.max(this.sprite.vx - this.speed, this.min_vx);
				this.addState('moving');
			}
		} else if (
			(!this.game.keys['ArrowRight'] && !this.game.keys['ArrowLeft']) &&
			(!this.game.keys['a'] && !this.game.keys['d']) &&
			!this.isState('airborne')
		){
			this.sprite.vx = 0;
			this.removeState('moving');
		}

		// update y-axis motion
		if (this.game.keys['ArrowUp'] || this.game.keys['w']){
			if (
				this.game.can_climb(this.sprite) &&
				this.canState('climbing')
			){
				this.addState('climbing');
				this.sprite.vy = -1;
			} else if (
				this.canState('airborne') &&
				!this.isState('climbing') &&
				!this.isState('airborne')
			) {
				this.addState('airborne');
				if (this.sprite.vy <= 0){
					this.sprite.vy += this.JUMP_VELOCITY;
				}
			} else if (!this.isState('airborne')){
				this.addState('airborne');
				this.removeState('climbing');
				this.sprite.vy += -(Math.abs(this.JUMP_VELOCITY) / 2.7);
			}
		} else {
			this.removeState('climbing');
		}

		// stabbing
		if (this.game.keys[" "] && this.canState('stabbing')){
			this.addState('stabbing');
		} else {
			this.removeState('stabbing');
		}

		let canMove = this.game.check_bounds({
			x: this.sprite.x + this.sprite.vx,
			y: this.sprite.y + this.sprite.vy,
			dir: this.direction
		});
		if (canMove){
			this.sprite.x += this.sprite.vx;
		}
		this.sprite.y += this.sprite.vy;
		this.last_direction = this.direction;

		console.log('worm pos', { x: this.sprite.x, y: this.sprite.y });
	}

	idleAnimation = () => {
		let state_rotation = [0, 1, 2, 1];
		if (Date.now() - this.idle_state_last_change > this.idle_state_duration){
			this.idle_state = (this.idle_state + 1) % state_rotation.length;
			this.idle_state_last_change = Date.now();
		}
		if (this.direction == 'right'){
			this.sprite.texture = this.idle_right_states[state_rotation[this.idle_state]];
		} else {
			this.sprite.texture = this.idle_left_states[state_rotation[this.idle_state]];
		}
	}

	movingAnimation = () => {
		if (Date.now() - this.moving_state_last_change > this.moving_state_duration){
			this.moving_state = (this.moving_state + 1) % this.moving_right_states.length;
			this.moving_state_last_change = Date.now();
		}
		if (this.direction == 'right'){
			this.sprite.texture = this.moving_right_states[this.moving_state];
		} else {
			this.sprite.texture = this.moving_left_states[this.moving_state];
		}
	}

	climbingAnimation = () => {
		if (Date.now() - this.climbing_state_last_change > this.climbing_state_duration){
			this.climbing_state = (this.climbing_state + 1) % 2;
			this.climbing_state_last_change = Date.now();
		}
		this.sprite.texture = this.climbing_states[this.climbing_state];
	}

	stabbingAnimation = () => {
		let index = 0;
		if (this.direction == 'left'){
			index += 2;
		}
		if (this.isState('damaging')){
			index += 1;
		}
		this.sprite.texture = this.stabbing_states[index];
	}

	updateAnimation = () => {
		if (this.states.length <= 0){
			this.idleAnimation();
			this.last_animation = 'idle';
		} else if (this.isState('moving') && !this.isState('stabbing')){
			this.movingAnimation();
			this.last_animation = 'moving';
		} else if (this.isState('climbing') || this.isState('airborne')){
			this.climbingAnimation();
		} else if (this.isState('stabbing')){
			this.stabbingAnimation();
			this.last_animation = 'stabbing';
		}
	}

	update = (delta) => {
		this.updateAnimation();
		this.updateMotion();
	}
}

class Game {
	constructor(){
		this.TERMINAL_VELOCITY = 3.7;
		this.GRAVITY = 0.2;
		this.TILE_SIZE = 32;
		this.SCREEN_ROWS = 15;
		this.INITIAL_SCROLL_SPEED = 0.02;
		this.INITIAL_SCROLL_VELOCITY = 0;

		this.keys = {};
		this.objects = [];

		function r(){
			let min = 22;
			let max = 15;
			let len = max - min;
			return Math.floor(Math.random() * len) + min;
		}
		this.map = [

			/* end zone */
			[23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23],
			[23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23],
			[23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23],
			[23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23],
			[23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23],
			[23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23],
			[23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23],
			[23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23],
			[23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23],
			[23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,24,23,23],
			[23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23],
			[23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23],
			[23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23],
			[23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23],
			[27,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10],

			/* level five */
			/*
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			*/

			/* level four */
			/*
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			*/

			/* level three
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			*/
			[13,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[13,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],
			[13,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,18,22,22,22,22,22,22],
			[13,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,13,22,22,22,22,22,22],
			[13,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,13,22,22,22,22,22,22],
			[13,22,22,22,15,17,22,15,16,16,17,22,22,19,16,16,16,17,13,15,16,16,17,22,22],

			/* level two */
			[15,16,16,21,22,22,22,22,22,22,22,22,22,13,22,22,22,22,13,22,22,22,22,22,22],
			[22,22,22,13,22,22,22,22,22,22,22,22,22,13,22,22,22,22,13,22,22,22,22,22,22],
			[22,22,22,13,22,22,22,22,22,22,22,22,22,13,22,22,22,22,13,22,22,22,22,22,22],
			[22,22,22,13,22,22,22,22,22,22,22,22,22,13,22,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,15,16,16,17,22,15,16,20,17,22,14,22,15,17,22,18,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,13,22,22,22,22,22,22,22,13,22,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,13,22,22,22,22,22,22,22,13,22,22,22,22,22,22],
			[20,16,17,22,15,16,17,22,22,15,16,17,22,22,22,22,22,22,13,22,22,22,22,22,22],
			[13,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,13,22,22,22,22,22,22],
			[13,22,22,22,22,22,22,22,22,22,22,22,15,16,21,22,22,22,26,22,22,22,22,22,22],
			[13,22,22,22,22,22,22,22,22,22,22,22,22,22,13,22,22,22,22,22,22,22,22,22,22],
			[16,16,16,16,21,22,22,22,22,22,22,22,22,22,13,22,22,22,22,22,22,22,22,22,22],
			[22,22,22,22,13,22,22,22,22,22,22,22,22,15,16,17,22,22,15,20,17,22,22,22,22],
			[22,22,22,22,13,22,22,22,22,15,17,22,22,22,22,22,22,22,22,13,22,22,22,22,22],
			[22,22,22,22,13,22,22,14,22,22,22,22,22,22,22,22,22,22,22,13,22,22,22,22,22],


			/* level one */
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,13,22,22,22,22,22],
			[22,22,22,22,15,16,16,16,20,16,17,22,22,22,22,22,22,11,22,13,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,13,22,22,22,22,22,22,22,22,22,22,13,22,22,22,22,22],
			[22,22,22,12,22,22,22,22,15,21,22,22,22,22,22,22,22,22,22,13,22,22,12,22,22],
			[22,22,22,22,22,22,22,22,22,13,22,22,11,22,22,22,22,22,22,13,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,13,22,22,22,22,22,22,22,22,22,13,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,13,22,22,22,22,22,22,22,22,22,13,22,22,22,22,22],
			[22,22,22,22,22,22,22,22,22,15,16,17,22,22,22,15,20,16,16,16,20,17,22,22,22],
			[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,13,22,22,22,13,22,22,22,22],
			[22,22,15,16,16,16,20,16,17,22,22,22,22,22,22,22,13,22,22,22,13,22,22,22,22],
			[22,22,22,22,22,22,13,22,22,22,22,22,22,22,22,22,13,22,22,22,13,22,22,22,22],
			[22,22,22,22,19,16,16,17,22,22,22,15,16,16,16,16,16,16,17,22,13,22,22,22,22],
			[22,22,22,22,13,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,13,22,11,22,22],
			[22,22,22,22,13,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,13,22,22,22,22],
			[10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10]
		];
		this.mapOffset = this.map.length - this.SCREEN_ROWS;
		this.initialY = this.mapOffset * this.TILE_SIZE;

		this.collision_map = {
			floor_collision: [10, 14, 15, 16, 17, 18, 19, 20, 21, 27],
			climbable: [13, 18, 19, 20, 21, 27],
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
			"background_1.png",             // 22
			"background_2.png",             // 13
			"background_3.png",             // 14
			"background_4.png",             // 15
			"stairs_broken.png",            // 16
			"stairs_ground.png"             // 17
		];
		loader
			.add("/assets/images/wormy.json")
			.add("/assets/images/background.json")
			.add("/assets/images/roach.json")
			.on("progress", this.loadProgressHandler)
			.load(this.setup);
	}

	add_map = () => {
		let map_tiles = new PIXI.Container();
		for (let row = 0; row < this.map.length; row++){
			for (let col = 0; col < this.map[row].length; col++){
				let tile_index = this.map[row][col];
				let tile_path = this.map_index_map[tile_index - 10];
				let texture = TextureCache[tile_path];
				let tile = new Sprite(texture);
				let x = col * this.TILE_SIZE;
				let y = ((row - this.mapOffset) * this.TILE_SIZE);
				tile.position.set(x, y);
				map_tiles.addChild(tile);
			}
		}
		app.stage.addChild(map_tiles);
		return map_tiles;
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
		if (typeof obj === 'object' && obj.length){
			for (let i = 0; i < obj.length; i++){
				this.objects.push(obj[i]);
			}
		} else {
			this.objects.push(obj);
		}
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
		this.map_container = this.add_map();

		this.map_container.y = this.initialY;

		// start loop
		app.ticker.add(delta => this.gameLoop(delta));
	}

	apply_gravity = (obj) => {
		if (obj.vy < this.TERMINAL_VELOCITY){
			obj.vy += this.GRAVITY;
		}
	}

	check_bounds = (obj) => {
		if (obj.dir === 'right'){
			let tile_tr = this.tile_coordinates(obj, 'top-right');
			let tile_br = this.tile_coordinates(obj, 'bottom-right');
			if (
				!(this.map[tile_tr.row] && this.map[tile_tr.row][tile_tr.col]) ||
				!(this.map[tile_br.row] && this.map[tile_br.row][tile_br.col])
			){
				return false;
			}
		} else {
			let tile_tl = this.tile_coordinates(obj, 'top-left');
			let tile_bl = this.tile_coordinates(obj, 'bottom-left');
			if (
				!(this.map[tile_tl.row] && this.map[tile_tl.row][tile_tl.col]) ||
				!(this.map[tile_bl.row] && this.map[tile_bl.row][tile_bl.col])
			){
				return false;
			}
		}
		return true;
	}

	tile_coordinates = (obj, rel = 'middle') => {
		let temp_y = obj.y - this.map_container.y;
		let row, col;
		if (rel === 'top-left'){
			row = Math.floor(temp_y / this.TILE_SIZE);
			col = Math.floor(obj.x / this.TILE_SIZE);
		} else if (rel ==='top-right'){
			row = Math.floor(temp_y / this.TILE_SIZE);
			col = Math.floor((obj.x + this.TILE_SIZE) / this.TILE_SIZE);
		} else if (rel === 'bottom-left'){
			row = Math.floor((temp_y + this.TILE_SIZE) / this.TILE_SIZE);
			col = Math.floor(obj.x / this.TILE_SIZE);
		} else if (rel === 'bottom-middle'){
			row = Math.floor((temp_y + this.TILE_SIZE) / this.TILE_SIZE);
			col = Math.floor((obj.x + (this.TILE_SIZE / 2)) / this.TILE_SIZE);
		} else if (rel === 'bottom-right'){
			row = Math.floor((temp_y + this.TILE_SIZE) / this.TILE_SIZE);
			col = Math.floor((obj.x + this.TILE_SIZE) / this.TILE_SIZE);
		} else if (rel === 'middle') {
			row = Math.floor((temp_y + (this.TILE_SIZE / 2)) / this.TILE_SIZE);
			col = Math.floor((obj.x + (this.TILE_SIZE / 2)) / this.TILE_SIZE);
		}
		row += this.mapOffset;
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
		let bm_y = (obj.y + this.TILE_SIZE);
		let bm_x = (obj.x + this.TILE_SIZE / 2);
		let col = Math.floor(bm_x / this.TILE_SIZE);
		let should = true;
		for (let i = 0; i < this.map.length; i++){
			let tile_num = this.map[i][col];
			if ((this.collision_map.floor_collision.indexOf(tile_num) >= 0)){
				let collision_line = (this.TILE_SIZE * (i - this.mapOffset));
				collision_line += this.map_container.y;
				if (bm_y <= collision_line && bm_y > (collision_line - this.TERMINAL_VELOCITY - 0.1)){
					obj.y = collision_line - this.TILE_SIZE;
					should = false;
				}
			}
		}
		return should;
	}

	can_climb = (obj) => {
		let tile_num = this.tile_num(obj, 'middle');
		let  can = (this.collision_map.climbable.indexOf(tile_num) >= 0);
		return can;
	}

	reset = () => {
		// reset game after death
	}

	setTarget = (game_obj) => {
		this.objects.forEach((obj) => {
			obj.isTarget === false;
		})
		game_obj.isTarget = true;
	}

	moveCamera = (direction) => {
		switch (direction){
			case 'UP':
				if ((this.map_container.y + 1) <= (this.TILE_SIZE * this.map.length) - (this.TILE_SIZE * this.SCREEN_ROWS)){
					this.objects.forEach((obj) => {
						obj.sprite.y += 1;
					});
				}
				this.map_container.y += 1;
			break;
			case 'DOWN':
				if ((this.map_container.y - 1) >= 0){
					this.objects.forEach((obj) => {
						obj.sprite.y -= 1;
					});
					this.map_container.y -= 1;
				}
			break;
		}
	}

	initObjects = () => {
		// add objects
		let objects = [
			new Wormy(app, this),
			new Roach(app, this, { x: 32 * 13, y: 32 * 13}),
			new Roach(app, this, { x: 32 * 3, y: 32 * 8})
		];
		this.addObject(objects);
	}

	gameLoop = (delta) => {
		this.objects.forEach((obj) => {
			obj.update(delta);

			if (obj.isTarget){
				const PADDING = 4;
				const UPPER_BOUND = this.TILE_SIZE * PADDING;
				const LOWER_BOUND = this.TILE_SIZE * (this.SCREEN_ROWS - PADDING);
				let temp_y = obj.sprite.y - this.map_container.y;
				if (temp_y < (UPPER_BOUND - this.map_container.y)){
					this.moveCamera('UP');
				} else if (temp_y > (LOWER_BOUND - this.map_container.y)){
					this.moveCamera('DOWN');
				}
			}
		});

		if (this.map_container.y > 0 && !this.keys['i'] && this.initialY != null){
			this.INITIAL_SCROLL_VELOCITY += this.INITIAL_SCROLL_SPEED;
			this.map_container.y -= this.INITIAL_SCROLL_VELOCITY;
		} else if (this.initialY != null){
			this.initialY = null;
			this.initObjects();
		}

		// dev camera controls
		if (this.keys['i']){
			this.moveCamera('UP');
		} else if (this.keys['k']){
			this.moveCamera('DOWN');
		}
	}
}
let game = new Game();

