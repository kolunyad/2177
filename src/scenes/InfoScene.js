class InfoScene extends Phaser.Scene {
  constructor() {
    super('Info');
  }

  init(data) {
    this.chapter = data.chapter;
    this.win = data.win;
  }

  preload() {
    const images = {
      1: 'assets/images/after_battle_1.png',
      2: 'assets/images/after_battle_2.png',
      3: 'assets/images/after_battle_3.png',
      4: 'assets/images/after_battle_4.png',
    };

    if (images[this.chapter]) {
      this.load.image(`bg_${this.chapter}`, images[this.chapter]);
    }
  }

  create() {
    const { width, height } = this.scale;

    // --- 1. ФОНОВАЯ КАРТИНКА ---
    if (this.textures.exists(`bg_${this.chapter}`)) {
      this.add.image(width / 2, height / 2, `bg_${this.chapter}`)
        .setDisplaySize(width, height); // Растягивает ровно по границам экрана
    } else {
      // Если картинка не загрузилась, просто темный фон
      this.add.rectangle(width / 2, height / 2, width, height, 0x060a10, 1);
    }

    // --- 2. ЗАТЕМНЯЮЩИЙ СЛОЙ (Overlay) ---
    // Это важно, чтобы текст оставался читаемым на любом фоне
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

    // --- 3. ЗАГОЛОВОК ---
    const ch = Script.chapters[this.chapter];
    const title = (this.chapter < 4) ? ch.after.title : Script.chapters[4].finale.title;

    // Плашка заголовка
    this.add.rectangle(width / 2, 44, width - 60, 64, 0x0f1720, 0.9)
      .setStrokeStyle(2, 0x2b455a);
    
    this.add.text(60, 28, title, { 
      fontFamily: 'Arial Black', fontSize: '22px', color: '#b6ffea' 
    });

    // --- 4. ОСНОВНОЙ ТЕКСТ ---
    const lines = (this.chapter < 4) ? ch.after.text : Script.chapters[4].finale.text;
    
    // Добавляем текст. wordWrap автоматически перенесет строки по ширине.
    this.add.text(60, 120, lines.join('\n\n'), {
      fontFamily: 'Arial', 
      fontSize: '18px', 
      color: '#d7f3ff', 
      wordWrap: { width: width - 120 },
      lineSpacing: 8 // Немного увеличим межстрочный интервал для красоты
    });

    // --- 5. КНОПКА (Всегда сверху) ---
    const label = (this.chapter < 4) ? "Следовать дальше" : "Оставить след";
    const btnY = height - 70;
    
    const btn = this.add.rectangle(width / 2, btnY, 280, 56, 0x14202b, 0.95)
      .setStrokeStyle(2, 0x2e4a5f).setInteractive({ useHandCursor: true });
    
    this.add.text(width / 2, btnY, label, { 
      fontFamily: 'Arial Black', fontSize: '20px', color: '#d7f3ff' 
    }).setOrigin(0.5);

    // Логика перехода
    const go = () => {
      if (this.chapter < 4) this.scene.start('Conversation', { chapter: this.chapter + 1, kind: 'couple' });
      else this.scene.start('Finale');
    };

    btn.on('pointerdown', go);
    this.input.keyboard.once('keydown-ENTER', go);
  }
}

window.InfoScene = InfoScene;