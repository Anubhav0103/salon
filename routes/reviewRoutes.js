const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Serve review form
router.get('/:bookingId/:token', (req, res) => {
    const { bookingId, token } = req.params;
    // Check if token is valid and not used
    db.query('SELECT * FROM reviews WHERE booking_id = ? AND review_token = ? AND token_used = 0', [bookingId, token], (err, rows) => {
        if (err || !rows || rows.length === 0) return res.status(404).send('Invalid or expired review link.');
        // Render a beautiful HTML form matching salon theme
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Review Your Service</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        background: linear-gradient(135deg, #18122B 0%, #393053 100%);
                        color: #fff;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }
                    .container {
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                        border-radius: 20px;
                        padding: 40px;
                        max-width: 500px;
                        width: 100%;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    }
                    h1 {
                        text-align: center;
                        margin-bottom: 30px;
                        color: #E5BEEC;
                        font-size: 2.5em;
                        font-weight: 300;
                    }
                    .form-group {
                        margin-bottom: 25px;
                    }
                    label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 500;
                        color: #E5BEEC;
                    }
                    input[type="number"], textarea {
                        width: 100%;
                        padding: 12px;
                        border: 2px solid rgba(255, 255, 255, 0.2);
                        border-radius: 10px;
                        background: rgba(255, 255, 255, 0.1);
                        color: #fff;
                        font-size: 16px;
                        transition: all 0.3s ease;
                    }
                    input[type="number"]:focus, textarea:focus {
                        outline: none;
                        border-color: #E5BEEC;
                        box-shadow: 0 0 15px rgba(229, 190, 236, 0.3);
                    }
                    textarea {
                        resize: vertical;
                        min-height: 100px;
                    }
                    .rating-input {
                        display: flex;
                        gap: 10px;
                        align-items: center;
                    }
                    .rating-input input {
                        width: 80px;
                    }
                    .stars {
                        display: flex;
                        gap: 5px;
                    }
                    .star {
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                        transition: color 0.2s ease;
                    }
                    .star.active {
                        color: #FFD700;
                    }
                    button {
                        width: 100%;
                        padding: 15px;
                        background: linear-gradient(45deg, #E5BEEC, #A367DC);
                        border: none;
                        border-radius: 10px;
                        color: #18122B;
                        font-size: 18px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        margin-top: 20px;
                    }
                    button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(229, 190, 236, 0.4);
                    }
                    .thank-you {
                        text-align: center;
                        padding: 40px;
                    }
                    .thank-you h2 {
                        color: #E5BEEC;
                        margin-bottom: 15px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>✨ How was your service?</h1>
                    <form method='POST' action='' id="reviewForm">
                        <div class="form-group">
                            <label>Your Rating:</label>
                            <div class="rating-input">
                                <input type='number' name='rating' min='1' max='5' required id="ratingInput">
                                <div class="stars" id="stars">
                                    <span class="star" data-rating="1">★</span>
                                    <span class="star" data-rating="2">★</span>
                                    <span class="star" data-rating="3">★</span>
                                    <span class="star" data-rating="4">★</span>
                                    <span class="star" data-rating="5">★</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Share your experience (optional):</label>
                            <textarea name='review_text' placeholder="Tell us about your experience..."></textarea>
                        </div>
                        <button type='submit'>Submit Review</button>
                    </form>
                </div>
                
                <script>
                    // Star rating functionality
                    const stars = document.querySelectorAll('.star');
                    const ratingInput = document.getElementById('ratingInput');
                    
                    stars.forEach(star => {
                        star.addEventListener('click', () => {
                            const rating = star.dataset.rating;
                            ratingInput.value = rating;
                            updateStars(rating);
                        });
                    });
                    
                    function updateStars(rating) {
                        stars.forEach((star, index) => {
                            if (index < rating) {
                                star.classList.add('active');
                            } else {
                                star.classList.remove('active');
                            }
                        });
                    }
                    
                    // Initialize with 5 stars
                    updateStars(5);
                    ratingInput.value = 5;
                </script>
            </body>
            </html>
        `);
    });
});

// Handle review submission
router.post('/:bookingId/:token', (req, res) => {
    const { bookingId, token } = req.params;
    const { rating, review_text } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).send('Invalid rating.');
    
    // Check token again
    db.query('SELECT * FROM reviews WHERE booking_id = ? AND review_token = ? AND token_used = 0', [bookingId, token], (err, rows) => {
        if (err || !rows || rows.length === 0) return res.status(404).send('Invalid or expired review link.');
        
        // Update review with rating and mark token as used
        db.query('UPDATE reviews SET rating = ?, review_text = ?, token_used = 1 WHERE booking_id = ? AND review_token = ?', [rating, review_text, bookingId, token], (err2) => {
            if (err2) {
                console.error('Error updating review:', err2);
                return res.status(500).send('Error saving review.');
            }
            
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Thank You!</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            background: linear-gradient(135deg, #18122B 0%, #393053 100%);
                            color: #fff;
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            min-height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 20px;
                        }
                        .container {
                            background: rgba(255, 255, 255, 0.1);
                            backdrop-filter: blur(10px);
                            border-radius: 20px;
                            padding: 40px;
                            max-width: 500px;
                            width: 100%;
                            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            text-align: center;
                        }
                        h1 {
                            color: #E5BEEC;
                            margin-bottom: 20px;
                            font-size: 2.5em;
                            font-weight: 300;
                        }
                        p {
                            color: #fff;
                            font-size: 18px;
                            line-height: 1.6;
                            margin-bottom: 30px;
                        }
                        .icon {
                            font-size: 4em;
                            margin-bottom: 20px;
                            color: #FFD700;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="icon">✨</div>
                        <h1>Thank You!</h1>
                        <p>Your review has been submitted successfully. We appreciate your feedback and look forward to serving you again!</p>
                    </div>
                </body>
                </html>
            `);
        });
    });
});

module.exports = router; 