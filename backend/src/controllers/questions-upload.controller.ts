import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Question, QuestionDifficulty } from '../entities/Question';
import { Event, EventStatus } from '../entities/Event';
import { Answer } from '../entities/Answer';
import { GameMode } from '../entities/Game';
import * as os from 'os';
// Use require for xlsx to avoid ESM/CJS compatibility issues
const XLSX = require('xlsx');
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

const uploadsDir = process.env.UPLOADS_DIR
  ? process.env.UPLOADS_DIR
  : path.join(os.tmpdir(), 'trivia-uploads');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const normalizedDir = uploadsDir;
    if (!fs.existsSync(normalizedDir)) {
      fs.mkdirSync(normalizedDir, { recursive: true });
    }
    cb(null, normalizedDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'questions-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ];
  
  if (allowedTypes.includes(file.mimetype) || 
      file.originalname.endsWith('.xlsx') || 
      file.originalname.endsWith('.xls') ||
      file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls) o CSV'));
  }
};

export const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

interface ParsedQuestion {
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: number;
  category: string;
  difficulty: string;
  points: number;
  timeLimit: number;
  rowNumber: number;
  isValid: boolean;
  errors: string[];
}

/**
 * Parse Excel file and return preview of questions
 * POST /api/questions/upload/preview
 */
export async function previewQuestionsUpload(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
      return;
    }

    const filePath = req.file.path;
    console.log(`📁 Processing file: ${filePath}`);

    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (rawData.length < 2) {
      res.status(400).json({
        success: false,
        message: 'El archivo está vacío o solo tiene encabezados'
      });
      // Clean up file
      fs.unlinkSync(filePath);
      return;
    }

    // Parse questions (skip header row)
    const parsedQuestions: ParsedQuestion[] = [];
    const headers = rawData[0].map((h: string) => h?.toString().toLowerCase().trim());
    
    console.log('Headers found:', headers);

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0 || !row[0]) continue; // Skip empty rows

      const question = parseRow(row, headers, i + 1);
      parsedQuestions.push(question);
    }

    // Calculate stats
    const validCount = parsedQuestions.filter(q => q.isValid).length;
    const invalidCount = parsedQuestions.filter(q => !q.isValid).length;

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      data: {
        totalRows: parsedQuestions.length,
        validQuestions: validCount,
        invalidQuestions: invalidCount,
        questions: parsedQuestions,
        expectedFormat: getExpectedFormat()
      },
      message: `Se encontraron ${validCount} preguntas válidas de ${parsedQuestions.length} filas`
    });

  } catch (error) {
    console.error('Preview upload error:', error);
    
    // Clean up file if exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al procesar el archivo',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Upload and save questions to database
 * POST /api/questions/upload/save
 */
export async function saveQuestionsFromUpload(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
      return;
    }

    const { eventId, gameMode } = req.body;
    const filePath = req.file.path;
    
    console.log(`📤 Uploading questions:`)
    console.log(`   eventId: ${eventId}`)
    console.log(`   gameMode: ${gameMode}`)
    console.log(`   file: ${req.file.originalname}`);
    
    const eventRepository = AppDataSource.getRepository(Event);
    let effectiveEventId = eventId && eventId.trim().length > 0 ? eventId.trim() : null;
    let event = null;
    let eventAutoCreated = false;

    if (effectiveEventId) {
      event = await eventRepository.findOne({ where: { id: effectiveEventId } });
      if (!event) {
        fs.unlinkSync(filePath);
        res.status(404).json({
          success: false,
          message: 'Evento no encontrado'
        });
        return;
      }
    } else {
      event = eventRepository.create({
        name: `Evento Kahoot ${new Date().toLocaleString()}`,
        description: `Evento autogenerado para ${req.file.originalname}`,
        startDate: new Date(),
        status: EventStatus.ACTIVE,
        isActive: true,
      });

      event = await eventRepository.save(event);
      effectiveEventId = event.id;
      eventAutoCreated = true;
      console.log(`   🆕 Evento autogenerado: ${event.name} (${event.id})`);
    }

    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`   Sheet name: ${sheetName}`);
    console.log(`   Total rows: ${rawData.length}`);

    if (rawData.length < 2) {
      fs.unlinkSync(filePath);
      res.status(400).json({
        success: false,
        message: 'El archivo está vacío o solo tiene encabezados'
      });
      return;
    }

    const headers = rawData[0].map((h: string) => h?.toString().toLowerCase().trim());
    console.log(`   Headers found: ${JSON.stringify(headers)}`);
    
    const questionRepository = AppDataSource.getRepository(Question);
    const answerRepository = AppDataSource.getRepository(Answer);

    // Clean up previous questions linked to this event to avoid mixing data between uploads
    if (effectiveEventId) {
      const questionIdsQuery = questionRepository
        .createQueryBuilder('question')
        .select('question.id', 'id')
        .where('question.eventId = :eventId', { eventId: effectiveEventId });

      if (gameMode) {
        questionIdsQuery.andWhere('(question.gameMode = :gameMode OR question.gameMode IS NULL)', { gameMode });
      }

      const questionIdRows = await questionIdsQuery.getRawMany();
      const questionIds = questionIdRows.map((row) => row.id);

      if (questionIds.length > 0) {
        const deletedAnswers = await answerRepository
          .createQueryBuilder()
          .delete()
          .from(Answer)
          .where('questionId IN (:...ids)', { ids: questionIds })
          .execute();
        console.log(`   🧽 Removed ${deletedAnswers.affected || 0} answers linked to event ${effectiveEventId}`);

        const deleteQuery = questionRepository
          .createQueryBuilder()
          .delete()
          .from(Question)
          .where('eventId = :eventId', { eventId: effectiveEventId });

        if (gameMode) {
          deleteQuery.andWhere('(gameMode = :gameMode OR gameMode IS NULL)', { gameMode });
        }

        const deleteResult = await deleteQuery.execute();
        console.log(`   🧹 Removed ${deleteResult.affected || 0} existing questions for event ${effectiveEventId} (${gameMode || 'any mode'})`);
      }
    }
    
    const savedQuestions: Question[] = [];
    let importOrder = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0 || !row[0]) continue;

      const parsed = parseRow(row, headers, i + 1);
      
      if (!parsed.isValid) {
        console.log(`   ❌ Row ${i + 1} invalid: ${parsed.errors.join(', ')}`);
        errors.push({ row: i + 1, error: parsed.errors.join(', ') });
        continue;
      }

      try {
        // Map difficulty string to enum
        let difficulty = QuestionDifficulty.MEDIUM;
        const diffLower = parsed.difficulty.toLowerCase();
        if (diffLower === 'facil' || diffLower === 'fácil' || diffLower === 'easy') {
          difficulty = QuestionDifficulty.EASY;
        } else if (diffLower === 'dificil' || diffLower === 'difícil' || diffLower === 'hard') {
          difficulty = QuestionDifficulty.HARD;
        }

        importOrder += 1;

        const question = questionRepository.create({
          question: parsed.question,
          options: [parsed.option1, parsed.option2, parsed.option3, parsed.option4],
          correctAnswer: parsed.correctAnswer - 1, // Convert to 0-indexed
          category: parsed.category || 'General',
          difficulty,
          points: parsed.points || getDifficultyPoints(difficulty),
          timeLimit: parsed.timeLimit || 20,
          eventId: effectiveEventId,
          gameMode: gameMode || null,
          round: importOrder,
        });

        console.log(`   💾 Saving question: "${parsed.question.substring(0, 40)}..." | eventId: ${effectiveEventId} | gameMode: ${gameMode}`);
        
        const saved = await questionRepository.save(question);
        savedQuestions.push(saved);
      } catch (saveError) {
        errors.push({ 
          row: i + 1, 
          error: saveError instanceof Error ? saveError.message : 'Error al guardar' 
        });
      }
    }

    // Clean up file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      data: {
        savedCount: savedQuestions.length,
        errorCount: errors.length,
        errors: errors.slice(0, 10), // Only return first 10 errors
        savedQuestions: savedQuestions.map(q => ({
          id: q.id,
          question: q.question,
          category: q.category,
          difficulty: q.difficulty
        })),
        event: event ? {
          id: event.id,
          name: event.name,
          status: event.status,
        } : null,
        eventAutoCreated
      },
      message: eventAutoCreated
        ? `Se guardaron ${savedQuestions.length} preguntas y se creó el evento "${event?.name}" automáticamente`
        : `Se guardaron ${savedQuestions.length} preguntas exitosamente`
    });

  } catch (error) {
    console.error('Save questions error:', error);
    
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al guardar las preguntas',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get list of questions by event or all
 * GET /api/questions
 */
export async function getQuestions(req: Request, res: Response): Promise<void> {
  try {
    const { eventId, gameMode, category, limit = 100, offset = 0 } = req.query;
    const questionRepository = AppDataSource.getRepository(Question);

    const queryBuilder = questionRepository.createQueryBuilder('question')
      .orderBy('question.createdAt', 'DESC')
      .skip(Number(offset))
      .take(Number(limit));

    if (eventId) {
      queryBuilder.andWhere('question.eventId = :eventId', { eventId });
    }

    if (gameMode) {
      queryBuilder.andWhere('(question.gameMode = :gameMode OR question.gameMode IS NULL)', { gameMode });
    }

    if (category) {
      queryBuilder.andWhere('question.category = :category', { category });
    }

    const [questions, total] = await queryBuilder.getManyAndCount();

    res.json({
      success: true,
      data: {
        questions,
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });

  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener preguntas'
    });
  }
}

/**
 * Delete a question
 * DELETE /api/questions/:id
 */
export async function deleteQuestion(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const questionRepository = AppDataSource.getRepository(Question);

    const question = await questionRepository.findOne({ where: { id } });
    if (!question) {
      res.status(404).json({
        success: false,
        message: 'Pregunta no encontrada'
      });
      return;
    }

    await questionRepository.remove(question);

    res.json({
      success: true,
      message: 'Pregunta eliminada exitosamente'
    });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la pregunta'
    });
  }
}

/**
 * Delete all questions for an event
 * DELETE /api/questions/event/:eventId
 */
export async function deleteQuestionsByEvent(req: Request, res: Response): Promise<void> {
  try {
    const { eventId } = req.params;
    const questionRepository = AppDataSource.getRepository(Question);

    const result = await questionRepository.delete({ eventId });

    res.json({
      success: true,
      data: {
        deletedCount: result.affected || 0
      },
      message: `Se eliminaron ${result.affected || 0} preguntas`
    });

  } catch (error) {
    console.error('Delete questions by event error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar las preguntas'
    });
  }
}

/**
 * Download template Excel file
 * GET /api/questions/template
 */
export async function downloadTemplate(req: Request, res: Response): Promise<void> {
  try {
    const templateData = [
      ['pregunta', 'opcion1', 'opcion2', 'opcion3', 'opcion4', 'respuesta_correcta', 'categoria', 'dificultad', 'puntos', 'tiempo'],
      ['¿Cuál es la capital de Francia?', 'Londres', 'París', 'Berlín', 'Madrid', 2, 'Geografía', 'facil', 100, 20],
      ['¿Cuántos planetas hay en el sistema solar?', '7', '8', '9', '10', 2, 'Ciencia', 'facil', 100, 20],
      ['¿Quién pintó la Mona Lisa?', 'Van Gogh', 'Picasso', 'Da Vinci', 'Miguel Ángel', 3, 'Arte', 'medio', 150, 25],
      ['¿En qué año comenzó la Segunda Guerra Mundial?', '1937', '1938', '1939', '1940', 3, 'Historia', 'medio', 150, 25],
      ['¿Cuál es el elemento químico más abundante en el universo?', 'Oxígeno', 'Hidrógeno', 'Carbono', 'Helio', 2, 'Ciencia', 'dificil', 200, 30],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Preguntas');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 50 }, // pregunta
      { wch: 20 }, // opcion1
      { wch: 20 }, // opcion2
      { wch: 20 }, // opcion3
      { wch: 20 }, // opcion4
      { wch: 18 }, // respuesta_correcta
      { wch: 15 }, // categoria
      { wch: 12 }, // dificultad
      { wch: 8 },  // puntos
      { wch: 8 },  // tiempo
    ];

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_preguntas.xlsx');
    res.send(buffer);

  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar la plantilla'
    });
  }
}

// ==================== HELPER FUNCTIONS ====================

function parseRow(row: any[], headers: string[], rowNumber: number): ParsedQuestion {
  const errors: string[] = [];
  
  // Find column indices based on headers
  const questionIdx = findColumnIndex(headers, ['pregunta', 'question', 'texto']);
  const opt1Idx = findColumnIndex(headers, ['opcion1', 'opcion 1', 'option1', 'respuesta1', 'a']);
  const opt2Idx = findColumnIndex(headers, ['opcion2', 'opcion 2', 'option2', 'respuesta2', 'b']);
  const opt3Idx = findColumnIndex(headers, ['opcion3', 'opcion 3', 'option3', 'respuesta3', 'c']);
  const opt4Idx = findColumnIndex(headers, ['opcion4', 'opcion 4', 'option4', 'respuesta4', 'd']);
  const correctIdx = findColumnIndex(headers, ['respuesta_correcta', 'correcta', 'correct', 'respuesta', 'answer']);
  const categoryIdx = findColumnIndex(headers, ['categoria', 'category', 'tema']);
  const difficultyIdx = findColumnIndex(headers, ['dificultad', 'difficulty', 'nivel']);
  const pointsIdx = findColumnIndex(headers, ['puntos', 'points', 'puntaje']);
  const timeIdx = findColumnIndex(headers, ['tiempo', 'time', 'timelimit', 'segundos']);

  // Extract values
  const question = row[questionIdx]?.toString().trim() || '';
  const option1 = row[opt1Idx]?.toString().trim() || '';
  const option2 = row[opt2Idx]?.toString().trim() || '';
  const option3 = row[opt3Idx]?.toString().trim() || '';
  const option4 = row[opt4Idx]?.toString().trim() || '';
  
  // Parse correct answer - support multiple formats
  const correctRaw = row[correctIdx]?.toString().trim() || '';
  let correctAnswer = parseCorrectAnswer(correctRaw, [option1, option2, option3, option4]);
  
  const category = row[categoryIdx]?.toString().trim() || 'General';
  const difficulty = row[difficultyIdx]?.toString().trim() || 'medio';
  const points = parseInt(row[pointsIdx]) || 0;
  const timeLimit = parseInt(row[timeIdx]) || 20;

  // Validations
  if (!question) errors.push('Falta la pregunta');
  if (!option1) errors.push('Falta opción 1');
  if (!option2) errors.push('Falta opción 2');
  if (!option3) errors.push('Falta opción 3');
  if (!option4) errors.push('Falta opción 4');
  if (correctAnswer < 1 || correctAnswer > 4) {
    errors.push(`La respuesta correcta "${correctRaw}" no es válida. Use 1, 2, 3, 4 o A, B, C, D o el texto exacto de la opción correcta`);
  }

  return {
    question,
    option1,
    option2,
    option3,
    option4,
    correctAnswer,
    category,
    difficulty,
    points,
    timeLimit,
    rowNumber,
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Parse correct answer from various formats
 * Supports: 1,2,3,4 | A,B,C,D | exact option text
 */
function parseCorrectAnswer(value: string, options: string[]): number {
  if (!value) return 0;
  
  const normalized = value.toLowerCase().trim();
  
  // Try as number (1, 2, 3, 4)
  const num = parseInt(value);
  if (!isNaN(num) && num >= 1 && num <= 4) {
    return num;
  }
  
  // Try as letter (A, B, C, D)
  const letterMap: { [key: string]: number } = { 'a': 1, 'b': 2, 'c': 3, 'd': 4 };
  if (letterMap[normalized]) {
    return letterMap[normalized];
  }
  
  // Try matching exact option text
  for (let i = 0; i < options.length; i++) {
    if (options[i].toLowerCase().trim() === normalized) {
      return i + 1;
    }
  }
  
  // Try matching partial option text (contains)
  for (let i = 0; i < options.length; i++) {
    if (options[i].toLowerCase().includes(normalized) || normalized.includes(options[i].toLowerCase())) {
      return i + 1;
    }
  }
  
  return 0; // Invalid
}

function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const idx = headers.indexOf(name.toLowerCase());
    if (idx !== -1) return idx;
  }
  // Default to sequential columns if headers don't match
  return possibleNames.indexOf(possibleNames[0]);
}

function getDifficultyPoints(difficulty: QuestionDifficulty): number {
  switch (difficulty) {
    case QuestionDifficulty.EASY: return 100;
    case QuestionDifficulty.MEDIUM: return 150;
    case QuestionDifficulty.HARD: return 200;
    default: return 100;
  }
}

function getExpectedFormat() {
  return {
    columns: [
      { name: 'pregunta', description: 'El texto de la pregunta', required: true },
      { name: 'opcion1', description: 'Primera opción de respuesta', required: true },
      { name: 'opcion2', description: 'Segunda opción de respuesta', required: true },
      { name: 'opcion3', description: 'Tercera opción de respuesta', required: true },
      { name: 'opcion4', description: 'Cuarta opción de respuesta', required: true },
      { name: 'respuesta_correcta', description: 'Número de la respuesta correcta (1-4)', required: true },
      { name: 'categoria', description: 'Categoría de la pregunta', required: false, default: 'General' },
      { name: 'dificultad', description: 'Dificultad: facil, medio, dificil', required: false, default: 'medio' },
      { name: 'puntos', description: 'Puntos por respuesta correcta', required: false, default: 'Auto según dificultad' },
      { name: 'tiempo', description: 'Segundos para responder', required: false, default: '20' }
    ],
    example: {
      pregunta: '¿Cuál es la capital de Francia?',
      opcion1: 'Londres',
      opcion2: 'París',
      opcion3: 'Berlín',
      opcion4: 'Madrid',
      respuesta_correcta: 2,
      categoria: 'Geografía',
      dificultad: 'facil',
      puntos: 100,
      tiempo: 20
    }
  };
}
