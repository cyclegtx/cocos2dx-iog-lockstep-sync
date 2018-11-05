import CyEngine from "./CyEngine";
import CyRoomListItem from "./CyRoomListItem";

// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class CyServerPanel extends cc.Component {

    @property(cc.Label)
    userIDLabel: cc.Label = null;

    @property(cc.Label)
    roomIDLabel: cc.Label = null;

    @property(cc.Prefab)
    RoomListItemPrefab: cc.Prefab = null;

    @property(cc.Node)
    RoomListGroup: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        CyEngine.instance.node.on("getAvailableRooms", this.onGetRoomList, this);
        CyEngine.instance.node.on("roomJoined", this.onRoomJoined, this);
    }

    onGetRoomList(e) {
        this.RoomListGroup.removeAllChildren();
        if (e.rooms.length > 0) {
            e.rooms.forEach(element => {
                let item = cc.instantiate(this.RoomListItemPrefab);
                let itemController = item.getComponent(CyRoomListItem);
                itemController.roomID = element.roomId;
                itemController.label.string = element.roomId + `(${element.clients}/${element.maxClients})`;
                this.RoomListGroup.addChild(item);
            });
        } else {
            let item = cc.instantiate(this.RoomListItemPrefab);
            let itemController = item.getComponent(CyRoomListItem);
            itemController.roomID = "createRoom";
            itemController.label.string = "没有房间,新建并加入新房间";
            this.RoomListGroup.addChild(item);
        }

    }


    onRoomJoined(e) {
        this.roomIDLabel.string = "Room ID:" + e.room_id.toString()+"@"+e.room_session;
        //TODO:如果加入了房间则隐藏房间UI
        this.node.active = false;

    }

    freshRoomList() {
        CyEngine.instance.getAvailableRooms();
    }

    leaveRoom() {
        CyEngine.instance.close();
    }
}
