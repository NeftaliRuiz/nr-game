import { Router } from 'express';
import {
  previewQuestionsUpload,
  saveQuestionsFromUpload,
  getQuestions,
  deleteQuestion,
  deleteQuestionsByEvent,
  downloadTemplate,
  upload
} from '../controllers/questions-upload.controller';

const router = Router();

/**
 * @route   GET /api/questions/template
 * @desc    Download Excel template for questions
 * @access  Public
 */
router.get('/template', downloadTemplate);

/**
 * @route   POST /api/questions/upload/preview
 * @desc    Preview questions from Excel file without saving
 * @access  Public (can add auth later)
 */
router.post('/upload/preview', upload.single('file'), previewQuestionsUpload);

/**
 * @route   POST /api/questions/upload/save
 * @desc    Upload and save questions to database
 * @access  Public (can add auth later)
 * @body    eventId (optional), gameMode (optional)
 */
router.post('/upload/save', upload.single('file'), saveQuestionsFromUpload);

/**
 * @route   GET /api/questions
 * @desc    Get list of questions
 * @query   eventId, gameMode, category, limit, offset
 * @access  Public
 */
router.get('/', getQuestions);

/**
 * @route   DELETE /api/questions/:id
 * @desc    Delete a single question
 * @access  Public (can add auth later)
 */
router.delete('/:id', deleteQuestion);

/**
 * @route   DELETE /api/questions/event/:eventId
 * @desc    Delete all questions for an event
 * @access  Public (can add auth later)
 */
router.delete('/event/:eventId', deleteQuestionsByEvent);

export default router;
