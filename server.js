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

    res.json({ token, userId: user.id });
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

// Instructor login
app.post('/instructor/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const result = await pool.query(
        'SELECT * FROM "instructor_details" WHERE email = $1',
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

// Instructor registration
app.post('/instructor/signup', async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
  
      await pool.query(
        'INSERT INTO "instructor_details" (name, email, password) VALUES ($1, $2, $3)',
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
  const { learner_id, course_id } = req.body;

  const enrollment_date = new Date();

  try {
    await pool.query('INSERT INTO course_enrollment (learner_id, course_id, enrollment_date) VALUES ($1, $2, $3)', [
        learner_id, course_id, enrollment_date
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
    const result = await pool.query('SELECT * FROM courses');
    const courses = result.rows;

    res.json(courses);
  } catch (error) {
    console.error('Error retrieving courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all course content for a particular course
app.get('/courses/content/:course_id', async (req, res) => {
    try {
    const course_id = req.params.course_id;
    const result = await pool.query('SELECT * FROM course_content WHERE course_id = $1', [course_id]);
    const course_content = result.rows;
    
      res.json(course_content);
    } catch (error) {
      console.error('Error retrieving course content:', error);
      res.status(500).json({ message: 'Server error' });
    }
    });

// Get all course videos for a particular course
app.get('/courses/content/videos/:course_id', async (req, res) => {
    try {
    const course_id = req.params.course_id;
    const result = await pool.query('SELECT * FROM course_content WHERE course_id = $1 AND content_type = Video', [course_id]);
    const course_content = result.rows;
    
      res.json(course_content);
    } catch (error) {
      console.error('Error retrieving course content:', error);
      res.status(500).json({ message: 'Server error' });
    }
    });

// Get all course enrollments
app.get('/courses/enrollments', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM course_enrollment');
      const courses = result.rows;
  
      res.json(courses);
    } catch (error) {
      console.error('Error retrieving courses:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Get all enrolled courses for a particular user
app.get('/courses/enrollments/:learner_id', async (req, res) => {
    try {
    const learner_id = req.params.learner_id;
    const result = await pool.query('SELECT * FROM course_enrollment WHERE learner_id = $1', [learner_id]);
    const courses = result.rows;
    
      res.json(courses);
    } catch (error) {
      console.error('Error retrieving courses:', error);
      res.status(500).json({ message: 'Server error' });
    }
    });

// Get all learners (users)
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

// Get all instructors (users)
app.get('/instructors', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM instructor_details');
      const instructors = result.rows;
  
      res.json(instructors);
    } catch (error) {
      console.error('Error retrieving users:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Get all admins (users)
app.get('/admins', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM administrator_details');
      const administrators = result.rows;
  
      res.json(administrators);
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
  const { title, description, objectives, level, duration, instructor_id, prerequisites, certification, language, tag } = req.body;

  try {
    await pool.query('INSERT INTO courses (title, description, objectives, level, duration, instructor_id, prerequisites, certification, language, tag) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [
      title, description, objectives, level, duration, instructor_id, prerequisites, certification, language, tag
    ]);

    res.json({ message: 'Course added successfully' });
  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin adds a new course content
app.post('/admin/courses/content', async (req, res) => {
    const { course_id, content_type, content_url } = req.body;
  
    try {
      await pool.query('INSERT INTO courses (course_id, content_type, content_url) VALUES ($1, $2, $3)', [
        course_id, content_type, content_url
      ]);
  
      res.json({ message: 'Course content added successfully' });
    } catch (error) {
      console.error('Error adding course:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Admin adds a new course content - video
app.post('/admin/courses/content/video', async (req, res) => {
    const { course_id, content_url } = req.body;
  
    const content_type = 'Video';
    try {
      await pool.query('INSERT INTO course_content (course_id, content_type, content_url) VALUES ($1, $2, $3)', [
        course_id, content_type, content_url
      ]);
  
      res.json({ message: 'Course content added successfully' });
    } catch (error) {
      console.error('Error adding course:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Admin adds a new course video
app.post('/admin/courses/video', async (req, res) => {
    const { course_id, video_title, video_url } = req.body;
  
    try {
      await pool.query('INSERT INTO course_video (course_id, video_title, video_url) VALUES ($1, $2, $3)', [
        course_id, video_title, video_url
      ]);
  
      res.json({ message: 'Course video added successfully' });
    } catch (error) {
      console.error('Error adding course video:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Get all course videos
app.get('/admin/courses/video', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM course_video');
      const course_videos = result.rows;
  
      res.json(course_videos);
    } catch (error) {
      console.error('Error retrieving course videos:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
// Get all course videos for a particular course
app.get('/admin/courses/video/:course_id', async (req, res) => {
      try {
      const course_id = req.params.course_id;
      const result = await pool.query('SELECT * FROM course_video WHERE course_id = $1', [course_id]);
      const course_videos = result.rows;
      
        res.json(course_videos);
      } catch (error) {
        console.error('Error retrieving course videos:', error);
        res.status(500).json({ message: 'Server error' });
      }
      });

// // insert course video progress
// app.post('/course-progress', async (req, res) => {
//     const { learner_id, course_id, video_id, progress } = req.body;

//     try {
//         const query = `INSERT INTO video_progress (learner_id, course_id, video_id, progress) VALUES ($1, $2, $3, $4) RETURNING id`;
//         const result = await pool.query(query, values);
//         const insertedId = result.rows[0].id;

//         res.json({ id: insertedId });
//     } catch (error) {
//         console.error('Error updating course progress: ', error);
//         res.status(500).json({message: 'Server error'});
//     }
// });

// // update course video progress
// app.put('/course-progress/:id', async (req, res) => {
//     const { id } = req.params;
//     const { progress } = req.body;

//     try {
//         const query = 'UPDATE video_progress SET progress = $1 WHERE id = $2';
//         const values = [progress, id];

//         await pool.query(query, values);

//         res.json({ message: 'Course progress updated succesfully'});
//     } catch (error) {
//         console.error('Error updating course progress: ', error );
//         res.status(500).json({ message: 'Server error' });
//     }
// })

// Create or update course progress
app.post('/course-progress', async (req, res) => {
    const { learnerId, courseId, videoId, progress } = req.body;
  
    try {
      const query = `
        INSERT INTO video_progress (learner_id, course_id, video_id, progress)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (learner_id, course_id, video_id) DO UPDATE
        SET progress = EXCLUDED.progress
        RETURNING id
      `;
      const values = [learnerId, courseId, videoId, progress];
  
      const result = await pool.query(query, values);
      const insertedId = result.rows[0].id;
  
      res.json({ id: insertedId });
    } catch (error) {
      console.error('Error creating/updating course progress:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// get all video progress
app.get('/video-progress', async (req, res) => {
    try {
      const query = 'SELECT * FROM video_progress;';
      const result = await pool.query(query);
  
      const videoProgress = result.rows;
      res.json(videoProgress);
    } catch (error) {
      console.error('Error retrieving video progress:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// get video progress for a particular learner, course
app.get('/video-progress/:learnerId/:courseId', async (req, res) => {
    const { learnerId, courseId } = req.params;
  
    try {
        const query = 'SELECT * FROM course_progress WHERE learner_id = $1 AND course_id = $2';
      const values = [learnerId, courseId, videoId];
      const result = await pool.query(query, values);
  
      const videoProgress = result.rows;
      res.json(videoProgress);
    } catch (error) {
      console.error('Error retrieving video progress:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// fetch all video_progress and calculate the progress of the course
app.get('/course-progress/:learnerId/:courseId', async (req, res) => {
    // const { learnerId, courseId } = req.params;
    const learnerId = parseInt(req.params.learnerId);
    const courseId = parseInt(req.params.courseId);

    try {
        const videoProgressQuery = 'SELECT * FROM video_progress WHERE learner_id = $1 AND course_id = $2;';
        const videoProgressValues = [learnerId, courseId];
        const videoProgressResult = await pool.query(videoProgressQuery, videoProgressValues);

        const videoProgress = videoProgressResult.rows;

        // calculate course progress percentage
        const totalVideosQuery = 'SELECT COUNT(*) AS total_videos FROM course_video WHERE course_id = $1;';
        const totalVideosValues = [courseId];
        const totalVideosResult = await pool.query(totalVideosQuery, totalVideosValues);

        const totalVideos = totalVideosResult.rows[0].total_videos;
        let totalProgress = 0;

        videoProgress.forEach((progress) => {
            totalProgress += progress.progress;
          });
        
        const courseProgress = totalVideos > 0 ? (totalProgress / (totalVideos * 100)) * 100 : 0;

          res.json({ courseProgress });
    } catch (error) {
        console.error('Error retrieving learner course progress:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// get video progress for a particular learner, course and video
app.get('/video-progress/:learnerId/:courseId/:videoId', async (req, res) => {
    const { learnerId, courseId, videoId } = req.params;
  
    try {
      const query = 'SELECT * FROM video_progress WHERE learner_id = $1 AND course_id = $2 AND video_id = $3;';
      const values = [learnerId, courseId, videoId];
      const result = await pool.query(query, values);
  
      const videoProgress = result.rows;
      res.json(videoProgress);
    } catch (error) {
      console.error('Error retrieving video progress:', error);
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