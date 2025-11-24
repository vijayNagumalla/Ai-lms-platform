# Question Types Reference

This document lists all question types supported in the LMS Platform and where they are used.

## Question Types Overview

### From `questions` Table (Question Bank)
Used when creating questions in the Question Bank:
- `multiple_choice` - Multiple choice questions (multiple correct answers)
- `single_choice` - Single choice questions (one correct answer)
- `true_false` - True/False questions
- `short_answer` - Short text answer questions
- `essay` - Long-form essay questions
- `coding` - Coding/programming questions
- `fill_blanks` - Fill in the blanks questions

### From `assessment_questions` Table (Assessments)
Used when adding questions directly to assessments:
- `multiple_choice` - Multiple choice questions
- `true_false` - True/False questions
- `short_answer` - Short text answer questions
- `essay` - Essay questions
- `coding` - Coding questions
- `fill_blanks` - Fill in the blanks questions
- `matching` - Matching questions
- `ordering` - Ordering/sequencing questions
- `hotspot` - Hotspot/image map questions
- `file_upload` - File upload questions

## Complete List for `student_responses` Table

The `student_responses` table should support all question types that can appear in assessments:

1. **multiple_choice** - Multiple correct answers possible
2. **single_choice** - Single correct answer (from Question Bank)
3. **true_false** - True/False questions
4. **short_answer** - Short text responses
5. **essay** - Long-form text responses
6. **coding** - Programming questions with code, language, test results
7. **fill_blanks** - Fill in the blank(s) questions
8. **matching** - Matching pairs questions
9. **ordering** - Order/sequence questions
10. **hotspot** - Image hotspot selection questions
11. **file_upload** - File submission questions

## SQL ENUM Definition

```sql
question_type ENUM(
    'multiple_choice', 
    'single_choice', 
    'true_false', 
    'short_answer', 
    'essay', 
    'coding', 
    'fill_blanks', 
    'matching', 
    'ordering', 
    'hotspot', 
    'file_upload'
) NOT NULL
```

## Notes

- `fill_blanks` (plural) is the standard - the code supports both `fill_blanks` and `fill_blank` for backward compatibility
- `single_choice` is used in Question Bank, while `multiple_choice` can also represent single-choice in assessments
- `coding` questions store their answers as JSON strings containing code, language, test results, etc.
- Questions requiring manual grading (essay, coding, file_upload) have `is_correct` set to NULL initially

