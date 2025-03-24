import { Player } from '../classes/Player.js';
import { Monster } from '../classes/monster.js';
import { HealSkill } from '../skills/Skill.js';
import { BattleManager } from '../battle/BattleManager.js';
import { UISystem } from '../ui/UISystem.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create(data) {
        this.add.image(400, 300, 'sky'); // 背景

        this.enemyType = data.enemyType || "fight"; // 保存敌人类型

        // 创建地面
        var platforms = this.physics.add.staticGroup();
        platforms.create(400, 568, 'ground').setScale(2).refreshBody();

        //获取数据
        const playerData = this.registry.get('playerData');
        const monsterData = this.registry.get('monsterData');

        // 创建角色
        this.player = new Player(this, 100, 450, 'dude', playerData);

        // 创建角色
        this.monster = new Monster(this, 700, 450, 'dude', monsterData);

        // 添加技能
        this.player.skills.push(new HealSkill());


        // 让角色与地面碰撞
        this.physics.add.collider(this.player.sprite, platforms);

        // 让角色与地面碰撞
        this.physics.add.collider(this.monster.sprite, platforms);

        // 监听键盘输入
        // this.cursors = this.input.keyboard.createCursorKeys(); 
        
        // this.player.gainShield(125);      // 消耗 3 点法力
        // this.player.takeDamage(99);   // 受到 5 点伤害

        // 测试：让角色受到伤害、恢复生命、消耗蓝量
        // this.time.addEvent({
        //     delay: 2000, // 每 2 秒
        //     callback: () => {
        //         this.player.heal(20);         // 恢复 2 点生命值
        //         this.player.useMana(3);      // 消耗 3 点法力
        //         this.player.increaseAttack(1); // 增加 1 点攻击力
        //         // this.player.takeDamage(50);   // 受到 5 点伤害
        //     },
        //     loop: true
        // });
        this.battle = new BattleManager(this, this.player, this.monster, this.ui, this.enemyType);
        this.battle.startBattle();

        // **创建 UI 管理**
        this.ui = new UISystem(this, this.player);

        // **测试：战斗日志**
        // this.ui.addBattleLog("⚔️ 战斗开始！");
    }

    // update() {
    //     if (this.cursors.left.isDown) {
    //         this.player.sprite.setVelocityX(-160);
    //         this.player.sprite.anims.play('left', true);
    //     } else if (this.cursors.right.isDown) {
    //         this.player.sprite.setVelocityX(160);
    //         this.player.sprite.anims.play('right', true);
    //     } else {
    //         this.player.sprite.setVelocityX(0);
    //         this.player.sprite.anims.play('turn');
    //     }

    //     if (this.cursors.up.isDown && this.player.sprite.body.touching.down) {
    //         this.player.sprite.setVelocityY(-330);
    //     }
    // }
}
