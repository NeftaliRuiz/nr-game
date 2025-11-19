import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-timer',
  template: `
    <div class="flex flex-col items-center justify-center">
      <div class="relative w-32 h-32">
        <!-- Circular progress -->
        <svg class="transform -rotate-90 w-32 h-32">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            stroke-width="8"
            fill="transparent"
            class="text-white/20"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            stroke-width="8"
            fill="transparent"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="dashOffset"
            [ngClass]="{
              'text-success': timeRemaining > timeLimit * 0.5,
              'text-warning': timeRemaining <= timeLimit * 0.5 && timeRemaining > timeLimit * 0.25,
              'text-danger': timeRemaining <= timeLimit * 0.25
            }"
            class="transition-all duration-1000 ease-linear"
          />
        </svg>
        
        <!-- Timer text -->
        <div class="absolute inset-0 flex items-center justify-center">
          <span 
            class="text-4xl font-bold"
            [ngClass]="{
              'text-white': timeRemaining > timeLimit * 0.5,
              'text-warning': timeRemaining <= timeLimit * 0.5 && timeRemaining > timeLimit * 0.25,
              'text-danger animate-pulse': timeRemaining <= timeLimit * 0.25
            }"
          >
            {{ timeRemaining }}
          </span>
        </div>
      </div>
      
      <p class="mt-4 text-sm text-white/60">segundos restantes</p>
    </div>
  `,
  styles: []
})
export class TimerComponent implements OnInit, OnDestroy {
  @Input() timeLimit: number = 20;
  @Output() timeUp = new EventEmitter<void>();
  @Output() tick = new EventEmitter<number>();

  timeRemaining: number = 20;
  circumference: number = 2 * Math.PI * 56;
  dashOffset: number = 0;
  private interval: any;

  ngOnInit(): void {
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  startTimer(): void {
    this.timeRemaining = this.timeLimit;
    this.updateProgress();
    
    this.interval = setInterval(() => {
      this.timeRemaining--;
      this.updateProgress();
      this.tick.emit(this.timeRemaining);
      
      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.timeUp.emit();
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  resetTimer(): void {
    this.stopTimer();
    this.startTimer();
  }

  private updateProgress(): void {
    const progress = this.timeRemaining / this.timeLimit;
    this.dashOffset = this.circumference * (1 - progress);
  }
}
