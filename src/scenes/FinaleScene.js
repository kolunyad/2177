class FinaleScene extends Phaser.Scene {
  constructor(){ 
    super('Finale'); 
  }

  preload() {
    // Загружаем изображение для финальной сцены
    this.load.image('intro_bg3', 'assets/images/intro_bg3.png');
  }

  create(){
    const { width, height } = this.scale;

    // Загружаем изображение intro_bg3 без растяжения и затемнения
    const bg = this.add.image(width / 2, height / 2, 'intro_bg3');
    bg.setOrigin(0.5, 0.5); // Центрируем изображение по экрану

    // Убираем прямоугольник с затемнением

    // Добавляем текст
    this.add.text(60, 60, "Цикл завершен", { fontFamily:'Arial Black', fontSize:'34px', color:'#b6ffea' });
    this.add.text(60, 120, Script.chapters[4].finale.text.join("\n\n"), {
      fontFamily:'Arial', fontSize:'18px', color:'#d7f3ff', wordWrap:{ width: width - 120 }
    });

    // Кнопка "Вернуться к истокам"
    const btn = this.add.rectangle(width / 2, height - 70, 320, 56, 0x14202b, 0.95)
      .setStrokeStyle(2, 0x2e4a5f).setInteractive({ useHandCursor:true });
    this.add.text(width / 2, height - 70, "Вернуться к истокам", { fontFamily:'Arial Black', fontSize:'20px', color:'#d7f3ff' }).setOrigin(0.5);

    btn.on('pointerdown', () => this.scene.start('Menu'));
  }
}

window.FinaleScene = FinaleScene;
