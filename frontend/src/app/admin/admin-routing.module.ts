import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminDashboardComponent } from '../components/admin-dashboard/admin-dashboard.component';
import { QuestionListComponent } from '../components/question-list/question-list.component';
import { QuestionFormComponent } from '../components/question-form/question-form.component';
import { UserListComponent } from '../components/user-list/user-list.component';
import { UserFormComponent } from '../components/user-form/user-form.component';
import { EventListComponent } from '../components/event-list/event-list.component';
import { EventFormComponent } from '../components/event-form/event-form.component';
import { StatsDashboardComponent } from '../components/stats-dashboard/stats-dashboard.component';
import { GameCreatorComponent } from '../components/game-creator/game-creator.component';
import { GameMonitorComponent } from '../components/game-monitor/game-monitor.component';
import { EventManagerComponent } from '../components/event-manager/event-manager.component';
import { QuestionManagerEventComponent } from '../components/question-manager-event/question-manager-event.component';
import { TeamManagerComponent } from '../components/team-manager/team-manager.component';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: AdminDashboardComponent },
  { path: 'users', component: UserListComponent },
  { path: 'users/new', component: UserFormComponent },
  { path: 'users/edit/:id', component: UserFormComponent },
  { path: 'questions', component: QuestionListComponent },
  { path: 'questions/new', component: QuestionFormComponent },
  { path: 'questions/edit/:id', component: QuestionFormComponent },
  { path: 'events', component: EventListComponent },
  { path: 'events/new', component: EventFormComponent },
  { path: 'events/edit/:id', component: EventFormComponent },
  { path: 'statistics', component: StatsDashboardComponent },
  { path: 'game-creator', component: GameCreatorComponent },
  { path: 'game-monitor', component: GameMonitorComponent },
  { path: 'event-manager', component: EventManagerComponent },
  { path: 'question-manager-event', component: QuestionManagerEventComponent },
  { path: 'teams', component: TeamManagerComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
