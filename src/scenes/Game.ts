import { MathProblem } from '../objects/MathProblem';

export class Game extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private speed: number = 200;
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

    this.player = this.physics.add.sprite(100, this.lanes[this.currentLane], 'player');
    this.player.setCollideWorldBounds(true);

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

    // Create start banner
    this.createStartBanner();

    // Setup collisions
    this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, undefined, this);
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
    this.input.keyboard.once('keydown-SPACE', () => {
      this.startBanner.destroy();
      this.isGameStarted = true;
      this.spawnNewProblem();
    });
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

    // Create answer textures
    const answerGraphics = this.add.graphics();
    answerGraphics.fillStyle(0x00ff00, 1);
    answerGraphics.fillRect(-15, -15, 30, 30);
    answerGraphics.generateTexture('answer', 32, 32);
    answerGraphics.destroy();

    // Determine correct answer lane
    const correctLane = Phaser.Math.Between(0, 2);
    const correctAnswer = this.currentProblem.getAnswer();
    const wrongAnswers = [correctAnswer + 1, correctAnswer - 1];

    // Spawn obstacles with answers
    for (let i = 0; i < 3; i++) {
      const answer = i === correctLane ? correctAnswer : wrongAnswers[i > correctLane ? 1 : 0];
      const obstacle = this.obstacles.create(
        800, // Start from right side
        this.lanes[i],
        i === correctLane ? 'answer' : 'obstacle'
      );
      
      // Add answer text above obstacle
      const answerText = this.add.text(obstacle.x, obstacle.y - 30, answer.toString(), {
        fontSize: '24px',
        color: '#fff'
      }).setOrigin(0.5);
      
      obstacle.setData('answer', answer);
      obstacle.setData('text', answerText);
      obstacle.setVelocityX(-300); // Move from right to left
    }
  }

  private hitObstacle(player: Phaser.Physics.Arcade.GameObjectWithBody, obstacle: Phaser.Physics.Arcade.GameObjectWithBody) {
    if (obstacle instanceof Phaser.Physics.Arcade.Sprite) {
      const answer = obstacle.getData('answer');
      const text = obstacle.getData('text');
      
      if (answer === this.currentProblem?.getAnswer()) {
        // Correct answer
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        obstacle.destroy();
        text.destroy();
        this.spawnNewProblem();
      } else {
        // Wrong answer
        this.gameOver = true;
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.add.text(400, 300, 'Game Over', { fontSize: '64px', color: '#fff' }).setOrigin(0.5);
      }
    }
  }

  update() {
    if (!this.isGameStarted || this.gameOver) return;

    // Scroll background
    this.background.tilePositionX += 5;

    // Handle lane changes
    if (this.cursors?.up.isDown && this.currentLane > 0) {
      this.currentLane--;
      this.player.y = this.lanes[this.currentLane];
    } else if (this.cursors?.down.isDown && this.currentLane < 2) {
      this.currentLane++;
      this.player.y = this.lanes[this.currentLane];
    }

    // Move player forward
    this.player.x += 5;

    // Clean up obstacles that are off screen
    this.obstacles.getChildren().forEach((obstacle: any) => {
      if (obstacle.x < -50) {
        const text = obstacle.getData('text');
        if (text) text.destroy();
        obstacle.destroy();
      }
    });
  }
} 