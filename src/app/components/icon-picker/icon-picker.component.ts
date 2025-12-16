import {
  Component,
  computed,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  IonIcon,
} from '@ionic/angular/standalone';
import { outlineIcons, Icon } from 'src/app/utils/icons';

@Component({
  selector: 'app-icon-picker',
  templateUrl: './icon-picker.component.html',
  styleUrls: ['./icon-picker.component.scss'],
  imports: [
    IonIcon,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonSearchbar,
    IonTitle,
    IonToolbar,
  ],
})
export class IconPickerComponent implements OnInit {
  icons = outlineIcons;
  selectedIcon: Icon | null = null;

  previousIcon = input<Icon | null>();
  selectionSave = output<Icon | null>();
  selectionCancel = output<void>();

  searchQuery = signal<string>('');
  filteredIcons = computed<Icon[]>(() =>
    this.icons.filter((icon) =>
      icon.name.toLowerCase().includes(this.searchQuery())
    )
  );

  ngOnInit() {
    this.selectedIcon = this.previousIcon() ?? null;
  }

  cancelSelection() {
    this.selectionCancel.emit();
  }

  confirmSelection() {
    this.selectionSave.emit(this.selectedIcon);
  }

  selectIcon(icon: Icon | null) {
    this.selectedIcon = icon;
  }

  searchbarInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const searchValue = inputElement.value?.trim()?.toLowerCase() ?? '';
    this.searchQuery.set(searchValue);
  }
}
