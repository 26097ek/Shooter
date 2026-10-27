"use strict";
//Classes

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

  update() {
    if (!this.active) return;
    this.x += this.vx;
    this.y += this.vy;

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

  getBullet() {
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

  updateAll() {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].update();
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
    //ctx.scale(1,1);
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
        const _imagePromises = imageNames.map(url => loadSingleImage(url));
        const _results = await Promise.allSettled(_imagePromises);

        // Filter out the ones that succeeded
        const _images = _results.flatMap(r => r.status === 'fulfilled' ? [{i:r.value,h:r.value.height,w:r.value.width}] : []);

        console.debug(_images);
        shipImgs = _images.slice(0,1);
        bulletImgs = _images.slice(1,2);
        document.querySelector("#loading").style.display = "none";
        document.querySelector("#start").style.display = "block";
    } catch (error) {
        console.error('An unexpected error occurred:', error);
    };
};

const fireBullet = function() {
    console.debug(--timing)
    if (!ctrl.lclick||timing>=0) return;
    const bullet = bulletPool.getBullet();
    bullet.spawn(player.px,player.py,BULLETSPEED*Math.cos(player.d),BULLETSPEED*Math.sin(player.d));
    timing = BULLETTIMIMG+Math.floor(Math.random()*2-1)
};

const draw = function(pImg,bImg) {
    //lots of steps here, so im going to label them
    //clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    //draw line    
    ctx.beginPath();
    ctx.strokeStyle = "#ff0000"
    ctx.lineWidth = 5
    ctx.setLineDash([16,12])
    ctx.moveTo(player.px+(canvas.width/2),player.py+(canvas.height/2));
    ctx.lineTo(mousePos.x+(canvas.width/2),mousePos.y+(canvas.height/2));
    ctx.stroke();
    if (ctrl.lclick){
        ctx.save();
        //transform 
        ctx.translate(mousePos.x+(canvas.width/2),mousePos.y+(canvas.height/2));
        //draw 
        ctx.drawImage(bImg.i, -bImg.w / 2, -bImg.h / 2, bImg.w, bImg.h);
        ctx.restore();
    }
    for (let i=0;i<bulletPool.pool.length;i++){

        if (bulletPool.pool[i].active){
            ctx.save();
            ctx.translate(bulletPool.pool[i].x+(canvas.width/2),bulletPool.pool[i].y+(canvas.height/2))
            ctx.drawImage(bImg.i, -bImg.w / 2, -bImg.h / 2, bImg.w, bImg.h)
            ctx.restore();
    }
    }
    //save state
    ctx.save();
    //transform player
    ctx.translate(player.px+(canvas.width/2),player.py+(canvas.height/2));
    ctx.rotate(player.d);
    //draw player
    ctx.drawImage(pImg.i, -pImg.w / 2, -pImg.h / 2, pImg.w, pImg.h);
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

const updatePlayer = function () {
    const _difX = mousePos.x-player.px;
    const _difY = mousePos.y-player.py;
    player.d = Math.atan2(_difY,_difX);
    //if (difX!=0||difY!=0){playerImg.style.transform = `translate(-50%,-50%) rotate(${Math.atan2(difY,difX) * (180/Math.PI)}deg)`};

    player.vx += (ctrl.right-ctrl.left)*(ctrl.shift?SLOWSPEED:SPEED)
    player.vy += (ctrl.down-ctrl.up)*(ctrl.shift?SLOWSPEED:SPEED)
    player.vx *= FRICTION
    player.vy *= FRICTION
    player.px += player.vx
    player.py += player.vy
    if (player.px<canvas.width/-2) {
        player.px = canvas.width/-2
    } else if(player.px>canvas.width/2){
        player.px = canvas.width/2
    }
    if (player.py<canvas.height/-2) {
        player.py = canvas.height/-2
    } else if(player.py>canvas.height/2){
        player.py = canvas.height/2
    }


    //player.style.top = `${50((0-player.y)/9)}%`;
    //player.style.left = `${50((0-player.x)/16)}%`;
};

const setup = function(){
    bulletPool = new BulletPool();
    requestAnimationFrame(gameLoop)
}

const gameLoop = function(timestamp){
    updatePlayer();
    fireBullet();
    bulletPool.updateAll();
    draw(shipImgs[0],bulletImgs[0]);
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
const BULLETSPEED = 20
const BULLETTIMIMG = 1
const DTCAP = 0.1
const SPEED = 1.2
const SLOWSPEED = 0.6
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
    "bullet1.svg"
]
let shipImgs;
let bulletImgs;
let bulletPool;
let timing = 0;

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


