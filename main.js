// Phaser game configuration
const config = {
    type: Phaser.AUTO, // Auto-detect WebGL or Canvas
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#34495e',
    scene: [GameScene], // The game scene(s)
    scale: {
        mode: Phaser.Scale.FIT, // Scale to fit container while maintaining aspect ratio
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Create and start the game
const game = new Phaser.Game(config);
