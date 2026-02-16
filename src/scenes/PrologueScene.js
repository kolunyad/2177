class PrologueScene extends Phaser.Scene {
  constructor() { 
    super('Prologue'); 
  }

  preload() {
    // Загружаем картинку
    this.load.image('intro_b1', 'assets/images/intro_b1.png'); // Убедитесь, что путь к файлу правильный
  }

  create() {
    const { width, height } = this.scale;
    const bg = this.add.image(width / 2, height / 2, 'intro_b1'); // Используем правильный ключ

    // Убираем растягивание и затемнение
    bg.setOrigin(0.5, 0.5);  // Устанавливаем центр изображения в середину экрана
    // Выводим текст
    const p = Script.prologue;
    this.add.text(60, 50, p.title, { fontFamily: 'Arial Black', fontSize: '30px', color: '#b6ffea' });
    this.add.text(60, 110, p.text.join('\n\n'), {
      fontFamily: 'Arial', fontSize: '18px', color: '#d7f3ff', wordWrap: { width: width - 120 }
    });

    const go = () => this.scene.start('Conversation', { chapter: 1, kind: 'couple' });
    this.add.text(60, height - 60, 'ENTER или клик — вглубь ночи', {
      fontFamily: 'Arial', fontSize: '16px', color: '#93b8c7'
    });
    this.input.keyboard.once('keydown-ENTER', go);
    this.input.once('pointerdown', go);
  }
}
