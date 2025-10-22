import User from '../models/User.js';
import { hash as _hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function register(req, res) {
  const {name, email, password } = req.body;
    try {
        const hashedPassword = await _hash(password, 10);
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });
        console.log(newUser);
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Email already in use' });
    }
}


export async function login(req, res) {
  const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user || !(await compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
            
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
        console.log(token);
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

