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

/**
 *每一帧将子元素根据Y值排序，Y值小的显示在前面
 *
 * @export
 * @class ChildrenSetZIndexByPositinoY
 * @extends {cc.Component}
 */
@ccclass
export default class ChildrenSetZIndexByPositinoY extends cc.Component {
    lateUpdate(){
        this.node.children.sort((a:cc.Node,b:cc.Node)=>{
            return b.getBoundingBox().yMin - a.getBoundingBox().yMin;
        }).forEach((child,key:number)=>{
            child.zIndex = key;
        })
    }
}
