export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // ✅ 添加背景
        this.sky = this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'sky');
        this.sky.setScale(window.innerWidth / 400, window.innerHeight / 600);

        // ✅ 添加标题
        this.titleText = this.add.text(window.innerWidth / 2, window.innerHeight / 2 - 100, '欢迎来到游戏', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // // ✅ 添加开始按钮
        // this.startButton = this.add.text(window.innerWidth / 2, window.innerHeight / 2 + 100, '开始游戏', {
        //     fontSize: '24px',
        //     fill: '#0f0'
        // }).setInteractive().setOrigin(0.5);

        // this.startButton.on('pointerdown', () => {
        //     console.log('进入游戏');
        //     this.scene.start('LevelSelectScene');
        // });

        // ✅ 响应窗口变化
        window.addEventListener('resize', () => this.resizeGame(), false);
        this.resizeGame(); // 初始化时调用一次

        //测试用
        this.registry.set('gold', 500);


        // ✅ 初始化数据
        if (!this.registry.get('playerData')) {
            let hp = Phaser.Math.Between(1,100)+Phaser.Math.Between(50,100);
            let mp = Phaser.Math.Between(1,100)+Phaser.Math.Between(50,100);
            let attack = Phaser.Math.Between(3,8)+Phaser.Math.Between(5,10);
            this.registry.set('playerData', {
                hp: hp,
                maxHp: hp,
                mp: mp,
                maxMp: mp,
                attack: attack,
                speed: 100,
                shield: 0,
                armor: 0
            });

            hp = Phaser.Math.Between(1,50);
            mp = Phaser.Math.Between(1,10);
            attack = Phaser.Math.Between(1,5);
            this.registry.set('monsterData', {
                hp: hp,
                maxHp: hp,
                mp: mp,
                maxMp: mp,
                attack: attack,
                speed: 100,
                shield: 0,
                armor: 0
            });
        }

        const professions = [
            {
                name: "战士",
                bonus: { maxHp: 50, hp: 50, attack: 5, armor: 5 },
                // skills: [new WarriorSkill()],
                requiredForUpgrade: { maxHp: 200, attack: 30 }
            },
            {
                name: "法师",
                bonus: { maxMp: 60,mp: 60, attack: 3 },
                // skills: [new MageSkill()],
                requiredForUpgrade: { maxMp: 200 }
            },
            {
                name: "刺客",
                bonus: { speed: 50, attack: 10 },
                // skills: [new AssassinSkill()],
                requiredForUpgrade: { speed: 150, attack: 40 }
            }
        ];

        const player = this.registry.get('playerData');
        const currentProfession = this.registry.get('profession');
        const profDef = professions.find(p => p.name === currentProfession);

        if (!currentProfession) {
            this.profButtons = []; // 用于存储所有职业按钮

            professions.forEach((prof, index) => {
                const btn = this.add.text(
                    window.innerWidth / 2,
                    300 * window.innerHeight / 600 + index * 40 * window.innerHeight / 600,
                    `选择职业：${prof.name}`,
                    {
                        fontSize: '20px',
                        fill: '#fff'
                    }
                ).setOrigin(0.5).setInteractive();

                this.profButtons.push(btn);

                btn.on('pointerdown', () => {
                    const player = this.registry.get('playerData');
                    Object.entries(prof.bonus).forEach(([key, val]) => {
                        if (player[key] !== undefined) {
                            player[key] += val;
                        } else {
                            player[key] = val;
                        }
                    });

                    if (!player.skills) player.skills = [];
                    // player.skills.push(...prof.skills);

                    this.registry.set('playerData', player);
                    this.registry.set('profession', prof.name);

                    this.showToast(`✅ 已选择职业：${prof.name}`);

                    // 删除所有职业按钮
                    this.profButtons.forEach(b => b.destroy());

                    // 显示开始按钮
                    this.startButton = this.add.text(window.innerWidth / 2, window.innerHeight / 2 + 100, '🎮 开始游戏', {
                        fontSize: '26px',
                        fill: '#0f0'
                    }).setOrigin(0.5).setInteractive();

                    this.startButton.on('pointerdown', () => {
                        this.scene.start('LevelSelectScene');
                    });
                });
            });
        }


        if (profDef && this.fromBossVictory) {
            const req = profDef.requiredForUpgrade;
            const meetsRequirement = Object.keys(req).every(key => player[key] >= req[key]);

            if (meetsRequirement && !player.upgraded) {
                player.upgraded = true;
                this.registry.set('playerData', player);
                this.showToast(`🎉 ${currentProfession} 进阶成功！获得新技能！`);

                // 示例：添加一个技能
                player.skills.push(new EliteSkill());
            }
        }



    }

    shutdown() {
        // 离开场景时移除监听
        window.removeEventListener('resize', this._resizeHandler);
    }

    showToast(text) {
        const msg = this.add.text(this.scale.width / 2, this.scale.height - 100*window.innerHeight/600, text, {
            fontSize: "20px",
            fill: "#fff",
            backgroundColor: "#000"
        }).setOrigin(0.5);

        this.time.delayedCall(1000, () => msg.destroy());
    }


    resizeGame() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.scale.resize(width, height); // 更新场景大小

        // 背景居中并缩放
        if (this.sky) {
            this.sky.setPosition(width / 2, height / 2);
            this.sky.setScale(width / 400, height / 600);
        }

        // 文本位置更新
        if (this.titleText) {
            this.titleText.setPosition(width / 2, height / 2 - 100);
        }

        if (this.startButton) {
            this.startButton.setPosition(width / 2, height / 2 + 100);
        }

        // ✅ 职业选择按钮位置更新
        if (this.profButtons && Array.isArray(this.profButtons)) {
            this.profButtons.forEach((btn, index) => {
                btn.setPosition(width / 2, 300 * height / 600 + index * 40 * height / 600);
            });
        }
    }
}
