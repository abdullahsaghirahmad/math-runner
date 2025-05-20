export class MathProblem {
  private num1: number = 0;
  private num2: number = 0;
  private operation: string = '+';
  private answer: number = 0;
  private score: number = 0;
  private problem: string = '';

  constructor(score: number = 0) {
    this.score = score;
    this.generateProblem();
  }

  private generateProblem(): void {
    const complexity = Math.floor(this.score / 50); // Increase complexity every 50 points
    let num1: number, num2: number, operation: string;

    switch (complexity) {
      case 0: // Simple addition/subtraction
        num1 = Phaser.Math.Between(1, 10);
        num2 = Phaser.Math.Between(1, 10);
        operation = Phaser.Math.RND.pick(['+', '-']);
        break;
      case 1: // Multiplication
        num1 = Phaser.Math.Between(1, 10);
        num2 = Phaser.Math.Between(1, 10);
        operation = '*';
        break;
      case 2: // Division
        num1 = Phaser.Math.Between(1, 10);
        num2 = Phaser.Math.Between(1, 10);
        operation = '/';
        break;
      default: // Complex operations (e.g., exponents)
        num1 = Phaser.Math.Between(1, 10);
        num2 = Phaser.Math.Between(1, 5);
        operation = '^';
    }

    this.problem = `${num1} ${operation} ${num2}`;
    this.answer = this.calculateAnswer(num1, num2, operation);
  }

  private calculateAnswer(num1: number, num2: number, operation: string): number {
    switch (operation) {
      case '+': return num1 + num2;
      case '-': return num1 - num2;
      case '*': return num1 * num2;
      case '/': return num1 / num2;
      case '^': return Math.pow(num1, num2);
      default: return 0;
    }
  }

  getProblem(): string {
    return this.problem;
  }

  getAnswer(): number {
    return this.answer;
  }

  checkAnswer(userAnswer: number): boolean {
    return userAnswer === this.answer;
  }
} 