const express = require('express');
const app = express();
const cors = require('cors');

// Middleware to parse JSON
app.use(express.json());

// Middleware to allow cross-origin requests
app.use(cors());

// Handle form submission
app.post('/signup', (req, res) => {
    const { name, email, password, dob } = req.body;

    console.log("Received data:", req.body);

    // Saving to DB Simulation
    res.status(201).json({ message: "Signup successful!", user: { name, email }});
})



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});