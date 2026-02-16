class MenuScene extends Phaser.Scene {
  constructor(){ super('Menu'); }
  create(){
    const { width, height } = this.scale;
    const bg = this.add.image(width/2, height/2, 'intro_bg');
    bg.setDisplaySize(width, height);
    this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.55);

        this.add.text(width/2, height/2 - 110, 'ИЗУМРУДНЫЙ КОД', {
      fontFamily:'Arial Black', fontSize:'44px', color:'#b6ffea'
    }).setOrigin(0.5);
        this.add.text(width/2, height/2 - 60, 'Бангкок 2177', {
      fontFamily:'Arial', fontSize:'20px', color:'#93b8c7'
    }).setOrigin(0.5);

    const btn = this.add.rectangle(width/2, height/2 + 40, 320, 56, 0x14202b, 0.95)
      .setStrokeStyle(2, 0x2e4a5f).setInteractive({ useHandCursor:true });
    this.add.text(width/2, height/2 + 40, 'ПРИНЯТЬ КОНТРАКТ', {
      fontFamily:'Arial Black', fontSize:'20px', color:'#d7f3ff'
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(0x1a2a37, 0.95));
    btn.on('pointerout', () => btn.setFillStyle(0x14202b, 0.95));
    btn.on('pointerdown', () => { GameState.reset(); this.scene.start('Prologue'); });

    this.add.text(width/2, height - 24, 'WASD/стрелки — управление, E — действие, 1-3 — атака или защита в бою', {
      fontFamily:'Arial', fontSize:'14px', color:'#6f93a3'
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => this.game.canvas?.focus());
  }
}