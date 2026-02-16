class DialogueScene extends Phaser.Scene {
  constructor(){ super('Dialogue'); }
  init(data){ this.chapter = data.chapter; this.phase = data.phase; this.idx = 0; }

  // --- 1) speaker -> key ---
  portraitKeyForSpeaker(speaker){
    const s = (speaker || '').trim();
    const map = {
      "Коля": "portrait_kolya",
      "Коля, шепотом": "portrait_kolya",
      "Алиса": "portrait_alice",
      "Монах отворачивается. Коля говорит Алисе": "portrait_kolya",
      "Коля и Алиса вместе": "portrait_kolya_alice",
      "Коля, шепотом": "portrait_kolya",

      "Информатор": "portrait_informator",
      "Тревожный мужик": "portrait_informator",

      "Повар": "portrait_chef",
      "Повар резко меняется в лице и становится адекватным": "portrait_chef",
      "Повар в обычном состоянии": "portrait_chef_1",

      "Водитель": "portrait_driver",
      "Водитель тук-тука": "portrait_driver",

      "Торговец": "portrait_merchant",
      "Продавец": "portrait_tea",
      "Продавец разной ерунды": "portrait_merchant",
      "Монах": "portrait_monk",
      "Продавец чая": "portrait_tea",

      "Хакер": "portrait_hacker",
      "Охранник": "portrait_guard",
      "Официантка": "portrait_waitress",
      "Хакер, который начинает превращаться в демона": "portrait_hacker",

      "Старая плита на стене": "portrait_slab",
      "Записка": "portrait_note",

      "Пожиратель Кода": "portrait_boss",
      "Пожиратель мира": "portrait_boss",

      "Система": "portrait_system",
    };
    return map[s] || "portrait_system";
  }

  // --- 2) key -> file ---
  portraitFileForKey(key){
    const files = {
      portrait_kolya: "assets/images/portrait_kolya.png",
      portrait_alice: "assets/images/portrait_alice.png",
      portrait_kolya_alice: "assets/images/portrait_kolya_alice.png",

      portrait_informator: "assets/images/portrait_informator.png",
      portrait_chef: "assets/images/portrait_chef.png",
      portrait_chef_1: "assets/images/portrait_chef_1.png", // <-- ВАЖНО: запятая была пропущена у вас
      portrait_driver: "assets/images/portrait_driver.png",

      portrait_merchant: "assets/images/portrait_merchant.png",
      portrait_monk: "assets/images/portrait_monk.png",
      portrait_tea: "assets/images/portrait_tea.png",

      portrait_hacker: "assets/images/portrait_hacker.png",
      portrait_guard: "assets/images/portrait_guard.png",
      portrait_waitress: "assets/images/portrait_waitress.png",

      portrait_slab: "assets/images/portrait_slab.png",
      portrait_note: "assets/images/portrait_note.png",

      portrait_boss: "assets/images/portrait_boss.png",
      portrait_system: "assets/images/portrait_system.png",
    };
    return files[key] || files.portrait_system;
  }

  // --- 3) load missing textures on demand ---
  ensurePortraitsLoaded(neededKeys, onDone){
    const toLoad = [];
    for (const key of neededKeys) {
      if (!this.textures.exists(key)) toLoad.push(key);
    }
    if (toLoad.length === 0) { onDone(); return; }

    for (const key of toLoad) {
      this.load.image(key, this.portraitFileForKey(key));
    }

    this.load.once('complete', () => onDone());
    this.load.start();
  }

  create(){
    const { width, height } = this.scale;

    // фон + затемнение
    this.cameras.main.setBackgroundColor('#05080d');
    this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.55);

    this.lines = this.getLines();

    // какие портреты нужны в диалоге
    const needed = new Set(["portrait_system"]);
    for (const ln of this.lines) needed.add(this.portraitKeyForSpeaker(ln.speaker));

    this.ensurePortraitsLoaded([...needed], () => {
      this.buildUI();
      this.showLine();

      this.input.keyboard.on('keydown-ENTER', () => this.next());
      this.input.on('pointerdown', () => this.next());
    });
  }

  buildUI(){
    const { width, height } = this.scale;

    // ---- Нижний блок диалога ----
    this.box = {
      w: width - 80,
      h: 230,
      x: Math.floor(width/2),
      y: Math.floor(height - 120)
    };

    this.add.rectangle(this.box.x, this.box.y, this.box.w, this.box.h, 0x0f1720, 0.95)
      .setStrokeStyle(2, 0x2b455a);

    this.speakerText = this.add.text(80, this.box.y - this.box.h/2 + 18, '', {
      fontFamily:'Arial Black', fontSize:'18px', color:'#b6ffea'
    });

    this.bodyText = this.add.text(80, this.box.y - this.box.h/2 + 54, '', {
      fontFamily:'Arial', fontSize:'18px', color:'#d7f3ff',
      wordWrap:{ width: width - 160 }
    });

    this.add.text(80, this.box.y + this.box.h/2 - 34, 'ENTER — дальше', {
      fontFamily:'Arial', fontSize:'16px', color:'#93b8c7'
    });

    // ---- ОДИН портрет: зона 9:16, по центру, ВЛЕЗАЕТ ----
    const safeTop = 24;
    const safeBottom = Math.floor(this.box.y - this.box.h/2) - 18; // верх диалогового окна минус отступ
    const availH = Math.max(140, safeBottom - safeTop);

    // хотим сделать портрет как можно крупнее, но чтобы точно влез:
    // зона 9:16 -> width = height * 9/16
    const maxH = availH;
    const maxW = width - 140;

    // сначала пробуем по высоте
    let h = Math.floor(maxH);
    let w = Math.floor(h * 9 / 16);

    // если по ширине не влезло — поджимаем по ширине
    if (w > maxW) {
      w = Math.floor(maxW);
      h = Math.floor(w * 16 / 9);
    }

    // safety для совсем узких экранов
    w = Math.max(220, w);
    h = Math.max(220, h);

    this.pArea = {
      x: Math.floor(width/2),
      y: Math.floor(safeTop + availH/2),
      w, h
    };

    // рамка
    this.add.rectangle(this.pArea.x, this.pArea.y, this.pArea.w + 18, this.pArea.h + 18, 0x0f1720, 0.92)
      .setStrokeStyle(2, 0x2b455a);

    // единственный портрет
    this.portrait = this.add.image(this.pArea.x, this.pArea.y, 'portrait_system').setOrigin(0.5, 0.5);

    // маска, чтобы картинка не вылезала за рамку (важно для "cover" или крупных картинок)
    const maskGfx = this.make.graphics({ x: 0, y: 0, add: false });
    maskGfx.fillStyle(0xffffff);
    maskGfx.fillRect(this.pArea.x - this.pArea.w/2, this.pArea.y - this.pArea.h/2, this.pArea.w, this.pArea.h);
    this.portrait.setMask(maskGfx.createGeometryMask());

    // по умолчанию — contain (без обрезки)
    this.fitContain(this.portrait, this.pArea);
  }

  getLines(){
    const ch = Script.chapters[this.chapter];

    if (this.phase === 'npc') return ch.npcTalk;
    if (this.phase === 'boss_pre') return ch.bossPre;

    if (typeof this.phase === 'string' && this.phase.startsWith('extra_')) {
      const idx = parseInt(this.phase.split('_')[1] || '0', 10);
      const n = (ch.extraNpcs || [])[idx];
      return n ? n.talk : [{ speaker: 'Система', text: 'Сигнал неустойчив, но истина где-то рядом…' }];
    }

    return [{ speaker: 'Система', text: 'Сигнал неустойчив, но истина где-то рядом…' }];
  }

  // contain: вписать без искажений
  fitContain(img, area){
    const tex = this.textures.get(img.texture.key);
    const src = tex && tex.getSourceImage ? tex.getSourceImage() : null;
    const sw = src ? src.width : img.width;
    const sh = src ? src.height : img.height;

    if (!sw || !sh) { img.setDisplaySize(area.w, area.h); return; }

    const scale = Math.min(area.w / sw, area.h / sh);
    img.setDisplaySize(Math.floor(sw * scale), Math.floor(sh * scale));
    img.setPosition(area.x, area.y);
  }

  showLine(){
    const line = this.lines[this.idx];
    this.speakerText.setText(line.speaker);
    this.bodyText.setText(line.text);

    const key = this.portraitKeyForSpeaker(line.speaker);
    const safeKey = this.textures.exists(key) ? key : "portrait_system";

    this.portrait.setTexture(safeKey);
    this.fitContain(this.portrait, this.pArea);
  }

  next(){
    this.idx++;
    if (this.idx >= this.lines.length) {
      if (typeof this.phase === 'string' && this.phase.startsWith('extra_')) {
        this.scene.start('Overworld', { chapter: this.chapter });
        return;
      }
      this.scene.start('Battle', { chapter: this.chapter });
      return;
    }
    this.showLine();
  }
}
