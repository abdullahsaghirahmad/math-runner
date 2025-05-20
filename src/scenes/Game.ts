import { MathProblem } from '../objects/MathProblem';

export class Game extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private speed: number = 100; // Reset to a higher initial speed
  private speedIncreaseThreshold: number = 10;
  private correctAnswers: number = 0;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private currentProblem: MathProblem | null = null;
  private problemText!: Phaser.GameObjects.Text;
  private gameOver: boolean = false;
  private isGameStarted: boolean = false;
  private lanes: number[] = [100, 300, 500]; // Centers of the three lanes
  private currentLane: number = 1; // Start in middle lane (0-based index)
  private background!: Phaser.GameObjects.TileSprite;
  private startBanner!: Phaser.GameObjects.Container;
  private restartButton!: Phaser.GameObjects.Text;
  private readonly OBSTACLE_SPACING: number = 375; // Fixed spacing between obstacles (increased by 25%)
  private canSwitchLane: boolean = true; // Flag to control lane switching cooldown
  private readonly LANE_SWITCH_COOLDOWN: number = 150; // Cooldown time in milliseconds
  private playerX: number = 100;
  private moveStep: number = 20;
  private moveHoldTime: number = 0;
  private moveDirection: number = 0;
  private readonly MAX_MOVE_STEP: number = 120;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private scorePopups: Phaser.GameObjects.Text[] = [];
  private consecutiveCorrect: number = 0;
  private comboMultiplier: number = 1;
  private comboText!: Phaser.GameObjects.Text;
  private sparkParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private smallFireParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private mediumFireParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private bigFireParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hugeFireParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private powerUps!: Phaser.Physics.Arcade.Group;
  private isInvincible: boolean = false;
  private shieldTimer: number = 0;
  private shieldEffect!: Phaser.GameObjects.Particles.ParticleEmitter;
  private shieldText!: Phaser.GameObjects.Text;
  private spaceships!: Phaser.GameObjects.Group;
  private spaceshipTrails!: Phaser.GameObjects.Particles.ParticleEmitter;
  private activeTrails: Phaser.GameObjects.Particles.ParticleEmitter[] = [];

  constructor() {
    super({ key: 'Game' });
  }

  preload() {
    // Load assets
    this.load.image('road', 'assets/road.png');
  }

  create() {
    // Create scrolling background
    this.background = this.add.tileSprite(400, 300, 800, 600, 'road');
    
    // Create particle textures
    this.createParticleTexture();
    this.createFireParticleTextures();
    this.createShieldTexture();
    this.createSpaceshipTexture();
    
    // Create spaceship group with physics enabled
    this.spaceships = this.physics.add.group();
    
    // Create spaceship trail particles
    this.spaceshipTrails = this.add.particles(0, 0, 'particle', {
      speed: { min: 20, max: 40 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      lifespan: 800,
      quantity: 1,
      emitting: false,
      alpha: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      tint: [0x00ffff, 0x0088ff]
    });

    // Create shield effect particles
    this.shieldEffect = this.add.particles(0, 0, 'shield', {
      speed: { min: 20, max: 40 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      lifespan: 1000,
      quantity: 2,
      emitting: false,
      alpha: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      tint: [0x00ffff, 0x0088ff]
    });

    // Create shield text
    this.shieldText = this.add.text(16, 96, '', { 
      fontSize: '24px', 
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 4
    });

    // Create power-ups group
    this.powerUps = this.physics.add.group();

    // Create particle emitters
    this.particles = this.add.particles(0, 0, 'particle', {
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      lifespan: 1000,
      gravityY: 300,
      quantity: 20,
      emitting: false,
      tint: [0x00ff00, 0x00ffff, 0xffff00]
    });

    // Create combo text
    this.comboText = this.add.text(16, 56, '', { 
      fontSize: '24px', 
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    });

    // Create spark particles
    this.sparkParticles = this.add.particles(0, 0, 'spark', {
      speed: { min: 50, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      lifespan: 500,
      quantity: 15,
      emitting: false,
      tint: [0xffff00, 0xffaa00]
    });

    // Create small flame particles
    this.smallFireParticles = this.add.particles(0, 0, 'flame', {
      speed: { min: 20, max: 40 },
      angle: { min: -20, max: 20 },
      scale: { start: 0.8, end: 0 },
      lifespan: 600,
      quantity: 12,
      emitting: false,
      alpha: { start: 1, end: 0 },
      rotate: { min: -10, max: 10 },
      gravityY: -50,
      blendMode: 'ADD',
      tint: [0xffff00, 0xff4400]
    });

    // Create medium flame particles
    this.mediumFireParticles = this.add.particles(0, 0, 'flame', {
      speed: { min: 30, max: 60 },
      angle: { min: -30, max: 30 },
      scale: { start: 1, end: 0 },
      lifespan: 800,
      quantity: 20,
      emitting: false,
      alpha: { start: 1, end: 0 },
      rotate: { min: -15, max: 15 },
      gravityY: -70,
      blendMode: 'ADD',
      tint: [0xffff00, 0xff4400]
    });

    // Create big flame particles
    this.bigFireParticles = this.add.particles(0, 0, 'flame', {
      speed: { min: 40, max: 80 },
      angle: { min: -40, max: 40 },
      scale: { start: 1.2, end: 0 },
      lifespan: 1000,
      quantity: 30,
      emitting: false,
      alpha: { start: 1, end: 0 },
      rotate: { min: -20, max: 20 },
      gravityY: -90,
      blendMode: 'ADD',
      tint: [0xffff00, 0xff4400]
    });

    // Create huge flame particles
    this.hugeFireParticles = this.add.particles(0, 0, 'flame', {
      speed: { min: 50, max: 100 },
      angle: { min: -50, max: 50 },
      scale: { start: 1.5, end: 0 },
      lifespan: 1200,
      quantity: 40,
      emitting: false,
      alpha: { start: 1, end: 0 },
      rotate: { min: -25, max: 25 },
      gravityY: -110,
      blendMode: 'ADD',
      tint: [0xffff00, 0xff4400]
    });

    // Create player (green circle)
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0x00ff00, 1);
    playerGraphics.fillCircle(0, 0, 15);
    playerGraphics.generateTexture('player', 32, 32);
    playerGraphics.destroy();

    // Position player at the left side of the screen
    this.player = this.physics.add.sprite(100, this.lanes[this.currentLane], 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setImmovable(true);
    this.player.setVisible(true);

    // Setup input
    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
    }

    // Create obstacles group
    this.obstacles = this.physics.add.group();

    // Create score text
    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', color: '#fff' });

    // Create problem text
    this.problemText = this.add.text(400, 50, '', { fontSize: '32px', color: '#fff' });
    this.problemText.setOrigin(0.5);

    // Reset game state
    this.gameOver = false;
    this.isGameStarted = false;
    this.score = 0;
    this.correctAnswers = 0;
    this.playerX = 100;

    // Create start banner
    this.createStartBanner();

    // Setup collisions
    this.physics.add.overlap(
      this.player,
      this.obstacles,
      ((player: Phaser.Physics.Arcade.GameObjectWithBody, obstacle: Phaser.Physics.Arcade.GameObjectWithBody) => {
        if (obstacle instanceof Phaser.Physics.Arcade.Sprite) {
          if (obstacle.getData('isCorrect')) {
            // Correct answer
            const baseScore = 10;
            const finalScore = Math.floor(baseScore * this.comboMultiplier);
            this.score += finalScore;
            this.scoreText.setText(`Score: ${this.score}`);
            const text = obstacle.getData('text');
            if (text) text.destroy();
            
            // Emit particles at the obstacle's position
            this.particles.setPosition(obstacle.x, obstacle.y);
            this.particles.explode();
            
            // Create score popup with multiplier
            this.createScorePopup(obstacle.x, obstacle.y, finalScore);
            
            // Update combo
            this.updateCombo(true);
            
            obstacle.destroy();
            this.spawnNewProblem();
          } else {
            // Wrong answer - Game Over (unless invincible)
            if (!this.isInvincible) {
              this.updateCombo(false);
              this.gameOver = true;
              this.physics.pause();
              this.player.setTint(0xff0000);
              this.add.text(400, 300, 'Game Over', { fontSize: '64px', color: '#fff' }).setOrigin(0.5);
              
              // Add restart button
              this.restartButton = this.add.text(400, 400, 'Press SPACE to Restart', { 
                fontSize: '32px', 
                color: '#fff', 
                backgroundColor: '#222' 
              }).setOrigin(0.5);

              // Add space key listener for restart
              if (this.input.keyboard) {
                this.input.keyboard.once('keydown-SPACE', () => {
                  this.scene.restart();
                });
              }
            } else {
              // If invincible, just destroy the obstacle
              const text = obstacle.getData('text');
              if (text) text.destroy();
              obstacle.destroy();
            }
          }
        }
      }) as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback
    );

    // Add power-up collision
    this.physics.add.overlap(
      this.player,
      this.powerUps,
      ((player: Phaser.Physics.Arcade.GameObjectWithBody, powerUp: Phaser.Physics.Arcade.GameObjectWithBody) => {
        if (powerUp instanceof Phaser.Physics.Arcade.Sprite) {
          if (powerUp.getData('type') === 'shield') {
            this.activateShield();
            powerUp.destroy();
          }
        }
      }) as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback
    );
  }

  private createStartBanner() {
    this.startBanner = this.add.container(400, 300);
    
    const banner = this.add.rectangle(0, 0, 400, 200, 0x000000, 0.8);
    const title = this.add.text(0, -50, 'Math Runner', { fontSize: '48px', color: '#fff' }).setOrigin(0.5);
    const startText = this.add.text(0, 0, 'Press SPACE to Start', { fontSize: '24px', color: '#fff' }).setOrigin(0.5);
    const instructions = this.add.text(0, 50, 'Use UP/DOWN to change lanes\nCollect correct answers!', { 
      fontSize: '20px', 
      color: '#fff',
      align: 'center'
    }).setOrigin(0.5);

    this.startBanner.add([banner, title, startText, instructions]);

    // Add space key listener
    if (this.input.keyboard) {
      this.input.keyboard.once('keydown-SPACE', () => {
        this.startBanner.destroy();
        this.isGameStarted = true;
        this.spawnNewProblem();
      });
    }
  }

  private spawnNewProblem() {
    if (this.gameOver) return;

    // Increase complexity of math problems as the player progresses
    let problemStr = '';
    let answer = 0;
    if (this.score < 30) {
      // Simple add/subtract
      const a = Phaser.Math.Between(1, 50);
      const b = Phaser.Math.Between(1, 50);
      const op = Phaser.Math.RND.pick(['+', '-']);
      if (op === '+') {
        problemStr = `${a} + ${b}`;
        answer = a + b;
      } else {
        problemStr = `${a} - ${b}`;
        answer = a - b;
      }
    } else if (this.score < 100) {
      // Add/subtract/multiply/divide, random order, whole number answers only
      const ops = Phaser.Math.RND.shuffle(['+', '-', '*', '/']);
      let found = false;
      while (!found) {
        const op = ops[Phaser.Math.Between(0, 3)];
        let a = Phaser.Math.Between(2, 12);
        let b = Phaser.Math.Between(2, 12);
        if (op === '+') {
          problemStr = `${a} + ${b}`;
          answer = a + b;
          found = true;
        } else if (op === '-') {
          if (a < b) [a, b] = [b, a];
          problemStr = `${a} - ${b}`;
          answer = a - b;
          found = true;
        } else if (op === '*') {
          problemStr = `${a} * ${b}`;
          answer = a * b;
          found = true;
        } else if (op === '/') {
          // Ensure whole number answer
          answer = Phaser.Math.Between(2, 12);
          b = Phaser.Math.Between(2, 12);
          a = answer * b;
          problemStr = `${a} / ${b}`;
          found = true;
        }
      }
    } else {
      // Bracketed equations, random order, whole number answers only
      let found = false;
      while (!found) {
        const a = Phaser.Math.Between(1, 10);
        const b = Phaser.Math.Between(1, 10);
        const c = Phaser.Math.Between(1, 10);
        const op1 = Phaser.Math.RND.pick(['+', '-']);
        const op2 = Phaser.Math.RND.pick(['*', '/']);
        if (op2 === '*') {
          problemStr = `(${a} ${op1} ${b}) * ${c}`;
          answer = op1 === '+' ? (a + b) * c : (a - b) * c;
          found = true;
        } else {
          // Ensure whole number answer for division
          let inner = op1 === '+' ? a + b : a - b;
          if (c !== 0 && inner % c === 0) {
            problemStr = `(${a} ${op1} ${b}) / ${c}`;
            answer = inner / c;
            found = true;
          }
        }
      }
    }
    if (this.problemText) {
      this.problemText.setText(problemStr);
    }
    this.currentProblem = { getProblem: () => problemStr, getAnswer: () => answer } as any;

    // Create obstacle textures
    const obstacleGraphics = this.add.graphics();
    obstacleGraphics.fillStyle(0xff0000, 1);
    obstacleGraphics.fillRect(-15, -15, 30, 30);
    obstacleGraphics.generateTexture('obstacle', 32, 32);
    obstacleGraphics.destroy();

    // Determine correct answer lane
    const correctLane = Phaser.Math.Between(0, 2);
    const correctAnswer = this.currentProblem ? this.currentProblem.getAnswer() : 0;
    
    // Generate wrong answers that are different from the correct answer
    let wrongAnswers: number[] = [];
    while (wrongAnswers.length < 2) {
      const wrongAnswer = correctAnswer + Phaser.Math.Between(-5, 5);
      if (wrongAnswer !== correctAnswer && !wrongAnswers.includes(wrongAnswer)) {
        wrongAnswers.push(wrongAnswer);
      }
    }

    // Calculate the rightmost obstacle's position
    const rightmostObstacle = this.obstacles.getChildren().reduce((maxX: number, obstacle: any) => {
      return Math.max(maxX, obstacle.x);
    }, 0);

    // Only spawn if there's enough space
    if (rightmostObstacle < 600) {
      // Spawn obstacles with answers
      for (let i = 0; i < 3; i++) {
        const answer = i === correctLane ? correctAnswer : wrongAnswers[i > correctLane ? 1 : 0];
        const obstacle = this.obstacles.create(
          Math.max(800, rightmostObstacle + this.OBSTACLE_SPACING),
          this.lanes[i],
          'obstacle'
        ) as Phaser.Physics.Arcade.Sprite;
        obstacle.setData('answer', answer);
        obstacle.setData('isCorrect', i === correctLane);
        // Add answer text above obstacle
        const answerText = this.add.text(obstacle.x, obstacle.y - 30, answer.toString(), {
          fontSize: '24px',
          color: '#fff',
          backgroundColor: '#000'
        }).setOrigin(0.5);
        obstacle.setData('text', answerText);
        obstacle.setVelocityX(-this.speed); // Move from right to left
        // Randomize animation type
        const animType = Phaser.Math.RND.pick(['bob', 'rotate', 'pulse']);
        obstacle.setData('animType', animType);
      }
    }
  }

  private createParticleTexture() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('particle', 8, 8);
    graphics.destroy();
  }

  private createFireParticleTextures() {
    // Create spark texture
    const sparkGraphics = this.add.graphics();
    sparkGraphics.fillStyle(0xffffff, 1);
    sparkGraphics.fillCircle(2, 2, 2);
    sparkGraphics.generateTexture('spark', 4, 4);
    sparkGraphics.destroy();

    // Create flame texture
    const flameGraphics = this.add.graphics();
    flameGraphics.fillStyle(0xffffff, 1);
    flameGraphics.fillTriangle(0, 0, 8, 0, 4, 12);
    flameGraphics.generateTexture('flame', 8, 12);
    flameGraphics.destroy();
  }

  private createShieldTexture() {
    const shieldGraphics = this.add.graphics();
    shieldGraphics.lineStyle(2, 0x00ffff, 1);
    shieldGraphics.fillStyle(0x00ffff, 0.3);
    shieldGraphics.fillCircle(8, 8, 8);
    shieldGraphics.strokeCircle(8, 8, 8);
    shieldGraphics.generateTexture('shield', 16, 16);
    shieldGraphics.destroy();
  }

  private createSpaceshipTexture() {
    const shipGraphics = this.add.graphics();
    
    // Draw spaceship body
    shipGraphics.fillStyle(0x00ffff, 1);
    shipGraphics.fillTriangle(0, 0, 16, 8, 0, 16);
    
    // Draw spaceship details
    shipGraphics.lineStyle(1, 0xffffff, 1);
    shipGraphics.strokeTriangle(0, 0, 16, 8, 0, 16);
    shipGraphics.lineBetween(4, 4, 12, 8);
    shipGraphics.lineBetween(4, 12, 12, 8);
    
    // Draw engine glow
    shipGraphics.fillStyle(0x00ffff, 0.6);
    shipGraphics.fillCircle(16, 8, 3);
    
    shipGraphics.generateTexture('spaceship', 20, 20);
    shipGraphics.destroy();
  }

  private activateShield() {
    this.isInvincible = true;
    this.shieldTimer = 7000; // 7 seconds
    this.shieldText.setText(''); // Remove timer text
    
    // Create shield effect around player with full intensity
    this.shieldEffect.setPosition(this.player.x, this.player.y);
    this.shieldEffect.start();
    this.shieldEffect.setAlpha(0.6); // Start with full alpha
    
    // Add shield visual to player
    this.player.setTint(0x00ffff);
  }

  private updateShield(delta: number) {
    if (this.isInvincible) {
      this.shieldTimer -= delta;
      
      // Calculate shield intensity based on remaining time
      const intensity = this.shieldTimer / 7000; // Goes from 1 to 0
      
      // Update shield effect position and intensity
      this.shieldEffect.setPosition(this.player.x, this.player.y);
      this.shieldEffect.setAlpha(0.6 * intensity); // Fade out the shield effect
      
      // Update player tint intensity
      const tintIntensity = Math.floor(255 * intensity);
      const tint = Phaser.Display.Color.GetColor(0, tintIntensity, tintIntensity);
      this.player.setTint(tint);
      
      if (this.shieldTimer <= 0) {
        this.isInvincible = false;
        this.shieldEffect.stop();
        this.player.clearTint();
      }
    }
  }

  private spawnPowerUp() {
    if (this.gameOver || !this.isGameStarted) return;

    // Reduce spawn chance to 0.01% (from 0.1%)
    if (Phaser.Math.Between(1, 10000) <= 1) {
      const lane = Phaser.Math.Between(0, 2);
      const powerUp = this.powerUps.create(800, this.lanes[lane], 'shield') as Phaser.Physics.Arcade.Sprite;
      powerUp.setData('type', 'shield');
      powerUp.setVelocityX(-this.speed);
    }
  }

  private updateCombo(correct: boolean) {
    if (correct) {
      this.consecutiveCorrect++;
      this.updateComboMultiplier();
      this.updateComboText();
    } else {
      this.consecutiveCorrect = 0;
      this.comboMultiplier = 1;
      this.comboText.setText('');
    }
  }

  private updateComboMultiplier() {
    if (this.consecutiveCorrect >= 50) {
      this.comboMultiplier = 20;
      this.hugeFireParticles.explode();
    } else if (this.consecutiveCorrect >= 25) {
      this.comboMultiplier = 10;
      this.bigFireParticles.explode();
    } else if (this.consecutiveCorrect >= 15) {
      this.comboMultiplier = 5;
      this.mediumFireParticles.explode();
    } else if (this.consecutiveCorrect >= 8) {
      this.comboMultiplier = 2;
      this.smallFireParticles.explode();
    } else if (this.consecutiveCorrect >= 3) {
      this.comboMultiplier = 1.5;
      this.sparkParticles.explode();
    }
  }

  private updateComboText() {
    if (this.consecutiveCorrect >= 3) {
      this.comboText.setText(`Combo: ${this.consecutiveCorrect}x (${this.comboMultiplier}x multiplier)`);
    } else {
      this.comboText.setText('');
    }
  }

  private createScorePopup(x: number, y: number, score: number) {
    const popup = this.add.text(x, y, `+${score}`, {
      fontSize: '24px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.scorePopups.push(popup);

    // Animate the popup
    this.tweens.add({
      targets: popup,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        popup.destroy();
        this.scorePopups = this.scorePopups.filter(p => p !== popup);
      }
    });
  }

  private spawnSpaceship() {
    if (this.gameOver || !this.isGameStarted) return;

    // Reduce spawn chance to 0.02% (from 0.2%)
    if (Phaser.Math.Between(1, 10000) <= 2) {
      // Randomly choose spawn position and direction
      const fromTop = Phaser.Math.Between(0, 1) === 1;
      const x = fromTop ? Phaser.Math.Between(-50, 850) : -50;
      const y = fromTop ? -50 : Phaser.Math.Between(50, 550);
      const angle = fromTop ? Phaser.Math.Between(45, 135) : Phaser.Math.Between(-45, 45);
      
      // Create spaceship with physics
      const spaceship = this.spaceships.create(x, y, 'spaceship') as Phaser.Physics.Arcade.Sprite;
      spaceship.setAngle(angle);
      spaceship.setAlpha(0.8);
      
      // Set velocity based on angle
      const speed = Phaser.Math.Between(100, 200);
      const radians = Phaser.Math.DegToRad(angle);
      spaceship.setVelocityX(Math.cos(radians) * speed);
      spaceship.setVelocityY(Math.sin(radians) * speed);
      
      // Add trail effect
      const trail = this.add.particles(0, 0, 'particle', {
        follow: spaceship,
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.4, end: 0 },
        speed: { min: 20, max: 40 },
        lifespan: 600,
        quantity: 1,
        blendMode: 'ADD',
        tint: [0x00ffff, 0x0088ff]
      });
      
      this.activeTrails.push(trail);
      
      // Destroy spaceship and trail when off screen
      this.time.delayedCall(5000, () => {
        const index = this.activeTrails.indexOf(trail);
        if (index > -1) {
          this.activeTrails.splice(index, 1);
        }
        trail.destroy();
        spaceship.destroy();
      });
    }
  }

  update(time: number, delta: number) {
    if (!this.player) return;
    if (!this.isGameStarted || this.gameOver) return;

    // Update shield
    this.updateShield(delta);

    // Spawn power-ups
    this.spawnPowerUp();
    
    // Spawn spaceships
    this.spawnSpaceship();

    // Increase speed based on score (increase base speed by 35%)
    this.speed = 135 + Math.floor(this.score / 50) * 13.5;

    // Update player position based on speed
    this.player.y = this.lanes[this.currentLane];

    // Handle lane changes with cooldown
    if (this.canSwitchLane) {
      if (this.cursors?.up.isDown && this.currentLane > 0) {
        this.currentLane--;
        this.player.y = this.lanes[this.currentLane];
        this.canSwitchLane = false;
        // Add directional blur effect
        this.player.setTint(this.isInvincible ? 0x00ffff : 0x00ff00);
        this.time.delayedCall(this.LANE_SWITCH_COOLDOWN, () => {
          this.canSwitchLane = true;
          this.player.setTint(this.isInvincible ? 0x00ffff : 0xffffff);
        });
      } else if (this.cursors?.down.isDown && this.currentLane < 2) {
        this.currentLane++;
        this.player.y = this.lanes[this.currentLane];
        this.canSwitchLane = false;
        // Add directional blur effect
        this.player.setTint(this.isInvincible ? 0x00ffff : 0x00ff00);
        this.time.delayedCall(this.LANE_SWITCH_COOLDOWN, () => {
          this.canSwitchLane = true;
          this.player.setTint(this.isInvincible ? 0x00ffff : 0xffffff);
        });
      }
    }

    // Move answer text with obstacles and destroy off-screen obstacles
    this.obstacles.getChildren().forEach((obstacle: any) => {
      const text = obstacle.getData('text');
      if (text) {
        text.x = obstacle.x;
        text.y = obstacle.y - 30;
      }
      if (obstacle.x < -50) {
        if (text) text.destroy();
        obstacle.destroy();
      }
    });

    // Check if we need to spawn new obstacles
    if (this.obstacles.getChildren().length === 0) {
      this.spawnNewProblem();
    }

    // Destroy off-screen power-ups
    this.powerUps.getChildren().forEach((powerUp: any) => {
      if (powerUp.x < -50) {
        powerUp.destroy();
      }
    });

    // Handle left/right movement with acceleration
    let moving = false;
    if (this.cursors?.right.isDown) {
      if (this.moveDirection !== 1) {
        this.moveHoldTime = 0;
        this.moveDirection = 1;
      } else {
        this.moveHoldTime += delta;
      }
      moving = true;
    } else if (this.cursors?.left.isDown) {
      if (this.moveDirection !== -1) {
        this.moveHoldTime = 0;
        this.moveDirection = -1;
      } else {
        this.moveHoldTime += delta;
      }
      moving = true;
    } else {
      this.moveHoldTime = 0;
      this.moveDirection = 0;
    }

    if (moving && this.moveDirection !== 0) {
      // Exponential acceleration: step = base * 2^(holdTime/300ms), capped
      const step = Math.min(this.moveStep * Math.pow(2, Math.floor(this.moveHoldTime / 300)), this.MAX_MOVE_STEP);
      this.playerX += this.moveDirection * step * (delta / 1000); // scale by delta for smoothness
    }

    // Clamp playerX to screen bounds
    this.playerX = Phaser.Math.Clamp(this.playerX, 50, 750);
    this.player.x = this.playerX;
  }
} 