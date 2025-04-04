// src/skills/Item.js
export class Item {
    constructor(name, type, description, effect, icon, canReplace = true) {
        this.name = name;            // 饰品名称
        this.type = type;            // 饰品类型 (如 "一次性增益"、"持久增益")
        this.description = description;  // 饰品描述
        this.effect = effect;        // 饰品效果（增益效果）
        this.icon = icon;            // 饰品图标
        this.canReplace = canReplace; // 是否可以替换
    }

    // 使用饰品（一次性增益）
    useEffect(player) {
        if (this.type === "一次性增益") {
            this.effect(player);
        }
    }

    // 显示饰品的详细信息
    showDetails() {
        return `${this.name} - ${this.description}`;
    }
}

// src/classes/Item.js
export class BackpackItem extends Item {
    constructor() {
        super("背包", "特殊增益", "增加两个额外饰品栏", null, "icon_backpack.png");
    }

    // 激活背包功能
    activateBackpack(player) {
        player.extraItemSlots += 2;  // 增加两个饰品栏
        console.log(`${player.name} 获得了两个额外的饰品栏！`);
    }
}
