// import { Monster } from "../classes/monster.js";

export class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelSelectScene' });

        this.layerCount = 15; // 固定层数
        this.mapData = [];
        this.currentNode = 0;
        this.availableNodes = new Set();

        this._resizeHandler = () => this.resizeGame(); 
    }




    create() {
        this.add.text(400*window.innerWidth/800, 50*window.innerHeight/600, '选择你的路径', { fontSize: '28px', fill: '#fff' }).setOrigin(0.5);

        window.addEventListener('resize', this._resizeHandler, false);

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

        // ✅ 同理，当前楼层也保存在 registry 中
        const floor = this.registry.get("floor");
        if (floor === undefined) {
            const floor = 1
            this.registry.set("floor", floor);
            this.floor = floor;
        } else {
            this.floor = floor;
        }


        this.createMap(); // ✨渲染地图

        this.highlightNodes(); // ✨设置颜色

        // 初始位置设为起点，并允许前进
        this.updateAvailableNodes(this.mapData[1]); 

        this.setupCameraScroll();    // 设置滚动
        this.scrollThumbup = true;
        this.createScrollBar();

        this.centerOnCurrentNode(); // 👈 添加这一行

        this.events.on('shutdown', this.shutdown, this);
    }

    shutdown() {
        // 离开场景时移除监听
        window.removeEventListener('resize', this._resizeHandler);
    }

   update() {
        const barY = this.scrollTrack.y;
        const barHeight = this.scrollTrack.height;
        const trackTop = barY - barHeight / 2;
        const trackBottom = barY + barHeight / 2;
        const maxScroll = this.mapData.length * 120 * window.innerHeight / 600 - this.scale.height;

        if (this.scrollThumb && this.scrollTrack) {
            let percent = this.cameras.main.scrollY / maxScroll;
            if(this.scrollThumbup){this.scrollThumb.y = trackTop + percent * (trackBottom - trackTop);}
            else {
                percent = (this.scrollThumb.y-trackTop)/ (trackBottom - trackTop);
                this.cameras.main.scrollY = percent * maxScroll;
            }
        }
   }

    centerOnCurrentNode() {
        const current = this.mapData.flat().find(node => node.id === this.currentNode);
        if (current) {
            const stepY = 100 * window.innerHeight / 600;

            // 假设起始位置是 0，第 0 层 scrollY 应为 0，第 1 层为 1 * stepY ...
            const scrollTarget = current.row * stepY;

            // 镜头平移
            this.cameras.main.scrollY = scrollTarget;
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
                button.setAlpha(1);
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
            if (pointer.isDown && this.scrollThumbup) {
                if (this.lastPointerY && this.lastPointerY !== null) {
                    const deltaY = pointer.y - this.lastPointerY;

                    // 平滑移动（手动控制滑动灵敏度）
                    let smoothedVelocity = Phaser.Math.Clamp(deltaY, -30, 30); // 限制最大移动速度
                    this.cameras.main.scrollY -= smoothedVelocity;

                    this.lastPointerY = pointer.y;
                }else {
                    this.lastPointerY = pointer.y;
                }
            }else if(pointer.isDown && this.scrollThumb) {
                const barHeight = window.innerHeight - 100;
                const barX = this.scale.width - 50;
                const barY = window.innerHeight / 2;
                const trackTop = barY - barHeight / 2;
                const trackBottom = barY + barHeight / 2;
                this.scrollThumbup = false;
                this.scrollThumb.setFillStyle(0x888888);
                this.scrollThumb.y = Phaser.Math.Clamp(pointer.y, trackTop, trackBottom);
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
        const barHeight = window.innerHeight - 100;
        const barX = this.scale.width - 50;
        const barY = window.innerHeight / 2;

        // 滑道（背景条）
        this.scrollTrack = this.add.rectangle(barX, barY, 10, barHeight, 0x444444)
            .setOrigin(0.5)
            .setScrollFactor(0);

        // 滑块
        this.scrollThumb = this.add.rectangle(barX, barY, 14, 40, 0xffffff)
            .setOrigin(0.5)
            .setInteractive({ draggable: true })
            .setScrollFactor(0);

            this.input.setDraggable(this.scrollThumb);

        // 滑动时处理
        // this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        //     if (gameObject === this.scrollThumb) {
        //         const trackTop = barY - barHeight / 2;
        //         const trackBottom = barY + barHeight / 2;

        //         // 🟡 限制滑块在滑道内
        //         const clampedY = Phaser.Math.Clamp(dragY, trackTop, trackBottom);
        //         gameObject.y = clampedY;

        //     }
        // });

        // 滑块按下变色，抬起恢复
        this.scrollThumb.on('pointerdown', (pointer) => {
            const trackTop = barY - barHeight / 2;
            const trackBottom = barY + barHeight / 2;
            this.scrollThumbup = false;
            this.scrollThumb.setFillStyle(0x888888);
            this.scrollThumb.y = Phaser.Math.Clamp(pointer.y, trackTop, trackBottom);
        });

        // 滑块按下变色，抬起恢复
        this.scrollThumb.on('pointerup', (pointer) => {
            this.scrollThumbup = true;
            this.scrollThumb.setFillStyle(0xffffff);
            this.lastPointerY = null;
        });

        window.addEventListener('mouseup', () => {
            if (this.scrollThumb && !this.scrollThumbup) {
                this.scrollThumbup = true;
                this.scrollThumb.setFillStyle(0xffffff);
                this.lastPointerY = null;
            }
        });

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
        this.highlightNodes();

        // 手动移除 resize 事件监听器
        window.removeEventListener('resize', this._resizeHandler);
        

        if (node.type === "fight" || node.type === "elite" || node.type === "boss") {
            this.generateMonster(node.type);
            this.scene.start('GameScene', { enemyType: node.type });
            this.scene.stop(); 
            if(node.type === "boss") {
                this.registry.set("returnNode", undefined);
                this.registry.set("floor", this.floor+1);
            }
        } else if (node.type === "event") {
            this.scene.start('EventScene', { from: 'event' });
            this.scene.stop(); 
        } else if (node.type === "shop") {
            this.scene.start('EventScene', { from: 'shop' });
            this.scene.stop(); 
        }

    }

    /** 生成怪物 */
    generateMonster(type) {
        const current = this.mapData.flat().find(node => node.id === this.currentNode);
        let hp =  type === "boss" ? Phaser.Math.Between(3*Math.floor(1+Math.pow(current.row+this.floor-1, 2)/15)*30,3*Math.floor(1+Math.pow(current.row+this.floor-1, 2)/15)*30+150) : type === "elite" ? Phaser.Math.Between(current.row*2*Math.floor(1+current.row/15)*30,2*Math.floor(1+Math.pow(current.row+this.floor-1, 2)/15)*30+50) : Phaser.Math.Between(30*Math.floor(1+current.row/15),30*Math.floor(1+Math.pow(current.row+this.floor-1, 2)/15)+50);
        let attack = type === "boss" ? Phaser.Math.Between(10*Math.floor(1+Math.pow(current.row+this.floor-1, 2)/15)+5,10*Math.floor(1+Math.pow(current.row+this.floor-1, 2)/15)+5) : type === "elite" ? Phaser.Math.Between(current.row*6*Math.floor(1+current.row/15)+1,6*Math.floor(1+Math.pow(current.row+this.floor-1, 2)/15)+15) : Phaser.Math.Between(3*Math.floor(1+current.row/15)+1,3*Math.floor(1+current.row/15)+5);
        console.log(`node is ${Math.pow(current.row+this.floor-1, 2)} and floor is ${this.floor} and hp and attack is ${hp} and ${attack}`);
        let monsterData = {
            hp: hp*this.floor,
            maxHp: hp*this.floor,
            attack: attack*this.floor,
            armor: type === "boss" ? 10*this.floor : type === "elite" ? 5*this.floor : 2*this.floor,

            mp: 50,
            maxMp: 50,
            // attack: 30,
            speed: 100 + this.floor*current.row,
            shield: 0,
            // armor: 0
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
        this.highlightNodes();
    }


    // /** 高亮当前所在节点 */
    // highlightCurrentNode() {
    //     this.nodes.forEach(button => {
    //         button.setAlpha(button.nodeData.id === this.currentNode ? 1 : 0.5);
    //     });
    // }

    /** 获取不同类型的节点文字 */
    getNodeText(type) {
        return type === "fight" ? "战斗" :
               type === "elite" ? "精英战" :
               type === "event" ? "事件" :
               type === "shop" ? "商店" :
               type === "boss" ? "BOSS" :
               "起点";
    }
    

    resizeGame() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // 1. 更新 Phaser 的画布尺寸
        this.scale.resize(width, height);

        // 2. 设置摄像机边界，适配新窗口大小
        if(this.cameras.main && this.mapData){
            this.cameras.main.setBounds(0, 0, width, this.mapData.length * 120 * height / 600);
        }
        

        // 3. 更新金币文本位置
        if (this.goldText) {
            this.goldText.setPosition(this.scale.width - 80 * width / 800, 20 * height / 600);
        }

        // 4. 重新定位滚动条
        const barHeight = height - 100 * height / 600;
        const barX = width - 50 * width / 800;
        const barY = height / 2;

        if (this.scrollTrack) {
            this.scrollTrack.setSize(10, barHeight);
            this.scrollTrack.setPosition(barX, barY);
        }

        if (this.scrollThumb) {
            this.scrollThumb.setPosition(barX, barY);
        }

        // 5. ✅ 重新布局地图节点 & 连接线
        const startY = 150 * height / 600;
        const gapY = 100 * height / 600;
        this.nodes.forEach(button => {
            const node = button.nodeData;
            const row = this.mapData[node.row];
            const xOffset = 400 - (row.length * 120) / 2;
            const nodeX = (xOffset + node.col * 120) * width / 800;
            const nodeY = startY + node.row * gapY;
            button.setPosition(nodeX, nodeY);
        });

        // 6. 重新绘制连线
        this.mapContainer.removeAll(true); // 清空所有地图内容
        this.nodes = [];
        this.createMap(); // 重新绘制地图结构（节点 + 连线）
        this.updateAvailableNodes();
        this.highlightNodes(); // ✅ 必须要重新执行一次

        // 7. 回到当前节点视角（不然可能偏移）
        // this.centerOnCurrentNode();

    }


}
