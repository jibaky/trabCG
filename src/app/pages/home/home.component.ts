import { Component, OnInit } from '@angular/core';
import { DrawService } from 'src/app/services/draw.service';
import { ImageService } from 'src/app/services/image.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(public imageService: ImageService, public drawService: DrawService) { }
  
  ngOnInit(): void {
  }

}
