import CyEngine from "../IOG/CyEngine";
import RoundManager from "./RoundManager";

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
export default class PickableManager extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    @property(cc.Prefab)
    pickablePrefab:cc.Prefab = null;

    @property(RoundManager)
    round:RoundManager = null;

    cyEngine:CyEngine = null;
    onLoad () {
        this.cyEngine = CyEngine.instance;
        this.round = this.getComponent(RoundManager);
    }

    start () {
        for (let i = 0; i < 10; i++) {
            let pickableNode = cc.instantiate(this.pickablePrefab);
            pickableNode.setPosition(this.cyEngine.seededRandom(-120,120),this.cyEngine.seededRandom(-120,120));
            this.round.objectsNode.addChild(pickableNode);
        }
    }

    // update (dt) {}
}
