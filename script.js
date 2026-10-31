"use strict";
/*
Orangeoids: A space shooter game that can run in your browser.
Copyright (C) 2026  Edmund Kuah

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
//Classes

class Flash{
    constructor(){
        this.x = 0
        this.y = 0
        this.godRay = false
        this.alpha = 0
        this.active = false
    }
    spawn(x,y,godRay){
        this.x = x
        this.y = y
        this.godRay = godRay
        this.alpha = 1.0
        this.active = true
    }

    update(){
        if (!this.active) return;
        this.godRay?this.alpha-=.01:this.alpha-=.25;
        if (this.alpha <=0)this.active=false
    }
}

class FlashPool{
    pool=[]
    constructor(size=8){
        for(let i=0;i<size;i++){
            this.pool.push(new Flash())
        }
    }
    getDormantFlash(){
        for (let i = 0; i < this.pool.length; i++) {
            if (!this.pool[i].active) {
                return this.pool[i];
            }
        }
        // Optionally expand pool if all are active
        const newFlash = new Flash();
        this.pool.push(newFlash);
        return newFlash;
    }
    updateAll(){
        for (let i=0;i<this.pool.length;i++){
            this.pool[i].update()
        }
    }
}

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
        this.size>=320?score+=9:this.size>=160?score+=1:void 0;
        this.size >= 320?this.hp = 8:this.hp = 1;
        if(this.size >= 320)shake(50,player.d);
        this.size *= .5;
        this.speed *= 2;
        this.vx = this.speed*Math.cos(this.md);
        this.vy = this.speed*Math.sin(this.md);
        const _prevSpin = this.spin;
        this.spin *= .75+Math.random()*.5;
        const _split1 = enemyPool.getDormantEnemy();
        if(!_split1)return;
        _split1.active = true;
        const _split2 = enemyPool.getDormantEnemy();
        if(!_split2)return;
        _split2.active = true;
        _split1.spawn(this.x,this.y,this.md+Math.PI*.7,this.speed,this.d,_prevSpin*(.75+Math.random()*.5),this.size,this.hp);
        _split2.spawn(this.x,this.y,this.md-Math.PI*.7,this.speed,this.d,_prevSpin*(.75+Math.random()*.5),this.size,this.hp);
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
    delay = 25;
    #delayDeincrement = 0
    constructor(size = 256){
        for (let i=0;i<size;i++){
            this.pool.push(new Enemy());
        };
    };

    getDormantEnemy(){
        for (let i=0;i<this.pool.length;i++){
            if(!this.pool[i].active) return this.pool[i];
        };
        return undefined
    };

    updateAll(dt){
        const goToEdge = function(angle) {
            const halfW = (canvas.width+640) / 2;
            const halfH = (canvas.height+640) / 2;

            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            // Avoid division by zero if moving perfectly vertically or horizontally
            const absCos = Math.abs(cos) < 1e-9 ? 1e-9 : Math.abs(cos);
            const absSin = Math.sin(angle) === 0 ? 1e-9 : Math.abs(sin);

            // Calculate the distance to the vertical edges and horizontal edges
            const tHorizontal = halfW / absCos;
            const tVertical = halfH / absSin;

            // The smaller distance is where it hits the edge first
            const t = Math.min(tHorizontal, tVertical);

            // Multiply the normalized direction vector by the scaling factor
            return {
                x: cos * t,
                y: sin * t
            };
        }

        //debug oranges
        //if (ctrl.space){if(this.getDormantEnemy()){this.getDormantEnemy().spawn(Math.random()*canvas.width-canvas.width/2,Math.random()*canvas.height-canvas.height/2,Math.random()*2*Math.PI-Math.PI,5,1,0.04,320,32)}}
        this.delay += dt/5;
        if (this.delay>ENEMYDELAY-this.#delayDeincrement) {
            this.delay = 0;
            this.#delayDeincrement<15?this.#delayDeincrement+=0.5:void(0);
            const _dir = Math.random()*Math.PI*2;
            const _coords = goToEdge(_dir);
            if(this.getDormantEnemy()){this.getDormantEnemy().spawn(_coords.x,_coords.y,_dir+Math.PI,5,_dir,0.04,320,32);console.debug("enemy spawned")}
        };
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

const shake = function(intensity,direction){
    shakeI = intensity;
    shakeD = direction;
    shakeTick = 0
}

const resizeCanvas = function() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 3. Calculate the best matching 16:9 physical size
    let width = windowWidth;
    let height = windowWidth * (9 / 16);

    if (height > windowHeight) {
        height = windowHeight;
        width = windowHeight * (16 / 9);
    }

    // 4. Set the actual bitmap resolution (for sharp graphics)
    canvas.width = 1920;
    canvas.height = 1080;

    // 5. Update the CSS display size to fit the screen
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.translate(canvas.width/2,canvas.height/2)
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
        imgCanvas.width = 1500;
        imgCanvas.height = 320;

        let x = 0;
        for (const image of images) {
            imgCanvasctx.drawImage(image, x, 0);
            x += image.width;
        }


        const bigImages = await Promise.all(bigImageNames.map(loadSingleImage));

        const bigImgCanvasctx = bigImgCanvas.getContext("2d");
        bigImgCanvas.width = 2800;
        bigImgCanvas.height = 2800;

        x = 0;
        for (const image of bigImages) {
            bigImgCanvasctx.drawImage(image, x, 0);
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
    for (let i=enemyPool.pool.length-1;i>=0;i--){
        const enemy = enemyPool.pool[i];
        if (!enemy.active) continue;
        for (let j=bulletPool.pool.length-1;j>=0;j--){
            const bullet = bulletPool.pool[j];
            if (!bullet.active) continue;
            
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;

            const collisionRadius = enemy.size/2 + 4;
            if (dx*dx+dy*dy<collisionRadius*collisionRadius){
                score+=1;
                enemy.hp -= 1;
                enemy.hurt = true;
                if(enemy.hp<=0){flashPool.getDormantFlash().spawn(enemy.x,enemy.y,enemy.size>=320);enemy.size>40?enemy.split():enemy.active=false}
                bullet.active = false;
                break;
            };
        };
        const dx = player.px - enemy.x;
        const dy = player.py - enemy.y;
        const collisionRadius = enemy.size/2 + 32;
        if (dx*dx+dy*dy<collisionRadius*collisionRadius&&player.i!=-59){
                player.hp -= 2.5
                if (player.hp<=0){gameOver()}
                player.i = -60
                break;
            };
    };
};

const draw = function() {
    //clear canvas
    ctx.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height)
    ctx.translate(shakeX,shakeY);
    for (let i=0;i<enemyPool.pool.length;i++){
        if(!enemyPool.pool[i].active)continue;
            ctx.save();
            ctx.translate(enemyPool.pool[i].x,enemyPool.pool[i].y)
            ctx.rotate(enemyPool.pool[i].d)
            if (enemyPool.pool[i].hurt) ctx.filter = "brightness(0) invert(1)";
            ctx.drawImage(imgCanvas, 160, 0, 320, 320, enemyPool.pool[i].size/64*-40, enemyPool.pool[i].size/64*-40, enemyPool.pool[i].size/64*80, enemyPool.pool[i].size/64*80);
            ctx.filter = "none";
            ctx.restore();
    };
    for (let i=0;i<bulletPool.pool.length;i++){
        if (!bulletPool.pool[i].active)continue;
        ctx.save();
        ctx.translate(bulletPool.pool[i].x,bulletPool.pool[i].y);
        ctx.drawImage(imgCanvas, 128, 0, 32, 32, -8, -8, 16, 16);
        ctx.restore();
    };

    //save state
    ctx.save();
    //transform player
    ctx.translate(player.px,player.py);
    ctx.rotate(player.d);
    if (player.i === -60) ctx.filter = "brightness(0) invert(1)";
    //draw player
    ctx.drawImage(imgCanvas, 0, 0, 128, 128,-32,-32,64,64);
    ctx.filter = "none"
    ctx.restore();
    //Flashes
    ctx.globalCompositeOperation = "lighter";
    for(let i=0;i<flashPool.pool.length;i++){
        ctx.save();
        if(!flashPool.pool[i].active)continue;
        ctx.translate(flashPool.pool[i].x,flashPool.pool[i].y)
        ctx.globalAlpha = flashPool.pool[i].alpha
        flashPool.pool[i].godRay?ctx.drawImage(bigImgCanvas, 0,0,2800,2800,-1400,-1400,2800,2800):ctx.drawImage(imgCanvas, 480,0,160,160,-80,-80,160,160);
        ctx.restore();
    }
    
    ctx.globalAlpha = 1.0
    ctx.translate(-shakeX,-shakeY);
    //Health bar
    ctx.fillStyle = "#000"
    ctx.fillRect(-canvas.width/2+10,canvas.height/2-10,320,-40);
    ctx.fillStyle = `hsl(${player.hp*2.4},100%,50%)`
    ctx.fillRect(-canvas.width/2+20,canvas.height/2-20,player.hp*6,-20);
    //Score
    ctx.fillStyle = "#ff0";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4
    ctx.font = "bold 64px sans-serif"
    ctx.strokeText(score,-canvas.width/2+10,-canvas.height/2+64)
    ctx.fillText(score,-canvas.width/2+10,-canvas.height/2+64)

    ctx.globalCompositeOperation = "source-over"
    
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

const gameOver = function(){
    game = false;
    console.log("game over")
}

const updateShake = function(){
    if (shakeI === 0) {
        shakeX = 0;
        shakeY = 0;
        return;
    }
    shakeTick++
    if((shakeTick%3) !== 0)return;
    shakeX = shakeI*Math.cos(shakeD);
    shakeY = shakeI*Math.sin(shakeD);
    shakeI *= SHAKEDAMPING;
    if (Math.abs(shakeI)<0.1) {
        shakeI = 0;
        shakeX = 0;
        shakeY = 0;
    }
}

const printDebug = function () {
    debug.textContent = `
    mouse:${Math.round(mousePos.x)+", "+Math.round(mousePos.y)}
    keys:${ctrl.left+ctrl.right+ctrl.up+ctrl.down+ctrl.space+ctrl.lclick+ctrl.rclick+ctrl.mclick}
    player:${Math.round(player.px)+","+Math.round(player.py)+","+Math.round(player.d)}
    hp:${player.hp}
    `
};

const updatePlayer = function (dt) {
    player.i+=1
    if (player.i>0&&player.hp<50){player.hp+=.05;player.hp=Math.round(player.hp*100)/100}
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
    flashPool.updateAll()
    checkCollisions();
    updateShake()
    draw();
    printDebug();
    if (!game){return;};

    requestAnimationFrame(gameLoop);
};

//DOM Elements
const debug = document.querySelector("#debug");
const gameFrame = document.querySelector("#game");
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
//const player = document.querySelector("#player");
//const playerImg = document.querySelector("#playerImg");
//Constants
const SHAKEDAMPING = -0.9
const BULLETSPEED = 200;
const BULLETTIMIMG = 4;
const DTCAP = 0.1;
const SPEED = 72;
const SLOWSPEED = 36;
const FRICTION = 0.95;
const ENEMYDELAY = 20;
//Variables & Lists
const player = {px:0,py:0,vx:0,vy:0,d:0,hp:50,i:-60}
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
};
//Images
const imageNames = [
    "ship1.svg",
    "bullet1.svg",
    "orange.svg",
    "flash.svg"
];
const bigImageNames = [
    "godRays.svg"
]
const imgCanvas = document.createElement("canvas");
const bigImgCanvas = document.createElement("canvas");
const bulletPool = new BulletPool();
const enemyPool = new EnemyPool();
const flashPool = new FlashPool();
let timing = 0;
let lt;
let shakeX = 0;
let shakeY = 0;
let shakeI = 0;
let shakeD = 0;
let shakeTick = 0;
let score = 0;
let game = true

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
loadImages();
//Main Code
