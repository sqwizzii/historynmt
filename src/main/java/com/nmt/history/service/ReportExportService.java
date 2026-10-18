package com.nmt.history.service;

import com.nmt.history.dto.QuestionReview;
import com.nmt.history.dto.TestStatsResponse;
import com.nmt.history.exception.BadRequestException;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.Test;
import com.nmt.history.model.TestResult;
import com.nmt.history.model.User;
import com.nmt.history.repository.TestRepository;
import com.nmt.history.repository.TestResultRepository;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportExportService {

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final TestResultRepository testResultRepository;
    private final TestRepository testRepository;
    private final ReviewService reviewService;
    private final AccessPolicy accessPolicy;
    private final TestStatsService statsService;

    @Transactional(readOnly = true)
    public byte[] exportResults(Long testId, Long studentId, String format, String username) {
        User teacher = accessPolicy.requireTeacher(username);
        List<TestResult> results;
        String title;
        if (testId != null) {
            Test test = testRepository.findById(testId)
                    .orElseThrow(() -> new ResourceNotFoundException("Тест не знайдено: " + testId));
            accessPolicy.requireView(test.getOwner() == null ? null : test.getOwner().getId(), teacher);
            results = studentId == null
                    ? testResultRepository.findByTestIdAndStudentTeacherId(testId, teacher.getId())
                    : testResultRepository.findByTestIdAndStudentTeacherIdAndStudentId(testId, teacher.getId(), studentId);
            title = test.getTitle();
        } else {
            results = testResultRepository.findByStudentTeacherIdOrderByCompletedAtDesc(teacher.getId());
            if (studentId != null) {
                results = results.stream().filter(r -> r.getStudent().getId().equals(studentId)).toList();
            }
            title = "Усі тести";
        }
        return switch (normalize(format)) {
            case "csv" -> toCsv(title, results);
            case "xlsx" -> toXlsx(title, results);
            default -> throw new BadRequestException("Підтримуються формати csv та xlsx");
        };
    }

    @Transactional(readOnly = true)
    public byte[] exportTestStats(Long testId, String format, String username) {
        TestStatsResponse stats = statsService.stats(testId, username);
        return switch (normalize(format)) {
            case "csv" -> statsCsv(stats);
            case "xlsx" -> statsXlsx(stats);
            default -> throw new BadRequestException("Підтримуються формати csv та xlsx");
        };
    }

    private byte[] toCsv(String title, List<TestResult> results) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (Writer w = new OutputStreamWriter(out, StandardCharsets.UTF_8)) {
            w.write('\uFEFF');
            w.write("test,student,username,score,nmt_score,grading_status,pending_manual,completed_at,late,leave_count,end_reason,teacher_comment\n");
            for (TestResult r : results) {
                w.write(csv(r.getTest().getTitle()));
                w.write(',');
                w.write(csv(r.getStudent().getFullName()));
                w.write(',');
                w.write(csv(r.getStudent().getUsername()));
                w.write(',');
                w.write(String.valueOf(r.getScore()));
                w.write(',');
                w.write(r.getNmtScore() == null ? "" : String.valueOf(r.getNmtScore()));
                w.write(',');
                w.write(r.getGradingStatus() == null ? "" : r.getGradingStatus().name());
                w.write(',');
                w.write(String.valueOf(r.getPendingManualCount()));
                w.write(',');
                w.write(r.getCompletedAt() == null ? "" : DT.format(r.getCompletedAt()));
                w.write(',');
                w.write(r.isLate() ? "1" : "0");
                w.write(',');
                w.write(String.valueOf(r.getLeaveCount()));
                w.write(',');
                w.write(csv(r.getEndReason()));
                w.write(',');
                w.write(csv(r.getTeacherComment()));
                w.write('\n');
            }
            w.write("# report=");
            w.write(title);
            w.write('\n');
        } catch (IOException e) {
            throw new IllegalStateException("Не вдалося сформувати CSV", e);
        }
        return out.toByteArray();
    }

    private byte[] toXlsx(String title, List<TestResult> results) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Результати");
            Row header = sheet.createRow(0);
            String[] cols = {"Тест", "Учень", "Логін", "Бал", "НМТ", "Статус", "Очікує", "Завершено",
                    "Пізно", "Вихідів", "Причина", "Коментар"};
            for (int i = 0; i < cols.length; i++) {
                header.createCell(i).setCellValue(cols[i]);
            }
            int rowIdx = 1;
            for (TestResult r : results) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(nullToEmpty(r.getTest().getTitle()));
                row.createCell(1).setCellValue(nullToEmpty(r.getStudent().getFullName()));
                row.createCell(2).setCellValue(nullToEmpty(r.getStudent().getUsername()));
                row.createCell(3).setCellValue(r.getScore() == null ? 0 : r.getScore());
                if (r.getNmtScore() != null) {
                    row.createCell(4).setCellValue(r.getNmtScore());
                }
                row.createCell(5).setCellValue(r.getGradingStatus() == null ? "" : r.getGradingStatus().name());
                row.createCell(6).setCellValue(r.getPendingManualCount());
                row.createCell(7).setCellValue(r.getCompletedAt() == null ? "" : DT.format(r.getCompletedAt()));
                row.createCell(8).setCellValue(r.isLate() ? "так" : "ні");
                row.createCell(9).setCellValue(r.getLeaveCount());
                row.createCell(10).setCellValue(nullToEmpty(r.getEndReason()));
                row.createCell(11).setCellValue(nullToEmpty(r.getTeacherComment()));
            }
            Sheet detail = workbook.createSheet("По питаннях");
            Row dHeader = detail.createRow(0);
            String[] dCols = {"Тест", "Учень", "Питання", "Тип", "Набрано", "Макс", "Очікує", "Відповідь", "Правильно", "Коментар"};
            for (int i = 0; i < dCols.length; i++) {
                dHeader.createCell(i).setCellValue(dCols[i]);
            }
            int d = 1;
            for (TestResult r : results) {
                List<QuestionReview> review = reviewService.fromJson(r.getReviewJson());
                if (review == null) {
                    continue;
                }
                for (QuestionReview item : review) {
                    Row row = detail.createRow(d++);
                    row.createCell(0).setCellValue(nullToEmpty(r.getTest().getTitle()));
                    row.createCell(1).setCellValue(nullToEmpty(r.getStudent().getFullName()));
                    row.createCell(2).setCellValue(nullToEmpty(item.questionText()));
                    row.createCell(3).setCellValue(item.questionType() == null ? "" : item.questionType().name());
                    row.createCell(4).setCellValue(item.earned());
                    row.createCell(5).setCellValue(item.max());
                    row.createCell(6).setCellValue(item.pendingManual() ? "так" : "ні");
                    row.createCell(7).setCellValue(join(item.yourAnswer()));
                    row.createCell(8).setCellValue(join(item.correctAnswer()));
                    row.createCell(9).setCellValue(nullToEmpty(item.teacherComment()));
                }
            }
            workbook.createSheet("Мета").createRow(0).createCell(0).setCellValue(title);
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Не вдалося сформувати XLSX", e);
        }
    }

    private byte[] statsCsv(TestStatsResponse stats) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (Writer w = new OutputStreamWriter(out, StandardCharsets.UTF_8)) {
            w.write('\uFEFF');
            w.write("attempts,completed,pending_review,avg_score_percent,avg_correct_percent\n");
            w.write(stats.attempts() + "," + stats.completed() + "," + stats.pendingReview() + ","
                    + stats.averageScorePercent() + "," + stats.averageCorrectPercent() + "\n");
            w.write("question_id,question,type,answered,wrong,pending,correct_percent\n");
            for (var q : stats.questions()) {
                w.write(String.valueOf(q.questionId()));
                w.write(',');
                w.write(csv(q.questionText()));
                w.write(',');
                w.write(csv(q.questionType()));
                w.write(',');
                w.write(q.answered() + "," + q.wrong() + "," + q.pending() + "," + q.correctPercent() + "\n");
            }
        } catch (IOException e) {
            throw new IllegalStateException("Не вдалося сформувати CSV", e);
        }
        return out.toByteArray();
    }

    private byte[] statsXlsx(TestStatsResponse stats) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet summary = workbook.createSheet("Підсумок");
            Row s0 = summary.createRow(0);
            s0.createCell(0).setCellValue("Спроб");
            s0.createCell(1).setCellValue(stats.attempts());
            Row s1 = summary.createRow(1);
            s1.createCell(0).setCellValue("Завершено");
            s1.createCell(1).setCellValue(stats.completed());
            Row s2 = summary.createRow(2);
            s2.createCell(0).setCellValue("Очікує оцінювання");
            s2.createCell(1).setCellValue(stats.pendingReview());
            Row s3 = summary.createRow(3);
            s3.createCell(0).setCellValue("Середній бал, %");
            s3.createCell(1).setCellValue(stats.averageScorePercent());
            Row s4 = summary.createRow(4);
            s4.createCell(0).setCellValue("Правильних, %");
            s4.createCell(1).setCellValue(stats.averageCorrectPercent());

            Sheet sheet = workbook.createSheet("Питання");
            Row header = sheet.createRow(0);
            String[] cols = {"ID", "Питання", "Тип", "Відповідей", "Помилок", "Очікує", "% правильних"};
            for (int i = 0; i < cols.length; i++) {
                header.createCell(i).setCellValue(cols[i]);
            }
            int r = 1;
            for (var q : stats.questions()) {
                Row row = sheet.createRow(r++);
                row.createCell(0).setCellValue(q.questionId());
                row.createCell(1).setCellValue(nullToEmpty(q.questionText()));
                row.createCell(2).setCellValue(nullToEmpty(q.questionType()));
                row.createCell(3).setCellValue(q.answered());
                row.createCell(4).setCellValue(q.wrong());
                row.createCell(5).setCellValue(q.pending());
                row.createCell(6).setCellValue(q.correctPercent());
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Не вдалося сформувати XLSX", e);
        }
    }

    private static String normalize(String format) {
        return format == null ? "csv" : format.trim().toLowerCase();
    }

    private static String csv(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n") || escaped.contains(";")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    private static String join(List<String> values) {
        return values == null || values.isEmpty() ? "" : String.join(" | ", values);
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
