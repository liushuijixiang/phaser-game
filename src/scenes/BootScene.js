export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        // this.load.image('button', 'assets/button.png');
        this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    }

    create() {
        console.log('BootScene 加载完成，进入菜单');
        this.scene.start('MenuScene'); // 直接跳转到主菜单
    }
}
