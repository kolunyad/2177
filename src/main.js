(function(){
  const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    backgroundColor: '#0b0f14',
    pixelArt: true,
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: [
      BootScene, MenuScene, PrologueScene,
      ConversationScene, OverworldScene, DialogueScene,
      BattleScene, InfoScene, FinaleScene
    ],
  };

  const game = new Phaser.Game(config);

  // Force focus for keyboard input
  setTimeout(() => {
    const canvas = game.canvas;
    if (!canvas) return;
    canvas.setAttribute('tabindex','0');
    canvas.style.outline='none';
    canvas.focus();
    canvas.addEventListener('pointerdown', () => canvas.focus());
    window.addEventListener('click', () => canvas.focus());
  }, 0);
})();