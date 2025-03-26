export class UISystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.isPaused = false;
        this.gameSpeed = 1;

        this.createUI();
    }

    /** 创建 UI 组件 */
    createUI() {
        // 🔹 **暂停按钮**
        this.pauseButton = this.scene.add.text(400*window.innerWidth/800, 20*window.innerHeight/600, '⏸️ 暂停', { fontSize: '24px', fill: '#fff' }).setScale(window.innerWidth/800, window.innerHeight/600)
            .setInteractive()
            .on('pointerdown', () => this.togglePause());

        // 🔹 **加速按钮**
        this.speedButton = this.scene.add.text(600*window.innerWidth/800, 20*window.innerHeight/600, '⏩ 加速 x1', { fontSize: '24px', fill: '#fff' }).setScale(window.innerWidth/800, window.innerHeight/600)
            .setInteractive()
            .on('pointerdown', () => this.toggleSpeed());

        // // 🔹 **角色属性**
        // this.playerInfo = this.scene.add.text(20, 20, this.getPlayerInfo(), { fontSize: '20px', fill: '#fff' });

        // // 🔹 **物品栏**
        // this.inventoryText = this.scene.add.text(20, 120, '🎒 物品: 无', { fontSize: '18px', fill: '#ccc' });

        // // 🔹 **状态栏**
        // this.statusText = this.scene.add.text(20, 160, '🌀 状态: 无', { fontSize: '18px', fill: '#ccc' });

        // // 🔹 **战斗日志**
        // this.battleLog = this.scene.add.text(20, 500, '📜 战斗日志:\n', { fontSize: '16px', fill: '#fff' });

        // **定时更新 UI**
        // this.scene.time.addEvent({
        //     delay: 500, // 每 0.5 秒更新一次
        //     loop: true,
        //     callback: () => this.updateUI()
        // });
    }

    // /** 获取角色信息 */
    // getPlayerInfo() {
    //     return `🎭 ${this.player.name}\n❤️ HP: ${this.player.hp}/${this.player.maxHp}\n💙 MP: ${this.player.mp}/${this.player.maxMp}\n⚔️ 攻击: ${this.player.attack}\n🛡️ 护甲: ${this.player.armor}`;
    // }

    /** 切换暂停状态 */
    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseButton.setText(this.isPaused ? '▶️ 继续' : '⏸️ 暂停');
        this.scene.physics.world.isPaused = this.isPaused;
        // **通知 BattleManager 同步暂停**
        if (this.scene.battle) {
            this.scene.battle.setPause(this.isPaused);
        }
    }

    /** 切换加速状态 */
    toggleSpeed() {
        this.gameSpeed = this.gameSpeed === 1 ? 2 : 1;
        this.speedButton.setText(this.gameSpeed === 1 ? '⏩ 加速 x1' : '⏩ 加速 x2');
        this.scene.time.timeScale = this.gameSpeed;
        // **通知 BattleManager 同步加速**
        // if (this.scene.battle) {
        //     this.scene.battle.setSpeed(this.gameSpeed);
        // }
    }

    // /** 更新 UI */
    updateUI() {
        // this.playerInfo.setText(this.getPlayerInfo());
        if (this.pauseButton) {
            this.pauseButton.setPosition(400*window.innerWidth/800, 20*window.innerHeight/600);
            this.pauseButton.setScale(window.innerWidth/800, window.innerHeight/600);
        }
        if (this.speedButton) {
            this.speedButton.setPosition(600*window.innerWidth/800, 20*window.innerHeight/600);
            this.speedButton.setScale(window.innerWidth/800, window.innerHeight/600);
        }
    }

    // /** 更新物品栏 */
    // updateInventory(items) {
    //     this.inventoryText.setText(`🎒 物品: ${items.length > 0 ? items.join(', ') : '无'}`);
    // }

    // /** 更新状态栏 */
    // updateStatus(statusList) {
    //     this.statusText.setText(`🌀 状态: ${statusList.length > 0 ? statusList.join(', ') : '无'}`);
    // }

//     /** 添加战斗日志 */
//     addBattleLog(text) {
//         this.battleLog.setText(`📜 战斗日志:\n${text}\n` + this.battleLog.text);
//     }
}
