const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware untuk parsing JSON
app.use(bodyParser.json());

// Menyajikan file statis dari folder "public"
app.use(express.static(path.join(__dirname, 'public')));

// Koneksi ke MongoDB (sesuaikan connection string Anda)
mongoose.connect('mongodb://localhost:27017/belajaraja', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// -----------------------
// Models dengan Mongoose
// -----------------------
const UserSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String,
});
const User = mongoose.model('User', UserSchema);

const CourseSchema = new mongoose.Schema({
    title: String,
    description: String,
    instructor: String,
    createdAt: { type: Date, default: Date.now },
});
const Course = mongoose.model('Course', CourseSchema);

const BlogSchema = new mongoose.Schema({
    title: String,
    content: String,
    imageUrl: String,
    createdAt: { type: Date, default: Date.now },
});
const Blog = mongoose.model('Blog', BlogSchema);

// -----------------------
// Routes Autentikasi
// -----------------------
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
        // Buat token JWT (gunakan secret yang disimpan di environment pada produksi)
        const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1d' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Middleware untuk melindungi endpoint
const authenticate = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'No token provided' });
    jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.userId = decoded.id;
        next();
    });
};

// -----------------------
// Endpoints Kursus
// -----------------------
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/courses', authenticate, async (req, res) => {
    try {
        const { title, description, instructor } = req.body;
        const course = new Course({ title, description, instructor });
        await course.save();
        res.status(201).json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// -----------------------
// Endpoints Artikel Blog
// -----------------------
app.get('/api/blog', async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/blog', authenticate, async (req, res) => {
    try {
        const { title, content, imageUrl } = req.body;
        const blog = new Blog({ title, content, imageUrl });
        await blog.save();
        res.status(201).json(blog);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// -----------------------
// Menyajikan Halaman Statis
// -----------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/kursus', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'kursus.html'));
});

app.get('/tentang', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tentang.html'));
});

app.get('/kontak', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'kontak.html'));
});

// -----------------------
// Menjalankan Server
// -----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
