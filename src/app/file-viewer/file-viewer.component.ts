import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-file-viewer',
  templateUrl: './file-viewer.component.html',
  styleUrls: ['./file-viewer.component.css']
})
export class FileViewerComponent implements OnInit {
  fileUrl: string | null = null;
  browserLanguage: string = 'en-US'; // Default language

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.fileUrl = params['fileURL'];
      if (!this.fileUrl) {
        this.router.navigate(['/library']);
      }
    });

    // Detect browser's default language
    this.browserLanguage = navigator.language || 'en-US';
  }
}
