// import { SkillManager } from '../skills/SkillManager.js';

export class Player {
    constructor(scene, x, y, texture, playerData) {
        this.scene = scene;

        this.gameover = false;

        // 创建角色
        this.sprite = scene.physics.add.sprite(x, y, texture);
        // this.sprite.setBounce(0.2);
        // this.sprite.setCollideWorldBounds(true);


        // 角色属性
        this.name = "player";
        this.maxHp = playerData.maxHp;
        this.hp = playerData.hp;
        this.tempHp = this.hp;
        this.shield = playerData.shield; // 当前护盾值
        this.armor = playerData.armor;
        this.maxShield = this.maxHp*100;
        this.maxMp = playerData.maxMp;
        this.mp = playerData.mp;
        this.attack = playerData.attack;
        this.speed = playerData.speed;
        this.skills = playerData.skills ? playerData.skills : [];

        this.critChance = 0;
        this.critDamage = 0;

        //临时属性,战斗结束清除
        this.tempMaxHp = 0;
        this.tempMaxMp = 0;
        this.attackCount = 0;

        //临时属性,回合结束清除
        this.tempAttack = 0;
        this.tempArmor = 0;
        this.tempShield = 0;
        this.damageBoost = 1;
        this.defenseBoost = 1;
        this.buff = [];


        // this.skillManager = new SkillManager(this); // 管理技能

        // UI 位置 & 尺寸
        this.uiX = 20*window.innerWidth/800;
        this.uiY = 70*window.innerHeight/600;
        this.barWidth = 200*window.innerWidth/800;
        this.barHeight = 20*window.innerHeight/600;
        this.borderThickness = 2*window.innerHeight/600;

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
        this.mpBorder.strokeRect(this.uiX, this.uiY + 30*window.innerHeight/600, this.barWidth, this.barHeight);

        // **蓝条背景**
        this.mpBg = scene.add.graphics();
        this.mpBg.fillStyle(0x222222, 1);
        this.mpBg.fillRect(this.uiX, this.uiY + 30*window.innerHeight/600, this.barWidth, this.barHeight);

        // **蓝条（柔和蓝色）**
        this.mpBar = scene.add.graphics();
        this.mpBar.fillStyle(0x4d8fd4, 1);

        // **蓝量数值**
        this.mpText = scene.add.text(this.uiX + this.barWidth / 2, this.uiY + 32*window.innerHeight/600, '', {
            fontSize: '16px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        // **绘制 UI**
        // this.updateUI();
    }

    // **更新血条 & 蓝条**
    updateUI() {

        let currentHpWidth = (Math.max(this.hp,0) / Math.max(this.maxHp + this.tempMaxHp, this.hp + Math.max(this.shield,0))) * this.barWidth;

        if(this.gameover){}else{

            // **更新血条**
            this.hpBar.clear();
            this.hpBar.fillStyle(0xd44d4d, 1);
            this.hpBar.fillRect(this.uiX, this.uiY, currentHpWidth, this.barHeight);
            // **Tween 动画：让 tempHp 逐渐减少**
            this.scene.tweens.add({
                targets: this,
                tempHp: Math.max(this.hp,0), // 让 tempHp 缓慢减小
                duration: 300, // 0.8 秒
                ease: 'Linear',
                onUpdate: () => {
                    let lostWidth = ((this.tempHp - Math.max(this.hp,0)) / (this.maxHp+this.tempMaxHp)) * this.barWidth;
                    this.hpLostBar.clear();
                    if (lostWidth > 0) {
                        this.hpLostBar.fillStyle(0x7a3b3b, 1); // 暗红色
                        this.hpLostBar.fillRect(this.uiX + (Math.max(this.hp,0) / (this.maxHp+this.tempMaxHp)) * this.barWidth, this.uiY, lostWidth, this.barHeight);
                    }
                }
            });
            

            // **更新血量数值**
            if (this.hpText && !this.hpText.destroyed && this.hpText.scene) {
                if(this.hpText && this.tempMaxHp === 0){this.hpText.setText(`${this.hp} / ${this.maxHp}`);}
                else if(this.hpText){this.hpText.setText(`${this.hp} / ${this.maxHp}+${this.tempMaxHp}`);}
            }


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
                if(this.hpText && this.tempMaxHp === 0) {this.hpText.setText(`${this.hp}+${this.shield} / ${this.maxHp}`);}
                else if(this.hpText){this.hpText.setText(`${this.hp}+${this.shield} / ${this.maxHp}+${this.tempMaxHp}`);}
            }else
            {
                this.shieldBar.clear();
            }



            let mpPercent = Math.max(this.mp,0) / (this.maxMp + this.tempMaxMp);
            let currentMpWidth = Math.max(mpPercent * this.barWidth, 0);

            // **更新蓝条**
            this.mpBar.clear();
            this.mpBar.fillStyle(0x4d8fd4, 1);
            this.mpBar.fillRect(this.uiX, this.uiY + 30*window.innerHeight/600, currentMpWidth, this.barHeight);

            // **更新蓝量数值**
            if (this.mpText && !this.mpText.destroyed && this.mpText.scene) {
                if(this.mpText && this.tempMaxMp === 0){this.mpText.setText(`${this.mp} / ${this.maxMp}`);}
                else if(this.mpText){this.mpText.setText(`${this.mp} / ${this.maxMp}+${this.tempMaxMp}`);}
            }
        }
    }

    updateUIPosition() {
        // 重新计算 UI 尺寸
        this.uiX = 20 * window.innerWidth / 800;
        this.uiY = 70 * window.innerHeight / 600;
        this.barWidth = 200 * window.innerWidth / 800;
        this.barHeight = 20 * window.innerHeight / 600;
        this.borderThickness = 2 * window.innerHeight / 600;


        // 清空并重绘边框
        this.hpBorder.clear();
        this.hpBorder.lineStyle(this.borderThickness, 0xffffff, 1); // 白色边框
        this.hpBorder.strokeRect(this.uiX, this.uiY, this.barWidth, this.barHeight);
        this.mpBorder.clear();
        this.mpBorder.lineStyle(this.borderThickness, 0xffffff, 1); // 白色边框
        this.mpBorder.strokeRect(this.uiX, this.uiY + 30*window.innerHeight/600, this.barWidth, this.barHeight);

        // 重绘背景
        this.hpBg.clear();
        this.hpBg.fillStyle(0x222222, 1); // 深灰色背景
        this.hpBg.fillRect(this.uiX, this.uiY, this.barWidth, this.barHeight);
        this.mpBg.clear();
        this.mpBg.fillStyle(0x222222, 1);
        this.mpBg.fillRect(this.uiX, this.uiY + 30*window.innerHeight/600, this.barWidth, this.barHeight);

        // 更新血条和护盾条也要清除
        this.hpBar.clear();
        this.shieldBar.clear();
        this.hpBar.fillStyle(0xd44d4d, 1);
        this.shieldBar.fillStyle(0xC0C0C0, 1);
        this.hpLostBar.clear();
        this.hpLostBar.fillStyle(0x7a3b3b, 1); // 暗红色
        this.mpBar.clear();
        this.mpBar.fillStyle(0x4d8fd4, 1);

        // 重新设置文本位置
        if (this.hpText) {
            this.hpText.setPosition(this.uiX + this.barWidth / 2, this.uiY + 2);
        }

        if (this.mpText) {
            this.mpText.setPosition(this.uiX + this.barWidth / 2, this.uiY + 32*window.innerHeight/600);
        }

        // 可选：你也可以立即调用一次 updateUI() 来刷新数值显示
        this.updateUI();
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
        // this.updateUI();




        // if (this.hp <= 0) {
        //     this.gameover = true;
        //     this.gameOver();
        // }
    }

    gameOver() {

    }


    // **恢复血量**
    heal(amount) {
        // **剩余伤害扣血**
        // **创建 tempHp（用于动画）**
        // if (!this.tempHp) {
        //     this.tempHp = oldHp; // 初始化临时血量
        // }
        this.hp = Math.min(this.hp + amount, this.maxHp);
        
        // let oldHp = this.hp;

        // this.updateUI();
    }

    // **消耗蓝量**
    useMana(amount) {
        this.mp = Math.max(this.mp - amount, 0);
        // this.updateUI();
    }

    // **增加攻击力**
    increaseAttack(amount) {
        this.attack += amount;
    }

    // **增加护盾**
    gainShield(amount) {
        this.shield = Math.min(this.shield + amount, this.maxShield);
        // this.updateUI();
    }

    // 回合状态清除
    reset() {
        this.tempAttack = 0;
        this.tempArmor = 0;
        this.tempShield = 0;
        this.damageBoost = 1;
        this.defenseBoost = 1;
    }
}

