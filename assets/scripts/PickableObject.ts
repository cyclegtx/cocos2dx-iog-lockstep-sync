import CharacterController, { PlayerState } from "./CharacterController";

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
export enum PickableObjectState{
    "stand",
    "picked",
    "aim",
    "throw",
    "breaked"
}
@ccclass
export default class PickableObject extends cc.Component {


    @property({
        displayName:"落地状态图片",
        type: cc.SpriteFrame,
    })
    standSprite: cc.SpriteFrame = null;

    @property({
        displayName: "空中状态图片",
        type: cc.SpriteFrame,
    })
    pickedSprite: cc.SpriteFrame = null;

    @property(cc.Sprite)
    avatar:cc.Sprite = null;

    @property(cc.Vec2)
    pickedOffset:cc.Vec2 = new cc.Vec2(0,8);

    @property(cc.Prefab)
    creashSmokePrefab:cc.Prefab = null;

    @property(cc.Node)
    shadowNode:cc.Node = null;

    jumpTimes:number = 1;

    /**
     *被投掷后最长时间，单位帧
     *
     * @type {number}
     * @memberof PickableObject
     */
    throwingMaxTime:number = 60;

    throwingTime:number = 0;

    animation:cc.Animation = null;
    
    public rb: cc.RigidBody = null;
    public collider: cc.PhysicsCollider = null;

    public owner:CharacterController = null;

    private _state = PickableObjectState.stand;
    public get state() {
        return this._state;
    }
    public set state(value) {
        if(this._state != value){
            this.onStateChange(this._state,value);
            this._state = value;
        }
    }

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.rb = this.getComponent(cc.RigidBody);
        this.collider = this.getComponent(cc.PhysicsCollider);
        this.animation = this.getComponent(cc.Animation);
    }

    // start () {

    // }

    public shoot(dir:cc.Vec2){
        this.rb.linearVelocity = dir.normalize().mul(800);
    }

    update (dt) {

        if(this.state == PickableObjectState.throw){
            if(this.throwingTime <= 0){
                this.state = PickableObjectState.stand;
            }else{
                this.throwingTime--;
            }
        }

        if (this.owner != null && (this.state == PickableObjectState.picked || this.state == PickableObjectState.aim)){
            if(this.owner.state == PlayerState.aim){
                this.state = PickableObjectState.aim;
                this.node.position = this.owner.node.position.add(new cc.Vec2(0, 0));
            }else{
                this.state = PickableObjectState.picked;
                this.node.position = this.owner.node.position.add(this.pickedOffset);
            }
        }
    }

    /**
     *当碰撞产生的时候调用
     *
     * @param {*} contact
     * @param {*} selfCollider 产生碰撞的自身的碰撞组件
     * @param {*} otherCollider 产生碰撞的另一个碰撞组件
     * @memberof WeaponController
     */
    onBeginContact(contact, selfCollider, otherCollider) {
        if(otherCollider.node.group == "Player" && this.state == PickableObjectState.stand){
            otherCollider.node.getComponent(CharacterController).pickWeapon(this);
        }else if(this.state == PickableObjectState.throw && otherCollider.node != this.owner.node){
            if (otherCollider.node.group == "Player"){
                otherCollider.node.getComponent(CharacterController).hurt();
            }
            this.breakdown();
        }
    }

    onStateChange(oldState:PickableObjectState,newState:PickableObjectState){
        if (newState == PickableObjectState.picked) {
            this.collider.enabled = false;
            this.shadowNode.active = false;
            this.avatar.spriteFrame = this.pickedSprite;
        }
        if(newState == PickableObjectState.throw){
            this.collider.enabled = true;
            this.shadowNode.active = true;
        }
        if(newState == PickableObjectState.breaked){
            this.collider.enabled = false;
            this.shadowNode.active = true;
        }
        if (newState == PickableObjectState.stand) {
            this.collider.enabled = true;
            this.shadowNode.active = true;
            this.avatar.spriteFrame = this.standSprite;
        }
        if (newState == PickableObjectState.aim) {
            this.avatar.spriteFrame = this.standSprite;
        }

    }

    /**
     *投掷
     *
     * @param {cc.Vec2} direction 投掷方向
     * @memberof WeaponController
     */
    throwAt(direction:cc.Vec2){
        direction.normalizeSelf();
        this.state = PickableObjectState.throw;
        this.node.setPosition(this.owner.node.position.add(direction.mul(20)));
        this.avatar.node.setPosition(cc.v2(0,10));
        this.avatar.node.runAction(cc.jumpTo(0.3,cc.Vec2.ZERO,5,this.jumpTimes));
        this.rb.linearVelocity = direction.mul(1000);
        this.throwingTime = this.throwingMaxTime;
    }


    /**
     *破坏并消失
     *
     * @memberof WeaponController
     */
    breakdown(){
        this.rb.linearVelocity = cc.Vec2.ZERO;
        this.state = PickableObjectState.breaked;
        this.animation.play("onhit",0);
        let smokeNode = cc.instantiate(this.creashSmokePrefab);
        // smokeNode.setPosition(this.node.position.add(cc.v2(0,-1)));
        this.node.addChild(smokeNode);
    }

    /**
     *当onhit动画播放完毕的时候
     *
     * @memberof WeaponController
     */
    onbreakdownfinished(){
        this.node.destroy();
    }


}
