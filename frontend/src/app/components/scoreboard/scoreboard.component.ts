import { Component, Input } from '@angular/core';
import { LeaderboardEntry } from '../../models/team.model';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

@Component({
  selector: 'app-scoreboard',
  template: `
    <div class="card">
      <h2 class="text-3xl font-bold mb-6 text-center">🏆 Tabla de Posiciones</h2>
      
      <div class="space-y-3" @listAnimation>
        <div 
          *ngFor="let entry of leaderboard; let i = index"
          class="flex items-center gap-4 p-4 rounded-xl transition-all duration-300"
          [ngClass]="{
            'bg-green-500/20 border-2 border-green-500': i === 0,
            'bg-gray-400/20 border-2 border-gray-400': i === 1,
            'bg-orange-600/20 border-2 border-orange-600': i === 2,
            'bg-white/5 border border-white/20': i > 2
          }"
          @fadeIn
        >
          <!-- Rank -->
          <div class="text-3xl font-bold w-12 text-center">
            <span *ngIf="i === 0">🥇</span>
            <span *ngIf="i === 1">🥈</span>
            <span *ngIf="i === 2">🥉</span>
            <span *ngIf="i > 2" class="text-white/60">#{{ i + 1 }}</span>
          </div>

          <!-- Team icon and color -->
          <div 
            class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            [style.background-color]="entry.color"
          >
            {{ entry.icon }}
          </div>

          <!-- Team info -->
          <div class="flex-1">
            <h3 class="text-xl font-bold">{{ entry.name }}</h3>
            <div class="flex gap-4 text-sm text-white/70">
              <span>✅ {{ entry.correctAnswers }}/{{ entry.totalAnswers }}</span>
              <span>📊 {{ entry.accuracy }}%</span>
              <span *ngIf="entry.streak > 0">🔥 Racha: {{ entry.streak }}</span>
            </div>
          </div>

          <!-- Score -->
          <div class="text-right">
            <div class="text-3xl font-bold text-primary">{{ entry.score }}</div>
            <div class="text-sm text-white/60">puntos</div>
          </div>
        </div>
      </div>

      <div *ngIf="!leaderboard || leaderboard.length === 0" class="text-center text-white/60 py-8">
        No hay equipos registrados aún
      </div>
    </div>
  `,
  styles: [],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(100, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class ScoreboardComponent {
  @Input() leaderboard: LeaderboardEntry[] = [];
}
