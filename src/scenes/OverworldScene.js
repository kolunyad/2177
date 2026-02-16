class OverworldScene extends Phaser.Scene {
  constructor(){ super('Overworld'); }
  init(data){ this.chapter = data.chapter || 1; }

  // ---------- ASSET MAP ----------
  assetMap(){
    const ch = this.chapter;

    return {
      bgKey: `bg_ch${ch}`,
      bgFile: `assets/pixel/bg_ch${ch}.png`,         // <-- фон карты

      kolyaKey: 'ch_kolya',
      kolyaFile: 'assets/pixel/ch_kolya.png',

      aliceKey: 'ch_alice',
      aliceFile: 'assets/pixel/ch_alice.png',

      // NPC (можно рисовать разные под каждую главу)
      npcMainKey: `npc_main_ch${ch}`,
      npcMainFile: `assets/pixel/npc_main_ch${ch}.png`,

      npcExtra0Key: `npc_extra0_ch${ch}`,
      npcExtra0File: `assets/pixel/npc_extra0_ch${ch}.png`,

      npcExtra1Key: `npc_extra1_ch${ch}`,
      npcExtra1File: `assets/pixel/npc_extra1_ch${ch}.png`,
    };
  }

  ensureLoaded(list, onDone){
    const toLoad = [];
    for (const it of list){
      if (!this.textures.exists(it.key)) toLoad.push(it);
    }
    if (toLoad.length === 0) { onDone(); return; }

    for (const it of toLoad) this.load.image(it.key, it.file);
    this.load.once('complete', onDone);
    this.load.start();
  }

  // NEAREST для пиксель-арта (без размытия)
  setNearest(keys){
    for (const key of keys){
      const tex = this.textures.get(key);
      if (tex) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }

  fitCover(img, w, h){
    const tex = this.textures.get(img.texture.key);
    const src = tex && tex.getSourceImage ? tex.getSourceImage() : null;
    if (!src) { img.setDisplaySize(w, h); return; }
    const s = Math.max(w/src.width, h/src.height);
    img.setDisplaySize(Math.ceil(src.width*s), Math.ceil(src.height*s));
    img.setPosition(w/2, h/2);
    img.setOrigin(0.5, 0.5);
  }

  create(){
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x05080d);
    this.cameras.main.setRoundPixels(true);

    const chData = Script.chapters[this.chapter];
    const A = this.assetMap();

    const needed = [
      { key: A.bgKey, file: A.bgFile },
      { key: A.kolyaKey, file: A.kolyaFile },
      { key: A.aliceKey, file: A.aliceFile },
      { key: A.npcMainKey, file: A.npcMainFile },
      { key: A.npcExtra0Key, file: A.npcExtra0File },
      { key: A.npcExtra1Key, file: A.npcExtra1File },
    ];

    this.ensureLoaded(needed, () => {
      // пиксельный фильтр
      this.setNearest(needed.map(x => x.key));

      // ====== BACKGROUND MAP ======
      const bg = this.add.image(width/2, height/2, A.bgKey).setDepth(0);
      this.fitCover(bg, width, height);

      // ====== HEADER ======
      this.add.rectangle(width/2, 44, width-60, 64, 0x0f1720, 0.95).setStrokeStyle(2, 0x2b455a);
      this.add.text(60, 28, chData.name, { fontFamily:'Arial Black', fontSize:'22px', color:'#b6ffea' });

      // ====== PLAYER PHYSICS (невидимый) ======
      this.player = this.physics.add.sprite(200, 320, null);
      this.player.body.setSize(18, 24);
      this.player.body.setCollideWorldBounds(true);
      this.physics.world.setBounds(0, 0, width, height);

      // ====== PIXEL CHARACTERS ======
      // Подгоните scale под размер ваших PNG (обычно 2-4)
      this.charScale = 3;

      // Коля (визуал)
      this.kolya = this.add.image(this.player.x, this.player.y, A.kolyaKey)
        .setOrigin(0.5, 1)
        .setScale(this.charScale)
        .setDepth(10);

      // Алиса (визуал, чуть позади)
      this.alice = this.add.image(this.player.x - 26, this.player.y + 6, A.aliceKey)
        .setOrigin(0.5, 1)
        .setScale(this.charScale)
        .setDepth(9);

      // ====== NPCs (visual + positions) ======
      const npcDefs = [
        { name: (chData.npc && chData.npc.name) ? chData.npc.name : "Цель", phase: 'npc',    x: 960, y: 320, key: A.npcMainKey },
        { name: chData.extraNpcs?.[0]?.name || 'Горожанин', phase: 'extra_0', x: 450, y: 320, key: A.npcExtra0Key },
        { name: chData.extraNpcs?.[1]?.name || 'Горожанка', phase: 'extra_1', x: 960, y: 620, key: A.npcExtra1Key },
      ];

      this.npcs = npcDefs.map(n => {
        const sprite = this.add.image(n.x, n.y, n.key)
          .setOrigin(0.5, 1)
          .setScale(this.charScale)
          .setDepth(10);

        const label = this.add.text(n.x-90, n.y+18, n.name, {
          fontFamily:'Arial', fontSize:'14px', color:'#ffffff'
        }).setStroke('#000000', 4);

        label.setDepth(50);
        return { ...n, sprite, label };
      });

      // ====== INPUT ======
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        E: Phaser.Input.Keyboard.KeyCodes.E,
      });

      this.hint = this.add.text(60, height-40, 'Ищите людей и знаки. WASD/стрелки — движение.', {
        fontFamily:'Arial', fontSize:'16px', color:'#ffffff'
      }).setStroke('#000000', 4).setShadow(0,2,'#000000',6,true,true);
      this.hint.setDepth(80);

      // фокус на канвас
      this.game.canvas?.setAttribute('tabindex','0');
      this.game.canvas?.focus();
    });
  }

  update(){
    if (!this.player || !this.player.body) return;

    const speed = 170;
    let vx = 0, vy = 0;

    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;

    if (left) vx = -speed;
    else if (right) vx = speed;
    if (up) vy = -speed;
    else if (down) vy = speed;
    if (vx !== 0 && vy !== 0) { vx *= 0.7071; vy *= 0.7071; }

    this.player.body.setVelocity(vx, vy);

    // визуальные персонажи следуют за физическим игроком
    if (this.kolya){
      this.kolya.x = this.player.x;
      this.kolya.y = this.player.y;
    }
    if (this.alice){
      this.alice.x += (this.player.x - 26 - this.alice.x) * 0.12;
      this.alice.y += (this.player.y +  6 - this.alice.y) * 0.12;
    }

    // ближайший NPC
    let best = null;
    for (const n of (this.npcs || [])) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, n.x, n.y);
      if (d < 70 && (!best || d < best.d)) best = { n, d };
    }

    if (best) {
      this.hint.setText('Нажмите E — разговор');
      if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
        this.scene.start('Dialogue', { chapter: this.chapter, phase: best.n.phase });
      }
    } else {
      this.hint.setText('Ищите людей и знаки. WASD/стрелки — движение.');
    }
  }
}
