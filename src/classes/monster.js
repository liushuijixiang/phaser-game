// import { SkillManager } from '../skills/SkillManager.js';

export class Monster {
    constructor(scene, x, y, texture, monsterData) {
        this.scene = scene;

        this.gameover = false;

        // 创建角色
        this.sprite = scene.physics.add.sprite(x, y, texture);
        this.sprite.setBounce(0.2);
        this.sprite.setCollideWorldBounds(true);


        // 角色属性
        this.name = "monster";
        this.maxHp = monsterData.maxHp;
        this.hp = monsterData.hp;
        this.tempHp = this.hp;
        this.shield = monsterData.shield; // 当前护盾值
        this.armor = monsterData.armor;
        this.maxShield = this.maxHp*100;
        this.maxMp = monsterData.maxMp;
        this.mp = monsterData.mp;
        this.attack = monsterData.attack;
        this.speed = monsterData.speed;



        this.skills = []; // 存储技能
        // this.skillManager = new SkillManager(this); // 管理技能

        // UI 位置 & 尺寸
        this.uiX = 560;
        this.uiY = 70;
        this.barWidth = 200;
        this.barHeight = 20;
        this.borderThickness = 2;

        // **血条边框**
        this.hpBorder = scene.add.graphics();
        this.hpBorder.lineStyle(this.borderThickness, 0xffffff, 1); // 白色边框
        this.hpBorder.strokeRect(this.uiX, this.uiY, this.barWidth, this.barHeight);

        // **血条背景**
        this.hpBg = scene.add.graphics();
        this.hpBg.fillStyle(0x222222, 1); // 深灰色背景
        this.hpBg.fillRect(this.uiX, this.uiY, this.barWidth, this.barHeight);

        // **扣血动画条**
        this.hpLostBar = scene.add.graphics();
        this.hpLostBar.fillStyle(0x7a3b3b, 1); // 暗红色

        // **血条（柔和红色）**
        this.hpBar = scene.add.graphics();
        this.hpBar.fillStyle(0xd44d4d, 1);
        this.shieldBar = scene.add.graphics();
        this.shieldBar.fillStyle(0xC0C0C0, 1);

        // **血量数值**
        this.hpText = scene.add.text(this.uiX + this.barWidth / 2, this.uiY + 2, '', {
            fontSize: '16px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        // **蓝条边框**
        this.mpBorder = scene.add.graphics();
        this.mpBorder.lineStyle(this.borderThickness, 0xffffff, 1); // 白色边框
        this.mpBorder.strokeRect(this.uiX, this.uiY + 30, this.barWidth, this.barHeight);

        // **蓝条背景**
        this.mpBg = scene.add.graphics();
        this.mpBg.fillStyle(0x222222, 1);
        this.mpBg.fillRect(this.uiX, this.uiY + 30, this.barWidth, this.barHeight);

        // **蓝条（柔和蓝色）**
        this.mpBar = scene.add.graphics();
        this.mpBar.fillStyle(0x4d8fd4, 1);

        // **蓝量数值**
        this.mpText = scene.add.text(this.uiX + this.barWidth / 2, this.uiY + 32, '', {
            fontSize: '16px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        // **绘制 UI**
        this.updateUI();
    }

    // **更新血条 & 蓝条**
    updateUI() {
        let currentHpWidth = (Math.max(this.hp,0) / Math.max(this.maxHp, this.hp + Math.max(this.shield,0))) * this.barWidth;

        if(this.gameover){}else{

            // **更新血条**
            this.hpBar.clear();
            this.hpBar.fillStyle(0xd44d4d, 1);
            this.hpBar.fillRect(this.uiX, this.uiY, currentHpWidth, this.barHeight);
            // **Tween 动画：让 tempHp 逐渐减少**
            this.scene.tweens.add({
                targets: this,
                tempHp: Math.max(this.hp,0), // 让 tempHp 缓慢减小
                duration: 600, // 0.8 秒
                ease: 'Linear',
                onUpdate: () => {
                    let lostWidth = ((this.tempHp - Math.max(this.hp,0)) / this.maxHp) * this.barWidth;
                    this.hpLostBar.clear();
                    if (lostWidth > 0) {
                        this.hpLostBar.fillStyle(0x7a3b3b, 1); // 暗红色
                        this.hpLostBar.fillRect(this.uiX + (Math.max(this.hp,0) / this.maxHp) * this.barWidth, this.uiY, lostWidth, this.barHeight);
                    }
                }
            });

            // **更新血量数值**
            this.hpText.setText(`${this.hp} / ${this.maxHp}`);

            // **更新护盾数值**
            if (this.shield > 0) {
                let hpWidth = (this.hp / Math.max(this.maxHp, this.hp + this.shield)) * this.barWidth;
                let shieldWidth = (this.shield / Math.max(this.maxHp, this.hp + this.shield)) * this.barWidth;
                // **更新血条**
                this.hpBar.clear();
                this.hpBar.fillStyle(0xd44d4d, 1);
                this.hpBar.fillRect(this.uiX, this.uiY, hpWidth, this.barHeight);
                this.shieldBar.clear();
                this.shieldBar.fillStyle(0xC0C0C0, 1); // 灰白色护盾条
                this.shieldBar.fillRect(this.uiX + hpWidth, this.uiY, shieldWidth, this.barHeight);
                // **显示数值**
                this.hpText.setText(`${this.hp}+${this.shield} / ${this.maxHp}`);
            }else
            {
                this.shieldBar.clear();
            }



            let mpPercent = this.mp / this.maxMp;
            let currentMpWidth = Math.max(mpPercent * this.barWidth, 0);

            // **更新蓝条**
            this.mpBar.clear();
            this.mpBar.fillStyle(0x4d8fd4, 1);
            this.mpBar.fillRect(this.uiX, this.uiY + 30, currentMpWidth, this.barHeight);

            // **更新蓝量数值**
            this.mpText.setText(`${this.mp} / ${this.maxMp}`);
        }
    }

    takeDamage(amount) {


        let damageLeft = amount;

        // ✅ 明确初始化 tempHp
        if (typeof this.tempHp === 'undefined') {
            this.tempHp = this.hp;
        }

        // **剩余伤害扣血**
        let oldHp = this.hp;
        if (damageLeft > 0) {
            // let oldHp = this.hp;
            this.hp = this.hp - damageLeft;
        }

        // // **创建 tempHp（用于动画）**
        // if (!this.tempHp) {
        this.tempHp = oldHp; // 初始化临时血量
        // }

        // **更新血条**
        this.updateUI();




        if (this.hp <= 0) {
            this.gameover = true;
            this.gameOver();
        }
    }

    gameOver() {
        // this.scene.add.rectangle(400, 300, 300, 200, 0x000000, 0.8); // 半透明黑色背景
        // this.scene.add.text(400, 250, '游戏结束', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

        // let restartButton = this.scene.add.text(400, 320, '再来一次', {
        //     fontSize: '24px',
        //     fill: '#0f0',
        //     backgroundColor: '#333',
        //     padding: { left: 10, right: 10, top: 5, bottom: 5 }
        // }).setOrigin(0.5).setInteractive();

        // restartButton.on('pointerdown', () => {
        //     this.scene.scene.restart(); // **重新启动当前场景**
        // });

        // /** 🎁 显示战斗奖励 */
        // let rewardChoices = [
        //     { name: "攻击+2", effect: () => { this.scene.player.attack += 2; }},
        //     { name: "最大生命+10", effect: () => { this.scene.player.maxHp += 10; this.scene.player.hp += 10; }},
        //     { name: "吸血+5%", effect: () => { this.scene.player.lifesteal += 0.05; }}
        // ];

        // let rewardText = this.scene.add.text(400, 200, "选择奖励", { fontSize: "24px", fill: "#fff" }).setOrigin(0.5);

        // rewardChoices.forEach((reward, index) => {
        //     let button = this.scene.add.text(400, 250 + index * 50, reward.name, { fontSize: "20px", fill: "#0f0" })
        //         .setOrigin(0.5)
        //         .setInteractive()
        //         .on('pointerdown', () => {
        //             reward.effect();
        //             this.scene.scene.start('LevelSelectScene'); // 返回关卡选择界面
        //         });
        // });


    }


    // **恢复血量**
    heal(amount) {
        // **剩余伤害扣血**
        let oldHp = this.hp;
        // **创建 tempHp（用于动画）**
        if (!this.tempHp) {
            this.tempHp = oldHp; // 初始化临时血量
        }
        this.hp = Math.min(this.hp + amount, this.maxHp);
        this.updateUI();
    }

    // **消耗蓝量**
    useMana(amount) {
        this.mp = Math.max(this.mp - amount, 0);
        this.updateUI();
    }

    // **增加攻击力**
    increaseAttack(amount) {
        this.attack += amount;
    }

    // **增加护盾**
    gainShield(amount) {
        this.shield = Math.min(this.shield + amount, this.maxShield);
        this.updateUI();
    }
}

