export class MathProblem {
  private num1: number = 0;
  private num2: number = 0;
  private operation: string = '+';
  private answer: number = 0;

  constructor() {
    this.generateProblem();
  }

  private generateProblem(): void {
    this.num1 = Math.floor(Math.random() * 10) + 1;
    this.num2 = Math.floor(Math.random() * 10) + 1;
    const operations = ['+', '-', '*'];
    this.operation = operations[Math.floor(Math.random() * operations.length)];

    switch (this.operation) {
      case '+':
        this.answer = this.num1 + this.num2;
        break;
      case '-':
        // Ensure positive result for subtraction
        if (this.num1 < this.num2) {
          [this.num1, this.num2] = [this.num2, this.num1];
        }
        this.answer = this.num1 - this.num2;
        break;
      case '*':
        this.answer = this.num1 * this.num2;
        break;
    }
  }

  getProblem(): string {
    return `${this.num1} ${this.operation} ${this.num2}`;
  }

  getAnswer(): number {
    return this.answer;
  }

  checkAnswer(userAnswer: number): boolean {
    return userAnswer === this.answer;
  }
} 