import InputManager from "./InputManager";

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
export default class CameraController extends cc.Component {

    static instance: CameraController;
    private inputManager:InputManager = null;
    public camera:cc.Camera = null;

    onLoad () {
        if (CameraController.instance == undefined) {
            CameraController.instance = this;
        } else {
            console.log("CameraController 单例失败");
            return;
        }
        this.inputManager = InputManager.instance;
        this.camera = this.getComponent(cc.Camera);
    }

    moveTo(position:cc.Vec2){
        this.node.setPosition(position);
        this.inputManager.calcMousePositionInCanvas();
    }

    // start () {

    // }

    // update (dt) {

    // }
}
