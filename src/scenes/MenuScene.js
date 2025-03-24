export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // ✅ 添加背景
        this.sky = this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'sky');
        this.sky.setScale(window.innerWidth / 400, window.innerHeight / 600);

        // ✅ 添加标题
        this.titleText = this.add.text(window.innerWidth / 2, window.innerHeight / 2 - 100, '欢迎来到游戏', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // ✅ 添加开始按钮
        this.startButton = this.add.text(window.innerWidth / 2, window.innerHeight / 2 + 100, '开始游戏', {
            fontSize: '24px',
            fill: '#0f0'
        }).setInteractive().setOrigin(0.5);

        this.startButton.on('pointerdown', () => {
            console.log('进入游戏');
            this.scene.start('LevelSelectScene');
        });

        // ✅ 响应窗口变化
        window.addEventListener('resize', () => this.resizeGame(), false);
        this.resizeGame(); // 初始化时调用一次

        // ✅ 初始化数据
        this.registry.set('playerData', {
            hp: 10,
            maxHp: 100,
            mp: 0,
            maxMp: 50,
            attack: 30,
            speed: 100,
            shield: 0,
            armor: 0
        });

        this.registry.set('monsterData', {
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            attack: 30,
            speed: 100,
            shield: 0,
            armor: 0
        });
    }

    resizeGame() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.scale.resize(width, height); // 更新场景大小

        // 背景居中并缩放
        if (this.sky) {
            this.sky.setPosition(width / 2, height / 2);
            this.sky.setScale(width / 400, height / 600);
        }

        // 文本位置更新
        if (this.titleText) {
            this.titleText.setPosition(width / 2, height / 2 - 100);
        }

        if (this.startButton) {
            this.startButton.setPosition(width / 2, height / 2 + 100);
        }
    }
}
