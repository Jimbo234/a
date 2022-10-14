class PartyMember {
    constructor(sprite, w, h){
        this.positions = []; // history of positions
        this.x = 0;
        this.y = 0;
        this.mv = [0,0];

        this.sprite = sprite;
        this.w = w;
        this.h = h;
    }
}

// Returns an image of a sprite given a source.
function defSprite(src){
    let i = new Image;
    i.src = src;
    return i;
}


// Comparison function to order the rendering list by their y position.
// Makes the sprites lower down appear over ones which are higher.
function compareY(a,b) {
    if (a.y < b.y) return -1;
    return 1;
}

function applyFriction(){
    // Friction only applies if you are not moving in the direction.

    if (!mv[0]){
        if (xvel > 0) {
            xvel -= friction;
            if (xvel < 0) xvel = 0;
        }
        if (xvel < 0) {
            xvel += friction;
            if (xvel < 0) xvel = 0;
        }
    }

    if (!mv[1]){
        if (yvel > 0) {
            yvel -= friction;
            if (yvel < 0) yvel = 0;
        }
        if (yvel < 0) {
            yvel += friction;
            if (yvel < 0) yvel = 0;
        }
    }
}

function resize(){
    WINDOW_WIDTH = window.screen.width;
    WINDOW_HEIGHT = window.screen.height;
    
    WINDOW_ASPECT = WINDOW_WIDTH/WINDOW_HEIGHT;


    if (WINDOW_ASPECT > GAME_ASPECT) {
        canvas.style="width:" + WINDOW_HEIGHT + "px;";
    }
    else {
        canvas.style="width:" + WINDOW_WIDTH + "px;";
    }

    canvas.style="width:100vw";
    
}

// Initialization
function main(){
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    console.log(window.innerWidth);

    joelSprite = defSprite("joel.png");
    cherylSprite = defSprite("cheryl.png");
    oliverSprite = defSprite("oliver.png");
    shadow = defSprite("shadow.png");

    GAME_WIDTH = 640;
    GAME_HEIGHT = 480;

    GAME_ASPECT = GAME_WIDTH/GAME_HEIGHT;

    resize();

    window.addEventListener("resize", resize);

    distance = 12; // distance between party members, in frames of input

    // array containing all party members
    party = [];

    party.push(new PartyMember(cherylSprite, 24, 75))
    party.push(new PartyMember(oliverSprite, 22, 43))
    
    // Each party member gets a longer "history" array containing all previous positions of the main party member. the
    // array contains the x, y, and direction vector, which is all that is needed to determine what sprite to display at what
    // position. Animations all occur simultaneously for now, but if animation speed/frames were different for each member then
    // we would need to add that to this.

    // history array is filled with fluff, to ensure there is a delay before the member follows you prior to any input
    for (var j = 0; j<party.length; j++) {
        for (var i = 0; i<distance * (j+1); i++) {
            party[j].positions.push([0,50, [0,0]]);
        }
    }

    // party member facing vector.
    mv = [0, 0];

    // Constant friction applied when no input is pressed.
    friction = 2;

    // get input ready before update
    initInput();

    // Initialize starting position for joel
    x = 0;
    y = 50;

    // Initial velocity
    xvel = 0;
    yvel = 0;

    // Determines what frame of animation should be used for walking.
    anim = 0;

    // Start loop
    setInterval(update, 1000/60);
    

}


// Updates every 1/60 sec
function update(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // last input vector, used to restore the facing direction
    // if no input is pressed.
    lastv = mv; 
    
    // player direction vector. differs from input vector as it retains
    // what direction the lead party member is in when no input is pressed.
    mv = [0, 0]; 


    // movement when not running
    speed = 2;
    maxspeed = 2.5;
    animspeed = 2;

    if (inputs.x) { // movement when run button is held
        speed = 3;
        maxspeed = 3.5;
        animspeed = 3;
    }

    // whether or not meaningful input is pressed. important to note that we can't just use
    // mv to determine this, as mv retains a value even when no input is sent.
    moving = false;

    if(inputs.ArrowUp) {
        yvel -= speed;
        
        mv[1]--;
    }
    if(inputs.ArrowDown) {
        yvel += speed;
        
        mv[1]++;
    }
    if(inputs.ArrowRight) {
        xvel += speed;

        mv[0]++;
    }
    if(inputs.ArrowLeft) {
        xvel -= speed;
        mv[0]--;
    }

    // despite what is stated above, mv has not updated to the player facing vector by this point, it is 
    // merely the input vector and can be used to determine whether or not you are moving.
    if (mv[0] || mv[1]) moving = true;

    // Last chance to apply friction, since we use mv as an input vector to determine whether friction should apply. If it
    // has to be moved later, just make a separate input vector.
    applyFriction();

    // if you are moving you animate, but if you are not then mv is updated to the old movement vector. if it is not updated,
    // no input would always switch to your facing down sprite.
    if (moving) {
        anim+= animspeed;
        anim %= 60;
    }
    else {
        anim = 0
        mv = lastv;
    }

    
    // cap on how much you can accelerate
    if (Math.abs(xvel) > maxspeed) {
        xvel = xvel/Math.abs(xvel) * maxspeed;
    }

    if (Math.abs(yvel) > maxspeed) {
        yvel = yvel/Math.abs(yvel) * maxspeed;
    }

    // apply velocities
    x += xvel;
    y += yvel;

    // empty array which is used to determine the rendering order of the party dependant on y position
    drawing = [];

    // Each party member is pushed to the array.
    for (member of party) {
        member.x = member.positions[0][0];
        member.y = member.positions[0][1];
        member.mv = member.positions[0][2];
    
        if (xvel || yvel) {
            member.positions.push([x,y,mv]);
            member.positions.splice(0, 1);
        }

        drawing.push({
            x: member.x,
            y: member.y,
            mv: member.mv,
            
            w: member.w, //w,h,s used for rendering
            h: member.h,
            s: member.sprite,
        })
    }

    // Lead party member is pushed to the array. Pushing it last ensures he is drawn above same y party members?
    drawing.push(
        {
            x: x,
            y: y,
            mv: mv,
            w: 23, //w,h,s used for rendering. currently hardcoded to joel
            h: 39,
            s: joelSprite,
        }
    )

    // sort rendering order by y positions
    drawing = drawing.sort(compareY);
    
    // draw sprites
    for (sprite of drawing) {
        let a = getAnim(sprite.mv);
        
        //ctx.drawImage()
        ctx.drawImage(shadow, Math.floor(sprite.x) + 4, Math.floor(sprite.y) - 2, 16, 3)
        ctx.drawImage(sprite.s, a[0] * sprite.w, a[1] * sprite.h, sprite.w, sprite.h, Math.floor(sprite.x), Math.floor(sprite.y), sprite.w, -sprite.h);
    }

    // repeat every frame
    //requestAnimationFrame(update);
}

// Returns vector with [x, y] indicies of the required sprite in the spritesheet.
// Note that the used spritesheet is not accounted for, the vector will 
// need to be multiplied by the correct sprite.w and sprite.h to ensure
// the spritesheet is aligned properly.
function getAnim(vec) {
    // Vector to be used for output. [0] is sprite x, [1] is sprite y.
    out = [0, 0]

    // Table for what vertical position to use dependant on the facing direction (vec)
    animationTable = 
    [[7,2,5],
     [3,0,1],
     [6,0,4]];

    // plug vec into table to get correct y position.
    out[1] = animationTable[vec[1]+1][vec[0]+1]

    // x position is dependant on the current walk cycle anim frame.
    if (anim > 45 || anim == 0){
        out[0] = 0;
    }
    else if (anim > 30){
        out[0] = 2;
    }
    else if (anim > 15){
        out[0] = 0;
    }
    else {
        out[0] = 1;
    }

    // Return vector
    return out;

}

function initInput() {
    // input object, the keys are internal input names.
    inputs = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        x: false,
    }

    window.addEventListener("keydown", function(e){
        if (e.key in inputs) inputs[e.key] = true;
    })

    window.addEventListener("keyup", function(e){
        if (e.key in inputs) inputs[e.key] = false;
    })
}