class BootScene extends Phaser.Scene {
  constructor(){ super('Boot'); }
  preload(){
    this.load.setPath('assets/images');
    this.load.image('intro_bg', 'intro_bg.png');
  }
  create(){ this.scene.start('Menu'); }
}