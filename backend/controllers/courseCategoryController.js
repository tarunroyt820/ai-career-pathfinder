const CourseCategory = require('../models/CourseCategory');

const slugify = (value = '') =>
    String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

exports.listCategories = async (_req, res) => {
    try {
        const categories = await CourseCategory.find({ isActive: true })
            .sort({ sortOrder: 1, name: 1 })
            .lean();

        return res.json({ success: true, data: categories });
    } catch (error) {
        console.error('listCategories failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const description = String(req.body.description || '').trim();
        const icon = String(req.body.icon || '').trim();
        const slug = slugify(req.body.slug || name);

        if (!name) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        const existing = await CourseCategory.findOne({ $or: [{ name }, { slug }] }).lean();
        if (existing) {
            return res.status(409).json({ success: false, message: 'Category name or slug already exists' });
        }

        const category = await CourseCategory.create({
            name,
            slug,
            description,
            icon,
            sortOrder: Number(req.body.sortOrder || 0),
            isActive: req.body.isActive !== false
        });

        return res.status(201).json({ success: true, data: category });
    } catch (error) {
        console.error('createCategory failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to create category' });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const category = await CourseCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const nextName = req.body.name ? String(req.body.name).trim() : category.name;
        const nextSlug = req.body.slug ? slugify(req.body.slug) : slugify(nextName);

        const conflict = await CourseCategory.findOne({
            _id: { $ne: category._id },
            $or: [{ name: nextName }, { slug: nextSlug }]
        }).lean();

        if (conflict) {
            return res.status(409).json({ success: false, message: 'Category name or slug already exists' });
        }

        category.name = nextName;
        category.slug = nextSlug;
        category.description = req.body.description !== undefined ? String(req.body.description || '').trim() : category.description;
        category.icon = req.body.icon !== undefined ? String(req.body.icon || '').trim() : category.icon;
        category.sortOrder = req.body.sortOrder !== undefined ? Number(req.body.sortOrder || 0) : category.sortOrder;
        if (req.body.isActive !== undefined) {
            category.isActive = Boolean(req.body.isActive);
        }

        await category.save();

        return res.json({ success: true, data: category });
    } catch (error) {
        console.error('updateCategory failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to update category' });
    }
};
