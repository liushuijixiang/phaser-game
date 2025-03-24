// ✅ 先导入场景
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { EventScene } from './scenes/EventScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';

// Phaser 3 配置
var config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, EventScene, LevelSelectScene, GameScene] // 多个场景
};

// 初始化游戏
var game = new Phaser.Game(config);

