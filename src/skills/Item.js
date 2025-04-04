// src/items/Item.js

export class Item {
    constructor({ name, rarity, type, description, icon = "", onAcquire = null, onRemove = null }) {
        this.name = name;
        this.rarity = rarity;           // "普通", "稀有", "史诗", "传说", "神话"
        this.type = type;               // "被动", "战后增益", "特殊"
        this.description = description;
        this.icon = icon;
        this.onAcquire = onAcquire;     // 获得饰品时的效果（如 +1000 生命）
        this.onRemove = onRemove;       // 被移除时的效果
    }

    apply(player) {
        if (this.onAcquire) this.onAcquire(player);
    }

    remove(player) {
        if (this.onRemove) this.onRemove(player);
    }

    showDetails() {
        return `${this.name}（${this.rarity}）\n${this.description}`;
    }
}

// 工具方法：创建并导出所有饰品
export const ItemPool = [

    // 🎖 战后增益类饰品（勋章）
    new Item({
        name: "战士勋章",
        rarity: "稀有",
        type: "战后增益",
        description: "战斗胜利后，最大生命 +10",
        onAcquire: (player) => {
            player.itemEffects = player.itemEffects || {};
            player.itemEffects.victoryHpBonus = 10;
        },
        onRemove: (player) => {
            if (player.itemEffects) delete player.itemEffects.victoryHpBonus;
        }
    }),

    new Item({
        name: "魔法师勋章",
        rarity: "稀有",
        type: "战后增益",
        description: "战斗胜利后，最大法力 +5",
        onAcquire: (player) => {
            player.itemEffects = player.itemEffects || {};
            player.itemEffects.victoryMpBonus = 5;
        },
        onRemove: (player) => {
            if (player.itemEffects) delete player.itemEffects.victoryMpBonus;
        }
    }),

    new Item({
        name: "弓箭手勋章",
        rarity: "稀有",
        type: "战后增益",
        description: "战斗胜利后，攻击 +1",
        onAcquire: (player) => {
            player.itemEffects = player.itemEffects || {};
            player.itemEffects.victoryAtkBonus = 1;
        },
        onRemove: (player) => {
            if (player.itemEffects) delete player.itemEffects.victoryAtkBonus;
        }
    }),

    // 🧿 持有即生效类（护符）
    new Item({
        name: "生命护符",
        rarity: "史诗",
        type: "被动",
        description: "持有时，最大生命 +1000",
        onAcquire: (player) => { player.maxHp += 1000; player.hp += 1000; },
        onRemove: (player) => { player.maxHp -= 1000; player.hp -= Math.min(1000,player.hp-1); }
    }),

    new Item({
        name: "能量护符",
        rarity: "史诗",
        type: "被动",
        description: "持有时，最大法力 +500",
        onAcquire: (player) => { player.maxMp += 500; player.mp += 500 ;},
        onRemove: (player) => { player.maxMp -= 500; player.mp -= Math.min(500,player.mp-1); }
    }),

    new Item({
        name: "力量护符",
        rarity: "史诗",
        type: "被动",
        description: "持有时，攻击 +100",
        onAcquire: (player) => { player.attack += 100; },
        onRemove: (player) => { player.attack -= 100; }
    }),

    new Item({
        name: "暴击护符",
        rarity: "传说",
        type: "被动",
        description: "持有时，暴击率 +20%",
        onAcquire: (player) => { player.critChance += 20; },
        onRemove: (player) => { player.critChance -= 20; }
    }),

    new Item({
        name: "爆伤护符",
        rarity: "传说",
        type: "被动",
        description: "持有时，暴击伤害 +50%",
        onAcquire: (player) => { player.critDamage += 50; },
        onRemove: (player) => { player.critDamage -= 50; }
    }),

    new Item({
        name: "速度护符",
        rarity: "传说",
        type: "被动",
        description: "持有时，速度 +100",
        onAcquire: (player) => { player.speed += 100; },
        onRemove: (player) => { player.speed -= 100; }
    }),

    // 🎒 特殊类
    new Item({
        name: "背包",
        rarity: "传说",
        type: "特殊",
        description: "增加两个额外饰品栏",
        onAcquire: (player) => {
            player.extraItemSlots = (player.extraItemSlots || 0) + 2;
        },
        onRemove: (player) => {
            player.extraItemSlots = Math.max(0, (player.extraItemSlots || 0) - 2);
        }
    })

    // 更多特殊类、附魔类、战斗专属类可按需添加...
];
