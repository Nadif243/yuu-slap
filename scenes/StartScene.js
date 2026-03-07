class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        // Load background for start screen
        this.load.image('background', 'assets/images/background.png');
        this.load.image('character-idle-1', 'assets/images/character-idle-1.png');
    }

    create() {
        // ===== BACKGROUND =====
        const bg = this.add.image(640, 360, 'background');
        bg.setDisplaySize(1280, 720);

        // ===== CHARACTER (static, no animation) =====
        const scale = 720 / 927;
        const character = this.add.image(842, 360, 'character-idle-1');
        character.setScale(scale);

        // Load high score
        const highScore = parseInt(localStorage.getItem('slapGameHighScore')) || 0;

        // ===== TITLE =====
        const title = this.add.text(640, 200, 'SLAP GAME', {
            fontSize: '72px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8
        });
        title.setOrigin(0.5);

        // ===== SUBTITLE =====
        if (highScore > 0) {
            this.add.text(640, 280, `High Score: ${highScore}`, {
                fontSize: '32px',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
        }

        // ===== INSTRUCTION =====
        const instruction = this.add.text(640, 500, 'Click anywhere to start', {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        });
        instruction.setOrigin(0.5);

        // Pulsing animation on instruction text
        this.tweens.add({
            targets: instruction,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // ===== START GAME ON ANY INPUT =====
        this.input.on('pointerdown', () => this.startGame());
        this.input.keyboard.on('keydown', () => this.startGame());
    }

    startGame() {
        // Fade out and switch to game scene
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene');
        });
    }
}
