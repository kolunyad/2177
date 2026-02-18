class BattleScene extends Phaser.Scene {
  constructor() {
    super('Battle');
  }

  init(data) {
    this.chapter = data.chapter || 1; 
    // Исправлено: добавлены кавычки и обратные кавычки
    this.bgKey = `bgb_ch${this.chapter}`; 
    this.bgFile = `assets/pixel/bgb_ch${this.chapter}.png`; 
  }

  preload() {
    this.load.image(this.bgKey, this.bgFile);
  }

  create() {
    const { width, height } = this.scale;

    // --- ИНТЕРФЕЙСНЫЕ ГРАНИЦЫ ---
    const topBarH = 80;
    const bottomBarH = 140;
    const availableH = height - topBarH - bottomBarH;
    const viewCenterY = topBarH + (availableH / 2);

    // Фон
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 1);
    const bg = this.add.image(width / 2, viewCenterY, this.bgKey);
    if (bg.width > 0) {
        const scale = Math.min(width / bg.width, availableH / bg.height);
        bg.setScale(scale);
    }

    // Панели
    this.add.rectangle(width / 2, topBarH / 2, width, topBarH, 0x0f1720, 1).setStrokeStyle(2, 0x2b455a);
    this.add.rectangle(width / 2, height - (bottomBarH / 2), width, bottomBarH, 0x0f1720, 1).setStrokeStyle(2, 0x2b455a);

    // Данные врага (предполагается наличие объекта Script)
    const ch = (window.Script && Script.chapters) ? Script.chapters[this.chapter] : { name: "Глава", enemy: { name: "Тень", hp: 50 } };
    const enemyDef = (this.chapter === 4 && ch.boss) ? ch.boss : ch.enemy;

    this.add.text(60, 28, `${ch.name} — Битва`, {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });

    this.log = this.add.text(60, 110, "", {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      lineSpacing: 4
    });

    // Партия
    this.party = {
      pal: { name: "Коля", hp: 70, mp: 20, guard: 0, defend: 0 },
      ali: { name: "Алиса", hp: 55, mp: 35, defend: 0 },
    };

    // Враг
    this.enemy = {
      name: enemyDef.name,
      hp: enemyDef.hp,
      maxHp: enemyDef.hp,
      burn: 0,
    };

    this.cmd = this.add.text(60, height - 120, "", { fontFamily: 'Arial', fontSize: '16px', color: '#d7f3ff' });
    this.stats = this.add.text(60, 80, "", { fontFamily: 'Arial', fontSize: '16px', color: '#d7f3ff' });

    // Состояние боя
    this.turnOrder = ["ali", "pal", "enemy"];
    this.ti = 0;
    this.waiting = false;
    this.meditationStack = 0;
    this.meditationArmed = false;
    this.mustGuard = false;

    this.print("Ночь сгущается. Вы с Алисой становитесь плечом к плечу.");
    this.refresh();
    this.nextTurn();

    // Ввод
    this.input.keyboard.on('keydown', (e) => {
      if (!this.waiting) return;
      if (["1", "2", "3"].includes(e.key)) this.act(e.key);
    });
  }

  applyDamageToEnemy(baseDmg, isNormalHit) {
    let dmg = baseDmg;
    if (this.chapter === 4 && isNormalHit) dmg = 1; 
    this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
    return dmg;
  }

  refresh() {
    this.stats.setText(
      `${this.party.pal.name} HP ${this.party.pal.hp} MP ${this.party.pal.mp} | ` +
      `${this.party.ali.name} HP ${this.party.ali.hp} MP ${this.party.ali.mp}\n` +
      `${this.enemy.name} HP ${this.enemy.hp}/${this.enemy.maxHp} ${this.enemy.burn > 0 ? "(горение)" : ""}`
    );
  }

  print(line) {
    const arr = this.log.text ? this.log.text.split("\n") : [];
    arr.push("• " + line);
    while (arr.length > 8) arr.shift();
    this.log.setText(arr.join("\n"));
  }

  nextTurn() {
    if (this.enemy.hp <= 0) return this.win();
    if (this.party.pal.hp <= 0 || this.party.ali.hp <= 0) return this.lose();

    const who = this.turnOrder[this.ti];
    this.waiting = false;

    if (who === "ali") {
      this.cmd.setText("Алиса: 1) Заклинание (5MP) 2) Лечить Колю (6MP) 3) Медитация");
      this.waiting = true;
    } else if (who === "pal") {
      this.cmd.setText("Коля: 1) Киберудар 2) Защитить Алису (4MP) 3) Стойкость");
      this.waiting = true;
    } else {
      this.cmd.setText("Ход врага...");
      this.time.delayedCall(600, () => this.enemyTurn());
    }
    this.refresh();
  }

  act(k) {
    const who = this.turnOrder[this.ti];

    if (who === "ali") {
      if (k === "1") {
        if (this.meditationArmed) {
          this.enemy.hp = 0;
          this.print("АЛИСА: «КОД СХОДИТСЯ». Вспышка стирает врага из реальности!");
          return this.advance();
        }
        if (this.party.ali.mp < 5) { this.print("Недостаточно маны!"); return; }
        this.party.ali.mp -= 5;
        const dmg = this.applyDamageToEnemy(12, true);
        this.print(`Алиса наносит ${dmg} урона.`);
        this.resetCombo();
      } else if (k === "2") {
        if (this.party.ali.mp < 6) return;
        this.party.ali.mp -= 6;
        this.party.pal.hp = Math.min(70, this.party.pal.hp + 18);
        this.print("Алиса восстановила здоровье Коли.");
        this.resetCombo();
      } else if (k === "3") {
        this.meditationStack++;
        this.mustGuard = true;
        this.party.ali.mp = Math.min(35, this.party.ali.mp + 3);
        if (this.meditationStack >= 3) {
          this.meditationArmed = true;
          this.print("АЛИСА: «ГОТОВО». Следующий удар будет фатальным.");
        } else {
          this.print(`Алиса в медитации (${this.meditationStack}/3). Коля ДОЛЖЕН защищать!`);
        }
      }
    }

    if (who === "pal") {
      if (k === "1") {
        const dmg = this.applyDamageToEnemy(10, true);
        this.print(`Коля бьет врага на ${dmg}.`);
        if (this.mustGuard) this.breakCombo();
      } else if (k === "2") {
        if (this.party.pal.mp < 4) return;
        this.party.pal.mp -= 4;
        this.party.pal.guard = 1;
        this.print("Коля активировал Покров Стража.");
      } else if (k === "3") {
        this.party.pal.defend = 1;
        this.print("Коля в глухой обороне.");
        if (this.mustGuard) this.breakCombo();
      }
    }

    this.advance();
  }

  resetCombo() {
    this.meditationStack = 0;
    this.meditationArmed = false;
    this.mustGuard = false;
  }

  breakCombo() {
    this.resetCombo();
    this.print("Комбо сорвано: Коля не удержал щит!");
  }

  enemyTurn() {
    if (this.enemy.hp <= 0) return;

    let target = Math.random() < 0.5 ? "pal" : "ali";
    
    // Перехват
    if (target === "ali" && this.party.pal.guard > 0) {
      this.party.pal.guard = 0;
      target = "pal";
      this.print("Коля перехватил удар на себя!");
    } else if (target === "ali" && this.mustGuard) {
      this.breakCombo();
      this.print("Удар сбил концентрацию Алисы!");
    }

    let dmg = (this.chapter === 4) ? 18 : 14;
    if (this.party[target].defend) {
        dmg = Math.ceil(dmg * 0.5);
        this.party[target].defend = 0;
    }

    this.party[target].hp = Math.max(0, this.party[target].hp - dmg);
    this.print(`${this.enemy.name} атакует ${this.party[target].name} (-${dmg} HP)`);

    this.advance();
  }

  advance() {
    this.refresh();
    this.ti = (this.ti + 1) % this.turnOrder.length;
    this.time.delayedCall(400, () => this.nextTurn());
  }

  win() {
    this.print("Победа!");
    this.time.delayedCall(1000, () => this.scene.start('Info', { chapter: this.chapter, win: true }));
  }

  lose() {
    this.print("Поражение...");
    this.time.delayedCall(1000, () => this.scene.start('Info', { chapter: this.chapter, win: false }));
  }
}

window.BattleScene = BattleScene;