package com.nmt.history.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Позначка, що учень виправив помилку в питанні під час роботи над помилками. */
@Entity
@Table(name = "practice_fixes", uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "question_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PracticeFix {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "fixed_at", nullable = false)
    private LocalDateTime fixedAt;
}
