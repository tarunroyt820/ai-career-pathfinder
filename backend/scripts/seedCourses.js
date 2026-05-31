const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const CourseCategory = require('../models/CourseCategory');
const { Course } = require('../models/Course');

const slugify = (value = '') =>
    String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

const seeds = [
    {
        title: 'Full Stack Web Development',
        category: 'Full Stack Development',
        platform: 'YouTube',
        instructor: 'CodeWithHarry',
        durationLabel: '35 Hours',
        difficulty: 'Beginner',
        courseUrl: 'https://www.youtube.com/',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=60',
        shortDescription: 'A beginner-friendly full stack path covering frontend and backend fundamentals.',
        fullDescription: 'Build a strong full stack foundation with curated lessons that introduce HTML, CSS, JavaScript, React, Node.js, Express, and MongoDB. This resource is meant to guide learners into a complete web development mindset before they specialize further.',
        tags: ['react', 'nodejs', 'mongodb'],
        featured: true
    },
    {
        title: 'Responsive Web Design',
        category: 'Frontend Development',
        platform: 'freeCodeCamp',
        instructor: 'freeCodeCamp',
        durationLabel: 'Self-paced',
        difficulty: 'Beginner',
        courseUrl: 'https://www.freecodecamp.org/',
        thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=60',
        shortDescription: 'Learn layout, accessibility, and responsive styling from trusted web basics.',
        fullDescription: 'This course helps learners understand HTML, CSS, forms, responsive layouts, and accessibility practices. It is a solid entry point for frontend development and a reliable base for later React learning.',
        tags: ['html', 'css', 'responsive-design'],
        featured: true
    },
    {
        title: 'Machine Learning Crash Course',
        category: 'Machine Learning',
        platform: 'YouTube',
        instructor: 'freeCodeCamp',
        durationLabel: '8 Hours',
        difficulty: 'Intermediate',
        courseUrl: 'https://www.youtube.com/',
        thumbnailUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&auto=format&fit=crop&q=60',
        shortDescription: 'A concise introduction to machine learning concepts, workflows, and tools.',
        fullDescription: 'Explore supervised learning, data preparation, evaluation basics, and practical machine learning workflows. This curated resource is designed to help learners move from AI interest into actual ML understanding.',
        tags: ['machine-learning', 'python', 'data'],
        featured: true
    }
];

const run = async () => {
    await connectDB();

    for (const seed of seeds) {
        const category = await CourseCategory.findOne({ name: seed.category }).lean();
        if (!category) {
            throw new Error(`Missing category for seed: ${seed.category}`);
        }

        await Course.updateOne(
            { slug: slugify(seed.title) },
            {
                $set: {
                    title: seed.title,
                    slug: slugify(seed.title),
                    shortDescription: seed.shortDescription,
                    fullDescription: seed.fullDescription,
                    categoryId: category._id,
                    categoryName: category.name,
                    platform: seed.platform,
                    courseUrl: seed.courseUrl,
                    thumbnailUrl: seed.thumbnailUrl,
                    instructor: seed.instructor,
                    durationLabel: seed.durationLabel,
                    difficulty: seed.difficulty,
                    language: 'English',
                    isFree: true,
                    tags: seed.tags,
                    sourceType: 'external-course',
                    status: 'published',
                    featured: seed.featured
                }
            },
            { upsert: true }
        );
    }

    console.log(`Seeded ${seeds.length} courses.`);
    process.exit(0);
};

run().catch((error) => {
    console.error('seedCourses failed:', error);
    process.exit(1);
});
