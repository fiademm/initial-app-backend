const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 5000;

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'initial_app_database',
  password: 'postgres',
  port: 5432,
});

// Middleware
app.use(cors());
app.use(express.json());

// JWT secret key (change it to your own secret)
const jwtSecret = 'C0BAF97A89FB5FB68AAAA57FAFEAA95FAF9E8A4F8135BC6F38BA46095FB203B1';

// Routes

// Learner login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM "learner_details" WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Learner registration
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO "learner_details" (name, email, password) VALUES ($1, $2, $3)',
      [name, email, hashedPassword]
    );

    res.json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Learner enrolls in a course
app.post('/enroll', async (req, res) => {
  const { userId, courseId } = req.body;

  try {
    await pool.query('INSERT INTO Enrollment (User_ID, Course_ID) VALUES ($1, $2)', [
      userId,
      courseId,
    ]);

    res.json({ message: 'Enrollment successful' });
  } catch (error) {
    console.error('Error during enrollment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all courses
app.get('/courses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Course');
    const courses = result.rows;

    res.json(courses);
  } catch (error) {
    console.error('Error retrieving courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all learners
app.get('/learners', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM learner_details');
      const learners = result.rows;
  
      res.json(learners);
    } catch (error) {
      console.error('Error retrieving users:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Admin login
app.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM "Admin" WHERE email = $1',
      [email]
    );

    const admin = result.rows[0];

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: admin.id, isAdmin: true }, jwtSecret, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin adds a new course
app.post('/admin/courses', async (req, res) => {
  const { title, description } = req.body;

  try {
    await pool.query('INSERT INTO Course (Title, Description) VALUES ($1, $2)', [
      title,
      description,
    ]);

    res.json({ message: 'Course added successfully' });
  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/', async (req, res) => {
    res.json({ message: `Server running successfully on port ${port}` });
  });

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});