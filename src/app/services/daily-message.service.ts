import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DailyMessageService {
  constructor(private http: HttpClient) {}

  // Fetch the txt file from a URL
  getMessagesFromTxt(): Observable<string[]> {
    const txtFileUrl = 'https://firebasestorage.googleapis.com/v0/b/bachelor-858d7.firebasestorage.app/o/dailyMessages.txt?alt=media&token=63c92354-b1a6-45c8-8ff8-926bb5655430'; // Replace with your file URL
    return this.http.get(txtFileUrl, { responseType: 'text' }).pipe(
      map((data: string) => data.split('\n').map(line => line.trim()))
    );
  }

  // Get a random message based on the day
  getDailyMessage(): Observable<string> {
    return this.getMessagesFromTxt().pipe(
      map(messages => {
        const dayOfYear = new Date().getDate(); // Get day of the year (1-365)
         // Choose a message based on the day
        return messages[dayOfYear % messages.length];
      })
    );
  }
}
