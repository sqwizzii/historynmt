package com.nmt.history.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "test_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"student", "test", "reviewJson"})
public class TestResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    /** Сирий (тестовий) бал. */
    @Column(nullable = false)
    private Integer score;

    /** Бал за шкалою НМТ (100-200). */
    @Column(name = "nmt_score")
    private Integer nmtScore;

    /** JSON-розбір відповідей (список QuestionReview). */
    @Column(name = "review_json", columnDefinition = "TEXT")
    private String reviewJson;

    /** Відправлено після завершення часу (з урахуванням допуску). */
    @Column(nullable = false)
    private boolean late;

    /** Скільки разів учень залишав сторінку тесту. */
    @Column(name = "leave_count", nullable = false)
    private int leaveCount;

    /** MANUAL, TIMEOUT або LEFT_PAGE. */
    @Column(name = "end_reason", length = 20)
    private String endReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "grading_status", nullable = false, length = 30)
    @Builder.Default
    private GradingStatus gradingStatus = GradingStatus.COMPLETED;

    @Column(name = "teacher_comment", columnDefinition = "TEXT")
    private String teacherComment;

    @Column(name = "pending_manual_count", nullable = false)
    @Builder.Default
    private int pendingManualCount = 0;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;

    @PrePersist
    void onCreate() {
        if (completedAt == null) {
            completedAt = LocalDateTime.now();
        }
    }
}
