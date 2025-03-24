export class EventScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EventScene' });
    }

    create(data) {
        // 来源类型：来自战斗胜利 or 事件节点
        const from = data.from || 'event';

        this.gold = this.registry.get('gold') || 0;
        // this.add.text(400, 80, "🌟 你触发了一个事件", { fontSize: '26px', fill: '#fff' }).setOrigin(0.5);

        

        let options = [];

        if (from === 'shop') {
            this.createShop();
        } else if (from === 'victory_normal') {
            this.add.text(400*window.innerWidth/800, 80*window.innerHeight/600, "🌟 选择你的战斗奖励", { fontSize: '26px', fill: '#fff' }).setOrigin(0.5);
            this.setGold(this.gold + 10);
            options = [
                { text: "❤️ 最大生命 +10", effect: () => this.modifyPlayer('maxHp', 10) },
                { text: "⚔️ 攻击 +3", effect: () => this.modifyPlayer('attack', 3) },
                { text: "💙 魔力 +5", effect: () => this.modifyPlayer('maxMp', 5) }
            ];
        }
        else if (from === 'victory_elite') {
            this.add.text(400*window.innerWidth/800, 80*window.innerHeight/600, "🌟 选择你的战斗奖励", { fontSize: '26px', fill: '#fff' }).setOrigin(0.5);
            this.setGold(this.gold + 35);
            options = [
                { text: "⭐ 获取新技能（占位）", effect: () => this.log("获得技能：烈焰斩！") },
                { text: "🧱 护甲 +4", effect: () => this.modifyPlayer('armor', 4) },
                { text: "💰 金币 +100", effect: () => this.addGold(100) }
            ];
        }
        else if (from === 'victory_boss') {
            this.add.text(400*window.innerWidth/800, 80*window.innerHeight/600, "🌟 选择你的战斗奖励", { fontSize: '26px', fill: '#fff' }).setOrigin(0.5);
            this.setGold(this.gold + 100);
            options = [
                { text: "🦴 传说技能（占位）", effect: () => this.log("获得传说技能：神灭一击！") },
                { text: "💠 稀有饰品（占位）", effect: () => this.log("获得饰品：龙鳞指环") },
                { text: "🧬 全属性 +2", effect: () => this.boostAllStats(2) }
            ];
        }
        else if (from === 'event') {
            this.add.text(400*window.innerWidth/800, 80*window.innerHeight/600, "🌟 你触发了一个事件", { fontSize: '26px', fill: '#fff' }).setOrigin(0.5);
            options = [
                { text: "❤️ 回复 30% 生命", effect: () => this.healPercent(0.3) },
                { text: "⚔️ 遭遇伏击战！", effect: () => this.scene.start('GameScene', { enemyType: "ambush" }) },
                { text: "💎 获得稀有饰品（占位）", effect: () => this.log("获得：冰魄项链") }
            ];
        }

        this.drawGoldDisplay();

        // 渲染选项
        options.forEach((opt, idx) => {
            this.add.text(400*window.innerWidth/800, 160*window.innerHeight/600 + idx * 60*window.innerHeight/600, opt.text, { fontSize: '20px', fill: '#0f0' })
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerdown', () => {
                    opt.effect();

                    // 若是正常事件奖励，返回 LevelSelectScene
                    if (opt.text.indexOf("遭遇") === -1) {
                        this.time.delayedCall(500, () => {
                            this.scene.start('LevelSelectScene');
                        });
                    }
                });
        });
    }

    drawGoldDisplay() {
        if (this.goldText) this.goldText.destroy(); // 避免重复
        this.goldText = this.add.text(this.scale.width - 80*window.innerWidth/800, 20*window.innerHeight/600, `💰 ${this.gold}`, {
            fontSize: "20px",
            fill: "#ffd700"
        }).setOrigin(1, 0);
    }


    createShop() {
        this.add.text(400*window.innerWidth/800, 80*window.innerHeight/600, "🛒 商店：选择购买一个物品", { fontSize: '26px', fill: '#fff' }).setOrigin(0.5);
        // this.add.text(this.scale.width / 2, 140, "🛒 商店：选择购买一个物品", { fontSize: '22px', fill: '#fff' }).setOrigin(0.5);

        this.shopItems = [];
        // this.gold = this.registry.get('gold') || 0;

        // ✅ 左侧：恢复按钮
        this.add.text(100*window.innerWidth/800, this.scale.height / 2, '💖 恢复生命/蓝量\n💰 20金币', {
            fontSize: '18px',
            fill: '#0f0',
            backgroundColor: '#333',
            padding: 10
        }).setInteractive()
        .on('pointerdown', () => this.buyHeal());

        // ✅ 中间：3 个商品
        this.renderShopItems();

        // ✅ 右侧：刷新按钮
        this.add.text(this.scale.width - 200*window.innerWidth/800, this.scale.height / 2, '🔄 刷新商品\n💰 10金币', {
            fontSize: '18px',
            fill: '#0f0',
            backgroundColor: '#333',
            padding: 10
        }).setInteractive()
        .on('pointerdown', () => this.refreshShop());
        

        this.add.text(this.scale.width / 2, 450*window.innerHeight/600, "返回", { fontSize: "20px", fill: "#fff" })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('LevelSelectScene');
            });
    }

    buyHeal() {
        const player = this.registry.get('playerData');
        // let gold = this.registry.get('gold') || 0;
        const cost = 20; // 你可以调整

        if (this.gold >= cost) {
            this.setGold(this.gold - cost);
            player.hp = player.maxHp;
            player.mp = player.maxMp;
            this.registry.set('playerData', player);

            this.showToast('生命与法力已回复 ✔');
        } else {
            this.showToast('金币不足 ❌');
        }
    }

    refreshShop() {
        // const gold = this.registry.get('gold') || 0;
        const refreshCost = 10; // 刷新价格

        if (this.gold < refreshCost) {
            this.showToast('金币不足，无法刷新 ❌');
            return;
        }

        this.setGold(this.gold - refreshCost);
        this.drawGoldDisplay();

        // 移除旧商品文本
        this.shopItems.forEach(itemText => itemText.destroy());
        this.shopItems = [];

        // 生成新的商品
        this.renderShopItems(); // 只更新商品

    }



    renderShopItems() {
        // 清除旧商品
        if (this.shopItems.length > 0) {
            this.shopItems.forEach(item => item.destroy());
            this.shopItems = [];
        }

        // const items = ['攻击+10', '生命+50', '获得技能：火球术', '防御+5'];
        this.allItems = [
            { name: '攻击 +10', price: 35, effect: () => this.modifyPlayer('attack', 10) },
            { name: '生命 +50', price: 20, effect: () => {this.modifyPlayer('maxHp', 50);this.modifyPlayer('hp', 50);} },
            { name: '获得技能：火球术', price: 30, effect: () => this.addSkill('火球术') },
            { name: '防御 +5', price: 15, effect: () => this.modifyPlayer('armor', 5) },
            { name: '蓝量 +20', price: 30, effect: () => {this.modifyPlayer('maxMp', 20);this.modifyPlayer('mp', 20);} }
        ];

        const selected = Phaser.Utils.Array.Shuffle(this.allItems).slice(0, 3);

        selected.forEach((item, i) => {
            const text = `${item.name}\n💰 ${item.price}金币`;
            const btn = this.add.text(this.scale.width / 2, 200*window.innerHeight/600 + i * 80*window.innerHeight/600, text, {
                fontSize: '18px',
                fill: '#fff',
                backgroundColor: '#555',
                padding: 10
            }).setOrigin(0.5).setInteractive();

            btn.on('pointerdown', () => {
                if (this.gold >= item.price) {
                    this.setGold(this.gold - item.price);
                    item.effect();
                    this.showToast(`购买成功: ${item.name}`);
                } else {
                    this.showToast('💸 金币不足');
                }
                this.drawGoldDisplay();
            });

            this.shopItems.push(btn);
        });
    }




    showToast(text) {
        const msg = this.add.text(this.scale.width / 2, this.scale.height - 100*window.innerHeight/600, text, {
            fontSize: "20px",
            fill: "#fff",
            backgroundColor: "#000"
        }).setOrigin(0.5);

        this.time.delayedCall(1000, () => msg.destroy());
    }


    /** 🛠️ 增加玩家属性 */
    modifyPlayer(stat, amount) {
        let data = this.registry.get('playerData');
        if (data && stat in data) {
            data[stat] += amount;
            // 若是加最大HP，也补满当前血
            if (stat === 'maxHp') data.hp = Math.min(data.hp + amount, data.maxHp);
            this.registry.set('playerData', data);
        }
    }

    /** 💰 增加金币 */
    addGold(amount) {
        let gold = this.registry.get('gold') || 0;
        this.registry.set('gold', gold + amount);
    }

    /** ❤️ 回复一定比例生命 */
    healPercent(percent) {
        let data = this.registry.get('playerData');
        if (data) {
            const heal = Math.floor(data.maxHp * percent);
            data.hp = Math.min(data.hp + heal, data.maxHp);
            this.registry.set('playerData', data);
        }
    }

    /** 💪 所有属性提升 */
    boostAllStats(amount) {
        const stats = ['maxHp', 'attack', 'maxMp', 'armor'];
        let data = this.registry.get('playerData');
        if (data) {
            stats.forEach(stat => {
                if (stat in data) data[stat] += amount;
            });
            this.registry.set('playerData', data);
        }
    }

    addSkill(skillName) {
        let player = this.registry.get('playerData');
        if (!player.skills) player.skills = [];
        player.skills.push(skillName);
        this.registry.set('playerData', player);
    }

    /** 📜 显示文字提示 */
    log(text) {
        this.add.text(400*window.innerWidth/800, 400*window.innerHeight/600, text, { fontSize: '18px', fill: '#ff0' }).setOrigin(0.5);
    }

    setGold(value) {
        this.gold = value;
        this.registry.set('gold', value);
        this.drawGoldDisplay();
        // this.goldText.setText(`💰 ${value}`);
    }

}
