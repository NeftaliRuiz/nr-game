import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameBoardComponent } from './components/game-board/game-board.component';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { GameKahootComponent } from './components/game-kahoot/game-kahoot.component';
import { GameKahootHostComponent } from './components/game-kahoot-host/game-kahoot-host.component';
import { GameKahootPlayerComponent } from './components/game-kahoot-player/game-kahoot-player.component';
import { GameGeopartyComponent } from './components/game-geoparty/game-geoparty.component';
import { GameWordsearchComponent } from './components/game-wordsearch/game-wordsearch.component';
import { QuestionUploadComponent } from './components/question-upload/question-upload.component';
import { AuthGuard } from './guards/auth.guard';

import { GameJoinComponent } from './components/game-join/game-join.component';
import { TeamManagerComponent } from './components/team-manager/team-manager.component';

const routes: Routes = [
  // Public routes
  { path: '', component: GameBoardComponent },
  { path: 'game', component: GameBoardComponent },
  { path: 'join', component: GameJoinComponent }, // JOIN ROUTE
  { path: 'game/join', component: GameJoinComponent }, // ALTERNATIVE JOIN ROUTE
  
  // Question upload (for hosts)
  { path: 'questions/upload', component: QuestionUploadComponent },
  
  // Kahoot game modes
  { path: 'game/kahoot', component: GameKahootComponent },
  { path: 'game/kahoot/host', component: GameKahootHostComponent }, // Host/Presenter view
  { path: 'game/kahoot/play', component: GameKahootPlayerComponent }, // Player join view
  { path: 'game/kahoot/join/:roomCode', component: GameKahootPlayerComponent }, // Direct join with code
  { path: 'game/kahoot/:gameId', component: GameKahootComponent },
  
  // Other game modes
  { path: 'game/geoparty', component: GameGeopartyComponent },
  { path: 'game/geoparty/:gameId', component: GameGeopartyComponent },
  { path: 'game/wordsearch', component: GameWordsearchComponent }, // Create game
  { path: 'game/wordsearch/join', component: GameWordsearchComponent }, // Join game
  { path: 'game/wordsearch/:roomCode', component: GameWordsearchComponent }, // Game room
  
  // Admin authentication
  { path: 'admin/login', component: AdminLoginComponent },

  // Admin protected routes (lazy-loaded module)
  {
    path: 'admin',
    canActivate: [AuthGuard],
    data: { requireAdmin: true },
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  
  // Redirect unknown routes to home
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

