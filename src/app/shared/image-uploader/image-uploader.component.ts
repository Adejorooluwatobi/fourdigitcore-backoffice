import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MediaService } from '../../services/media.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-uploader.component.html',
  styleUrl: './image-uploader.component.scss'
})
export class ImageUploaderComponent {
  public mediaService = inject(MediaService);
  private toast = inject(ToastService);

  @Input() imageUrl: string = '';
  @Input() label: string = 'Asset Image';
  @Input() helpText: string = 'Upload PNG, JPG, WEBP or SVG from your computer to Cloudinary CDN.';
  @Input() folder: string = 'fourdigitcore';
  @Input() previewShape: 'rounded' | 'circle' | 'banner' = 'rounded';
  @Input() required: boolean = false;

  @Output() imageUrlChange = new EventEmitter<string>();

  public isUploading = signal(false);
  public isDragging = signal(false);
  public showManualInput = signal(false);
  public imageError = signal(false);

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile(input.files[0]);
    }
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  public onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.uploadFile(event.dataTransfer.files[0]);
    }
  }

  private uploadFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.toast.error('Invalid format', 'Please upload a valid image file (PNG, JPG, SVG, WEBP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      this.toast.error('File too large', 'Image size must be under 20 MB.');
      return;
    }

    this.isUploading.set(true);
    this.imageError.set(false);

    this.mediaService.upload(file, this.folder).subscribe({
      next: (res) => {
        this.isUploading.set(false);
        if (res.success && res.url) {
          this.imageUrl = res.url;
          this.imageUrlChange.emit(this.imageUrl);
          this.toast.success('Image Uploaded', 'Asset uploaded successfully to Cloudinary CDN.');
        } else {
          this.toast.error('Upload Error', res.message || 'Failed to process image upload.');
        }
      },
      error: (err) => {
        this.isUploading.set(false);
        const msg = err.error?.message || 'Server error occurred during image upload.';
        this.toast.error('Upload Failed', msg);
      }
    });
  }

  public removeImage(): void {
    this.imageUrl = '';
    this.imageUrlChange.emit('');
    this.imageError.set(false);
  }

  public onManualUrlChange(newUrl: string): void {
    this.imageUrl = newUrl;
    this.imageUrlChange.emit(newUrl);
    this.imageError.set(false);
  }

  public isCloudinary(): boolean {
    return !!this.imageUrl && this.imageUrl.includes('cloudinary.com');
  }

  public getResolvedUrl(): string {
    return this.mediaService.resolveUrl(this.imageUrl);
  }

  public onImageError(): void {
    this.imageError.set(true);
  }

  public onImageLoad(): void {
    this.imageError.set(false);
  }
}
