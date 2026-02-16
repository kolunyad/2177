class ConversationScene extends Phaser.Scene {
  constructor(){ super('Conversation'); }

  init(data){
    this.chapter = data.chapter;
    this.kind = data.kind;
  }

  introKey(){ return `chapter${this.chapter}_intro`; }
  introFile(){ return `assets/images/chapter${this.chapter}_intro.png`; }

  ensureIntroLoaded(onDone){
    const key = this.introKey();
    if (this.textures.exists(key)) { onDone(); return; }

    this.load.image(key, this.introFile());
    this.load.once('complete', onDone);
    this.load.start();
  }

  fitCover(img, w, h){
    const tex = this.textures.get(img.texture.key);
    const src = tex && tex.getSourceImage ? tex.getSourceImage() : null;
    if (!src) {
      img.setOrigin(0.5).setPosition(w/2, h/2).setDisplaySize(w, h);
      return;
    }
    const s = Math.max(w/src.width, h/src.height);
    img.setOrigin(0.5);
    img.setPosition(w/2, h/2);
    img.setDisplaySize(Math.ceil(src.width*s), Math.ceil(src.height*s));
  }

  // БЕЛЫЙ текст + ЧЁРНАЯ обводка (и лёгкая тень для читаемости на ярком фоне)
  applyOutlinedWhite(t){
    return t
      .setColor('#ffffff')
      .setStroke('#000000', 5)
      .setShadow(0, 2, '#000000', 6, true, true);
  }

  create(){
    const { width, height } = this.scale;
    const ch = Script.chapters[this.chapter];

    this.ensureIntroLoaded(() => {
      // ===== BACKGROUND (во весь экран) =====
      const bg = this.add.image(width/2, height/2, this.introKey());
      this.fitCover(bg, width, height);

      const margin = 40;

      // ===== BASE STYLE =====
      const baseStyle = {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        wordWrap: { width: width - margin*2 },
        lineSpacing: 6
      };

      // ===== TEXTS =====
      const texts = [];

      const title = this.add.text(0, 0, ch.name, {
        ...baseStyle,
        fontFamily: 'Arial Black',
        fontSize: '28px'
      });
      this.applyOutlinedWhite(title);
      texts.push(title);

      const intro = this.add.text(0, 0, ch.locationIntro.join('\n\n'), baseStyle);
      this.applyOutlinedWhite(intro);
      texts.push(intro);

      if (this.kind === 'couple') {
        const lines = ch.coupleTalk.map(l => `${l.speaker}: ${l.text}`).join('\n\n');
        const talk = this.add.text(0, 0, lines, baseStyle);
        this.applyOutlinedWhite(talk);
        texts.push(talk);
      }

      const hint = this.add.text(0, 0, 'ENTER или клик — продолжить путь', {
        ...baseStyle,
        fontSize: '16px'
      });
      this.applyOutlinedWhite(hint);
      texts.push(hint);

      // ===== LAYOUT (без чёрной панели) =====
      const gap = 14;
      const padBottom = 26;

      // считаем высоту контента
      let contentH = 0;
      for (const t of texts) contentH += t.height + gap;
      contentH -= gap;

      // ставим блок снизу, но чтобы точно влезал
      // если текста очень много — сдвигаем вверх
      let y = Math.max(20, height - (contentH + padBottom));

      for (const t of texts) {
        t.setPosition(margin, y);
        y += t.height + gap;
      }

      // ===== NAVIGATION =====
      const go = () => {
        if (this.chapter <= 3) this.scene.start('Overworld', { chapter: this.chapter });
        else this.scene.start('Dialogue', { chapter: 4, phase: 'boss_pre' });
      };

      this.input.keyboard.once('keydown-ENTER', go);
      this.input.once('pointerdown', go);
    });
  }
}
