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

        //测试用
        this.registry.set('gold', 10000);

        // ✅ 初始化数据
        let hp = Phaser.Math.Between(1,100)+Phaser.Math.Between(50,100);
        let mp = Phaser.Math.Between(1,100)+Phaser.Math.Between(50,100);
        let attack = Phaser.Math.Between(3,8)+Phaser.Math.Between(5,10);
        this.registry.set('playerData', {
            hp: hp,
            maxHp: hp,
            mp: mp,
            maxMp: mp,
            attack: attack,
            speed: 100,
            shield: 0,
            armor: 0
        });

        hp = Phaser.Math.Between(1,50);
        mp = Phaser.Math.Between(1,10);
        attack = Phaser.Math.Between(1,5);
        this.registry.set('monsterData', {
            hp: hp,
            maxHp: hp,
            mp: mp,
            maxMp: mp,
            attack: attack,
            speed: 100,
            shield: 0,
            armor: 0
        });
    }

    shutdown() {
        // 离开场景时移除监听
        window.removeEventListener('resize', this._resizeHandler);
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
