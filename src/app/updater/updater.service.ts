import { debug, error, info, trace } from '@tauri-apps/plugin-log';
import { check, Update } from '@tauri-apps/plugin-updater';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UpdaterService {
  private updateAvailable = new BehaviorSubject(false);
  private update?: Update;
  private progress = new BehaviorSubject(0);
  private time = new BehaviorSubject(0);
  private error = new BehaviorSubject(false);

  public async check() {
    try {
      info('Checking for updates...');
      const update = await check({ timeout: 2000 });
      if (!update) {
        info('No update available.');
        return;
      }
      info('Update available.');
      this.update = update;
      this.updateAvailable.next(true);
    } catch (e) {
      error('An error occurred when checking for updates.');
    }
  }

  public async downloadAndInstall() {
    let downloaded = 0;
    let contentLength = 0;
    if (!this.update) {
      return;
    }
    this.error.next(false);
    this.time.next(0);
    const startTime = (new Date).getTime();
    info('Downloading update...');
    try {
      await this.update.download((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength ?? 0;
            debug(`Started downloading ${event.data.contentLength} bytes.`);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            trace(`Downloaded ${downloaded} from ${contentLength}.`);
            // Progress events might still be triggered shortly after an error.
            // These should no longer update the progress state.
            if (!this.error.getValue()) {
              this.progress.next(downloaded / contentLength);
            }
            break;
          case 'Finished':
            debug('Download finished.');
            break;
        }
      });
      this.time.next((new Date()).getMilliseconds() - startTime);
      info('Installing update...');
      //this.update.install();
    } catch (e) {
      error('An error occurred during download or installation of the update.');
      error(JSON.stringify(e));
      this.time.next((new Date()).getTime() - startTime);
      this.error.next(true);
      this.progress.next(0);
    }
  }

  /** Returns true if an update was downloaded when calling checkAndDownload.  */
  public isUpdateAvailable(): Observable<boolean> {
    return this.updateAvailable;
  }

  public getProgress(): Observable<number> {
    return this.progress;
  }

  public getTime(): Observable<number> {
    return this.time;
  }

  public isError(): Observable<boolean> {
    return this.error;
  }

  public resetState() {
    this.error.next(false);
    this.progress.next(0);
  }
}
