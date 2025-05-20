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
  private cargoBoxes: Phaser.GameObjects.Container[] = [];

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

    // Only add animated cargo shipment boxes on the dividers (max 4 per divider)
    this.cargoBoxes = [];
    const boxColors = [0xffa500, 0x00bfff, 0x8a2be2, 0x32cd32, 0xff69b4, 0xff6347];
    const boxDividers = [200, 400];
    boxDividers.forEach((y, dividerIdx) => {
      let x = 120;
      for (let i = 0; i < 4; i++) {
        let color = boxColors[i % boxColors.length];
        const width = Phaser.Math.Between(36, 60);
        const height = Phaser.Math.Between(28, 40);
        // Only create rectangular cargo boxes
        const base = this.add.rectangle(0, 0, width, height, color, 1);
        const top = this.add.rectangle(0, -height / 2, width, 10, Phaser.Display.Color.GetColor(
          Math.min(255, (color >> 16) + 40),
          Math.min(255, ((color >> 8) & 0xff) + 40),
          Math.min(255, (color & 0xff) + 40)
        ), 0.8);
        const side = this.add.rectangle(width / 2, 0, 8, height, Phaser.Display.Color.GetColor(
          Math.max(0, (color >> 16) - 40),
          Math.max(0, ((color >> 8) & 0xff) - 40),
          Math.max(0, (color & 0xff) - 40)
        ), 0.8);
        const box = this.add.container(x, y - height / 2, [base, top, side]);
        this.cargoBoxes.push(box);
        x += width + Phaser.Math.Between(80, 140);
      }
    });

    // Setup collisions
    this.physics.add.overlap(
      this.player,
      this.obstacles,
      ((player: Phaser.Physics.Arcade.GameObjectWithBody, obstacle: Phaser.Physics.Arcade.GameObjectWithBody) => {
        if (obstacle instanceof Phaser.Physics.Arcade.Sprite) {
          if (obstacle.getData('isCorrect')) {
            // Correct answer
            this.score += 10;
            this.scoreText.setText(`Score: ${this.score}`);
            const text = obstacle.getData('text');
            if (text) text.destroy();
            obstacle.destroy();
            this.spawnNewProblem(); // Spawn new problem immediately after correct answer
          } else {
            // Wrong answer - Game Over
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
    const wrongAnswers = [correctAnswer + 1, correctAnswer - 1];

    // Calculate the rightmost obstacle's position
    const rightmostObstacle = this.obstacles.getChildren().reduce((maxX: number, obstacle: any) => {
      return Math.max(maxX, obstacle.x);
    }, 0);

    // Spawn obstacles with answers
    for (let i = 0; i < 3; i++) {
      const answer = i === correctLane ? correctAnswer : wrongAnswers[i > correctLane ? 1 : 0];
      const obstacle = this.obstacles.create(
        Math.max(800, rightmostObstacle + this.OBSTACLE_SPACING), // Ensure minimum spacing
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

  update(time: number, delta: number) {
    if (!this.player) return;
    if (!this.isGameStarted || this.gameOver) return;

    // Increase speed based on score (increase base speed by 35%)
    this.speed = 135 + Math.floor(this.score / 50) * 13.5; // Increase speed by 13.5 every 50 points

    // Update player position based on speed
    this.player.y = this.lanes[this.currentLane]; // Ensure player sticks to the current lane

    // Handle lane changes with cooldown
    if (this.canSwitchLane) {
      if (this.cursors?.up.isDown && this.currentLane > 0) {
        this.currentLane--;
        this.player.y = this.lanes[this.currentLane];
        this.canSwitchLane = false;
        // Add directional blur effect
        this.player.setTint(0x00ff00);
        this.time.delayedCall(this.LANE_SWITCH_COOLDOWN, () => {
          this.canSwitchLane = true;
          this.player.clearTint();
        });
      } else if (this.cursors?.down.isDown && this.currentLane < 2) {
        this.currentLane++;
        this.player.y = this.lanes[this.currentLane];
        this.canSwitchLane = false;
        // Add directional blur effect
        this.player.setTint(0x00ff00);
        this.time.delayedCall(this.LANE_SWITCH_COOLDOWN, () => {
          this.canSwitchLane = true;
          this.player.clearTint();
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
      // Do NOT set obstacle.y, angle, or tint here
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

    // Animate only cargo boxes
    this.cargoBoxes.forEach((box, i) => {
      box.y += Math.sin(time / 600 + i) * 0.3;
      box.angle = Math.sin(time / 900 + i) * 2;
    });
  }
} 