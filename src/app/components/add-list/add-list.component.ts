import { Component, inject, OnInit, signal } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { close } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { DbClient } from 'src/app/services/db-client';
import { Item } from 'src/app/interfaces/item';

@Component({
  selector: 'app-add-list',
  templateUrl: './add-list.component.html',
  styleUrls: ['./add-list.component.scss'],
  imports: [
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
  ],
})
export class AddListComponent implements OnInit {
  dbClient = inject(DbClient);
  modalCtrl = inject(ModalController);

  itemsToAdd = signal<Item[]>([]);
  selectedItems = signal<number[]>([]);

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

  // para iconos usar esto
  // https://ionicframework.com/docs/api/select#typeahead-component

  saveList() {
    const name = this.form.get('name')!.value.trim();
    this.dbClient.createList({ name }, [...(this.selectedItems() || [])]);

    this.modalCtrl.dismiss(null, 'confirm');
  }

  close() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
