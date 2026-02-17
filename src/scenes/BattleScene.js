class BattleScene extends Phaser.Scene {
  constructor() {
    super('Battle');
  }

  init(data) {
    this.chapter = data.chapter;
    this.bgKey = `bgb_ch${this.chapter}`;
    this.bgFile = `assets/pixel/bgb_ch${this.chapter}.png`;
  }

  preload() {
    this.load.image(this.bgKey, this.bgFile);
  }

  create() {
    const { width, height } = this.scale;

    const topBarH = 80;
    const bottomBarH = 140;
    const availableH = height - topBarH - bottomBarH;
    const viewCenterY = topBarH + (availableH / 2);

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 1);
    const bg = this.add.image(width / 2, viewCenterY, this.bgKey);
    const scale = Math.min(width / bg.width, availableH / bg.height);
    bg.setScale(scale);

    this.add.rectangle(width / 2, topBarH / 2, width, topBarH, 0x0f1720, 1).setStrokeStyle(2, 0x2b455a);
    this.add.rectangle(width / 2, height - (bottomBarH / 2), width, bottomBarH, 0x0f1720, 1).setStrokeStyle(2, 0x2b455a);

    const ch = Script.chapters[this.chapter];
    const enemyDef = (this.chapter === 4) ? ch.boss : ch.enemy;

    this.add.text(60, 28, ch.name + " — Битва", {
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

    this.party = {
      pal: { name: "Коля", hp: 70, mp: 20, guard: 0, defend: 0 },
      ali: { name: "Алиса", hp: 55, mp: 35, defend: 0 },
    };

    this.enemy = {
      name: enemyDef.name,
      hp: enemyDef.hp,
      maxHp: enemyDef.hp,
      burn: 0,
    };

    this.add.rectangle(width / 2, height - 70, width - 60, 120, 0x0f1720, 0.95).setStrokeStyle(2, 0x2b455a);
    this.cmd = this.add.text(60, height - 120, "", { fontFamily: 'Arial', fontSize: '16px', color: '#d7f3ff' });
    this.stats = this.add.text(60, 80, "", { fontFamily: 'Arial', fontSize: '16px', color: '#d7f3ff' });

    this.turnOrder = ["ali", "pal", "enemy"];
    this.ti = 0;
    this.waiting = false;

    this.lastSkill = null;
    this.meditationStack = 0;
    this.meditationArmed = false;
    this.mustGuard = false;

    this.print("Ночь сгущается. Вы с Алисой становитесь плечом к плечу.");
    this.refresh();
    this.nextTurn();

    this.input.keyboard.on('keydown', (e) => {
      if (!this.waiting) return;
      if (e.key === "1") this.act("1");
      if (e.key === "2") this.act("2");
      if (e.key === "3") this.act("3");
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
      `${this.party.pal.name} HP ${this.party.pal.hp} MP ${this.party.pal.mp}   |   ` +
      `${this.party.ali.name} HP ${this.party.ali.hp} MP ${this.party.ali.mp}\n` +
      `${this.enemy.name} HP ${this.enemy.hp}/${this.enemy.maxHp} ${this.enemy.burn > 0 ? "(горение)" : ""}`
    );
  }

  print(line) {
    const arr = this.log.text ? this.log.text.split("\n") : [];
    arr.push("• " + line);
    while (arr.length > 10) arr.shift();
    this.log.setText(arr.join("\n"));
  }

  nextTurn() {
    if (this.enemy.hp <= 0) return this.win();
    
    // Проверка на проигрыш перед началом любого хода
    if (this.party.pal.hp <= 0 || this.party.ali.hp <= 0) {
      return this.lose();
    }

    const who = this.turnOrder[this.ti];
    this.waiting = false;

    if (who === "ali") {
      this.cmd.setText("Ход Алисы: 1) Удар заклинанием  2) Исцеление Коли  3) Медитация");
      this.waiting = true;
    } else if (who === "pal") {
      this.cmd.setText("Ход Коли: 1) Удар киберкулаком  2) Защита Алисы  3) Стойкость");
      this.waiting = true;
    } else {
      this.cmd.setText("Ход врага…");
      this.enemyTurn();
    }
    this.refresh();
  }

  act(k) {
    const who = this.turnOrder[this.ti];

    if (who === "ali") {
      if (k === "1") {
        if (this.meditationArmed) {
          this.enemy.hp = 0;
          this.meditationArmed = false;
          this.meditationStack = 0;
          this.mustGuard = false;
          this.print("АЛИСА: «КОД СХОДИТСЯ». Вспышка стирает врага.");
          return this.advance();
        }

        // ПРОВЕРКА МАНЫ: Если не хватает, печатаем текст и вызываем advance() (пропуск хода)
        if (this.party.ali.mp < 5) { 
          this.print("Алиса: «Мана иссякла!» Заклинание сорвано, ход потерян."); 
          return this.advance(); 
        }

        this.party.ali.mp -= 5;
        const dmg = this.applyDamageToEnemy(12, true);
        this.print(`Алиса: «Да сгорит всё лишнее!» (-${dmg}).`);
        this.meditationStack = 0;
        this.mustGuard = false;
      }

      if (k === "2") {
        // ПРОВЕРКА МАНЫ
        if (this.party.ali.mp < 6) { 
          this.print("Алиса: «Нет сил для лечения...» Ход потерян."); 
          return this.advance(); 
        }

        this.party.ali.mp -= 6;
        const heal = 18;
        const before = this.party.pal.hp;
        this.party.pal.hp = Math.min(70, this.party.pal.hp + heal);
        const realHeal = this.party.pal.hp - before;
        this.print(`Алиса восстанавливает Коле ${realHeal} HP.`);
        this.meditationStack = 0;
        this.mustGuard = false;
      }

      if (k === "3") {
        this.party.ali.defend = 1;
        this.party.ali.mp = Math.min(35, this.party.ali.mp + 3);
        this.meditationStack += 1;
        this.mustGuard = true;
        this.print(`Алиса уходит в глубокий просчет (${this.meditationStack}/3).`);
      }
    }

    if (who === "pal") {
      if (k === "1") {
        const dmg = this.applyDamageToEnemy(12, true);
        this.print(`Коля: «Свет не знает преград!» (-${dmg}).`);
      }
      if (k === "2") {
        if (this.party.pal.mp < 4) { this.print("Коля слишком истощен."); return; }
        this.party.pal.mp -= 4;
        this.party.pal.guard = 1;
        this.print("Коля закрывает Алису собой.");
      }
      if (k === "3") {
        this.party.pal.defend = 1;
        this.print("Коля концентрирует волю.");
      }
      if (this.mustGuard && k !== "2") {
        this.meditationStack = 0;
        this.meditationArmed = false;
        this.mustGuard = false;
        this.print("Комбо сорвано: Коля не удержал щит.");
      }
    }

    this.advance();
  }

  enemyTurn() {
    if (this.enemy.burn > 0) {
      this.enemy.hp -= 6;
      this.enemy.burn -= 1;
      this.print("Истинное пламя выжигает суть врага.");
      if (this.enemy.hp <= 0) return this.win();
    }

    const t0 = Math.random() < 0.5 ? "pal" : "ali";
    let t = t0;

    if (t === "ali" && this.party.pal.guard > 0 && this.party.pal.hp > 0) {
      this.party.pal.guard -= 1;
      t = "pal";
      this.print("Коля перехватывает удар, заслоняя Алису!");
    } else if (t === "ali" && this.mustGuard) {
      this.meditationStack = 0;
      this.meditationArmed = false;
      this.mustGuard = false;
      this.print("Удар сбивает Алису с ритма. Просчет обрывается.");
    }

    const baseDmg = (this.chapter === 4) ? 18 : 14;
    let dmg = baseDmg;

    if (t === "pal" && this.party.pal.defend) {
      dmg = Math.ceil(dmg * 0.5);
      this.party.pal.defend = 0;
    }
    if (t === "ali" && this.party.ali.defend) {
      dmg = Math.ceil(dmg * 0.5);
      this.party.ali.defend = 0;
    }

    this.party[t].hp = Math.max(0, this.party[t].hp - dmg);
    this.print(`${this.enemy.name} наносит урон ${this.party[t].name} (-${dmg}).`);

    // СРАЗУ ПРОВЕРЯЕМ СМЕРТЬ: Если HP 0, не идем в advance, а сразу в lose
    if (this.party[t].hp <= 0) {
      this.refresh();
      return this.lose();
    }

    this.advance();
  }

  advance() {
    // Если кто-то уже мертв, останавливаем цикл ходов
    if (this.party.pal.hp <= 0 || this.party.ali.hp <= 0) return;

    this.refresh();
    this.ti = (this.ti + 1) % this.turnOrder.length;
    this.time.delayedCall(120, () => this.nextTurn());
  }

  win() {
    this.print("Победа!");
    this.time.delayedCall(450, () => this.scene.start('Info', { chapter: this.chapter, win: true }));
  }

  lose() {
    // ОСТАНОВКА ВСЕХ СОБЫТИЙ: Чтобы таймеры из advance не вызвали следующий ход
    this.time.removeAllEvents();

    const fallen = this.party.pal.hp <= 0 ? this.party.pal.name : this.party.ali.name;
    this.print(`${fallen} пал... Код реальности рассыпается.`);
    this.print("ПОРАЖЕНИЕ. Коля и Алиса проиграли. Мир погружается во тьму. Вам поможет только перезапуск игры, будьте внимательнее в разговоре с поваром...");

    // Переход в MenuScene через 2 секунды
    this.time.delayedCall(2000, () => {
      this.scene.start('MenuScene'); 
    });
  }
}

window.BattleScene = BattleScene;
