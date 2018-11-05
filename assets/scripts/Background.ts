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
export default class Background extends cc.Component {

    static instance: Background;

    @property(cc.PhysicsBoxCollider)
    topBorder: cc.PhysicsBoxCollider = null;
    @property(cc.PhysicsBoxCollider)
    bottomBorder: cc.PhysicsBoxCollider = null;
    @property(cc.PhysicsBoxCollider)
    leftBorder: cc.PhysicsBoxCollider = null;
    @property(cc.PhysicsBoxCollider)
    rightBorder:cc.PhysicsBoxCollider = null;

    onLoad() {
        if (Background.instance == undefined) {
            Background.instance = this;
        } else {
            console.log("Background 单例失败");
            return;
        }

        this.topBorder.size.width = this.node.width+200;
        this.topBorder.size.height = 200;
        this.topBorder.node.width = this.node.width+200;
        this.topBorder.node.height = 200;
        this.topBorder.node.x = 0;
        this.topBorder.node.y = (this.node.height+this.topBorder.node.height)/2;

        this.bottomBorder.size.width = this.node.width+200;
        this.bottomBorder.size.height = 200;
        this.bottomBorder.node.width = this.node.width+200;
        this.bottomBorder.node.height = 200;
        this.bottomBorder.node.x = 0;
        this.bottomBorder.node.y = -this.topBorder.node.y;
        
        this.leftBorder.size.width = 200;
        this.leftBorder.size.height = this.node.height+200;
        this.leftBorder.node.width = 200;
        this.leftBorder.node.height = this.node.height + 200;
        this.leftBorder.node.x = -(this.node.width+this.leftBorder.node.width)/2;
        this.leftBorder.node.y = 0;
        
        this.rightBorder.size.width = 200;
        this.rightBorder.size.height = this.node.height+200;
        this.rightBorder.node.width = 200;
        this.rightBorder.node.height = this.node.height + 200;
        this.rightBorder.node.x = -this.leftBorder.node.x;
        this.rightBorder.node.y = 0;
    }
    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
