import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GameBoardComponent } from './components/game-board/game-board.component';
import { QuestionCardComponent } from './components/question-card/question-card.component';
import { ScoreboardComponent } from './components/scoreboard/scoreboard.component';
import { TimerComponent } from './components/timer/timer.component';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { GameKahootComponent } from './components/game-kahoot/game-kahoot.component';
import { GameGeopartyComponent } from './components/game-geoparty/game-geoparty.component';
import { GameWordsearchComponent } from './components/game-wordsearch/game-wordsearch.component';
import { GameJoinComponent } from './components/game-join/game-join.component';

import { TriviaService } from './services/trivia.service';
import { AuthService } from './services/auth.service';
import { AdminService } from './services/admin.service';
import { EventService } from './services/event.service';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AuthGuard } from './guards/auth.guard';

@NgModule({
  declarations: [
    AppComponent,
    GameBoardComponent,
    QuestionCardComponent,
    ScoreboardComponent,
    TimerComponent,
    AdminLoginComponent,
    GameJoinComponent,
    GameKahootComponent,
    GameGeopartyComponent,
    GameWordsearchComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  providers: [
    TriviaService,
    AuthService,
    AdminService,
    EventService,
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

