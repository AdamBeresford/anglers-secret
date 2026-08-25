import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-privacy',
    templateUrl: './privacy.component.html',
    styleUrl: './privacy.component.scss',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivacyComponent {

  // Bump when the notice materially changes so users can see it has been revised
  readonly lastUpdated = '25 August 2026';

  readonly dormantAccountMonths = 24;

}
