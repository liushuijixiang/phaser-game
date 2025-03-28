import { SkillRegistry } from '../skills/SkillRegistry.js';

export class EventScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EventScene' });
    }

    create(data) {
        // 来源类型：来自战斗胜利 or 事件节点
        const from = data.from || 'event';

        this.gold = this.registry.get('gold') || 0;
        

        window.addEventListener('resize', () => this.resizeGame(), false);

        let options = [];

        const goldRewards = {
            victory_normal: 10,
            victory_elite: 35,
            victory_boss: 100,
            event: 0 // 事件通常不给金币，但你也可以改
        };

        const rewardtext = {
            victory_normal: "你获得了战斗奖励",
            victory_elite: "你获得了精英战奖励",
            victory_boss: "你获得了boss战奖励",
            event: "🌟 你触发了一个事件" 
        };

        const rewardPools = {
            victory_normal: [
                () => ({ text: "❤️ 最大生命 +10", effect: () => this.modifyPlayer('maxHp', 10) }),
                () => ({ text: "⚔️ 攻击 +3", effect: () => this.modifyPlayer('attack', 3) }),
                () => {
                    const [skill] = this.getRandomSkill(1, { rarity: 'common' });
                    return {
                        text: `⭐ 学会技能：${skill.name}`,
                        effect: () => {
                            this.addSkill(skill);
                            this.log(`获得技能：${skill.name}`);
                        }
                    };
                },
                () => ({ text: "💰 金币 +10", effect: () => this.addGold(10) }),
                () => ({ text: "💙 魔力 +5", effect: () => this.modifyPlayer('maxMp', 5) }),
            ],

            victory_elite: [
                () => {
                    const [skill] = this.getRandomSkill(1, { rarity: 'rare' });
                    return {
                        text: `💥 学会稀有技能：${skill.name}`,
                        effect: () => {
                            this.addSkill(skill);
                            this.log(`获得稀有技能：${skill.name}`);
                        }
                    };
                },
                () => ({ text: "🧱 护甲 +4", effect: () => this.modifyPlayer('armor', 4) }),
                () => ({ text: "💰 金币 +100", effect: () => this.addGold(100) }),
                () => ({ text: "💍 获得稀有饰品（占位）", effect: () => this.log("获得饰品：龙鳞指环") }),
                () => ({ text: "🔥 攻击 +5", effect: () => this.modifyPlayer('attack', 5) }),
            ],

            victory_boss: [
                () => ({ text: "🦴 学会传说技能：神灭一击", effect: () => this.log("获得技能：神灭一击！") }),
                () => ({ text: "💠 传说饰品：龙魂指环", effect: () => this.log("获得饰品：龙魂指环") }),
                () => ({ text: "🧬 全属性 +2", effect: () => this.boostAllStats(2) }),
                () => ({ text: "💰 金币 +200", effect: () => this.addGold(200) }),
            ],

            event: [
                () => ({ text: "❤️ 回复 30% 生命", effect: () => this.healPercent(0.3) }),
                () => ({ text: "⚔️ 遭遇伏击战！", effect: () => this.scene.start('GameScene', { enemyType: "ambush" }) }),
                () => ({ text: "💎 获得稀有饰品（占位）", effect: () => this.log("获得：冰魄项链") }),
            ],
        };

        

        if (from === 'shop') {
            this.createShop();
        } else {
            const pool = rewardPools[from];
            const shuffled = Phaser.Utils.Array.Shuffle(pool); // 随机顺序
            options = shuffled.slice(0, 3).map(fn => fn.call(this));
            this.optionstext = [];
            this.setGold(this.gold + (goldRewards[from] || 0));
            this.text = this.add.text(400*window.innerWidth/800, 80*window.innerHeight/600, (rewardtext[from]||""), { fontSize: '26px', fill: '#fff' }).setOrigin(0.5);
            // 渲染选项
            options.forEach((opt, idx) => {
                this.optionstext[idx] = this.add.text(400*window.innerWidth/800, 160*window.innerHeight/600 + idx * 60*window.innerHeight/600, opt.text, { fontSize: '20px', fill: '#0f0' })
                    .setOrigin(0.5)
                    .setInteractive()
                    .on('pointerdown', () => {
                        opt.effect();

                        // 若是正常事件奖励，返回 LevelSelectScene
                        if (opt.text.indexOf("遭遇") === -1) {
                            this.time.delayedCall(500, () => {
                                if (from === 'victory_boss'){this.scene.start('MenuScene');}
                                else{this.scene.start('LevelSelectScene');}
                            });
                        }
                    });
            });
        }
        this.drawGoldDisplay();
        
        this.optionstext = [];

        
    }

    shutdown() {
        // 离开场景时移除监听
        window.removeEventListener('resize', this._resizeHandler);
    }

    drawGoldDisplay() {
        if (this.goldText) this.goldText.destroy(); // 避免重复
        this.goldText = this.add.text(this.scale.width - 80*window.innerWidth/800, 20*window.innerHeight/600, `💰 ${this.gold}`, {
            fontSize: "20px",
            fill: "#ffd700"
        }).setOrigin(1, 0);
    }




    createShop() {
        this.text = this.add.text(400*window.innerWidth/800, 80*window.innerHeight/600, "🛒 商店：选择购买一个物品", { fontSize: '26px', fill: '#fff' }).setOrigin(0.5);
        // this.add.text(this.scale.width / 2, 140, "🛒 商店：选择购买一个物品", { fontSize: '22px', fill: '#fff' }).setOrigin(0.5);

        this.shopItems = [];
        // this.gold = this.registry.get('gold') || 0;

        // ✅ 左侧：恢复按钮
        this.healButton = this.add.text(100*window.innerWidth/800, this.scale.height / 2, '💖 恢复生命/蓝量\n💰 20金币', {
            fontSize: '18px',
            fill: '#0f0',
            backgroundColor: '#333',
            padding: 10
        }).setInteractive()
        .on('pointerdown', () => this.buyHeal());

        // ✅ 中间：3 个商品
        this.renderShopItems();

        // ✅ 右侧：刷新按钮
        this.refreshButton = this.add.text(this.scale.width - 200*window.innerWidth/800, this.scale.height / 2, '🔄 刷新商品\n💰 10金币', {
            fontSize: '18px',
            fill: '#0f0',
            backgroundColor: '#333',
            padding: 10
        }).setInteractive()
        .on('pointerdown', () => this.refreshShop());
        

        this.backButton = this.add.text(this.scale.width / 2, 450*window.innerHeight/600, "返回", { fontSize: "20px", fill: "#fff" })
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

        this.healButton.disableInteractive().setAlpha(0.5).setText(`已恢复生命/蓝量`);

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
        const refreshCost = this.refreshFree ? 0 : 10;

        if (this.gold < refreshCost) {
            this.showToast('金币不足，无法刷新 ❌');
            return;
        }

        this.setGold(this.gold - refreshCost);
        this.drawGoldDisplay();

        this.refreshFree = false; // 重置免费刷新状态
        this.refreshButton.setText('🔄 刷新商品\n💰 10金币');


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
        const [skill] = this.getRandomSkill(1);
        let ShopItemPool = [
            {
                name: '攻击 +10',
                type: 'stat',
                price: 35,
                weight: 10,
                effect: () => this.modifyPlayer('attack', 10)
            },
            {
                name: '生命 +50',
                type: 'stat',
                price: 30,
                weight: 10,
                effect: () => {
                    this.modifyPlayer('maxHp', 50);
                    this.modifyPlayer('hp', 50);
                }
            },
            {
                name: '防御 +5',
                type: 'stat',
                price: 25,
                weight: 10,
                effect: () => this.modifyPlayer('armor', 5)
            },
            {
                name: '蓝量 +20',
                type: 'stat',
                price: 30,
                weight: 10,
                effect: () => {
                    this.modifyPlayer('maxMp', 20);
                    this.modifyPlayer('mp', 20);
                }
            },
            {
                name: `⭐ 技能：${skill.name}`,
                type: 'skill',
                price: 40,
                weight: 6,
                effect: (scene) => {
                    
                    this.addSkill(skill);
                   
                }
            }
        ];

        // // 商品抽奖池
        // const weightedPool = [];
        // ShopItemPool.forEach(item => {
        //     for (let i = 0; i < item.weight; i++) {
        //         weightedPool.push(item);
        //     }
        // });

        // Phaser.Utils.Array.Shuffle(weightedPool);


        // const items = ['攻击+10', '生命+50', '获得技能：火球术', '防御+5'];
        // this.allItems = [
        //     { name: '攻击 +10', price: 35, effect: () => this.modifyPlayer('attack', 10) },
        //     { name: '生命 +50', price: 20, effect: () => {this.modifyPlayer('maxHp', 50);this.modifyPlayer('hp', 50);} },
        //     { name: '获得技能：火球术', price: 30, effect: () => this.addSkill('火球术') },
        //     { name: '防御 +5', price: 15, effect: () => this.modifyPlayer('armor', 5) },
        //     { name: '蓝量 +20', price: 30, effect: () => {this.modifyPlayer('maxMp', 20);this.modifyPlayer('mp', 20);} }
        // ];

        const selected = Phaser.Utils.Array.Shuffle(ShopItemPool).slice(0, 3);

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

                    btn.disableInteractive().setAlpha(0.5).setText(`${item.name}\n已售出`);
                
                    // ✅ 检查是否全卖完
                    if (this.shopItems.every(b => !b.input || !b.input.enabled)) {
                        this.refreshButton.setText('🔄 商品已售罄\n免费刷新');
                        this.refreshFree = true;
                    }
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

    addSkill(skillInstance) {
        const player = this.registry.get('playerData');
        if (!player.skills) player.skills = [];

        const existing = player.skills.find(s => s.name === skillInstance.name);
        if (existing) {
            existing.upgrade();
            this.showToast(`升级技能：${skillInstance.name}`);
        } else {
            player.skills.push(skillInstance);
            console.log(`✅ 获得新技能：${skillInstance.name}`);
            this.showToast(`学会技能：${skillInstance.name}`);
        }

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

    resizeGame() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // 重设 Phaser 场景尺寸
        this.scale.resize(width, height);

        // 更新标题位置
        if (this.text) {
            this.text.setPosition(width / 2, 80 * height / 600);
        }

        // 更新金币显示位置
        if (this.goldText) {
            this.goldText.setPosition(width - 80 * width / 800, 20 * height / 600);
        }

        // 更新选项文本位置
        if (this.optionstext && Array.isArray(this.optionstext)) {
            this.optionstext.forEach((t, i) => {
                t.setPosition(width / 2, 160 * height / 600 + i * 60 * height / 600);
            });
        }

        // 更新商店按钮位置（恢复/刷新/返回）
        if (this.shopItems && Array.isArray(this.shopItems)) {
            this.shopItems.forEach((item, i) => {
                item.setPosition(width / 2, 200 * height / 600 + i * 80 * height / 600);
            });
        }

        if (this.healButton) {
            this.healButton.setPosition(100 * width / 800, height / 2);
        }

        if (this.refreshButton) {
            this.refreshButton.setPosition(width - 200 * width / 800, height / 2);
        }

        if (this.backButton) {
            this.backButton.setPosition(width / 2, 450 * height / 600);
        }
    }

    getRandomSkill(count = 1) {
        const pool = [];

        SkillRegistry.forEach(entry => {
            for (let i = 0; i < entry.weight; i++) {
                pool.push(entry.class);
            }
        });

        Phaser.Utils.Array.Shuffle(pool);

        const unique = new Set();
        const result = [];

        for (let skill of pool) {
            if (!unique.has(skill.name)) {
                result.push(skill);
                unique.add(skill.name);
            }
            if (result.length >= count) break;
        }

        return result.map(SkillClass => new SkillClass());
    }

    // getRandomSkill(count = 1, minWeight = 1, maxWeight = 100) {
    //     const pool = [];

    //     SkillRegistry.forEach(entry => {
    //         if (entry.weight >= minWeight && entry.weight <= maxWeight) {
    //             for (let i = 0; i < entry.weight; i++) {
    //                 pool.push(entry.class);
    //             }
    //         }
    //     });

    //     Phaser.Utils.Array.Shuffle(pool);

    //     const unique = new Set();
    //     const result = [];

    //     for (let skill of pool) {
    //         if (!unique.has(skill.name)) {
    //             result.push(skill);
    //             unique.add(skill.name);
    //         }
    //         if (result.length >= count) break;
    //     }

    //     return result.map(SkillClass => new SkillClass());
    // }


}
