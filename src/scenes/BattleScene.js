class BattleScene extends Phaser.Scene {

  constructor() {

    super('Battle');

  }



  init(data) {

    this.chapter = data.chapter; // Номер главы (передаем при запуске сцены)

    this.bgKey = `bgb_ch${this.chapter}`; // Создаем ключ для фона

    this.bgFile = `assets/pixel/bgb_ch${this.chapter}.png`; // Путь к фону

  }



  preload() {

    this.load.image(this.bgKey, this.bgFile); // Загружаем фон для сцены

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
    const scale = Math.min(width / bg.width, availableH / bg.height);
    bg.setScale(scale);

    // Панели
    this.add.rectangle(width / 2, topBarH / 2, width, topBarH, 0x0f1720, 1).setStrokeStyle(2, 0x2b455a);
    this.add.rectangle(width / 2, height - (bottomBarH / 2), width, bottomBarH, 0x0f1720, 1).setStrokeStyle(2, 0x2b455a);

    const ch = Script.chapters[this.chapter];
    const enemyDef = (this.chapter === 4) ? ch.boss : ch.enemy;

    this.add.text(60, 28, ch.name + " — Битва", {

      fontFamily: 'Arial Black',

      fontSize: '20px',

      color: '#ffffff',  // Белый цвет текста

      stroke: '#000000', // Черная обводка

      strokeThickness: 3 // Толщина обводки

    });



    this.log = this.add.text(60, 110, "", {

      fontFamily: 'Arial',

      fontSize: '16px',

      color: '#ffffff',  // Белый цвет текста

      stroke: '#000000', // Черная обводка

      strokeThickness: 3, // Толщина обводки

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



    // Нижняя панель

    this.add.rectangle(width / 2, height - 70, width - 60, 120, 0x0f1720, 0.95).setStrokeStyle(2, 0x2b455a);

    this.cmd = this.add.text(60, height - 120, "", { fontFamily: 'Arial', fontSize: '16px', color: '#d7f3ff' });

    this.stats = this.add.text(60, 80, "", { fontFamily: 'Arial', fontSize: '16px', color: '#d7f3ff' });



    // Очередь ходов

    this.turnOrder = ["ali", "pal", "enemy"];

    this.ti = 0;

    this.waiting = false;



    // Старая комбо-связка (ward->firewall) оставим, но она теперь необязательна

    this.lastSkill = null;



    // Комбо "Три медитации" (требует щит Коли)

    this.meditationStack = 0;      // сколько подряд медитаций Алисы

    this.meditationArmed = false;  // готов ли финальный взрыв (следующий "1" Алисы)

    this.mustGuard = false;        // пока Алиса в комбо-ритме, Коля должен ставить щит



    this.print("Ночь сгущается, превращаясь в осязаемый холод. Вы с Алисой становитесь плечом к плечу — так, как было предначертано.");

    this.refresh();

    this.nextTurn();



    // Ввод 1-3

    this.input.keyboard.on('keydown', (e) => {

      if (!this.waiting) return;

      if (e.key === "1") this.act("1");

      if (e.key === "2") this.act("2");

      if (e.key === "3") this.act("3");

    });

  }



  // Утилита: ограничение обычного урона по боссу

  applyDamageToEnemy(baseDmg, isNormalHit) {

    let dmg = baseDmg;

    if (this.chapter === 4 && isNormalHit) dmg = 1; // босс: обычные атаки по 1

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

    if (this.party.pal.hp <= 0 && this.party.ali.hp <= 0) return this.lose();



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



    // --- АЛИСА ---

    if (who === "ali") {



      // 1) Урон (или супер-удар, если комбо заряжено)

      if (k === "1") {

        if (this.meditationArmed) {

          // супер-удар: добивает ВСЕГДА (в т.ч. босса)

          this.enemy.hp = 0;

          this.meditationArmed = false;

          this.meditationStack = 0;

          this.mustGuard = false;



          this.print("АЛИСА: «КОД СХОДИТСЯ». Три хода тишины превращаются в приговор монстру — вспышка стирает врага из кода мира.");

          return this.advance();

        }



        if (this.party.ali.mp < 5) { this.print("Потоки маны иссякли."); return; }

        this.party.ali.mp -= 5;



        const dmg = this.applyDamageToEnemy(12, true); // обычный удар -> по боссу станет 1

        this.print(`Алиса: «Да сгорит всё лишнее!» Заклинание врезается в цель (-${dmg}).`);



        // любое НЕ-медитативное действие сбрасывает стек

        this.meditationStack = 0;

        this.mustGuard = false;

      }



      // 2) Исцеление Коли

      if (k === "2") {

        if (this.party.ali.mp < 6) { this.print("Потоки маны иссякли."); return; }

        this.party.ali.mp -= 6;



        const heal = 18;

        const before = this.party.pal.hp;

        this.party.pal.hp = Math.min(70, this.party.pal.hp + heal);

        const realHeal = this.party.pal.hp - before;



        this.print(`Алиса: «Debug. Лечу его боль.» Коля восстанавливает ${realHeal} HP.`);



        // хил сбрасывает стек (иначе слишком имба)

        this.meditationStack = 0;

        this.mustGuard = false;

      }



      // 3) Медитация (стек)

      if (k === "3") {

        this.party.ali.defend = 1; // пол-урона по Алисе на следующий входящий удар

        this.party.ali.mp = Math.min(35, this.party.ali.mp + 3);



        this.meditationStack += 1;

        this.mustGuard = true;



        if (this.meditationStack < 3) {

          this.print(`Алиса уходит в глубокий просчет (${this.meditationStack}/3). «Т и ш и н а»`);

          this.print("Условие: Коля должен держать Покров Стража каждый свой ход, пока просчет не завершён.");

        } else {

          this.meditationArmed = true;

          this.print("АЛИСА: «ГОТОВО». Третий цикл замкнут — следующий удар Алисы станет финалом.");

          // щит нужен до её удара, иначе удар по Алисе может сбить

          this.mustGuard = true;

        }

      }

    }



    // --- КОЛЯ ---

    if (who === "pal") {

      if (k === "1") {

        const dmg = this.applyDamageToEnemy(12, true); // обычный удар -> по боссу станет 1

        this.print(`Коля: «Свет не знает преград!» Удар, очищенный от сомнений (-${dmg}).`);

        this.checkCombo("holy");

      }



      if (k === "2") {

        if (this.party.pal.mp < 4) { this.print("Дух требует тишины."); return; }

        this.party.pal.mp -= 4;



        // щит на один перехват (чтобы реально требовался каждый ход)

        this.party.pal.guard = 1;



        this.print("Коля: «Я твой щит. Верь мне». Он закрывает Алису собой, принимая ярость на свою грудь.");



        if (this.mustGuard) {

          this.print("Покров Стража активен: Коля удерживает купол, пока Алиса завершает просчет.");

        }



        this.checkCombo("ward");

      }



      if (k === "3") {

        this.party.pal.defend = 1;

        this.print("Коля концентрирует волю: его дух становится непроницаемым.");

      }



      // Если Алиса в комбо-режиме и Коля НЕ поставил щит — комбо рушится

      if (this.mustGuard && k !== "2") {

        this.meditationStack = 0;

        this.meditationArmed = false;

        this.mustGuard = false;

        this.print("Комбо сорвано: Коля не удержал щит, и просчет Алисы рассыпался в шум.");

      }

    }



    this.advance();

  }



  checkCombo(skill) {

    // Оставляем вашу старую связку ward -> firewall, но теперь у Алисы нет firewall,

    // так что комбо не сработает, пока вы не захотите добавить отдельный скилл.

    this.lastSkill = skill;

  }



  enemyTurn() {

    // Горение

    if (this.enemy.burn > 0) {

      this.enemy.hp -= 6;

      this.enemy.burn -= 1;

      this.print("Истинное пламя выжигает 6 единиц сути врага.");

      if (this.enemy.hp <= 0) return this.win();

    }



    // Враг атакует КАЖДЫЙ ход

    const t0 = Math.random() < 0.5 ? "pal" : "ali";

    let t = t0;



    // Покров Стража: если удар летит в Алису — Коля перехватывает

    if (t === "ali" && this.party.pal.guard > 0 && this.party.pal.hp > 0) {

      this.party.pal.guard -= 1;

      t = "pal";

      this.print("Покров Стража: Коля перехватывает чужую боль, заслоняя Алису!");

    } else {

      // Если удар реально проходит по Алисе во время комбо — комбо рушится

      if (t === "ali" && this.mustGuard) {

        this.meditationStack = 0;

        this.meditationArmed = false;

        this.mustGuard = false;

        this.print("Удар сбивает Алису с ритма. Просчет обрывается, как строка кода под багом.");

      }

    }



    const baseDmg = (this.chapter === 4) ? 18 : 14;

    let dmg = baseDmg;



    // Стойкость / Защита

    if (t === "pal" && this.party.pal.defend) {

      dmg = Math.ceil(dmg * 0.5);

      this.party.pal.defend = 0;

      this.print("Стойкость превращает удар в пустой звук.");

    }

    if (t === "ali" && this.party.ali.defend) {

      dmg = Math.ceil(dmg * 0.5);

      this.party.ali.defend = 0;

    }



    this.party[t].hp = Math.max(0, this.party[t].hp - dmg);

    this.print(`${this.enemy.name} ${t === "pal" ? "обрушивает гнев на Колю" : "пытается ранить Алису"} (-${dmg}).`);



    this.advance();

  }



  advance() {

    this.refresh();

    this.ti = (this.ti + 1) % this.turnOrder.length;

    this.time.delayedCall(120, () => this.nextTurn());

  }



  win() {

    this.print("Победа. Мир снова обрел равновесие, пока вы рядом.");

    this.time.delayedCall(450, () => this.scene.start('Info', { chapter: this.chapter, win: true }));

  }



  lose() {

    this.print("Поражение. В этой итерации мы проиграли… пора переписать код судьбы.");

    this.time.delayedCall(450, () => this.scene.start('Info', { chapter: this.chapter, win: false }));

  }

}



window.BattleScene = BattleScene;