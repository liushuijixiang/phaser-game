// PlayerDetailScene.js
export class PlayerDetailScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PlayerDetailScene' });
        this._resizeHandler = () => this.resizeGame(); 

    }

    init(data) {
        this.playerData = data.playerData;
        this.returnScene = data.returnScene; // 要返回的原场景名
    }

    create() {
        this.buildUI();

        // ✅ 响应窗口变化
        window.addEventListener('resize', this._resizeHandler, false);
        this.resizeGame(); // 初始调用一次
    }

    shutdown() {
        // 离开场景时移除监听
        window.removeEventListener('resize', this._resizeHandler);
    }

    buildUI() {
        const player = this.playerData;
        const skills = player.skills || [];

        const content = [
            `❤️ HP：${player.hp}/${player.maxHp}`,
            `🔵 MP：${player.mp}/${player.maxMp}`,
            `⚔️ 攻击：${player.attack}`,
            `🛡 护甲：${player.armor}`,
            `💨 速度：${player.speed}`,
            '',
            '✨ 技能：',
            ...skills.map(s => ` - ${s.name}（Lv.${s.level}）\n${s.description}`)
        ].join('\n');

        // ✅ 保存组件引用
        this.bg = this.add.rectangle(0, 0, 0, 0, 0x000044, 0.8);
        this.text = this.add.text(0, 0, content, {
            fontSize: '16px',
            fill: '#fff',
            wordWrap: { width: this.scale.width * 0.75 }
        }).setOrigin(0.5);

        this.closeBtn = this.add.text(0, 0, '返回', {
            fontSize: '20px',
            fill: '#0f0',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setInteractive().setOrigin(0.5);

        this.closeBtn.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume(this.returnScene);
        });
    }

    resizeGame() {
        const width = this.scale.width;
        const height = this.scale.height;

        if (this.bg) {
            this.bg.setSize(width * 0.8, height * 0.8);
            this.bg.setPosition(width / 2, height / 2);
        }

        if (this.text) {
            this.text.setPosition(width / 2, height / 2);
            this.text.setWordWrapWidth(width * 0.75);
        }

        if (this.closeBtn) {
            this.closeBtn.setPosition(width / 2, height - 40);
        }
    }

}
