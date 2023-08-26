const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 5000;

const supabaseUrl = 'https://kfpwuckkyjmvijyvrvcc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcHd1Y2treWptdmlqeXZydmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTI1NzQwOTYsImV4cCI6MjAwODE1MDA5Nn0.Ub4Kv-i7YwhdZfcfbrP7lYy68EiIiKJ3hIrUp5rpRG0'; // Replace with your Supabase key
const supabase = createClient(supabaseUrl, supabaseKey, {
    persistSession: false, // Disable session persistence
  });
  

app.use(cors());
app.use(express.json());

const jwtSecret = 'C0BAF97A89FB5FB68AAAA57FAFEAA95FAF9E8A4F8135BC6F38BA46095FB203B1';

// learner login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase
      .from('learner_details')
      .select('*')
      .eq('email', email);

    if (error) {
      return res.status(500).json({ message: 'Server error' });
    }

    const user = data[0];

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

// learner signup
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase
      .from('learner_details')
      .insert([{ name, email, password: hashedPassword }]);

    if (error) {
      return res.status(500).json({ message: 'Server error' });
    }

    res.json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// get learner details by id
app.get('/learners/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: learner, error } = await supabase
      .from('learner_details')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    if (learner) {
      res.json(learner);
    } else {
      res.status(404).json({ message: 'Learner not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Instructor login
app.post('/instructor/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const { data, error } = await supabase
        .from('instructor_details')
        .select('*')
        .eq('email', email);
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      const user = data[0];
  
      if (!user) {
        return res.status(404).json({ message: 'Instructor not found' });
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
  
      const { error } = await supabase
        .from('instructor_details')
        .insert([{ name, email, password: hashedPassword }]);
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json({ message: 'Registration successful' });
    } catch (error) {
      console.error('Error during signup:', error);
      res.status(500).json({ message: 'Server error' });
    }
});

// Admin registration
app.post('/admin/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase
      .from('administrator_details')
      .insert([{ name, email, password: hashedPassword }]);

    if (error) {
      return res.status(500).json({ message: 'Server error' });
    }

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
    const { error } = await supabase
      .from('course_enrollment')
      .insert([{ learner_id, course_id, enrollment_date }]);

    if (error) {
      return res.status(500).json({ message: 'Server error' });
    }

    res.json({ message: 'Enrollment successful' });
  } catch (error) {
    console.error('Error during enrollment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all courses
app.get('/courses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*');

    if (error) {
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error retrieving courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all course content for a particular course
app.get('/courses/content/:course_id', async (req, res) => {
    try {
      const course_id = req.params.course_id;
      const { data, error } = await supabase
        .from('course_content')
        .select('*')
        .eq('course_id', course_id);
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json(data);
    } catch (error) {
      console.error('Error retrieving course content:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get all course videos for a particular course
  app.get('/courses/content/videos/:course_id', async (req, res) => {
    try {
      const course_id = req.params.course_id;
      const { data, error } = await supabase
        .from('course_content')
        .select('*')
        .eq('course_id', course_id)
        .eq('content_type', 'Video');
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json(data);
    } catch (error) {
      console.error('Error retrieving course content:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get all course enrollments
  app.get('/courses/enrollments', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('course_enrollment')
        .select('*');
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json(data);
    } catch (error) {
      console.error('Error retrieving course enrollments:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get all enrolled courses for a particular user
  app.get('/courses/enrollments/:learner_id', async (req, res) => {
    try {
      const learner_id = req.params.learner_id;
      const { data, error } = await supabase
        .from('course_enrollment')
        .select('*')
        .eq('learner_id', learner_id);
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json(data);
    } catch (error) {
      console.error('Error retrieving enrolled courses:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Check whether a user is enrolled in a particular course
app.get('/enrolled-courses/check/:learnerId/:courseId', async (req, res) => {
  const learnerId = req.params.learnerId;
  const courseId = req.params.courseId;

  try {
    const { data, error } = await supabase
      .from('course_enrollment')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('course_id', courseId);

    if (error) {
      throw error;
    }

    const isEnrolled = data.length > 0;
    res.json({ enrolled: isEnrolled });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

  // Get all courses for a particular learner
  app.get('/enroll/courses/:learnerId', async (req, res) => {
    const { learnerId } = req.params;
  
    try {
      const { data, error } = await supabase
        .from('course_enrollment')
        .select('courses(id, title, description, objectives, level, duration, prerequisites, certification, language, tag, thumbnail_url)')
        .eq('learner_id', learnerId)
        .order('enrollment_date', { ascending: false })
        .innerJoin('courses', 'course_id', 'courses.id');
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json(data);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });  

// Check enrollment of a learner in a course
app.get('/enroll/status', async (req, res) => {
    const { learner_id, course_id } = req.query;
  
    try {
      const { data, error } = await supabase
        .from('course_enrollment')
        .select('*', { count: 'exact' })
        .eq('learner_id', learner_id)
        .eq('course_id', course_id);
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      const isEnrolled = data[0].count > 0;
  
      res.json({ isEnrolled });
    } catch (error) {
      console.error('Error checking enrollment status:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

app.get('/enroll/enrollment_status/:learner_id/:course_id', async (req, res) => {
  const { learnerId, courseId } = req.params;

  try {
    const { data, error } = await supabase
      .from('course_enrollment')
      .select('*', { count: 'exact' })
      .eq('learner_id', learnerId)
      .eq('course_id', courseId);

    if (error) {
      return res.status(500).json({ message: 'Server error' });
    }

    const isEnrolled = data[0].count > 0;

    res.json({ isEnrolled });
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
  
  // Get all learners (users)
  app.get('/learners', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('learner_details')
        .select('*');
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json(data);
    } catch (error) {
      console.error('Error retrieving learners:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get all instructors (users)
  app.get('/instructors', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('instructor_details')
        .select('*');
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json(data);
    } catch (error) {
      console.error('Error retrieving instructors:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get all admins (users)
  app.get('/admins', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('administrator_details')
        .select('*');
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json(data);
    } catch (error) {
      console.error('Error retrieving administrators:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Admin login
  app.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const { data, error } = await supabase
        .from('administrator_details')
        .select('*')
        .eq('email', email);
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      const admin = data[0];
  
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
    const { title, description, objectives, level, duration, instructor_id, prerequisites, certification, language, tag, thumbnail_url } = req.body;
  
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert([
          {
            title,
            description,
            objectives,
            level,
            duration,
            instructor_id,
            prerequisites,
            certification,
            language,
            tag,
            thumbnail_url,
          },
        ]);
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json({ message: 'Course added successfully' });
    } catch (error) {
      console.error('Error adding course:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Admin adds multiple courses at once to the database
  app.post('/admin/mcourses', async (req, res) => {
    const courses = req.body;
  
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert(courses);
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json({ message: 'Courses added successfully' });
    } catch (error) {
      console.error('Error adding courses:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Admin adds a new course content
  app.post('/admin/courses/content', async (req, res) => {
    const { course_id, content_type, content_url } = req.body;
  
    try {
      const { error } = await supabase
        .from('course_content')
        .insert([
          {
            course_id,
            content_type,
            content_url,
          },
        ]);
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json({ message: 'Course content added successfully' });
    } catch (error) {
      console.error('Error adding course content:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Admin adds a new course content - video
  app.post('/admin/courses/content/video', async (req, res) => {
    const { course_id, content_url } = req.body;
  
    const content_type = 'Video';
    try {
      const { error } = await supabase
        .from('course_content')
        .insert([
          {
            course_id,
            content_type,
            content_url,
          },
        ]);
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json({ message: 'Course content added successfully' });
    } catch (error) {
      console.error('Error adding course content:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Admin adds a new course video
  app.post('/admin/courses/video', async (req, res) => {
    const { course_id, video_title, video_url } = req.body;
  
    try {
      const { error } = await supabase
        .from('course_video')
        .insert([
          {
            course_id,
            video_title,
            video_url,
          },
        ]);
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json({ message: 'Course video added successfully' });
    } catch (error) {
      console.error('Error adding course video:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get all course videos
  app.get('/admin/courses/video', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('course_video')
        .select('*');
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json(data);
    } catch (error) {
      console.error('Error retrieving course videos:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get all course videos for a particular course
  app.get('/admin/courses/video/:course_id', async (req, res) => {
    try {
      const course_id = req.params.course_id;
      const { data, error } = await supabase
        .from('course_video')
        .select('*')
        .eq('course_id', course_id);
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json(data);
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

/// Create or update course progress
app.post('/course-progress', async (req, res) => {
    const { learnerId, courseId, videoId, progress } = req.body;
  
    try {
      const { data, error } = await supabase
        .from('video_progress')
        .upsert([
          {
            learner_id: learnerId,
            course_id: courseId,
            video_id: videoId,
            progress,
          },
        ]);
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json({ id: data[0].id });
    } catch (error) {
      console.error('Error creating/updating course progress:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // get all video progress
  app.get('/video-progress', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('video_progress')
        .select('*');
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json(data);
    } catch (error) {
      console.error('Error retrieving video progress:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // get video progress for a particular learner, course
  app.get('/video-progress/:learnerId/:courseId', async (req, res) => {
    const { learnerId, courseId } = req.params;
  
    try {
      const { data, error } = await supabase
        .from('video_progress')
        .select('*')
        .eq('learner_id', learnerId)
        .eq('course_id', courseId);
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json(data);
    } catch (error) {
      console.error('Error retrieving video progress:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // fetch all video_progress and calculate the progress of the course
  app.get('/course-progress/:learnerId/:courseId', async (req, res) => {
    const learnerId = parseInt(req.params.learnerId);
    const courseId = parseInt(req.params.courseId);
  
    try {
      const { data: videoProgress, error: videoProgressError } = await supabase
        .from('video_progress')
        .select('*')
        .eq('learner_id', learnerId)
        .eq('course_id', courseId);
  
      if (videoProgressError) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      // calculate course progress percentage
      const { data: totalVideosData, error: totalVideosError } = await supabase
        .from('course_video')
        .select('course_id')
        .eq('course_id', courseId);
  
      if (totalVideosError) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      const totalVideos = totalVideosData.length;
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
      const { data, error } = await supabase
        .from('video_progress')
        .select('*')
        .eq('learner_id', learnerId)
        .eq('course_id', courseId)
        .eq('video_id', videoId);
  
      if (error) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      res.json(data);
    } catch (error) {
      console.error('Error retrieving video progress:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });  

// get all quizzes [admin]
app.get('/quizzes', async (req, res) => {
  try {
    const { data, error } = await supabase.from('quiz').select();
    
    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error getting quizzes: ', error);
    res.status(500).json({ message: 'Failed to get quizzes' });
  }
});

// get quizzes per course [learner, instructor]
app.get('/quizzes/:courseId', async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const { data, error } = await supabase.from('quiz').select().eq('course_id', courseId);

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error getting quizzes per course: ', error);
    res.status(500).json({ error: 'Failed to get quizzes for this course'});
  }
});

// add quiz [admin]
app.post('/quizzes', async (req, res) => {
  try {
    const { course_id, title, description, total_marks} = req.body;

    const { data, error } = await supabase.from('quiz').insert([
      {
        course_id, title, description, total_marks
      }
    ]);

    if (error) {
      throw error;
    };

    res.status(201).json({ message: 'Quiz added successfully', data});
  } catch (error) {
    console.error('Error adding a quiz: ', error);
    res.status(500).json({ error: 'Failed to add quiz'});
  }
});

// Add question to a quiz
app.post('/quizzes/:quizId/questions', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { text, options, correctOption } = req.body;

    const { data: question, error } = await supabase
      .from('question')
      .insert([
        {
          quiz_id: quizId,
          text,
          options,
          correct_option: correctOption,
        },
      ])
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.json(question);
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Get all questions for a particular quiz
app.get('/quizzes/:quizId/questions', async (req, res) => {
  try {
    const { quizId } = req.params;

    const { data: questions, error } = await supabase
      .from('question')
      .select('*')
      .eq('quiz_id', quizId);

    if (error) {
      throw new Error(error.message);
    }

    res.json(questions);
  } catch (error) {
    console.error('Error getting questions:', error);
    res.status(500).json({ error: 'Failed to get questions' });
  }
});

// Get all questions and correct answers for a particular quiz
app.get('/quizzes/:quizId/questions-with-answers', async (req, res) => {
  try {
    const { quizId } = req.params;

    const { data: questions, error } = await supabase
      .from('question')
      .select('*, correct_answer')
      .eq('quiz_id', quizId);

    if (error) {
      throw new Error(error.message);
    }

    res.json(questions);
  } catch (error) {
    console.error('Error getting questions with answers:', error);
    res.status(500).json({ error: 'Failed to get questions with answers' });
  }
});

// get all badges
app.get('/badges', async (req, res) => {
  try {
    const { data: badges, error } = await supabase
      .from('badge')
      .select('*');
    
    if (error) {
      throw new Error(error.message);
    }

    res.json(badges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get badge for a particular quiz
app.get('/badges/:quizId', async (req, res) => {
  const { quizId } = req.params;

  try {
    const { data: badge, error } = await supabase
      .from('badge')
      .select('*')
      .eq('quiz_id', quizId)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }

    if (!badge) {
      return res.status(404).json({ error: 'Badge not found' });
    }

    res.json(badge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// insert a badge for a particular quiz
app.post('/badges', async (req, res) => {
  const { name, description, quizId, thumbnailUrl } = req.body;

  try {
    const { data, error } = await supabase
      .from('badge')
      .insert([
        { name, description, quiz_id: quizId, thumbnail_url: thumbnailUrl }
      ]);
    
    if (error) {
      throw new Error(error.message);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get badge by id
app.get('/mybadges/:badgeId', async (req, res) => {
  const badgeId = req.params.id;

  try {
    const { data, error } = await supabase
      .from('badge')
      .select('*')
      .eq('badge_id', badgeId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get all earned_badges for a particular learner
app.get('/earned_badges/:learnerId', async (req, res) => {
  const { learnerId } = req.params;

  try {
    const { data: earnedBadges, error } = await supabase
      .from('earned_badges')
      .select('*')
      .eq('learner_id', learnerId);
    
    if (error) {
      throw new Error(error.message);
    }

    res.json(earnedBadges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get the details of all earned badges for a learner
app.get('/my_earned_badges/:learnerId', async (req, res) => {
  const { learnerId } = req.params;

  try {
    // Fetch the badge_id and date from the earned_badges table for the specified learnerId
    const { data: earnedBadges, error } = await supabase
      .from('earned_badges')
      .select('badge_id, date')
      .eq('learner_id', learnerId);

    if (error) {
      throw new Error(error.message);
    }

    if (earnedBadges.length === 0) {
      return res.status(404).json({ error: 'No earned badges found for the learner' });
    }

    // Fetch the details of all the earned badges using the retrieved badge_ids
    const badgeIds = earnedBadges.map((earnedBadge) => earnedBadge.badge_id);
    const { data: badgeDetails, error: badgeError } = await supabase
      .from('badge')
      .select('badge_id, name, description, thumbnail_url')
      .in('badge_id', badgeIds);

    if (badgeError) {
      throw new Error(badgeError.message);
    }

    if (badgeDetails.length === 0) {
      return res.status(404).json({ error: 'No badge details found' });
    }

    // Combine the earned badge details with the respective badge details
    const earnedBadgesWithDetails = earnedBadges.map((earnedBadge) => {
      const badgeDetail = badgeDetails.find((badge) => badge.badge_id === earnedBadge.badge_id);
      return {
        badge_id: badgeDetail.badge_id,
        name: badgeDetail.name,
        description: badgeDetail.description,
        thumbnail_url: badgeDetail.thumbnail_url,
        date: earnedBadge.date,
      };
    });

    res.json(earnedBadgesWithDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// check whether a learner has already earned a badge
app.get('/earned_badges/status/:learnerId/:badgeId', async (req, res) => {
  const { learnerId, badgeId } = req.params;

  try {
    const { data: earnedBadge, error } = await supabase
      .from('earned_badges')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('badge_id', badgeId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (earnedBadge) {
      res.json({ earned: true });
    } else {
      res.json({ earned: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get all earned badges
app.get('/earned_badges', async (req, res) => {
  try {
    const { data: earnedBadges, error } = await supabase
      .from('earned_badges')
      .select('*');
    
    if (error) {
      throw new Error(error.message);
    }

    res.json(earnedBadges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// add an earned badge for a specific learner
app.post('/earned_badges', async (req, res) => {
  const { learnerId, badgeId } = req.body;

  try {
    const { data, error } = await supabase
      .from('earned_badges')
      .insert([
        { learner_id: learnerId, badge_id: badgeId }
      ]);
    
    if (error) {
      throw new Error(error.message);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add quiz attempt for a particular learner in a particular quiz
app.post('/quiz_attempt', async (req, res) => {
  const { learner_id, quiz_id, score, learner_name } = req.body;

  try {
    // Check if the learner has already taken the quiz
    const { data: existingAttempts, error } = await supabase
      .from('quiz_attempt')
      .select('attempt_id')
      .eq('learner_id', learner_id)
      .eq('quiz_id', quiz_id);

    if (error) {
      throw new Error(error.message);
    }

    if (existingAttempts.length > 0) {
      return res.status(400).json({ error: 'Learner has already taken the quiz' });
    }

    // Insert the quiz attempt
    const { data: newAttempt, error: insertError } = await supabase
      .from('quiz_attempt')
      .insert([{ learner_id, quiz_id, score, date: new Date().toISOString(), learner_name }]);

    if (insertError) {
      throw new Error(insertError.message);
    }

    res.json(newAttempt[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Checks if a learner has already taken a particular quiz
app.get('/quiz_attempt/check/:learnerId/:quizId', async (req, res) => {
  const { learnerId, quizId } = req.params;

  try {
    const { data: attempts, error } = await supabase
      .from('quiz_attempt')
      .select('attempt_id')
      .eq('learner_id', learnerId)
      .eq('quiz_id', quizId);

    if (error) {
      throw new Error(error.message);
    }

    res.json({ hasTakenQuiz: attempts.length > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all quiz attempts
app.get('/quiz_attempt', async (req, res) => {
  try {
    const { data: attempts, error } = await supabase.from('quiz_attempt').select('*');

    if (error) {
      throw new Error(error.message);
    }

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get quiz attempts for a particular learner
app.get('/quiz_attempt/learner/:learnerId', async (req, res) => {
  const { learnerId } = req.params;

  try {
    const { data: attempts, error } = await supabase
      .from('quiz_attempt')
      .select('*')
      .eq('learner_id', learnerId);

    if (error) {
      throw new Error(error.message);
    }

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get quiz attempts for a particular learner in a particular quiz
app.get('/quiz_attempt/learner/:learnerId/quiz/:quizId', async (req, res) => {
  const { learnerId, quizId } = req.params;

  try {
    const { data: attempts, error } = await supabase
      .from('quiz_attempt')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('quiz_id', quizId);

    if (error) {
      throw new Error(error.message);
    }

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/leaderboard', async (req, res) => {
  try {
    const { data: topScores, error } = await supabase
      .from('learner_scores')
      .select('*')
      .limit(19);

    if (error) {
      throw new Error(error.message);
    }

    res.json(topScores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if the learner has not reviewed the course already
app.get('/course_reviews/check', async (req, res) => {
  try {
    const { learner_id, course_id } = req.query;

    const { data: existingReviews, error } = await supabase
      .from('course_reviews')
      .select('*')
      .eq('learner_id', learner_id)
      .eq('course_id', course_id);

    if (error) {
      return res.status(500).json({ error: 'Failed to check course reviews.' });
    }

    if (existingReviews && existingReviews.length > 0) {
      return res.status(400).json({ error: 'The learner has already reviewed the course.' });
    }

    res.status(200).json({ message: 'The learner has not reviewed the course yet.' });
  } catch (error) {
    console.error('Error checking course reviews:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// Insert course_review from a particular learner for a particular course
app.post('/course_reviews', async (req, res) => {
  try {
    const { course_id, learner_id, review_text, rating, learner_name } = req.body;

    // Check if the learner has already reviewed the course
    const { data: existingReviews, error } = await supabase
      .from('course_reviews')
      .select('*')
      .eq('course_id', course_id)
      .eq('learner_id', learner_id);

    if (existingReviews && existingReviews.length > 0) {
      return res.status(400).json({ error: 'The learner has already reviewed the course.' });
    }

    // Insert the course_review
    const { data: newReview, error: insertError } = await supabase
      .from('course_reviews')
      .insert({ course_id, learner_id, review_text, rating })
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to insert the course review.' });
    }

    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error inserting course review:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// Get 5 recent reviews based on date for a particular course
app.get('/course_reviews/recent/:courseId', async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const { data: reviews, error } = await supabase
      .from('course_reviews')
      .select('*')
      .eq('course_id', courseId)
      .order('id', { ascending: false })
      .limit(5);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch recent course reviews.' });
    }

    res.json(reviews);
  } catch (error) {
    console.error('Error getting recent course reviews:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// Get reviews for a particular learner
app.get('/course_reviews/learner/:learnerId', async (req, res) => {
  try {
    const learnerId = req.params.learnerId;

    const { data: reviews, error } = await supabase
      .from('course_reviews')
      .select('*')
      .eq('learner_id', learnerId);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch learner course reviews.' });
    }

    res.json(reviews);
  } catch (error) {
    console.error('Error getting learner course reviews:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// get learner by id
app.get('/learner/:id', async (req, res) => {
  try {
    const learnerId = req.params.id;

    const { data, error } = await supabase
      .from('learner_details')
      .select('name')
      .eq('id', learnerId)
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch learner name.' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Learner not found.' });
    }

    res.json(data.name);
  } catch (error) {
    console.error('Error getting learner name:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// Route to get jobs from the "jobs" table
app.get('/jobs', async (req, res) => {
  try {
    const { data, error } = await supabase.from('jobs').select('*');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch jobs from the jobs table.' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching jobs from the jobs table:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// Route to get events from the "events" table
app.get('/events', async (req, res) => {
  try {
    const { data, error } = await supabase.from('events').select('*');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch events from the events table.' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching events from the events table:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

/* ============================================================================ */
/*                           R O U T E S  F O R  A D M I N                       */
/* ============================================================================ */
// add new administrator
app.post('/admin/create', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      organization_affiliation,
      role,
      phone,
      linkedin,
      physical_address,
      thumbnail_url
    } = req.body;

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('administrator_details')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          organization_affiliation,
          role,
          phone,
          linkedin,
          physical_address,thumbnail_url
        }
      ]);

    if (error) {
      return res.status(500).json({ error: 'Failed to create administrator.' });
    }

    res.json({ message: 'Administrator created successfully.' });
  } catch (error) {
    console.error('Error creating administrator:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// add a badge
app.post('/badge/create', async (req, res) => {
  try {
    const { name, description, quizId, thumbnailUrl } = req.body;

    const { data, error } = await supabase
      .from('badge')
      .insert([
        {
          name,
          description,
          quiz_id: quizId,
          thumbnail_url: thumbnailUrl
        }
      ]);

    if (error) {
      return res.status(500).json({ error: 'Failed to create badge.' });
    }

    res.json({ message: 'Badge created successfully.' });
  } catch (error) {
    console.error('Error creating badge:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// add course video
app.post('/course-video/create', async (req, res) => {
  try {
    const { course_id, video_title, video_url } = req.body;

    const { data, error } = await supabase
      .from('course_video')
      .insert([
        {
          course_id,
          video_title,
          video_url
        }
      ]);

    if (error) {
      return res.status(500).json({ error: 'Failed to create course video.' });
    }

    res.json({ message: 'Course video created successfully.' });
  } catch (error) {
    console.error('Error creating course video:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// add course
app.post('/courses/create', async (req, res) => {
  try {
    const {
      title,
      description,
      objectives,
      level,
      duration,
      instructorId,
      prerequisites,
      certification,
      language,
      tag,
      thumbnailUrl
    } = req.body;

    const { data, error } = await supabase
      .from('courses')
      .insert([
        {
          title,
          description,
          objectives,
          level,
          duration,
          instructor_id: instructorId,
          prerequisites,
          certification,
          language,
          tag,
          thumbnail_url: thumbnailUrl
        }
      ]);

    if (error) {
      return res.status(500).json({ error: 'Failed to create course.' });
    }

    res.json({ message: 'Course created successfully.' });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// add instructor
app.post('/instructor-details/create', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      organizationAffiliation,
      teachingExperience,
      educationalBackground,
      expertise,
      phone,
      address,
      linkedin,
      thumbnail_url
    } = req.body;

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('instructor_details')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          organization_affiliation: organizationAffiliation,
          teaching_experience: teachingExperience,
          educational_background: educationalBackground,
          expertise,
          phone,
          address,
          linkedin,
          thumbnail_url
        }
      ]);

    if (error) {
      return res.status(500).json({ error: 'Failed to create instructor details.' });
    }

    res.json({ message: 'Instructor details created successfully.' });
  } catch (error) {
    console.error('Error creating instructor details:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// add quiz
app.post('/quiz/create', async (req, res) => {
  try {
    const { course_id, title, description, total_marks } = req.body;

    const { data, error } = await supabase
      .from('quiz')
      .insert([
        {
          course_id,
          title,
          description,
          total_marks
        }
      ]);

    if (error) {
      return res.status(500).json({ error: 'Failed to create quiz.' });
    }

    res.json({ message: 'Quiz created successfully.' });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// add question
app.post('/question/create', async (req, res) => {
  try {
    const { quiz_id, text, correct_answer, options, correct_option } = req.body;

    const { data, error } = await supabase
      .from('question')
      .insert([
        {
          quiz_id,
          text,
          correct_answer,
          options,
          correct_option
        }
      ]);

    if (error) {
      return res.status(500).json({ error: 'Failed to create question.' });
    }

    res.json({ message: 'Question created successfully.' });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// count total for dashboard
app.get('/details-count', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('details_count_view')
      .select('*');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch data from the view.' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error fetching data from the view:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// get data from the view
app.get('/sorted-earned-badges', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sorted_earned_badges_view')
      .select('*');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch data from the view.' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching data from the view:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// data from the view
app.get('/sorted-course-enrollment', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sorted_course_enrollment_view')
      .select('*');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch data from the view.' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching data from the view:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// add new job
app.post('/jobs', async (req, res) => {
  try {
    const { organization, role, type, salary, location, description, link, contact, enddate } = req.body;

    const { data, error } = await supabase
      .from('jobs')
      .insert([
        {
          organization,
          role,
          type,
          salary,
          location,
          description,
          link,
          contact,
          enddate,
        },
      ]);

    if (error) {
      return res.status(500).json({ error: 'Failed to insert data into the jobs table.' });
    }

    res.status(201).json({ message: 'Data inserted successfully.' });
  } catch (error) {
    console.error('Error inserting data into the jobs table:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// insert data into the "events" table
app.post('/events', async (req, res) => {
  try {
    const { organization, title, date, time, location, description, link, contact } = req.body;

    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          organization,
          title,
          date,
          time,
          location,
          description,
          link,
          contact,
        },
      ]);

    if (error) {
      return res.status(500).json({ error: 'Failed to insert data into the events table.' });
    }

    res.status(201).json({ message: 'Data inserted successfully.' });
  } catch (error) {
    console.error('Error inserting data into the events table:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

app.get('/', async (req, res) => {
    res.json({ message: `Server running successfully on port ${port}` });
  });
  
app.get('/home', async (req, res) => {
    res.json({ message: `Server running successfully on port ${port}` });
  });
  
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });