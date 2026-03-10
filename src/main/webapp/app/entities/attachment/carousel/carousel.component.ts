import { Component, computed, input, inject, output, signal, ViewChild, effect } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { NgbCarousel, NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { IAttachment, IAttachmentSummary } from '../attachment.model';
import SharedModule from 'app/shared/shared.module';

@Component({
  selector: 'jhi-carousel-attachment',
  standalone: true,
  imports: [CommonModule, NgbCarouselModule, SharedModule, NgbTooltipModule],
  templateUrl: './carousel.component.html',
})
export class jhiCarouselComponent {
  // signal inputs
  attachments = input.required<(IAttachment | IAttachmentSummary)[]>();
  disableRemove = input(false);
  showNavigationArrows = input<boolean | undefined>(undefined);
  showNavigationIndicators = input<boolean | undefined>(undefined);
  resolveData = input(false);
  // Modern signal outputs
  remove = output<IAttachment | IAttachmentSummary>();
  download = output<IAttachment>();
  // signals
  paused = signal(false);
  pauseOnHover = signal(true);
  pauseOnFocus = signal(true);
  readonly hasMultiple = computed(() => this.attachments().length > 1);
  @ViewChild(NgbCarousel) carousel?: NgbCarousel;
  private sanitizer = inject(DomSanitizer);

  // ---------- UI Logic ----------
  shouldShowIndicators(): boolean {
    return this.showNavigationIndicators() ?? this.hasMultiple();
  }

  shouldShowArrows(): boolean {
    return this.showNavigationArrows() ?? this.hasMultiple();
  }

  // ---------- File Handling ----------
  isImage(file: IAttachment | IAttachmentSummary): boolean {
    if (this.hasData(file)) {
      return file.dataContentType?.startsWith('image/') ?? false;
    }
    const fileName = file.fileName?.toLowerCase() ?? '';
    return /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(fileName);
  }

  isPdf(file: IAttachment | IAttachmentSummary): boolean {
    return this.isFullAttachment(file)
      ? file.dataContentType === 'application/pdf'
      : (file.fileName?.toLowerCase().endsWith('.pdf') ?? false);
  }

  isWord(file: IAttachment | IAttachmentSummary): boolean {
    const fileName = file.fileName?.toLowerCase() ?? '';
    return (
      fileName.endsWith('.doc') ||
      fileName.endsWith('.docx') ||
      (this.isFullAttachment(file) &&
        ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(
          file.dataContentType ?? '',
        ))
    );
  }

  isExcel(file: IAttachment | IAttachmentSummary): boolean {
    if (this.isFullAttachment(file) && file.dataContentType) {
      return ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(
        file.dataContentType,
      );
    }

    const fileName = file.fileName?.toLowerCase() ?? '';
    return fileName.endsWith('.xls') || fileName.endsWith('.xlsx');
  }

  isArchive(file: IAttachment | IAttachmentSummary): boolean {
    const fileName = file.fileName?.toLowerCase() ?? '';
    return fileName.endsWith('.zip') || fileName.endsWith('.rar') || fileName.endsWith('.7z') || fileName.endsWith('.tar');
  }

  fileIcon(file: IAttachment | IAttachmentSummary): string {
    if (this.isImage(file)) return 'image';
    if (this.isPdf(file)) return 'file-pdf';
    if (this.isWord(file)) return 'file-word';
    if (this.isExcel(file)) return 'file-excel';
    if (this.isArchive(file)) return 'file-archive';
    return 'file';
  }

  hasData(file: IAttachment): boolean {
    return this.isFullAttachment(file) && !!file.data;
  }

  fileUrl(file: IAttachment): SafeUrl | null {
    if (!this.hasData(file) || !file.dataContentType) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustUrl(`data:${file.dataContentType};base64,${file.data}`);
  }

  downloadFile(file: IAttachment): void {
    if (!this.hasData(file) || !file.dataContentType) return;
    const link = document.createElement('a');
    link.href = `data:${file.dataContentType};base64,${file.data}`;
    link.download = file.fileName ?? 'attachment';
    link.click();
    this.download.emit(file);
  }

  public removeItem(attachment: IAttachment): void {
    this.remove.emit(attachment);
  }

  private isFullAttachment(item: IAttachment | { id: number }): item is IAttachment {
    return 'data' in item;
  }
}
