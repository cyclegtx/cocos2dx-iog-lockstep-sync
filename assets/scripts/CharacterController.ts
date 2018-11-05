import InputManager from "../scripts/InputManager";
import CameraController from "../scripts/CameraController";
import PickableObject, { PickableObjectState } from "./PickableObject";
import CyEngine from "../IOG/CyEngine";
import CyPlayer from "../IOG/CyPlayer";

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

export enum PlayerState{
    "idle",
    "walk",
    "aim",
    "dead",
}

@ccclass
export default class CharacterController extends cc.Component {

    @property({
        displayName:"非本地玩家禁用的组件",
        type:[cc.Component]
    })
    disableIfNotLocal:cc.Component[] = [];

    @property({
        displayName:"转向速度",
        tooltip: "度/秒"
    })
    rotationSpeed:number = 180;

    // @property({
    //     displayName:"移动速度",
    //     tooltip:"像素/秒"
    // })
    moveSpeed:number = 200

    @property(cc.Node)
    handNode:cc.Node = null;

    @property(cc.Node)
    avatarNode:cc.Node = null;

    @property(cc.ParticleSystem)
    smokeParticleSystem:cc.ParticleSystem = null;

    /**
     *重生等待时间，单位帧
     *
     * @type {number}
     * @memberof CharacterController
     */
    respawnWaitTime:number = 60;
    respawnWait:number = 0;

    dirDown:cc.Vec2 = new cc.Vec2(0,-1);

    distance:cc.Vec2 = cc.Vec2.ZERO;

    public foodCount:number = 0;

    public rb: cc.RigidBody = null;

    @property(cc.Prefab)
    weaponPrefab:cc.Prefab = null;

    private cameraController:CameraController = null;
    private inputManager:InputManager = null;

    weapon:PickableObject = null;

    velocity:cc.Vec2 = cc.Vec2.ZERO;
    
    private _player: CyPlayer = null;
    public get player(): CyPlayer {
        return this._player;
    }
    public set player(value: CyPlayer) {
        this._player = value;
        if(value.isLocal == false){
            this.disableIfNotLocal.forEach((c)=>{
                c.enabled = false;
            })
        }
    }


    /**
     * 人物状态
     *
     * @type {number} 1：walk 2:aim
     * @memberof CharacterController
     */
    private _state: number = PlayerState.idle;
    public get state(): number {
        return this._state;
    }
    public set state(value: number) {
        if(this._state != value){
            if(this._state == PlayerState.aim && value == PlayerState.walk){
                //攻击 TODO:这里原本是 aim之后松开按钮进行攻击，现在应改成 特殊按键
                // this.attack();
            }
            this._state = value;

            if(value == PlayerState.walk){
                this.animation.play("player1_walk",0);
            }else if(value == PlayerState.aim){
                // this.animation.play("player1_aim", 0);
                this.rb.linearVelocity = cc.Vec2.ZERO;
            }else if(value == PlayerState.idle){
                this.animation.play("player1_idle",0);
            }

            if(value == PlayerState.aim){
                this.avatarNode.active = false;
            }else{
                this.avatarNode.active = true;
            }

            if(value == PlayerState.walk){
                this.smokeParticleSystem.emissionRate = 10;
            }else{
                this.smokeParticleSystem.emissionRate = 0;
            }


        }
    }

    @property(cc.Animation)
    animation:cc.Animation = null;

    private _faceDirection: number = 1;
    public get faceDirection(): number {
        return this._faceDirection;
    }
    public set faceDirection(value: number) {
        if(this._faceDirection != value){
            this._faceDirection = value;
            if(value == 0){
                this.avatarNode.scaleX = -Math.abs(this.avatarNode.scaleX);
            }else{
                this.avatarNode.scaleX = Math.abs(this.avatarNode.scaleX);
            }
        }
    }

    onLoad () {
        this.rb = this.getComponent(cc.RigidBody);
        this.rb.enabledContactListener = true;
        this.cameraController = CameraController.instance;
        this.inputManager = InputManager.instance;
        this.init();
    }

    init(){
        this.foodCount = 0;
    }

    // start () {
    // }

    update (dt) {

        if(this.state == PlayerState.dead){
            if(this.respawnWait <= 0){
                this.respawn();
            }
            this.respawnWait--;
            return;
        }

        if(this.player.input.mlb && this.weapon != null){
            this.state = PlayerState.aim;
        }else if(this.state == PlayerState.aim){
            this.state = PlayerState.idle;
        }

        if(this.player.input.mrb){
            this.attack();
        }

        //移动
        this.velocity = this.player.input.dir.normalize();
        // this.velocity = this.playerInput.inputDirection.normalize();
        if (this.velocity.magSqr() > 0) {
            this.velocity.mulSelf(this.moveSpeed);
            if(this.state == PlayerState.idle){
                this.state = PlayerState.walk;
            }
            if (this.state == PlayerState.walk) {
                this.rb.linearVelocity = this.velocity;
                // this.rb.applyForceToCenter(this.velocity.mul(1000),true);
            }
        }else{
            if (this.state == PlayerState.walk) {
                this.state = PlayerState.idle;
            }
            this.rb.linearVelocity = this.velocity;
        }
        // if (this.rb.linearVelocity.mag() > 300) {
        //     this.rb.linearVelocity = this.rb.linearVelocity.normalize().mul(300);
        // }

        this.distance = this.player.input.mpos.sub(this.node.position);
        if (this.distance.magSqr() > 1) {
            this.faceDirection = this.distance.signAngle(this.dirDown) < 0 ? 1 : 0;
        }
        if (this.player.isLocal) {
            this.cameraController.moveTo(this.node.position);
            this.handNode.rotation = cc.misc.radiansToDegrees(this.inputManager.mousePosition.sub(this.node.position).signAngle(this.dirDown));
        }
        
    }

    rotateTo(to: number, delta: number) {
        let from = this.node.rotation;
        let res = from;
        if(to - from > 180){
            to -= 360;
        }else if(to - from < -180){
            to += 360;
        }
        if (Math.abs(to - from) < delta) {
            res = to;
        } else {
            res = from > to ? from - delta : from + delta;
        }
        if (res > 360) {
            res -= 360;
        } else if (res < -360) {
            res += 360;
        }
        this.node.rotation = res;
    }

    /**
     *攻击
     *
     * @memberof CharacterController
     */
    attack(){
        if(this.weapon == null){
            return
        }
        this.weapon.throwAt(this.distance);
        this.weapon = null;
        this.state = PlayerState.idle;
        // if(this.)
        // this.handNode.removeAllChildren();
        // let weaponNode = cc.instantiate(this.weaponPrefab);
        // let weaponController = weaponNode.getComponent(WeaponController);
        // weaponNode.position = this.node.position;
        // CyEngine.instance.root.addChild(weaponNode);
        // weaponController.shoot(this.distance);
    }

    /**
     *拾取武器
     *
     * @param {PickableObject} 武器实例
     * @memberof CharacterController
     */
    pickWeapon(weapon:PickableObject){
        if(this.weapon != null){
            this.node.emit("pickupWithoutClearHand");
            return
        }
        this.weapon = weapon;
        weapon.owner = this;
        weapon.state = PickableObjectState.picked;
    }

    hurt(){
        this.dead();
    }

    dead(){
        this.state = PlayerState.dead;
        this.node.opacity = 0;
        this.respawnWaitTime = this.respawnWaitTime;
    }

    /**
    *重生
    *
    * @param {CharacterController} player
    * @memberof RoundManager
    */
    respawn() {
        this.node.setPosition(CyEngine.instance.seededRandom(100, -100), CyEngine.instance.seededRandom(100, -100));
        this.node.opacity = 255;
        this.state = PlayerState.idle;
    }

}
