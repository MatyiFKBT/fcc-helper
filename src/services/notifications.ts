import Swal from 'sweetalert2';

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Base toast configuration for compact notifications
  private getBaseToastConfig() {
    return {
      toast: true,
      position: 'bottom-end' as const,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      width: '320px',
      padding: '12px',
      didOpen: (toast: HTMLElement) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    };
  }

  // Success toast notification
  public success(title: string, message?: string): void {
    Swal.fire({
      ...this.getBaseToastConfig(),
      icon: 'success',
      title: title,
      text: message,
      background: '#d4edda',
      color: '#155724',
    });
  }

  // Error toast notification
  public error(title: string, message?: string): void {
    Swal.fire({
      ...this.getBaseToastConfig(),
      icon: 'error',
      title: title,
      text: message,
      timer: 3500,
      background: '#f8d7da',
      color: '#721c24',
    });
  }

  // Warning toast notification
  public warning(title: string, message?: string): void {
    Swal.fire({
      ...this.getBaseToastConfig(),
      icon: 'warning',
      title: title,
      text: message,
      timer: 3000,
      background: '#fff3cd',
      color: '#856404',
    });
  }

  // Info toast notification
  public info(title: string, message?: string): void {
    Swal.fire({
      ...this.getBaseToastConfig(),
      icon: 'info',
      title: title,
      text: message,
      background: '#d1ecf1',
      color: '#0c5460',
    });
  }

  // Compact loading toast that can be updated
  public loading(title: string, message?: string): Promise<any> {
    return Swal.fire({
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      width: '320px',
      padding: '12px',
      icon: 'info',
      title: title,
      text: message,
      background: '#e2e3e5',
      color: '#383d41',
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  // Update loading toast and close it
  public closeLoading(success: boolean = true, newTitle?: string, newMessage?: string): void {
    Swal.close();
    
    if (success) {
      this.success(newTitle || 'Complete!', newMessage);
    } else {
      this.error(newTitle || 'Failed!', newMessage);
    }
  }

  // Compact question/confirmation dialog
  public async confirm(title: string, message?: string, confirmText: string = 'Yes'): Promise<boolean> {
    const result = await Swal.fire({
      title: title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      width: '400px',
      padding: '16px'
    });
    
    return result.isConfirmed;
  }
}