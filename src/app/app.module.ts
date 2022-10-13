import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './pages/home/home.component';
import { ImageUploaderComponent } from './components/image-uploader/image-uploader.component';
import { ImageVisualComponent } from './components/image-visual/image-visual.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ImageUploaderComponent,
    ImageVisualComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
