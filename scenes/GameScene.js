class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // TODO: Load actual assets when ready
        // For now, use Phaser's built-in graphics

        // Placeholder for now are to: Create colored rectangles as images
        // this.load.image('character', 'assets/images/character-base.png');
        // this.load.image('cheek-normal', 'assets/images/cheek-normal.png');
        // this.load.image('cheek-slapped', 'assets/images/cheek-slapped.png');

        // this.load.spritesheet('hand', 'assets/images/hand-spritesheet.png', {
        //     frameWidth: 100,
        //     frameHeight: 100
        // });

        // this.load.audio('bgm', 'assets/audio/bgm.mp3');
        // this.load.audio('slap-sfx', 'assets/audio/slap-sfx.mp3');
    }

    create() {
        // ===== GAME STATE =====
        this.score = 0;
        this.clickTimestamps = []; // Array to track last clicks for APS
        this.isSlapping = false;   // Flag to prevent overlapping slaps
        this.spaceKeyPressed = false; // Track if space is currently held

        // ===== CREATE PLACEHOLDER VISUALS =====
        // To replace with actual art later /////////////////////////////////////////////////////////

        // Character base (background)
        this.characterBase = this.add.rectangle(400, 300, 200, 300, 0xecf0f1);

        // Cheeks (swap between normal and slapped)
        this.cheekNormal = this.add.circle(350, 280, 30, 0xffb6c1).setVisible(true);
        this.cheekSlapped = this.add.ellipse(350, 285, 35, 25, 0xff69b4).setVisible(false);

        // Hand (will animate in from side)
        this.hand = this.add.rectangle(100, 280, 80, 100, 0xffd700).setVisible(false);

        // Store original positions to prevent drift during idle shake
        this.originalPositions = {
            baseX: 400,
            baseY: 300,
            cheekNormalX: 350,
            cheekNormalY: 280,
            cheekSlappedX: 350,
            cheekSlappedY: 282
        };

        // ===== UI ELEMENTS =====
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        });

        this.apsText = this.add.text(20, 50, 'APS: 0', {
            fontSize: '20px',
            color: '#ffffff'
        });

        // ===== INPUT HANDLING =====
        // Phaser's input system handles mouse, touch, and keyboard automatically
        this.input.on('pointerdown', () => this.onSlap());

        // Keyboard input - only trigger once per press, not on hold
        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.spaceKeyPressed) {
                this.spaceKeyPressed = true;
                this.onSlap();
            }
        });

        // Reset flag when key is released
        this.input.keyboard.on('keyup-SPACE', () => {
            this.spaceKeyPressed = false;
        });

        // ===== IDLE SHAKE ANIMATION =====
        // Subtle shake effect when idle
        this.time.addEvent({
            delay: 100, // Every 100ms
            callback: () => this.applyIdleShake(),
            loop: true
        });

        // ===== AUDIO (placeholder) =====
        // this.bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
        // this.bgm.play();
        // this.slapSfx = this.sound.add('slap-sfx', { volume: 0.7 });

        console.log('GameScene created! Click or press SPACE to slap.');
    }

    update(time, delta) {
        // This runs every frame (~60 times per second)

        // Update APS display with rolling window calculation
        const currentAPS = this.calculateAPS();
        this.apsText.setText(`APS: ${currentAPS}`);

        // Clean up old timestamps (keep only last 2 seconds of data)
        const twoSecondsAgo = Date.now() - 2000;
        this.clickTimestamps = this.clickTimestamps.filter(t => t > twoSecondsAgo);
    }

    // ===== CORE GAME LOGIC =====

    onSlap() {
        // Don't allow new slap if one is already animating
        if (this.isSlapping) return;

        // Record this click for APS calculation
        this.clickTimestamps.push(Date.now());

        // Increment score
        this.score++;
        this.scoreText.setText(`Score: ${this.score}`);

        // Calculate animation speed based on current APS
        const currentAPS = this.calculateAPS();
        const animDuration = this.calculateAnimationDuration(currentAPS);

        // Play the slap animation
        this.playSlapAnimation(animDuration);

        // Play SFX (when audio ready)
        // this.slapSfx.play();

        console.log(`Slap! Score: ${this.score}, APS: ${currentAPS}, Anim Duration: ${animDuration}ms`);
    }

    calculateAPS() {
        // Rolling window: count clicks in last 1 second
        const now = Date.now();
        const oneSecondAgo = now - 1000;

        const recentClicks = this.clickTimestamps.filter(t => t > oneSecondAgo);
        return recentClicks.length;
    }

    calculateAnimationDuration(currentAPS) {
        // Base duration: 300ms for full animation at slow clicking
        // Minimum duration: 20ms (as fast as ~1 frame can render)

        const baseDuration = 300;
        const minDuration = 20;
        const speedFactor = 200; // How much APS affects speed

        // Higher APS = shorter duration
        const duration = Math.max(
            minDuration,
            baseDuration - (currentAPS * speedFactor)
        );

        return duration;
    }

    playSlapAnimation(duration) {
        this.isSlapping = true;

        // PHASE 1: Hand appears and moves to cheek
        this.hand.setPosition(100, 280); // Start off-screen left
        this.hand.setVisible(true);

        this.tweens.add({
            targets: this.hand,
            x: 350, // Move to cheek position
            duration: duration * 0.6, // 60% of total animation time
            ease: 'Power2',
            onComplete: () => {
                // PHASE 2: Impact! Swap to slapped cheek
                this.cheekNormal.setVisible(false);
                this.cheekSlapped.setVisible(true);

                // Character shake on impact
                this.shakeCharacter();

                // PHASE 3: Hand retracts DOWN and slightly RIGHT (follow-through)
                this.tweens.add({
                    targets: this.hand,
                    x: 380, // Move back off-screen
                    y: 340, // Slightly lower (follow-through)
                    duration: duration * 0.4, // 40% of animation time
                    ease: 'Power2',
                    onComplete: () => {
                        // Reset everything
                        this.hand.setVisible(false);
                        this.cheekNormal.setVisible(true);
                        this.cheekSlapped.setVisible(false);
                        this.isSlapping = false;
                    }
                });
            }
        });
    }

    shakeCharacter() {
        // Store original positions
        const originalX = this.characterBase.x;
        const originalY = this.characterBase.y;

        // Shake with decreasing intensity
        this.tweens.add({
            targets: [this.characterBase, this.cheekNormal, this.cheekSlapped],
            x: originalX + Phaser.Math.Between(-4, 4),
            y: originalY + Phaser.Math.Between(-4, 4),
            duration: 50,
            yoyo: true,
            repeat: 1, // Reduced from 2 to 1 for less shake
            onComplete: () => {
                // Return to original position using stored values
                this.characterBase.setPosition(originalX, originalY);
                this.cheekNormal.setPosition(
                    this.originalPositions.cheekNormalX,
                    this.originalPositions.cheekNormalY
                );
                this.cheekSlapped.setPosition(
                    this.originalPositions.cheekSlappedX,
                    this.originalPositions.cheekSlappedY
                );
            }
        });
    }

    applyIdleShake() {
        // Subtle idle breathing/shaking animation
        if (this.isSlapping) return; // Don't shake while slapping

        // Reduced intensity: -1 to 1 pixels, oscillate around original position
        const offsetX = Phaser.Math.Between(-1, 1);
        const offsetY = Phaser.Math.Between(-1, 1);

        // Use original positions as anchor - prevents drift
        this.characterBase.setPosition(
            this.originalPositions.baseX + offsetX,
            this.originalPositions.baseY + offsetY
        );
        this.cheekNormal.setPosition(
            this.originalPositions.cheekNormalX + offsetX,
            this.originalPositions.cheekNormalY + offsetY
        );
        this.cheekSlapped.setPosition(
            this.originalPositions.cheekSlappedX + offsetX,
            this.originalPositions.cheekSlappedY + offsetY
        );
    }
}
