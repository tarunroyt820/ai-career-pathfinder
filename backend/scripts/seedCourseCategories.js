const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const CourseCategory = require('../models/CourseCategory');

const categories = [
    'Full Stack Development',
    'Frontend Development',
    'Backend Development',
    'Artificial Intelligence',
    'Machine Learning',
    'Prompt Engineering',
    'Cybersecurity',
    'Cloud Computing',
    'DevOps',
    'UI/UX Design',
    'Data Science',
    'Mobile Development',
    'Programming Languages'
];

const slugify = (value = '') =>
    String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

const run = async () => {
    await connectDB();

    for (let index = 0; index < categories.length; index += 1) {
        const name = categories[index];
        await CourseCategory.updateOne(
            { slug: slugify(name) },
            {
                $set: {
                    name,
                    slug: slugify(name),
                    description: `${name} resources curated for Nextaro learners.`,
                    sortOrder: index + 1,
                    isActive: true
                }
            },
            { upsert: true }
        );
    }

    console.log(`Seeded ${categories.length} course categories.`);
    process.exit(0);
};

run().catch((error) => {
    console.error('seedCourseCategories failed:', error);
    process.exit(1);
});
