import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectionsComponent } from './components/projections/projections.component';
import { HomeComponent } from './pages/home/home.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent },
  { path: 'projections', component: ProjectionsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
