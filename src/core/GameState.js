(function(global){
  const GameState = {
    chapter: 1,
    flags: {},
    affinity: 0,
    reset(){
      this.chapter = 1;
      this.flags = {};
      this.affinity = 0;
    }
  };
  global.GameState = GameState;
})(window);