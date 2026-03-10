package com.giovannip.noticeme.service.dto;

import java.io.Serializable;
import java.util.Objects;

/**
 * Lightweight attachment DTO used inside NoteDTO.
 * No binary data here.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class AttachmentSummaryDTO implements Serializable {

    private Long id;
    private String fileName;
    private String dataContentType;
    private Long fileSize;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getDataContentType() {
        return dataContentType;
    }

    public void setDataContentType(String dataContentType) {
        this.dataContentType = dataContentType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AttachmentSummaryDTO)) return false;
        AttachmentSummaryDTO that = (AttachmentSummaryDTO) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    @Override
    public String toString() {
        return (
            "AttachmentSummaryDTO{" +
            "id=" +
            getId() +
            ", fileName='" +
            getFileName() +
            '\'' +
            ", dataContentType='" +
            getDataContentType() +
            '\'' +
            ", fileSize=" +
            getFileSize() +
            '}'
        );
    }
}
