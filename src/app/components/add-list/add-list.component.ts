import {
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonTitle,
  IonToolbar,
  IonHeader,
  IonInput,
  IonLabel,
  IonSelect,
  IonSelectOption,
  ModalController,
  IonModal,
} from '@ionic/angular/standalone';
import { close } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { DbClient } from 'src/app/services/db-client';
import { IconPickerComponent } from '../icon-picker/icon-picker.component';
import { Item } from 'src/app/interfaces/item';
import { Icon } from 'src/app/utils/icons';

@Component({
  selector: 'app-add-list',
  templateUrl: './add-list.component.html',
  styleUrls: ['./add-list.component.scss'],
  imports: [
    IonModal,
    IonLabel,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    IonContent,
    IonButton,
    IonInput,
    IonSelect,
    IonSelectOption,
    FormsModule,
    ReactiveFormsModule,
    IconPickerComponent,
  ],
})
export class AddListComponent implements OnInit {
  // x = viewChild()
  @ViewChild('selectIconModal', { static: true }) selectIconModal!: IonModal;
  dbClient = inject(DbClient);
  modalCtrl = inject(ModalController);

  itemsToAdd = signal<Item[]>([]);
  selectedItems = signal<number[]>([]);
  selectedIcon = signal<Icon | null>(null);

  form: FormGroup;
  constructor() {
    addIcons({ close });
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    });
  }

  async ngOnInit() {
    const { data, error } = await this.dbClient.getItems();
    if (error) {
      console.log(error);
    }
    this.itemsToAdd.set(data);
  }

  handleItemSelection(event: Event) {
    const target = event.target as HTMLIonSelectElement;
    this.selectedItems.set(target.value);
  }

  saveSelectedIcon(icon: Icon | null) {
    this.selectedIcon.set(icon);
    this.selectIconModal.dismiss();
  }

  closeIconSelect() {
    this.selectIconModal.dismiss();
  }

  saveList() {
    const name = this.form.get('name')!.value.trim();
    this.dbClient.createList({ name, icon: this.selectedIcon()?.name }, [
      ...(this.selectedItems() || []),
    ]);

    this.modalCtrl.dismiss(null, 'confirm');
  }

  close() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
