import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';

import { AdminRoutingModule } from './admin-routing.module';

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

@NgModule({
  declarations: [
    AdminDashboardComponent,
    QuestionListComponent,
    QuestionFormComponent,
    UserListComponent,
    UserFormComponent,
    EventListComponent,
    EventFormComponent,
    StatsDashboardComponent,
    GameCreatorComponent,
    GameMonitorComponent,
    EventManagerComponent,
    QuestionManagerEventComponent,
    TeamManagerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdminRoutingModule,
    QRCodeModule
  ]
})
export class AdminModule {}
