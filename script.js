"use strict";
//Classes

class Enemy {
    constructor(){
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.d = 0;
        this.spin = 0;
        this.size = 64;
        this.hp = 0;
        this.hurt = false;
        this.active = false;
    }

    spawn(x,y,md,v,d,spin,size,hp){
        this.x = x;
        this.y = y;
        this.vx = v*Math.cos(md);
        this.vy = v*Math.sin(md);
        this.speed = v
        this.d = d;
        this.md = md
        this.spin = spin;
        this.size = size;
        this.hp = hp;
        this.active = true;
    };

    split(){
        this.size >= 320?this.hp = 5:this.hp = 1;
        this.size *= .5;
        this.speed *= 2;
        this.vx = this.speed*Math.cos(this.md);
        this.vy = this.speed*Math.sin(this.md);
        const _prevSpin = this.spin;
        this.spin *= 1+Math.random()*.5-.25;
        const _split1 = enemyPool.getDormantEnemy();
        if(!_split1)return;
        _split1.active = true;
        const _split2 = enemyPool.getDormantEnemy();
        if(!_split2)return;
        _split2.active = true;
        _split1.spawn(this.x,this.y,this.md+Math.PI*.667,this.speed,this.d,_prevSpin*Math.random()*.5-.25,this.size,this.hp);
        _split2.spawn(this.x,this.y,this.md-Math.PI*.667,this.speed,this.d,_prevSpin*Math.random()*.5-.25,this.size,this.hp);
    }

    update(dt){
        if (!this.active) return;
        if (this.hurt) this.hurt = false
        this.x += this.vx*dt;
        this.y += this.vy*dt;
        this.d += this.spin;
        if(Math.abs(this.x)>canvas.width*.5+this.size*.75){
            this.x = -(canvas.width*.5+this.size*.75)*Math.sign(this.x)
        };
        if(Math.abs(this.y)>canvas.height*.5+this.size*.75){
            this.y = -(canvas.height*.5+this.size*.75)*Math.sign(this.y)
        };
    };
};

class EnemyPool {
    pool = [];
    constructor(size = 256){
        for (let i=0;i<size;i++){
            const enemy = new Enemy();
            this.pool.push(enemy);
        };
    };

    getDormantEnemy(){
        for (let i=0;i<this.pool.length;i++){
            if(!this.pool[i].active) return this.pool[i];
        };
        return undefined
    };

    updateAll(dt){
        if (ctrl.space){if(this.getDormantEnemy()){this.getDormantEnemy().spawn(Math.random()*canvas.width-canvas.width/2,Math.random()*canvas.height-canvas.height/2,Math.random()*2*Math.PI-Math.PI,5,1,0.04,320,20)}}
        for (let i=0;i<this.pool.length;i++){
            this.pool[i].update(dt)
        };
    };
};

class Bullet {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
  }

  spawn(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.x += this.vx*dt;
    this.y += this.vy*dt;

    // Deactivate if off-screen (example bounds: 800x600)
    if (this.x < canvas.width*-0.5 || this.x > canvas.width*0.5 || this.y < canvas.height*-0.5 || this.y > canvas.height*0.5) {
      this.active = false;
    }
  }
}

class BulletPool {
  constructor(size = 32) {
    this.pool = [];
    for (let i = 0; i < size; i++) {
      this.pool.push(new Bullet());
    }
  }

  getDormantBullet() {
    // Find an inactive bullet
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }
    // Optionally expand pool if all are active
    const newBullet = new Bullet();
    this.pool.push(newBullet);
    return newBullet;
  }

  updateAll(dt) {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].update(dt);
    }
  }
}


//Functions

function resizeCanvas() {
    canvas.style.width = `100%`;
    canvas.style.height = `100%`;
    // 1. Get the layout boundaries determined by your CSS (100% width/height)
    const rect = canvas.getBoundingClientRect();
    
    // 2. Account for High-DPI screens (Retina displays)
    const dpr = window.devicePixelRatio || 1;
    
    // 3. Scale the internal canvas bitmap size to match layout * pixel density
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // 4. Force the CSS display footprint to remain exactly what it should be
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    // 5. Scale the drawing context so your drawing commands don't warp
    ctx.translate(canvas.width/2,canvas.height/2);
    ctx.scale(dpr,dpr);
}

const loadImages = async function() {
    const loadSingleImage = function(url){
        return new Promise((resolve, reject) => {
            const _img = new Image();
            _img.onload = () => resolve(_img);
            _img.onerror = (err) => reject(err);
            _img.src = "assets/"+url;
        });
    };
    try {
        const images = await Promise.all(imageNames.map(loadSingleImage));

        const imgCanvasctx = imgCanvas.getContext("2d");
        imgCanvas.width = 1024;
        imgCanvas.height = 320;

        let x = 0;
        for (const image of images) {
            imgCanvasctx.drawImage(image, x, 0);
            x += image.width;
        }
        
        document.querySelector("#loading").style.display = "none";
        document.querySelector("#start").style.display = "block";
    } catch (error) {
        console.error('An unexpected error occurred:', error);
    };
};

const fireBullet = function() {
    --timing
    if (!ctrl.lclick||timing>=0) return;
    const bullet = bulletPool.getDormantBullet();
    const speed = BULLETSPEED+Math.floor(Math.random()*4-2)
    bullet.spawn(player.px,player.py,speed*Math.cos(player.d),speed*Math.sin(player.d));
    timing = BULLETTIMIMG+Math.floor(Math.random()*2-1)
};

const checkCollisions = function(){
    for (let i=bulletPool.pool.length-1;i>=0;i--){
        let bullet = bulletPool.pool[i];
        if (!bullet.active) continue;
        for (let j=enemyPool.pool.length-1;j>=0;j--){
            let enemy = enemyPool.pool[j];
            if (!enemy.active) continue;
            
            let dx = bullet.x - enemy.x;
            let dy = bullet.y - enemy.y;

            const collisionRadius = enemy.size/2 + 4;
            if (dx*dx+dy*dy<collisionRadius*collisionRadius){
                enemy.hp -= 1;
                enemy.hurt = true;
                if(enemy.hp<=0){enemy.size>40?enemy.split():enemy.active=false}
                bullet.active = false;
                break;
            }
        };
    };
};

const draw = function() {
    //lots of steps here, so im going to label them
    //clear canvas
    ctx.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height)
    //draw line    
    /*ctx.beginPath();
    ctx.strokeStyle = "#ff0000"
    ctx.lineWidth = 5
    ctx.setLineDash([16,12])
    ctx.moveTo(player.px+(canvas.width/2),player.py+(canvas.height/2));
    ctx.lineTo(mousePos.x+(canvas.width/2),mousePos.y+(canvas.height/2));
    ctx.stroke();*/
    for (let i=0;i<enemyPool.pool.length;i++){
        if (enemyPool.pool[i].active){
            ctx.save();
            ctx.translate(enemyPool.pool[i].x,enemyPool.pool[i].y)
            ctx.rotate(enemyPool.pool[i].d)
            if (enemyPool.pool[i].hurt) ctx.filter = 'brightness(0) invert(1)';
            ctx.drawImage(imgCanvas, 160, 0, 320, 320, enemyPool.pool[i].size/64*-40, enemyPool.pool[i].size/64*-40, enemyPool.pool[i].size/64*80, enemyPool.pool[i].size/64*80);
            ctx.filter = 'none';
            ctx.restore();
    }};
    for (let i=0;i<bulletPool.pool.length;i++){
        if (bulletPool.pool[i].active){
            ctx.save();
            ctx.translate(bulletPool.pool[i].x,bulletPool.pool[i].y)
            ctx.drawImage(imgCanvas, 128, 0, 32, 32, -8, -8, 16, 16)
            ctx.restore();
    }};

    //save state
    ctx.save();
    //transform player
    ctx.translate(player.px,player.py);
    ctx.rotate(player.d);
    //draw player
    ctx.drawImage(imgCanvas, 0, 0, 128, 128,-32,-32,64,64);
    ctx.restore();
};

const updateKey = function(state,e) {
    switch (e.code) {
        case "KeyW":
        case "ArrowUp":
            ctrl.up = state;
            break;
        case "KeyA":
        case "ArrowLeft":
            ctrl.left = state;
            break;
        case "KeyS":
        case "ArrowDown":
            ctrl.down = state;
            break;
        case "KeyD":
        case "ArrowRight":
            ctrl.right = state;
            break;
        case "Space":
            ctrl.space = state;
            break;
        case "ShiftLeft":
            ctrl.shift = state;
            break;
    };
};

const updateMouse = function (state,e) {
    switch (e.button) {
        case 0:
            ctrl.lclick = state;
            break;
        case 1:
            ctrl.mclick = state;
            break;
        case 2:
            ctrl.rclick = state;
            break;
    };
};

const printDebug = function () {
    debug.textContent = `
    mouse:${Math.round(mousePos.x)+", "+Math.round(mousePos.y)}
    keys:${ctrl.left+ctrl.right+ctrl.up+ctrl.down+ctrl.space+ctrl.lclick+ctrl.rclick+ctrl.mclick}
    player:${Math.round(player.px)+","+Math.round(player.py)+","+Math.round(player.d)}
    `
};

const updatePlayer = function (dt) {
    const _difX = mousePos.x-player.px;
    const _difY = mousePos.y-player.py;
    player.d = Math.atan2(_difY,_difX);
    //if (difX!=0||difY!=0){playerImg.style.transform = `translate(-50%,-50%) rotate(${Math.atan2(difY,difX) * (180/Math.PI)}deg)`};

    player.vx += (ctrl.right-ctrl.left)*(ctrl.shift?SLOWSPEED:SPEED)*dt;
    player.vy += (ctrl.down-ctrl.up)*(ctrl.shift?SLOWSPEED:SPEED)*dt;
    player.vx *= FRICTION
    player.vy *= FRICTION
    player.px += player.vx*dt
    player.py += player.vy*dt
    if (Math.abs(player.px)>canvas.width/2){
        player.px = canvas.width*.5*Math.sign(player.px)
    }
    if (Math.abs(player.py)>canvas.height/2){
        player.py = canvas.height*.5*Math.sign(player.py)
    }

    //player.style.top = `${50((0-player.y)/9)}%`;
    //player.style.left = `${50((0-player.x)/16)}%`;
};



const setup = function(){
    requestAnimationFrame(gameLoop);
}

const gameLoop = function(timestamp){
    if (!lt){lt = timestamp};
    let dt = (timestamp - lt) *1000
    if (dt>0.1){dt=0.1}
    lt = timestamp
    updatePlayer(dt);
    fireBullet();
    bulletPool.updateAll(dt);
    enemyPool.updateAll(dt);
    checkCollisions()
    draw();
    printDebug();
    

    requestAnimationFrame(gameLoop);
};

//DOM Elements
const debug = document.querySelector("#debug");
const gameFrame = document.querySelector("#game");
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d")
//const player = document.querySelector("#player");
//const playerImg = document.querySelector("#playerImg");
//Constants
const BULLETSPEED = 200
const BULLETTIMIMG = 4
const DTCAP = 0.1
const SPEED = 72
const SLOWSPEED = 36
const FRICTION = 0.95
//Variables & Lists
const player = {px:0,py:0,vx:0,vy:0,d:0}
let frameSize = gameFrame.getBoundingClientRect();
const bullets = []
const mousePos = {x:0,y:0};
const ctrl = {
    left:false,
    right:false,
    up:false,
    down:false,
    space:false,
    shift:false,
    lclick:false,
    rclick:false,
    mclick:false,
}
//Images
const imageNames = [
    "ship1.svg",
    "bullet1.svg",
    "orange.svg",
    "aimer.svg"
]
const imgCanvas = document.createElement("canvas");
const bulletPool = new BulletPool()
const enemyPool = new EnemyPool()
let timing = 0;
let lt;

//Event Listeners
resizeCanvas()
window.addEventListener("resize", resizeCanvas);
document.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;   // Relationship between buffer and display width
    const scaleY = canvas.height / rect.height; // Relationship between buffer and display height

    mousePos.x = e.clientX * scaleX - canvas.width/2;
    mousePos.y = e.clientY * scaleY - canvas.height/2;
});
document.addEventListener("keydown", (e)=>{updateKey(true,e)},{passive:true});
document.addEventListener("keyup", (e)=>{updateKey(false,e)},{passive:true});
document.addEventListener("mousedown", (e)=>{updateMouse(true,e)},{passive:true});
document.addEventListener("mouseup", (e)=>{updateMouse(false,e)},{passive:true});

//Img loading
loadImages()
//Main Code

