import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavbarComponent } from './navbar/navbar.component';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    standalone: true,
    imports: [NavbarComponent, RouterOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'Bite Barometer';
}
