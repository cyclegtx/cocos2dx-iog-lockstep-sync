import CyEngine from "../IOG/CyEngine";
import CharacterController from "./CharacterController";
import RoundManager from "./RoundManager";
import CyPlayer from "../IOG/CyPlayer";
import AIController from "./AIController";

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
export default class AIManager extends cc.Component {

    @property(cc.Prefab)
    playerPrefab:cc.Prefab = null;

    @property(cc.Prefab)
    AIPrefab:cc.Prefab = null;
    
    players:CyPlayer[] = [];
    bots:CharacterController[] = [];
    AIControllers:AIController[] = [];
    maxBotsCount:number = 3;

    cyEngine:CyEngine = null;
    round:RoundManager = null;

    onLoad () {
        this.cyEngine = CyEngine.instance;
        this.round = this.getComponent(RoundManager);
    }

    start () {
        for(let i=0;i<this.maxBotsCount;i++){
            this.addBot();
        }
    }

    /**
     *添加AI机器人
     *
     * @memberof AIManager
     */
    addBot(){
        let player = new CyPlayer();
        let playerNode = cc.instantiate(this.playerPrefab);
        let ai = cc.instantiate(this.AIPrefab);
        playerNode.addChild(ai);
        let controller = playerNode.getComponent(CharacterController);
        let aiController = ai.getComponent(AIController);

        controller.player = player;
        playerNode.setPosition(cc.v2(this.cyEngine.seededRandom(-120,120), this.cyEngine.seededRandom(-120,120)))
        this.round.objectsNode.addChild(playerNode);
        this.players.push(player);
        this.AIControllers.push(aiController);
        this.bots.push(controller);
    }

    // update (dt) {
    // }
}
