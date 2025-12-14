import {
  Component,
  ElementRef,
  inject,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Item } from 'src/app/interfaces/item';
import { DbClient } from 'src/app/services/db-client';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonTitle,
  IonToolbar,
  IonHeader,
  IonInput,
  IonTextarea,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { ItemList } from 'src/app/interfaces/item-list';

@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.scss'],
  imports: [
    IonLabel,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    IonContent,
    IonButton,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class AddItemComponent implements OnInit {
  dbClient = inject(DbClient);

  mainContainer = viewChild<ElementRef>('mainContainer');
  closeForm = output<void>();
  itemToUpdate = signal<Item | null>(null);
  availableLists = signal<ItemList[]>([]);
  selectedLists = signal<number[]>([]);
  form: FormGroup;

  constructor() {
    addIcons({ close });

    this.form = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(3)]),
      description: new FormControl(''),
    });
  }

  async ngOnInit() {
    const { data, error } = await this.dbClient.getLists();
    if (error) {
      console.log(error);
    }
    this.availableLists.set(data || []);
  }
  // async ngOnInit() {
  //   const iconsImport = await import('ionicons/icons');
  //   const { default: _, close, ...icons } = iconsImport;
  //   addIcons(icons);
  // }

  saveItem() {
    const name = this.form.get('name')!.value.trim();
    const description = this.form.get('description')!.value.trim() || null;
    const listsIds = this.selectedLists();

    if (this.itemToUpdate() === null) {
      this.dbClient.createItem(listsIds, { name, description });
    } else {
      // update item
    }
    this.close();
  }

  handleListSelection(event: Event) {
    const target = event.target as HTMLIonSelectElement;
    this.selectedLists.set(target.value);
  }

  close() {
    const ANIMATION_MS = 500;
    const containerElement = this.mainContainer()?.nativeElement;

    if (containerElement) {
      containerElement.style.transition = `opacity ${ANIMATION_MS}ms ease`;
      containerElement.style.opacity = '0';
    }

    setTimeout(() => {
      this.closeForm.emit();
    }, ANIMATION_MS);
  }
}
