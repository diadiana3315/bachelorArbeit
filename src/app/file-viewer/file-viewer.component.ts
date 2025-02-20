import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'app-file-viewer',
  templateUrl: './file-viewer.component.html',
  styleUrl: './file-viewer.component.css'
})
export class FileViewerComponent implements OnInit{
  fileUrl: string | null = null;

  constructor(private sanitizer: DomSanitizer,
              private router: Router,
              private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.fileUrl = params['fileURL'];
      console.log('File URL from query params:', this.fileUrl);

      if (!this.fileUrl) {
        console.error('No file URL provided, redirecting to library');
        this.router.navigate(['/library']);
      }
    });
  }
}
