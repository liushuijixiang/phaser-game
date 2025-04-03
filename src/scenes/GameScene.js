import { Player } from '../classes/Player.js';
import { Monster } from '../classes/monster.js';
import { HealSkill } from '../skills/Skill.js';
import { BattleManager } from '../battle/BattleManager.js';
import { UISystem } from '../ui/UISystem.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this._resizeHandler = () => this.resizeGame(); 
    }

    create(data) {
        this.sky = this.add.image(window.innerWidth/2, window.innerHeight/2, 'sky').setScale(window.innerWidth / 400, window.innerHeight / 600); // 添加背景

        

        this.enemyType = data.enemyType || "fight"; // 保存敌人类型

        // 创建地面
        this.platforms = this.add.image(window.innerWidth/2, window.innerHeight*15/16, 'ground').setScale(window.innerWidth / 400, window.innerHeight / 600);

        //获取数据
        const playerData = this.registry.get('playerData');
        const monsterData = this.registry.get('monsterData');

        

        // ✅ 响应窗口变化
        window.addEventListener('resize', this._resizeHandler, false);
        this.resizeGame(); // 初始化时调用一次

        // 创建角色
        this.player = new Player(this, window.innerWidth/8, window.innerHeight*7/8, 'dude', playerData);

        // 创建角色
        this.monster = new Monster(this, window.innerWidth*7/8, window.innerHeight*7/8, 'dude', monsterData);


        // 让角色与地面碰撞
        // this.physics.add.collider(this.player.sprite, platforms);

        // 让角色与地面碰撞
        // this.physics.add.collider(this.monster.sprite, platforms);

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

    shutdown() {
        // 离开场景时移除监听
        window.removeEventListener('resize', this._resizeHandler);
    }

    resizeGame() {
        this.sky.setPosition(window.innerWidth/2, window.innerHeight/2);
        this.sky.setScale(window.innerWidth / 400, window.innerHeight / 600);
        this.platforms.setPosition(window.innerWidth/2, window.innerHeight*15/16);
        this.platforms.setScale(window.innerWidth / 400, window.innerHeight / 600);
        
        

        if(this.battle) {
            this.battle.updateAllUI();
        }

        if(this.ui) {
            this.ui.updateUI();
        }

        if(this.player){
            this.player.sprite.setPosition(window.innerWidth/8, window.innerHeight*7/8);
            this.player.updateUIPosition();
        }
        
        if(this.monster){
            this.monster.sprite.setPosition(window.innerWidth*7/8, window.innerHeight*7/8);
            this.monster.updateUIPosition();
        }
    }

}
