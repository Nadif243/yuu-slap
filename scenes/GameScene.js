class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load all assets
        this.load.image('background', 'assets/images/background.png');
        this.load.image('character-idle-1', 'assets/images/character-idle-1.png');
        this.load.image('character-idle-2', 'assets/images/character-idle-1.png'); // Temp: same as idle-1
        this.load.image('cheek-0', 'assets/images/cheek-0.png');
        this.load.image('cheek-1', 'assets/images/cheek-1.png');
        this.load.image('cheek-2', 'assets/images/cheek-2.png');
        this.load.image('cheek-3', 'assets/images/cheek-3.png');
        this.load.image('cheek-4', 'assets/images/cheek-4.png');
        this.load.image('hand-0', 'assets/images/hand-0.png');
        this.load.image('hand-1', 'assets/images/hand-1.png');
        this.load.image('hand-2', 'assets/images/hand-2.png');

        console.log('Loading all assets...');
    }

    create() {
        console.log('GameScene started');

        // ===== GAME STATE =====
        this.score = 0;
        this.clickTimestamps = []; // For APS calculation

        // Load high score from localStorage
        this.highScore = parseInt(localStorage.getItem('slapGameHighScore')) || 0;

        // ===== BACKGROUND =====
        const bg = this.add.image(640, 360, 'background');
        bg.setDisplaySize(1280, 720);

        // ===== CHARACTER BASE =====
        const characterX = 842;
        const characterY = 360;
        const scale = 720 / 927;

        this.characterBase = this.add.image(characterX, characterY, 'character-idle-1');
        this.characterBase.setScale(scale);

        this.characterIdle2 = this.add.image(characterX, characterY, 'character-idle-2');
        this.characterIdle2.setScale(scale);
        this.characterIdle2.setVisible(false);

        this.currentIdleFrame = 1;

        // ===== IDLE ANIMATION (frame swapping) =====
        this.time.addEvent({
            delay: 150,
            callback: () => {
                this.currentIdleFrame = this.currentIdleFrame === 1 ? 2 : 1;
                this.characterBase.setVisible(this.currentIdleFrame === 1);
                this.characterIdle2.setVisible(this.currentIdleFrame === 2);
            },
            loop: true
        });

        // ===== CHEEKS =====
        const cheekX = 630;
        const cheekY = 504;
        const cheekScale = 720 / 927;

        this.cheekFrames = [];
        for (let i = 0; i < 5; i++) {
            const cheek = this.add.image(cheekX, cheekY, `cheek-${i}`);
            cheek.setScale(cheekScale);
            cheek.setVisible(i === 1); // Start with frame 1 (idle)
            this.cheekFrames.push(cheek);
        }

        this.currentCheekFrame = 1;

        // ===== HAND =====
        const handScale = 720 / 927; // Same as character/cheek

        // Create all 3 hand frames, initially hidden
        this.handFrames = [];
        for (let i = 0; i < 3; i++) {
            const hand = this.add.image(0, 0, `hand-${i}`);
            hand.setScale(handScale);
            hand.setVisible(false);
            this.handFrames.push(hand);
        }

        console.log('✓ All visuals loaded');

        // ===== UI ELEMENTS =====
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });

        this.highScoreText = this.add.text(20, 100, `High Score: ${this.highScore}`, {
            fontSize: '20px',
            color: '#aaaaaa',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });

        this.apsText = this.add.text(20, 60, 'APS: 0', {
            fontSize: '24px',
            color: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });

        // ===== DEBUG UI =====
        this.add.text(20, 680, 'Click or press SPACE to slap', {
            fontSize: '16px',
            color: '#aaaaaa',
            backgroundColor: '#000000'
        });

        // ===== SLAP INPUT =====
        this.isSlapping = false; // Flag to prevent spam
        this.spaceKeyPressed = false; // Track if spacebar is held

        // Disable right-click context menu on canvas
        this.input.mouse.disableContextMenu();

        // Mouse/touch input
        this.input.on('pointerdown', () => {
            this.playSlapAnimation();
        });

        // Keyboard input (spacebar)
        this.input.keyboard.on('keydown', () => {
            if (!this.spaceKeyPressed) {
                this.spaceKeyPressed = true;
                this.playSlapAnimation();
            }
        });

        // Reset flag when spacebar released
        this.input.keyboard.on('keyup', () => {
            this.spaceKeyPressed = false;
        });
    }

    // Main slap animation - synchronized hand + cheek
    playSlapAnimation() {
        if (this.isSlapping) return; // Don't allow overlapping animations

        this.isSlapping = true;
        console.log('Slap animation started');

        // Track this slap
        this.score++;
        this.scoreText.setText(`Score: ${this.score}`);
        this.clickTimestamps.push(Date.now());

        // Check if new high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreText.setText(`High Score: ${this.highScore}`);
            localStorage.setItem('slapGameHighScore', this.highScore.toString());
        }

        // Calculate animation speed based on current APS
        const currentAPS = this.calculateAPS();
        const frameDuration = this.calculateFrameDuration(currentAPS);

        console.log(`Slap! Score: ${this.score}, APS: ${currentAPS}, Frame Duration: ${frameDuration}ms`);

        const cheekX = 630;
        const cheekY = 504;

        // FRAME 1: No hand + cheek-0
        this.cheekFrames[this.currentCheekFrame].setVisible(false);
        this.cheekFrames[0].setVisible(true);
        this.currentCheekFrame = 0;

        // FRAME 2: hand-0 (left side, bottom-aligned) + cheek-1
        this.time.delayedCall(frameDuration, () => {
            // Position hand-0: left side of screen, bottom-aligned
            // hand-0 is 350x860, scaled to ~272x669
            const hand0X = 0; // Left edge (will adjust based on anchor)
            const hand0Y = 720; // Bottom of screen

            this.handFrames[0].setOrigin(0, 1); // Bottom-left anchor
            this.handFrames[0].setPosition(hand0X, hand0Y);
            this.handFrames[0].setVisible(true);

            // Cheek frame 1
            this.cheekFrames[0].setVisible(false);
            this.cheekFrames[1].setVisible(true);
            this.currentCheekFrame = 1;
        });

        // FRAME 3: hand-1 (on cheek, right side aligned to cheek, bottom to screen) + cheek-2
        this.time.delayedCall(frameDuration * 2, () => {
            this.handFrames[0].setVisible(false);

            // Position hand-1: right edge aligned to cheek right, bottom to screen
            // hand-1 is 840x490, scaled to ~653x381
            // Cheek is at 630, so align hand's right edge there
            const hand1X = cheekX; // Cheek X position
            const hand1Y = 720; // Bottom of screen

            this.handFrames[1].setOrigin(1, 1); // Bottom-right anchor
            this.handFrames[1].setPosition(hand1X, hand1Y);
            this.handFrames[1].setVisible(true);

            // Cheek frame 2
            this.cheekFrames[1].setVisible(false);
            this.cheekFrames[2].setVisible(true);
            this.currentCheekFrame = 2;
        });

        // FRAME 4: hand-2 (below cheek, bottom to screen) + cheek-3
        this.time.delayedCall(frameDuration * 3, () => {
            this.handFrames[1].setVisible(false);

            // Position hand-2: below cheek, bottom-aligned
            // hand-2 is 380x100, scaled to ~295x78
            const hand2X = cheekX;
            const hand2Y = 720; // Bottom of screen

            this.handFrames[2].setOrigin(0.5, 1); // Bottom-center anchor
            this.handFrames[2].setPosition(hand2X, hand2Y);
            this.handFrames[2].setVisible(true);

            // Cheek frame 3
            this.cheekFrames[2].setVisible(false);
            this.cheekFrames[3].setVisible(true);
            this.currentCheekFrame = 3;
        });

        // FRAME 5: No hand + cheek-4
        this.time.delayedCall(frameDuration * 4, () => {
            this.handFrames[2].setVisible(false);

            // Cheek frame 4
            this.cheekFrames[3].setVisible(false);
            this.cheekFrames[4].setVisible(true);
            this.currentCheekFrame = 4;
        });

        // FRAME 6: No hand + cheek-1 (back to idle)
        this.time.delayedCall(frameDuration * 5, () => {
            // Back to idle
            this.cheekFrames[4].setVisible(false);
            this.cheekFrames[1].setVisible(true);
            this.currentCheekFrame = 1;

            this.isSlapping = false;
            console.log('Slap animation complete');
        });
    }

    update(time, delta) {
        // Calculate and display current APS
        const currentAPS = this.calculateAPS();
        this.apsText.setText(`APS: ${currentAPS}`);

        // Clean up old timestamps (keep only last 2 seconds)
        const twoSecondsAgo = Date.now() - 2000;
        this.clickTimestamps = this.clickTimestamps.filter(t => t > twoSecondsAgo);
    }

    calculateAPS() {
        // Rolling window: count clicks in last 1 second
        const now = Date.now();
        const oneSecondAgo = now - 1000;
        const recentClicks = this.clickTimestamps.filter(t => t > oneSecondAgo);
        return recentClicks.length;
    }

    calculateFrameDuration(currentAPS) {
        // Base: 100ms per frame at 0 APS (600ms total animation)
        // Min: 20ms per frame at high APS (120ms total animation)

        const baseDuration = 100;
        const minDuration = 20;
        const speedFactor = 20; // How much each APS point reduces duration

        // Higher APS = shorter frame duration = faster animation
        const duration = Math.max(
            minDuration,
            baseDuration - (currentAPS * speedFactor)
        );

        return duration;
    }
}
