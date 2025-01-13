import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UpdaterService } from './updater.service';

@Component({
  selector: 'app-updater',
  standalone: true,
  imports: [],
  templateUrl: './updater.component.html',
  styleUrl: './updater.component.css'
})
export class UpdaterComponent {
  private updater = inject(UpdaterService);
  updateAvailable = toSignal(this.updater.isUpdateAvailable());
  progress = toSignal(this.updater.getProgress());

  constructor() {
    this.updater.check();
  }

  downloadAndInstall() {
    this.updater.downloadAndInstall();
  }
}
