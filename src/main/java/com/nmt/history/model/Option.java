package com.nmt.history.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * Варіант відповіді.
 * <ul>
 *   <li>SINGLE/MULTIPLE_CHOICE: {@code isCorrect} позначає правильні варіанти.</li>
 *   <li>MATCHING: {@code matchKey} зв'язує елемент лівої колонки з відповідником (спільний ключ).</li>
 *   <li>CHRONOLOGY: {@code orderIndex} задає правильну позицію події в хронологічному ряду.</li>
 * </ul>
 */
@Entity
@Table(name = "options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "question")
public class Option {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "option_text", nullable = false, columnDefinition = "TEXT")
    private String optionText;

    @Column(name = "is_correct", nullable = false)
    @Builder.Default
    private Boolean isCorrect = false;

    @Column(name = "match_key", length = 100)
    private String matchKey;

    @Column(name = "order_index")
    private Integer orderIndex;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;
}
