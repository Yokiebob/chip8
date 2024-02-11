class Chip8{
    static utilities = {
        combineInstruction(a,b){
            return a << 8 | b;
        },
        checkKey(n){
            return Chip8.utilities.keys[Chip8.constants.keyMap[n]];
        },
        default_memory(){
            var mem = new Uint16Array(4096);
            const font = [
                0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
                0x20, 0x60, 0x20, 0x20, 0x70, // 1
                0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
                0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
                0x90, 0x90, 0xF0, 0x10, 0x10, // 4
                0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
                0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
                0xF0, 0x10, 0x20, 0x40, 0x40, // 7
                0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
                0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
                0xF0, 0x90, 0xF0, 0x90, 0x90, // A
                0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
                0xF0, 0x80, 0x80, 0x80, 0xF0, // C
                0xE0, 0x90, 0x90, 0x90, 0xE0, // D
                0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
                0xF0, 0x80, 0xF0, 0x80, 0x80  // F
            ];
            for(var i = 0; i < font.length; i++){
                mem[i+0x50] = font[i];
            }
            return mem;
        },
        lerp(a,b,c){
            return a+(b-a)*c;
        }
    };
    static constants = {
        keyMap:["x",1,2,3,"q","w","e","a","s","d","z","c",4,"r","f","v"],
    };
    constructor(){
        this.keys = {};
        window.document.addEventListener("keydown",(e)=>{
            this.keys[e.key.toString()]=true;
        });
        window.document.addEventListener("keyup",(e)=>{
            this.keys[e.key.toString()]=!true;
        });
        this.memory = Chip8.utilities.default_memory;

        this.display = {};
        this.display.height = 32;
        this.display.width = 64;
        this.display.buffer = new Uint8Array(this.display.height*this.display.width);
        this.display.outBuffer = new Array(this.display.height*this.display.width);

        this.PC = 0x200;
        this.index_register = 0;
        
        this.timers = {
            sound:0,
            delay:0
        };

        this.stack = [];
        this.reg = new Uint8Array(16);
    }
    checkKey(n){
        return this.keys[Chip8.constants.keyMap[n]];
    }
    fetchInstruction(){
        const instr = Chip8.utilities.combineInstruction(
            this.memory[this.PC],
            this.memory[this.PC+1]
        );
        this.PC+=2;
        return instr;
    }
    clearDisplay(){
        for(var i = 0; i < this.display.buffer.length; i++){
            this.display.buffer[i] = 0;
        }
    }
    loadProgram(program){
        //reset everything lol
        this.memory = Chip8.utilities.default_memory();
        for(var i = 0; i < program.length; i++){
            this.memory[0x200+i]=program[i];
        }
        this.PC = 0x200;
        this.index_register = 0;
        this.clearDisplay();
        this.timers.sound = 0;
        this.timers.delay = 0;
        
        for(var i = 0; i < 0xF; i++){
            this.reg[i] = 0;
        }
        this.stack = [];
    }
    execute_instruction(instr){
        const opcode = instr >> 12;
        const x = instr >> 8 & 0xF;
        const y = instr >> 4 & 0xF;
        const N = instr & 0xF;
        const NN = instr & 0xFF;
        const NNN = instr & 0xFFF;

        switch(opcode){
            case 0x0:{
                switch(N){
                    case 0x0:{
                        this.clearDisplay();
                    }break;
                    case 0xE:{
                        this.PC=this.stack.pop();
                    }break;
                }
            }break;
            case 0x1:{
                this.PC = NNN;
            }break;
            case 0x2:{
                this.stack.push(this.PC);
                this.PC = NNN;
            }break;
            case 0x3:{
                if(this.reg[x] == NN){
                    this.PC += 2;
                }
            }break;
            case 0x4:{
                if(this.reg[x]!==NN){
                    this.PC+=2;
                }
            }break;
            case 0x5:{
                if(this.reg[x]==this.reg[y]){
                    this.PC+=2;
                }
            }break;
            case 0x6:{
                this.reg[x]=NN;
            }break;
            case 0x7:{
                this.reg[x]+=NN;
            }break;
            case 0x8:{
                switch(N){
                    case 0:{
                        this.reg[x]=this.reg[y];
                    }break;
                    case 1:{
                        this.reg[x]|=this.reg[y];
                    }break;
                    case 2:{
                        this.reg[x]&=this.reg[y];
                    }break;
                    case 3:{
                        this.reg[x]^=this.reg[y];
                    }break;
                    case 4:{
                        var sum=this.reg[x]+this.reg[y];
                        this.reg[x]=sum;
                        if(sum>255){
                            this.reg[0xf]=1;
                        }else{
                            this.reg[0xf]=0;
                        }
                    }break;
                    case 5:{
                        var diff=this.reg[x]-this.reg[y];
                        this.reg[x]=diff;
                        this.reg[0xF]=0;
                        if(diff>=0){
                            this.reg[0xF]=1;
                        }
                    }break;
                    case 6:{
                        this.reg[0xF]=this.reg[x]&0x1;
                        if(x!==0xF){
                            this.reg[x]>>=1;
                        }//BEEP don't use this reg for infor brofer
                    }break;
                    case 7:{
                        var diff=this.reg[y]-this.reg[x];
                        
                        this.reg[0xF]=0;
                        if(diff>=0){
                            this.reg[0xF]=1;
                        }
                        if(x!=0xf){
                            this.reg[x]=diff;
                        }
                        //reg[x]=reg[y]-reg[x];
                    }break;
                    case 0xE:{
                        this.reg[0xF]=!!(this.reg[x]&0x80);//turn to boolean
                        if(x!==0xF){
                            this.reg[x]<<=1;//HEANSKDMC
                        }
                    }break;
                }
            }break;
            case 0x9:{
                if(this.reg[x]!==this.reg[y]){
                    this.PC+=2;
                }
            }break;
            case 0xA:{
                this.index_register=NNN;
            }break;
            case 0xB:{
                this.PC=this.reg[0]+NNN;
            }break;
            case 0xC:{
                this.reg[x]=(Math.random()*255)&NN;
            }break;
            case 0xD:{
                const start_x=this.reg[x]&63;
                const start_y=this.reg[y]&31;//spooky modulus trick
                this.reg[0xF]=0;
                for(let i = 0; i < N; i++){
                    let sprite = this.memory[this.index_register+i];
                    for(let k = 0; k < 8; k++){
                        if(sprite & 0x80){
                            let ind=start_x+k+(start_y+i)*64;
                            this.display.buffer[ind]=!this.display.buffer[ind];
                            if(!this.display.buffer[ind]){
                                this.reg[0xF]=1;//the flag
                                
                            }
                        }
                        sprite<<=1;
                    }
                }
                //display_buffer[start_x+start_y*64]=1;
            }break;
            case 0xE:{
                //handle keys
                switch(NN){
                    case 0x9E:{
                        if(this.checkKey(this.reg[x])){
                            this.PC+=2;
                        }
                    }break;
                    case 0xA1:{
                        if(!this.checkKey(this.reg[x])){
                            this.PC+=2;
                        }
                    }break;
                }
            }break;
            case 0xF:{
                switch(NN){
                    case 0x07:{
                        this.reg[x]=this.timers.delay;
                    }break;
                    case 0x0A:{

                    }break;
                    case 0x15:{
                        this.timers.delay=this.reg[x];
                    }break;
                    case 0x18:{
                        this.timers.sound = this.reg[x];
                    }break;
                    case 0x1E:{
                        this.index_register+=this.reg[x];
                    }break;
                    case 0x29:{
                        this.timers.delay=this.reg[x];
                    }break;
                    case 0x33:{
                        this.memory[this.index_register]=(this.reg[x]*0.01)|0;
                        this.memory[this.index_register+1]=(this.reg[x]*0.1)%10;
                        this.memory[this.index_register+2]=this.reg[x]%10;
                    }break;
                    case 0x55:{
                        for(let i = 0; i <= x;i++){//ARRG
                            this.memory[this.index_register+i]=this.reg[i];
                        }
                    }break;
                    case 0x65:{
                        for(let i = 0; i <= x;i++){//ARRG
                            this.reg[i]=this.memory[this.index_register+i];
                        }
                    }break;
                }
            }break;
            default:
                //unknown opcode!
        }
    }
    drawDisplay(ctx,scale){
        ctx.fillStyle = "black";
        ctx.fillRect(0,0,this.display.width*scale,this.display.height*scale);
        ctx.fillStyle = "white";
        for(var i = 0; i < this.display.width; i++){
            for(var k = 0; k < this.display.height; k++){
                var ind = i+k*this.display.width;
                const col = this.display.outBuffer[ind];
                ctx.fillStyle = "rgb("+col+","+col+","+col+")";
                ctx.fillRect(i*scale,k*scale,scale,scale);
                if(!this.display.buffer[ind]){
                    this.display.outBuffer[ind]=Chip8.utilities.lerp(
                        this.display.outBuffer[ind] || 0,
                        0,
                        0.2
                    );
                }else{
                    this.display.outBuffer[ind]=255;
                }
            }
        }
    }
    update(){
        if(this.timers.delay>0){
            this.timers.delay--;
        }
        if(this.timers.sound>0){
            this.timers.sound--;
        }
        for(var i = 0; i < 10; i++){
            this.execute_instruction(this.fetchInstruction());
        }
    }
}
