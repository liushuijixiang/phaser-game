// 技能系统：附加技能类实现
export class Buff {
    constructor({ name, duration = null, trigger = null, value = null, onApply = null, onRemove = null, onTrigger = null }) {
        this.name = name;
        this.duration = duration; // 回合数，如果为 null 表示需要触发条件来移除
        this.remainingTurns = duration;
        this.trigger = trigger; // 'onDamageTaken', 'onTurnStart' 等
        this.value = value;     // 效果值（如减伤 0.5）
        this.onApply = onApply; // 应用时执行
        this.onRemove = onRemove; // 被移除时执行
        this.onTrigger = onTrigger; // 触发时执行（如减伤）
        this.markedForRemoval = false; // 标记为移除
    }

    apply(target) {
        if (this.onApply) this.onApply(target, this);
    }

    remove(target) {
        if (this.onRemove) this.onRemove(target, this);
        this.markedForRemoval = true;
    }

    triggerEvent(event, target, source) {
        if (this.trigger === event && this.onTrigger) {
            this.onTrigger(target, this, source);
        }
    }

    tickTurn(target) {
        if (this.duration !== null) {
            this.remainingTurns--;
            if (this.remainingTurns <= 0) {
                this.remove(target);
            }
        }
    }
}


export class Skill {
    constructor(name, type, description) {
        this.name = name;
        this.type = type; // e.g., passive, active, onTurnStart, etc.
        this.description = description;
        this.manaCost = 0;
        this.level = 1;
    }

    upgrade() {
        this.level++;
        console.log(`🔼 ${this.name} 升级至 Lv.${this.level}`);
    }

    canUse() {
        return true;
    }

    activate(caster) {
        // 覆盖实现
    }
}

// 每回合自动回复技能
export class HealSkill extends Skill {
    constructor() {
        super("战斗回复","onTurnStart","战斗中每回合消耗法力回复生命");
        // this.name = "法力恢复";
        // this.type = "onTurnStart"; // 触发时机：每回合开始
        this.manaCost = 3;
        this.healAmount = 20;
    }

    canUse() {
        if (caster.mp >= this.manaCost){return true;}
        else {return false;}
    }

    /** 技能生效 */
    activate(caster) {
        if (caster.mp >= this.manaCost && caster.hp < caster.maxHp) {
            caster.mp -= this.manaCost;
            caster.hp = Math.min(caster.hp + this.healAmount, caster.maxHp);
            console.log(`✨ ${caster.name} 消耗 ${this.manaCost} 点蓝，回复 ${this.healAmount} 点血!`);
        } else {
            if(caster.mp < this.manaCost && caster.hp < caster.maxHp) {console.log(`❌ ${caster.name} 蓝量不足，无法使用【${this.name}】!`);}
        }
    }
}


// 回春技能
export class BattleHealSkill extends Skill {
    constructor() {
        super("回春", "onBattleEnd", "战斗后回复5%最大生命");
    }

    canUse() {
        if (caster.mp >= this.manaCost){return true;}
        else {return false;}
    }

    activate(caster) {
        const heal = Math.floor(caster.maxHp * 0.05 * this.level);
        caster.hp = Math.min(caster.maxHp, caster.hp + heal);
        console.log(`\u2764\ufe0f 回春回复 ${heal} HP`);
    }
}

// 法力恢复技能
export class ManaRegenSkill extends Skill {
    constructor() {
        super("回蓝", "onBattleEnd", "战斗后回复5%最大法力");
    }

    activate(caster) {
        const regen = Math.floor(caster.maxMp * 0.05 * this.level);
        caster.mp = Math.min(caster.maxMp, caster.mp + regen);
        console.log(`\ud83d\udd04 回蓝回复 ${regen} MP`);
    }
}

// 战地医疗（升级版回春）
export class BattlefieldHealSkill extends Skill {
    constructor() {
        super("战地医疗", "onTurnStart", "每回合回复5%最大生命值");
    }

    activate(caster) {
        const heal = Math.floor(caster.maxHp * 0.05 * this.level);
        caster.hp = Math.min(caster.maxHp, caster.hp + heal);
        console.log(`\u2764\ufe0f 战地医疗回复 ${heal} HP`);
    }
}

// 法力潮汐（升级版回蓝）
export class ManaTideSkill extends Skill {
    constructor() {
        super("法力潮汐", "onTurnStart", "每回合回复5%最大法力值");
    }

    activate(caster) {
        const regen = Math.floor(caster.maxMp * 0.05 * this.level);
        caster.mp = Math.min(caster.maxMp, caster.mp + regen);
        console.log(`\ud83d\udd04 法力潮汐恢复 ${regen} MP`);
    }
}

// 血性狂乱：血量越低，攻击越高
export class BerserkerRageSkill extends Skill {
    constructor() {
        super("血性狂乱", "onTurnStart", "生命越低伤害越高");
    }

    activate(caster) {
        this.boost = Math.max((2 - Math.max(caster.hp,0) / Math.max(caster.maxHp+caster.tempMaxHp,0)),1) - 1;
        caster.damageBoost += this.boost*this.level;
        console.log(`\ud83d\udd04 血性狂乱伤害增幅 ${this.boost*this.level*100} %`);
    }

}

// 越战越勇
export class MomentumSkill extends Skill {
    constructor() {
        super("越战越勇", "onTurnStart", "每回合+攻击力");
        this.bonusAttack = 0;
    }

    activate(caster) {
        this.bonusAttack += this.level*3;
        caster.tempAttack += this.level*3*caster.attackCount;
        console.log(`\u2694\ufe0f 越战越勇：攻击力+${this.level*3}, 当前+${this.level*3*caster.attackCount}`);
    }

    reset() {
        this.bonusAttack = 0;
    }
}

// // 抢攻：首次攻击必定暴击
// export class FirstStrikeSkill extends Skill {
//     constructor() {
//         super("抢攻", "onFirstAttack", "第一次攻击必定暴击");
//         this.used = false;
//     }

//     activate(caster, target, damage) {
//         if (!this.used) {
//             this.used = true;
//             console.log(`\u2728 抢攻：造成暴击！`);
//             return damage * 2;
//         }
//         return damage;
//     }

//     reset() {
//         this.used = false;
//     }
// }

// // 斩杀：低血敌人直接击杀
// export class ExecuteSkill extends Skill {
//     constructor() {
//         super("斩杀", "onAttack", "敌人低于10%血量时直接击杀");
//     }

//     activate(caster, target) {
//         if (target.hp / target.maxHp <= 0.1) {
//             console.log(`\u2620\ufe0f 斩杀触发！`);
//             target.hp = 0;
//         }
//     }
// }



export class ArcaneBarrierSkill extends Skill {
    constructor() {
        super("奥术壁垒", "onBattleStart", "战斗开始时消耗10%最大法力值，获得等量*10的临时护盾");
    }

    activate(caster) {
        const cost = Math.floor(caster.maxMp * 0.1);
        if (caster.mp >= cost) {
            caster.mp -= cost;
            caster.shield += cost * (10 + (this.level - 1) * 1);
            console.log(`🛡️ ${caster.name} 激活奥术壁垒，获得 ${cost * 10} 护盾`);
        }
    }
}

export class MagicMissileSkill extends Skill {
    constructor() {
        super("魔法飞弹", "onTurnStart", "每回合消耗10%最大法力造成2倍伤害");
    }

    activate(caster, target) {
        const cost = Math.floor(caster.maxMp * 0.1);
        if (caster.mp >= cost) {
            caster.mp -= cost;
            const damage = cost * (2 + (this.level - 1) * 1);
            target.hp -= damage;
            console.log(`🎯 魔法飞弹命中，造成 ${damage} 伤害`);
        }
    }
}

// export class ArcaneWisdomSkill extends Skill {
//     constructor() {
//         super("奥术智慧", "onManaUse", "使用法力值后回复5点法力值");
//     }

//     activate(caster) {
//         const restore = 5 + (this.level - 1) * 5;
//         caster.mp = Math.min(caster.maxMp, caster.mp + restore);
//         console.log(`🔄 ${caster.name} 恢复 ${restore} 点法力值`);
//     }
// }

export class ManaBurnSkill extends Skill {
    constructor() {
        super("法力燃烧", "onTurnStart", "每回合消耗与攻击力相等的法力值，攻击力翻倍");
    }

    activate(caster) {
        const cost = caster.attack;
        if (caster.mp >= cost) {
            caster.mp -= cost;
            let addattack = caster.attack * this.level;
            caster.tempAttack += addattack;
            console.log(`🔥 ${caster.name} 激活法力燃烧，攻击力翻倍至 ${caster.attack+caster.tempAttack}`);
        }
    }
}

// export class ArcaneEchoSkill extends Skill {
//     constructor() {
//         super("灵能回响", "onSpellCast", "施放法术后攻击力 +2，可叠加");
//     }

//     activate(caster) {
//         const gain = 2 * this.level;
//         caster.tempAttack = (caster.tempAttack || 0) + gain;
//         console.log(`🔊 灵能回响：攻击力增加 ${gain}`);
//     }
// }

export class ArcaneReversalSkill extends Skill {
    constructor() {
        super("奥术反制", "onDamageTaken", "受到伤害时消耗蓝量减少50%伤害");
    }

    activate(caster, damage) {
        const cost = Math.floor(damage/this.level * 0.5);
        if (caster.mp >= cost) {
            caster.mp -= cost;
            const reduced = Math.floor(damage * 0.5);
            console.log(`🛡️ 奥术反制触发，伤害从 ${damage} 降至 ${reduced}`);
            return reduced;
        }
        return damage;
    }
}

export class IceArmorSkill extends Skill {
    constructor() {
        super("冰甲术", "onFatalDamage", "濒死时消耗所有蓝转换成护盾并免死");
        this.used = false;
    }

    activate(caster) {
        if (!this.used && caster.mp > 0) {
            this.used = true;
            const shield = caster.mp * (10 + 10 * (this.level - 1));
            caster.mp = 0;
            caster.hp = 1;
            caster.shield += shield;
            console.log(`🧊 冰甲术触发！免死并获得 ${shield} 护盾`);
        }
    }

    /** 每场战斗开始时重置 */
    reset() {
        this.used = false;
    }
}

// export class DarkExtractionSkill extends Skill {
//     constructor() {
//         super("邪能汲取", "onEnemyLowHP", "敌人低于10%生命时消耗蓝将其斩杀并吸取生命");
//     }

//     activate(caster, enemy) {
//         const threshold = enemy.maxHp * 0.1;
//         const cost = Math.floor(caster.maxMp * 0.1);
//         if (enemy.hp <= threshold && caster.mp >= cost) {
//             caster.mp -= cost;
//             caster.hp = Math.min(caster.maxHp, caster.hp + enemy.hp);
//             enemy.hp = 0;
//             console.log(`💀 ${caster.name} 使用邪能汲取斩杀敌人并回复 ${enemy.hp} 生命`);
//         }
//     }
// }

// export class ArcaneSaturationSkill extends Skill {
//     constructor() {
//         super("法力流系带", "onSpellCast", "施法后最大法力值 +2");
//     }

//     activate(caster) {
//         const gain = 2 * this.level;
//         caster.maxMp += gain;
//         console.log(`🌊 法力流系带触发：最大蓝 +${gain}`);
//     }
// }

// export class ManaAddictionSkill extends Skill {
//     constructor() {
//         super("魔瘾渴求", "onNotEnoughMana", "缺蓝时消耗生命转为蓝和护盾");
//     }

//     activate(caster) {
//         const hpCost = Math.floor(caster.maxHp * 0.1);
//         if (caster.hp > hpCost) {
//             caster.hp -= hpCost;
//             const gain = hpCost * 10 * this.level;
//             caster.mp = Math.min(caster.maxMp, caster.mp + gain);
//             caster.shield += hpCost;
//             console.log(`🧪 魔瘾渴求触发：生命转化为 ${gain} 蓝和 ${hpCost} 护盾`);
//         }
//     }
// }

// 更多技能可以继续这样扩展...
