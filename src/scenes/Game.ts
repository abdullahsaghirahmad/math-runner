import { MathProblem } from '../objects/MathProblem';

export class Game extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private speed: number = 100;
  private speedIncreaseThreshold: number = 10;
  private correctAnswers: number = 0;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private currentProblem: MathProblem | null = null;
  private problemText!: Phaser.GameObjects.Text;
  private gameOver: boolean = false;
  private isGameStarted: boolean = false;
  private lanes: number[] = [200, 400, 600]; // Y positions for the three lanes
  private currentLane: number = 1; // Start in middle lane (0-based index)
  private background!: Phaser.GameObjects.TileSprite;
  private startBanner!: Phaser.GameObjects.Container;
  private restartButton!: Phaser.GameObjects.Text;
  private readonly OBSTACLE_SPACING: number = 375; // Fixed spacing between obstacles (increased by 25%)
  private canSwitchLane: boolean = true; // Flag to control lane switching cooldown
  private readonly LANE_SWITCH_COOLDOWN: number = 150; // Cooldown time in milliseconds

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
    this.player.setImmovable(true); // Make player immovable

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
    this.speed = 100;

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

    // Generate new math problem
    this.currentProblem = new MathProblem();
    this.problemText.setText(this.currentProblem.getProblem());

    // Create obstacle textures
    const obstacleGraphics = this.add.graphics();
    obstacleGraphics.fillStyle(0xff0000, 1);
    obstacleGraphics.fillRect(-15, -15, 30, 30);
    obstacleGraphics.generateTexture('obstacle', 32, 32);
    obstacleGraphics.destroy();

    // Determine correct answer lane
    const correctLane = Phaser.Math.Between(0, 2);
    const correctAnswer = this.currentProblem.getAnswer();
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
    }
  }

  update() {
    if (!this.player) return;
    if (!this.isGameStarted || this.gameOver) return;

    // Scroll background
    this.background.tilePositionX += this.speed / 100;

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

    // Move answer text with obstacles
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
  }
} 