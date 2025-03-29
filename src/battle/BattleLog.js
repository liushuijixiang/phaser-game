// LogSystem.js
export class BattleLog {
    static logs = [];

    static write(message) {
        this.logs.push(message);
    }

    static getLogs() {
        return this.logs.join('\n');;
    }

    static clear() {
        this.logs = [];
    }
}

export class BattleStats {
    static _stats = new Map(); // 存每个角色的统计数据（按名字）

    // 初始化角色统计
    static init(player) {
        if (!BattleStats._stats.has(player.name)) {
            BattleStats._stats.set(player.name, {
                damageDealt: 0,
                damageTaken: 0,
                healingDone: 0,
                shieldAbsorbed: 0,
                armorBlocked: 0,
                normalAttack: 0,
                skillUsage: {} // skillName: { count, manaUsed, healing, damage }
            });
        }
    }

    static addDamageDealt(player, amount) {
        BattleStats.init(player);
        BattleStats._stats.get(player.name).damageDealt += amount;
    }

    static addDamageTaken(player, amount) {
        BattleStats.init(player);
        BattleStats._stats.get(player.name).damageTaken += amount;
    }

    static addHealingDone(player, amount) {
        BattleStats.init(player);
        BattleStats._stats.get(player.name).healingDone += amount;
    }

    static addShieldAbsorbed(player, amount) {
        BattleStats.init(player);
        BattleStats._stats.get(player.name).shieldAbsorbed += amount;
    }

    static addArmorBlocked(player, amount) {
        BattleStats.init(player);
        BattleStats._stats.get(player.name).armorBlocked += amount;
    }

    static addNormalAttack(player) {
        BattleStats.init(player);
        BattleStats._stats.get(player.name).normalAttack += 1;
    }

    static addSkillUsage(player, skillName, effects = {}) {
        BattleStats.init(player);

        const playerStats = BattleStats._stats.get(player.name);

        if (!playerStats.skillUsage[skillName]) {
            playerStats.skillUsage[skillName] = {
                count: 0,
                effects: {}
            };
        }

        // 叠加每项效果（key 可以是“回复”、“提供护盾”、“耗蓝”等等）
        for (let [key, val] of Object.entries(effects)) {
            if (!playerStats.skillUsage[skillName].effects[key]) {
                playerStats.skillUsage[skillName].effects[key] = val;
            } else {
                playerStats.skillUsage[skillName].effects[key] += val;
            }
        }

        playerStats.skillUsage[skillName].count += 1;
    }



    static getStats(player) {
        return BattleStats._stats.get(player.name) || null;
    }

    static getAllStats() {
        return Object.fromEntries(BattleStats._stats);
    }

    static clear() {
        BattleStats._stats.clear();
    }
}

