// import { Player } from '../classes/Player.js';
// import { SkillManager } from '../skills/SkillManager.js';
// import { UISystem } from '../ui/UISystem.js';

export class BattleManager {
    constructor(scene, player1, player2, uiSystem, enemyType = "fight") {
        this.scene = scene;  // ✅ 确保 scene 被正确赋值
        this.player1 = player1;
        this.player2 = player2;
        this.turnQueue = []; // 行动顺序
        this.tempStats = new Map(); // 存储临时属性
        this.enemyType = enemyType; // 保存敌人类型

        //全局ui
        this.uiSystem = uiSystem;
        this.isPaused = false;
        this.battleSpeed = 1;
        this.turnEvent = null; // 🎯 **保存回合事件**
    }

    /** 🎯 让战斗暂停 */
    setPause(pauseState) {
        this.isPaused = pauseState;
    }

    /** 🎯 让战斗加速 */
    setSpeed(speed) {
        this.battleSpeed = speed;
    }

    /** 开始战斗 */
    startBattle() {
        console.log("⚔ 战斗开始!");

        // 1️⃣ 初始化临时变量
        this.initTempStats(this.player1);
        this.initTempStats(this.player2);

        // 2️⃣ 触发战斗开始技能
        this.triggerBattleStartEffects(this.player1);
        this.triggerBattleStartEffects(this.player2);

        // 3️⃣ 计算攻击顺序
        this.calculateTurnOrder();

        // 4️⃣ 开始回合循环
        // this.nextTurn();
        this.turnEvent = this.scene.time.addEvent({
            delay: 1000 / this.battleSpeed, // 🎯 **影响战斗速度**
            loop: true,
            callback: () => {
                if (this.isPaused) return; // 🎯 **暂停时不执行**
                this.nextTurn();
            }
        });
    }

    /** 初始化战斗临时变量 */
    initTempStats(player) {
        this.tempStats.set(player, {
            tempArmor: 0,          // 临时护甲
            tempShield: 0,         // 临时护盾
            tempAttack: 0,         // 临时攻击力
            damageBoost: 1,        // 伤害提升倍率（默认1倍）
            defenseDebuff: 0,      // 防御降低
            nextAttackBonus: null,  // 下一次攻击的特殊效果
            nextDefenseBonus: null  // 下一次防御的特殊效果
        });
    }

    /** 计算战斗行动顺序（根据速度排序） */
    calculateTurnOrder() {
        this.turnQueue = [this.player1, this.player2].sort((a, b) => b.speed - a.speed);
    }

    /** 轮到角色行动 */
    nextTurn() {
        if (this.player1.hp <= 0 || this.player2.hp <= 0) {
            this.endBattle();
            return;
        }



        let attacker = this.turnQueue.shift();
        let defender = this.turnQueue[0];

        // 🔹 **触发回合开始技能**
        this.triggerTurnStartEffects(attacker);
        // this.triggerTurnStartEffects(this.player2);

        console.log(`🎯 ${attacker.name} 发动攻击!`);
        this.executeAttack(attacker, defender);

        // 交换行动顺序
        this.turnQueue.push(attacker);

        // 下一回合
        // setTimeout(() => this.nextTurn(), 1);
    }

    /** 执行战斗开始时技能 */
    triggerBattleStartEffects(player) {
        player.skills.forEach(skill => {
            if (skill.type === "onBattleStart") {
                skill.activate(player);
            }
        });
    }

    /** 执行回合开始时技能 */
    triggerTurnStartEffects(player) {
        player.skills.forEach(skill => {
            if (skill.type === "onTurnStart") {
                skill.activate(player);
            }
        });
    }

    /** 执行攻击逻辑 */
    executeAttack(attacker, defender) {
        let attackerTemp = this.tempStats.get(attacker);
        let defenderTemp = this.tempStats.get(defender);

        // 计算攻击力（包含临时加成）
        let attackPower = attacker.attack + attackerTemp.tempAttack;

        // 计算伤害倍率（包含临时伤害提升）
        let damageMultiplier = attackerTemp.damageBoost;

        // // 计算是否闪避
        // if (this.checkDodge(defender)) {
        //     console.log(`⚡ ${defender.name} 闪避了攻击!`);
        //     return;
        // }

        // // 计算是否格挡
        // if (this.checkBlock(defender)) {
        //     console.log(`🛡 ${defender.name} 格挡了攻击!`);
        //     return;
        // }

        // 计算最终伤害
        let damage = this.calculateDamage(attacker, defender, attackPower, damageMultiplier, defenderTemp.defenseDebuff);

        // 处理护盾
        damage = this.applyShield(defender, damage);

        // 扣血
        defender.takeDamage(damage);

        // 吸血
        this.applyLifesteal(attacker, damage);

        // 处理命中后特效
        this.triggerHitEffects(attacker, defender, damage);

        // 处理濒死效果
        this.checkNearDeath(defender);

        // **下一次攻击加成用完后清除**
        attackerTemp.nextAttackBonus = null;
    }

    /** 计算伤害 */
    calculateDamage(attacker, defender, baseAttack, multiplier, defenseDebuff) {
        let crit = Math.random() * 100 < attacker.critChance;
        let critMultiplier = crit ? attacker.critDamage / 100 : 1;

        // 计算护甲减伤（包含防御降低效果）
        let effectiveArmor = Math.max(0, defender.armor - defenseDebuff);
        let armorReduction = effectiveArmor / (effectiveArmor + 50);
        let damage = baseAttack * critMultiplier * multiplier * (1 - armorReduction);
        console.log(`💥 伤害计算: ${baseAttack} -> ${Math.floor(damage)} (${crit ? "暴击!" : "普通攻击"})`);
        return Math.floor(damage);
    }

    /** 处理护盾伤害 */
    applyShield(defender, damage) {
        let defenderTemp = this.tempStats.get(defender);
        if (defenderTemp.tempShield > 0) {
            let absorbed = Math.min(defenderTemp.tempShield, damage);
            defenderTemp.tempShield -= absorbed;
            damage -= absorbed;
            console.log(`🛡 ${defender.name} 的临时护盾吸收了 ${absorbed} 伤害!`);
        }
        return damage;
    }

    /** 处理吸血 */
    applyLifesteal(attacker, damage) {
        let heal = Math.floor(damage * attacker.lifesteal / 100);
        if (heal > 0) {
            attacker.hp = Math.min(attacker.hp + heal, attacker.maxHp);
            console.log(`🩸 ${attacker.name} 吸血 ${heal} 点!`);
        }
    }

    /** 触发命中后特效 */
    triggerHitEffects(attacker, defender, damage) {
        attacker.skills.forEach(skill => {
            if (skill.type === "onHit") {
                skill.activate();
            }
        });

        if (defender.hp <= 0) {
            this.applyKillEffects(attacker);
        }
    }

    /** 触发命中后特效 */
    applyKillEffects(attacker) {
        attacker.skills.forEach(skill => {
            if (skill.type === "onKill") {
                skill.activate();
            }
        });

    }

    /** 处理濒死判定（如冰甲术） */
    checkNearDeath(player) {
        if (player.hp <= 0) {
            player.skills.forEach(skill => {
                if (skill.type === "nearDeath") {
                    skill.activate();
                }
            });
        }
    }

    /** 结束战斗 */
    endBattle() {
        this.turnEvent.remove(); // 🎯 **停止回合循环**
        this.turnEvent = null;

        if (this.player1.hp > 0) {
            console.log(`🎉 ${this.player1.name} 获胜!`);
            let playerData = this.scene.registry.get('playerData');
            playerData.hp = this.player1.hp;
            playerData.mp = this.player1.mp;
            this.scene.registry.set('playerData', playerData);
            let fromType = {
                fight: 'victory_normal',
                elite: 'victory_elite',
                boss: 'victory_boss',
                ambush: 'victory_normal'
            }[this.enemyType] || 'victory_normal';

            this.scene.scene.start('EventScene', { from: fromType });
            // this.scene.scene.start('LevelSelectScene'); // 切换到游戏场景

        } else if (this.player2.hp > 0) {
            console.log(`🎉 ${this.player2.name} 获胜!`);
        } else {
            console.log("🤝 平局!");
        }
    }
}
