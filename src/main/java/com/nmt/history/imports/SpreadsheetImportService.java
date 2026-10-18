package com.nmt.history.imports;

import com.nmt.history.dto.CreateQuestionRequest;
import com.nmt.history.dto.OptionRequest;
import com.nmt.history.exception.BadRequestException;
import com.nmt.history.imports.SpreadsheetImportDtos.ImportResult;
import com.nmt.history.imports.SpreadsheetImportDtos.PreviewOption;
import com.nmt.history.imports.SpreadsheetImportDtos.PreviewQuestion;
import com.nmt.history.imports.SpreadsheetImportDtos.PreviewResponse;
import com.nmt.history.imports.SpreadsheetImportDtos.RowError;
import com.nmt.history.model.QuestionType;
import com.nmt.history.model.Test;
import com.nmt.history.repository.TestRepository;
import com.nmt.history.service.AccessPolicy;
import com.nmt.history.service.TestService;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Імпорт запитань із CSV/XLSX у наявний тест.
 * <p>
 * Очікувані колонки: type, question, explanation, topic, max_points,
 * option1..option10, correct (для choice: номери через ;),
 * match1..match10 (для MATCHING), order (для CHRONOLOGY: номери порядку через ;),
 * blanks (для FILL_BLANK: відповіді через |, альтернативи через ;).
 */
@Service
@RequiredArgsConstructor
public class SpreadsheetImportService {

    private static final int MAX_BYTES = 2 * 1024 * 1024;
    private static final int MAX_ROWS = 500;
    private static final Set<String> ALLOWED_EXT = Set.of("csv", "xlsx", "xls");

    private final TestService testService;
    private final TestRepository testRepository;
    private final AccessPolicy accessPolicy;
    private final DataFormatter formatter = new DataFormatter(Locale.ROOT);

    public PreviewResponse preview(Long testId, MultipartFile file, String username) {
        requireEditableTest(testId, username);
        List<Map<String, String>> rows = parseFile(file);
        return buildPreview(rows);
    }

    @Transactional
    public ImportResult importQuestions(Long testId, MultipartFile file, String username) {
        requireEditableTest(testId, username);
        List<Map<String, String>> rows = parseFile(file);
        PreviewResponse preview = buildPreview(rows);
        if (!preview.canImport()) {
            throw new BadRequestException("Імпорт скасовано: виправте помилки у файлі ("
                    + preview.errors().size() + ")");
        }
        int imported = 0;
        for (PreviewQuestion q : preview.questions()) {
            List<OptionRequest> options = q.options().stream()
                    .map(o -> new OptionRequest(o.optionText(), o.isCorrect(), o.matchKey(), o.orderIndex(), null))
                    .toList();
            testService.createQuestion(new CreateQuestionRequest(
                    testId, q.questionText(), null, q.questionType(), q.explanation(), q.topic(),
                    options, null, null, q.maxPoints(), null), username);
            imported++;
        }
        return new ImportResult(imported, testId);
    }

    public byte[] templateCsv() {
        String content = """
                type,question,explanation,topic,max_points,option1,option2,option3,option4,correct,match1,match2,order,blanks
                SINGLE_CHOICE,Столиця України?,Київ — столиця,Географія,,Київ,Львів,Одеса,Харків,1,,,
                MULTIPLE_CHOICE,Які міста в Україні?,Оберіть усі,Географія,,Київ,Варшава,Львів,Берлін,1;3,,,
                MATCHING,Зіставте подію з роком,,,,"Хмельниччина","Люблінська унія",,,,1648,1569,,
                CHRONOLOGY,Розташуйте події,,,,"Подія А","Подія Б","Подія В",,,,,"1;2;3",
                FILL_BLANK,Київ заснували у ___ році.,,,,,"",,,,,,"882"
                OPEN,Поясніть значення Конституції Пилипа Орлика.,,Право,3,,,,,,,,,
                """;
        return content.getBytes(StandardCharsets.UTF_8);
    }

    private void requireEditableTest(Long testId, String username) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new BadRequestException("Тест не знайдено: " + testId));
        accessPolicy.requireEdit(test.getOwner() == null ? null : test.getOwner().getId(),
                accessPolicy.actor(username));
    }

    private PreviewResponse buildPreview(List<Map<String, String>> rows) {
        List<PreviewQuestion> questions = new ArrayList<>();
        List<RowError> errors = new ArrayList<>();
        int rowNum = 1;
        for (Map<String, String> row : rows) {
            rowNum++;
            try {
                PreviewQuestion q = parseRow(rowNum, row);
                if (q != null) {
                    questions.add(q);
                }
            } catch (BadRequestException e) {
                errors.add(new RowError(rowNum, e.getMessage()));
            }
        }
        return new PreviewResponse(questions, errors, rows.size(), errors.isEmpty() && !questions.isEmpty());
    }

    private PreviewQuestion parseRow(int rowNum, Map<String, String> row) {
        String typeRaw = cell(row, "type");
        if (typeRaw.isBlank() && cell(row, "question").isBlank()) {
            return null;
        }
        QuestionType type;
        try {
            type = QuestionType.valueOf(typeRaw.trim().toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            throw new BadRequestException("Невідомий тип: " + typeRaw);
        }
        String question = cell(row, "question");
        if (question.isBlank()) {
            throw new BadRequestException("Порожній текст питання");
        }
        String explanation = blankToNull(cell(row, "explanation"));
        String topic = blankToNull(cell(row, "topic"));
        Integer maxPoints = parseInt(cell(row, "max_points"));
        List<String> optionTexts = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            String v = cell(row, "option" + i);
            if (!v.isBlank()) {
                optionTexts.add(v);
            }
        }
        return switch (type) {
            case SINGLE_CHOICE, MULTIPLE_CHOICE -> choice(rowNum, type, question, explanation, topic, optionTexts, row);
            case MATCHING -> matching(rowNum, question, explanation, topic, optionTexts, row);
            case CHRONOLOGY -> chronology(rowNum, question, explanation, topic, optionTexts, row);
            case FILL_BLANK -> fillBlank(rowNum, question, explanation, topic, row);
            case OPEN -> open(rowNum, question, explanation, topic, maxPoints);
        };
    }

    private PreviewQuestion choice(int rowNum, QuestionType type, String question, String explanation,
                                   String topic, List<String> optionTexts, Map<String, String> row) {
        if (optionTexts.size() < 2) {
            throw new BadRequestException("Потрібно щонайменше 2 варіанти (option1, option2, …)");
        }
        Set<Integer> correct = parseIndexes(cell(row, "correct"), optionTexts.size());
        if (type == QuestionType.SINGLE_CHOICE && correct.size() != 1) {
            throw new BadRequestException("SINGLE_CHOICE: у колонці correct має бути рівно один номер");
        }
        if (type == QuestionType.MULTIPLE_CHOICE && correct.isEmpty()) {
            throw new BadRequestException("MULTIPLE_CHOICE: вкажіть правильні номери у correct");
        }
        List<PreviewOption> options = new ArrayList<>();
        for (int i = 0; i < optionTexts.size(); i++) {
            options.add(new PreviewOption(optionTexts.get(i), correct.contains(i + 1), null, null));
        }
        return new PreviewQuestion(rowNum, type, question, explanation, topic, null, options);
    }

    private PreviewQuestion matching(int rowNum, String question, String explanation, String topic,
                                     List<String> optionTexts, Map<String, String> row) {
        if (optionTexts.size() < 2) {
            throw new BadRequestException("MATCHING: потрібно щонайменше 2 елементи зліва");
        }
        List<PreviewOption> options = new ArrayList<>();
        for (int i = 0; i < optionTexts.size(); i++) {
            String match = cell(row, "match" + (i + 1));
            if (match.isBlank()) {
                throw new BadRequestException("MATCHING: відсутній match" + (i + 1));
            }
            options.add(new PreviewOption(optionTexts.get(i), null, match, null));
        }
        return new PreviewQuestion(rowNum, QuestionType.MATCHING, question, explanation, topic, null, options);
    }

    private PreviewQuestion chronology(int rowNum, String question, String explanation, String topic,
                                       List<String> optionTexts, Map<String, String> row) {
        if (optionTexts.size() < 2) {
            throw new BadRequestException("CHRONOLOGY: потрібно щонайменше 2 події");
        }
        List<Integer> order = parseIndexList(cell(row, "order"), optionTexts.size());
        if (order.size() != optionTexts.size()) {
            throw new BadRequestException("CHRONOLOGY: колонка order має містити унікальні номери 1.." + optionTexts.size());
        }
        List<PreviewOption> options = new ArrayList<>();
        for (int i = 0; i < optionTexts.size(); i++) {
            options.add(new PreviewOption(optionTexts.get(i), null, null, order.get(i)));
        }
        return new PreviewQuestion(rowNum, QuestionType.CHRONOLOGY, question, explanation, topic, null, options);
    }

    private PreviewQuestion fillBlank(int rowNum, String question, String explanation, String topic,
                                      Map<String, String> row) {
        String blanks = cell(row, "blanks");
        if (blanks.isBlank()) {
            throw new BadRequestException("FILL_BLANK: вкажіть еталони у колонці blanks (через | між пропусками)");
        }
        String[] parts = blanks.split("\\|");
        List<PreviewOption> options = new ArrayList<>();
        for (int i = 0; i < parts.length; i++) {
            String[] alts = parts[i].split(";");
            for (String alt : alts) {
                if (alt != null && !alt.isBlank()) {
                    options.add(new PreviewOption(alt.trim(), true, null, i));
                }
            }
        }
        if (options.isEmpty()) {
            throw new BadRequestException("FILL_BLANK: немає жодної еталонної відповіді");
        }
        return new PreviewQuestion(rowNum, QuestionType.FILL_BLANK, question, explanation, topic, null, options);
    }

    private PreviewQuestion open(int rowNum, String question, String explanation, String topic, Integer maxPoints) {
        int points = maxPoints == null ? 1 : maxPoints;
        if (points < 1 || points > 100) {
            throw new BadRequestException("OPEN: max_points має бути від 1 до 100");
        }
        return new PreviewQuestion(rowNum, QuestionType.OPEN, question, explanation, topic, points, List.of());
    }

    private Set<Integer> parseIndexes(String raw, int max) {
        return new java.util.LinkedHashSet<>(parseIndexList(raw, max));
    }

    private List<Integer> parseIndexList(String raw, int max) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        List<Integer> out = new ArrayList<>();
        for (String part : raw.split("[;,]")) {
            String p = part.trim();
            if (p.isEmpty()) {
                continue;
            }
            int n;
            try {
                n = Integer.parseInt(p);
            } catch (NumberFormatException e) {
                throw new BadRequestException("Некоректний номер варіанта: " + p);
            }
            if (n < 1 || n > max) {
                throw new BadRequestException("Номер варіанта поза діапазоном 1.." + max + ": " + n);
            }
            if (out.contains(n)) {
                throw new BadRequestException("Повторюваний номер варіанта: " + n);
            }
            out.add(n);
        }
        return out;
    }

    private Integer parseInt(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            throw new BadRequestException("Некоректне число: " + raw);
        }
    }

    private List<Map<String, String>> parseFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Файл не завантажено");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException("Файл завеликий (максимум 2 МБ)");
        }
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        String ext = name.contains(".") ? name.substring(name.lastIndexOf('.') + 1) : "";
        if (!ALLOWED_EXT.contains(ext)) {
            throw new BadRequestException("Підтримуються лише CSV та XLSX");
        }
        try {
            byte[] bytes = file.getBytes();
            if ("csv".equals(ext)) {
                return parseCsv(bytes);
            }
            return parseExcel(bytes);
        } catch (IOException e) {
            throw new BadRequestException("Не вдалося прочитати файл");
        }
    }

    private List<Map<String, String>> parseCsv(byte[] bytes) throws IOException {
        List<Map<String, String>> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(bytes), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                throw new BadRequestException("Порожній CSV");
            }
            if (headerLine.startsWith("\uFEFF")) {
                headerLine = headerLine.substring(1);
            }
            List<String> headers = splitCsvLine(headerLine).stream()
                    .map(h -> h.trim().toLowerCase(Locale.ROOT))
                    .toList();
            String line;
            int count = 0;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                if (++count > MAX_ROWS) {
                    throw new BadRequestException("Забагато рядків (максимум " + MAX_ROWS + ")");
                }
                List<String> values = splitCsvLine(line);
                Map<String, String> row = new HashMap<>();
                for (int i = 0; i < headers.size(); i++) {
                    row.put(headers.get(i), i < values.size() ? values.get(i).trim() : "");
                }
                rows.add(row);
            }
        }
        return rows;
    }

    private List<Map<String, String>> parseExcel(byte[] bytes) throws IOException {
        List<Map<String, String>> rows = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                throw new BadRequestException("Порожній аркуш Excel");
            }
            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            if (headerRow == null) {
                throw new BadRequestException("Немає заголовків у файлі");
            }
            List<String> headers = new ArrayList<>();
            for (int c = 0; c < headerRow.getLastCellNum(); c++) {
                headers.add(formatter.formatCellValue(headerRow.getCell(c)).trim().toLowerCase(Locale.ROOT));
            }
            int count = 0;
            for (int r = sheet.getFirstRowNum() + 1; r <= sheet.getLastRowNum(); r++) {
                Row excelRow = sheet.getRow(r);
                if (excelRow == null) {
                    continue;
                }
                Map<String, String> row = new HashMap<>();
                boolean empty = true;
                for (int c = 0; c < headers.size(); c++) {
                    Cell cell = excelRow.getCell(c);
                    String value = formatter.formatCellValue(cell).trim();
                    if (!value.isEmpty()) {
                        empty = false;
                    }
                    row.put(headers.get(c), value);
                }
                if (empty) {
                    continue;
                }
                if (++count > MAX_ROWS) {
                    throw new BadRequestException("Забагато рядків (максимум " + MAX_ROWS + ")");
                }
                rows.add(row);
            }
        }
        return rows;
    }

    /** Простий CSV-парсер із підтримкою лапок. */
    static List<String> splitCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (inQuotes) {
                if (ch == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
                        current.append('"');
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current.append(ch);
                }
            } else if (ch == '"') {
                inQuotes = true;
            } else if (ch == ',' || ch == ';') {
                // підтримка ; як роздільника (українські Excel)
                if (ch == ';' && line.indexOf(',') >= 0) {
                    current.append(ch);
                } else {
                    result.add(current.toString());
                    current.setLength(0);
                }
            } else {
                current.append(ch);
            }
        }
        result.add(current.toString());
        return result;
    }

    private static String cell(Map<String, String> row, String key) {
        String v = row.get(key);
        return v == null ? "" : v.trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
