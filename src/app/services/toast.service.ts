import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warn' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  public toasts = signal<ToastMessage[]>([]);

  public show(type: ToastType, title: string, message?: string, durationMs: number = 4500): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = {
      id,
      type,
      title,
      message,
      timestamp: new Date()
    };

    this.toasts.update(current => [...current, newToast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.remove(id);
      }, durationMs);
    }
  }

  public success(title: string, message?: string): void {
    this.show('success', title, message);
  }

  public error(title: string, message?: string): void {
    this.show('error', title, message, 6000);
  }

  public warn(title: string, message?: string): void {
    this.show('warn', title, message);
  }

  public info(title: string, message?: string): void {
    this.show('info', title, message);
  }

  public remove(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
