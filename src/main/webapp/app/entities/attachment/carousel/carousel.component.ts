import { Component, computed, input, inject, output, signal, ViewChild } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { NgbCarousel, NgbCarouselModule} from '@ng-bootstrap/ng-bootstrap';

import { IAttachment } from '../attachment.model';

@Component({
  selector: 'jhi-carousel-attachment',
  standalone: true,
  imports: [CommonModule, NgbCarouselModule],
  templateUrl: './carousel.component.html',
})
export class jhiCarouselComponent {
  // signal inputs
  attachments = input.required<IAttachment[]>();
  disableRemove = input(false);
  showControls = input(true);
  showNavigationArrows = input<boolean | undefined>(undefined);
  showNavigationIndicators = input<boolean | undefined>(undefined);
  // Modern signal outputs
  remove = output<IAttachment>();
  download = output<IAttachment>();
  // signals
  paused = signal(false);
  pauseOnHover = signal(true);
  pauseOnFocus = signal(true);
  readonly hasMultiple = computed(() => this.attachments().length > 1);
  @ViewChild(NgbCarousel) carousel?: NgbCarousel;
  private sanitizer = inject(DomSanitizer)
  // ---------- UI Logic ----------
  shouldShowIndicators(): boolean {
    return this.showNavigationIndicators() ?? this.hasMultiple();
  }

  shouldShowArrows(): boolean {
    return this.showNavigationArrows() ?? this.hasMultiple();
  }

  // ---------- File Handling ----------
  isImage(file: IAttachment): boolean {
     return file.dataContentType?.startsWith('image/') ?? false;
  }

  fileUrl(file: IAttachment): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(
      `data:${file.dataContentType};base64,${file.data}`
    );
  }
  
  downloadFile(file: IAttachment): void {
      const link = document.createElement('a');
      link.href = `data:${file.dataContentType};base64,${file.data}`;
      link.download = file.fileName ?? 'attachment';
      link.click();
      this.download.emit(file);
    }
	
  public removeItem(attachment: IAttachment): void {
    this.remove.emit(attachment);
  }
}
