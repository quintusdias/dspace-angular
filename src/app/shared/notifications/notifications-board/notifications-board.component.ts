import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { NotificationsService } from '../notifications.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../app.reducer';
import { notificationsStateSelector } from '../selectors';
import { difference } from 'lodash';
import { INotification } from '../models/notification.model';
import { NotificationsState } from '../notifications.reducers';
import { INotificationBoardOptions } from '../models/notification-options.model';

@Component({
  selector: 'ds-notifications-board',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './notifications-board.component.html',
  styleUrls: ['./notifications-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsBoardComponent implements OnInit, OnDestroy {

  @Input() set options(opt: INotificationBoardOptions) {
    this.attachChanges(opt);
  }

  @Output() onCreate = new EventEmitter();
  @Output() onDestroy = new EventEmitter();

  public notifications: INotification[] = [];
  public position: ['top' | 'bottom' | 'middle', 'right' | 'left' | 'center'] = ['bottom', 'right'];

  // private listener: Subscription;

  // Received values
  private maxStack = 8;

  // Sent values
  public rtl = false;
  public animate: 'fade' | 'fromTop' | 'fromRight' | 'fromBottom' | 'fromLeft' | 'rotate' | 'scale' = 'fromRight';

  constructor(private service: NotificationsService,
              private store: Store<AppState>,
              private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    // this.listener =
    this.store.select(notificationsStateSelector)
      .subscribe((state: NotificationsState) => {
        if (state.length === 0) {
          this.notifications = [];
        } else if (state.length > this.notifications.length) {
          // Add
          const newElem = difference(state, this.notifications);
          console.log('new Elements #', newElem.length);

          newElem.forEach((notification) => {
            this.add(notification);
          });
        } else {
          // Remove
          const delElem = difference(this.notifications, state);
          delElem.forEach((notification) => {
            this.notifications = this.notifications.filter((item: INotification) => item.id !== notification.id);

          });
        }
        this.cdr.markForCheck();
      });
  }

  // Add the new notification to the notification array
  add(item: INotification): void {
    const toBlock: boolean = this.block(item);
    if (!toBlock) {
      if (this.notifications.length >= this.maxStack) {
        this.notifications.splice(this.notifications.length - 1, 1);
      }
      this.notifications.splice(0, 0, item);
    } else {
      // Remove the notification from the store
      // This notification was in the store, but not in this.notifications
      // because it was a blocked duplicate
      this.service.remove(item);
    }
  }

  block(item: INotification): boolean {
    const toCheck = item.html ? this.checkHtml : this.checkStandard;
    this.notifications.forEach((notification) => {
      if (toCheck(notification, item)) {
        return true;
      }
    });

    if (this.notifications.length > 0) {
        this.notifications.forEach( (notification) => {
          if (toCheck(notification, item)) {
            return true;
          }
        });
      }

    let comp: INotification;
    if (this.notifications.length > 0) {
      comp = this.notifications[0];
    } else {
      return false;
    }
    return toCheck(comp, item);
  }

  checkStandard(checker: INotification, item: INotification): boolean {
    return checker.type === item.type && checker.title === item.title && checker.content === item.content;
  }

  checkHtml(checker: INotification, item: INotification): boolean {
    return checker.html ? checker.type === item.type && checker.title === item.title && checker.content === item.content && checker.html === item.html : false;
  }

  // Attach all the changes received in the options object
  attachChanges(options: any): void {
    Object.keys(options).forEach((a) => {
      if (this.hasOwnProperty(a)) {
        (this as any)[a] = options[a];
      }
    });
  }

  ngOnDestroy(): void {
    // if (this.listener) {
    //   this.listener.unsubscribe();
    // }
  }
}
