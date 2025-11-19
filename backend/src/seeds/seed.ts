import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { Question, QuestionDifficulty } from '../entities/Question';
import { Event, EventStatus } from '../entities/Event';
import { hashPassword } from '../utils/bcrypt';

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const userRepository = AppDataSource.getRepository(User);
    const questionRepository = AppDataSource.getRepository(Question);
    const eventRepository = AppDataSource.getRepository(Event);

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@trivia.com' },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists, skipping user creation');
    } else {
      // Create admin user
      const adminPassword = await hashPassword('admin123');
      const admin = userRepository.create({
        email: 'admin@trivia.com',
        password: adminPassword,
        name: 'Admin User',
        role: UserRole.ADMIN,
      });
      await userRepository.save(admin);
      console.log('✅ Admin user created (admin@trivia.com / admin123)');

      // Create sample regular user
      const userPassword = await hashPassword('user123');
      const user = userRepository.create({
        email: 'user@trivia.com',
        password: userPassword,
        name: 'Test User',
        role: UserRole.USER,
      });
      await userRepository.save(user);
      console.log('✅ Test user created (user@trivia.com / user123)');
    }

    // Check if questions already exist
    const existingQuestions = await questionRepository.count();
    if (existingQuestions > 0) {
      console.log('⚠️  Questions already exist, skipping question creation');
    } else {
      // Create sample questions (general pool - no event)
      const questions = [
        {
          category: 'Geography',
          difficulty: QuestionDifficulty.EASY,
          points: 100,
          question: '¿Cuál es la capital de Francia?',
          options: ['Londres', 'París', 'Berlín', 'Madrid'],
          correctAnswer: 1,
          timeLimit: 30,
        },
        {
          category: 'Science',
          difficulty: QuestionDifficulty.MEDIUM,
          points: 200,
          question: '¿Cuál es el símbolo químico del oro?',
          options: ['Go', 'Au', 'Gd', 'Or'],
          correctAnswer: 1,
          timeLimit: 30,
        },
        {
          category: 'History',
          difficulty: QuestionDifficulty.HARD,
          points: 300,
          question: '¿En qué año comenzó la Segunda Guerra Mundial?',
          options: ['1937', '1938', '1939', '1940'],
          correctAnswer: 2,
          timeLimit: 30,
        },
        {
          category: 'Sports',
          difficulty: QuestionDifficulty.EASY,
          points: 100,
          question: '¿Cuántos jugadores hay en un equipo de fútbol?',
          options: ['9', '10', '11', '12'],
          correctAnswer: 2,
          timeLimit: 20,
        },
        {
          category: 'Entertainment',
          difficulty: QuestionDifficulty.MEDIUM,
          points: 200,
          question: '¿Quién dirigió la película "Inception"?',
          options: ['Steven Spielberg', 'Christopher Nolan', 'James Cameron', 'Quentin Tarantino'],
          correctAnswer: 1,
          timeLimit: 30,
        },
        {
          category: 'Technology',
          difficulty: QuestionDifficulty.EASY,
          points: 100,
          question: '¿Qué significa HTML?',
          options: [
            'HyperText Markup Language',
            'High Tech Modern Language',
            'Home Tool Markup Language',
            'Hyperlinks and Text Markup Language'
          ],
          correctAnswer: 0,
          timeLimit: 30,
        },
        {
          category: 'Geography',
          difficulty: QuestionDifficulty.MEDIUM,
          points: 200,
          question: '¿Cuál es el río más largo del mundo?',
          options: ['Nilo', 'Amazonas', 'Yangtsé', 'Misisipi'],
          correctAnswer: 1,
          timeLimit: 30,
        },
        {
          category: 'Science',
          difficulty: QuestionDifficulty.HARD,
          points: 300,
          question: '¿Cuál es la velocidad de la luz en el vacío?',
          options: ['299,792 km/s', '300,000 km/s', '299,792,458 m/s', '300,000,000 m/s'],
          correctAnswer: 2,
          timeLimit: 40,
        },
        {
          category: 'History',
          difficulty: QuestionDifficulty.EASY,
          points: 100,
          question: '¿Quién fue el primer presidente de Estados Unidos?',
          options: ['Thomas Jefferson', 'George Washington', 'Abraham Lincoln', 'John Adams'],
          correctAnswer: 1,
          timeLimit: 25,
        },
        {
          category: 'Sports',
          difficulty: QuestionDifficulty.MEDIUM,
          points: 200,
          question: '¿En qué país se celebraron los Juegos Olímpicos de 2016?',
          options: ['China', 'Japón', 'Brasil', 'Reino Unido'],
          correctAnswer: 2,
          timeLimit: 30,
        },
        {
          category: 'Entertainment',
          difficulty: QuestionDifficulty.HARD,
          points: 300,
          question: '¿Cuál fue la primera película de Disney de animación tradicional?',
          options: ['Blancanieves', 'Pinocho', 'Fantasía', 'Dumbo'],
          correctAnswer: 0,
          timeLimit: 35,
        },
        {
          category: 'Technology',
          difficulty: QuestionDifficulty.MEDIUM,
          points: 200,
          question: '¿En qué año se fundó Microsoft?',
          options: ['1973', '1975', '1977', '1980'],
          correctAnswer: 1,
          timeLimit: 30,
        },
      ];

      for (const q of questions) {
        const question = questionRepository.create(q);
        await questionRepository.save(question);
      }
      console.log(`✅ Created ${questions.length} sample questions`);
    }

    // Create sample event
    const existingEvents = await eventRepository.count();
    if (existingEvents > 0) {
      console.log('⚠️  Events already exist, skipping event creation');
    } else {
      const event = eventRepository.create({
        name: 'Demo Trivia Event',
        description: 'Un evento de trivia de demostración para probar el sistema',
        status: EventStatus.UPCOMING,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      });
      await eventRepository.save(event);
      console.log('✅ Sample event created');

      // Create event-specific questions
      const eventQuestions = [
        {
          category: 'Geography',
          difficulty: QuestionDifficulty.EASY,
          points: 100,
          question: '¿Cuál es la montaña más alta del mundo?',
          options: ['K2', 'Monte Everest', 'Kilimanjaro', 'Mont Blanc'],
          correctAnswer: 1,
          timeLimit: 30,
          event: event,
        },
        {
          category: 'Science',
          difficulty: QuestionDifficulty.MEDIUM,
          points: 200,
          question: '¿Cuántos planetas hay en el sistema solar?',
          options: ['7', '8', '9', '10'],
          correctAnswer: 1,
          timeLimit: 25,
          event: event,
        },
      ];

      for (const q of eventQuestions) {
        const question = questionRepository.create(q);
        await questionRepository.save(question);
      }
      console.log('✅ Event-specific questions created');
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Admin: admin@trivia.com / admin123');
    console.log('   User:  user@trivia.com / user123');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seed();
