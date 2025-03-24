export class Skill {
    constructor(player, name, type, description) {
        this.player = player;
        this.name = name;
        this.type = type; // "passive", "active", "equipment"
        this.description = description;
    }

    activate() {
        console.log(`🔹 技能 ${this.name} 被激活!`);
    }
}


export class HealSkill {
    constructor() {
        this.name = "法力恢复";
        this.type = "onTurnStart"; // 触发时机：每回合开始
        this.manaCost = 3;
        this.healAmount = 20;
    }

    /** 技能生效 */
    activate(caster) {
        if (caster.mp >= this.manaCost && caster.hp < caster.maxHp) {
            caster.mp -= this.manaCost;
            caster.hp = Math.min(caster.hp + this.healAmount, caster.maxHp);
            console.log(`✨ ${caster.name} 消耗 ${this.manaCost} 点蓝，回复 ${this.healAmount} 点血!`);
        } else {
            console.log(`❌ ${caster.name} 蓝量不足，无法使用【${this.name}】!`);
        }
    }
}
