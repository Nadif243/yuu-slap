class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load all assets
        this.load.image('background', 'assets/images/background.png');
        this.load.image('character-idle-1', 'assets/images/character-idle-1.png');
        this.load.image('character-idle-2', 'assets/images/character-idle-2.png'); // Temp: same as idle-1
        this.load.image('cheek-0', 'assets/images/cheek-0.png');
        this.load.image('cheek-1', 'assets/images/cheek-1.png');
        this.load.image('cheek-2', 'assets/images/cheek-2.png');
        this.load.image('cheek-3', 'assets/images/cheek-3.png');
        this.load.image('cheek-4', 'assets/images/cheek-4.png');
        this.load.image('hand-0', 'assets/images/hand-0.png');
        this.load.image('hand-1', 'assets/images/hand-1.png');
        this.load.image('hand-2', 'assets/images/hand-2.png');
        this.load.image('volume-icon', 'assets/images/volume-icon.png');

        // Load audio
        this.load.audio('bgm', 'assets/audio/bgm.mp3');
        this.load.audio('slap-sfx', 'assets/audio/slap.wav');

        console.log('Loading all assets...');
    }

    create() {
        console.log('GameScene started');

        // ===== GAME STATE =====
        this.clickTimestamps = []; // For APS calculation

        // Load total score from localStorage (persists forever)
        this.totalScore = parseInt(localStorage.getItem('slapGameTotalScore')) || 0;

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
        const cheekY = 420;
        const cheekScale = 1;

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
        const handScales = [1.4, 1.0, 0.8]; // Adjust per frame
        for (let i = 0; i < 3; i++) {
            const hand = this.add.image(0, 0, `hand-${i}`);
            hand.setScale(handScale * handScales[i]);
            hand.setVisible(false);
            this.handFrames.push(hand);
        }

        console.log('✓ All visuals loaded');

        // ===== AUDIO =====
        // Load saved volumes or use defaults
        const savedBgmVolume = parseFloat(localStorage.getItem('bgmVolume')) || 0.5;
        const savedSfxVolume = parseFloat(localStorage.getItem('sfxVolume')) || 0.7;

        this.bgm = this.sound.add('bgm', { loop: true, volume: savedBgmVolume });
        this.bgm.play();

        this.slapSfx = this.sound.add('slap-sfx', { volume: savedSfxVolume });
        this.sfxVolume = savedSfxVolume;

        // ===== UI ELEMENTS =====
        // Score display
        const scoreBg = this.add.graphics();
        scoreBg.fillStyle(0x000000, 0.67); // 0.67 alpha = aa in hex
        scoreBg.fillRoundedRect(12, 10, 570, 90, 10); // x, y, width, height, radius
        this.scoreText = this.add.text(20, 13, `Press any key to correct this red panda.\n${this.totalScore} Hit!`, {
            fontSize: '28px',
            fontFamily: 'Quicksand, sans-serif',
            fontStyle: 'bold',
            color: '#ffffff',
            padding: { x: 10, y: 8 },
            lineSpacing: 8
        });

        // APS display
        const apsBg = this.add.graphics();
        apsBg.fillStyle(0x000000, 0.67);
        apsBg.fillRoundedRect(12, 100, 120, 40, 10);
        this.apsText = this.add.text(20, 103, '(0 APS)', {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffff00',
            padding: { x: 10, y: 5 }
        });

        // Reset button (rounded rectangle)
        const resetBtn = this.add.graphics();
        resetBtn.fillStyle(0xcc4444, 1);
        resetBtn.fillRoundedRect(1100, 15, 160, 50, 15); // x, y, width, height, corner radius
        resetBtn.lineStyle(2, 0xff6666, 1);
        resetBtn.strokeRoundedRect(1100, 15, 160, 50, 15);

        // Make it interactive (create invisible hitbox)
        const resetHitbox = this.add.rectangle(1180, 40, 160, 50, 0x000000, 0);
        resetHitbox.setInteractive({ useHandCursor: true });

        const resetText = this.add.text(1180, 38, 'Reset', {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            color: '#ffffff'
        });
        resetText.setOrigin(0.5);

        // Reset button interactions
        resetHitbox.on('pointerover', () => {
            resetBtn.clear();
            resetBtn.fillStyle(0xff5555, 1);
            resetBtn.fillRoundedRect(1100, 15, 160, 50, 15);
            resetBtn.lineStyle(2, 0xff6666, 1);
            resetBtn.strokeRoundedRect(1100, 15, 160, 50, 15);
        });

        resetHitbox.on('pointerout', () => {
            resetBtn.clear();
            resetBtn.fillStyle(0xcc4444, 1);
            resetBtn.fillRoundedRect(1100, 15, 160, 50, 15);
            resetBtn.lineStyle(2, 0xff6666, 1);
            resetBtn.strokeRoundedRect(1100, 15, 160, 50, 15);
        });

        resetHitbox.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation(); // Prevent slap

            // Set flag to prevent slap
            this.isResetting = true;

            // Reset total score
            this.totalScore = 0;
            localStorage.setItem('slapGameTotalScore', '0');
            this.scoreText.setText(`Press any key to correct this red panda.\n${this.totalScore} Hit!`);

            console.log('Total score reset to 0');

            // Clear flag after a short delay
            this.time.delayedCall(100, () => {
                this.isResetting = false;
            });
        });

        // ===== VOLUME CONTROLS =====

        // Volume button background (rounded)
        const volumeBtnBg = this.add.graphics();
        volumeBtnBg.setDepth(10);
        volumeBtnBg.fillStyle(0x444444, 1);
        volumeBtnBg.fillRoundedRect(260, 670, 50, 35, 10);
        volumeBtnBg.lineStyle(2, 0x666666, 1);
        volumeBtnBg.strokeRoundedRect(260, 670, 50, 35, 10);

        // Volume icon image
        const volumeIcon = this.add.image(285, 687.5, 'volume-icon');
        volumeIcon.setDisplaySize(24, 24); // Adjust size as needed
        volumeIcon.setDepth(11);

        // Volume button hitbox
        const volumeBtnHitbox = this.add.rectangle(285, 687.5, 50, 35, 0x000000, 0);
        volumeBtnHitbox.setDepth(12)
        volumeBtnHitbox.setInteractive({ useHandCursor: true });

        // Volume panel (initially hidden)
        this.volumePanelVisible = false;

        // Panel background
        this.volumePanel = this.add.graphics();
        this.volumePanel.setDepth(100); // Appear above everything
        this.volumePanel.setVisible(false);

        // Panel content container
        this.volumePanelContent = this.add.container(0, 0);
        this.volumePanelContent.setDepth(101);
        this.volumePanelContent.setVisible(false);

        // Draw panel background
        this.volumePanel.fillStyle(0x000000, 0.9);
        this.volumePanel.fillRoundedRect(20, 570, 290, 90, 10); // Left edge to right of button
        this.volumePanel.lineStyle(2, 0x666666, 1);
        this.volumePanel.strokeRoundedRect(20, 570, 290, 90, 10);

        // BGM label
        const bgmLabel = this.add.text(35, 585, 'BGM:', {
            fontSize: '18px',
            fontFamily: 'Trebuchet MS, sans-serif',
            color: '#ffffff'
        });

        // BGM slider background
        const bgmSliderBg = this.add.rectangle(90, 595, 200, 8, 0x333333);
        bgmSliderBg.setOrigin(0, 0.5);

        // BGM slider fill
        this.bgmSliderFill = this.add.rectangle(90, 595, 100, 8, 0x4CAF50); // 50% default
        this.bgmSliderFill.setOrigin(0, 0.5);

        // BGM slider handle
        this.bgmHandle = this.add.circle(190, 595, 8, 0xffffff);
        this.bgmHandle.setInteractive({ useHandCursor: true, draggable: true });

        // SFX label
        const sfxLabel = this.add.text(35, 630, 'SFX:', {
            fontSize: '18px',
            fontFamily: 'Trebuchet MS, sans-serif',
            color: '#ffffff'
        });

        // SFX slider background
        const sfxSliderBg = this.add.rectangle(90, 640, 200, 8, 0x333333);
        sfxSliderBg.setOrigin(0, 0.5);

        // SFX slider fill
        this.sfxSliderFill = this.add.rectangle(90, 640, 140, 8, 0x4CAF50); // 70% default
        this.sfxSliderFill.setOrigin(0, 0.5);

        // SFX slider handle
        this.sfxHandle = this.add.circle(230, 640, 8, 0xffffff);
        this.sfxHandle.setInteractive({ useHandCursor: true, draggable: true });

        // Add all to container
        this.volumePanelContent.add([
            bgmLabel, bgmSliderBg, this.bgmSliderFill, this.bgmHandle,
            sfxLabel, sfxSliderBg, this.sfxSliderFill, this.sfxHandle
        ]);

        // Volume button click handler
        volumeBtnHitbox.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            this.toggleVolumePanel();
        });

        // BGM slider drag
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject === this.bgmHandle) {
                const clampedX = Phaser.Math.Clamp(dragX, 90, 290);
                this.bgmHandle.x = clampedX;
                const fillWidth = clampedX - 90;
                this.bgmSliderFill.width = fillWidth;

                // Update BGM volume (0 to 1)
                const volume = fillWidth / 200;
                if (this.bgm) {
                    this.bgm.setVolume(volume);
                }
                localStorage.setItem('bgmVolume', volume.toString());
            }

            if (gameObject === this.sfxHandle) {
                const clampedX = Phaser.Math.Clamp(dragX, 90, 290);
                this.sfxHandle.x = clampedX;
                const fillWidth = clampedX - 90;
                this.sfxSliderFill.width = fillWidth;

                // Update SFX volume (0 to 1)
                const volume = fillWidth / 200;
                if (this.slapSfx) {
                    this.slapSfx.setVolume(volume);
                }
                localStorage.setItem('sfxVolume', volume.toString());
            }
        });

        // Click outside to close panel
        this.input.on('pointerdown', (pointer) => {
            if (this.volumePanelVisible) {
                const bounds = new Phaser.Geom.Rectangle(20, 570, 290, 110);
                const btnBounds = new Phaser.Geom.Rectangle(260, 670, 50, 35);

                if (!bounds.contains(pointer.x, pointer.y) && !btnBounds.contains(pointer.x, pointer.y)) {
                    this.toggleVolumePanel();
                }
            }
        });

        // Instruction text
        const instructionBg = this.add.graphics();
        instructionBg.setDepth(0)
        instructionBg.fillStyle(0x000000, 0.67);
        instructionBg.fillRoundedRect(12, 670, 240, 35, 10);
        this.add.text(20, 673, 'Click or press any key to slap', {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#aaaaaa',
            padding: { x: 8, y: 5 }
        });

        // ===== SLAP INPUT =====
        this.isSlapping = false; // Flag to prevent spam
        this.anyKeyPressed = false; // Track if any key button is held
        this.isResetting = false;

        // Disable right-click context menu on canvas
        this.input.mouse.disableContextMenu();

        // Mouse/touch input
        this.input.on('pointerdown', () => {
            this.playSlapAnimation();
        });

        // Keyboard input (spacebar)
        this.input.keyboard.on('keydown', () => {
            if (!this.anyKeyPressed) {
                this.anyKeyPressed = true;
                this.playSlapAnimation();
            }
        });

        // Reset flag when spacebar released
        this.input.keyboard.on('keyup', () => {
            this.anyKeyPressed = false;
        });
    }

    // Main slap animation - synchronized hand + cheek
    playSlapAnimation() {
        console.log('Slap animation started');

        if (this.isResetting) return;

        // Don't block at high APS - allow instant response
        const currentAPS = this.calculateAPS();

        // Increment score immediately
        this.totalScore++;
        this.scoreText.setText(`Press any key to correct this red panda.\n${this.totalScore} Hit!`);
        this.clickTimestamps.push(Date.now());
        // Save to localStorage immediately
        localStorage.setItem('slapGameTotalScore', this.totalScore.toString());

        // Play slap SFX
        this.slapSfx.play();

        const cheekX = 630;

        // Clear any pending reset timers
        if (this.resetTimer) {
            this.resetTimer.remove();
        }

        // HIGH APS MODE (>12): Just flash frames, no sequential animation
        if (currentAPS > 12) {
            // Cancel any ongoing animation
            this.isSlapping = false;

            // Hide everything first
            this.handFrames.forEach(h => h.setVisible(false));
            this.cheekFrames.forEach(c => c.setVisible(false));

            // Randomly pick frame: 70% hand-0, 30% hand-1
            const showImpact = Math.random() < 0.3;

            if (showImpact) {
                this.handFrames[1].setOrigin(1, 1);
                this.handFrames[1].setPosition(cheekX, 720);
                this.handFrames[1].setVisible(true);
                this.cheekFrames[2].setVisible(true);
            } else {
                this.handFrames[0].setOrigin(0, 1);
                this.handFrames[0].setPosition(0, 720);
                this.handFrames[0].setVisible(true);
                this.cheekFrames[1].setVisible(true);
            }

            // Reset after brief flash
            this.resetTimer = this.time.delayedCall(30, () => {
                this.handFrames.forEach(h => h.setVisible(false));
                this.cheekFrames.forEach(c => c.setVisible(false));
                this.cheekFrames[1].setVisible(true);
            });

            return; // Skip normal animation
        }

        // MEDIUM/LOW APS MODE: Full animation with blocking
        if (this.isSlapping) return; // Don't allow overlapping animations, Only block for slow animations
        this.isSlapping = true;

        // Calculate animation speed based on current APS
        const frameDuration = this.calculateFrameDuration(currentAPS);

        console.log(`Slap! Score: ${this.totalScore}, APS: ${currentAPS}, Frame Duration: ${frameDuration}ms`);

        // FRAME 1: No hand + cheek-0
        this.cheekFrames[this.currentCheekFrame].setVisible(false);
        this.cheekFrames[0].setVisible(true);
        this.currentCheekFrame = 0;

        // FRAME 2: hand-0 (left side, bottom-aligned) + cheek-1
        this.time.delayedCall(frameDuration, () => {
            // Position hand-0: left side of screen, bottom-aligned
            // hand-0 is 350x860, scaled to ~272x669
            const hand0X = -40; // Left edge (will adjust based on anchor)
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
        this.apsText.setText(`(${currentAPS} APS)`);

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
        // At high APS, skip frames to speed up
        if (currentAPS > 10) {
            return 10; // Super fast, will skip frames at engine level
        } else if (currentAPS > 8) {
            return 15;
        } else if (currentAPS > 5) {
            return 20;
        } else {
            return 30;
        }
    }

    toggleVolumePanel() {
        this.volumePanelVisible = !this.volumePanelVisible;
        this.volumePanel.setVisible(this.volumePanelVisible);
        this.volumePanelContent.setVisible(this.volumePanelVisible);
    }
}
