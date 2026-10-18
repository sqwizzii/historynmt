package com.nmt.history.model;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "tests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"questions", "owner", "subject"})
public class Test {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "time_limit_minutes", nullable = false)
    @Builder.Default
    private Integer timeLimitMinutes = 60;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Власник матеріалу: NULL означає загальноплатформний матеріал адміністратора. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column
    private Integer grade;

    @Enumerated(EnumType.STRING)
    @Column(name = "scoring_scale", nullable = false, length = 10)
    @Builder.Default
    private ScoringScale scoringScale = ScoringScale.NMT;

    @Enumerated(EnumType.STRING)
    @Column(name = "answer_visibility_mode", nullable = false, length = 30)
    @Builder.Default
    private AnswerVisibilityMode answerVisibilityMode = AnswerVisibilityMode.AFTER_TEST_COMPLETION;

    @Column(name = "shuffle_questions", nullable = false)
    @Builder.Default
    private boolean shuffleQuestions = false;

    @Column(name = "shuffle_options", nullable = false)
    @Builder.Default
    private boolean shuffleOptions = false;

    /** NULL — необмежена кількість спроб. */
    @Column(name = "max_attempts")
    private Integer maxAttempts;

    @Column(name = "available_from")
    private LocalDateTime availableFrom;

    @Column(name = "available_until")
    private LocalDateTime availableUntil;

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Question> questions = new ArrayList<>();

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public void addQuestion(Question question) {
        questions.add(question);
        question.setTest(this);
    }

    public void removeQuestion(Question question) {
        questions.remove(question);
        question.setTest(null);
    }
}
