import { BattleLog } from '../battle/BattleLog.js';
import { BattleStats } from '../battle/BattleLog.js';

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
        this.type = type;
        this.baseDescription = description;  // 保留基本描述
        this.description = this.formatDescription();  // 初始时设置描述
        this.manaCost = 0;
        this.level = 1;
        this.canUse = true;
    }

    // 格式化技能描述，用于将数值动态添加到描述中
    formatDescription() {
        return this.baseDescription.replace(/{level}/g, this.level)
                                   .replace(/{manaCost}/g, this.manaCost)
                                   .replace(/{amount1}/g, this.amount1 || 0)
                                   .replace(/{amount2}/g, this.amount2 || 0);
    }

    checkCanUse(caster) {
        if (caster.mp >= this.manaCost) {
            this.canUse = true;
        } else {
            this.canUse = false;
        }
    }

    upgrade() {
        this.level++;
        this.updateValues(); // 更新所有数值
        this.description = this.formatDescription();  // 升级时更新描述
        console.log(`🔼 ${this.name} 升级至 Lv.${this.level}`);
    }

    activate(caster) {
        // 覆盖实现
    }

    updateValues() {

    }
}

// 每回合自动回复技能
export class HealSkill extends Skill {
    constructor() {
        super("治疗术","onTurnStart",`战斗中每回合消耗{manaCost}法力回复{amount1}生命`);
        // this.name = "法力恢复";
        // this.type = "onTurnStart"; // 触发时机：每回合开始
        this.manaCost = 3+this.level;
        this.amount1 = 20+5*this.level;
        this.healAmount = 20+5*this.level;
        this.description = this.formatDescription();
    }

    updateValues() {
        this.manaCost = 3+this.level;
        this.amount1 = 20+5*this.level;
        this.healAmount = 20+5*this.level;
    }

    /** 技能生效 */
    activate(caster) {
        this.checkCanUse(caster);
        if (this.canUse && caster.hp < caster.maxHp) {
            caster.mp -= this.manaCost;
            caster.hp = Math.min(caster.hp + this.healAmount, caster.maxHp);
            console.log(`✨ ${caster.name} 消耗 ${this.manaCost}点蓝，回复 ${this.healAmount} 点血!`);
            BattleLog.write(`   ✨ ${caster.name} 使用治疗术，消耗 ${this.manaCost}点蓝，回复 ${this.healAmount} 点血!`);
            BattleStats.addSkillUsage(caster, this.name, {  
                "回复血量": this.healAmount,
                "耗蓝": this.manaCost
            });
            BattleStats.addHealingDone(caster,this.healAmount);
        } else {
            if(caster.mp < this.manaCost && caster.hp < caster.maxHp) {
                // console.log(`❌ ${caster.name} 蓝量不足，无法使用【${this.name}】!`);
                // BattleLog.write(`❌ ${caster.name} 蓝量不足，无法使用【${this.name}】!`);
            }
        }
    }
}


// 回春技能
export class BattleHealSkill extends Skill {
    constructor() {
        super("包扎", "onBattleEnd",`战斗后回复{amount1}%最大生命`);
        this.amount1 = 0.075 * this.level*100;
        this.description = this.formatDescription();
    }

    updateValues() {
        this.amount1 = 0.075 * this.level*100;
    }

    canUse() {
        if (caster.mp >= this.manaCost){return true;}
        else {return false;}
    }

    activate(caster) {
        const heal = Math.floor(caster.maxHp * 0.075 * this.level);
        caster.hp = Math.min(caster.maxHp, caster.hp + heal);
        console.log(`\u2764\ufe0f ${this.name}回复 ${heal} HP`);
        BattleLog.write(`   \u2764\ufe0f ${this.name}回复 ${heal} HP`);
        BattleStats.addSkillUsage(caster, this.name, {
            "回复血量": heal,
        });
        BattleStats.addHealingDone(caster,heal);
    }
}

// 法力恢复技能
export class ManaRegenSkill extends Skill {
    constructor() {
        super("冥想", "onBattleEnd", `战斗后回复{amount1}%最大法力`);
        this.amount1 = 0.075 * this.level*100;
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = 0.075 * this.level*100;
    }

    activate(caster) {
        const regen = Math.floor(caster.maxMp * 0.075 * this.level);
        caster.mp = Math.min(caster.maxMp, caster.mp + regen);
        console.log(`\ud83d\udd04 ${this.name}回复 ${regen} MP`);
        BattleLog.write(`   \ud83d\udd04 ${this.name}回复 ${regen} MP`);
        BattleStats.addSkillUsage(caster, this.name, {
            "回复蓝量": regen
        });
    }
}

// 战地医疗（升级版回春）
export class BattlefieldHealSkill extends Skill {
    constructor() {
        super("战地医疗", "onTurnStart", `每回合回复{amount1}%最大生命值`);
        this.amount1 = 0.01 * this.level*100;
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = 0.01 * this.level*100;
    }

    activate(caster) {
        const heal = Math.floor(caster.maxHp * 0.01 * this.level);
        caster.hp = Math.min(caster.maxHp, caster.hp + heal);
        console.log(`\u2764\ufe0f ${this.name}回复 ${heal} HP`);
        BattleLog.write(`   \u2764\ufe0f ${this.name}回复 ${heal} HP`);
        BattleStats.addSkillUsage(caster, this.name, {
            "回复血量": heal
        });
        BattleStats.addHealingDone(caster,heal);
    }
}

// 法力潮汐（升级版回蓝）
export class ManaTideSkill extends Skill {
    constructor() {
        super("法力潮汐", "onTurnStart", `每回合回复{amount1}%最大法力值`);
        this.amount1 = 0.01 * this.level*100;
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = 0.01 * this.level*100;
    }

    activate(caster) {
        const regen = Math.floor((caster.maxMp+caster.tempMaxMp) * 0.01 * this.level);
        caster.mp = Math.min((caster.maxMp+caster.tempMaxMp), caster.mp + regen);
        console.log(`\ud83d\udd04 法力潮汐恢复 ${regen} MP`);
        BattleLog.write(`   \ud83d\udd04 法力潮汐恢复 ${regen} MP`);
        BattleStats.addSkillUsage(caster, this.name, {
            "回复蓝量": regen
        });
    }
}

// 血性狂乱：血量越低，攻击越高
export class BerserkerRageSkill extends Skill {
    constructor() {
        super("血性狂乱", "onTurnStart", `生命越低伤害越高，上限{amount1}%`);
        this.amount1 = (1+0.1*this.level)*100;
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = (1+0.1*this.level)*100;
    }

    activate(caster) {
        this.boost = Math.max((2 - Math.max(caster.hp,0) / Math.max(caster.maxHp+caster.tempMaxHp,0)),1) - 1;
        caster.damageBoost += this.boost*(1+0.1*this.level);
        console.log(`\ud83d\udd04 血性狂乱伤害增幅 ${this.boost*this.level*100} %`);
        const stats = BattleStats.getStats(caster);
        if(stats.skillUsage["血性狂乱"]) {
            BattleStats.addSkillUsage(caster, this.name, {
                "平均伤害增幅": stats.skillUsage["血性狂乱"].effects["平均伤害增幅"]? (stats.skillUsage["血性狂乱"].effects["平均伤害增幅"]*stats.skillUsage["血性狂乱"].count + this.boost)/(stats.skillUsage["血性狂乱"].count+1)-stats.skillUsage["血性狂乱"].effects["平均伤害增幅"] : this.boost*(1+0.1*this.level)
            });
        }else {
            BattleStats.addSkillUsage(caster, this.name, {
                "平均伤害增幅": this.boost*(1+0.1*this.level)
            });
        }
        BattleLog.write(`   \ud83d\udd04 血性狂乱伤害增幅 ${this.boost*(1+0.1*this.level)} %`);

    }

}

// 越战越勇
export class MomentumSkill extends Skill {
    constructor() {
        super("越战越勇", "onTurnStart", `每回合+{amount1}攻击力`);
        this.amount1 = this.level*3;
        this.bonusAttack = 0;
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = this.level*3;
    }

    activate(caster) {
        this.bonusAttack += this.level*3;
        caster.tempAttack += this.level*3*(caster.attackCount+1);
        console.log(`\u2694\ufe0f 越战越勇：攻击力+${this.level*3}, 当前+${this.level*3*(caster.attackCount+1)}`);
        BattleLog.write(`   \u2694\ufe0f 越战越勇：攻击力+${this.level*3}, 当前+${this.level*3*(caster.attackCount+1)}`);
        BattleStats.addSkillUsage(caster, this.name, {
            "攻击力加成": this.level*3
        });
    }

    reset() {
        this.bonusAttack = 0;
    }
}

// 抢攻：首次攻击必定暴击
export class FirstStrikeSkill extends Skill {
    constructor() {
        super("抢攻", "onTurnStart", `若回合开始时攻击次数小于{level}次，此回合内攻击必定暴击`);
        this.description = this.formatDescription();
    }

    activate(caster) {
        if(caster.attackCount < this.level) {
            console.log(`\u2728 抢攻发动，${caster.name}本回合内攻击必定造成暴击！`);
            BattleLog.write(`   \u2728 抢攻发动，${caster.name}本回合内攻击必定造成暴击！`);
            caster.tempCritChance = 100;
            BattleStats.addSkillUsage(caster, this.name, {
                "暴击增益回合数": 1
            });
        }
    }
}

//过度生长，血之滋味，杀人书

// 斩杀：低血敌人直接击杀
export class ExecuteSkill extends Skill {
    constructor() {
        super("斩杀", "onAttack", `敌人血量较低时有概率直接击杀，斩杀下限{amount1}%，上限{amount2}%`);
        this.amount1 = 1+this.level;
        this.amount2 = 8+2*this.level;
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = 1+this.level;
        this.amount2 = 8+2*this.level;
    }

    activate(caster, target) {
        if (target.hp / target.maxHp <= 0.01*Phaser.Math.Between(1+this.level,8+2*this.level)) {
            console.log(`\u2620\ufe0f ${caster.name} 触发斩杀！`);
            BattleLog.write(`   \u2620\ufe0f ${caster.name} 触发斩杀！`);
            BattleStats.addSkillUsage(caster, this.name, {
                "触发斩杀，造成伤害": target.hp,
            });
            BattleStats.addDamageDealt(caster,target.hp);
            BattleStats.addDamageTaken(target,target.hp);
            target.hp = 0;
        }
    }
}



export class ArcaneBarrierSkill extends Skill {
    constructor() {
        super("奥术壁垒", "onBattleStart", `战斗开始时消耗10%最大法力值，获得消耗量*{amount1}的临时护盾`);
        this.amount1 = 10 + (this.level - 1) * 2;
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = 10 + (this.level - 1) * 2;
    }

    activate(caster) {
        this.manaCost = Math.floor(caster.maxMp * 0.1);
        this.checkCanUse(caster);
        if (this.canUse) {
            caster.mp -= this.manaCost;
            caster.shield += this.manaCost * (10 + (this.level - 1) * 2);
            console.log(`🛡️ ${caster.name} 激活奥术壁垒，消耗 ${this.manaCost} 法力，获得 ${this.manaCost * (10 + (this.level - 1) * 2)} 护盾`);
            BattleLog.write(`   🛡️ ${caster.name} 激活奥术壁垒，消耗 ${this.manaCost} 法力，获得 ${this.manaCost * (10 + (this.level - 1) * 2)} 护盾`);
            BattleStats.addSkillUsage(caster, this.name, {
                "获得护盾": this.manaCost * (10 + (this.level - 1) * 2),
                "耗蓝": this.manaCost
            });
        }
    }
}

export class SpeedSkill extends Skill {
    constructor() {
        super("疾驰", "onBattleStart", `战斗开始时，获得{amount1}点临时速度，持续到第一回合结束`);
        this.amount1 = 100 + 50*(this.level - 1);
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = 100 + 50*(this.level - 1);
    }

    activate(caster) {
            caster.tempSpeed += 100 + 50*(this.level - 1);
            console.log(`✈️ ${caster.name} 激活疾驰，获得 ${100 + 50*(this.level - 1)} 速度`);
            BattleLog.write(`   ✈️ ${caster.name} 激活疾驰，获得 ${100 + 50*(this.level - 1)} 速度`);
            BattleStats.addSkillUsage(caster, this.name, {
                "获得速度": 100 + 50*(this.level - 1)
            });
    }
}

export class AssassinSkill extends Skill {
    constructor() {
        super("舍身一击", "onBattleStart", `战斗开始时，将所有生命转化为{level}倍护盾，本回合攻击拥有全额吸血`);
        this.description = this.formatDescription();
    }

    activate(caster) {
            caster.lifesteal += 100;
            console.log(`✈️ ${caster.name} 激活舍身一击，获得 ${caster.hp*this.level} 护盾，本回合攻击拥有吸血`);
            BattleLog.write(`   ✈️ ${caster.name} 激活舍身一击，获得 ${caster.hp*this.level} 护盾，本回合攻击拥有吸血`);
            BattleStats.addSkillUsage(caster, this.name, {
                "获得护盾": caster.hp*this.level,
                "获得吸血": 100*this.level
            });

            caster.shield += caster.hp*this.level;
            caster.hp = 1;
    }
}


export class ArcaneBarrierEchoSkill extends Skill {
    constructor() {
        super("次生护盾", "onSpellCast", `消耗最大法力值时，获得消耗量*{level}的临时护盾`);
        this.description = this.formatDescription();
    }

    activate(caster,manaCost) {
            caster.shield += manaCost * (1 + (this.level - 1) * 1);
            console.log(`🛡️ ${caster.name} 激活次生护盾，获得 ${manaCost * (1 + (this.level - 1) * 1)} 护盾`);
            BattleLog.write(`   🛡️ ${caster.name} 激活次生护盾，获得 ${manaCost * (1 + (this.level - 1) * 1)} 护盾`);
            BattleStats.addSkillUsage(caster, this.name, {
                "获得护盾":  manaCost * (1 + (this.level - 1) * 1),
            });
    }
}

export class MagicMissileSkill extends Skill {
    constructor() {
        super("魔法飞弹", "onTurnStart", `每回合消耗10%最大法力造成消耗量*{amount1}倍伤害`);
        this.amount1 = (2 + (this.level - 1) * 1);
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = (2 + (this.level - 1) * 1);
    }

    activate(caster, target) {
        this.manaCost = Math.floor((caster.maxMp+caster.tempMaxMp) * 0.1);
        this.checkCanUse(caster);
        if (this.canUse) {
            caster.mp -= this.manaCost;
            const damage = this.manaCost * (2 + (this.level - 1) * 1);
            target.hp -= damage;
            console.log(`🎯 魔法飞弹命中，消耗 ${this.manaCost}法力，造成 ${damage} 伤害`);
            BattleLog.write(`   🎯 魔法飞弹命中，消耗 ${this.manaCost}法力，造成 ${damage} 伤害`);
            BattleStats.addSkillUsage(caster, this.name, {
                "造成伤害": damage,
                "耗蓝": this.manaCost
            });
            BattleStats.addDamageDealt(caster,damage);
            BattleStats.addDamageTaken(target,damage);
        }
    }
}

export class ArcaneWisdomSkill extends Skill {
    constructor() {
        super("奥术智慧", "onSpellCast", `使用法力后回复{amount1}点法力值`);
        this.amount1 = 5 + (this.level - 1) * 2;
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = 5 + (this.level - 1) * 2;
    }

    activate(caster) {
        const restore = 5 + (this.level - 1) * 2;
        caster.mp = Math.min(caster.maxMp+caster.tempMaxMp, caster.mp + restore);
        console.log(`🔄 激活奥术智慧， ${caster.name} 恢复 ${restore} 点法力值`);
        BattleLog.write(`   🔄 激活奥术智慧， ${caster.name} 恢复 ${restore} 点法力值`);
        BattleStats.addSkillUsage(caster, this.name, {
                "法力值恢复": restore,
        });

    }
}

export class ManaBurnSkill extends Skill {
    constructor() {
        super("法力燃烧", "onTurnStart", `每回合消耗与攻击力相等的法力值，获得{amount1}倍的临时攻击力`);
        this.amount1 = 1+(0.1*this.level+1);
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = 1+(0.1*this.level+1);
    }

    activate(caster) {
        this.manaCost = Math.floor(caster.attack);
        this.checkCanUse(caster);
        if (this.canUse) {
            caster.mp -= this.manaCost;
            let addattack = Math.floor(caster.attack * (0.1*this.level+1));
            caster.tempAttack += addattack;
            console.log(`🔥 ${caster.name} 激活法力燃烧，消耗 ${this.manaCost} 法力，攻击力翻倍至 ${caster.attack+caster.tempAttack}`);
            BattleLog.write(`   🔥 ${caster.name} 激活法力燃烧，消耗 ${this.manaCost} 法力，攻击力翻倍至 ${caster.attack+caster.tempAttack}`);
            BattleStats.addSkillUsage(caster, this.name, {
            "攻击力增益": addattack,
            "耗蓝": this.manaCost
        });
        }
    }
}

export class ArcaneEchoSkill extends Skill {
    constructor() {
        super("灵能回响", "onSpellCast", `施放法术后攻击力+{amount1} ，可叠加`);
        this.amount1 = 1 + this.level;
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = 1 + this.level;
    }

    activate(caster) {
        const gain = 1 + this.level;
        caster.tempAttack = (caster.tempAttack || 0) + gain;
        console.log(`🔊 灵能回响：攻击力增加 ${gain}`);
        BattleLog.write(`   🔊 灵能回响触发：攻击力 +${gain}`);
        BattleStats.addSkillUsage(caster, this.name, {
                "攻击力增加": gain,
        });
    }
}

export class ArcaneReversalSkill extends Skill {
    constructor() {
        super("奥术反制", "onDamageTaken", `受到伤害前消耗等同于伤害量{amount1}%的法力以减少{amount2}%伤害`);
        this.amount1 = 50;
        this.amount2 = 50+this.level;
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = 50/this.level;
        this.amount2 = 50+this.level;
    }

    activate(caster, damage) {
        this.manaCost = Math.floor(damage * 0.5);
        this.checkCanUse(caster);
        if (this.canUse) {
            caster.mp -= this.manaCost;
            const reduced = Math.floor(damage * 0.5 + 0.01*this.level);
            console.log(`🛡️ 奥术反制触发，消耗 ${this.manaCost} 法力，伤害从 ${damage} 降至 ${reduced}`);
            BattleLog.write(`   🛡️ 奥术反制触发，消耗 ${this.manaCost} 法力，伤害从 ${damage} 降至 ${reduced}`);
            BattleStats.addSkillUsage(caster, this.name, {
            "伤害减免": damage - reduced,
            "耗蓝": this.manaCost
        });
            return reduced;
        }
        return damage;
    }
}

export class BarrierSkill extends Skill {
    constructor() {
        super("自适应护甲", "onDamageTaken", `受到伤害时，获得持续到战斗结束的{amount1}倍临时护甲`);
        this.amount1 = 0.1*this.level;
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = 0.1*this.level;
    }

    activate(caster, damage) {
        caster.tempArmor += this.level + Math.floor(damage*0.1*this.level);
        console.log(`🛡️ 自适应护甲触发，获得${this.level + Math.floor(damage*0.1*this.level)}临时护甲`);
        BattleLog.write(`   🛡️ 自适应护甲触发，获得${this.level + Math.floor(damage*0.1*this.level)}临时护甲`);
        BattleStats.addSkillUsage(caster, this.name, {
            "获得护甲": Math.floor(this.level + damage*0.1*this.level),
        });
        return damage;
    }
}

export class IceArmorSkill extends Skill {
    constructor() {
        super("冰甲术", "onFatalDamage", `濒死时消耗所有法力转换成护盾并免死，转化率{amount1}%`);
        this.amount1 = (5 + (this.level - 1))*100;
        this.used = false;
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = (5 + (this.level - 1))*100;
    }


    activate(caster) {
        if (!this.used && caster.mp > 0) {
            this.used = true;
            const shield = caster.mp * (5 + (this.level - 1));
            
            console.log(`🧊 冰甲术触发！免死并获得 ${shield} 护盾`);
            BattleLog.write(`   🧊 冰甲术触发！免死并获得 ${shield} 护盾`);
            BattleStats.addSkillUsage(caster, this.name, {
                "获得护盾": shield,
                "耗蓝": caster.mp
            });
            caster.mp = 0;
            caster.hp = 1;
            caster.shield += shield;
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
//         this.manaCost = Math.floor(caster.maxMp * 0.1);
//         if (enemy.hp <= threshold && caster.mp >= this.manaCost) {
//             caster.mp -= this.manaCost;
//             caster.hp = Math.min(caster.maxHp, caster.hp + enemy.hp);
//             enemy.hp = 0;
//             console.log(`💀 ${caster.name} 使用邪能汲取斩杀敌人并回复 ${enemy.hp} 生命`);
//         }
//     }
// }

export class ArcaneSaturationSkill extends Skill {
    constructor() {
        super("法力流系带", "onSpellCast", `施法后临时最大法力值 +{amount1}`);
        this.amount1 = 5 + 2*this.level;
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = 5 + 2*this.level;
    }

    activate(caster) {
        const gain = 5 + 2*this.level;
        caster.tempMaxMp += gain;
        caster.mp += gain;
        console.log(`🌊 法力流系带触发：最大法力值 +${gain}`);
        BattleLog.write(`   🌊 法力流系带触发：最大法力值 +${gain}`);
        BattleStats.addSkillUsage(caster, this.name, {
                "临时最大法力值增加": gain,
        });
    }

}

export class ManaAddictionSkill extends Skill {
    constructor() {
        super("魔瘾渴求", "onNotEnoughMana", `缺蓝时消耗生命转为蓝和护盾，转化率{amount1}%`);
        this.amount1 = (5 + this.level)*100;
        this.description = this.formatDescription();
    }
    updateValues() {
        this.amount1 = (5 + this.level)*100;
    }

    activate(caster) {
        const hpCost = Math.floor(caster.maxHp * 0.1);
        if (caster.hp > hpCost) {
            caster.hp -= hpCost;
            const gain = hpCost * (5 + this.level);
            caster.mp = Math.min(caster.maxMp+caster.tempMaxMp, caster.mp + gain);
            caster.shield += hpCost;
            console.log(`🧪 魔瘾渴求触发：生命转化为 ${gain} 蓝和 ${hpCost} 护盾`);
            BattleLog.write(`   🧪 魔瘾渴求触发：生命转化为 ${gain} 蓝和 ${hpCost} 护盾`);
            BattleStats.addSkillUsage(caster, this.name, {
                    "消耗生命": hpCost,
                    "法力回复": gain,
                    "获得护盾": hpCost,
            });
        }
    }
}

// 更多技能可以继续这样扩展...
