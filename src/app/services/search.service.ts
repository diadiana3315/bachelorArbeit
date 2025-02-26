import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchTermSource = new BehaviorSubject<string>(''); // Store the search term
  searchTerm$ = this.searchTermSource.asObservable(); // Observable for components to subscribe

  setSearchTerm(term: string) {
    this.searchTermSource.next(term); // Update search term globally
  }
}
