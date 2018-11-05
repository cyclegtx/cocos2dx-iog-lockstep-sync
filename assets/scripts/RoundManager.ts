import CharacterController from "./CharacterController";
import CyPlayer from "../IOG/CyPlayer";
import CyEngine, { CyRoundManager } from "../IOG/CyEngine";
import AIManager from "./AIManager";

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

@ccclass
export default class RoundManager extends CyRoundManager {


    @property({
        displayName:"玩家Prefab",
        type:cc.Prefab
    })
    playerPrefab:cc.Prefab = null;

    @property({
        displayName: "物体显示层",
        type: cc.Node
    })
    objectsNode: cc.Node = null;

    cyEngine:CyEngine = null;
    AI:AIManager = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.cyEngine = CyEngine.instance;
        this.AI = this.getComponent(AIManager);
    }

    // start () {
    // }

    // update (dt) {}


    /**
     *添加玩家
    *
    * @param {CyPlayer} player
    * @memberof RoundManager
    */
    addPlayer(player: CyPlayer) {
        let playerNode = cc.instantiate(this.playerPrefab);
        let controller: CharacterController = playerNode.getComponent(CharacterController);
        controller.player = player;
        playerNode.setPosition(this.cyEngine.seededRandom(120, -120), this.cyEngine.seededRandom(120, -120));
        this.objectsNode.addChild(playerNode);
    }
    
    /**
     *当玩家可以控制的时候
     *
     * @memberof RoundManager
     */
    onReadyToControl(): void {
        this.cyEngine.sendToRoom(["cmd", ["addplayer"]]);
    }
}
