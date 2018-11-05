// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

export default class CyPlayer{
    public sessionId:string = null;
    public isLocal:boolean = false;
    public input: {
        mlb: boolean,
        mrb: boolean,
        dir:cc.Vec2,
        mpos:cc.Vec2,
    } = {
        mlb:false,
        mrb:false,
        dir:cc.Vec2.ZERO,
        mpos: cc.Vec2.ZERO,
    };
    public updateInput(cmd){
        this.input.mlb = cmd.mlb;
        this.input.mrb = cmd.mrb;
        this.input.dir.x = cmd.dir.x;
        this.input.dir.y = cmd.dir.y;
        this.input.mpos.x = cmd.mpos.x;
        this.input.mpos.y = cmd.mpos.y;
    }
}
