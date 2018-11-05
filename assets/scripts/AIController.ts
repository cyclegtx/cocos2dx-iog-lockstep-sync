import CharacterController, { PlayerState } from "./CharacterController";
import PickableObject, { PickableObjectState } from "./PickableObject";
import CyEngine from "../IOG/CyEngine";

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

export enum AIState {
    "idle",
    "wander",
    "collect",
    "hide",
    "attack",
    "throw",
}

@ccclass
export default class AIController extends cc.Component {


    private _state: AIState = AIState.idle;
    public get state(): AIState {
        return this._state;
    }
    public set state(value: AIState) {
        if(this._state != value){
            this.onStateChange(value,this._state);
            this._state = value;
        }
    }

    enemies:CharacterController[] = [];
    dangerousPickableObjects:PickableObject[] = [];
    pickableObjects:PickableObject[] = [];

    characterController:CharacterController = null;

    /**
     *当前动作最大持续时间，单位帧数
     *
     * @type {number}
     * @memberof AIController
     */
    // actionMaxDuration:number = 180;
    actionMaxDuration:number = 300;

    /**
     *当前动作已持续时间，单位帧
     *
     * @type {number}
     * @memberof AIController
     */
    curActionDuration:number = 0;

    physics:cc.PhysicsManager = null;

    cyEngine:CyEngine = null;


    /**
     *目标位置
     *
     * @type {cc.Vec2}
     * @memberof AIController
     */
    targetPosition:cc.Vec2 = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.cyEngine = CyEngine.instance;
        this.curActionDuration = this.actionMaxDuration;
        this.physics = cc.director.getPhysicsManager();
    }

    start () {
        this.characterController = this.node.getParent().getComponent(CharacterController);
        this.characterController.node.on("pickupWithoutClearHand",this.dropInHand,this);
    }

    update (dt) {
        this.seek();

        if (this.characterController.weapon != null && this.enemies.length > 0) {
            this.state = AIState.attack;
        }

        if(this.state == AIState.idle){
            this.findSomethingToDo();
        }
        this.characterController.player.input.dir = cc.Vec2.ZERO;
        
        if (this.targetPosition != null) {
            let distance = this.targetPosition.sub(this.characterController.node.position);
            if (distance.magSqr() > 1) {
                this.characterController.player.input.dir = distance;
            } else {
                this.targetPosition = null;
                this.state = AIState.idle;
            }
        }

        this.curActionDuration--;

        if (this.curActionDuration <= 0) {
            this.targetPosition = null;
            this.state = AIState.idle;
        }
        // if(this.curActionDuration >= this.actionMaxDuration){
        //     // this.findSomethingToDo();
        // }else{
        //     this.curActionDuration++;
        //     if(this.targetPosition != null){
        //         let distance = this.targetPosition.sub(this.characterController.node.position);
        //         if(distance.magSqr() > 1){
        //             this.characterController.player.input.dir = distance;
        //         }else{
        //             this.targetPosition = null;
        //         }
        //     }
        // }
    }

    onStateChange(newState:AIState,oldState:AIState){
        switch (newState) {
            case AIState.idle:
                this.characterController.player.input.mlb = false;
                this.characterController.player.input.mrb = false;
                break;

            case AIState.collect:
                if(this.pickableObjects.length > 0){
                    this.targetPosition = this.pickableObjects[0].node.position;
                }else{
                    this.state = AIState.wander;
                }
                this.curActionDuration = this.actionMaxDuration;
                break;
        
            case AIState.wander:
                this.curActionDuration = this.actionMaxDuration;
                this.targetPosition = this.characterController.node.position.add(cc.v2(0, 500).rotate(this.cyEngine.seededRandom(0, Math.PI * 2)));
                break;

            case AIState.hide:
                this.curActionDuration = this.actionMaxDuration;
                this.characterController.player.input.mlb = true;
                break;

            case AIState.throw:
                this.characterController.player.input.dir = cc.v2(0, 1).rotate(this.cyEngine.seededRandom(0, Math.PI * 2));
                this.characterController.player.input.mrb = true;
                this.curActionDuration = this.actionMaxDuration;
                break;

            case AIState.attack:
                if(this.enemies.length > 0){
                    this.characterController.player.input.dir = this.enemies[0].node.position.sub(this.characterController.node.position);
                    this.characterController.player.input.mrb = true;
                    this.curActionDuration = 2;
                }
                break;
        }

    }

    /**
     *寻找范围内物品
     *
     * @memberof AIController
     */
    seek(){
        //寻找最近物品
        let range = 320;
        let position = this.characterController.node.position;
        let positionInWorld = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        let leftBottom = positionInWorld.sub(cc.v2(range, range));

        let colliders = this.physics.testAABB(cc.rect(leftBottom.x, leftBottom.y, range * 2, range * 2));
        this.pickableObjects = [];
        this.dangerousPickableObjects = [];
        this.enemies = [];
        colliders.forEach((c: cc.PhysicsCollider) => {
            let pickableObj = c.node.getComponent(PickableObject);
            if (pickableObj != null) {
                if (pickableObj.state == PickableObjectState.stand){
                    this.pickableObjects.push(pickableObj);
                }else if(pickableObj.state == PickableObjectState.throw){
                    this.dangerousPickableObjects.push(pickableObj);
                }
            }
            let character = c.node.getComponent(CharacterController);
            if(character != null && character != this.characterController){
                this.enemies.push(character);
            }
        });
        
        this.dangerousPickableObjects.sort((a, b) => {
            return a.node.position.sub(position).magSqr() - b.node.position.sub(position).magSqr();
        });

        this.pickableObjects.sort((a, b) => {
            return a.node.position.sub(position).magSqr() - b.node.position.sub(position).magSqr();
        });

        this.enemies.sort((a, b) => {
            return a.node.position.sub(position).magSqr() - b.node.position.sub(position).magSqr();
        });

    }

    /**
     *根据自身状态与环境决定下一步的动作
     *
     * @memberof AIController
     */
    findSomethingToDo(){
        if(this.characterController.weapon == null){
            this.state = AIState.collect;
        }else{
            // if(this.cyEngine.seededRandom() > 0.8){
            //     this.state = AIState.hide;
            // }else{
            //     this.state = AIState.collect;
            // }
            this.state = AIState.collect;

        }
    }

    /**
     *将手中物品随机丢弃
     *
     * @memberof AIController
     */
    dropInHand(){
        this.characterController.player.input.dir = cc.v2(0, 1).rotate(this.cyEngine.seededRandom(0, Math.PI * 2));
        this.characterController.player.input.mrb = true;
    }

}
