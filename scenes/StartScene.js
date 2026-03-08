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
        // Disable right-click context menu
        this.input.mouse.disableContextMenu();

        // ===== BACKGROUND =====
        const bg = this.add.image(640, 360, 'background');
        bg.setDisplaySize(1280, 720);

        // ===== CHARACTER (static, no animation) =====
        const scale = 720 / 927;
        const character = this.add.image(842, 360, 'character-idle-1');
        character.setScale(scale);

        // Dark overlay (semi-transparent black)
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6);

        // ===== TITLE =====
        const title = this.add.text(640, 200, 'Yuu-Slap', {
            fontSize: '80px',
            fontFamily: 'Quicksand, sans-serif',
            fontStyle: 'bold',
            color: '#f5c9a5',
            stroke: '#570d44',
            strokeThickness: 8
        });
        title.setOrigin(0.5);

        // ===== INSTRUCTION =====
        const instructionBg = this.add.graphics();
        instructionBg.fillStyle(0x000000, 0.67);
        instructionBg.fillRoundedRect(520, 470, 240, 64, 10);
        const instruction = this.add.text(640, 500, 'Click to start', {
            fontSize: '32px',
            fontFamily: 'Quicksand, sans-serif',
            color: '#ffffff',
            padding: { x: 30, y: 15 }
        });
        instruction.setOrigin(0.5);

        // Pulsing animation on instruction text
        this.tweens.add({
            targets: instruction,
            alpha: 0.4,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // ===== START GAME ON ANY INPUT =====
        this.input.on('pointerdown', () => this.startGame());
        this.input.keyboard.on('keydown', () => this.startGame());
    }

    startGame() {
        // Start fading out
        this.cameras.main.fadeOut(300, 0, 0, 0); // Reduced to 200ms for faster feel

        // Start loading GameScene immediately (parallel)
        this.scene.launch('GameScene'); // Launch instead of start

        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Once fade done, switch to GameScene
            this.scene.stop('StartScene');
            this.scene.bringToTop('GameScene');
        });
    }
}
