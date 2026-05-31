const CourseCategory = require('../models/CourseCategory');
const {
    Course,
    SUPPORTED_PLATFORMS,
    SUPPORTED_DIFFICULTIES,
    SUPPORTED_STATUSES
} = require('../models/Course');

const slugify = (value = '') =>
    String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

const isValidHttpUrl = (value) => {
    try {
        const parsed = new URL(String(value));
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_error) {
        return false;
    }
};

const normalizeTags = (tags) => {
    if (!Array.isArray(tags)) return [];
    return [...new Set(tags.map((tag) => String(tag || '').trim()).filter(Boolean))];
};

const mapCoursePayload = async (body, currentUserId, existingCourse = null) => {
    const title = String(body.title || existingCourse?.title || '').trim();
    const shortDescription = String(body.shortDescription || existingCourse?.shortDescription || '').trim();
    const fullDescription = String(body.fullDescription || existingCourse?.fullDescription || '').trim();
    const instructor = String(body.instructor || existingCourse?.instructor || '').trim();
    const durationLabel = String(body.durationLabel || existingCourse?.durationLabel || '').trim();
    const language = String(body.language || existingCourse?.language || 'English').trim();
    const courseUrl = String(body.courseUrl || existingCourse?.courseUrl || '').trim();
    const thumbnailUrl = String(body.thumbnailUrl || existingCourse?.thumbnailUrl || '').trim();
    const platform = String(body.platform || existingCourse?.platform || '').trim();
    const difficulty = String(body.difficulty || existingCourse?.difficulty || '').trim();
    const status = String(body.status || existingCourse?.status || 'draft').trim();
    const sourceType = String(body.sourceType || existingCourse?.sourceType || 'external-course').trim();
    const categoryId = String(body.categoryId || existingCourse?.categoryId || '').trim();
    const tags = normalizeTags(body.tags !== undefined ? body.tags : existingCourse?.tags);
    const featured = body.featured !== undefined ? Boolean(body.featured) : Boolean(existingCourse?.featured);
    const isFree = body.isFree !== undefined ? Boolean(body.isFree) : existingCourse?.isFree !== false;
    const slug = slugify(body.slug || title || existingCourse?.slug || '');

    if (!title || !shortDescription || !fullDescription || !instructor || !durationLabel || !categoryId) {
        return { error: 'Title, descriptions, instructor, duration, and category are required.' };
    }

    if (!SUPPORTED_PLATFORMS.includes(platform)) {
        return { error: 'Unsupported platform.' };
    }

    if (!SUPPORTED_DIFFICULTIES.includes(difficulty)) {
        return { error: 'Unsupported difficulty.' };
    }

    if (!SUPPORTED_STATUSES.includes(status)) {
        return { error: 'Unsupported status.' };
    }

    if (!isValidHttpUrl(courseUrl)) {
        return { error: 'A valid course URL is required.' };
    }

    if (thumbnailUrl && !isValidHttpUrl(thumbnailUrl)) {
        return { error: 'Thumbnail URL must be a valid HTTP or HTTPS URL.' };
    }

    const category = await CourseCategory.findById(categoryId).lean();
    if (!category) {
        return { error: 'Selected category does not exist.' };
    }

    return {
        payload: {
            title,
            slug,
            shortDescription,
            fullDescription,
            categoryId: category._id,
            categoryName: category.name,
            platform,
            courseUrl,
            thumbnailUrl,
            instructor,
            durationLabel,
            difficulty,
            language,
            isFree,
            tags,
            sourceType,
            status,
            featured,
            updatedBy: currentUserId || null,
            ...(existingCourse ? {} : { createdBy: currentUserId || null })
        }
    };
};

const buildCourseFilter = (query, includeDrafts = false) => {
    const filter = {};

    if (!includeDrafts) {
        filter.status = 'published';
    } else if (query.status && SUPPORTED_STATUSES.includes(String(query.status))) {
        filter.status = String(query.status);
    }

    if (query.category) {
        filter.$or = [
            { categoryName: { $regex: String(query.category), $options: 'i' } },
            { categoryId: query.category }
        ];
    }

    if (query.platform && SUPPORTED_PLATFORMS.includes(String(query.platform))) {
        filter.platform = String(query.platform);
    }

    if (query.difficulty && SUPPORTED_DIFFICULTIES.includes(String(query.difficulty))) {
        filter.difficulty = String(query.difficulty);
    }

    if (query.featured === 'true') {
        filter.featured = true;
    }

    if (query.search) {
        filter.$text = { $search: String(query.search).trim() };
    }

    return filter;
};

exports.listCourses = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit || 12), 1), 50);
        const skip = (page - 1) * limit;
        const filter = buildCourseFilter(req.query, false);
        const sortBy = String(req.query.sortBy || 'newest');

        const sort = sortBy === 'title'
            ? { title: 1 }
            : sortBy === 'popular'
                ? { redirectCount: -1, viewCount: -1, createdAt: -1 }
                : sortBy === 'featured'
                    ? { featured: -1, createdAt: -1 }
                    : { createdAt: -1 };

        const [items, total] = await Promise.all([
            Course.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Course.countDocuments(filter)
        ]);

        return res.json({
            success: true,
            data: {
                items,
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('listCourses failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch courses' });
    }
};

exports.listFeaturedCourses = async (_req, res) => {
    try {
        const items = await Course.find({ status: 'published', featured: true })
            .sort({ createdAt: -1 })
            .limit(6)
            .lean();

        return res.json({ success: true, data: items });
    } catch (error) {
        console.error('listFeaturedCourses failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch featured courses' });
    }
};

exports.getAdminCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).lean();
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        return res.json({ success: true, data: course });
    } catch (error) {
        console.error('getAdminCourseById failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch course' });
    }
};

exports.getCourseBySlug = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug, status: 'published' }).lean();
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const relatedCourses = await Course.find({
            _id: { $ne: course._id },
            status: 'published',
            categoryId: course.categoryId
        })
            .sort({ featured: -1, createdAt: -1 })
            .limit(4)
            .lean();

        return res.json({ success: true, data: { course, relatedCourses } });
    } catch (error) {
        console.error('getCourseBySlug failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch course details' });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const mapped = await mapCoursePayload(req.body, req.user?._id);
        if (mapped.error) {
            return res.status(400).json({ success: false, message: mapped.error });
        }

        const existing = await Course.findOne({ slug: mapped.payload.slug }).lean();
        if (existing) {
            return res.status(409).json({ success: false, message: 'Course slug already exists' });
        }

        const course = await Course.create(mapped.payload);
        return res.status(201).json({ success: true, data: course });
    } catch (error) {
        console.error('createCourse failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to create course' });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const mapped = await mapCoursePayload(req.body, req.user?._id, course);
        if (mapped.error) {
            return res.status(400).json({ success: false, message: mapped.error });
        }

        const conflict = await Course.findOne({
            _id: { $ne: course._id },
            slug: mapped.payload.slug
        }).lean();

        if (conflict) {
            return res.status(409).json({ success: false, message: 'Course slug already exists' });
        }

        Object.assign(course, mapped.payload);
        await course.save();

        return res.json({ success: true, data: course });
    } catch (error) {
        console.error('updateCourse failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to update course' });
    }
};

exports.listAdminCourses = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
        const skip = (page - 1) * limit;
        const filter = buildCourseFilter(req.query, true);
        const [items, total] = await Promise.all([
            Course.find(filter)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Course.countDocuments(filter)
        ]);

        return res.json({
            success: true,
            data: {
                items,
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('listAdminCourses failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch admin courses' });
    }
};

exports.trackCourseView = async (req, res) => {
    try {
        await Course.findOneAndUpdate(
            { _id: req.params.id, status: 'published' },
            { $inc: { viewCount: 1 } },
            { new: false }
        );

        return res.json({ success: true });
    } catch (error) {
        console.error('trackCourseView failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to track course view' });
    }
};

exports.trackCourseRedirect = async (req, res) => {
    try {
        await Course.findOneAndUpdate(
            { _id: req.params.id, status: 'published' },
            { $inc: { redirectCount: 1 } },
            { new: false }
        );

        return res.json({ success: true });
    } catch (error) {
        console.error('trackCourseRedirect failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to track course redirect' });
    }
};
