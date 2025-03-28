import { BattleLog } from '../battle/BattleLog.js';




export class BattleManager {
    constructor(scene, player1, player2, uiSystem, enemyType = "fight") {
        this.scene = scene;  // ✅ 确保 scene 被正确赋值
        this.player1 = player1;
        this.player2 = player2;

        this.player1hp = player1.hp;
        this.player2hp = player2.hp;

        this.turnQueue = []; // 行动顺序
        this.enemyType = enemyType; // 保存敌人类型

        //全局ui
        this.uiSystem = uiSystem;
        this.isPaused = false;
        this.battleSpeed = 1;
        this.turnEvent = null; // 🎯 **保存回合事件**
        this.turnCount = 0;

        this.battleLog = BattleLog.getLogs();
        BattleLog.clear(); // 开始前清空旧日志

        this.battleStats = {
            [player1.name]: this.createEmptyStats(),
            [player2.name]: this.createEmptyStats()
        };




    }

    createEmptyStats() {
        return {
            damageDealt: 0,         // 总伤害
            damageTaken: 0,         // 总承伤
            healingDone: 0,         // 总治疗
            shieldAbsorbed: 0,      // 护盾吸收总量
            armorBlocked: 0,        // 护甲减免总量
            normalAttack: 0,        // 普通攻击次数
            skillUsage: {}          // { 技能名: 次数 }
        };
    }

    logSkillUsage(player, skillName) {
        const stats = this.battleStats[player.name];
        if (!stats.skillUsage[skillName]) {
            stats.skillUsage[skillName] = 1;
        } else {
            stats.skillUsage[skillName]++;
        }
    }


    updateAllUI() {
        if (this.player1){this.player1.updateUI();}
        if (this.player2){this.player2.updateUI();}
        if (this.gameover1) {
            this.gameover1.setPosition(350*window.innerWidth/800, 250*window.innerHeight/600);
            this.gameover1.setScale(window.innerWidth/800, window.innerHeight/600);
        }
        if (this.gameover2) {
            this.gameover2.setPosition(400*window.innerWidth/800, 250*window.innerHeight/600);
            this.gameover2.setScale(window.innerWidth/800, window.innerHeight/600);
        }
        if (this.restart1Button) {
            this.restart1Button.setPosition(400*window.innerWidth/800, 370*window.innerHeight/600);
            this.restart1Button.setScale(window.innerWidth/800, window.innerHeight/600);
        }
        if (this.restart2Button) {
            this.restart2Button.setPosition(400*window.innerWidth/800, 270*window.innerHeight/600);
            this.restart2Button.setScale(window.innerWidth/800, window.innerHeight/600);
        }
        if (this.logBtn) {
            this.logBtn.setPosition(400*window.innerWidth/800, 370*window.innerHeight/600);
            this.logBtn.setScale(window.innerWidth/800, window.innerHeight/600);
        }
        if (this.nextBtn) {
            this.nextBtn.setPosition(400*window.innerWidth/800, 270*window.innerHeight/600);
            this.nextBtn.setScale(window.innerWidth/800, window.innerHeight/600);
        }
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
        BattleLog.write("⚔ 战斗开始!");
        

        //  触发战斗开始技能
        this.triggerBattleStartEffects(this.player1,this.player2);
        this.triggerBattleStartEffects(this.player2,this.player1);

        //  计算攻击顺序
        this.calculateTurnOrder();

        //  开始回合循环
        // this.nextTurn();
        this.updateAllUI();

        this.turnEvent = this.scene.time.addEvent({
            delay: 1000 / this.battleSpeed, // 🎯 **影响战斗速度**
            loop: true,
            callback: () => {
                if (this.isPaused) return; // 🎯 **暂停时不执行**
                this.nextTurn();
                this.updateAllUI();
            }
        });
    }

    /** 计算战斗行动顺序（根据速度排序） */
    calculateTurnOrder() {
        this.turnQueue = [this.player1, this.player2].sort((a, b) => b.speed - a.speed);
    }

    /** 轮到角色行动 */
    nextTurn() {
        this.turnCount += 1
        BattleLog.write(`   ⚔ 第 ${this.turnCount} 回合`);

        if (this.player1.hp <= 0 || this.player2.hp <= 0) {
            this.triggerBattleEndEffects(this.player1);
            this.triggerBattleEndEffects(this.player2);
            this.updateAllUI();
            this.endBattle();
            return;
        }



        let attacker = this.turnQueue.shift();
        let defender = this.turnQueue[0];

        // 🔹 **触发回合开始技能**
        this.triggerTurnStartEffects(attacker,defender);
        // this.triggerTurnStartEffects(this.player2);

        console.log(`   🎯 ${attacker.name} 发动攻击!`);
        BattleLog.write(`   🎯 ${attacker.name} 发动攻击!`);
        this.executeAttack(attacker, defender);

        // 交换行动顺序
        this.turnQueue.push(attacker);

        // 下一回合,回合内状态清除
        this.player1.reset();
        this.player2.reset();

        // setTimeout(() => this.nextTurn(), 1);
    }

    /** 执行战斗开始时技能 */
    triggerBattleStartEffects(player1,player2) {
        player1.skills.forEach(skill => {

            if (skill.type === "onBattleStart") {
                skill.activate(player1,player2);
                if(skill.canUse){this.logSkillUsage(player1, skill.name);} // ⬅️ 添加统计
            }

            if (typeof skill.reset === 'function') {
                skill.reset(); // ⬅️ 重置“只能触发一次”的技能，重置“只在下一次战斗中生效”的技能
            }

        });
    }

    /** 执行回合开始时技能 */
    triggerTurnStartEffects(player1,player2) {
        player1.skills.forEach(skill => {
            if (skill.type === "onTurnStart") {
                skill.activate(player1,player2);
                if(skill.canUse){this.logSkillUsage(player1, skill.name);} // ⬅️ 添加统计
            }
        });
    }

    /** 执行战斗结束时技能 */
    triggerBattleEndEffects(player) {
        player.skills.forEach(skill => {
            if (skill.type === "onBattleEnd") {
                if(player.hp > 0){skill.activate(player);}
                if(skill.canUse){this.logSkillUsage(player, skill.name);} // ⬅️ 添加统计
            }
        });
    }



    /** 执行攻击逻辑 */
    executeAttack(attacker, defender) {

        //攻击计数+1
        attacker.attackCount += 1;

        // 计算攻击力（包含临时加成）
        let attackPower = attacker.attack + attacker.tempAttack;

        // 计算伤害倍率（包含临时伤害提升）
        let damageMultiplier = attacker.damageBoost;

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
        let damage = this.calculateDamage(attacker, defender, attackPower, damageMultiplier, defender.defenseBoost);

        

        // 处理护盾
        damage = this.applyShield(defender, damage);

        // 处理护甲
        damage = this.applyArmor(defender, damage, attacker);

        // 处理减伤技能
        damage = this.triggerDefendEffects(defender,damage);


        // 吸血
        this.applyLifesteal(attacker, Math.min(damage,defender.hp));

        // 扣血
        defender.takeDamage(damage);

        
        this.battleStats[attacker.name].damageDealt += damage;
        this.battleStats[defender.name].damageTaken += damage;
        this.battleStats[attacker.name].normalAttack += 1;

        BattleLog.write(`   ${attacker.name} 普通攻击造成 ${damage} 点伤害`);

        // 处理命中后特效
        this.triggerHitEffects(attacker, defender, damage);

        // 处理濒死效果
        this.checkNearDeath(defender);


        // 处理击杀特效
        this.triggerKillEffects(attacker, defender, damage);
    }

    triggerDefendEffects(player, damage) {
        let finalDamage = damage;

        player.skills.forEach(skill => {
            if (skill.type === "onDamageTaken") {
                const result = skill.activate(player, finalDamage);
                // 如果技能返回有效值，更新 finalDamage
                if (typeof result === 'number') {
                    finalDamage = result;
                }
            }
        });

        return finalDamage;
    }

    

    /** 计算伤害 */
    calculateDamage(attacker, defender, baseAttack, multiplier, defenseDebuff) {
        let crit = Math.random() * 100 < attacker.critChance;
        let critMultiplier = crit ? attacker.critDamage / 100 : 1;
        let damage = baseAttack * critMultiplier * multiplier;
        console.log(`   💥 伤害计算: ${baseAttack} -> ${Math.floor(damage)} (${crit ? "暴击!" : "普通攻击"})`);
        BattleLog.write(`   💥 伤害计算: ${baseAttack} -> ${Math.floor(damage)} (${crit ? "暴击!" : "普通攻击"})`);
        return Math.floor(damage);
    }

    /** 处理护盾伤害 */
    applyShield(defender, damage) {
        if (defender.shield > 0) {
            let absorbed = Math.min(defender.shield, damage);
            defender.shield -= absorbed;
            damage -= absorbed;
            console.log(`   🛡 ${defender.name} 的临时护盾吸收了 ${absorbed} 伤害!`);
            BattleLog.write(`   🛡 ${defender.name} 的临时护盾吸收了 ${absorbed} 伤害!`);
            this.battleStats[defender.name].shieldAbsorbed += absorbed;
        }
        return damage;
    }

    /** 处理护甲减伤，反伤等 */
    applyArmor(defender, damage, attacker) {
        // 计算护甲减伤（包含防御降低效果）
        let effectiveArmor = Math.max(0, defender.armor);
        let armorReduction = effectiveArmor / (effectiveArmor + 100);
        let finaldamage = damage * (1 - armorReduction);
        console.log(`   🛡 ${defender.name} 的护甲减免了 ${damage - Math.floor(finaldamage)} 伤害!`);
        BattleLog.write(`   🛡 ${defender.name} 的护甲减免了 ${damage - Math.floor(finaldamage)} 伤害!`);
        this.battleStats[defender.name].armorBlocked += Math.floor(damage - Math.floor(finaldamage));
        return Math.floor(finaldamage);
    }

    /** 处理吸血 */
    applyLifesteal(attacker, damage) {
        let heal = Math.floor(damage * attacker.lifesteal / 100);
        if (heal > 0) {
            attacker.hp = Math.min(attacker.hp + heal, attacker.maxHp);
            console.log(`   🩸 ${attacker.name} 吸血 ${heal} 点!`);
            BattleLog.write(`   🩸 ${attacker.name} 吸血 ${heal} 点!`);
            this.battleStats[attacker].healingDone += healAmount;
        }
    }

    /** 触发命中后特效 */
    triggerHitEffects(attacker, defender, damage) {
        attacker.skills.forEach(skill => {
            if (skill.type === "onHit") {
                skill.activate();
                if(skill.canUse){this.logSkillUsage(attacker, skill.name);} // ⬅️ 添加统计
            }
        });

    }

    /** 触发击杀后特效 */
    triggerKillEffects(attacker) {
        attacker.skills.forEach(skill => {
            if (skill.type === "onKill") {
                skill.activate();
                if(skill.canUse){this.logSkillUsage(attacker, skill.name);} // ⬅️ 添加统计
            }
        });

    }

    /** 处理濒死判定（如冰甲术） */
    checkNearDeath(player) {
        if (player.hp <= 0) {
            player.skills.forEach(skill => {
                if (skill.type === "onFatalDamage") {
                    skill.activate(player);
                    if(skill.canUse){this.logSkillUsage(player, skill.name);} // ⬅️ 添加统计
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
            BattleLog.write(`   🎉 ${this.player1.name} 获胜!`);
            this.player2.gameover = true;
            let playerData = this.scene.registry.get('playerData');
            playerData.hp = Math.min(this.player1.hp,this.player1.maxHp);
            playerData.mp = Math.min(this.player1.mp,this.player1.maxMp);
            this.scene.registry.set('playerData', playerData);
            let fromType = {
                fight: 'victory_normal',
                elite: 'victory_elite',
                boss: 'victory_boss',
                ambush: 'victory_normal'
            }[this.enemyType] || 'victory_normal';
            // this.showBattleLogWithDOM();
            // this.scene.scene.start('EventScene', { from: fromType });
            // this.scene.scene.start('LevelSelectScene'); // 切换到游戏场景

            this.logBtn = this.scene.add.text(400*window.innerWidth/800, 370*window.innerHeight/600, '📜 查看战斗日志', {
                fontSize: '24px',
                fill: '#0f0',
                backgroundColor: '#333',
                padding: { left: 10, right: 10, top: 5, bottom: 5 }
            }).setOrigin(0.5).setInteractive();

            this.nextBtn = this.scene.add.text(400*window.innerWidth/800, 270*window.innerHeight/600, '➡️ 下一步', {
                fontSize: '24px',
                fill: '#0f0',
                backgroundColor: '#333',
                padding: { left: 10, right: 10, top: 5, bottom: 5 }
            }).setOrigin(0.5).setInteractive();

            // const logBtn = this.scene.add.text(centerX, baseY, '📜 查看战斗日志', {
            //     fontSize: '20px',
            //     fill: '#fff',
            //     backgroundColor: '#444',
            //     padding: { x: 10, y: 5 }
            // }).setOrigin(0.5).setInteractive();

            // const nextBtn = this.scene.add.text(centerX, baseY + 50, '➡️ 下一步', {
            //     fontSize: '20px',
            //     fill: '#0f0',
            //     backgroundColor: '#000',
            //     padding: { x: 10, y: 5 }
            // }).setOrigin(0.5).setInteractive();

            this.logBtn.on('pointerdown', () => {
                this.showBattleLogWithDOM();
            });

            this.nextBtn.on('pointerdown', () => {
                this.logBtn.destroy();
                this.nextBtn.destroy();
                this.scene.scene.start('EventScene', { from: fromType });
            });

        } else if (this.player2.hp > 0) {
            console.log(`🎉 ${this.player2.name} 获胜!`);
            BattleLog.write(`   🎉 ${this.player2.name} 获胜!`);
            this.player1.gameover = true;
            this.gameover1 = this.scene.add.rectangle(400*window.innerWidth/800, 300*window.innerHeight/600, 300*window.innerWidth/600, 200*window.innerHeight/600, 0x000000, 0.8); // 半透明黑色背景
            this.gameover2 = this.scene.add.text(400*window.innerWidth/800, 250*window.innerHeight/600, '游戏结束', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

            // this.showBattleLogWithDOM();
            this.restart1Button = this.scene.add.text(400*window.innerWidth/800, 370*window.innerHeight/600, '再来一次', {
                fontSize: '24px',
                fill: '#0f0',
                backgroundColor: '#333',
                padding: { left: 10, right: 10, top: 5, bottom: 5 }
            }).setOrigin(0.5).setInteractive();

            this.restart1Button.on('pointerdown', () => {
                this.scene.scene.restart(); // **重新启动当前场景**
            });

            this.restart2Button = this.scene.add.text(400*window.innerWidth/800, 270*window.innerHeight/600, '重新开始', {
                fontSize: '24px',
                fill: '#0f0',
                backgroundColor: '#333',
                padding: { left: 10, right: 10, top: 5, bottom: 5 }
            }).setOrigin(0.5).setInteractive();

            this.restart2Button.on('pointerdown', () => {
                this.scene.registry.set('mapData', undefined);
                this.scene.registry.set('returnNode', undefined);
                this.scene.registry.set("floor", undefined);
                this.scene.registry.set('gold', undefined);
                this.scene.scene.start('MenuScene'); 
            });

            this.gameover1.setScale(window.innerWidth/800, window.innerHeight/600);
            this.gameover2.setScale(window.innerWidth/800, window.innerHeight/600);
            this.restart1Button.setScale(window.innerWidth/800, window.innerHeight/600);
            this.restart2Button.setScale(window.innerWidth/800, window.innerHeight/600);
        } else {
            console.log("🤝 平局!");
            BattleLog.write("   🤝 平局!");
            // this.showBattleLogWithDOM();
        }

        
    }

    showBattleLogWithDOM() {


        const { player1, player2, battleStats, battleLog } = this;

        battleStats[player1.name].healingDone =  player1.hp + battleStats[player1.name].damageTaken - this.player1hp;
        battleStats[player2.name].healingDone =  player2.hp + battleStats[player2.name].damageTaken - this.player2hp;

        const statText = (player) => {
            const stats = battleStats[player.name];
            const skills = Object.entries(stats.skillUsage)
                .map(([k, v]) => `\n🔸 ${k}：${v} 次`).join('');
            return `
    👤 ${player.name}
    ✅ 输出：${stats.damageDealt}
    🛡 承伤：${stats.damageTaken}
    💖 治疗：${stats.healingDone}
    🛡 护盾吸收：${stats.shieldAbsorbed}
    🧱 护甲减伤：${stats.armorBlocked}
    ⚔️ 普攻次数：${stats.normalAttack}
    ✨ 技能使用：${skills || '无'}
        `;
        };

        const logText = BattleLog.getLogs();
        const fullText = `
    📊 战斗统计
    ${statText(player1)}
    ${statText(player2)}

    📜 战斗日志
    ${logText}
        `;

        console.log("📜 battleLog 内容:", battleLog);

        console.log(fullText);

        const textarea = document.createElement('textarea');
        textarea.value = fullText;
        textarea.readOnly = true;

        Object.assign(textarea.style, {
            position: 'absolute',
            left: `${window.innerWidth * 0.1}px`,
            top: `${window.innerHeight * 0.1}px`,
            width: `${window.innerWidth * 0.8}px`,
            height: `${window.innerHeight * 0.6}px`,
            backgroundColor: '#111',
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '14px',
            padding: '10px',
            overflow: 'auto',
            border: '2px solid white',
            resize: 'none',
            zIndex: 9999
        });

        document.body.appendChild(textarea);

        // 关闭按钮
        const closeBtn = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height * 0.8,
            '关闭日志',
            {
                fontSize: '20px',
                fill: '#0f0',
                backgroundColor: '#000',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5).setInteractive();

        closeBtn.on('pointerdown', () => {
            document.body.removeChild(textarea); // ✅ 销毁
            closeBtn.destroy();

        });
    }

}
