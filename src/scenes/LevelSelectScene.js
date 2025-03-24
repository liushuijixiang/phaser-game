// import { Monster } from "../classes/monster.js";

export class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelSelectScene' });

        this.layerCount = 15; // 固定层数
        this.mapData = [];
        this.currentNode = 0;
        this.availableNodes = new Set();
    }




    create() {
        this.add.text(400*window.innerWidth/800, 50*window.innerHeight/600, '选择你的路径', { fontSize: '28px', fill: '#fff' }).setOrigin(0.5);

        // 创建地图容器
        this.mapContainer = this.add.container(0, 0);

        this.drawGoldDisplay();

        this.nodes = [];
        // ✅ 检查地图是否已经生成过
        const mapData = this.registry.get("mapData");
        if (mapData === undefined) {
            this.nodes = [];
            this.generateRandomMap();
            this.registry.set('mapData', this.mapData);
        }

        this.mapData = this.registry.get('mapData'); // 从注册表中获取地图

        // ✅ 同理，当前节点也保存在 registry 中
        const returnNode = this.registry.get("returnNode");
        if (returnNode !== undefined) {
            this.currentNode = returnNode;
            this.registry.set("returnNode", undefined);
        } else {
            this.currentNode = 0;
        }

        this.createMap(); // ✨渲染地图

        this.highlightNodes(); // ✨设置颜色

        // 初始位置设为起点，并允许前进
        this.updateAvailableNodes(this.mapData[1]); 

        this.setupCameraScroll();    // 设置滚动
        this.createScrollBar();
    }

    update() {

        if (this.scrollThumb && this.scrollTrack) {
            const barY = this.scrollTrack.y;
            const barHeight = this.scrollTrack.height;

            const percent = this.cameras.main.scrollY / (this.cameras.main.getBounds().height - this.cameras.main.height);
            this.scrollThumb.y = barY - barHeight / 2 + percent * barHeight;
        }

    }

    // generateRandomMap() {
    //     const nodeTypes = ["fight", "event", "shop"];
    //     this.mapData = [];

    //     // 起点
    //     this.mapData.push([{ type: "start", id: 0, row: 0, col: 0 }]);

    //     let nodeId = 1;
    //     for (let row = 1; row < this.layerCount - 1; row++) {
    //         const nodeCount = Phaser.Math.Between(2, 3);
    //         const rowNodes = [];

    //         for (let i = 0; i < nodeCount; i++) {
    //             const type = Phaser.Utils.Array.GetRandom(nodeTypes);
    //             rowNodes.push({ type, id: nodeId++, row, col: i });
    //         }

    //         this.mapData.push(rowNodes);
    //     }

    //     // 最后一层 Boss 房
    //     this.mapData.push([{ type: "boss", id: nodeId++, row: this.layerCount - 1, col: 0 }]);
    // }
    generateRandomMap() {
        // const nodeTypes = ["fight", "event", "elite", "shop"];
        const weightedTypes = [
            "fight", "fight", "fight", // 权重大
            "event", "event",
            "elite",
            "shop" // 权重小
        ];
        this.mapData = [];

        // 起点
        this.mapData.push([{ type: "start", id: 0, row: 0, col: 0, connections: [] }]);

        let nodeId = 1;
        for (let row = 1; row < this.layerCount - 1; row++) {
            const nodeCount = Phaser.Math.Between(2, 3);
            const rowNodes = [];

            for (let i = 0; i < nodeCount; i++) {
                rowNodes.push({ 
                    type: Phaser.Utils.Array.GetRandom(weightedTypes), 
                    id: nodeId++, 
                    row, 
                    rowcol: nodeCount,
                    col: i, 
                    connections: [] 
                });
            }

            this.mapData.push(rowNodes);
        }

        // Boss 房
        this.mapData.push([{ 
            type: "boss", id: nodeId++, row: this.layerCount - 1, col: 0, connections: [] 
        }]);

        // ✅ 强制Boss房前面至少有一个商店
        const secondLastRow = this.mapData[this.layerCount - 2];
        const hasShop = secondLastRow.some(node => node.type === 'shop');
        if (!hasShop) {
            const forceShopNode = Phaser.Utils.Array.GetRandom(secondLastRow);
            forceShopNode.type = 'shop';
        }

        // ✅ 添加连接关系
        for (let r = 0; r < this.mapData.length - 1; r++) {
            const currentRow = this.mapData[r];
            const nextRow = this.mapData[r + 1];

            if (r === 0) {
                // 起点连接所有下一层
                currentRow[0].connections = nextRow.map(n => n.id);
            } else if (r === this.mapData.length - 2) {
                // 倒数第二层 → boss 全部连接
                currentRow.forEach(node => node.connections.push(nextRow[0].id));
            } else {
                currentRow.forEach(node => {
                    nextRow.forEach(target => {
                        if (Math.floor(target.rowcol - node.rowcol) > 0) {
                            if (Math.floor(node.col - target.col) === -1 || Math.floor(node.col - target.col) === 0) {
                                node.connections.push(target.id);
                            }
                        }else if (Math.floor(target.rowcol - node.rowcol) < 0) {
                            if (Math.floor(node.col - target.col) === 1 || Math.floor(node.col - target.col) === 0) {
                                node.connections.push(target.id);
                            }
                        } else {
                            if (Math.abs(target.col - node.col) === 0) {
                                node.connections.push(target.id);
                            }
                        }
                    });
                });
            }
        }
    }




    highlightNodes() {
        this.nodes.forEach(button => {
            const id = button.nodeData.id;
            if (id === this.currentNode) {
                button.setTint(0xffffff); // 当前
            } else if (this.availableNodes.has(id)) {
                button.setTint(0xaaaaaa); // 可选
            } else {
                button.setTint(0x555555); // 灰色
            }
        });
    }


    createMap() {
        const startX = 400, startY = 150*window.innerHeight/600, gapY = 100*window.innerHeight/600;

        this.mapData.forEach((row, rowIndex) => {
            let xOffset = 400 - (row.length * 120) / 2;

            row.forEach((node, colIndex) => {
                let nodeX = (xOffset + colIndex * 120)*window.innerWidth/800;
                let nodeY = startY + rowIndex * gapY;

                // **使用文字按钮**
                let text = this.getNodeText(node.type);
                let button = this.add.text(nodeX, nodeY, text, { fontSize: '20px', fill: '#fff', backgroundColor: '#444' })
                    .setPadding(10)
                    .setInteractive()
                    .setOrigin(0.5);

                this.mapContainer.add(button);

                button.nodeData = node;

                // **仅允许选中的可用**
                if (!this.availableNodes.has(node.id)) {
                    button.setAlpha(0.5);
                }

                button.on('pointerdown', () => {
                    if (this.availableNodes.has(node.id)) {
                        this.enterRoom(node);
                    }
                });

                this.nodes.push(button);

                // ✨连线：上一层每个都连
                if (rowIndex > 0) {
                    let prevRow = this.mapData[rowIndex - 1];
                    prevRow.forEach(prev => {
                        prev.connections.forEach(nextId => {
                            let prevX = (400 - (prevRow.length * 120) / 2 + prev.col * 120)*window.innerWidth/800;
                            let prevY = startY + (rowIndex - 1) * gapY;

                            let next = this.mapData[rowIndex].find(n => n.id === nextId);
                            let nextX = (400 - (this.mapData[rowIndex].length * 120) / 2 + next.col * 120)*window.innerWidth/800;
                            let nextY = startY + rowIndex * gapY;

                            let addline = this.add.line(0, 0, prevX, prevY + 20, nextX, nextY - 20, 0xffffff).setOrigin(0, 0);

                            this.mapContainer.add(addline);
                        });
                    });
                }



                // **正确绘制连线**
                // if (rowIndex > 0) {
                //     let prevRow = this.mapData[rowIndex - 1];
                //     prevRow.forEach(prevNode => {
                //         let prevNodeIndex = prevRow.indexOf(prevNode);
                //         let prevNodeX = 400 - (prevRow.length * 120) / 2 + prevNodeIndex * 120;
                //         let prevNodeY = nodeY - gapY;

                //         this.add.line(0, 0, prevNodeX, prevNodeY + 20, nodeX, nodeY - 20, 0xffffff);
                //     });
                // }
            });
        });
    }

    setupCameraScroll() {
        // 启用手指拖动或鼠标拖动
        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                this.cameras.main.scrollY -= (pointer.velocity.y / 10*window.innerHeight/600);
            }
        });

        // 鼠标滚轮滚动支持
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            this.cameras.main.scrollY += deltaY * 0.5;
        });

        // 限制 scroll 范围
        this.cameras.main.setBounds(0, 0, window.innerWidth, this.mapData.length * 120*window.innerHeight/600);
    }

    createScrollBar() {
        const barHeight = window.innerHeight - 100*window.innerHeight/600;
        const barX = this.scale.width - 50*window.innerWidth/800;
        const barY = window.innerHeight/2;

        // 滚动条背景
        this.scrollTrack = this.add.rectangle(barX, barY, 10, barHeight, 0x444444).setOrigin(0.5).setScrollFactor(0);

        // 滚动条滑块
        this.scrollThumb = this.add.rectangle(barX, barY, 14, 40, 0xffffff).setOrigin(0.5).setInteractive({ draggable: true }).setScrollFactor(0);
        this.scrollThumb.setInteractive();

    }

    drawGoldDisplay() {
        const gold = this.registry.get("gold") || 0;
        this.goldText = this.add.text(this.scale.width - 80*this.scale.width/800, 20*this.scale.height/600, `💰 ${gold}`, {
            fontSize: "20px",
            fill: "#ffd700"
        }).setOrigin(1, 0);

        // ✅ 让金币文本忽略 camera 滚动
        this.goldText.setScrollFactor(0); 
    }




    /** 进入房间 */
    enterRoom(node) {
        this.currentNode = node.id;
        this.registry.set("returnNode", this.currentNode); // 记录返回位置
        this.updateAvailableNodes();

        if (node.type === "fight" || node.type === "elite" || node.type === "boss") {
            this.generateMonster(node.type);
            this.scene.start('GameScene', { enemyType: node.type });
        } else if (node.type === "event") {
            this.scene.start('EventScene', { from: 'event' });
        } else if (node.type === "shop") {
            this.scene.start('EventScene', { from: 'shop' });
        }

    }

    /** 生成怪物 */
    generateMonster(type) {
        let monsterData = {
            hp: type === "boss" ? 500 : type === "elite" ? 200 : 100,
            maxHp: type === "boss" ? 500 : type === "elite" ? 200 : 100,
            attack: type === "boss" ? 50 : type === "elite" ? 30 : 20,
            defense: type === "boss" ? 10 : type === "elite" ? 5 : 2,
            mp: 50,
            maxMp: 50,
            // attack: 30,
            speed: 100,
            shield: 0,
            armor: 0
        };

        // let monster = new Monster(monsterData.hp, monsterData.attack, monsterData.defense);
        this.registry.set("monsterData", monsterData); // 存储到全局
    }

    /** 更新可选择的下一节点 */
    // updateAvailableNodes() {
    //     this.availableNodes.clear();
    //     let nextRowIndex = this.mapData.findIndex(row => row.some(node => node.id === this.currentNode)) + 1;
    //     if (nextRowIndex < this.mapData.length) {
    //         this.mapData[nextRowIndex].forEach(node => this.availableNodes.add(node.id));
    //     }
    //     this.highlightCurrentNode();
    // }
    /** 更新可选择的下一节点（只包含连接关系） */
    updateAvailableNodes() {
        this.availableNodes.clear();
        // 找到当前节点
        const current = this.mapData.flat().find(node => node.id === this.currentNode);
        if (!current || !current.connections) return;
        // 将当前节点连接的目标 id 加入 availableNodes
        current.connections.forEach(id => this.availableNodes.add(id));
        this.highlightCurrentNode();
    }


    /** 高亮当前所在节点 */
    highlightCurrentNode() {
        this.nodes.forEach(button => {
            button.setAlpha(button.nodeData.id === this.currentNode ? 1 : 0.5);
        });
    }

    /** 获取不同类型的节点文字 */
    getNodeText(type) {
        return type === "fight" ? "战斗" :
               type === "elite" ? "精英战" :
               type === "event" ? "事件" :
               type === "shop" ? "商店" :
               type === "boss" ? "BOSS" :
               "起点";
    }
}
