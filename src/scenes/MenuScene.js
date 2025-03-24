export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.add.image(400, 300, 'sky'); // 添加背景
        this.add.text(300, 100, '欢迎来到游戏', { fontSize: '32px', fill: '#fff' });

        let startButton = this.add.text(350, 250, '开始游戏', { fontSize: '24px', fill: '#0f0' }).setInteractive();
        startButton.on('pointerdown', () => {
            console.log('进入游戏');
            this.scene.start('LevelSelectScene'); // 切换到游戏场景
        });

        this.registry.set('playerData', {
            hp: 100,
            maxHp: 100,
            mp: 50,
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

}
