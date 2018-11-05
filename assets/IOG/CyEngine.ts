import InputManager from "../scripts/InputManager";
import CyPlayer from "./CyPlayer";

// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

export abstract class CyRoundManager extends cc.Component {
    
    /**
     *添加玩家
     *
     * @abstract
     * @param {CyPlayer} _player 玩家
     * @memberof CyRoundManager
     */
    abstract addPlayer(_player:CyPlayer):void;

    /**
     *当玩家可以控制的时候
     *
     * @abstract
     * @memberof CyRoundManager
     */
    abstract onReadyToControl():void;

}

@ccclass
export default class CyEngine extends cc.Component {

    @property({
        displayName:"服务器IP"
    })
    ip = "localhost";

    @property({
        displayName: "服务器端口"
    })
    port = "2567";

    @property({
        displayName:"房间名称"
    })
    roomName = "room";

    /**
     *服务器帧插值
     *
     * @type {number}
     * @memberof CyEngine
     */
    serverFrameAcc: number = 3;

    /**
     *服务器帧数
     *
     * @type {number}
     * @memberof CyEngine
     */
    serverFrameRate: number = 20;

    /**
     *玩家列表,存储玩家输入
     *
     * @type {Array<CyPlayer>}
     * @memberof CyEngine
     */
    public players: Array<CyPlayer> = null;

    client:Colyseus.Client = null;
    room:Colyseus.Room = null;

    @property({
        displayName: "游戏Prefab",
        type: cc.Prefab
    })
    roundPrefab: cc.Prefab = null;

    @property({
        displayName: "游戏位置",
        type: cc.Node
    })
    roundContainer: cc.Node = null;

    /**
     *游戏控制组件
     *
     * @type {CyRoundManager}
     * @memberof CyEngine
     */
    round:CyRoundManager = null;

    /**
     *随机种子
     *
     * @type {number}
     * @memberof CyEngine
     */
    seed: number = 51;

    /**
     *是否可以开始接受玩家输入，等待追帧结束之后才可以接受玩家输入。
     *
     * @type {boolean}
     * @memberof CyEngine
     */
    readyToControl:boolean = false;

    /**
     *游戏循环setInterval ID
     *
     * @type {number}
     * @memberof CyEngine
     */
    loopInterval: number = null;

    /**
     *当前帧
     *
     * @type {number}
     * @memberof CyEngine
     */
    frame_index: number = 0;

    /**
     *所有帧缓存
     *
     * @type {Array<any>}
     * @memberof CyEngine
     */
    frames: Array<any> = [];

    /**
     *每帧间隔，如果帧缓存里未渲染帧数过多，则减小间隔以追上服务器进度
     *
     * @type {number}
     * @memberof CyEngine
     */
    frame_inv:number = 0;

    engine: CyEngine = null;

    static instance: CyEngine;

    onLoad () {
        if (CyEngine.instance == undefined) {
            CyEngine.instance = this;
        } else {
            console.log("CyEngine 单例失败");
            return;
        }
        this.client = new Colyseus.Client(`ws://${this.ip}:${this.port}`);
        this.getAvailableRooms();
    }

    // start () {
    // }

    // update (dt) {}

    /**
     *获取可以加入的房间
     *
     * @memberof CyEngine
     */
    getAvailableRooms(){
        let that = this;
        // console.log(this.roomName)
        this.client.getAvailableRooms(this.roomName, function (rooms, err) {
            if (err) console.error(err);
            // console.log(rooms)
            // rooms.forEach(function (room) {
            //     console.log(room.roomId);
            //     console.log(room.clients);
            //     console.log(room.maxClients);
            //     console.log(room.metadata);
            // });
            that.node.emit("getAvailableRooms",{rooms:rooms});
        });
    }

    /**
     *创建房间
     *
     * @memberof CyEngine
     */
    createRoom(){
        this.joinRoom();
    }

    /**
     *加入房间
     *
     * @memberof CyEngine
     */
    joinRoom(){
        this.room = this.client.join(this.roomName);
        this.room.onJoin.add(this.onJoinRoom.bind(this));

        this.room.onStateChange.add(function (state) {
            console.log("initial room state:", state);
        });

        // new room state
        this.room.onStateChange.add(function (state) {
            // this signal is triggered on each patch
        });

        this.room.onMessage.add(this.onMessage.bind(this));
    }

    /**
     *当加入房间时
     *
     * @memberof CyEngine
     */
    onJoinRoom(){
        this.node.emit("roomJoined", { room_id: this.room.id, room_session: this.room.sessionId });
        this.startRound();
    }

    /**
     *断开链接
     *
     * @memberof CyEngine
     */
    close(){
        this.client.close(this.client.id);
    }

  

    /**
     *发送信息到服务器房间
     *
     * @param {*} data
     * @memberof CyEngine
     */
    sendToRoom(data:any){
        this.room.send(data);
    }

    /**
     *开始游戏
     *
     * @memberof CyEngine
     */
    startRound(){
        this.readyToControl = false;
        this.players = new Array();
        let roundNode = cc.instantiate(this.roundPrefab);
        this.round = roundNode.getComponent(CyRoundManager);
        this.frame_inv = 0;
        this.roundContainer.addChild(roundNode);
        //锁定帧数
        cc.game.pause();
        //获取服务器上所有帧缓存
        this.sendToRoom(["fs"]);
        //以固定时间间隔上传用户输入指令
        setInterval(this.sendCMD.bind(this), 1000 / this.serverFrameRate);
        
    }

    /**
     *发送玩家输入到服务器
     *
     * @memberof CyEngine
     */
    sendCMD() {
        this.sendToRoom(["cmd", ["input", InputManager.instance.toServerData()]]);
    }

    /**
     *处理服务器消息  
     *
     * @param {*} message 消息
     * @memberof CyEngine
     */
    onMessage(message){
        switch(message[0]){
            case "f":
                this.onReceiveServerFrame(message);
                break;
            case "fs":
                this.onReceiveServerFrame(message);
                //把服务器帧同步到本地帧缓存后，读取并执行本地帧缓存
                this.nextTick();
                break;
            default:
                console.warn("未处理的消息:");
                console.warn(message);
                break;
        }
    }

    /**
     *从服务器获取帧信息
     *
     * @param {*} message 帧信息
     * @memberof CyEngine
     */
    onReceiveServerFrame(message:any){
        this.addFrames(message[1]);
    }

    /**
     *添加帧信息到帧缓存
     *
     * @param {Array<any>} frames 待添加的帧信息
     * @memberof CyEngine
     */
    addFrames(_frames:Array<any>) {
        _frames.forEach((m) => {
            this.frames[m[0]] = m[1];
            for (let i = m[0]; i > m[0] - this.serverFrameAcc; i--) {
                if (this.frames[i] == undefined) {
                    this.frames[i] = [];
                }
            }
        });
    }

    /**
     *处理帧
     *
     * @memberof CyEngine
     */
    runTick() {
        let frame = null;
        if(this.frames.length > 1){
            //第一帧延时处理，以免在初始的时候丢失第一帧
            frame = this.frames[this.frame_index];
        }
        if (frame) {
            if (frame.length > 0) {
                frame.forEach((cmd) => {

                    // if (cmd[1][0] == "addplayer"){
                    //     console.log("addplayer",this.frame_index)
                    // }

                    if (typeof this["cmd_" + cmd[1][0]] == "function") {
                        this["cmd_" + cmd[1][0]](cmd);
                    } else {
                        console.log("服务器处理函数cmd_" + cmd[1][0] + " 不存在");
                    }
                })
            }
            this.frame_index++;
            cc.game.step();
        }
    }

    /**
     *下一帧
     *
     * @memberof CyEngine
     */
    nextTick() {
        this.runTick();
        if (this.frames.length - this.frame_index > 100) {
            //当缓存帧过多时，一次处理多个帧信息
            console.log("跳帧追帧:" + (this.frames.length - this.frame_index))
            // for (let i = 0; i < 50; i++) {
            //     this.runTick();
            // }
            this.frame_inv = 0;
        }else if (this.frames.length - this.frame_index > this.serverFrameAcc){
            // console.log("追帧:" + (this.frames.length - this.frame_index))
            // for (let i = this.frame_index; i < this.frames.length; i++) {
            //     this.runTick();
            // }
            this.frame_inv = 0;
        } else {
            if (this.readyToControl == false) {
                this.readyToControl = true;
                this.round.onReadyToControl();
            }
            this.frame_inv = 1000 / (this.serverFrameRate * (this.serverFrameAcc + 1));
        }
        setTimeout(this.nextTick.bind(this), this.frame_inv)
    }

    /**
     *随机函数
     *
     * @param {number} [max=1]
     * @param {number} [min=0]
     * @returns
     * @memberof CyEngine
     */
    seededRandom(max = 1, min = 0) {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        let rnd = this.seed / 233280.0;
        return min + rnd * (max - min);
    }

    /**
     *处理服务器输入指令
     *
     * @param {*} cmd 指令
     * @memberof CyEngine
     */
    cmd_input(cmd) {
        this.players.forEach((p) => {
            if (p.sessionId == cmd[0]) {
                p.updateInput(cmd[1][1])
            }
        })
    }

    /**
     *处理服务器新加玩家指令
     *
     * @param {*} cmd 指令
     * @memberof CyEngine
     */
    cmd_addplayer(cmd) {
        let existPlayer = this.players.filter((p)=>{
            return p.sessionId == cmd[0];
        });
        if(existPlayer.length > 0){
        }else{
            let player = new CyPlayer();
            player.sessionId = cmd[0];
            player.isLocal = cmd[0] == this.room.sessionId;
            this.players.push(player);
            this.round.addPlayer(player);
        }
        
    }
}
